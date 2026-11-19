'use client';

import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { websocketConfig } from '@/lib/websocket';
import {
  fetchCallHistoryApi,
  fetchCallsPresenceApi,
  fetchIceServersApi,
  uploadCallRecordingApi,
  type CallTelemetryPayload,
  type TenantPresenceMember,
} from '@/lib/calls-api';
import { extractWebRtcTelemetry } from '@/lib/webrtc-stats';
import {
  useCallUiStore,
  type AgentPresenceStatus,
  type CallPeerInfo,
} from '@/store/call-ui.store';

function formatRoleLabel(role?: string) {
  if (role === 'manager') return 'Sales Manager';
  if (role === 'agent') return 'Sales Agent';
  if (role === 'owner') return 'Workspace Owner';
  if (role === 'admin') return 'Workspace Admin';
  return role || 'Agent';
}

export function useCallEngine() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const isInitiatorRef = useRef<boolean>(false);
  const remoteDescSetRef = useRef<boolean>(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceRestartInProgressRef = useRef<boolean>(false);
  const lastTelemetryRef = useRef<CallTelemetryPayload | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingCallIdRef = useRef<string | null>(null);
  const recordingStartedAtRef = useRef<number>(0);

  const refreshHistory = useCallback(async (filter?: string) => {
    const store = useCallUiStore.getState();
    store.setLoadingHistory(true);
    try {
      const res = await fetchCallHistoryApi({ filter, limit: 50 });
      store.setHistoryData(res.data, res.stats);
    } catch {
      // Non-fatal if server temporarily unreachable
    } finally {
      store.setLoadingHistory(false);
    }
  }, []);

  const cleanupPeerOnly = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (iceRestartTimerRef.current) {
      clearTimeout(iceRestartTimerRef.current);
      iceRestartTimerRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
      } catch {
        // Ignore close errors
      }
      pcRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // Ignore
        }
      });
      remoteStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.muted = false;
      } catch {
        // Ignore
      }
    }

    pendingIceRef.current = [];
    remoteDescSetRef.current = false;
    iceRestartInProgressRef.current = false;
    lastTelemetryRef.current = null;
  }, []);

  const cleanupMediaAndPeer = useCallback(() => {
    cleanupPeerOnly();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      localStreamRef.current = null;
    }

    activeCallIdRef.current = null;
    isInitiatorRef.current = false;
  }, [cleanupPeerOnly]);

  const acquireMicrophone = useCallback(async (): Promise<MediaStream> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error(
        'Microphone access requires HTTPS or localhost in a modern browser.',
      );
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Allow mic access in your browser to place or accept calls.'
          : 'No usable microphone detected on this device.';
      throw new Error(msg);
    }
  }, []);

  const startPeriodicStats = useCallback((callId: string) => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }
    const sampleOnce = async () => {
      const pc = pcRef.current;
      const socket = socketRef.current;
      if (!pc || !socket || activeCallIdRef.current !== callId) return;
      const snapshot = await extractWebRtcTelemetry(pc);
      if (!snapshot) return;
      lastTelemetryRef.current = snapshot;
      useCallUiStore.getState().updateActiveCall({
        icePath: snapshot.icePath,
        relayProtocol: snapshot.relayProtocol || '',
        rttMs: snapshot.rttMs || 0,
      });
      socket.emit('call:telemetry', { callId, sample: snapshot });
    };

    void sampleOnce();
    statsIntervalRef.current = setInterval(() => {
      void sampleOnce();
    }, 10000);
  }, []);

  const triggerIceRestart = useCallback(async (reason: string) => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    const callId = activeCallIdRef.current;
    if (!pc || !socket || !callId || iceRestartInProgressRef.current) return;

    iceRestartInProgressRef.current = true;
    useCallUiStore.getState().updateActiveCall({ isReconnecting: true });

    if (!isInitiatorRef.current) {
      socket.emit('call:ice_restart_request', { callId, reason });
      setTimeout(() => {
        iceRestartInProgressRef.current = false;
      }, 4000);
      return;
    }

    try {
      // Refresh short-lived STUN/TURN credentials in case network switched behind firewall/NAT
      try {
        const res = await fetchIceServersApi();
        if (res?.iceServers?.length && typeof pc.setConfiguration === 'function') {
          pc.setConfiguration({
            iceServers: res.iceServers,
            iceTransportPolicy: res.iceTransportPolicy || 'all',
          });
        }
      } catch {
        // Proceed with existing configuration if refresh temporarily fails
      }

      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', {
        callId,
        sdp: pc.localDescription,
      });
    } catch {
      // Allow subsequent retry if connection state stays disconnected
    } finally {
      setTimeout(() => {
        iceRestartInProgressRef.current = false;
      }, 3500);
    }
  }, []);

  const createConfiguredPeerConnection = useCallback(
    async (callId: string, stream: MediaStream): Promise<RTCPeerConnection> => {
      let iceConfig: RTCConfiguration = {
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
            ],
          },
        ],
        iceTransportPolicy: 'all',
      };
      try {
        const res = await fetchIceServersApi();
        if (res?.iceServers?.length) {
          iceConfig = {
            iceServers: res.iceServers,
            iceTransportPolicy: res.iceTransportPolicy || 'all',
          };
        }
      } catch {
        // Fallback cleanly to default STUN if fetch fails transiently
      }

      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;
      remoteDescSetRef.current = false;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
            void remoteAudioRef.current.play().catch(() => {});
          }
        } else if (event.track) {
          remoteStream.addTrack(event.track);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            void remoteAudioRef.current.play().catch(() => {});
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('call:ice', {
            callId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (activeCallIdRef.current !== callId) return;

        if (state === 'connected' || state === 'completed') {
          if (iceRestartTimerRef.current) {
            clearTimeout(iceRestartTimerRef.current);
            iceRestartTimerRef.current = null;
          }
          iceRestartInProgressRef.current = false;
          useCallUiStore.getState().updateActiveCall({ isReconnecting: false });
          socketRef.current?.emit('call:media_connected', { callId });
          startPeriodicStats(callId);
          return;
        }

        if (state === 'disconnected') {
          useCallUiStore.getState().updateActiveCall({ isReconnecting: true });
          if (!iceRestartTimerRef.current) {
            iceRestartTimerRef.current = setTimeout(() => {
              iceRestartTimerRef.current = null;
              if (
                pcRef.current === pc &&
                pc.iceConnectionState === 'disconnected' &&
                activeCallIdRef.current === callId
              ) {
                void triggerIceRestart('ice_disconnected');
              }
            }, 1500);
          }
          return;
        }

        if (state === 'failed') {
          void (async () => {
            const finalTelemetry =
              (await extractWebRtcTelemetry(pc)) || lastTelemetryRef.current;
            socketRef.current?.emit('call:end', {
              callId,
              failed: true,
              reason: 'WebRTC audio connection lost',
              finalTelemetry,
            });
          })();
        }
      };

      return pc;
    },
    [startPeriodicStats, triggerIceRestart],
  );

  const flushBufferedIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = [...pendingIceRef.current];
    pendingIceRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore stale ICE candidates
      }
    }
  }, []);

  // ─── Outgoing, Accept, Reject, End, Mute, Presence Actions ──────────────

  const initiateCall = useCallback(
    async (peer: CallPeerInfo) => {
      const store = useCallUiStore.getState();
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        store.setErrorBanner('Voice signaling server is disconnected. Reconnecting...');
        return;
      }
      if (store.callState !== 'idle' && store.callState !== 'ended') {
        return;
      }

      store.setErrorBanner(null);
      let stream: MediaStream;
      try {
        stream = await acquireMicrophone();
      } catch (err) {
        store.setErrorBanner(err instanceof Error ? err.message : 'Mic unavailable.');
        return;
      }

      await new Promise<void>((resolve) => {
        socket.emit(
          'call:initiate',
          {
            ...(peer.id ? { calleeId: peer.id } : {}),
            ...(peer.userCode ? { calleeUserCode: peer.userCode } : {}),
            ...(peer.linkedEntityType
              ? { linkedEntityType: peer.linkedEntityType }
              : {}),
            ...(peer.linkedEntityId
              ? { linkedEntityId: peer.linkedEntityId }
              : {}),
            ...(peer.linkedEntityLabel
              ? { linkedEntityLabel: peer.linkedEntityLabel }
              : {}),
          },
          (ack?: {
            ok?: boolean;
            error?: string;
            call?: { id: string; startedAt: string };
            callee?: {
              userId: string;
              name: string;
              role: string;
              userCode: string;
              territory?: string;
            };
          }) => {
            if (!ack?.ok || !ack.call) {
              cleanupMediaAndPeer();
              store.setErrorBanner(ack?.error || 'Could not start call.');
              resolve();
              return;
            }
            const resolvedPeer: CallPeerInfo = ack.callee
              ? {
                  id: ack.callee.userId,
                  name: ack.callee.name,
                  role: formatRoleLabel(ack.callee.role),
                  userCode: ack.callee.userCode,
                  territory: ack.callee.territory,
                  linkedEntityType: peer.linkedEntityType,
                  linkedEntityId: peer.linkedEntityId,
                  linkedEntityLabel: peer.linkedEntityLabel,
                }
              : peer;
            activeCallIdRef.current = ack.call.id;
            isInitiatorRef.current = true;
            store.setSessionState({
              callState: 'ringing_outgoing',
              ringSecondsLeft: 30,
              isMinimized: false,
              activeCall: {
                id: ack.call.id,
                peer: resolvedPeer,
                direction: 'outgoing',
                startedAt: ack.call.startedAt || new Date().toISOString(),
                durationSec: 0,
                isMuted: false,
                peerMuted: false,
                isSpeakerBoost: false,
                icePath: 'direct',
                rttMs: 0,
                linkedEntityType: peer.linkedEntityType,
                linkedEntityId: peer.linkedEntityId,
                linkedEntityLabel: peer.linkedEntityLabel,
              },
            });
            store.setDialerDrawerOpen(false);
            resolve();
          },
        );
      });

      // Keep localStream alive until accepted/ended (cleanup happens on reject/end/timeout)
      void stream;
    },
    [acquireMicrophone, cleanupMediaAndPeer],
  );

  const acceptIncomingCall = useCallback(async () => {
    const store = useCallUiStore.getState();
    const active = store.activeCall;
    const socket = socketRef.current;
    if (!active || store.callState !== 'ringing_incoming' || !socket) return;

    store.setErrorBanner(null);
    let stream: MediaStream;
    try {
      stream = await acquireMicrophone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied.';
      store.setErrorBanner(msg);
      socket.emit('call:reject', { callId: active.id });
      cleanupMediaAndPeer();
      store.setSessionState({ callState: 'idle', activeCall: null });
      return;
    }

    activeCallIdRef.current = active.id;
    isInitiatorRef.current = false;
    await createConfiguredPeerConnection(active.id, stream);
    store.setSessionState({ callState: 'connecting', isMinimized: false });

    socket.emit(
      'call:accept',
      { callId: active.id },
      (ack?: { ok?: boolean; error?: string }) => {
        if (!ack?.ok) {
          cleanupMediaAndPeer();
          store.setErrorBanner(ack?.error || 'Call could not be accepted.');
          store.setSessionState({ callState: 'idle', activeCall: null });
        }
      },
    );
  }, [acquireMicrophone, cleanupMediaAndPeer, createConfiguredPeerConnection]);

  const rejectIncomingCall = useCallback(() => {
    const store = useCallUiStore.getState();
    const active = store.activeCall;
    if (!active) return;
    socketRef.current?.emit('call:reject', { callId: active.id });
    cleanupMediaAndPeer();
    store.setSessionState({
      callState: 'ended',
      activeCall: { ...active, endReason: 'Call Declined' },
    });
    void refreshHistory();
    setTimeout(() => {
      const s = useCallUiStore.getState();
      if (s.callState === 'ended' && s.activeCall?.id === active.id) {
        s.setSessionState({ callState: 'idle', activeCall: null });
      }
    }, 1500);
  }, [cleanupMediaAndPeer, refreshHistory]);

  const stopAndUploadRecording = useCallback(
    async (callIdOverride?: string) => {
      const recorder = mediaRecorderRef.current;
      const ctx = audioCtxRef.current;
      const targetCallId =
        callIdOverride || recordingCallIdRef.current || activeCallIdRef.current;
      const recDurationSec = Math.max(
        1,
        Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
      );
      const chunks = recordedChunksRef.current;

      mediaRecorderRef.current = null;
      recordingCallIdRef.current = null;
      audioCtxRef.current = null;
      recordedChunksRef.current = [];
      useCallUiStore.getState().updateActiveCall({ isRecording: false });

      if (!recorder || recorder.state === 'inactive') {
        try {
          await ctx?.close();
        } catch {
          // Ignore close errors
        }
        return;
      }

      await new Promise<void>((resolve) => {
        const mimeType = recorder.mimeType || 'audio/webm';
        recorder.onstop = () => {
          try {
            void ctx?.close();
          } catch {
            // Ignore
          }
          if (!targetCallId || chunks.length === 0) {
            resolve();
            return;
          }
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const audioDataUrl =
              typeof reader.result === 'string' ? reader.result : '';
            if (!audioDataUrl) {
              resolve();
              return;
            }
            const store = useCallUiStore.getState();
            store.updateActiveCall({ isUploadingRecording: true });
            try {
              await uploadCallRecordingApi(targetCallId, {
                audioDataUrl,
                durationSeconds: recDurationSec,
              });
              await refreshHistory();
            } catch {
              store.setErrorBanner('Call recording upload failed.');
            } finally {
              store.updateActiveCall({ isUploadingRecording: false });
              resolve();
            }
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        };
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    },
    [refreshHistory],
  );

  const toggleRecording = useCallback(() => {
    const store = useCallUiStore.getState();
    const active = store.activeCall;
    if (!active) return;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      void stopAndUploadRecording(active.id);
      return;
    }

    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      store.setErrorBanner('Browser audio recording is not supported here.');
      return;
    }

    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextCtor();
      const dest = ctx.createMediaStreamDestination();

      if (
        localStreamRef.current &&
        localStreamRef.current.getAudioTracks().length > 0
      ) {
        ctx.createMediaStreamSource(localStreamRef.current).connect(dest);
      }
      if (
        remoteStreamRef.current &&
        remoteStreamRef.current.getAudioTracks().length > 0
      ) {
        ctx.createMediaStreamSource(remoteStreamRef.current).connect(dest);
      }

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const mimeType = preferredTypes.find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const recorder = mimeType
        ? new MediaRecorder(dest.stream, { mimeType })
        : new MediaRecorder(dest.stream);

      recordedChunksRef.current = [];
      recordingCallIdRef.current = active.id;
      recordingStartedAtRef.current = Date.now();
      audioCtxRef.current = ctx;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.start(500);
      store.updateActiveCall({ isRecording: true });
    } catch {
      store.setErrorBanner('Could not initialize audio recorder.');
    }
  }, [stopAndUploadRecording]);

  const endCall = useCallback(
    async (reason?: string) => {
      const store = useCallUiStore.getState();
      const active = store.activeCall;
      if (!active) {
        cleanupMediaAndPeer();
        store.setSessionState({ callState: 'idle', activeCall: null });
        return;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        void stopAndUploadRecording(active.id);
      }

      const finalTelemetry = pcRef.current
        ? await extractWebRtcTelemetry(pcRef.current)
        : null;

      socketRef.current?.emit('call:end', {
        callId: active.id,
        reason,
        finalTelemetry,
      });

      cleanupMediaAndPeer();
      const wasConnected =
        active.durationSec > 0 || Boolean(active.connectedAt);
      store.setSessionState({
        callState: 'ended',
        isMinimized: false,
        activeCall: { ...active, endReason: reason || 'Call Ended' },
      });
      if (wasConnected) {
        store.setDispositionModalCall({
          callId: active.id,
          peerName: active.peer.name,
          durationSeconds: active.durationSec,
          linkedEntityType:
            active.linkedEntityType || active.peer.linkedEntityType,
          linkedEntityId: active.linkedEntityId || active.peer.linkedEntityId,
          linkedEntityLabel:
            active.linkedEntityLabel || active.peer.linkedEntityLabel,
          notes: active.notes,
          outcomeTag: active.outcomeTag,
        });
      }
      void refreshHistory();

      setTimeout(() => {
        const s = useCallUiStore.getState();
        if (s.callState === 'ended' && s.activeCall?.id === active.id) {
          s.setSessionState({ callState: 'idle', activeCall: null });
        }
      }, 1500);
    },
    [cleanupMediaAndPeer, refreshHistory, stopAndUploadRecording],
  );

  const toggleMute = useCallback(() => {
    const store = useCallUiStore.getState();
    const active = store.activeCall;
    if (!active) return;

    const nextMuted = !active.isMuted;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted && !active.isOnHold;
      });
    }
    store.updateActiveCall({ isMuted: nextMuted });
    socketRef.current?.emit('call:mute_state', {
      callId: active.id,
      isMuted: nextMuted,
    });
  }, []);

  const toggleHold = useCallback(() => {
    const store = useCallUiStore.getState();
    const active = store.activeCall;
    if (!active) return;

    const nextHold = !Boolean(active.isOnHold);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextHold ? false : !active.isMuted;
      });
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = nextHold;
    }
    store.updateActiveCall({ isOnHold: nextHold });
    socketRef.current?.emit('call:hold_state', {
      callId: active.id,
      isOnHold: nextHold,
    });
  }, []);

  const transferCall = useCallback(
    async (targetUserCode: string): Promise<boolean> => {
      const store = useCallUiStore.getState();
      const active = store.activeCall;
      const socket = socketRef.current;
      const cleanCode = targetUserCode.replace(/^#/, '').trim();
      if (!active || !socket || !socket.connected || !cleanCode) {
        return false;
      }

      store.setErrorBanner(null);
      return new Promise<boolean>((resolve) => {
        socket.emit(
          'call:transfer',
          { callId: active.id, targetUserCode: cleanCode },
          (ack?: {
            ok?: boolean;
            error?: string;
            callee?: { name?: string };
          }) => {
            if (!ack?.ok) {
              store.setErrorBanner(ack?.error || 'Could not transfer call.');
              resolve(false);
              return;
            }
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== 'inactive'
            ) {
              void stopAndUploadRecording(active.id);
            }
            cleanupMediaAndPeer();
            store.setSessionState({
              callState: 'ended',
              isMinimized: false,
              activeCall: {
                ...active,
                endReason: `Transferred to ${ack.callee?.name || `#${cleanCode}`}`,
              },
            });
            void refreshHistory();
            setTimeout(() => {
              const curr = useCallUiStore.getState();
              if (curr.callState === 'ended' && curr.activeCall?.id === active.id) {
                curr.setSessionState({ callState: 'idle', activeCall: null });
              }
            }, 1800);
            resolve(true);
          },
        );
      });
    },
    [cleanupMediaAndPeer, refreshHistory, stopAndUploadRecording],
  );

  const setPresence = useCallback((status: AgentPresenceStatus) => {
    useCallUiStore.getState().setMyStatusLocal(status);
    socketRef.current?.emit('presence:set', { status });
  }, []);

  // Register live actions into Zustand store so Header, Overlay, and /calls share one engine
  useEffect(() => {
    useCallUiStore.getState().setHandlers({
      initiateCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCall,
      toggleMute,
      toggleHold,
      toggleRecording,
      transferCall,
      setPresence,
      refreshHistory,
    });
    return () => {
      useCallUiStore.getState().setHandlers(null);
    };
  }, [
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleHold,
    toggleRecording,
    transferCall,
    setPresence,
    refreshHistory,
  ]);

  // Initial REST hydration (history + presence) & live Socket.IO `/calls` connection
  useEffect(() => {
    if (!accessToken || !currentUser?.id) return;

    void refreshHistory();
    void fetchCallsPresenceApi()
      .then((res) => {
        const store = useCallUiStore.getState();
        store.setPresenceRoster(res.data);
        if (res.selfStatus) store.setMyStatusLocal(res.selfStatus);
      })
      .catch(() => {});

    const socket = io(`${websocketConfig.url.replace(/\/+$/, '')}/calls`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1200,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      useCallUiStore.getState().setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      useCallUiStore.getState().setSocketConnected(false);
    });

    const handlePresenceList = (list: TenantPresenceMember[]) => {
      const store = useCallUiStore.getState();
      const filtered = (Array.isArray(list) ? list : []).filter(
        (m) => m.userId !== currentUser.id,
      );
      store.setPresenceRoster(filtered);
      const self = (Array.isArray(list) ? list : []).find(
        (m) => m.userId === currentUser.id,
      );
      if (self) {
        store.setMyStatusLocal(self.status);
      }
    };

    socket.on('presence:snapshot', handlePresenceList);
    socket.on('presence:update', handlePresenceList);

    socket.on(
      'call:incoming',
      (payload: {
        callId: string;
        caller: {
          userId: string;
          name: string;
          role: string;
          userCode: string;
          callerType?: 'agent' | 'customer';
          customerPhone?: string;
          linkedEntityType?: '' | 'lead' | 'deal' | 'ticket';
          linkedEntityId?: string;
          linkedEntityLabel?: string;
          transferredFromName?: string;
        };
        startedAt: string;
        timeoutSec?: number;
      }) => {
        const store = useCallUiStore.getState();
        if (store.callState !== 'idle' && store.callState !== 'ended') return;
        activeCallIdRef.current = payload.callId;
        isInitiatorRef.current = false;
        store.setErrorBanner(null);
        store.setSessionState({
          callState: 'ringing_incoming',
          ringSecondsLeft: payload.timeoutSec || 30,
          isMinimized: false,
          activeCall: {
            id: payload.callId,
            peer: {
              id: payload.caller.userId,
              name: payload.caller.name,
              role: formatRoleLabel(payload.caller.role),
              userCode: payload.caller.userCode,
              callerType: payload.caller.callerType || 'agent',
              customerPhone: payload.caller.customerPhone || '',
              linkedEntityType: payload.caller.linkedEntityType || '',
              linkedEntityId: payload.caller.linkedEntityId || '',
              linkedEntityLabel: payload.caller.linkedEntityLabel || '',
              transferredFromName: payload.caller.transferredFromName || '',
            },
            direction: 'incoming',
            startedAt: payload.startedAt || new Date().toISOString(),
            durationSec: 0,
            isMuted: false,
            peerMuted: false,
            isSpeakerBoost: false,
            icePath: 'direct',
            rttMs: 0,
            linkedEntityType: payload.caller.linkedEntityType || '',
            linkedEntityId: payload.caller.linkedEntityId || '',
            linkedEntityLabel: payload.caller.linkedEntityLabel || '',
          },
        });
      },
    );

    socket.on(
      'call:accepted',
      (payload: { callId: string; answeredAt?: string }) => {
        void (async () => {
          const store = useCallUiStore.getState();
          if (
            !store.activeCall ||
            store.activeCall.id !== payload.callId ||
            !localStreamRef.current
          ) {
            return;
          }
          store.setSessionState({
            callState: 'connecting',
            activeCall: {
              ...store.activeCall,
              answeredAt: payload.answeredAt || new Date().toISOString(),
            },
          });

          const pc = await createConfiguredPeerConnection(
            payload.callId,
            localStreamRef.current,
          );
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
            });
            await pc.setLocalDescription(offer);
            socket.emit('call:offer', {
              callId: payload.callId,
              sdp: pc.localDescription,
            });
          } catch {
            void endCall('Failed to create WebRTC audio offer');
          }
        })();
      },
    );

    socket.on('call:accepted_elsewhere', (payload: { callId: string }) => {
      const store = useCallUiStore.getState();
      if (store.activeCall?.id === payload.callId) {
        cleanupMediaAndPeer();
        store.setSessionState({ callState: 'idle', activeCall: null });
      }
    });

    socket.on(
      'call:offer',
      (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
        void (async () => {
          const pc = pcRef.current;
          if (!pc || activeCallIdRef.current !== payload.callId) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            remoteDescSetRef.current = true;
            await flushBufferedIceCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call:answer', {
              callId: payload.callId,
              sdp: pc.localDescription,
            });
          } catch {
            void endCall('Failed to process WebRTC offer');
          }
        })();
      },
    );

    socket.on(
      'call:answer',
      (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
        void (async () => {
          const pc = pcRef.current;
          if (!pc || activeCallIdRef.current !== payload.callId) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            remoteDescSetRef.current = true;
            await flushBufferedIceCandidates(pc);
          } catch {
            void endCall('Failed to complete WebRTC answer');
          }
        })();
      },
    );

    socket.on(
      'call:ice',
      (payload: { callId: string; candidate: RTCIceCandidateInit }) => {
        void (async () => {
          if (activeCallIdRef.current !== payload.callId || !payload.candidate) {
            return;
          }
          const pc = pcRef.current;
          if (pc && remoteDescSetRef.current && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {
              // Ignore invalid candidate
            }
          } else {
            pendingIceRef.current.push(payload.candidate);
          }
        })();
      },
    );

    socket.on(
      'call:connected',
      (payload: { callId: string; connectedAt: string }) => {
        const store = useCallUiStore.getState();
        if (store.activeCall?.id !== payload.callId) return;
        store.setSessionState({
          callState: 'connected',
          activeCall: {
            ...store.activeCall,
            connectedAt: payload.connectedAt,
          },
        });
      },
    );

    socket.on(
      'call:mute_state',
      (payload: { callId: string; isMuted: boolean }) => {
        const store = useCallUiStore.getState();
        if (store.activeCall?.id === payload.callId) {
          store.updateActiveCall({ peerMuted: Boolean(payload.isMuted) });
        }
      },
    );

    socket.on(
      'call:hold_state',
      (payload: { callId: string; isOnHold: boolean }) => {
        const store = useCallUiStore.getState();
        if (store.activeCall?.id === payload.callId) {
          store.updateActiveCall({ peerOnHold: Boolean(payload.isOnHold) });
        }
      },
    );

    socket.on(
      'call:transferred_outgoing',
      (payload: {
        oldCallId: string;
        newCallId: string;
        startedAt: string;
        callee: {
          userId: string;
          name: string;
          role: string;
          userCode: string;
          territory?: string;
        };
        transferredFromName?: string;
        timeoutSec?: number;
      }) => {
        void (async () => {
          const store = useCallUiStore.getState();
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== 'inactive'
          ) {
            void stopAndUploadRecording(payload.oldCallId);
          }
          cleanupPeerOnly();
          if (!localStreamRef.current) {
            try {
              await acquireMicrophone();
            } catch {
              // Ignore if mic unavailable
            }
          } else {
            localStreamRef.current.getAudioTracks().forEach((t) => {
              t.enabled = true;
            });
          }

          activeCallIdRef.current = payload.newCallId;
          isInitiatorRef.current = true;
          const prevSession = store.activeCall;
          store.setSessionState({
            callState: 'ringing_outgoing',
            ringSecondsLeft: payload.timeoutSec || 30,
            isMinimized: false,
            activeCall: {
              id: payload.newCallId,
              peer: {
                id: payload.callee.userId,
                name: payload.callee.name,
                role: formatRoleLabel(payload.callee.role),
                userCode: payload.callee.userCode,
                territory: payload.callee.territory,
                transferredFromName: payload.transferredFromName,
              },
              direction: 'outgoing',
              startedAt: payload.startedAt || new Date().toISOString(),
              durationSec: 0,
              isMuted: false,
              peerMuted: false,
              isOnHold: false,
              peerOnHold: false,
              isRecording: false,
              isSpeakerBoost: false,
              icePath: 'direct',
              rttMs: 0,
              linkedEntityType: prevSession?.linkedEntityType,
              linkedEntityId: prevSession?.linkedEntityId,
              linkedEntityLabel: prevSession?.linkedEntityLabel,
              notes: prevSession?.notes,
              outcomeTag: prevSession?.outcomeTag,
            },
          });
        })();
      },
    );

    const handleTerminalEvent = (
      payload: { callId: string; reason?: string; durationSeconds?: number },
      fallbackReason: string,
    ) => {
      const store = useCallUiStore.getState();
      if (store.activeCall?.id !== payload.callId) {
        void refreshHistory();
        return;
      }
      const prev = store.activeCall;
      const finalDuration = payload.durationSeconds ?? prev.durationSec;
      const wasConnected = finalDuration > 0 || Boolean(prev.connectedAt);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        void stopAndUploadRecording(prev.id);
      }
      cleanupMediaAndPeer();
      store.setSessionState({
        callState: 'ended',
        isMinimized: false,
        activeCall: {
          ...prev,
          durationSec: finalDuration,
          endReason: payload.reason || fallbackReason,
        },
      });
      if (wasConnected && store.dispositionModalCall?.callId !== payload.callId) {
        store.setDispositionModalCall({
          callId: prev.id,
          peerName: prev.peer.name,
          durationSeconds: finalDuration,
          linkedEntityType: prev.linkedEntityType || prev.peer.linkedEntityType,
          linkedEntityId: prev.linkedEntityId || prev.peer.linkedEntityId,
          linkedEntityLabel:
            prev.linkedEntityLabel || prev.peer.linkedEntityLabel,
          notes: prev.notes,
          outcomeTag: prev.outcomeTag,
        });
      }
      void refreshHistory();
      setTimeout(() => {
        const curr = useCallUiStore.getState();
        if (curr.callState === 'ended' && curr.activeCall?.id === payload.callId) {
          curr.setSessionState({ callState: 'idle', activeCall: null });
        }
      }, 1800);
    };

    socket.on('call:rejected', (payload) =>
      handleTerminalEvent(payload, 'Call Declined'),
    );
    socket.on('call:timeout', (payload) =>
      handleTerminalEvent(payload, 'No Answer (30s Timeout)'),
    );
    socket.on('call:ended', (payload) =>
      handleTerminalEvent(payload, 'Call Ended'),
    );

    socket.on(
      'call:ice_restart_request',
      (payload: { callId: string; reason?: string }) => {
        if (
          activeCallIdRef.current === payload.callId &&
          isInitiatorRef.current
        ) {
          void triggerIceRestart(payload.reason || 'peer_network_switch');
        }
      },
    );

    socket.on('call:error', (payload: { message?: string }) => {
      if (payload?.message) {
        useCallUiStore.getState().setErrorBanner(payload.message);
      }
    });

    // Proactive Wi-Fi <-> Mobile Network handover recovery
    const onNetworkSwitch = () => {
      const store = useCallUiStore.getState();
      if (
        activeCallIdRef.current &&
        (store.callState === 'connected' || store.callState === 'connecting')
      ) {
        void triggerIceRestart('network_interface_change');
      }
    };
    window.addEventListener('online', onNetworkSwitch);
    const navConn = (
      navigator as Navigator & {
        connection?: {
          addEventListener?: (t: string, cb: () => void) => void;
          removeEventListener?: (t: string, cb: () => void) => void;
        };
      }
    )?.connection;
    navConn?.addEventListener?.('change', onNetworkSwitch);

    const onBeforeUnload = () => {
      const callId = activeCallIdRef.current;
      const finalTelemetry = lastTelemetryRef.current;
      if (callId && socket.connected) {
        socket.emit('call:end', {
          callId,
          reason: 'Browser tab closed',
          finalTelemetry,
        });
      }
      if (callId && finalTelemetry && accessToken) {
        try {
          void fetch(`/api/calls/${callId}/telemetry`, {
            method: 'POST',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(finalTelemetry),
          });
        } catch {
          // Ignore keepalive failure on unload
        }
      }
      cleanupMediaAndPeer();
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('online', onNetworkSwitch);
      navConn?.removeEventListener?.('change', onNetworkSwitch);
      window.removeEventListener('beforeunload', onBeforeUnload);
      cleanupMediaAndPeer();
      socket.disconnect();
      socketRef.current = null;
      useCallUiStore.getState().setSocketConnected(false);
    };
  }, [
    accessToken,
    currentUser?.id,
    acquireMicrophone,
    cleanupMediaAndPeer,
    cleanupPeerOnly,
    createConfiguredPeerConnection,
    endCall,
    flushBufferedIceCandidates,
    refreshHistory,
    stopAndUploadRecording,
    triggerIceRestart,
  ]);

  return { remoteAudioRef };
}

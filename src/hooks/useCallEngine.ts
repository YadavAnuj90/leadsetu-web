'use client';

import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { websocketConfig } from '@/lib/websocket';
import {
  fetchCallHistoryApi,
  fetchCallsPresenceApi,
  fetchIceServersApi,
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

  const cleanupMediaAndPeer = useCallback(() => {
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
      } catch {
        // Ignore
      }
    }

    pendingIceRef.current = [];
    remoteDescSetRef.current = false;
    activeCallIdRef.current = null;
    isInitiatorRef.current = false;
    iceRestartInProgressRef.current = false;
    lastTelemetryRef.current = null;
  }, []);

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

  const endCall = useCallback(
    async (reason?: string) => {
      const store = useCallUiStore.getState();
      const active = store.activeCall;
      if (!active) {
        cleanupMediaAndPeer();
        store.setSessionState({ callState: 'idle', activeCall: null });
        return;
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
      store.setSessionState({
        callState: 'ended',
        isMinimized: false,
        activeCall: { ...active, endReason: reason || 'Call Ended' },
      });
      void refreshHistory();

      setTimeout(() => {
        const s = useCallUiStore.getState();
        if (s.callState === 'ended' && s.activeCall?.id === active.id) {
          s.setSessionState({ callState: 'idle', activeCall: null });
        }
      }, 1500);
    },
    [cleanupMediaAndPeer, refreshHistory],
  );

  const toggleMute = useCallback(() => {
    const store = useCallUiStore.getState();
    const active = store.activeCall;
    if (!active) return;

    const nextMuted = !active.isMuted;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    store.updateActiveCall({ isMuted: nextMuted });
    socketRef.current?.emit('call:mute_state', {
      callId: active.id,
      isMuted: nextMuted,
    });
  }, []);

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
        caller: { userId: string; name: string; role: string; userCode: string };
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
            },
            direction: 'incoming',
            startedAt: payload.startedAt || new Date().toISOString(),
            durationSec: 0,
            isMuted: false,
            peerMuted: false,
            isSpeakerBoost: false,
            icePath: 'direct',
            rttMs: 0,
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
      cleanupMediaAndPeer();
      store.setSessionState({
        callState: 'ended',
        isMinimized: false,
        activeCall: {
          ...prev,
          durationSec: payload.durationSeconds ?? prev.durationSec,
          endReason: payload.reason || fallbackReason,
        },
      });
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
    cleanupMediaAndPeer,
    createConfiguredPeerConnection,
    endCall,
    flushBufferedIceCandidates,
    refreshHistory,
    triggerIceRestart,
  ]);

  return { remoteAudioRef };
}

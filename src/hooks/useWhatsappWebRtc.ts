'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getErrorMessage } from '@/lib/api-client';
import { playRingPulse } from '@/lib/call-sound';
import {
  acceptInboundWhatsappCallApi,
  fetchLeadWhatsappPermissionApi,
  fetchWhatsappCallLogsApi,
  fetchWhatsappCallingWalletApi,
  rejectWhatsappCallApi,
  requestLeadWhatsappPermissionApi,
  startOutboundWhatsappCallApi,
  terminateWhatsappCallApi,
  uploadWhatsappCallRecordingApi,
} from '@/lib/whatsapp-calling-api';
import { useAuthStore } from '@/store/auth.store';
import type {
  IncomingWhatsappCallEvent,
  WhatsappCallLogItem,
  WhatsappCallPermissionState,
  WhatsappCallingWalletSummary,
} from '@/types/contracts';

export type WhatsappWebRtcPhase =
  | 'idle'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'ending'
  | 'ended';

export interface ActiveWhatsappCallSession {
  callId: string;
  metaCallId: string;
  direction: 'inbound' | 'outbound';
  leadId: string;
  conversationId: string;
  contactName: string;
  company: string;
  displayPhone: string;
  phase: WhatsappWebRtcPhase;
  elapsedSeconds: number;
  billedPulses: number;
  costInr: number;
  rateInrPerMin: number;
  isMuted: boolean;
  isRecording: boolean;
  isUploadingRecording: boolean;
  simulated?: boolean;
  errorMessage?: string | null;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

async function waitForIceGathering(
  pc: RTCPeerConnection,
  timeoutMs = 1500,
): Promise<void> {
  if (pc.iceGatheringState === 'complete') return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }, timeoutMs);
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

export function useWhatsappWebRtc(params: {
  activeLeadId?: string;
  activeConversationId?: string;
  isWhatsappChannel?: boolean;
}) {
  const { activeLeadId, activeConversationId, isWhatsappChannel } = params;
  const accessToken = useAuthStore((s) => s.accessToken);

  const [permission, setPermission] =
    useState<WhatsappCallPermissionState | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [wallet, setWallet] = useState<WhatsappCallingWalletSummary | null>(null);
  const [callLogs, setCallLogs] = useState<WhatsappCallLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [incomingCall, setIncomingCall] =
    useState<IncomingWhatsappCallEvent | null>(null);
  const [activeCall, setActiveCall] =
    useState<ActiveWhatsappCallSession | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeCallRef = useRef<ActiveWhatsappCallSession | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const stopRingTone = useCallback(() => {
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const startRingTone = useCallback(
    (mode: 'incoming' | 'outgoing') => {
      stopRingTone();
      playRingPulse(mode);
      ringTimerRef.current = setInterval(() => {
        playRingPulse(mode);
      }, 2200);
    },
    [stopRingTone],
  );

  const stopDurationTicker = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const cleanupPeerAndMedia = useCallback(() => {
    stopRingTone();
    stopDurationTicker();

    if (pcRef.current) {
      try {
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
          // Ignore track stop errors
        }
      });
      remoteStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [stopDurationTicker, stopRingTone]);

  const refreshPermissionAndLogs = useCallback(async () => {
    if (!isWhatsappChannel || !activeConversationId) {
      setPermission(null);
      setCallLogs([]);
      return;
    }

    setLogsLoading(true);
    if (activeLeadId) setPermissionLoading(true);

    try {
      const [logsRes, permRes, walletRes] = await Promise.all([
        fetchWhatsappCallLogsApi({
          ...(activeLeadId ? { leadId: activeLeadId } : {}),
          conversationId: activeConversationId,
          limit: 20,
        }).catch(() => []),
        activeLeadId
          ? fetchLeadWhatsappPermissionApi(activeLeadId).catch(() => null)
          : Promise.resolve(null),
        fetchWhatsappCallingWalletApi().catch(() => null),
      ]);
      setCallLogs(logsRes);
      if (permRes) setPermission(permRes);
      if (walletRes) setWallet(walletRes);
    } finally {
      setLogsLoading(false);
      setPermissionLoading(false);
    }
  }, [activeConversationId, activeLeadId, isWhatsappChannel]);

  useEffect(() => {
    void refreshPermissionAndLogs();
  }, [refreshPermissionAndLogs]);

  const stopAndUploadMixedRecording = useCallback(
    async (callId: string, durationSeconds: number) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        return;
      }

      setActiveCall((prev) =>
        prev && prev.callId === callId
          ? { ...prev, isRecording: false, isUploadingRecording: true }
          : prev,
      );

      await new Promise<void>((resolve) => {
        recorder.onstop = async () => {
          const chunks = recordedChunksRef.current;
          recordedChunksRef.current = [];
          mediaRecorderRef.current = null;

          if (audioCtxRef.current) {
            void audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
          }

          if (chunks.length === 0) {
            resolve();
            return;
          }

          const blob = new Blob(chunks, {
            type: recorder.mimeType || 'audio/webm',
          });
          if (blob.size < 256) {
            resolve();
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            const audioDataUrl =
              typeof reader.result === 'string' ? reader.result : '';
            if (!audioDataUrl) {
              resolve();
              return;
            }
            try {
              const updated = await uploadWhatsappCallRecordingApi(callId, {
                audioDataUrl,
                durationSeconds,
              });
              setCallLogs((prev) => {
                const exists = prev.some((l) => l.id === updated.id);
                return exists
                  ? prev.map((l) => (l.id === updated.id ? updated : l))
                  : [updated, ...prev];
              });
            } catch {
              // Non-fatal if recording upload fails silently after call hangup
            } finally {
              setActiveCall((prev) =>
                prev && prev.callId === callId
                  ? { ...prev, isUploadingRecording: false }
                  : prev,
              );
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
    [],
  );

  const startMixedRecording = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      typeof MediaRecorder === 'undefined' ||
      (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive')
    ) {
      return;
    }

    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextCtor();
      const dest = ctx.createMediaStreamDestination();

      if (localStreamRef.current?.getAudioTracks().length) {
        ctx.createMediaStreamSource(localStreamRef.current).connect(dest);
      }
      if (remoteStreamRef.current?.getAudioTracks().length) {
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
      audioCtxRef.current = ctx;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };
      recorder.start(500);

      setActiveCall((prev) => (prev ? { ...prev, isRecording: true } : prev));
    } catch {
      // Browser may block AudioContext / MediaRecorder if unsupported
    }
  }, []);

  const startDurationTicker = useCallback(
    (direction: 'inbound' | 'outbound', rateInrPerMin: number) => {
      stopDurationTicker();
      durationTimerRef.current = setInterval(() => {
        setActiveCall((prev) => {
          if (!prev || prev.phase !== 'connected') return prev;
          const nextSec = prev.elapsedSeconds + 1;
          const pulses = direction === 'outbound' ? Math.ceil(nextSec / 6) : 0;
          const costInr =
            direction === 'outbound'
              ? Number((pulses * (rateInrPerMin / 10)).toFixed(4))
              : 0;
          return {
            ...prev,
            elapsedSeconds: nextSec,
            billedPulses: pulses,
            costInr,
          };
        });
      }, 1000);
    },
    [stopDurationTicker],
  );

  // Subscribe to `/inbox` WhatsApp Calling Socket.IO events
  useEffect(() => {
    if (!accessToken || typeof window === 'undefined') return;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
    const socketOrigin = apiBase.replace(/\/v1\/?$/, '');
    const socket = io(`${socketOrigin}/inbox`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on(
      'whatsapp_call_permission_updated',
      (payload: Partial<WhatsappCallPermissionState>) => {
        if (payload.leadId && payload.leadId === activeLeadId) {
          setPermission((prev) =>
            prev
              ? { ...prev, ...payload }
              : (payload as WhatsappCallPermissionState),
          );
        }
      },
    );

    socket.on(
      'whatsapp_wallet_updated',
      (payload: WhatsappCallingWalletSummary) => {
        if (payload && typeof payload.balanceInr === 'number') {
          setWallet((prev) => ({ ...(prev || {}), ...payload }));
        }
      },
    );

    socket.on(
      'incoming_whatsapp_call',
      (payload: IncomingWhatsappCallEvent) => {
        if (!payload?.callId) return;
        setIncomingCall(payload);
        startRingTone('incoming');
      },
    );

    socket.on(
      'whatsapp_call_status_updated',
      (payload: WhatsappCallLogItem) => {
        if (!payload?.id) return;
        setCallLogs((prev) => {
          const exists = prev.some((l) => l.id === payload.id);
          return exists
            ? prev.map((l) => (l.id === payload.id ? payload : l))
            : [payload, ...prev];
        });

        const current = activeCallRef.current;
        if (
          current &&
          (current.callId === payload.id ||
            (payload.metaCallId && current.metaCallId === payload.metaCallId)) &&
          ['completed', 'missed', 'rejected', 'failed'].includes(payload.status)
        ) {
          stopRingTone();
          const finalDur =
            payload.durationSeconds || current.elapsedSeconds || 0;
          void stopAndUploadMixedRecording(current.callId, finalDur).finally(
            () => {
              cleanupPeerAndMedia();
              setActiveCall((prev) =>
                prev ? { ...prev, phase: 'ended' } : prev,
              );
              setTimeout(() => {
                setActiveCall((prev) =>
                  prev?.phase === 'ended' ? null : prev,
                );
              }, 1600);
            },
          );
        }

        setIncomingCall((prev) =>
          prev && prev.callId === payload.id && payload.status !== 'ringing'
            ? null
            : prev,
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [
    accessToken,
    activeLeadId,
    cleanupPeerAndMedia,
    startRingTone,
    stopAndUploadMixedRecording,
    stopRingTone,
  ]);

  useEffect(() => {
    return () => {
      cleanupPeerAndMedia();
    };
  }, [cleanupPeerAndMedia]);

  const requestPermission = useCallback(
    async (reasonText?: string) => {
      if (!activeLeadId) return null;
      setRequestingPermission(true);
      setCallError(null);
      try {
        const updated = await requestLeadWhatsappPermissionApi(activeLeadId, {
          reasonText,
          conversationId: activeConversationId,
        });
        setPermission(updated);
        return updated;
      } catch (err) {
        setCallError(getErrorMessage(err));
        return null;
      } finally {
        setRequestingPermission(false);
      }
    },
    [activeConversationId, activeLeadId],
  );

  const acquireMicAndPeer = useCallback(
    async (iceServers: RTCIceServer[]) => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          'Microphone access requires HTTPS or localhost in your browser.',
        );
      }
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = localStream;

      const pc = new RTCPeerConnection({
        iceServers: iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS,
      });
      pcRef.current = pc;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;

      pc.ontrack = (ev) => {
        const stream = ev.streams?.[0];
        if (stream) {
          remoteStreamRef.current = stream;
        } else if (ev.track) {
          remoteStream.addTrack(ev.track);
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          void remoteAudioRef.current.play().catch(() => {});
        }
      };

      return pc;
    },
    [],
  );

  const startOutboundCall = useCallback(
    async (meta: {
      leadId: string;
      conversationId?: string;
      contactName: string;
      company: string;
      displayPhone: string;
    }) => {
      if (activeCallRef.current && activeCallRef.current.phase !== 'ended') {
        return;
      }
      setCallError(null);

      const iceServers = permission?.iceServers?.length
        ? permission.iceServers
        : DEFAULT_ICE_SERVERS;
      const rateInrPerMin = permission?.outboundRateInrPerMin ?? 0.45;

      setActiveCall({
        callId: 'pending',
        metaCallId: '',
        direction: 'outbound',
        leadId: meta.leadId,
        conversationId: meta.conversationId || '',
        contactName: meta.contactName,
        company: meta.company,
        displayPhone: meta.displayPhone,
        phase: 'connecting',
        elapsedSeconds: 0,
        billedPulses: 0,
        costInr: 0,
        rateInrPerMin,
        isMuted: false,
        isRecording: false,
        isUploadingRecording: false,
      });

      try {
        const pc = await acquireMicAndPeer(iceServers);
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc, 1200);

        const sdpOffer = pc.localDescription?.sdp || offer.sdp || '';
        const res = await startOutboundWhatsappCallApi({
          leadId: meta.leadId,
          sdpOffer,
          conversationId: meta.conversationId,
        });

        if (res.sdpAnswer && !res.simulated) {
          await pc.setRemoteDescription({
            type: 'answer',
            sdp: res.sdpAnswer,
          });
        }

        setActiveCall((prev) =>
          prev
            ? {
                ...prev,
                callId: res.callId,
                metaCallId: res.metaCallId,
                displayPhone: res.displayPhone || prev.displayPhone,
                rateInrPerMin: res.outboundRateInrPerMin ?? rateInrPerMin,
                simulated: res.simulated,
                phase: 'connected',
              }
            : null,
        );

        startMixedRecording();
        startDurationTicker(
          'outbound',
          res.outboundRateInrPerMin ?? rateInrPerMin,
        );
      } catch (err) {
        cleanupPeerAndMedia();
        const msg = getErrorMessage(err);
        setCallError(msg);
        setActiveCall(null);
      }
    },
    [
      acquireMicAndPeer,
      cleanupPeerAndMedia,
      permission,
      startDurationTicker,
      startMixedRecording,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    const incoming = incomingCall;
    if (!incoming) return;
    stopRingTone();
    setCallError(null);

    const iceServers = incoming.iceServers?.length
      ? incoming.iceServers
      : DEFAULT_ICE_SERVERS;

    setIncomingCall(null);
    setActiveCall({
      callId: incoming.callId,
      metaCallId: incoming.metaCallId,
      direction: 'inbound',
      leadId: incoming.leadId,
      conversationId: incoming.conversationId,
      contactName: incoming.callerName,
      company: incoming.company,
      displayPhone: incoming.maskedPhone,
      phase: 'connecting',
      elapsedSeconds: 0,
      billedPulses: 0,
      costInr: 0,
      rateInrPerMin: 0,
      isMuted: false,
      isRecording: false,
      isUploadingRecording: false,
    });

    try {
      const pc = await acquireMicAndPeer(iceServers);
      if (incoming.sdpOffer) {
        await pc.setRemoteDescription({
          type: 'offer',
          sdp: incoming.sdpOffer,
        });
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc, 1200);

      const sdpAnswer = pc.localDescription?.sdp || answer.sdp || '';
      await acceptInboundWhatsappCallApi(incoming.callId, sdpAnswer);

      setActiveCall((prev) => (prev ? { ...prev, phase: 'connected' } : null));
      startMixedRecording();
      startDurationTicker('inbound', 0);
      void refreshPermissionAndLogs();
    } catch (err) {
      cleanupPeerAndMedia();
      setCallError(getErrorMessage(err));
      setActiveCall(null);
    }
  }, [
    acquireMicAndPeer,
    cleanupPeerAndMedia,
    incomingCall,
    refreshPermissionAndLogs,
    startDurationTicker,
    startMixedRecording,
    stopRingTone,
  ]);

  const rejectIncomingCall = useCallback(async () => {
    const incoming = incomingCall;
    if (!incoming) return;
    stopRingTone();
    setIncomingCall(null);
    try {
      await rejectWhatsappCallApi(incoming.callId, 'agent_declined');
    } catch {
      // Ignore transient error on reject
    }
  }, [incomingCall, stopRingTone]);

  const toggleMute = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return prev;
      const nextMuted = !prev.isMuted;
      localStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  const hangupCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;

    stopRingTone();
    stopDurationTicker();
    setActiveCall((prev) => (prev ? { ...prev, phase: 'ending' } : prev));

    const callId = current.callId;
    const durationSeconds = current.elapsedSeconds;

    if (callId !== 'pending') {
      await stopAndUploadMixedRecording(callId, durationSeconds);
      try {
        const finalized = await terminateWhatsappCallApi(callId, {
          durationSeconds,
          reason: 'agent_hangup',
        });
        setCallLogs((prev) => {
          const exists = prev.some((l) => l.id === finalized.id);
          return exists
            ? prev.map((l) => (l.id === finalized.id ? finalized : l))
            : [finalized, ...prev];
        });
      } catch (err) {
        setCallError(getErrorMessage(err));
      }
    }

    cleanupPeerAndMedia();
    setActiveCall((prev) => (prev ? { ...prev, phase: 'ended' } : null));
    setTimeout(() => {
      setActiveCall((prev) => (prev?.phase === 'ended' ? null : prev));
    }, 1500);
    void refreshPermissionAndLogs();
  }, [
    cleanupPeerAndMedia,
    refreshPermissionAndLogs,
    stopAndUploadMixedRecording,
    stopDurationTicker,
    stopRingTone,
  ]);

  return {
    permission,
    permissionLoading,
    requestingPermission,
    wallet,
    callLogs,
    logsLoading,
    incomingCall,
    activeCall,
    callError,
    setCallError,
    remoteAudioRef,
    requestPermission,
    startOutboundCall,
    acceptIncomingCall,
    rejectIncomingCall,
    toggleMute,
    hangupCall,
    refreshPermissionAndLogs,
  };
}

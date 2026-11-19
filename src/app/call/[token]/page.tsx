'use client';

import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Wifi,
  CalendarClock,
  UserCheck,
} from 'lucide-react';
import {
  fetchPublicCallLinkInfoApi,
  submitPublicCallCallbackApi,
  type PublicCallLinkInfo,
} from '@/lib/calls-api';
import { websocketConfig } from '@/lib/websocket';
import {
  formatCallDuration,
  type AgentPresenceStatus,
} from '@/store/call-ui.store';

function formatRoleLabel(role?: string) {
  if (role === 'manager') return 'Sales Manager';
  if (role === 'agent') return 'Sales Agent';
  if (role === 'owner') return 'Workspace Owner';
  if (role === 'admin') return 'Workspace Admin';
  return role || 'Account Manager';
}

type PublicCallPhase =
  | 'idle'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'declined'
  | 'timeout'
  | 'ended';

export default function CustomerClickToCallPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || '';

  const [linkInfo, setLinkInfo] = useState<PublicCallLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] =
    useState<AgentPresenceStatus>('offline');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('Today · Within 1 hour');
  const [callbackMessage, setCallbackMessage] = useState('');

  const [callPhase, setCallPhase] = useState<PublicCallPhase>('idle');
  const [durationSec, setDurationSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState<string | null>(null);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const remoteDescSetRef = useRef<boolean>(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const cleanupMedia = useCallback(() => {
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
          // Ignore
        }
      });
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch {
        // Ignore
      }
    }
    activeCallIdRef.current = null;
    remoteDescSetRef.current = false;
    pendingIceRef.current = [];
    setIsMuted(false);
  }, []);

  const loadInfo = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLinkError(null);
    try {
      const data = await fetchPublicCallLinkInfoApi(token);
      setLinkInfo(data);
      setAgentStatus(data.agent.status);
      setCustomerName((prev) => prev || data.context.customerName || '');
      setCustomerPhone((prev) => prev || data.context.customerPhone || '');
    } catch {
      setLinkError(
        'This voice support link is invalid or has expired. Please contact your representative for a fresh link.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  useEffect(() => {
    if (callPhase !== 'connected') return;
    const t = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [callPhase]);

  useEffect(() => {
    if (!linkInfo || !token) return;

    const socket = io(`${websocketConfig.url.replace(/\/+$/, '')}/calls`, {
      auth: { callToken: token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('agent:presence', (payload: { status?: AgentPresenceStatus }) => {
      if (payload?.status) {
        setAgentStatus(payload.status);
      }
    });

    const flushIce = async (pc: RTCPeerConnection) => {
      const queued = [...pendingIceRef.current];
      pendingIceRef.current = [];
      for (const c of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch {
          // Ignore stale ICE candidates
        }
      }
    };

    socket.on('call:accepted', (payload: { callId: string }) => {
      void (async () => {
        if (
          activeCallIdRef.current !== payload.callId ||
          !localStreamRef.current
        ) {
          return;
        }
        setCallPhase('connecting');

        const pc = new RTCPeerConnection({
          iceServers: linkInfo.iceServers || [
            { urls: 'stun:stun.l.google.com:19302' },
          ],
          iceTransportPolicy: linkInfo.iceTransportPolicy || 'all',
        });
        pcRef.current = pc;
        remoteDescSetRef.current = false;

        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });

        const remoteStream = new MediaStream();
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
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
          if (event.candidate) {
            socket.emit('call:ice', {
              callId: payload.callId,
              candidate: event.candidate.toJSON(),
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (
            pc.iceConnectionState === 'connected' ||
            pc.iceConnectionState === 'completed'
          ) {
            socket.emit('call:media_connected', { callId: payload.callId });
            setCallPhase('connected');
          } else if (pc.iceConnectionState === 'failed') {
            socket.emit('call:end', {
              callId: payload.callId,
              failed: true,
              reason: 'Customer network connection failed',
            });
            cleanupMedia();
            setCallPhase('ended');
          }
        };

        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true });
          await pc.setLocalDescription(offer);
          socket.emit('call:offer', {
            callId: payload.callId,
            sdp: pc.localDescription,
          });
        } catch {
          setCallError('Unable to negotiate WebRTC audio session.');
          cleanupMedia();
          setCallPhase('ended');
        }
      })();
    });

    socket.on(
      'call:answer',
      (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
        void (async () => {
          const pc = pcRef.current;
          if (!pc || activeCallIdRef.current !== payload.callId) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            remoteDescSetRef.current = true;
            await flushIce(pc);
          } catch {
            setCallError('Failed to connect audio answer.');
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
              // Ignore invalid ICE
            }
          } else {
            pendingIceRef.current.push(payload.candidate);
          }
        })();
      },
    );

    socket.on('call:connected', (payload: { callId: string }) => {
      if (activeCallIdRef.current === payload.callId) {
        setCallPhase('connected');
      }
    });

    socket.on('call:rejected', (payload: { callId: string }) => {
      if (activeCallIdRef.current === payload.callId) {
        cleanupMedia();
        setCallPhase('declined');
        setAgentStatus('busy');
      }
    });

    socket.on('call:timeout', (payload: { callId: string }) => {
      if (activeCallIdRef.current === payload.callId) {
        cleanupMedia();
        setCallPhase('timeout');
      }
    });

    socket.on('call:ended', (payload: { callId: string }) => {
      if (activeCallIdRef.current === payload.callId) {
        cleanupMedia();
        setCallPhase('ended');
      }
    });

    return () => {
      cleanupMedia();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [linkInfo, token, cleanupMedia]);

  const handleStartCall = async () => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setCallError('Connecting voice server... please try again in a second.');
      return;
    }
    setCallError(null);
    setDurationSec(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
    } catch {
      setCallError(
        'Microphone access was denied. Please allow mic permission in your browser to call.',
      );
      return;
    }

    socket.emit(
      'call:initiate',
      {
        customerName: customerName.trim() || 'Customer',
        customerPhone: customerPhone.trim(),
      },
      (ack?: { ok?: boolean; error?: string; call?: { id: string } }) => {
        if (!ack?.ok || !ack.call?.id) {
          cleanupMedia();
          setCallError(ack?.error || 'Agent is currently unavailable.');
          if ((ack?.error || '').toLowerCase().includes('offline')) {
            setAgentStatus('offline');
          } else if ((ack?.error || '').toLowerCase().includes('busy')) {
            setAgentStatus('busy');
          }
          return;
        }
        activeCallIdRef.current = ack.call.id;
        setCallPhase('ringing');
      },
    );
  };

  const handleEndCall = () => {
    if (activeCallIdRef.current && socketRef.current?.connected) {
      socketRef.current.emit('call:end', {
        callId: activeCallIdRef.current,
        reason: 'Customer ended call',
      });
    }
    cleanupMedia();
    setCallPhase('ended');
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setIsMuted(next);
    if (activeCallIdRef.current) {
      socketRef.current?.emit('call:mute_state', {
        callId: activeCallIdRef.current,
        isMuted: next,
      });
    }
  };

  const handleCallbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingCallback(true);
    setCallbackError(null);
    setCallbackSuccess(null);
    try {
      const res = await submitPublicCallCallbackApi(token, {
        customerName: customerName.trim() || 'Customer',
        customerPhone: customerPhone.trim(),
        preferredTime: preferredTime.trim(),
        message: callbackMessage.trim(),
      });
      setCallbackSuccess(res.message);
      setCallbackMessage('');
    } catch (err) {
      setCallbackError(
        err instanceof Error ? err.message : 'Unable to send callback request.',
      );
    } finally {
      setSubmittingCallback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-bold">Connecting Direct Support Line...</p>
      </div>
    );
  }

  if (linkError || !linkInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-lg font-extrabold text-slate-900">
            Voice Call Link Unavailable
          </h1>
          <p className="text-xs text-slate-500">
            {linkError || 'Please request an updated link from your contact.'}
          </p>
        </div>
      </div>
    );
  }

  const showCallbackForm =
    agentStatus !== 'online' ||
    callPhase === 'declined' ||
    callPhase === 'timeout';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50/30 flex items-center justify-center p-4 sm:p-6">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <div className="w-full max-w-lg rounded-[32px] bg-white border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Top Hero */}
        <div
          className="p-6 text-white space-y-4"
          style={{
            background:
              'linear-gradient(135deg, #091224 0%, #15284E 55%, #1E4EAD 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {linkInfo.companyLogoUrl ? (
                <img
                  src={linkInfo.companyLogoUrl}
                  alt={linkInfo.companyName}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/25 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {linkInfo.companyName}
                </div>
                <div className="text-[10px] text-sky-200">
                  Direct Browser Voice Desk · Free Call
                </div>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                agentStatus === 'online'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : agentStatus === 'busy'
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                    : 'bg-white/10 border-white/20 text-slate-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  agentStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : agentStatus === 'busy'
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                }`}
              />
              {agentStatus === 'online'
                ? 'Agent Online'
                : agentStatus === 'busy'
                  ? 'In Another Call'
                  : 'Agent Offline'}
            </span>
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xl font-black shadow-lg shrink-0">
              {linkInfo.agent.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black truncate">
                {linkInfo.agent.name}
              </div>
              <div className="text-xs text-sky-200">
                {formatRoleLabel(linkInfo.agent.role)}
                {linkInfo.agent.territory
                  ? ` · ${linkInfo.agent.territory}`
                  : ''}
              </div>
              {linkInfo.context.entityLabel && (
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-emerald-200">
                  <UserCheck className="w-3 h-3" />
                  <span>Ref: {linkInfo.context.entityLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-5">
          {callPhase === 'ringing' ||
          callPhase === 'connecting' ||
          callPhase === 'connected' ? (
            <div className="rounded-2xl bg-slate-950 text-white p-6 text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold text-emerald-300">
                <Wifi className="w-3.5 h-3.5" />
                <span>
                  {callPhase === 'ringing'
                    ? `Ringing ${linkInfo.agent.name}...`
                    : callPhase === 'connecting'
                      ? 'Connecting Secure Audio...'
                      : `Connected · ${formatCallDuration(durationSec)}`}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                {callPhase === 'connected' && (
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`px-4 py-3 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 ${
                      isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold inline-flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>{callPhase === 'ringing' ? 'Cancel' : 'End Call'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {callPhase === 'ended' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2">
                  <span>
                    Call ended
                    {durationSec > 0
                      ? ` · Duration ${formatCallDuration(durationSec)}`
                      : ''}
                    . Need to reconnect?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCallPhase('idle');
                      void loadInfo();
                    }}
                    className="font-extrabold underline"
                  >
                    Reset
                  </button>
                </div>
              )}

              {(callPhase === 'declined' || callPhase === 'timeout') && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    {callPhase === 'declined'
                      ? `${linkInfo.agent.name} is unable to take a live call right now.`
                      : 'No answer within 30 seconds.'}{' '}
                    Request a priority callback below and we will reach out.
                  </span>
                </div>
              )}

              {callError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {callError}
                </div>
              )}

              {!showCallbackForm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98xxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleStartCall()}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>
                      Call {linkInfo.agent.name} Now (Free Browser Audio)
                    </span>
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    Works directly in your browser using encrypted WebRTC audio —
                    no app download or call charges required.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <CalendarClock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-900">
                        {agentStatus === 'busy'
                          ? `${linkInfo.agent.name} is currently on another call.`
                          : `${linkInfo.agent.name} is currently offline.`}
                      </strong>{' '}
                      Leave your details below and we will schedule an instant
                      priority callback task for them.
                    </div>
                  </div>

                  {callbackSuccess ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{callbackSuccess}</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your Name *"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Mobile Number *"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <input
                        type="text"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        placeholder="Preferred callback window (e.g. Today 4 PM)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                      />

                      <textarea
                        rows={2}
                        value={callbackMessage}
                        onChange={(e) => setCallbackMessage(e.target.value)}
                        placeholder="Reason for call / quotation or order query..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />

                      {callbackError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                          {callbackError}
                        </div>
                      )}

                      <div className="flex items-center gap-2.5">
                        <button
                          type="submit"
                          disabled={submittingCallback}
                          className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2"
                        >
                          {submittingCallback && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          <Phone className="w-3.5 h-3.5" />
                          <span>Request Priority Callback</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCallPhase('idle');
                            void loadInfo();
                          }}
                          className="px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Retry Live Status
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

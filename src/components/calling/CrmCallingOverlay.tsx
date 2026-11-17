'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  Grid3X3,
  Delete,
  Search,
  Clock,
  Wifi,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCallEngine } from '@/hooks/useCallEngine';
import { playDtmfTone, playRingPulse } from '@/lib/call-sound';
import {
  useCallUiStore,
  formatCallDuration,
  type AgentPresenceStatus,
  type CallPeerInfo,
} from '@/store/call-ui.store';

const DIALPAD_KEYS: Array<{ digit: string; letters: string }> = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const STATUS_META: Record<
  AgentPresenceStatus,
  { label: string; dot: string }
> = {
  online: { label: 'Online', dot: 'bg-emerald-500' },
  busy: { label: 'Busy', dot: 'bg-amber-500' },
  offline: { label: 'Offline', dot: 'bg-slate-400' },
};

function formatRoleBadge(role?: string) {
  if (role === 'manager') return 'Sales Manager';
  if (role === 'agent') return 'Sales Agent';
  if (role === 'owner') return 'Workspace Owner';
  if (role === 'admin') return 'Workspace Admin';
  return role || 'Agent';
}

function formatCallTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function CrmCallingOverlay() {
  const { user } = useAuth();
  const { remoteAudioRef } = useCallEngine();

  const {
    socketConnected,
    myStatus,
    dialerDrawerOpen,
    isMinimized,
    dialInput,
    callState,
    ringSecondsLeft,
    activeCall,
    errorBanner,
    presenceRoster,
    history,
    handlers,
    setDialerDrawerOpen,
    setMinimized,
    setDialInput,
    appendDialDigit,
    backspaceDialDigit,
    setErrorBanner,
    tickTimers,
  } = useCallUiStore();

  const [drawerTab, setDrawerTab] = useState<'dialer' | 'history'>('dialer');
  const [searchQuery, setSearchQuery] = useState('');
  const [inCallKeypad, setInCallKeypad] = useState(false);
  const [ringtoneMuted, setRingtoneMuted] = useState(false);

  // Synced 1s timer for call duration & ringing countdown
  useEffect(() => {
    if (
      callState !== 'connected' &&
      callState !== 'ringing_incoming' &&
      callState !== 'ringing_outgoing'
    ) {
      return;
    }
    const timer = setInterval(() => {
      tickTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, [callState, tickTimers]);

  // Audible chime while ringing
  useEffect(() => {
    if (ringtoneMuted) return;
    if (callState !== 'ringing_incoming' && callState !== 'ringing_outgoing') {
      return;
    }
    const mode = callState === 'ringing_incoming' ? 'incoming' : 'outgoing';
    playRingPulse(mode);
    const pulse = setInterval(() => {
      playRingPulse(mode);
    }, 2400);
    return () => clearInterval(pulse);
  }, [callState, ringtoneMuted]);

  const teammates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return presenceRoster.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.userCode || '').includes(q) ||
        (m.territory || '').toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [presenceRoster, searchQuery]);

  const isAdminViewer = ['owner', 'admin', 'super_admin'].includes(
    user?.role || '',
  );

  const matchedDialTarget = useMemo(() => {
    if (!isAdminViewer) return null;
    const clean = dialInput.trim();
    if (!clean) return null;
    return (
      presenceRoster.find(
        (m) => m.userCode === clean || m.userCode.endsWith(clean),
      ) || null
    );
  }, [dialInput, presenceRoster, isAdminViewer]);

  const handleDialExtensionCall = () => {
    const clean = dialInput.replace(/^#/, '').trim();
    if (!clean || callState !== 'idle') return;
    if (matchedDialTarget) {
      const peer: CallPeerInfo = {
        id: matchedDialTarget.userId,
        name: matchedDialTarget.name,
        role: formatRoleBadge(matchedDialTarget.role),
        userCode: matchedDialTarget.userCode,
        territory: matchedDialTarget.territory,
      };
      void handlers?.initiateCall(peer);
      setDialInput('');
      return;
    }
    void handlers?.initiateCall({
      id: '',
      name: `UID #${clean}`,
      role: 'Workspace User',
      userCode: clean,
    });
    setDialInput('');
  };

  const isAudioFlowing = callState === 'connected' && !activeCall?.isMuted;
  const ringProgressPct = Math.max(
    0,
    Math.min(100, Math.round((ringSecondsLeft / 30) * 100)),
  );

  return (
    <>
      {/* Hidden WebRTC Two-Way Remote Audio Player */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Global Call Error Toast */}
      {errorBanner && (
        <div className="fixed top-20 right-5 z-50 max-w-sm rounded-2xl bg-rose-600 text-white px-4 py-3 shadow-2xl border border-rose-400/50 flex items-start gap-2.5 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="p-0.5 rounded hover:bg-white/20"
            aria-label="Dismiss call alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── 1. SLIDE-OVER QUICK CRM SOFTPHONE DRAWER ────────────────────── */}
      {dialerDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] flex justify-end"
          onClick={() => setDialerDrawerOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-white dark:bg-[#0B1320] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            <div
              className="px-5 py-4 text-white flex items-center justify-between gap-3 shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, #0B1426 0%, #162B52 55%, #2457BA 100%)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold flex items-center gap-2">
                    <span>CRM Voice Softphone</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        socketConnected
                          ? 'bg-emerald-400/20 text-emerald-200'
                          : 'bg-amber-400/20 text-amber-200'
                      }`}
                    >
                      {socketConnected ? 'Live' : 'Connecting'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    Ext #{user?.userCode || '—'} · WebRTC Two-Way Audio
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDialerDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close Softphone"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Presence Bar */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Status
              </span>
              <div className="inline-flex rounded-xl p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-1">
                {(['online', 'busy', 'offline'] as AgentPresenceStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={callState !== 'idle'}
                      onClick={() => handlers?.setPresence(st)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60 ${
                        myStatus === st
                          ? 'bg-brand-navy text-white shadow-sm dark:bg-brand-blue'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${STATUS_META[st].dot}`}
                      />
                      {STATUS_META[st].label}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDrawerTab('dialer')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    drawerTab === 'dialer'
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Dialer &amp; Team
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerTab('history');
                    void handlers?.refreshHistory();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                    drawerTab === 'history'
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>History</span>
                  {history.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                      {history.length}
                    </span>
                  )}
                </button>
              </div>

              <Link
                href="/calls"
                onClick={() => setDialerDrawerOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
              >
                Full Phone View <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {drawerTab === 'dialer' ? (
                <>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={dialInput}
                          onChange={(e) => setDialInput(e.target.value)}
                          placeholder="Enter 10-digit Agent UID #"
                          className="w-full bg-transparent text-base font-mono font-extrabold text-brand-navy dark:text-white placeholder:text-xs placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
                        />
                        {matchedDialTarget && (
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                            {matchedDialTarget.name} ({STATUS_META[matchedDialTarget.status].label})
                          </div>
                        )}
                      </div>
                      {dialInput && (
                        <button
                          type="button"
                          onClick={backspaceDialDigit}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          title="Backspace"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {DIALPAD_KEYS.map((k) => (
                        <button
                          key={k.digit}
                          type="button"
                          onClick={() => {
                            playDtmfTone(k.digit);
                            appendDialDigit(k.digit);
                          }}
                          className="h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-brand-blue hover:bg-brand-light/40 dark:hover:bg-slate-700 transition-all flex flex-col items-center justify-center shadow-xs active:scale-95"
                        >
                          <span className="text-sm font-extrabold text-brand-navy dark:text-white leading-none">
                            {k.digit}
                          </span>
                          {k.letters && (
                            <span className="text-[8px] font-bold tracking-widest text-slate-400 mt-0.5">
                              {k.letters}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={
                        !dialInput.trim() ||
                        (matchedDialTarget ? matchedDialTarget.status !== 'online' : false) ||
                        callState !== 'idle' ||
                        myStatus === 'offline' ||
                        !socketConnected
                      }
                      onClick={handleDialExtensionCall}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      {matchedDialTarget
                        ? matchedDialTarget.status === 'online'
                          ? `Call ${matchedDialTarget.name}`
                          : `${matchedDialTarget.name} is ${STATUS_META[matchedDialTarget.status].label}`
                        : dialInput.trim()
                          ? `Call UID #${dialInput.replace(/^#/, '').trim()}`
                          : 'Enter 10-Digit Agent UID'}
                    </button>
                  </div>

                  {/* Live Team Presence Directory (Workspace Admins / Owners only) */}
                  {isAdminViewer && (
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Workspace Agents ({teammates.length})
                      </span>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search teammate by name, UID, or city..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-brand-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      {teammates.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-5 text-center space-y-1.5">
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            No other active teammates found
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Invite agents in Settings → Team. Online teammates appear here automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {teammates.map((m) => (
                            <div
                              key={m.userId}
                              className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-brand-blue/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                  <div className="w-9 h-9 rounded-xl bg-brand-navy dark:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center">
                                    {m.name?.[0]?.toUpperCase() || 'A'}
                                  </div>
                                  <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${STATUS_META[m.status].dot}`}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                                    {m.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {formatRoleBadge(m.role)} · #{m.userCode}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                                  m.status === 'online'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50'
                                    : m.status === 'busy'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${STATUS_META[m.status].dot}`}
                                />
                                {STATUS_META[m.status].label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : history.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-brand-navy dark:text-white">
                    No calls recorded yet
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Completed, missed, and rejected CRM calls save automatically here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => {
                    const isMissed = ['missed', 'rejected', 'timeout', 'failed'].includes(
                      item.status,
                    );
                    const targetPeer = presenceRoster.find(
                      (p) => p.userId === item.peerId,
                    );
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isMissed
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                                : item.direction === 'incoming'
                                  ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300'
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {isMissed ? (
                              <PhoneMissed className="w-4 h-4" />
                            ) : item.direction === 'incoming' ? (
                              <PhoneIncoming className="w-4 h-4" />
                            ) : (
                              <PhoneOutgoing className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                              {item.peerName}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span className="capitalize">{item.status}</span>
                              <span>·</span>
                              <span>{formatCallTimestamp(item.startedAt)}</span>
                              {item.durationSeconds > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                                    {formatCallDuration(item.durationSeconds)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            callState !== 'idle' ||
                            (isAdminViewer ? targetPeer?.status !== 'online' : myStatus === 'offline') ||
                            !socketConnected
                          }
                          onClick={() =>
                            void handlers?.initiateCall({
                              id: item.peerId,
                              name: item.peerName,
                              role: formatRoleBadge(item.peerRole),
                              userCode: item.peerUserCode,
                            })
                          }
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 text-slate-500 disabled:opacity-40 transition-colors"
                          title="Call Again"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ─── 2. INCOMING CALL POPUP (CALLKIT MODAL) ──────────────────────── */}
      {callState === 'ringing_incoming' && activeCall && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-sm rounded-[32px] overflow-hidden border border-white/20 shadow-[0_32px_90px_-12px_rgba(0,0,0,0.65)] text-white"
            style={{
              background:
                'linear-gradient(155deg, #091224 0%, #14274E 50%, #0D3A58 100%)',
            }}
          >
            <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-sky-400/20 blur-3xl" />

            <div className="h-1.5 w-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-1000"
                style={{ width: `${ringProgressPct}%` }}
              />
            </div>

            <div className="relative z-10 p-7 text-center space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/35 text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Incoming CRM Call · {ringSecondsLeft}s
                </span>

                <button
                  type="button"
                  onClick={() => setRingtoneMuted((v) => !v)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  title={ringtoneMuted ? 'Unmute Ringtone' : 'Silence Ringtone'}
                >
                  {ringtoneMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-sky-400/20 animate-pulse" />
                <div
                  className="relative w-[88px] h-[88px] rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl ring-2 ring-white/30"
                  style={{
                    background:
                      'linear-gradient(135deg, #3978EA 0%, #10B981 100%)',
                  }}
                >
                  {activeCall.peer.name?.[0]?.toUpperCase() || 'A'}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight text-white">
                  {activeCall.peer.name}
                </h3>
                <p className="text-xs font-semibold text-sky-200">
                  {activeCall.peer.role}
                </p>
                {activeCall.peer.userCode && (
                  <p className="font-mono text-[11px] text-slate-300">
                    UID #{activeCall.peer.userCode}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handlers?.rejectIncomingCall()}
                  className="py-3.5 px-4 rounded-2xl bg-rose-500/90 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Decline</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handlers?.acceptIncomingCall()}
                  className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/35 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Phone className="w-5 h-5 animate-bounce" />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. OUTGOING DIALER / LIVE ACTIVE CALL WIDGET ─────────────────── */}
      {activeCall && callState !== 'ringing_incoming' && callState !== 'idle' && (
        <div className="fixed bottom-5 right-5 z-50">
          {isMinimized ? (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#091224] text-white border border-white/15 shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate max-w-[140px]">
                  {activeCall.peer.name}
                </div>
                <div className="text-[10px] font-mono text-emerald-300">
                  {callState === 'connected'
                    ? formatCallDuration(activeCall.durationSec)
                    : callState === 'ringing_outgoing'
                      ? `Ringing ${ringSecondsLeft}s`
                      : 'Connecting...'}
                </div>
              </div>

              {callState === 'connected' && (
                <button
                  type="button"
                  onClick={() => handlers?.toggleMute()}
                  className={`p-2 rounded-full transition-colors ${
                    activeCall.isMuted
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={activeCall.isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {activeCall.isMuted ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Expand Call Window"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => void handlers?.endCall()}
                className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white"
                title="End Call"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              className="w-[330px] sm:w-[356px] rounded-[28px] overflow-hidden text-white shadow-[0_28px_70px_-15px_rgba(9,18,36,0.75)] border border-white/15"
              style={{
                background:
                  'linear-gradient(155deg, #091224 0%, #132345 55%, #173463 100%)',
              }}
            >
              <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callState === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : callState === 'ended'
                          ? 'bg-rose-400'
                          : 'bg-sky-400 animate-ping'
                    }`}
                  />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                    {callState === 'ringing_outgoing'
                      ? `Calling · Ringing ${ringSecondsLeft}s`
                      : callState === 'connecting'
                        ? 'Connecting Two-Way Audio...'
                        : callState === 'connected'
                          ? 'Two-Way Audio Live'
                          : activeCall.endReason || 'Call Ended'}
                  </span>
                </div>
                {callState !== 'ended' && (
                  <button
                    type="button"
                    onClick={() => setMinimized(true)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
                    title="Minimize to Floating Pill"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {callState === 'ringing_outgoing' && (
                <div className="h-1 w-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${ringProgressPct}%` }}
                  />
                </div>
              )}

              <div className="p-5 space-y-5">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    {callState === 'ringing_outgoing' && (
                      <span className="absolute -inset-1 rounded-2xl bg-sky-400/30 animate-ping" />
                    )}
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ring-2 ring-white/20"
                      style={{
                        background:
                          'linear-gradient(135deg, #3978EA 0%, #06B6D4 100%)',
                      }}
                    >
                      {activeCall.peer.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-extrabold text-white truncate">
                      {activeCall.peer.name}
                    </h4>
                    <div className="text-[11px] text-slate-300 truncate">
                      {activeCall.peer.role}
                      {activeCall.peer.userCode ? ` · #${activeCall.peer.userCode}` : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {callState === 'connected' ? (
                        <>
                          <span className="font-mono text-sm font-black text-emerald-300">
                            {formatCallDuration(activeCall.durationSec)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              activeCall.isReconnecting
                                ? 'bg-amber-400/20 text-amber-200 animate-pulse'
                                : 'bg-emerald-400/15 text-emerald-300'
                            }`}
                          >
                            <Wifi className="w-3 h-3" />
                            {activeCall.isReconnecting
                              ? 'Reconnecting network...'
                              : activeCall.icePath === 'turn_relay'
                                ? `TURN Relay${activeCall.relayProtocol ? ` (${activeCall.relayProtocol.toUpperCase()})` : ''}`
                                : 'Direct P2P'}
                            {!activeCall.isReconnecting && activeCall.rttMs > 0
                              ? ` · ${activeCall.rttMs}ms`
                              : ''}
                          </span>
                        </>
                      ) : callState === 'ended' ? (
                        <span className="text-xs font-bold text-rose-300">
                          {activeCall.endReason}
                          {activeCall.durationSec > 0
                            ? ` · ${formatCallDuration(activeCall.durationSec)}`
                            : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-sky-200">
                          {callState === 'ringing_outgoing'
                            ? 'Waiting for agent to answer...'
                            : 'Negotiating WebRTC ICE & audio...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {callState === 'connected' && (
                  <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 h-6">
                      {[45, 80, 60, 95, 50, 85, 70, 100, 55, 90, 65, 75, 45, 60].map(
                        (h, idx) => (
                          <span
                            key={idx}
                            className={`w-1 rounded-full transition-all duration-300 ${
                              isAudioFlowing
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-slate-500/60'
                            }`}
                            style={{
                              height: isAudioFlowing ? `${h}%` : '22%',
                              animationDelay: `${idx * 75}ms`,
                            }}
                          />
                        ),
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {activeCall.isMuted
                        ? 'Your Mic Muted'
                        : activeCall.peerMuted
                          ? 'Peer Mic Muted'
                          : 'HD Audio Live'}
                    </span>
                  </div>
                )}

                {inCallKeypad && callState === 'connected' && (
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-black/25 border border-white/10">
                    {DIALPAD_KEYS.map((k) => (
                      <button
                        key={k.digit}
                        type="button"
                        onClick={() => playDtmfTone(k.digit)}
                        className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white active:scale-95"
                      >
                        {k.digit}
                      </button>
                    ))}
                  </div>
                )}

                {callState !== 'ended' && (
                  <div className="space-y-3">
                    {callState === 'connected' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlers?.toggleMute()}
                          className={`py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold border transition-all ${
                            activeCall.isMuted
                              ? 'bg-rose-500 border-rose-400 text-white'
                              : 'bg-white/10 border-white/10 hover:bg-white/15 text-slate-200'
                          }`}
                        >
                          {activeCall.isMuted ? (
                            <MicOff className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                          <span>{activeCall.isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInCallKeypad((v) => !v)}
                          className={`py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold border transition-all ${
                            inCallKeypad
                              ? 'bg-brand-blue border-sky-400 text-white'
                              : 'bg-white/10 border-white/10 hover:bg-white/15 text-slate-200'
                          }`}
                        >
                          <Grid3X3 className="w-4 h-4" />
                          <span>Keypad</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void handlers?.endCall()}
                      className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-extrabold shadow-lg shadow-rose-600/30 inline-flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>
                        {callState === 'ringing_outgoing'
                          ? 'Cancel Call'
                          : 'End Call'}
                      </span>
                    </button>
                  </div>
                )}

                {callState === 'ended' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 py-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Call log saved to workspace history</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

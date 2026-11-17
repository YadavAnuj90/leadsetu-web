'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Mic,
  MicOff,
  Search,
  Delete,
  Clock,
  Users,
  Sparkles,
  Wifi,
  ShieldCheck,
  Loader2,
  Volume2,
  RefreshCw,
  Copy,
  Check,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { playDtmfTone } from '@/lib/call-sound';
import {
  fetchUserCallAnalyticsApi,
  type UserCallAnalyticsItem,
} from '@/lib/calls-api';
import RoundCallMetricRing from '@/components/calling/RoundCallMetricRing';
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

const PRESENCE_STYLES: Record<
  AgentPresenceStatus,
  { label: string; dot: string; badge: string }
> = {
  online: {
    label: 'Online',
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50',
  },
  busy: {
    label: 'In Call / Busy',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

function formatRoleLabel(role?: string) {
  if (role === 'manager') return 'Sales Manager';
  if (role === 'agent') return 'Sales Agent';
  if (role === 'owner') return 'Workspace Owner';
  if (role === 'admin') return 'Workspace Admin';
  return role || 'Agent';
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function CrmPhonePage() {
  const { user, tenant } = useAuth();
  const {
    socketConnected,
    myStatus,
    dialInput,
    callState,
    activeCall,
    ringSecondsLeft,
    presenceRoster,
    history,
    historyStats,
    loadingHistory,
    handlers,
    setDialInput,
    appendDialDigit,
    backspaceDialDigit,
  } = useCallUiStore();

  const [search, setSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<
    'all' | 'online' | 'busy' | 'offline'
  >('all');
  const [historyFilter, setHistoryFilter] = useState<
    'all' | 'outgoing' | 'incoming' | 'missed'
  >('all');
  const [historySearch, setHistorySearch] = useState('');
  const [micState, setMicState] = useState<'unchecked' | 'granted' | 'denied'>(
    'unchecked',
  );
  const [myAnalytics, setMyAnalytics] = useState<UserCallAnalyticsItem | null>(
    null,
  );
  const [userAnalytics, setUserAnalytics] = useState<UserCallAnalyticsItem[]>(
    [],
  );
  const [isAdminAnalytics, setIsAdminAnalytics] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const isAdminViewer = ['owner', 'admin', 'super_admin'].includes(
    user?.role || '',
  );

  useEffect(() => {
    void handlers?.refreshHistory(historyFilter);
  }, [historyFilter, handlers]);

  useEffect(() => {
    let active = true;
    fetchUserCallAnalyticsApi()
      .then((res) => {
        if (!active) return;
        setMyAnalytics(res.myStats || null);
        setUserAnalytics(Array.isArray(res.users) ? res.users : []);
        setIsAdminAnalytics(Boolean(res.isAdminView));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [history.length]);

  const { onlineCount, busyCount, offlineCount } = useMemo(() => {
    let online = 0;
    let busy = 0;
    let offline = 0;
    for (const member of presenceRoster) {
      if (member.status === 'online') online += 1;
      else if (member.status === 'busy') busy += 1;
      else offline += 1;
    }
    return { onlineCount: online, busyCount: busy, offlineCount: offline };
  }, [presenceRoster]);

  const teammates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return presenceRoster.filter((m) => {
      if (rosterStatusFilter !== 'all' && m.status !== rosterStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.userCode || '').includes(q) ||
        (m.territory || '').toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [presenceRoster, search, rosterStatusFilter]);

  const recentPeers = useMemo(() => {
    const seen = new Set<string>();
    const list: CallPeerInfo[] = [];
    for (const item of history) {
      const code = (item.peerUserCode || '').trim();
      const key = item.peerId || code;
      if (!key || !code || seen.has(key)) continue;
      seen.add(key);
      list.push({
        id: item.peerId,
        name: item.peerName,
        role: formatRoleLabel(item.peerRole),
        userCode: code,
      });
      if (list.length >= 3) break;
    }
    return list;
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (item) =>
        (item.peerName || '').toLowerCase().includes(q) ||
        (item.peerUserCode || '').toLowerCase().includes(q),
    );
  }, [history, historySearch]);

  const selectedMatch = useMemo(() => {
    if (!isAdminViewer) return null;
    const clean = dialInput.trim();
    if (!clean) return null;
    return (
      presenceRoster.find(
        (m) => m.userCode === clean || m.userCode.endsWith(clean),
      ) || null
    );
  }, [dialInput, presenceRoster, isAdminViewer]);

  const handleDialCall = () => {
    const clean = dialInput.replace(/^#/, '').trim();
    if (!clean || callState !== 'idle' || !socketConnected) return;
    if (selectedMatch) {
      const peer: CallPeerInfo = {
        id: selectedMatch.userId,
        name: selectedMatch.name,
        role: formatRoleLabel(selectedMatch.role),
        userCode: selectedMatch.userCode,
        territory: selectedMatch.territory,
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

  const handleCopyOwnUid = () => {
    const code = user?.userCode;
    if (!code || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(code).then(() => {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 1800);
    });
  };

  const handleVerifyMic = async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setMicState('denied');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState('granted');
    } catch {
      setMicState('denied');
    }
  };

  const companyDisplay = tenant?.companyName?.trim() || 'CRM Voice Network';

  const totalMetric = myAnalytics?.totalCalls ?? historyStats.total;
  const answeredMetric = myAnalytics?.answeredCalls ?? historyStats.answered;
  const missedMetric = myAnalytics?.missedCalls ?? historyStats.missed;
  const answerRatePct =
    myAnalytics?.answerRatePct ??
    (totalMetric > 0 ? Math.round((answeredMetric / totalMetric) * 100) : 0);
  const totalTalkSec = myAnalytics?.totalDurationSeconds ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-10">
      {/* ─── SECTION A: TOP VOICE COMMAND HERO ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-white/10"
        style={{
          background:
            'linear-gradient(135deg, #091224 0%, #15284E 50%, #1E4EAD 100%)',
        }}
      >
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg ring-2 ring-white/25"
                style={{
                  background:
                    'linear-gradient(135deg, #3978EA 0%, #10B981 100%)',
                }}
              >
                <PhoneCall className="w-7 h-7" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0F1E3B] ${PRESENCE_STYLES[myStatus].dot}`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  {socketConnected
                    ? 'Live Signaling Connected'
                    : 'Connecting Voice Signaling...'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-400/15 border border-sky-300/25 text-[10px] font-extrabold uppercase tracking-wider text-sky-100">
                  {isAdminViewer ? 'Admin Workspace Desk' : 'Personal Agent Desk'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Internal Agent Voice Desk
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-200">
                <span>
                  Agent: <strong className="text-white">{user?.name || 'User'}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyOwnUid}
                  className="inline-flex items-center gap-1.5 font-mono text-sky-200 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/15 transition-colors"
                  title="Copy your 10-digit Extension UID"
                >
                  <span>Ext #{user?.userCode || '—'}</span>
                  {copiedUid ? (
                    <Check className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-80" />
                  )}
                </button>
                <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> {companyDisplay}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center rounded-2xl p-1 bg-white/10 border border-white/15 backdrop-blur-sm">
              {(['online', 'busy', 'offline'] as AgentPresenceStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={callState !== 'idle'}
                    onClick={() => handlers?.setPresence(st)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all disabled:opacity-60 ${
                      myStatus === st
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${PRESENCE_STYLES[st].dot}`}
                    />
                    {st === 'online'
                      ? 'Online'
                      : st === 'busy'
                        ? 'Busy'
                        : 'Offline'}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={handleVerifyMic}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 transition-all ${
                micState === 'granted'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : micState === 'denied'
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {micState === 'denied' ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              <span>
                {micState === 'granted'
                  ? 'Mic Ready'
                  : micState === 'denied'
                    ? 'Mic Blocked'
                    : 'Test Mic'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION B: TOP SUMMARY & CIRCULAR RING ANALYTICS STRIP ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Card: Personal Call Performance */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-blue" />
                My Call Summary
              </h2>
              <p className="text-[11px] text-slate-400">
                Your personal answered, missed &amp; talk time metrics
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Live Personal Telemetry
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="grid grid-cols-4 gap-3 sm:gap-5 flex-1">
              <RoundCallMetricRing
                label="Total"
                value={totalMetric}
                tone="blue"
                size="md"
              />
              <RoundCallMetricRing
                label="Answered"
                value={answeredMetric}
                total={totalMetric}
                tone="emerald"
                size="md"
              />
              <RoundCallMetricRing
                label="Missed"
                value={missedMetric}
                total={totalMetric}
                tone="rose"
                size="md"
              />
              <RoundCallMetricRing
                label="Avg Time"
                value={historyStats.avgDurationSec > 0 ? 1 : 0}
                displayText={formatCallDuration(historyStats.avgDurationSec)}
                tone="indigo"
                size="md"
              />
            </div>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-2.5 md:w-52 shrink-0">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Answer Rate
                </span>
                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {answerRatePct}%
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Talk Time
                </span>
                <span className="text-xs font-mono font-black text-brand-navy dark:text-white">
                  {formatCallDuration(totalTalkSec)}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Out / In
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {myAnalytics?.outgoingCalls ?? 0} Out ·{' '}
                  {myAnalytics?.incomingCalls ?? 0} In
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Role-Adaptive Workspace / Extension Card */}
        {isAdminViewer ? (
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-blue" />
                Workspace Live Presence
              </h2>
              <p className="text-[11px] text-slate-400">
                Real-time availability across workspace teammates
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-center">
                <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {onlineCount}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                  Online
                </div>
              </div>
              <div className="rounded-2xl p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-center">
                <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
                  {busyCount}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  Busy
                </div>
              </div>
              <div className="rounded-2xl p-3 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="text-xl font-mono font-black text-slate-600 dark:text-slate-300">
                  {offlineCount}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Offline
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Monitor live agent Online, Busy, and Offline availability across
              your workspace in real time.
            </p>
          </div>
        ) : (
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  My Voice Extension
                </h2>
                <p className="text-[11px] text-slate-400">
                  Direct UID routing &amp; status privacy
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${PRESENCE_STYLES[myStatus].badge}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${PRESENCE_STYLES[myStatus].dot}`}
                />
                {PRESENCE_STYLES[myStatus].label}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your 10-Digit UID #
                </div>
                <div className="text-lg font-mono font-black text-brand-navy dark:text-white tracking-wider truncate">
                  #{user?.userCode || '—'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyOwnUid}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-blue text-xs font-bold text-brand-navy dark:text-white inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedUid ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Copy UID</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Only your own status is visible to you. Share your 10-digit UID #
              with teammates or enter theirs on the dialpad to connect.
            </p>
          </div>
        )}
      </div>

      {/* ─── SECTION C: MAIN PHONE WORKSPACE (3-COL ADMIN / 2-COL PRIVATE USER) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* COLUMN 1: Outgoing Softphone */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-blue" />
                Outgoing Softphone
              </h2>
              <p className="text-[11px] text-slate-400">
                Enter a teammate 10-digit UID # to place a voice call
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-sky-300 shrink-0">
              WebRTC Audio
            </span>
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {activeCall && callState !== 'idle' ? (
              <div className="rounded-2xl bg-slate-950 text-white p-5 space-y-4 border border-slate-800 my-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                  <span>
                    {callState === 'connected'
                      ? 'Two-Way Audio Live'
                      : callState === 'ringing_outgoing'
                        ? `Ringing (${ringSecondsLeft}s)`
                        : callState === 'ringing_incoming'
                          ? 'Incoming Ring...'
                          : callState === 'connecting'
                            ? 'Connecting...'
                            : activeCall.endReason || 'Ended'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Wifi className="w-3 h-3" />
                    {activeCall.icePath === 'turn_relay' ? 'TURN' : 'Direct'}
                  </span>
                </div>

                <div className="text-center py-2 space-y-1">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg">
                    {activeCall.peer.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="text-base font-extrabold pt-2">
                    {activeCall.peer.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeCall.peer.role}
                  </div>
                  {callState === 'connected' && (
                    <div className="font-mono text-2xl font-black text-emerald-400 pt-1">
                      {formatCallDuration(activeCall.durationSec)}
                    </div>
                  )}
                </div>

                {callState === 'connected' && (
                  <button
                    type="button"
                    onClick={() => handlers?.toggleMute()}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                      activeCall.isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {activeCall.isMuted ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    {activeCall.isMuted ? 'Unmute Mic' : 'Mute Mic'}
                  </button>
                )}

                {callState !== 'ended' && (
                  <button
                    type="button"
                    onClick={() => void handlers?.endCall()}
                    className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    {callState === 'ringing_outgoing' ? 'Cancel Call' : 'End Call'}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={dialInput}
                        onChange={(e) => setDialInput(e.target.value)}
                        placeholder="Enter Agent UID #"
                        className="w-full bg-transparent text-xl font-mono font-black tracking-wider text-brand-navy dark:text-white placeholder:text-sm placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none"
                      />
                      {selectedMatch && (
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                          {selectedMatch.name} (
                          {PRESENCE_STYLES[selectedMatch.status].label})
                        </div>
                      )}
                    </div>
                    {dialInput && (
                      <button
                        type="button"
                        onClick={backspaceDialDigit}
                        className="p-2 rounded-xl text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                        title="Backspace"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 justify-items-center py-1">
                    {DIALPAD_KEYS.map((k) => (
                      <button
                        key={k.digit}
                        type="button"
                        onClick={() => {
                          playDtmfTone(k.digit);
                          appendDialDigit(k.digit);
                        }}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-blue hover:bg-brand-light/50 dark:hover:bg-slate-800 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xs"
                      >
                        <span className="text-lg font-black text-brand-navy dark:text-white leading-none">
                          {k.digit}
                        </span>
                        {k.letters && (
                          <span className="text-[8px] font-bold tracking-widest text-slate-400 mt-1">
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
                      (selectedMatch ? selectedMatch.status !== 'online' : false) ||
                      callState !== 'idle' ||
                      myStatus === 'offline' ||
                      !socketConnected
                    }
                    onClick={handleDialCall}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Phone className="w-4 h-4" />
                    <span>
                      {myStatus === 'offline'
                        ? 'Go Online to Place Calls'
                        : selectedMatch
                          ? selectedMatch.status === 'online'
                            ? `Call ${selectedMatch.name}`
                            : `${selectedMatch.name} is ${PRESENCE_STYLES[selectedMatch.status].label}`
                          : dialInput.trim()
                            ? `Call UID #${dialInput.replace(/^#/, '').trim()}`
                            : 'Enter Agent UID'}
                    </span>
                  </button>
                </div>

                {recentPeers.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <PhoneForwarded className="w-3 h-3 text-brand-blue" />
                      Quick Fill Recent UID
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentPeers.map((peer) => (
                        <button
                          key={peer.id || peer.userCode}
                          type="button"
                          onClick={() => setDialInput(peer.userCode || '')}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-blue text-[11px] font-bold text-brand-navy dark:text-slate-200 transition-colors truncate max-w-full"
                          title={`Fill UID #${peer.userCode}`}
                        >
                          {peer.name} ·{' '}
                          <span className="font-mono text-brand-blue dark:text-sky-400">
                            #{peer.userCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* COLUMN 2: Live Workspace Agents Directory (Owner / Admin only) */}
        {isAdminViewer && (
          <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-blue" />
                  Team Roster ({teammates.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Real-time workspace online / busy / offline status
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 shrink-0">
                {onlineCount} Online
              </span>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agent name, UID #, or territory..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'online', 'busy', 'offline'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRosterStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize transition-colors ${
                      rosterStatusFilter === st
                        ? 'bg-brand-navy text-white dark:bg-brand-blue'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-2.5 flex-1 max-h-[440px] overflow-y-auto">
              {teammates.length === 0 ? (
                <div className="min-h-[300px] py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-brand-navy dark:text-white">
                    No matching teammates found
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Invite workspace members in Settings → Team or adjust your
                    search and status filters.
                  </p>
                </div>
              ) : (
                teammates.map((m) => (
                  <div
                    key={m.userId}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5 hover:border-brand-blue/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-brand-navy dark:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center">
                            {m.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${PRESENCE_STYLES[m.status].dot}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {formatRoleLabel(m.role)}
                            {m.territory ? ` · ${m.territory}` : ''}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            UID #{m.userCode}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${PRESENCE_STYLES[m.status].badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${PRESENCE_STYLES[m.status].dot}`}
                          />
                          {PRESENCE_STYLES[m.status].label}
                        </span>
                        {m.inCall && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">
                            On active call
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COLUMN 3: Persistent MongoDB Call History */}
        <div
          className={`${
            isAdminViewer ? 'lg:col-span-4' : 'lg:col-span-8'
          } rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full`}
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-blue" />
                Call History
              </h2>
              <p className="text-[11px] text-slate-400">
                Saved incoming, outgoing &amp; missed call logs
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handlers?.refreshHistory(historyFilter)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh call history"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'outgoing', 'incoming', 'missed'] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHistoryFilter(tab)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-colors ${
                      historyFilter === tab
                        ? 'bg-brand-navy text-white dark:bg-brand-blue'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by name or UID..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="p-4 space-y-2.5 flex-1 max-h-[440px] overflow-y-auto">
            {loadingHistory && history.length === 0 ? (
              <div className="min-h-[320px] flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                <span>Loading call history...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="min-h-[320px] py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-brand-navy dark:text-white">
                  {history.length === 0
                    ? 'No call records yet'
                    : 'No matching call records'}
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  {history.length === 0
                    ? 'Place a voice call using the softphone to record persistent call logs and audio telemetry here.'
                    : 'Try clearing the search query or switching the history filter tab.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isMissed = [
                  'missed',
                  'rejected',
                  'timeout',
                  'failed',
                ].includes(item.status);
                const peerPresence = presenceRoster.find(
                  (p) => p.userId === item.peerId,
                );
                const isTurn =
                  item.connection?.turnUsed ||
                  item.connection?.icePath === 'turn_relay';
                const isDirect = item.connection?.icePath === 'direct';
                const canRedialTarget = Boolean(item.peerUserCode || item.peerId);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-brand-blue/35 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                            {item.peerName}
                          </span>
                          {item.peerUserCode && (
                            <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-300">
                              UID #{item.peerUserCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                          <span className="capitalize font-semibold">
                            {item.status}
                          </span>
                          <span>·</span>
                          <span>{formatTime(item.startedAt)}</span>
                          {item.durationSeconds > 0 && (
                            <>
                              <span>·</span>
                              <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                                {formatCallDuration(item.durationSeconds)}
                              </span>
                            </>
                          )}
                          {isTurn ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                              TURN
                            </span>
                          ) : isDirect ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                              Direct
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        !canRedialTarget ||
                        callState !== 'idle' ||
                        myStatus === 'offline' ||
                        (isAdminViewer && peerPresence?.status !== 'online') ||
                        !socketConnected
                      }
                      onClick={() =>
                        void handlers?.initiateCall({
                          id: item.peerId,
                          name: item.peerName,
                          role: formatRoleLabel(item.peerRole),
                          userCode: item.peerUserCode,
                        })
                      }
                      className={`${
                        isAdminViewer
                          ? 'p-2 rounded-xl'
                          : 'px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 text-[11px] font-bold'
                      } bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors shrink-0`}
                      title={
                        isAdminViewer
                          ? peerPresence?.status === 'online'
                            ? 'Call Again'
                            : 'Agent offline or busy'
                          : 'Call Again'
                      }
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {!isAdminViewer && <span>Redial</span>}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION D: ADMIN USER-WISE CALL ANALYTICS (SMALL ROUND RINGS) ───── */}
      {isAdminViewer && isAdminAnalytics && (
        <div className="rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-blue" />
                User-Wise Call Analytics
              </h2>
              <p className="text-[11px] text-slate-400">
                Per-user Total, Answered, Missed &amp; talk duration metrics
                across your workspace
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-sky-300 text-[10px] font-extrabold">
              {userAnalytics.length}{' '}
              {userAnalytics.length === 1 ? 'User' : 'Users'} Tracked
            </span>
          </div>

          {userAnalytics.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No workspace user call analytics yet.
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {userAnalytics.map((item) => (
                <div
                  key={item.userId}
                  className="rounded-2xl bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 hover:border-brand-blue/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-navy dark:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        {item.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {formatRoleLabel(item.role)} · UID #{item.userCode}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.answerRatePct}% Answer
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Talk {formatCallDuration(item.totalDurationSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-around pt-3 border-t border-slate-200/70 dark:border-slate-800">
                    <RoundCallMetricRing
                      label="Total"
                      value={item.totalCalls}
                      tone="blue"
                      size="sm"
                    />
                    <RoundCallMetricRing
                      label="Answered"
                      value={item.answeredCalls}
                      total={item.totalCalls}
                      tone="emerald"
                      size="sm"
                    />
                    <RoundCallMetricRing
                      label="Missed"
                      value={item.missedCalls}
                      total={item.totalCalls}
                      tone="rose"
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

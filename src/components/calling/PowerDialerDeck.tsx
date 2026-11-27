'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  PhoneForwarded,
  PhoneMissed,
  PhoneOff,
  Play,
  RefreshCw,
  SkipForward,
  Sparkles,
  Square,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  fetchPowerQueueApi,
  submitPowerDialOutcomeApi,
  type PowerDialDisposition,
  type PowerQueueLeadItem,
  type PowerQueueResponse,
} from '@/lib/calls-api';
import { getErrorMessage } from '@/lib/api-client';
import { formatCallDuration } from '@/store/call-ui.store';
import PreCallContextCard from '@/components/calling/PreCallContextCard';

interface PowerDialerDeckProps {
  onOutcomeLogged?: () => Promise<void> | void;
}

const DISPOSITION_BUTTONS: Array<{
  id: PowerDialDisposition;
  label: string;
  hint: string;
  tone: string;
  iconClass: string;
  icon: typeof Phone;
}> = [
  {
    id: 'interested',
    label: 'Interested',
    hint: 'Qualify + AI 85',
    tone: 'bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30',
    iconClass: 'text-emerald-600 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  {
    id: 'rnr',
    label: 'RNR (No Answer)',
    hint: '#1 +2h · #2 WA',
    tone: 'bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30',
    iconClass: 'text-amber-600 dark:text-amber-300',
    icon: PhoneMissed,
  },
  {
    id: 'busy',
    label: 'Busy',
    hint: 'Auto-Retry',
    tone: 'bg-orange-50/80 hover:bg-orange-100/80 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-500/30',
    iconClass: 'text-orange-600 dark:text-orange-300',
    icon: PhoneOff,
  },
  {
    id: 'callback',
    label: 'Callback',
    hint: 'Schedule Time',
    tone: 'bg-blue-50/80 hover:bg-blue-100/80 dark:bg-brand-blue/15 dark:hover:bg-brand-blue/25 text-brand-blue dark:text-sky-200 border-blue-200 dark:border-sky-500/30',
    iconClass: 'text-brand-blue dark:text-sky-300',
    icon: CalendarClock,
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    hint: 'Close Lost',
    tone: 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/15',
    iconClass: 'text-slate-500 dark:text-slate-400',
    icon: XCircle,
  },
  {
    id: 'dnd',
    label: 'DND',
    hint: 'Block Calls & WA',
    tone: 'bg-rose-50/80 hover:bg-rose-100/80 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/30',
    iconClass: 'text-rose-600 dark:text-rose-300',
    icon: Ban,
  },
];

export default function PowerDialerDeck({ onOutcomeLogged }: PowerDialerDeckProps) {
  const [queue, setQueue] = useState<PowerQueueLeadItem[]>([]);
  const [stats, setStats] = useState<PowerQueueResponse['stats']>({
    queueTotal: 0,
    dueNowCount: 0,
    freshCount: 0,
    rnrRetryPendingCount: 0,
    dndCount: 0,
    completedTodayCount: 0,
  });
  const [onlyDue, setOnlyDue] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<PowerDialDisposition | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const [dialingActive, setDialingActive] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [notes, setNotes] = useState('');
  const [callbackPickerOpen, setCallbackPickerOpen] = useState(false);
  const [callbackAt, setCallbackAt] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPowerQueueApi({ onlyDue, limit: 60 });
      setQueue(res.data || []);
      setStats(res.stats);
      setActiveIndex(0);
    } catch (err) {
      setToast({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [onlyDue]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!dialingActive) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [dialingActive]);

  const activeLead = queue[activeIndex] || null;

  const handleStartCall = () => {
    if (!activeLead) return;
    setElapsedSec(0);
    setDialingActive(true);
    if (typeof window !== 'undefined' && activeLead.phone) {
      const cleanTel = activeLead.phone.replace(/[^\d+]/g, '');
      window.location.href = `tel:${cleanTel}`;
    }
  };

  const handleStopTimer = () => {
    setDialingActive(false);
  };

  const handleSkipNext = () => {
    if (queue.length <= 1) return;
    setDialingActive(false);
    setElapsedSec(0);
    setNotes('');
    setCallbackPickerOpen(false);
    setActiveIndex((prev) => (prev + 1) % queue.length);
  };

  const submitOutcome = async (
    disposition: PowerDialDisposition,
    customCallbackIso?: string,
  ) => {
    if (!activeLead) return;
    setSubmitting(disposition);
    setToast(null);
    setDialingActive(false);
    try {
      const res = await submitPowerDialOutcomeApi({
        leadId: activeLead.id,
        disposition,
        durationSeconds: elapsedSec,
        notes: notes.trim() || undefined,
        callbackAt: customCallbackIso || undefined,
        sendWhatsAppOnRnr: true,
      });

      const parts: string[] = [`Logged ${disposition.toUpperCase()} for ${activeLead.name}`];
      if (res.retryAction.type === 'retry_1_2h') {
        parts.push('Retry #1 scheduled (+2 hrs)');
      } else if (res.retryAction.type === 'retry_2_next_day_whatsapp') {
        parts.push(
          res.retryAction.whatsappSent
            ? 'Retry #2 scheduled (Tomorrow) + Auto WhatsApp sent'
            : 'Retry #2 scheduled (Tomorrow)',
        );
      } else if (res.retryAction.type === 'callback_scheduled') {
        parts.push('Callback reminder scheduled');
      } else if (res.retryAction.type === 'qualified_hot') {
        parts.push('Promoted to Qualified (Hot)');
      } else if (res.retryAction.type === 'dnd_suppressed') {
        parts.push('Suppressed from calls & WhatsApp');
      }

      setToast({ type: 'ok', text: parts.join(' · ') });
      setElapsedSec(0);
      setNotes('');
      setCallbackPickerOpen(false);
      setCallbackAt('');

      if (autoAdvance) {
        const nextQueue = await fetchPowerQueueApi({ onlyDue, limit: 60 });
        setQueue(nextQueue.data || []);
        setStats(nextQueue.stats);
        setActiveIndex(0);
      } else {
        await loadQueue();
      }
      if (onOutcomeLogged) {
        await onOutcomeLogged();
      }
    } catch (err) {
      setToast({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setSubmitting(null);
    }
  };

  const handleDispositionClick = (disposition: PowerDialDisposition) => {
    if (disposition === 'callback') {
      const defaultIso = new Date(Date.now() + 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
      setCallbackAt(defaultIso);
      setCallbackPickerOpen((prev) => !prev);
      return;
    }
    void submitOutcome(disposition);
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
      {/* Header Strip */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-white/[0.02]">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">
            <Zap className="w-3.5 h-3.5" /> BPO &amp; Inside Sales Auto-Dialer
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
            <span>Power Dialer Queue &amp; Smart RNR Auto-Retry</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-blue/15 text-brand-blue">
              {stats.dueNowCount} Due Now
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setOnlyDue(true)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                onlyDue
                  ? 'bg-brand-navy text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Due &amp; Fresh
            </button>
            <button
              type="button"
              onClick={() => setOnlyDue(false)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                !onlyDue
                  ? 'bg-brand-navy text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Include Scheduled
            </button>
          </div>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="rounded border-slate-300 text-brand-blue"
            />
            Auto-Next Lead
          </label>

          <button
            type="button"
            onClick={() => void loadQueue()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-blue text-slate-600 dark:text-slate-300"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50/70 dark:bg-slate-900/40 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Due Retries</span>
          <span className="font-mono font-black text-amber-600">{stats.rnrRetryPendingCount}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Fresh Queue</span>
          <span className="font-mono font-black text-brand-blue">{stats.freshCount}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Dials Today</span>
          <span className="font-mono font-black text-emerald-600">{stats.completedTodayCount}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">DND Blocked</span>
          <span className="font-mono font-black text-rose-600">{stats.dndCount}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Cadence Rule</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">RNR #1 +2h → #2 WA</span>
        </div>
      </div>

      {toast && (
        <div
          className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between ${
            toast.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[11px] font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Active Lead Deck */}
      <div className="p-6">
        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
            Loading prioritized telecalling queue...
          </div>
        ) : !activeLead ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-sm font-extrabold text-brand-navy dark:text-white">
              All due calls in your queue are complete!
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Switch to &ldquo;Include Scheduled&rdquo; to preview upcoming RNR retries, or add/import new leads with phone numbers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Active Lead Profile & Call Trigger */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        activeLead.queueBucket === 'due_retry'
                          ? 'bg-amber-100 text-amber-800'
                          : activeLead.queueBucket === 'scheduled_later'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-brand-blue/15 text-brand-blue'
                      }`}
                    >
                      {activeLead.queueBucket === 'due_retry'
                        ? `Due Retry #${activeLead.rnrRetryCount}`
                        : activeLead.queueBucket === 'scheduled_later'
                          ? `Scheduled Retry #${activeLead.rnrRetryCount}`
                          : 'Fresh Lead'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Flame className="w-3 h-3 inline mr-0.5" />
                      AI {activeLead.aiScore}
                    </span>
                    {activeLead.lastCallOutcome && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-600 uppercase">
                        Prev: {activeLead.lastCallOutcome}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/leads/${activeLead.id}`}
                    className="block text-lg font-extrabold text-brand-navy dark:text-white hover:text-brand-blue truncate"
                  >
                    {activeLead.name}
                  </Link>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    {activeLead.company && <span>{activeLead.company}</span>}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-blue" /> {activeLead.city}
                    </span>
                    <span className="uppercase font-bold text-[10px]">{activeLead.source}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSkipNext}
                  disabled={queue.length <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:text-brand-navy disabled:opacity-40"
                  title="Skip to next lead in queue"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skip
                </button>
              </div>

              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Direct Mobile / WhatsApp
                  </div>
                  <div className="text-base font-mono font-black text-brand-navy dark:text-white">
                    {activeLead.phone}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {dialingActive ? (
                    <button
                      type="button"
                      onClick={handleStopTimer}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span className="font-mono">{formatCallDuration(elapsedSec)}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${activeLead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    title="Open WhatsApp Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {(activeLead.aiNextAction || activeLead.notes) && (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-brand-blue flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Call Brief
                  </div>
                  <p className="leading-relaxed">
                    {activeLead.notes || activeLead.aiNextAction}
                  </p>
                </div>
              )}

              <PreCallContextCard
                entityType="lead"
                entityId={activeLead.id}
                phone={activeLead.phone}
                variant="light"
              />
            </div>

            {/* Right: Notes + 1-Tap Disposition Strip + Queue Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    1-Click Call Disposition &amp; Auto-Retry
                  </label>
                  <span className="text-[11px] font-mono font-bold text-slate-500 inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-blue" />
                    Duration: {formatCallDuration(elapsedSec)}
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional quick call remarks (e.g. asked for brochure on WhatsApp, budget ₹45k)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-brand-navy dark:text-white"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {DISPOSITION_BUTTONS.map((btn) => {
                    const Icon = btn.icon;
                    const busy = submitting === btn.id;
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        disabled={Boolean(submitting)}
                        onClick={() => handleDispositionClick(btn.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 disabled:opacity-60 ${btn.tone}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold leading-tight">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${btn.iconClass}`} />
                            <span>{btn.label}</span>
                          </span>
                          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                        </div>
                        <div className="text-[10.5px] opacity-80 pl-5">
                          {btn.id === 'rnr'
                            ? activeLead.rnrRetryCount >= 1
                              ? 'Attempt #2+: Next Day + Auto WA'
                              : 'Attempt #1: Retry +2 hrs'
                            : btn.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {callbackPickerOpen && (
                  <div className="p-3.5 rounded-2xl border border-brand-blue/30 bg-brand-light/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-brand-blue" />
                      <span className="text-xs font-bold text-brand-navy">Callback Time:</span>
                      <input
                        type="datetime-local"
                        value={callbackAt}
                        onChange={(e) => setCallbackAt(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(submitting)}
                      onClick={() =>
                        void submitOutcome(
                          'callback',
                          callbackAt ? new Date(callbackAt).toISOString() : undefined,
                        )
                      }
                      className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
                    >
                      Save Callback &amp; Next Lead
                    </button>
                  </div>
                )}
              </div>

              {/* Up Next Strip */}
              {queue.length > 1 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <PhoneForwarded className="w-3.5 h-3.5 text-brand-blue" /> Up Next in Queue ({queue.length - 1} waiting)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {queue
                      .slice(activeIndex + 1, activeIndex + 5)
                      .map((item, offset) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setDialingActive(false);
                            setElapsedSec(0);
                            setActiveIndex(activeIndex + 1 + offset);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-brand-blue text-xs font-semibold text-brand-navy dark:text-slate-200"
                        >
                          <span>{item.name}</span>
                          {item.rnrRetryCount > 0 && (
                            <span className="text-[10px] font-black text-amber-600">
                              RNR#{item.rnrRetryCount}
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

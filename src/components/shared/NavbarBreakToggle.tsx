'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Clock, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateMyAvailabilityApi } from '@/lib/team-api';

export type BreakTypeOption = 'Tea Break' | 'Coffee Break' | 'Casual Break';
export type BreakDurationMinutes = 10 | 15 | 20;

interface StoredBreakTimer {
  endAtMs: number;
  durationMin: BreakDurationMinutes;
  breakType: BreakTypeOption;
}

const BREAK_TYPES: Array<{
  value: BreakTypeOption;
  label: string;
  emoji: string;
  subtitle: string;
  activeClass: string;
  badgeClass: string;
}> = [
  {
    value: 'Coffee Break',
    label: 'Coffee Break',
    emoji: '☕',
    subtitle: 'Fresh brew & recharge',
    activeClass:
      'border-amber-400 bg-amber-50/90 text-amber-900 shadow-sm dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200',
    badgeClass:
      'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  },
  {
    value: 'Tea Break',
    label: 'Tea Break',
    emoji: '🍵',
    subtitle: 'Warm chai or green tea',
    activeClass:
      'border-emerald-400 bg-emerald-50/90 text-emerald-900 shadow-sm dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  {
    value: 'Casual Break',
    label: 'Casual Break',
    emoji: '🌿',
    subtitle: 'Quick stretch & breather',
    activeClass:
      'border-sky-400 bg-sky-50/90 text-sky-900 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-200',
    badgeClass:
      'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  },
];

const BREAK_DURATIONS: BreakDurationMinutes[] = [10, 15, 20];

function getStorageKey(userId?: string): string {
  return `leadsetu_break_timer_${userId || 'current'}`;
}

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatReturnClock(endAtMs: number): string {
  return new Date(endAtMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function RoundCoffeeCupIcon({
  active,
  size = 24,
}: {
  active: boolean;
  size?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const cupGradId = `cup-body-${uid}`;
  const cremaGradId = `cup-crema-${uid}`;
  const steamGradId = `cup-steam-${uid}`;
  const saucerGradId = `cup-saucer-${uid}`;
  const glowFilterId = `steam-glow-${uid}`;

  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-amber-400/35 dark:bg-amber-400/25 blur-[6px] animate-pulse"
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative overflow-visible"
      >
        <defs>
          <radialGradient id={cupGradId} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={active ? '#FFFBEB' : '#FFFFFF'} />
            <stop offset="55%" stopColor={active ? '#FDE68A' : '#E2E8F0'} />
            <stop offset="100%" stopColor={active ? '#D97706' : '#94A3B8'} />
          </radialGradient>

          <linearGradient id={cremaGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="55%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id={saucerGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={active ? '#F59E0B' : '#94A3B8'} />
            <stop offset="50%" stopColor={active ? '#FDE68A' : '#CBD5E1'} />
            <stop offset="100%" stopColor={active ? '#D97706' : '#94A3B8'} />
          </linearGradient>

          <linearGradient id={steamGradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop
              offset="0%"
              stopColor={active ? '#F59E0B' : '#F59E0B'}
              stopOpacity="0.95"
            />
            <stop
              offset="60%"
              stopColor={active ? '#FDE047' : '#FBBF24'}
              stopOpacity="0.85"
            />
            <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0.1" />
          </linearGradient>

          <filter
            id={glowFilterId}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur
              stdDeviation={active ? '1.6' : '0.9'}
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft glowing rising steam wisps */}
        <g filter={`url(#${glowFilterId})`}>
          <path
            d="M14.2 14.5 C12.4 11.4, 15.8 9.2, 13.8 5.6"
            stroke={`url(#${steamGradId})`}
            strokeWidth={active ? '2.1' : '1.7'}
            strokeLinecap="round"
            className="break-steam-1"
          />
          <path
            d="M19.2 13.8 C21.2 10.2, 17.6 7.8, 19.8 3.6"
            stroke={`url(#${steamGradId})`}
            strokeWidth={active ? '2.3' : '1.8'}
            strokeLinecap="round"
            className="break-steam-2"
          />
          <path
            d="M24.2 14.6 C22.5 11.6, 25.6 9.3, 23.8 5.9"
            stroke={`url(#${steamGradId})`}
            strokeWidth={active ? '2.0' : '1.6'}
            strokeLinecap="round"
            className="break-steam-3"
          />
        </g>

        {/* Rounded ceramic saucer base */}
        <ellipse
          cx="19"
          cy="34.2"
          rx="13.5"
          ry="2.8"
          fill={`url(#${saucerGradId})`}
          opacity={active ? 0.95 : 0.72}
        />

        {/* Round cup handle */}
        <path
          d="M28.6 19.6 C34.2 19.6, 34.4 27.4, 27.8 27.8"
          stroke={active ? '#F59E0B' : '#94A3B8'}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Plump round cup body */}
        <path
          d="M8.5 17.5 C8.5 29.2, 12.6 33.4, 19 33.4 C25.4 33.4, 29.5 29.2, 29.5 17.5 Z"
          fill={`url(#${cupGradId})`}
          stroke={active ? '#B45309' : '#64748B'}
          strokeWidth="1.2"
        />

        {/* Rounded cup rim & rich crema inside */}
        <ellipse
          cx="19"
          cy="17.5"
          rx="10.5"
          ry="3.1"
          fill={active ? '#FFFBEB' : '#F8FAFC'}
          stroke={active ? '#B45309' : '#64748B'}
          strokeWidth="1.2"
        />
        <ellipse
          cx="19"
          cy="17.7"
          rx="8.3"
          ry="2.0"
          fill={`url(#${cremaGradId})`}
        />

        {/* Subtle glossy highlight on round cup */}
        <path
          d="M11.6 21.3 C11.8 25.3, 13.0 28.4, 14.8 30.1"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      <style jsx>{`
        .break-steam-1 {
          animation: breakSteamFloat 2.4s ease-in-out infinite;
          transform-origin: center;
        }
        .break-steam-2 {
          animation: breakSteamFloat 2.1s ease-in-out 0.45s infinite;
          transform-origin: center;
        }
        .break-steam-3 {
          animation: breakSteamFloat 2.6s ease-in-out 0.9s infinite;
          transform-origin: center;
        }
        @keyframes breakSteamFloat {
          0% {
            opacity: 0.25;
            transform: translateY(2px) scaleY(0.92);
          }
          50% {
            opacity: 1;
            transform: translateY(-2.2px) scaleY(1.06);
          }
          100% {
            opacity: 0.2;
            transform: translateY(-4.2px) scaleY(0.94);
          }
        }
      `}</style>
    </span>
  );
}

export default function NavbarBreakToggle() {
  const { user, refreshProfile } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const completingRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] =
    useState<BreakTypeOption>('Coffee Break');
  const [selectedDuration, setSelectedDuration] =
    useState<BreakDurationMinutes>(15);
  const [activeBreak, setActiveBreak] = useState<StoredBreakTimer | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const storageKey = useMemo(() => getStorageKey(user?.id), [user?.id]);
  const isBreakEligibleRole =
    user?.role === 'manager' ||
    user?.role === 'agent' ||
    user?.role === 'support';

  // Restore saved active timer from localStorage when mounted or user changes
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setActiveBreak(null);
        return;
      }
      const parsed = JSON.parse(raw) as StoredBreakTimer;
      if (parsed && typeof parsed.endAtMs === 'number' && parsed.endAtMs > Date.now()) {
        setActiveBreak(parsed);
        setSelectedType(parsed.breakType);
        setSelectedDuration(parsed.durationMin);
      } else {
        window.localStorage.removeItem(storageKey);
        setActiveBreak(null);
      }
    } catch {
      setActiveBreak(null);
    }
  }, [storageKey, user?.id]);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const finishBreakAndResume = useCallback(
    async (clearTimerOnly = false) => {
      if (completingRef.current) return;
      completingRef.current = true;
      setSubmitting(true);
      setErrorMsg(null);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(storageKey);
        }
        setActiveBreak(null);
        if (!clearTimerOnly) {
          await updateMyAvailabilityApi({
            availabilityStatus: 'available',
            leaveNote: '',
          });
          await refreshProfile();
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to resume availability',
        );
      } finally {
        setSubmitting(false);
        completingRef.current = false;
      }
    },
    [refreshProfile, storageKey],
  );

  // Live 1-second tick & auto-resume when break countdown reaches 00:00
  useEffect(() => {
    if (!activeBreak) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= activeBreak.endAtMs) {
        window.clearInterval(id);
        void finishBreakAndResume(false);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeBreak, finishBreakAndResume]);

  // Keep local state clean if the user toggled themselves back to available from /profile
  useEffect(() => {
    if (
      activeBreak &&
      user?.availabilityStatus === 'available' &&
      !submitting
    ) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey);
      }
      setActiveBreak(null);
    }
  }, [activeBreak, storageKey, submitting, user?.availabilityStatus]);

  const startBreakWith = useCallback(
    async (type: BreakTypeOption, durationMin: BreakDurationMinutes) => {
      setSubmitting(true);
      setErrorMsg(null);
      try {
        const endAtMs = Date.now() + durationMin * 60_000;
        const note = `${type} (${durationMin} min · ends ${formatReturnClock(endAtMs)})`;
        await updateMyAvailabilityApi({
          availabilityStatus: 'away',
          leaveNote: note,
        });

        const timerPayload: StoredBreakTimer = {
          endAtMs,
          durationMin,
          breakType: type,
        };
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, JSON.stringify(timerPayload));
        }
        setSelectedType(type);
        setSelectedDuration(durationMin);
        setNowMs(Date.now());
        setActiveBreak(timerPayload);
        await refreshProfile();
        setOpen(false);
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Failed to turn on break mode',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [refreshProfile, storageKey],
  );

  // Listen for Ctrl+K Quick Actions to start or end break remotely (manager & sales user panels only)
  useEffect(() => {
    if (!isBreakEligibleRole) return;
    const onStartBreak = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{
          breakType?: BreakTypeOption;
          durationMin?: BreakDurationMinutes;
        }>
      ).detail;
      void startBreakWith(
        detail?.breakType || 'Coffee Break',
        detail?.durationMin || 15,
      );
    };
    const onEndBreak = () => {
      void finishBreakAndResume(false);
    };
    window.addEventListener('leadsetu:start-break', onStartBreak);
    window.addEventListener('leadsetu:end-break', onEndBreak);
    return () => {
      window.removeEventListener('leadsetu:start-break', onStartBreak);
      window.removeEventListener('leadsetu:end-break', onEndBreak);
    };
  }, [finishBreakAndResume, isBreakEligibleRole, startBreakWith]);

  if (!isBreakEligibleRole) {
    return null;
  }

  const handleStartBreak = () => startBreakWith(selectedType, selectedDuration);

  const remainingSeconds = activeBreak
    ? Math.max(0, Math.ceil((activeBreak.endAtMs - nowMs) / 1000))
    : 0;

  const progressPct = activeBreak
    ? Math.min(
        100,
        Math.max(
          0,
          (remainingSeconds / (activeBreak.durationMin * 60)) * 100,
        ),
      )
    : 0;

  const isUserAway =
    Boolean(activeBreak) || user?.availabilityStatus === 'away';
  const isUserOnLeave = user?.availabilityStatus === 'on_leave';
  const isOnBreakVisual = isUserAway || isUserOnLeave;

  const activeTypeMeta = BREAK_TYPES.find(
    (item) => item.value === (activeBreak?.breakType || selectedType),
  );

  const previewReturnClock = formatReturnClock(
    nowMs + selectedDuration * 60_000,
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setNowMs(Date.now());
          setOpen((prev) => !prev);
        }}
        title={
          activeBreak
            ? `${activeBreak.breakType} · ${formatCountdown(remainingSeconds)} left`
            : isUserAway
              ? 'Away / On Break (Click to manage)'
              : isUserOnLeave
                ? 'On Leave (Click to resume)'
                : 'Take a Tea, Coffee, or Casual Break'
        }
        aria-expanded={open}
        aria-label="Toggle Break Mode"
        className={`group h-9 flex items-center gap-2 rounded-xl border px-2.5 text-xs font-semibold transition-all duration-200 ${
          isOnBreakVisual
            ? 'border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/90 text-amber-900 shadow-xs shadow-amber-500/20 hover:border-amber-400 dark:border-amber-500/45 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-amber-500/20 dark:text-amber-200 dark:shadow-amber-900/20'
            : 'border-slate-200/85 bg-slate-100/85 text-slate-700 hover:border-amber-300 hover:bg-amber-50/70 hover:text-amber-900 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-200'
        }`}
      >
        <RoundCoffeeCupIcon active={isOnBreakVisual} size={24} />

        {activeBreak ? (
          <div className="flex items-center gap-1.5 pr-1">
            <span className="hidden md:inline text-[11px] font-bold tracking-tight">
              {activeBreak.breakType}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
        ) : isUserAway || isUserOnLeave ? (
          <span className="hidden sm:inline pr-1 text-[11px] font-bold">
            {isUserOnLeave ? 'On Leave' : 'On Break'}
          </span>
        ) : (
          <span className="hidden sm:inline pr-1 text-[11px] font-semibold">
            Break
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Break Mode Controls"
          className="fixed inset-x-3 top-[4.25rem] sm:inset-x-auto sm:absolute sm:top-full sm:right-0 lg:left-0 lg:right-auto sm:mt-2.5 w-auto sm:w-[336px] max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-slate-200/95 bg-white p-4 shadow-[0_24px_60px_-14px_rgba(2,6,23,0.45)] dark:border-white/[0.12] dark:bg-[#0D1628] z-[90]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 dark:bg-amber-500/10 dark:border-amber-500/30">
                <RoundCoffeeCupIcon active={true} size={30} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isOnBreakVisual ? 'You are On Break' : 'Take a Quick Break'}
                  </h3>
                  {isOnBreakVisual && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                      <Sparkles className="h-2.5 w-2.5" />
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pauses auto lead routing without logging you out
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close break popover"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Active Break Countdown Card */}
          {activeBreak ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/70 to-white p-3.5 dark:border-amber-500/30 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      activeTypeMeta?.badgeClass ||
                      'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
                    }`}
                  >
                    <span>{activeTypeMeta?.emoji || '☕'}</span>
                    {activeBreak.breakType}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <Clock className="h-3 w-3 text-amber-500" />
                    Ends {formatReturnClock(activeBreak.endAtMs)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                    {formatCountdown(remainingSeconds)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    of {activeBreak.durationMin} min break
                  </span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void finishBreakAndResume(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {submitting ? 'Resuming...' : 'End Break Early & Resume Leads'}
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3.5">
              {/* If user was already set Away / On Leave elsewhere, offer quick resume */}
              {(isUserAway || isUserOnLeave) && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200 truncate">
                    Status: {isUserOnLeave ? 'On Leave' : 'Away'}
                    {user?.leaveNote ? ` · ${user.leaveNote}` : ''}
                  </span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void finishBreakAndResume(false)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Resume
                  </button>
                </div>
              )}

              {/* Break Type Options */}
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Break Reason
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {BREAK_TYPES.map((option) => {
                    const isSelected = selectedType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedType(option.value)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? option.activeClass
                            : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">
                            {option.emoji}
                          </span>
                          <div>
                            <div className="text-xs font-bold leading-tight">
                              {option.label}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {option.subtitle}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timer Presets */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Timer Duration
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    <Clock className="h-3 w-3" />
                    Ends {previewReturnClock}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {BREAK_DURATIONS.map((mins) => {
                    const isSelected = selectedDuration === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSelectedDuration(mins)}
                        className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/25 dark:bg-amber-500 dark:text-slate-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-500/40'
                        }`}
                      >
                        {mins} min
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Break CTA */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleStartBreak()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:brightness-105 disabled:opacity-60 transition"
              >
                <span>
                  {submitting
                    ? 'Switching to Break...'
                    : `Start ${selectedType} · ${selectedDuration} min`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Users,
  PhoneCall,
  CheckSquare,
  LifeBuoy,
  Briefcase,
  FileClock,
  LogOut,
  Loader2,
  CheckCircle2,
  Coffee,
  CalendarOff,
  Save,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import {
  fetchMemberScorecardApi,
  updateMemberAvailabilityApi,
  revokeMemberSessionsApi,
  type UserScorecardResponse,
} from '@/lib/team-api';
import { getErrorMessage } from '@/lib/api-client';

interface Props {
  memberId: string | null;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const AVAIL_META = {
  available: {
    label: 'Available for Leads',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  away: {
    label: 'Away / Break',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  on_leave: {
    label: 'On Leave',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

export default function UserScorecardDrawer({
  memberId,
  canManage,
  onClose,
  onUpdated,
}: Props) {
  const [data, setData] = useState<UserScorecardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Availability form state
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'available' | 'away' | 'on_leave'
  >('available');
  const [shiftStart, setShiftStart] = useState('09:30');
  const [shiftEnd, setShiftEnd] = useState('19:30');
  const [leaveNote, setLeaveNote] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const loadScorecard = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMemberScorecardApi(memberId);
      setData(res);
      setAvailabilityStatus(res.member.availabilityStatus || 'available');
      setShiftStart(res.member.shiftStart || '09:30');
      setShiftEnd(res.member.shiftEnd || '19:30');
      setLeaveNote(res.member.leaveNote || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void loadScorecard();
  }, [loadScorecard]);

  if (!memberId) return null;

  const handleSaveAvailability = async () => {
    if (!memberId) return;
    setSavingAvail(true);
    setError(null);
    try {
      await updateMemberAvailabilityApi(memberId, {
        availabilityStatus,
        shiftStart,
        shiftEnd,
        leaveNote,
      });
      setToast('Shift & lead-routing availability updated cleanly.');
      await loadScorecard();
      onUpdated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingAvail(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!memberId) return;
    setRevoking(true);
    setError(null);
    try {
      const res = await revokeMemberSessionsApi(memberId);
      setToast(
        `All active sessions revoked (Session Version #${res.sessionVersion}).`,
      );
      await loadScorecard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRevoking(false);
    }
  };

  const m = data?.member;
  const sec = data?.security;
  const wl = data?.workload;
  const availMeta = AVAIL_META[availabilityStatus] || AVAIL_META.available;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
              User 360° Scorecard &amp; Security Audit
            </div>
            <h2 className="text-base font-extrabold truncate">
              {m ? `${m.name} · UID #${m.userCode || '—'}` : 'Loading Member...'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/60">
          {toast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
              <span className="text-xs font-semibold">
                Loading User 360° Scorecard &amp; Audit Events...
              </span>
            </div>
          ) : (
            data &&
            m &&
            sec &&
            wl && (
              <>
                {/* Security Posture Strip */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {sec.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> 2FA Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <ShieldAlert className="w-3.5 h-3.5" /> 2FA Not Enrolled
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Last Login:{' '}
                        {sec.lastLoginAt
                          ? new Date(sec.lastLoginAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Never'}
                      </span>

                      {sec.maskPhones && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <EyeOff className="w-3 h-3" /> Phones Masked
                        </span>
                      )}
                    </div>

                    {canManage && m.role !== 'owner' && (
                      <button
                        type="button"
                        disabled={revoking}
                        onClick={handleRevokeSessions}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                      >
                        {revoking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        Force Revoke Sessions (v{sec.sessionVersion})
                      </button>
                    )}
                  </div>

                  {/* AI Daily Quota Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-brand-navy">
                      <Sparkles className="w-4 h-4 text-brand-blue" />
                      <span>Daily SetuAI Usage:</span>
                    </div>
                    <div className="font-mono font-bold text-slate-700">
                      {m.aiCallsToday ?? 0} /{' '}
                      {m.aiDailyCallLimit ? m.aiDailyCallLimit : 'Unlimited'} calls
                    </div>
                  </div>
                </div>

                {/* Rep Shift & Leave Availability Control */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
                        Shift &amp; Lead Routing Availability
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Skip off-duty or on-leave reps in Lead Routing &amp; SLA Workflows without blocking CRM login
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${availMeta.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${availMeta.dot}`} />
                      {availMeta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => setAvailabilityStatus('available')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        availabilityStatus === 'available'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Available
                    </button>
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => setAvailabilityStatus('away')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        availabilityStatus === 'away'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5" /> Away / Break
                    </button>
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => setAvailabilityStatus('on_leave')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        availabilityStatus === 'on_leave'
                          ? 'bg-rose-50 border-rose-500 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <CalendarOff className="w-3.5 h-3.5" /> On Leave
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Shift Start
                      </label>
                      <input
                        type="time"
                        disabled={!canManage}
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Shift End
                      </label>
                      <input
                        type="time"
                        disabled={!canManage}
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Leave / Away Note
                      </label>
                      <input
                        type="text"
                        disabled={!canManage}
                        value={leaveNote}
                        onChange={(e) => setLeaveNote(e.target.value)}
                        placeholder="Optional status note"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={savingAvail}
                        onClick={handleSaveAvailability}
                        className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                      >
                        {savingAvail ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save Availability &amp; Shift
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Workload & SLA Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand-blue" /> Open Leads
                    </div>
                    <div className="text-xl font-extrabold text-brand-navy mt-1">
                      {wl.openLeadsCount}
                    </div>
                    <div className="text-[11px] text-amber-600 font-semibold">
                      {wl.newUncontactedLeadsCount} uncontacted (New)
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-emerald-600" /> Active Pipeline
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-1">
                      ₹{(wl.openPipelineInr || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {wl.wonDealsCount} won (₹
                      {(wl.wonRevenueInr || 0).toLocaleString('en-IN')})
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-violet-600" /> Avg SLA Response
                    </div>
                    <div className="text-xl font-extrabold text-brand-navy mt-1">
                      {wl.avgSlaResponseMinutes !== null
                        ? `${wl.avgSlaResponseMinutes} min`
                        : '—'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      First touch speed
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-indigo-600" /> Calls Logged
                    </div>
                    <div className="text-xl font-extrabold text-brand-navy mt-1">
                      {wl.calls.totalCalls}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {wl.calls.answeredCalls} answered · {wl.calls.missedCalls} missed
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3 text-sky-600" /> Pending Tasks
                    </div>
                    <div className="text-xl font-extrabold text-brand-navy mt-1">
                      {wl.pendingTasksCount}
                    </div>
                    <div className="text-[11px] text-slate-500">Open follow-ups</div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <LifeBuoy className="w-3 h-3 text-rose-600" /> Open SLA Tickets
                    </div>
                    <div className="text-xl font-extrabold text-brand-navy mt-1">
                      {wl.openTicketsCount}
                    </div>
                    <div className="text-[11px] text-slate-500">Assigned escalations</div>
                  </div>
                </div>

                {/* Recent Audit Events by/for this User */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileClock className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
                        Recent Audit Trail ({data.recentAuditEvents.length})
                      </h3>
                    </div>
                    <Link
                      href="/settings/audit"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                    >
                      <span>Full Audit Log</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {data.recentAuditEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No recent security or CRM audit events logged for this member.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {data.recentAuditEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-brand-navy">
                              {ev.action}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{ev.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}

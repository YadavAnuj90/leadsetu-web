'use client';

import { useState } from 'react';
import {
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Route,
} from 'lucide-react';
import {
  buildAiBeatPlanApi,
  type BeatPlanAiResult,
  type BeatStopInput,
} from '@/lib/ai-copilot-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';

interface FieldBeatPlannerModalProps {
  open: boolean;
  onClose: () => void;
  onTasksCreated?: () => Promise<void> | void;
}

const DEFAULT_STOPS: BeatStopInput[] = [
  {
    id: 'stop-1',
    dealerName: 'Bansal Steel & Infra Projects',
    areaCluster: 'Okhla Phase II',
    overdueInr: 448400,
    overdueDays: 18,
    openDealValueInr: 225000,
    daysSinceLastVisit: 14,
    urgentIssue: false,
  },
  {
    id: 'stop-2',
    dealerName: 'Apex Auto Components Ltd.',
    areaCluster: 'Gurugram Udyog Vihar',
    overdueInr: 0,
    overdueDays: 0,
    openDealValueInr: 708000,
    daysSinceLastVisit: 9,
    urgentIssue: true,
  },
  {
    id: 'stop-3',
    dealerName: 'RS Electricals & Switchgear',
    areaCluster: 'Noida Sector 62',
    overdueInr: 372000,
    overdueDays: 22,
    openDealValueInr: 180000,
    daysSinceLastVisit: 16,
    urgentIssue: false,
  },
  {
    id: 'stop-4',
    dealerName: 'Malhotra Modular Hardware',
    areaCluster: 'Noida Sector 62',
    overdueInr: 95000,
    overdueDays: 6,
    openDealValueInr: 315000,
    daysSinceLastVisit: 7,
    urgentIssue: false,
  },
];

export default function FieldBeatPlannerModal({
  open,
  onClose,
  onTasksCreated,
}: FieldBeatPlannerModalProps) {
  const [stops, setStops] = useState<BeatStopInput[]>(DEFAULT_STOPS);
  const [dateLabel, setDateLabel] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [plan, setPlan] = useState<BeatPlanAiResult | null>(null);

  if (!open) return null;

  const updateStop = (
    idx: number,
    patch: Partial<BeatStopInput>,
  ) => {
    setStops((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        dealerName: '',
        areaCluster: 'Noida Sector 63',
        overdueInr: 0,
        overdueDays: 0,
        openDealValueInr: 150000,
        daysSinceLastVisit: 5,
        urgentIssue: false,
      },
    ]);
  };

  const removeStop = (idx: number) => {
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerateBeatPlan = async () => {
    const validStops = stops.filter((s) => s.dealerName.trim().length > 0);
    if (validStops.length === 0) {
      setError('Add at least one dealer stop before generating a beat plan.');
      return;
    }
    setIsPlanning(true);
    setError(null);
    setToast(null);
    try {
      const res = await buildAiBeatPlanApi({
        dateLabel,
        stops: validStops,
      });
      setPlan(res.response?.structured || null);
      if (!res.response?.structured) {
        setError('Leadsetu AI Gateway returned no beat route plan.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSaveTasks = async () => {
    if (!plan || plan.orderedStops.length === 0) return;
    setIsSavingTasks(true);
    setError(null);
    setToast(null);
    try {
      await Promise.all(
        plan.orderedStops.map((stop) =>
          apiClient.post('/tasks', {
            title: `Beat #${stop.sequence}: ${stop.dealerName} (${stop.areaCluster})`,
            description: `[AI Field Beat · Score ${stop.priorityScore}] ${stop.visitObjective}`,
            priority:
              stop.priorityScore >= 55 || stop.urgentIssue
                ? 'high'
                : stop.priorityScore >= 30
                  ? 'medium'
                  : 'low',
            category: 'meeting',
            dueDate: dateLabel,
            relatedName: stop.dealerName,
            relatedCompany: stop.dealerName,
          }),
        ),
      );
      setToast(
        `Saved ${plan.orderedStops.length} prioritized beat visit tasks to CRM Tasks.`,
      );
      await onTasksCreated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingTasks(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-blue/15 text-brand-blue border border-brand-blue/30 mb-1.5">
              <Sparkles className="w-3 h-3" /> Pillar 3 AI · Field Sales Beat Route Planner
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-white">
              Prioritize Daily Dealer Visits by Cluster, Overdue Udhaar &amp; Deal Value
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Groups nearby industrial clusters first and ranks highest-ROI recovery &amp; deal visits.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close Beat Planner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date + Controls */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Beat Date
            </label>
            <input
              type="date"
              value={dateLabel}
              onChange={(e) => setDateLabel(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-brand-navy dark:text-white hover:border-brand-blue"
            >
              <Plus className="w-3.5 h-3.5 text-brand-blue" /> Add Dealer Stop
            </button>
            <button
              type="button"
              disabled={isPlanning}
              onClick={handleGenerateBeatPlan}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPlanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Route className="w-4 h-4" />
              )}
              <span>{isPlanning ? 'Optimizing Route...' : 'Generate Optimal Beat'}</span>
            </button>
          </div>
        </div>

        {/* Editable Dealer Stops */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {stops.map((stop, idx) => (
            <div
              key={stop.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50/70 dark:bg-[#111D33]/80"
            >
              <input
                type="text"
                value={stop.dealerName}
                onChange={(e) => updateStop(idx, { dealerName: e.target.value })}
                placeholder="Dealer / Company"
                className="sm:col-span-3 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={stop.areaCluster}
                onChange={(e) => updateStop(idx, { areaCluster: e.target.value })}
                placeholder="Cluster / Area"
                className="sm:col-span-2 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min={0}
                value={stop.overdueInr ?? 0}
                onChange={(e) =>
                  updateStop(idx, { overdueInr: Number(e.target.value) || 0 })
                }
                placeholder="Overdue ₹"
                title="Overdue Udhaar INR"
                className="sm:col-span-2 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min={0}
                value={stop.overdueDays ?? 0}
                onChange={(e) =>
                  updateStop(idx, { overdueDays: Number(e.target.value) || 0 })
                }
                placeholder="Overdue days"
                title="Overdue Days"
                className="sm:col-span-1 px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min={0}
                value={stop.openDealValueInr ?? 0}
                onChange={(e) =>
                  updateStop(idx, {
                    openDealValueInr: Number(e.target.value) || 0,
                  })
                }
                placeholder="Deal ₹"
                title="Open Deal Value INR"
                className="sm:col-span-2 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-slate-900 dark:text-white"
              />
              <label className="sm:col-span-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(stop.urgentIssue)}
                  onChange={(e) =>
                    updateStop(idx, { urgentIssue: e.target.checked })
                  }
                />
                Urgent
              </label>
              <button
                type="button"
                onClick={() => removeStop(idx)}
                className="sm:col-span-1 p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 justify-self-end"
                title="Remove stop"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {toast && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Ordered Beat Plan Output */}
        {plan && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/12">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Total Stops Scheduled
                </div>
                <div className="text-lg font-extrabold text-brand-navy dark:text-white">
                  {plan.totalStops} stops ({plan.dateLabel})
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-300">
                  Recoverable Udhaar on Route
                </div>
                <div className="text-lg font-extrabold text-amber-700 dark:text-amber-200">
                  ₹{Number(plan.totalRecoverableInr || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-300">
                  Active Deal Pipeline
                </div>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-200">
                  ₹{Number(plan.totalPipelineInr || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {plan.orderedStops.map((stop) => (
                <div
                  key={`${stop.id}-${stop.sequence}`}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#0B1426] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-blue text-white font-black text-xs flex items-center justify-center shrink-0">
                      #{stop.sequence}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-brand-navy dark:text-white">
                          {stop.dealerName}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/25">
                          <MapPin className="w-3 h-3" /> {stop.areaCluster}
                        </span>
                        {stop.urgentIssue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {stop.visitObjective}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Priority Score
                    </div>
                    <div className="text-base font-black text-brand-blue">
                      {stop.priorityScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSavingTasks}
                onClick={handleSaveTasks}
                className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingTasks ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CalendarPlus className="w-4 h-4" />
                )}
                <span>Save All Stops as CRM Tasks</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

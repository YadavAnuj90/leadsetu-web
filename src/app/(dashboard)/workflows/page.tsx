'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Workflow,
  Sparkles,
  Zap,
  MessageSquare,
  CheckCircle2,
  Plus,
  Play,
  Trash2,
  Search,
  Clock,
  Activity,
  Loader2,
  X,
  Filter,
  GitBranch,
  UserCheck,
  AlertTriangle,
  Pencil,
  FlaskConical,
  ListChecks,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import {
  fetchWorkflows,
  toggleWorkflowActive,
  executeWorkflowNow,
  runStaleLeadFollowUpsApi,
  deleteWorkflow,
  fetchWorkflowEnrollmentsApi,
  simulateWorkflowLeadApi,
  processDueDripsApi,
} from '@/lib/workflows-api';
import { getErrorMessage } from '@/lib/api-client';
import VisualWorkflowCanvasModal from '@/components/workflows/VisualWorkflowCanvasModal';
import type {
  WorkflowRule,
  WorkflowStats,
  WorkflowTriggerType,
  WorkflowStepNode,
  WorkflowEnrollmentItem,
} from '@/types/contracts';

const TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  'lead.created': 'New Lead Captured (IndiaMART / Meta / Webhook)',
  'lead.hot_scored': 'SetuAI Scores Lead >= 80 (Hot Buyer)',
  'lead.stale_followup': 'Lead Stays in New / Proposal Sent for X Hours',
  'deal.stage_changed': 'Deal Stage Moved in Kanban Pipeline',
  'invoice.overdue': 'GST Tax Invoice Passes Due Date',
  'whatsapp.inbound': 'Inbound Buyer Message on WhatsApp',
};

const TRIGGER_SHORT: Record<WorkflowTriggerType, string> = {
  'lead.created': 'New Lead Captured',
  'lead.hot_scored': 'AI Hot Lead (>= 80)',
  'lead.stale_followup': 'Stale Stage Follow-Up',
  'deal.stage_changed': 'Deal Stage Changed',
  'invoice.overdue': 'Overdue GST Invoice',
  'whatsapp.inbound': 'Inbound WhatsApp Reply',
};

function getNodeChipStyle(node: WorkflowStepNode) {
  if (node.kind === 'trigger') {
    return {
      cls: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 hover:border-amber-400',
      badge: 'TRIGGER',
      icon: <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
    };
  }
  if (node.kind === 'delay') {
    return {
      cls: 'bg-violet-50/90 dark:bg-violet-500/10 border-violet-200/80 dark:border-violet-500/30 text-violet-800 dark:text-violet-200 hover:border-violet-400',
      badge: 'DELAY',
      icon: <Clock className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300 shrink-0" />,
    };
  }
  if (node.kind === 'condition') {
    return {
      cls: 'bg-sky-50/90 dark:bg-sky-500/10 border-sky-200/80 dark:border-sky-500/30 text-sky-800 dark:text-sky-200 hover:border-sky-400',
      badge: 'IF',
      icon: <Filter className="w-3.5 h-3.5 text-sky-500 dark:text-sky-300 shrink-0" />,
    };
  }
  if (node.actionKind === 'reassign_rep') {
    return {
      cls: 'bg-teal-50/90 dark:bg-teal-500/10 border-teal-200/80 dark:border-teal-500/30 text-teal-800 dark:text-teal-200 hover:border-teal-400',
      badge: 'REASSIGN',
      icon: <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300 shrink-0" />,
    };
  }
  if (node.actionKind === 'create_sla_alert') {
    return {
      cls: 'bg-rose-50/90 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 hover:border-rose-400',
      badge: 'SLA',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-300 shrink-0" />,
    };
  }
  return {
    cls: 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:border-emerald-400',
    badge: 'ACTION',
    icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 shrink-0" />,
  };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    pausedWorkflows: 0,
    totalRuns: 0,
    totalHoursSaved: 0,
    activeEnrollments: 0,
  });

  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sweepingStale, setSweepingStale] = useState(false);
  const [processingDrips, setProcessingDrips] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Visual Canvas Modal State
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRule | null>(null);

  // Enrollments Drawer State
  const [enrollDrawerWf, setEnrollDrawerWf] = useState<WorkflowRule | null>(null);
  const [enrollments, setEnrollments] = useState<WorkflowEnrollmentItem[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchWorkflows({
        search: search.trim() || undefined,
        triggerType: triggerFilter,
        active: activeFilter,
      });
      setWorkflows(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, triggerFilter, activeFilter]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const openCreateCanvas = () => {
    setEditingWorkflow(null);
    setCanvasOpen(true);
  };

  const openEditCanvas = (wf: WorkflowRule) => {
    setEditingWorkflow(wf);
    setCanvasOpen(true);
  };

  const openEnrollmentsDrawer = async (wf: WorkflowRule) => {
    setEnrollDrawerWf(wf);
    setLoadingEnrollments(true);
    try {
      const res = await fetchWorkflowEnrollmentsApi(wf.id);
      setEnrollments(res.enrollments || []);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleRunStaleFollowUps = async () => {
    setSweepingStale(true);
    setErrorMsg(null);
    try {
      const res = await runStaleLeadFollowUpsApi({ forceImmediate: true });
      showToast(
        res.followUpsSent > 0
          ? `Dispatched ${res.followUpsSent} automated WhatsApp follow-up(s) across ${res.workflowsProcessed} rule(s)!`
          : `Checked ${res.workflowsProcessed} stale follow-up rule(s) — all eligible leads are already followed up.`,
      );
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSweepingStale(false);
    }
  };

  const handleProcessDueDrips = async () => {
    setProcessingDrips(true);
    setErrorMsg(null);
    try {
      const res = await processDueDripsApi({ forceAdvance: true });
      showToast(
        `Processed ${res.processed} drip enrollment(s): ${res.completed} completed, ${res.stoppedOnReply} auto-stopped on buyer reply.`,
      );
      await loadWorkflows();
      if (enrollDrawerWf) {
        const ref = await fetchWorkflowEnrollmentsApi(enrollDrawerWf.id);
        setEnrollments(ref.enrollments || []);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setProcessingDrips(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    setIsMutating(true);
    try {
      const updated = await toggleWorkflowActive(id);
      showToast(
        `"${updated.name}" is now ${updated.active ? 'Active' : 'Paused'}.`,
      );
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setTogglingId(null);
      setIsMutating(false);
    }
  };

  const handleExecuteNow = async (wf: WorkflowRule) => {
    setRunningId(wf.id);
    try {
      await executeWorkflowNow(wf.id);
      showToast(
        `Executed "${wf.name}" — Actions dispatched & logged cleanly!`,
      );
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setRunningId(null);
    }
  };

  const handleSimulateFullFlow = async (wf: WorkflowRule) => {
    setSimulatingId(wf.id);
    setErrorMsg(null);
    try {
      const res = await simulateWorkflowLeadApi(wf.id, { forceAdvance: true });
      showToast(
        `Simulated "${res.enrollment.leadName}" through ${res.enrollment.stepLogs.length} visual steps (Status: ${res.enrollment.status.toUpperCase()})!`,
      );
      await loadWorkflows();
      await openEnrollmentsDrawer(wf);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSimulatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
      }, 4000);
      return;
    }
    setConfirmDeleteId(null);
    setIsMutating(true);
    try {
      await deleteWorkflow(id);
      showToast('Visual workflow deleted.');
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-12">
      {/* ─── SECTION A: COMPACT EXECUTIVE WORKFLOW HEADER ─────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-blue dark:text-sky-400">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Automation Engine · Trigger → Condition → Delay → Action</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy dark:text-white">
            Visual Workflows &amp; WhatsApp Drips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Automate multi-step Hinglish WhatsApp drip sequences, 10-minute Speed-to-Lead SLA escalations, backup rep rotation, and auto-stop-on-reply flows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={processingDrips}
            onClick={handleProcessDueDrips}
            className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl bg-white dark:bg-[#0D1628] border border-violet-200 dark:border-violet-500/35 hover:border-violet-400 text-violet-700 dark:text-violet-300 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            {processingDrips ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Advance Due Drips</span>
          </button>

          <button
            type="button"
            disabled={sweepingStale}
            onClick={handleRunStaleFollowUps}
            className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl bg-white dark:bg-[#0D1628] border border-emerald-200 dark:border-emerald-500/35 hover:border-emerald-400 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            {sweepingStale ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>Run Stale Sweeps</span>
          </button>

          <button
            type="button"
            onClick={openCreateCanvas}
            className="h-10 btn-primary-brand inline-flex items-center gap-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Visual Flow</span>
          </button>
        </div>
      </div>

      {/* Toast & Error Alerts */}
      {toastMsg && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />
            {toastMsg}
          </span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 rounded-lg hover:bg-emerald-200/50 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="px-4 py-3 rounded-2xl bg-rose-50/90 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-200 flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg hover:bg-rose-200/50 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── SECTION B: KPI METRIC CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Visual Flows
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-sky-300 flex items-center justify-center shrink-0">
              <Workflow className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-brand-navy dark:text-white">
            {stats.activeWorkflows}{' '}
            <span className="text-xs sm:text-sm font-bold text-slate-400">
              / {stats.totalWorkflows} Total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Live on IndiaMART, Meta &amp; Webhooks
          </p>
        </div>

        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Executions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-brand-navy dark:text-white">
            {stats.totalRuns.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Drips, reassignments &amp; SLA alerts
          </p>
        </div>

        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Drip Queue
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-violet-600 dark:text-violet-300">
            {stats.activeEnrollments || 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Leads waiting on delay timers
          </p>
        </div>

        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rep Hours Saved
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.totalHoursSaved} hrs
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Auto-stopped when buyer replies
          </p>
        </div>
      </div>

      {/* ─── SECTION C: UNIFIED FILTER & SEARCH BAR ───────────────────────────── */}
      <div className="rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Status Segmented Tabs */}
        <div className="inline-flex items-center rounded-xl p-1 bg-slate-100 dark:bg-[#081020] border border-slate-200/70 dark:border-white/[0.07] self-start">
          {(
            [
              { id: 'all', label: `All Flows (${stats.totalWorkflows})` },
              { id: 'true', label: `Active (${stats.activeWorkflows})` },
              { id: 'false', label: `Paused (${stats.pausedWorkflows})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-white dark:bg-[#1B2B4B] text-brand-navy dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Trigger Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-2xl justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flows by name, condition, or action..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-brand-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-blue"
            />
          </div>

          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
          >
            <option value="all">All Event Triggers</option>
            <option value="lead.created">New Lead Captured</option>
            <option value="lead.hot_scored">Hot Lead Scored (AI &gt;= 80)</option>
            <option value="lead.stale_followup">Stale Lead Follow-Up</option>
            <option value="deal.stage_changed">Deal Stage Changed</option>
            <option value="invoice.overdue">Overdue GST Invoice</option>
            <option value="whatsapp.inbound">Inbound WhatsApp Reply</option>
          </select>
        </div>
      </div>

      {/* ─── SECTION D: VISUAL WORKFLOW CARDS ─────────────────────────────────── */}
      {isLoading ? (
        <div className="rounded-3xl p-14 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <p className="text-xs font-semibold">
            Loading Visual Workflows &amp; Drip Sequences...
          </p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="rounded-3xl p-12 sm:p-16 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-sky-300 flex items-center justify-center mx-auto">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-brand-navy dark:text-white">
              No Visual Workflows Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Launch the Visual Flow Builder to create a 10-minute Speed-to-Lead rescue or Hinglish WhatsApp drip sequence.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateCanvas}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Open Visual Flow Builder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((wf) => {
            const nodes = wf.nodes || [];
            const isToggling = togglingId === wf.id;
            return (
              <div
                key={wf.id}
                className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-brand-blue/40 transition-all space-y-4"
              >
                {/* Card Top Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3.5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        wf.active
                          ? 'bg-brand-blue/10 dark:bg-brand-blue/20 border-brand-blue/25 text-brand-blue dark:text-sky-300'
                          : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-400'
                      }`}
                    >
                      <GitBranch className="w-5 h-5" />
                      {wf.active && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0D1628]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-brand-navy dark:text-white leading-snug">
                          {wf.name}
                        </h3>
                        {wf.stopOnReply !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            Auto-Stop on Reply
                          </span>
                        )}
                      </div>

                      {wf.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-3xl">
                          {wf.description}
                        </p>
                      )}

                      {/* Trigger & Metric Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 text-amber-800 dark:text-amber-300 font-bold"
                          title={TRIGGER_LABELS[wf.triggerType] || wf.triggerType}
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          {TRIGGER_SHORT[wf.triggerType] || wf.triggerType}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 font-bold tabular-nums">
                          {wf.runsCount} runs
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
                          {wf.hoursSaved} hrs saved
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-bold tabular-nums">
                          {wf.activeEnrollmentsCount || 0} waiting
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
                          {wf.completedEnrollmentsCount || 0} completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active / Paused Switch Pill */}
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => handleToggle(wf.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all disabled:opacity-50 ${
                        wf.active
                          ? 'bg-emerald-50/90 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/35 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-brand-navy dark:hover:text-white'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : wf.active ? (
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <PauseCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{wf.active ? 'Active' : 'Paused'}</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Visual Node Canvas Strip */}
                {nodes.length > 0 && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-[#081020]/90 border border-slate-200/80 dark:border-white/[0.06] overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-max">
                      {nodes.map((node, i) => {
                        const style = getNodeChipStyle(node);
                        return (
                          <div key={node.id} className="flex items-center gap-2">
                            {i > 0 && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={() => openEditCanvas(wf)}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:-translate-y-0.5 ${style.cls}`}
                              title="Open step inside Visual Flow Builder"
                            >
                              <span className="w-4 h-4 rounded-md bg-white/80 dark:bg-black/25 text-[10px] font-black flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              {style.icon}
                              <span className="whitespace-nowrap">{node.title}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Latest Run Banner */}
                {wf.executionLogs && wf.executionLogs.length > 0 && (
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        Latest Run:
                      </strong>{' '}
                      {wf.executionLogs[0].summary}
                    </span>
                  </div>
                )}

                {/* Footer Action Toolbar */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditCanvas(wf)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-brand-navy dark:text-white text-xs font-bold transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-blue dark:text-sky-300" />
                      <span>Edit Flow ({nodes.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateFullFlow(wf)}
                      disabled={simulatingId === wf.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {simulatingId === wf.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FlaskConical className="w-3.5 h-3.5" />
                      )}
                      <span>Simulate Flow</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEnrollmentsDrawer(wf)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-500/30 text-xs font-bold transition-colors"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Enrollments &amp; Logs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecuteNow(wf)}
                      disabled={runningId === wf.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light dark:bg-brand-blue/20 hover:bg-brand-blue hover:text-white text-brand-blue dark:text-sky-300 dark:hover:text-white border border-blue-200/70 dark:border-brand-blue/35 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {runningId === wf.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>Run Now</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(wf.id)}
                    disabled={isMutating}
                    className={`self-end sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                      confirmDeleteId === wf.id
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                    }`}
                    title="Delete Workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDeleteId === wf.id && <span>Confirm Delete</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Canvas Modal */}
      {canvasOpen && (
        <VisualWorkflowCanvasModal
          open={canvasOpen}
          editingWorkflow={editingWorkflow}
          onClose={() => setCanvasOpen(false)}
          onSaved={async (_saved, isNew) => {
            setCanvasOpen(false);
            showToast(
              isNew
                ? 'Visual Workflow saved & activated!'
                : 'Visual Workflow updated cleanly!',
            );
            await loadWorkflows();
          }}
        />
      )}

      {/* Live Drip Enrollments & Step-by-Step Logs Modal */}
      {enrollDrawerWf && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#0D1628] rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-brand-navy dark:bg-[#081020] border-b border-white/10 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold">
                  Drip Enrollments &amp; Step Execution Logs
                </h3>
                <p className="text-[11px] text-slate-300 truncate max-w-md">
                  {enrollDrawerWf.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnrollDrawerWf(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50 dark:bg-[#081020]/60">
              {loadingEnrollments ? (
                <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                  <span>Loading enrollments...</span>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="bg-white dark:bg-[#0D1628] rounded-2xl p-8 text-center border border-slate-200 dark:border-white/[0.08] space-y-3">
                  <Sparkles className="w-7 h-7 text-brand-blue mx-auto" />
                  <div className="text-xs font-bold text-brand-navy dark:text-white">
                    No Leads Enrolled Yet
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Click <strong>Simulate Flow</strong> on this workflow card to run a test lead through every Trigger, Delay, Condition, and WhatsApp/SLA step.
                  </p>
                </div>
              ) : (
                enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="bg-white dark:bg-[#0D1628] rounded-2xl p-4 border border-slate-200/80 dark:border-white/[0.08] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-2.5">
                      <div>
                        <div className="text-xs font-extrabold text-brand-navy dark:text-white">
                          {enr.leadName}{' '}
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-normal">
                            ({enr.leadPhone || 'No Phone'})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Source: {enr.leadSource || 'webhook'}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          enr.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            : enr.status === 'stopped_on_reply'
                              ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300'
                              : enr.status === 'active'
                                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {enr.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {enr.stepLogs.map((sl, idx) => (
                        <div
                          key={`${sl.nodeId}-${idx}`}
                          className="flex items-start justify-between gap-3 text-[11px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-100 dark:border-white/[0.06]"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-brand-navy dark:text-white">
                              {idx + 1}. {sl.title}
                            </span>
                            <div className="text-slate-600 dark:text-slate-300 mt-0.5 break-words">
                              {sl.detail}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              sl.status === 'success'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : sl.status === 'scheduled'
                                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {sl.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

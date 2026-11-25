'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Workflow,
  ArrowLeft,
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

function getNodeChipStyle(node: WorkflowStepNode) {
  if (node.kind === 'trigger') {
    return {
      cls: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <Zap className="w-3 h-3 text-amber-500 shrink-0" />,
    };
  }
  if (node.kind === 'delay') {
    return {
      cls: 'bg-violet-50 border-violet-200 text-violet-800',
      icon: <Clock className="w-3 h-3 text-violet-600 shrink-0" />,
    };
  }
  if (node.kind === 'condition') {
    return {
      cls: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: <Filter className="w-3 h-3 text-sky-600 shrink-0" />,
    };
  }
  if (node.actionKind === 'reassign_rep') {
    return {
      cls: 'bg-teal-50 border-teal-200 text-teal-800',
      icon: <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />,
    };
  }
  if (node.actionKind === 'create_sla_alert') {
    return {
      cls: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />,
    };
  }
  return {
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />,
  };
}

export default function WorkflowsPage() {
  const router = useRouter();

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
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
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
    setIsMutating(true);
    try {
      await deleteWorkflow(id);
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <GitBranch className="w-3.5 h-3.5" /> Visual No-Code Trigger → Condition → Delay → Action Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Visual Workflows &amp; WhatsApp Drips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Build multi-step Hinglish WhatsApp drip sequences, 10-minute uncontacted Speed-to-Lead SLA escalations, backup rep reassignment, and auto-stop-on-reply flows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={processingDrips}
            onClick={handleProcessDueDrips}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-violet-300 bg-violet-50 hover:bg-violet-100 text-violet-800 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {processingDrips ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Advance Due Drips
          </button>

          <button
            type="button"
            disabled={sweepingStale}
            onClick={handleRunStaleFollowUps}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {sweepingStale ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            Run Stale Sweeps
          </button>

          <button
            type="button"
            onClick={openCreateCanvas}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> Open Visual Flow Builder
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {toastMsg}
          </span>
          <button type="button" onClick={() => setToastMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Active Visual Flows</span>
            <Workflow className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.activeWorkflows}{' '}
            <span className="text-sm font-bold text-slate-400">
              / {stats.totalWorkflows} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Listening to live IndiaMART, Meta &amp; Webhook events
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Executions</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.totalRuns.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            WhatsApp drips, rep reassignments &amp; SLA alerts
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Active Drip Queue</span>
            <Activity className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-extrabold text-violet-700 mt-2">
            {stats.activeEnrollments || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Leads currently waiting on delay timers
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Rep Hours Saved</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {stats.totalHoursSaved} hrs
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-stopped whenever buyer replies
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visual flows by name, trigger condition, or action..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="all">All Event Triggers</option>
            <option value="lead.created">New Lead Captured</option>
            <option value="lead.hot_scored">Hot Lead Scored (AI &gt;= 80)</option>
            <option value="lead.stale_followup">Stale Lead Follow-Up</option>
            <option value="deal.stage_changed">Deal Stage Changed</option>
            <option value="invoice.overdue">Overdue GST Invoice</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Paused Only</option>
          </select>
        </div>
      </div>

      {/* Workflows Visual Cards */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <p className="text-xs font-semibold">
            Loading Visual Workflows &amp; Drip Sequences...
          </p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center mx-auto">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-brand-navy">
              No Visual Workflows Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Launch the Visual Flow Builder to set up a 10-minute Speed-to-Lead rescue or Hinglish WhatsApp drip sequence.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateCanvas}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-bold text-white"
          >
            + Open Visual Flow Builder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {workflows.map((wf) => {
            const nodes = wf.nodes || [];
            return (
              <div
                key={wf.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 hover:border-brand-blue/40 transition-all"
              >
                {/* Top Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        wf.active
                          ? 'bg-brand-light text-brand-blue'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base text-brand-navy">
                          {wf.name}
                        </h3>
                        {wf.stopOnReply !== false && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Auto-Stop on Reply
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {wf.runsCount} runs
                        </span>
                        <span>·</span>
                        <span>{wf.hoursSaved} hrs saved</span>
                        <span>·</span>
                        <span className="text-violet-700 font-bold">
                          {wf.activeEnrollmentsCount || 0} waiting in drip
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 font-bold">
                          {wf.completedEnrollmentsCount || 0} completed
                        </span>
                        <span>·</span>
                        <span>
                          Trigger: {TRIGGER_LABELS[wf.triggerType] || wf.triggerType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(wf.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 ${
                      wf.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {wf.active ? '● Active' : '○ Paused'}
                  </button>
                </div>

                {/* Visual Pipeline Strip */}
                {nodes.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-max">
                      {nodes.map((node, i) => {
                        const style = getNodeChipStyle(node);
                        return (
                          <div key={node.id} className="flex items-center gap-2">
                            {i > 0 && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={() => openEditCanvas(wf)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition hover:shadow-xs ${style.cls}`}
                            >
                              {style.icon}
                              <span>{node.title}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Latest Execution Log */}
                {wf.executionLogs && wf.executionLogs.length > 0 && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                    <span className="truncate">
                      <strong className="text-emerald-700">Latest Run:</strong>{' '}
                      {wf.executionLogs[0].summary}
                    </span>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditCanvas(wf)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy text-xs font-bold transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-blue" />
                      Edit Visual Flow ({nodes.length} steps)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateFullFlow(wf)}
                      disabled={simulatingId === wf.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                    >
                      {simulatingId === wf.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FlaskConical className="w-3.5 h-3.5" />
                      )}
                      Simulate Full Flow (1-Click)
                    </button>

                    <button
                      type="button"
                      onClick={() => openEnrollmentsDrawer(wf)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold transition"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      Drip Enrollments &amp; Logs
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecuteNow(wf)}
                      disabled={runningId === wf.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-light hover:bg-brand-blue hover:text-white text-brand-blue text-xs font-bold transition"
                    >
                      {runningId === wf.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Run Now
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(wf.id)}
                    disabled={isMutating}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div>
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
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
              {loadingEnrollments ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading enrollments...
                </div>
              ) : enrollments.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
                  <Sparkles className="w-7 h-7 text-brand-blue mx-auto" />
                  <div className="text-xs font-bold text-brand-navy">
                    No Leads Enrolled Yet
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Click <strong>Simulate Full Flow (1-Click)</strong> to run a test lead through every Trigger, Delay, Condition, and WhatsApp/SLA step.
                  </p>
                </div>
              ) : (
                enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="text-xs font-extrabold text-brand-navy">
                          {enr.leadName}{' '}
                          <span className="font-mono text-slate-500 font-normal">
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
                            ? 'bg-emerald-100 text-emerald-800'
                            : enr.status === 'stopped_on_reply'
                              ? 'bg-sky-100 text-sky-800'
                              : enr.status === 'active'
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {enr.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {enr.stepLogs.map((sl, idx) => (
                        <div
                          key={`${sl.nodeId}-${idx}`}
                          className="flex items-start justify-between gap-3 text-[11px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div>
                            <span className="font-bold text-brand-navy">
                              {idx + 1}. {sl.title}
                            </span>
                            <div className="text-slate-600 mt-0.5">{sl.detail}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              sl.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700'
                                : sl.status === 'scheduled'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-amber-100 text-amber-700'
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

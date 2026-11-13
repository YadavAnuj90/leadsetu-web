'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
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
  Database,
  Search,
  Clock,
  Activity,
  Loader2,
  X,
  Filter,
} from 'lucide-react';
import {
  fetchWorkflows,
  createWorkflow,
  toggleWorkflowActive,
  executeWorkflowNow,
  deleteWorkflow,
  seedWorkflows,
} from '@/lib/workflows-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  WorkflowRule,
  WorkflowStats,
  WorkflowTriggerType,
  WorkflowActionType,
} from '@/types/contracts';

const TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  'lead.created': 'New Lead Captured (IndiaMART / WhatsApp / Meta)',
  'lead.hot_scored': 'Gemini AI Scores Lead >= 80 (Hot Buyer)',
  'deal.stage_changed': 'Deal Stage Moved in Kanban Pipeline',
  'invoice.overdue': 'GST Tax Invoice Passes Due Date',
  'whatsapp.inbound': 'Inbound Buyer Message on WhatsApp',
};

const ACTION_PRESETS: Record<
  WorkflowActionType,
  { label: string; defaultSummary: string }
> = {
  send_whatsapp_create_task: {
    label: 'WhatsApp Template + Follow-up Task',
    defaultSummary:
      'Send Hinglish Product Catalogue PDF on WhatsApp + Create 15-Min Call Reminder Task',
  },
  assign_senior_closer: {
    label: 'Assign Senior Closer + Priority Alert',
    defaultSummary:
      'Assign to Senior Closer + Create High-Priority Call Task + Send WhatsApp Alert',
  },
  generate_gst_invoice: {
    label: 'Auto-Generate 18% GST Invoice Draft',
    defaultSummary:
      'Generate 18% CGST/SGST or IGST Tax Invoice + Share Razorpay Link on WhatsApp',
  },
  send_payment_reminder: {
    label: 'Send WhatsApp Razorpay Payment Nudge',
    defaultSummary:
      'Send Polite Hinglish Payment Reminder with Razorpay Link + Notify Accounts Team',
  },
};

export default function WorkflowsPage() {
  const router = useRouter();

  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    pausedWorkflows: 0,
    totalRuns: 0,
    totalHoursSaved: 0,
  });

  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] =
    useState<WorkflowTriggerType>('lead.created');
  const [conditionSummary, setConditionSummary] = useState(
    'Lead Source IN [IndiaMART, WhatsApp] AND City = Noida / Delhi-NCR',
  );
  const [actionType, setActionType] = useState<WorkflowActionType>(
    'send_whatsapp_create_task',
  );
  const [actionSummary, setActionSummary] = useState(
    ACTION_PRESETS.send_whatsapp_create_task.defaultSummary,
  );

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
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleActionTypeChange = (nextType: WorkflowActionType) => {
    setActionType(nextType);
    setActionSummary(ACTION_PRESETS[nextType].defaultSummary);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsMutating(true);
    setErrorMsg(null);
    try {
      await createWorkflow({
        name: name.trim(),
        description: description.trim(),
        triggerType,
        conditionSummary: conditionSummary.trim(),
        actionType,
        actionSummary: actionSummary.trim(),
        active: true,
      });
      setModalOpen(false);
      setName('');
      setDescription('');
      showToast('New AI Workflow saved & activated in MongoDB!');
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
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
        `Executed "${wf.name}" — Follow-up task created in /tasks & logged!`,
      );
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setRunningId(null);
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

  const handleSeed = async () => {
    setIsMutating(true);
    try {
      await seedWorkflows();
      showToast('Seeded 4 B2B AI Workflows into MongoDB!');
      await loadWorkflows();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            <Sparkles className="w-3.5 h-3.5" /> Zero-Code IF-THIS-THEN-THAT CRM Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            AI Workflows &amp; Auto-Routing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automatically trigger WhatsApp replies, create follow-up tasks, and generate 18% GST invoices whenever leads or deals change.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeed}
            disabled={isMutating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            ) : (
              <Database className="w-4 h-4 text-brand-blue" />
            )}
            Seed 4 Sample Workflows
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Automation Rule
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
            <span>Active Automations</span>
            <Workflow className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.activeWorkflows}{' '}
            <span className="text-sm font-bold text-slate-400">
              / {stats.totalWorkflows} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Listening to live MongoDB events
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Workflow Runs</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.totalRuns.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auto-triggered on lead &amp; deal events
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Sales Rep Hours Saved</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {stats.totalHoursSaved} hrs
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Eliminated manual data entry &amp; follow-ups
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Avg Response SLA</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            14 sec
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instant WhatsApp &amp; task creation speed
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
            placeholder="Search workflows by name, trigger condition, or action..."
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

      {/* Workflows Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <p className="text-xs font-semibold">
            Loading AI Workflows &amp; Execution Logs from MongoDB...
          </p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center mx-auto">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-brand-navy">
              No Automation Workflows Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Seed 4 ready-to-use Noida / Delhi-NCR sales workflows or build a custom rule.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSeed}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Seed 4 Sample Workflows
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              + Create Rule
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5 hover:border-brand-blue/40 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        wf.active
                          ? 'bg-brand-light text-brand-blue'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-brand-navy">
                        {wf.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-600">
                          {wf.runsCount} runs
                        </span>
                        <span>·</span>
                        <span>{wf.hoursSaved} hrs saved</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(wf.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex-shrink-0 ${
                      wf.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {wf.active ? '● Active' : '○ Paused'}
                  </button>
                </div>

                {/* IF -> CONDITION -> THEN Blocks */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider block">
                        WHEN TRIGGER ({wf.triggerType})
                      </span>
                      <span>{TRIGGER_LABELS[wf.triggerType] || wf.triggerType}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-700 pt-1.5 border-t border-slate-200/60">
                    <Filter className="w-3.5 h-3.5 text-brand-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider block">
                        IF CONDITION
                      </span>
                      <span>{wf.conditionSummary}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-700 pt-1.5 border-t border-slate-200/60">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider block">
                        THEN EXECUTE ACTION
                      </span>
                      <span className="font-semibold text-emerald-800">
                        {wf.actionSummary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Audit Log Entry */}
                {wf.executionLogs && wf.executionLogs.length > 0 && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                    <span className="truncate">
                      <strong className="text-emerald-700">Latest Run:</strong>{' '}
                      {wf.executionLogs[0].summary}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleExecuteNow(wf)}
                  disabled={runningId === wf.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-light hover:bg-brand-blue hover:text-white text-brand-blue text-xs font-bold transition-colors"
                >
                  {runningId === wf.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  Test / Run Now
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(wf.id)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Workflow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE WORKFLOW MODAL ────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Workflow className="w-5 h-5 text-brand-blue" />
                <div>
                  <h2 className="text-base font-extrabold">
                    Create Zero-Code AI Automation Rule
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Automatically runs when Leads, Deals, or GST Invoices change in MongoDB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Workflow Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Noida Hot Lead -> Instant WhatsApp Quote & Priority Call"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. WHEN Event Trigger Occurs
                </label>
                <select
                  value={triggerType}
                  onChange={(e) =>
                    setTriggerType(e.target.value as WorkflowTriggerType)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-semibold"
                >
                  <option value="lead.created">
                    New Lead Captured (IndiaMART / WhatsApp / Meta Ads)
                  </option>
                  <option value="lead.hot_scored">
                    Gemini AI Scores Lead &gt;= 80 (Hot Buyer)
                  </option>
                  <option value="deal.stage_changed">
                    Deal Stage Moved in Kanban Pipeline
                  </option>
                  <option value="invoice.overdue">
                    GST Tax Invoice Passes Due Date
                  </option>
                  <option value="whatsapp.inbound">
                    Inbound Buyer Message on WhatsApp
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. IF Condition Matches *
                </label>
                <input
                  type="text"
                  required
                  value={conditionSummary}
                  onChange={(e) => setConditionSummary(e.target.value)}
                  placeholder="e.g. Source = IndiaMART AND Estimated Value >= ₹1,00,000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. THEN Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) =>
                    handleActionTypeChange(e.target.value as WorkflowActionType)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-semibold"
                >
                  <option value="send_whatsapp_create_task">
                    Send WhatsApp Catalogue + Create Follow-up Task
                  </option>
                  <option value="assign_senior_closer">
                    Assign to Senior Closer + High-Priority Alert
                  </option>
                  <option value="generate_gst_invoice">
                    Auto-Generate 18% GST Tax Invoice Draft
                  </option>
                  <option value="send_payment_reminder">
                    Send WhatsApp Razorpay Payment Reminder
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Details *
                </label>
                <input
                  type="text"
                  required
                  value={actionSummary}
                  onChange={(e) => setActionSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save &amp; Activate Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

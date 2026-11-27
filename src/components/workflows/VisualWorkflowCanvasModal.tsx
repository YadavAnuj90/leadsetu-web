'use client';

import React, { useState } from 'react';
import {
  Zap,
  Filter,
  Clock,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  CheckSquare,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader2,
  X,
  Save,
  ShieldCheck,
  ArrowDown as ArrowConnector,
} from 'lucide-react';
import {
  createWorkflow,
  updateWorkflowApi,
  draftWorkflowWithAiApi,
} from '@/lib/workflows-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  WorkflowRule,
  WorkflowStepNode,
  WorkflowTriggerType,
  WorkflowActionType,
  WorkflowConditionGuard,
  WorkflowNodeActionKind,
  WorkflowDelayUnit,
} from '@/types/contracts';

interface Props {
  open: boolean;
  editingWorkflow: WorkflowRule | null;
  onClose: () => void;
  onSaved: (saved: WorkflowRule, isNew: boolean) => void;
}

const BLUEPRINTS: Array<{
  label: string;
  badge: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  sourceFilter: string;
  actionType: WorkflowActionType;
  conditionSummary: string;
  actionSummary: string;
  nodes: WorkflowStepNode[];
}> = [
  {
    label: '10-Min Speed-to-Lead Rescue (IndiaMART / Meta / Webhook)',
    badge: 'SLA + Reassign',
    name: '10-Min Uncontacted Lead -> Hinglish WhatsApp + Backup Rep & SLA Alert',
    description:
      'Waits 10 minutes after lead arrival; if still uncontacted, sends Hinglish WhatsApp follow-up, reassigns to backup rep, and raises an urgent SLA alert.',
    triggerType: 'lead.created',
    sourceFilter: 'all',
    actionType: 'reassign_rep_sla_alert',
    conditionSummary: 'Source IN [IndiaMART, Meta Ads, Webhook] AND Uncontacted after 10 mins',
    actionSummary: 'Hinglish WhatsApp + Reassign Backup Rep + Urgent SLA Alert',
    nodes: [
      {
        id: 'node-trig-1',
        kind: 'trigger',
        title: 'Lead Arrives (IndiaMART / Meta / Webhook)',
        subtitle: 'Fires immediately on new inbound lead creation',
      },
      {
        id: 'node-delay-10m',
        kind: 'delay',
        title: 'Wait 10 Minutes',
        subtitle: 'Speed-to-Lead SLA grace window for assigned rep',
        delayValue: 10,
        delayUnit: 'minutes',
      },
      {
        id: 'node-cond-uncontacted',
        kind: 'condition',
        title: 'If Still Uncontacted (Status = New)',
        subtitle: 'Checks if rep has not moved lead out of New stage',
        conditionGuard: 'if_uncontacted',
        conditionValue: 'new',
      },
      {
        id: 'node-act-wa',
        kind: 'action',
        title: 'Send Hinglish WhatsApp Follow-Up',
        subtitle: 'Auto-greets buyer with GST brochure & callback assurance',
        actionKind: 'send_whatsapp',
        language: 'hinglish',
        whatsappTemplateBody:
          'Namaste {{buyer_name}} ji 👋, humne aapki {{company}} inquiry receive ki hai! Humare senior specialist aapko turant call karenge. Tab tak catalogue & GST details share kar rahe hain.',
      },
      {
        id: 'node-act-reassign',
        kind: 'action',
        title: 'Reassign to Backup Rep',
        subtitle: 'Rotates uncontacted lead via Round-Robin',
        actionKind: 'reassign_rep',
        reassignStrategy: 'round_robin_backup',
      },
      {
        id: 'node-act-sla',
        kind: 'action',
        title: 'Create Urgent SLA Alert & Task',
        subtitle: 'Creates urgent SLA ticket + high-priority callback task',
        actionKind: 'create_sla_alert',
        slaPriority: 'urgent',
        taskOrAlertTitle:
          'SLA Breach: Lead uncontacted after 10 mins — reassigned to backup rep',
      },
    ],
  },
  {
    label: '3-Step Hinglish WhatsApp Drip Sequence (Day 0 -> 24h -> 48h)',
    badge: 'Auto-Stop on Reply',
    name: 'Hinglish WhatsApp Nurturing Drip (Day 0 -> 24h -> 48h)',
    description:
      'Sends instant catalogue, follows up after 24h if no reply, and sends a final 48h GST offer — automatically stops when buyer replies.',
    triggerType: 'lead.created',
    sourceFilter: 'all',
    actionType: 'multi_step_whatsapp_drip',
    conditionSummary: 'All New Leads with Valid WhatsApp Phone (+91)',
    actionSummary: '3-Step Hinglish WhatsApp Drip (stops automatically on reply)',
    nodes: [
      {
        id: 'node-trig-drip',
        kind: 'trigger',
        title: 'New Lead Captured',
        subtitle: 'Enrolls buyer into Hinglish WhatsApp Drip',
      },
      {
        id: 'node-wa-day0',
        kind: 'action',
        title: 'Step 1 (Instant): Hinglish Welcome & Brochure',
        subtitle: 'Sends immediate product brochure + GST rate card',
        actionKind: 'send_whatsapp',
        language: 'hinglish',
        whatsappTemplateBody:
          'Namaste {{buyer_name}} ji 👋, {{company}} ke liye quotation & brochure share kar rahe hain. Batayein aapko kitni quantity chahiye?',
      },
      {
        id: 'node-delay-24h',
        kind: 'delay',
        title: 'Wait 24 Hours',
        subtitle: 'Pauses before Day 1 follow-up',
        delayValue: 24,
        delayUnit: 'hours',
      },
      {
        id: 'node-cond-noreply',
        kind: 'condition',
        title: 'If No WhatsApp Reply Yet',
        subtitle: 'Skips remaining steps if buyer already replied',
        conditionGuard: 'if_no_whatsapp_reply',
      },
      {
        id: 'node-wa-day1',
        kind: 'action',
        title: 'Step 2 (24h): Hinglish Quotation Nudge',
        subtitle: 'Offers a quick 5-minute call & best factory rate',
        actionKind: 'send_whatsapp',
        language: 'hinglish',
        whatsappTemplateBody:
          'Namaste {{buyer_name}} ji 🙏, kal wali inquiry par check kar rahe the. Kya hum aaj 5-minute call par best factory rate & GST invoice share karein?',
      },
    ],
  },
];

const NODE_STYLE: Record<
  WorkflowStepNode['kind'],
  { bg: string; border: string; badge: string; label: string }
> = {
  trigger: {
    bg: 'bg-amber-50/90 dark:bg-amber-500/10',
    border: 'border-amber-300 dark:border-amber-500/35',
    badge: 'bg-amber-500 text-white',
    label: 'TRIGGER',
  },
  condition: {
    bg: 'bg-sky-50/90 dark:bg-sky-500/10',
    border: 'border-sky-300 dark:border-sky-500/35',
    badge: 'bg-sky-600 text-white',
    label: 'IF CONDITION',
  },
  delay: {
    bg: 'bg-violet-50/90 dark:bg-violet-500/10',
    border: 'border-violet-300 dark:border-violet-500/35',
    badge: 'bg-violet-600 text-white',
    label: 'WAIT DELAY',
  },
  action: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-500/10',
    border: 'border-emerald-300 dark:border-emerald-500/35',
    badge: 'bg-emerald-600 text-white',
    label: 'THEN ACTION',
  },
};

function NodeIcon({ node }: { node: WorkflowStepNode }) {
  if (node.kind === 'trigger') return <Zap className="w-4 h-4 text-amber-500 dark:text-amber-300" />;
  if (node.kind === 'condition') return <Filter className="w-4 h-4 text-sky-600 dark:text-sky-300" />;
  if (node.kind === 'delay') return <Clock className="w-4 h-4 text-violet-600 dark:text-violet-300" />;
  if (node.actionKind === 'reassign_rep')
    return <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />;
  if (node.actionKind === 'create_sla_alert')
    return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-300" />;
  if (node.actionKind === 'create_task')
    return <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />;
  return <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />;
}

export default function VisualWorkflowCanvasModal({
  open,
  editingWorkflow,
  onClose,
  onSaved,
}: Props) {
  const initialNodes: WorkflowStepNode[] =
    editingWorkflow?.nodes && editingWorkflow.nodes.length > 0
      ? editingWorkflow.nodes
      : BLUEPRINTS[0].nodes;

  const [name, setName] = useState(editingWorkflow?.name || BLUEPRINTS[0].name);
  const [description, setDescription] = useState(
    editingWorkflow?.description || BLUEPRINTS[0].description,
  );
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>(
    editingWorkflow?.triggerType || 'lead.created',
  );
  const [sourceFilter, setSourceFilter] = useState(
    editingWorkflow?.sourceFilter || 'all',
  );
  const [stopOnReply, setStopOnReply] = useState(
    editingWorkflow?.stopOnReply ?? true,
  );
  const [nodes, setNodes] = useState<WorkflowStepNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    initialNodes[0]?.id || '',
  );

  const [aiPrompt, setAiPrompt] = useState(
    'When a lead arrives from IndiaMART or Meta, wait 10 mins; if uncontacted, send Hinglish WhatsApp follow-up, reassign to backup rep, and create urgent SLA alert',
  );
  const [draftingAi, setDraftingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const applyBlueprint = (bpIdx: number) => {
    const bp = BLUEPRINTS[bpIdx];
    if (!bp) return;
    setName(bp.name);
    setDescription(bp.description);
    setTriggerType(bp.triggerType);
    setSourceFilter(bp.sourceFilter);
    setNodes(bp.nodes.map((n) => ({ ...n })));
    setSelectedNodeId(bp.nodes[0]?.id || '');
  };

  const handleDraftWithAi = async () => {
    if (!aiPrompt.trim() || draftingAi) return;
    setDraftingAi(true);
    setError(null);
    try {
      const res = await draftWorkflowWithAiApi({
        prompt: aiPrompt.trim(),
        language: 'hinglish',
      });
      setName(res.name);
      setDescription(res.description);
      setTriggerType(res.triggerType);
      setSourceFilter(res.sourceFilter || 'all');
      if (Array.isArray(res.nodes) && res.nodes.length > 0) {
        setNodes(res.nodes);
        setSelectedNodeId(res.nodes[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDraftingAi(false);
    }
  };

  const addNode = (
    kind: WorkflowStepNode['kind'],
    actionKind?: WorkflowNodeActionKind,
  ) => {
    const id = `node-${kind}-${Date.now()}`;
    let newNode: WorkflowStepNode;

    if (kind === 'delay') {
      newNode = {
        id,
        kind: 'delay',
        title: 'Wait 10 Minutes',
        subtitle: 'Pauses flow before evaluating next condition/action',
        delayValue: 10,
        delayUnit: 'minutes',
      };
    } else if (kind === 'condition') {
      newNode = {
        id,
        kind: 'condition',
        title: 'If Still Uncontacted (Status = New)',
        subtitle: 'Continues only if buyer has not been contacted yet',
        conditionGuard: 'if_uncontacted',
        conditionValue: 'new',
      };
    } else if (actionKind === 'reassign_rep') {
      newNode = {
        id,
        kind: 'action',
        title: 'Reassign to Backup Rep',
        subtitle: 'Rotates lead to next available rep',
        actionKind: 'reassign_rep',
        reassignStrategy: 'round_robin_backup',
      };
    } else if (actionKind === 'create_sla_alert') {
      newNode = {
        id,
        kind: 'action',
        title: 'Create Urgent SLA Alert & Task',
        subtitle: 'Raises SLA ticket + high-priority task',
        actionKind: 'create_sla_alert',
        slaPriority: 'urgent',
        taskOrAlertTitle: 'SLA Alert: Lead requires immediate callback',
      };
    } else {
      newNode = {
        id,
        kind: 'action',
        title: 'Send Hinglish WhatsApp Message',
        subtitle: 'Dispatches personalized WhatsApp template',
        actionKind: 'send_whatsapp',
        language: 'hinglish',
        whatsappTemplateBody:
          'Namaste {{buyer_name}} ji 👋, checking in on your inquiry for {{company}}. Reply YES for our GST quotation!',
      };
    }

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const updateSelectedNode = (patch: Partial<WorkflowStepNode>) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)),
    );
  };

  const moveNode = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (index === 0 || target <= 0 || target >= nodes.length) return;
    setNodes((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removeNode = (id: string, index: number) => {
    if (index === 0) return; // keep root trigger
    setNodes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (selectedNodeId === id) {
        setSelectedNodeId(next[0]?.id || '');
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Workflow name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const hasDelay = nodes.some((n) => n.kind === 'delay');
      const hasReassignOrSla = nodes.some(
        (n) =>
          n.actionKind === 'reassign_rep' || n.actionKind === 'create_sla_alert',
      );
      const firstWaNode = nodes.find(
        (n) => n.kind === 'action' && n.actionKind === 'send_whatsapp',
      );
      const firstDelayNode = nodes.find((n) => n.kind === 'delay');

      const inferredActionType: WorkflowActionType = hasReassignOrSla
        ? 'reassign_rep_sla_alert'
        : hasDelay
          ? 'multi_step_whatsapp_drip'
          : 'send_whatsapp_create_task';

      const condSummary =
        nodes
          .filter((n) => n.kind === 'condition')
          .map((n) => n.title)
          .join(' AND ') || `Source = ${sourceFilter.toUpperCase()}`;

      const actSummary =
        nodes
          .filter((n) => n.kind === 'action')
          .map((n) => n.title)
          .join(' -> ') || 'Execute Visual Pipeline';

      const payload = {
        name: name.trim(),
        description: description.trim(),
        triggerType,
        sourceFilter,
        staleMinutes:
          firstDelayNode?.delayUnit === 'minutes'
            ? firstDelayNode.delayValue || 10
            : 10,
        staleHours:
          firstDelayNode?.delayUnit === 'hours'
            ? firstDelayNode.delayValue || 24
            : 24,
        whatsappTemplateBody: firstWaNode?.whatsappTemplateBody || '',
        conditionSummary: condSummary,
        actionType: inferredActionType,
        actionSummary: actSummary,
        nodes,
        stopOnReply,
        active: editingWorkflow ? editingWorkflow.active : true,
      };

      const saved = editingWorkflow
        ? await updateWorkflowApi(editingWorkflow.id, payload)
        : await createWorkflow(payload);
      onSaved(saved, !editingWorkflow);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#0D1628] rounded-2xl sm:rounded-3xl max-w-6xl w-full border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-brand-navy dark:bg-[#081020] border-b border-white/10 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-blue/25 border border-brand-blue/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold truncate">
                Visual No-Code Workflow &amp; WhatsApp Drip Canvas
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Chain Triggers, Speed-to-Lead Delays, Uncontacted Conditions, Hinglish WhatsApp Steps, Rep Reassignment &amp; SLA Alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-300 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI + Blueprint Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 dark:bg-[#0A1324] text-white border-b border-slate-800 space-y-2.5 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe flow in English or Hinglish..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                disabled={draftingAi}
                onClick={() => void handleDraftWithAi()}
                className="btn-primary-brand inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap disabled:opacity-60"
              >
                {draftingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Generate Flow with SetuAI
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {BLUEPRINTS.map((bp, idx) => (
                <button
                  key={bp.label}
                  type="button"
                  onClick={() => applyBlueprint(idx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-sky-200 transition"
                >
                  <span>{idx === 0 ? '⚡ 10m SLA Rescue' : '💬 3-Step Hinglish Drip'}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Main 2-Column Split: Left Visual Pipeline Canvas + Right Node Inspector */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/[0.08]">
          {/* LEFT: Visual Flow Canvas (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-50/70 dark:bg-[#081020] space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-[#0D1628] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-bold text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Inbound Source Filter
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-bold text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="all">All Sources (IndiaMART + Meta + Webhook)</option>
                  <option value="indiamart">IndiaMART Only</option>
                  <option value="meta_ads">Meta Lead Ads Only</option>
                  <option value="website">Website / Universal Webhook</option>
                  <option value="justdial">Justdial Only</option>
                </select>
              </div>
            </div>

            {/* Ordered Node Stack */}
            <div className="space-y-1">
              {nodes.map((node, index) => {
                const st = NODE_STYLE[node.kind];
                const isSelected = selectedNode?.id === node.id;

                return (
                  <React.Fragment key={node.id}>
                    {index > 0 && (
                      <div className="flex justify-center py-1">
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-[#0D1628] border border-slate-300 dark:border-white/15 flex items-center justify-center shadow-xs">
                          <ArrowConnector className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${st.bg} ${
                        isSelected
                          ? 'border-brand-blue ring-2 ring-brand-blue/25 shadow-md'
                          : `${st.border} hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
                            <NodeIcon node={node} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider ${st.badge}`}
                              >
                                {st.label}
                              </span>
                              {node.kind === 'delay' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#0D1628] border border-violet-200 dark:border-violet-500/35 text-violet-700 dark:text-violet-300">
                                  {node.delayValue || 10} {node.delayUnit || 'minutes'}
                                </span>
                              )}
                              {node.kind === 'action' && node.language && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#0D1628] border border-emerald-200 dark:border-emerald-500/35 text-emerald-700 dark:text-emerald-300 uppercase">
                                  {node.language}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-extrabold text-brand-navy dark:text-white mt-1">
                              {node.title}
                            </h4>
                            {node.subtitle && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                {node.subtitle}
                              </p>
                            )}
                            {node.whatsappTemplateBody && (
                              <p className="mt-2 text-[11px] italic text-slate-700 dark:text-slate-200 bg-white/85 dark:bg-[#0D1628]/80 px-3 py-1.5 rounded-lg border border-emerald-200/70 dark:border-emerald-500/25 line-clamp-2">
                                &ldquo;{node.whatsappTemplateBody}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {index > 0 && (
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => moveNode(index, -1)}
                              disabled={index <= 1}
                              className="p-1 rounded-lg bg-white/80 dark:bg-[#0D1628] hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveNode(index, 1)}
                              disabled={index >= nodes.length - 1}
                              className="p-1 rounded-lg bg-white/80 dark:bg-[#0D1628] hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeNode(node.id, index)}
                              className="p-1 rounded-lg bg-white/80 dark:bg-[#0D1628] hover:bg-rose-50 dark:hover:bg-rose-500/20 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300"
                              title="Remove Step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Add Step Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mr-1">
                + Add Step:
              </span>
              <button
                type="button"
                onClick={() => addNode('condition')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-500/15 hover:bg-sky-200 dark:hover:bg-sky-500/25 text-sky-800 dark:text-sky-200 border border-transparent dark:border-sky-500/30 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> IF Condition
              </button>
              <button
                type="button"
                onClick={() => addNode('delay')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-500/15 hover:bg-violet-200 dark:hover:bg-violet-500/25 text-violet-800 dark:text-violet-200 border border-transparent dark:border-violet-500/30 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Wait Delay
              </button>
              <button
                type="button"
                onClick={() => addNode('action', 'send_whatsapp')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-transparent dark:border-emerald-500/30 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> WhatsApp Message
              </button>
              <button
                type="button"
                onClick={() => addNode('action', 'reassign_rep')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-500/15 hover:bg-teal-200 dark:hover:bg-teal-500/25 text-teal-800 dark:text-teal-200 border border-transparent dark:border-teal-500/30 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Reassign Rep
              </button>
              <button
                type="button"
                onClick={() => addNode('action', 'create_sla_alert')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-500/15 hover:bg-rose-200 dark:hover:bg-rose-500/25 text-rose-800 dark:text-rose-200 border border-transparent dark:border-rose-500/30 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> SLA Alert
              </button>
            </div>
          </div>

          {/* RIGHT: Node Inspector & Guardrails (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 bg-white dark:bg-[#0D1628] space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                  Step Inspector
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any node on the canvas to configure its rules &amp; template
                </p>
              </div>
              {selectedNode && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${NODE_STYLE[selectedNode.kind].badge}`}
                >
                  {NODE_STYLE[selectedNode.kind].label}
                </span>
              )}
            </div>

            {selectedNode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Step Title
                  </label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => updateSelectedNode({ title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-bold text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {selectedNode.kind === 'trigger' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      CRM Event Trigger
                    </label>
                    <select
                      value={triggerType}
                      onChange={(e) =>
                        setTriggerType(e.target.value as WorkflowTriggerType)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-semibold text-brand-navy dark:text-white"
                    >
                      <option value="lead.created">
                        New Lead Captured (IndiaMART / Meta / Webhook)
                      </option>
                      <option value="lead.hot_scored">
                        SetuAI Scores Lead &gt;= 80 (Hot Buyer)
                      </option>
                      <option value="lead.stale_followup">
                        Lead Stays in Stage Past Threshold
                      </option>
                      <option value="deal.stage_changed">
                        Deal Stage Changed in Pipeline
                      </option>
                      <option value="invoice.overdue">
                        GST Tax Invoice Overdue
                      </option>
                      <option value="whatsapp.inbound">
                        Inbound Buyer Message on WhatsApp
                      </option>
                    </select>
                  </div>
                )}

                {selectedNode.kind === 'delay' && (
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30">
                    <div>
                      <label className="block text-xs font-bold text-violet-900 dark:text-violet-200 mb-1">
                        Wait Duration
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={selectedNode.delayValue ?? 10}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value) || 1);
                          const u = selectedNode.delayUnit || 'minutes';
                          updateSelectedNode({
                            delayValue: v,
                            title: `Wait ${v} ${u === 'minutes' ? 'Min(s)' : u === 'hours' ? 'Hour(s)' : 'Day(s)'}`,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-violet-900 dark:text-violet-200 mb-1">
                        Time Unit
                      </label>
                      <select
                        value={selectedNode.delayUnit || 'minutes'}
                        onChange={(e) => {
                          const u = e.target.value as WorkflowDelayUnit;
                          const v = selectedNode.delayValue ?? 10;
                          updateSelectedNode({
                            delayUnit: u,
                            title: `Wait ${v} ${u === 'minutes' ? 'Min(s)' : u === 'hours' ? 'Hour(s)' : 'Day(s)'}`,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedNode.kind === 'condition' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30">
                    <div>
                      <label className="block text-xs font-bold text-sky-900 dark:text-sky-200 mb-1">
                        Condition Rule
                      </label>
                      <select
                        value={selectedNode.conditionGuard || 'if_uncontacted'}
                        onChange={(e) =>
                          updateSelectedNode({
                            conditionGuard: e.target.value as WorkflowConditionGuard,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white"
                      >
                        <option value="if_uncontacted">
                          If Lead Still Uncontacted (Status = New)
                        </option>
                        <option value="if_no_whatsapp_reply">
                          If Buyer Has Not Replied on WhatsApp
                        </option>
                        <option value="if_ai_score_gte">
                          If SetuAI Score &gt;= Threshold
                        </option>
                        <option value="if_deal_value_gte">
                          If Estimated Deal Value &gt;= ₹
                        </option>
                        <option value="if_source_matches">
                          If Lead Source Matches
                        </option>
                        <option value="if_city_matches">
                          If City / Territory Matches
                        </option>
                      </select>
                    </div>

                    {(selectedNode.conditionGuard === 'if_ai_score_gte' ||
                      selectedNode.conditionGuard === 'if_deal_value_gte' ||
                      selectedNode.conditionGuard === 'if_source_matches' ||
                      selectedNode.conditionGuard === 'if_city_matches') && (
                      <div>
                        <label className="block text-xs font-bold text-sky-900 dark:text-sky-200 mb-1">
                          Comparison Value
                        </label>
                        <input
                          type="text"
                          value={selectedNode.conditionValue || ''}
                          onChange={(e) =>
                            updateSelectedNode({ conditionValue: e.target.value })
                          }
                          placeholder="e.g. 80 or indiamart,meta_ads or Noida"
                          className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-white dark:bg-[#081020] text-xs text-brand-navy dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.kind === 'action' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                        Action Type
                      </label>
                      <select
                        value={selectedNode.actionKind || 'send_whatsapp'}
                        onChange={(e) =>
                          updateSelectedNode({
                            actionKind: e.target.value as WorkflowNodeActionKind,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white"
                      >
                        <option value="send_whatsapp">
                          Send WhatsApp Follow-Up (Hinglish / EN)
                        </option>
                        <option value="reassign_rep">
                          Reassign Lead to Backup Sales Rep
                        </option>
                        <option value="create_sla_alert">
                          Create Urgent SLA Alert &amp; Task
                        </option>
                        <option value="create_task">
                          Create Sales Follow-Up Task
                        </option>
                        <option value="send_payment_reminder">
                          Send Razorpay Payment Reminder
                        </option>
                      </select>
                    </div>

                    {(selectedNode.actionKind === 'send_whatsapp' ||
                      selectedNode.actionKind === 'send_payment_reminder') && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                            Message Language
                          </label>
                          <select
                            value={selectedNode.language || 'hinglish'}
                            onChange={(e) =>
                              updateSelectedNode({
                                language: e.target.value as
                                  | 'hinglish'
                                  | 'english'
                                  | 'hindi',
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white"
                          >
                            <option value="hinglish">Hinglish (Recommended)</option>
                            <option value="english">English</option>
                            <option value="hindi">Hindi</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                            WhatsApp Template Message
                          </label>
                          <textarea
                            rows={4}
                            value={selectedNode.whatsappTemplateBody || ''}
                            onChange={(e) =>
                              updateSelectedNode({
                                whatsappTemplateBody: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#081020] text-xs text-brand-navy dark:text-white"
                          />
                          <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-1">
                            Variables: <code>{'{{buyer_name}}'}</code>,{' '}
                            <code>{'{{company}}'}</code>, <code>{'{{city}}'}</code>
                          </p>
                        </div>
                      </>
                    )}

                    {selectedNode.actionKind === 'reassign_rep' && (
                      <div>
                        <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          Backup Rep Strategy
                        </label>
                        <select
                          value={
                            selectedNode.reassignStrategy || 'round_robin_backup'
                          }
                          onChange={(e) =>
                            updateSelectedNode({
                              reassignStrategy: e.target.value as
                                | 'round_robin_backup'
                                | 'senior_closer'
                                | 'territory_owner',
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white"
                        >
                          <option value="round_robin_backup">
                            Next Active Rep (Round-Robin Backup)
                          </option>
                          <option value="senior_closer">
                            Escalate to Senior Closer / Manager
                          </option>
                          <option value="territory_owner">
                            Territory / City Backup Rep
                          </option>
                        </select>
                      </div>
                    )}

                    {(selectedNode.actionKind === 'create_sla_alert' ||
                      selectedNode.actionKind === 'create_task') && (
                      <div>
                        <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          SLA Alert / Task Subject
                        </label>
                        <input
                          type="text"
                          value={selectedNode.taskOrAlertTitle || ''}
                          onChange={(e) =>
                            updateSelectedNode({ taskOrAlertTitle: e.target.value })
                          }
                          placeholder="SLA Breach: Lead uncontacted after 10 mins"
                          className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#081020] text-xs text-brand-navy dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Drip Stop Guardrail */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/[0.08] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <label className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-brand-navy dark:text-white">
                  <input
                    type="checkbox"
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    className="rounded border-slate-300 text-brand-blue"
                  />
                  <span>Auto-Stop Drip When Buyer Replies on WhatsApp</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Prevents awkward automated follow-ups once the buyer replies in your Inbox.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-[#081020] border-t border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {nodes.length} visual steps configured · Ready for live lead events
          </span>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1628] text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingWorkflow ? 'Update Visual Workflow' : 'Save & Activate Visual Flow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

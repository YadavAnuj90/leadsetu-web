'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
  Lock,
  Plus,
  Copy,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Sliders,
  FileJson,
  Play,
  RotateCcw,
  KeyRound,
  PauseCircle,
  Radio,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Send,
  Sparkles,
  Check,
  X,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  UniversalWebhookItem,
  UniversalWebhookActionMeta,
  WebhookDeliveryLogItem,
  WebhookMethod,
  WebhookTargetAction,
  DuplicateStrategy,
  WebhookFieldMapping,
  fetchUniversalWebhookActionsApi,
  listUniversalWebhooksApi,
  createUniversalWebhookApi,
  updateUniversalWebhookApi,
  startUniversalWebhookListenApi,
  fetchUniversalWebhookSampleApi,
  rotateUniversalWebhookSecretApi,
  fetchUniversalWebhookLogsApi,
  replayUniversalWebhookLogApi,
  sendBrowserTestWebhookHitApi,
} from '@/lib/universal-webhooks-api';
import { fetchWhatsAppTemplatesApi } from '@/lib/inbox-api';
import type { WhatsAppTemplate } from '@/types/contracts';

const ACTION_BADGE_META: Record<
  WebhookTargetAction,
  { label: string; colorClass: string }
> = {
  create_lead: {
    label: 'Create / Upsert Lead',
    colorClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  create_contact: {
    label: 'Create / Upsert B2B Contact',
    colorClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  create_deal: {
    label: 'Create / Upsert Deal',
    colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
};

export default function UniversalWebhooksManager() {
  const [webhooks, setWebhooks] = useState<UniversalWebhookItem[]>([]);
  const [actionsMeta, setActionsMeta] = useState<UniversalWebhookActionMeta[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Drawer Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [activeWebhook, setActiveWebhook] = useState<UniversalWebhookItem | null>(null);

  // Step 1 form state
  const [name, setName] = useState('');
  const [allowedMethod, setAllowedMethod] = useState<WebhookMethod>('POST');
  const [targetAction, setTargetAction] = useState<WebhookTargetAction>('create_lead');
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>('fill_empty');
  const [triggerWhatsappOnNew, setTriggerWhatsappOnNew] = useState(false);
  const [triggerWhatsappOnRepeat, setTriggerWhatsappOnRepeat] = useState(false);
  const [whatsappTemplateId, setWhatsappTemplateId] = useState('');
  const [optionalHeaderSecret, setOptionalHeaderSecret] = useState('');
  const [savingStep1, setSavingStep1] = useState(false);

  // Step 2 sample & mapping state
  const [samplePayload, setSamplePayload] = useState<Record<string, any> | null>(null);
  const [sampleCreatedAt, setSampleCreatedAt] = useState<string | null>(null);
  const [fieldMappings, setFieldMappings] = useState<WebhookFieldMapping[]>([]);
  const [pollingSample, setPollingSample] = useState(false);
  const [sendingTestHit, setSendingTestHit] = useState(false);
  const [activatingWebhook, setActivatingWebhook] = useState(false);

  // Step 3 delivery logs state
  const [logs, setLogs] = useState<WebhookDeliveryLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [replayingLogId, setReplayingLogId] = useState<string | null>(null);
  const [rotatingSecretId, setRotatingSecretId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const getWebhookKey = (item: UniversalWebhookItem) => item.id || item._id || item.webhookId;

  const getPublicOrigin = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const rawOrigin = envUrl.replace(/\/v1\/?$/, '');
    return rawOrigin.replace(/^http:\/\/(?!localhost|127\.0\.0\.1)/i, 'https://');
  };

  const buildFullWebhookUrl = (item: UniversalWebhookItem) => {
    return `${getPublicOrigin()}${item.endpointPath}`;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, actRes, tplRes] = await Promise.all([
        listUniversalWebhooksApi(),
        fetchUniversalWebhookActionsApi(),
        fetchWhatsAppTemplatesApi().catch(() => ({ data: [], supportedVariables: [] })),
      ]);
      setWebhooks(whRes.webhooks || []);
      setActionsMeta(actRes.actions || []);
      setTemplates(tplRes.data || []);
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || 'Failed to load Universal Webhooks',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Poll for incoming sample while on Step 2 and status === 'listening'
  useEffect(() => {
    if (!wizardOpen || wizardStep !== 2 || !activeWebhook) return;
    let timer: NodeJS.Timeout | null = null;
    let cancelled = false;
    const whId = getWebhookKey(activeWebhook);

    const checkSample = async () => {
      try {
        const res = await fetchUniversalWebhookSampleApi(whId);
        if (cancelled) return;
        if (res.hasSample && res.flattenedPayload) {
          setSamplePayload(res.flattenedPayload);
          if (res.capturedAt) setSampleCreatedAt(res.capturedAt);
          setFieldMappings((prev) =>
            prev.length > 0 ? prev : res.suggestedMappings || [],
          );
        }
      } catch {
        // silent poll
      }
    };

    checkSample();
    if (activeWebhook.status === 'listening') {
      setPollingSample(true);
      timer = setInterval(checkSample, 2500);
    } else {
      setPollingSample(false);
    }

    return () => {
      cancelled = true;
      setPollingSample(false);
      if (timer) clearInterval(timer);
    };
  }, [wizardOpen, wizardStep, activeWebhook]);

  const handleCopyUrl = (item: UniversalWebhookItem) => {
    const url = buildFullWebhookUrl(item);
    navigator.clipboard.writeText(url);
    const key = getWebhookKey(item);
    setCopiedId(key);
    showToast('success', 'HTTPS Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreateWizard = () => {
    setActiveWebhook(null);
    setName('');
    setAllowedMethod('POST');
    setTargetAction('create_lead');
    setDuplicateStrategy('fill_empty');
    setTriggerWhatsappOnNew(false);
    setTriggerWhatsappOnRepeat(false);
    setWhatsappTemplateId('');
    setOptionalHeaderSecret('');
    setSamplePayload(null);
    setSampleCreatedAt(null);
    setFieldMappings([]);
    setWizardStep(1);
    setWizardOpen(true);
  };

  const openEditWizard = (item: UniversalWebhookItem, initialStep: 1 | 2 | 3 = 1) => {
    setActiveWebhook(item);
    setName(item.name);
    setAllowedMethod(item.allowedMethod);
    setTargetAction(item.targetAction);
    setDuplicateStrategy(item.duplicateStrategy || 'fill_empty');
    setTriggerWhatsappOnNew(Boolean(item.triggerWhatsappOnNew));
    setTriggerWhatsappOnRepeat(Boolean(item.triggerWhatsappOnRepeat));
    setWhatsappTemplateId(item.whatsappTemplateId || '');
    setOptionalHeaderSecret(item.optionalHeaderSecret || '');
    setFieldMappings(item.fieldMappings || []);
    setSamplePayload(null);
    setSampleCreatedAt(null);
    setWizardStep(initialStep);
    setWizardOpen(true);

    if (initialStep === 3) {
      loadLogsForWebhook(getWebhookKey(item));
    }
  };

  const loadLogsForWebhook = async (id: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetchUniversalWebhookLogsApi(id);
      setLogs(res.logs || []);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to load delivery logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveStep1 = async () => {
    if (!name.trim()) {
      showToast('error', 'Please enter a descriptive webhook name');
      return;
    }
    setSavingStep1(true);
    try {
      if (!activeWebhook) {
        const created = await createUniversalWebhookApi({
          name: name.trim(),
          allowedMethod,
          targetAction,
          duplicateStrategy,
          triggerWhatsappOnNew,
          triggerWhatsappOnRepeat,
          whatsappTemplateId: whatsappTemplateId || undefined,
          optionalHeaderSecret: optionalHeaderSecret.trim() || undefined,
        });
        setActiveWebhook(created);
        setFieldMappings(created.fieldMappings || []);
        await loadAll();
        setWizardStep(2);
        showToast(
          'success',
          'Webhook endpoint created in Listening Mode! Send a sample payload to map fields.',
        );
      } else {
        const updated = await updateUniversalWebhookApi(getWebhookKey(activeWebhook), {
          name: name.trim(),
          allowedMethod,
          targetAction,
          duplicateStrategy,
          triggerWhatsappOnNew,
          triggerWhatsappOnRepeat,
          whatsappTemplateId,
          optionalHeaderSecret: optionalHeaderSecret.trim(),
        });
        setActiveWebhook(updated);
        await loadAll();
        setWizardStep(2);
        showToast('success', 'Endpoint configuration saved.');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to save webhook');
    } finally {
      setSavingStep1(false);
    }
  };

  const handlePutIntoListenMode = async () => {
    if (!activeWebhook) return;
    try {
      const updated = await startUniversalWebhookListenApi(getWebhookKey(activeWebhook));
      setActiveWebhook(updated);
      await loadAll();
      showToast('success', 'Listening for next incoming webhook hit...');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to start listening mode');
    }
  };

  const handleSendSampleTestPayload = async () => {
    if (!activeWebhook) return;
    setSendingTestHit(true);
    try {
      const sampleBody =
        activeWebhook.targetAction === 'create_deal'
          ? {
              deal_title: '500 KVA Industrial Servo Stabilizer Order',
              customer: {
                full_name: 'Vikramaditya Mehta',
                mobile: '+91 98204 51290',
                email: 'vikram@mehtaengineering.in',
                company_name: 'Mehta Precision Engineering Pvt Ltd',
                city: 'Pune',
                gstin: '27AABCM4591K1Z5',
              },
              amount: 485000,
              notes: 'Urgent delivery required before 15th of next month',
            }
          : {
              customer: {
                full_name: 'Rajeshwari Deshmukh',
                mobile: '09811223344',
                email: 'purchase@deshmukhinfra.com',
                company: 'Deshmukh Infra & Electricals',
                city: 'Mumbai',
                gstin: '27AAACD8812B1Z2',
              },
              requirement: {
                budget: 1250000,
                message: 'Looking for GST quotation & product brochure on WhatsApp',
              },
            };

      const hitRes = await sendBrowserTestWebhookHitApi(
        activeWebhook.endpointPath,
        activeWebhook.allowedMethod,
        sampleBody,
        activeWebhook.optionalHeaderSecret,
      );

      const whId = getWebhookKey(activeWebhook);
      const sampleRes = await fetchUniversalWebhookSampleApi(whId);
      if (sampleRes.hasSample && sampleRes.flattenedPayload) {
        setSamplePayload(sampleRes.flattenedPayload);
        if (sampleRes.capturedAt) setSampleCreatedAt(sampleRes.capturedAt);
        setFieldMappings((prev) =>
          prev.length > 0 ? prev : sampleRes.suggestedMappings || [],
        );
      }
      if (wizardStep === 3) {
        await loadLogsForWebhook(whId);
      }
      await loadAll();
      showToast(
        'success',
        hitRes?.mode === 'sample_captured'
          ? 'Test payload captured! Review & confirm your field mappings below.'
          : 'Live test webhook delivered and queued for smart phone upsert!',
      );
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || 'Failed to send test webhook payload',
      );
    } finally {
      setSendingTestHit(false);
    }
  };

  const handleMappingChange = (sourceKey: string, targetField: string) => {
    setFieldMappings((prev) => {
      const withoutSource = prev.filter((m) => m.sourceKey !== sourceKey);
      if (!targetField) return withoutSource;
      const cleaned =
        targetField === 'notes'
          ? withoutSource
          : withoutSource.filter((m) => m.targetField !== targetField);
      return [...cleaned, { sourceKey, targetField }];
    });
  };

  const isPhoneMapped = fieldMappings.some((m) => m.targetField === 'phone');

  const handleSaveAndActivateWebhook = async () => {
    if (!activeWebhook) return;
    if (!isPhoneMapped) {
      showToast(
        'error',
        'Phone / WhatsApp Number mapping is required for smart phone-based deduplication.',
      );
      return;
    }
    setActivatingWebhook(true);
    try {
      const updated = await updateUniversalWebhookApi(getWebhookKey(activeWebhook), {
        fieldMappings,
        status: 'active',
      });
      setActiveWebhook(updated);
      await loadAll();
      showToast(
        'success',
        'Webhook saved and set to Active! Incoming hits will now automatically upsert records.',
      );
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || 'Failed to activate webhook',
      );
    } finally {
      setActivatingWebhook(false);
    }
  };

  const handleToggleWebhookStatus = async (item: UniversalWebhookItem) => {
    const nextStatus = item.status === 'active' ? 'paused' : 'active';
    if (nextStatus === 'active' && !item.fieldMappings?.some((m) => m.targetField === 'phone')) {
      openEditWizard(item, 2);
      showToast('error', 'Map the required Phone field before activating this webhook.');
      return;
    }
    try {
      const key = getWebhookKey(item);
      const updated = await updateUniversalWebhookApi(key, { status: nextStatus });
      if (activeWebhook && getWebhookKey(activeWebhook) === key) {
        setActiveWebhook(updated);
      }
      await loadAll();
      showToast(
        'success',
        `Webhook "${item.name}" is now ${nextStatus.toUpperCase()}.`,
      );
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRotateSecret = async (item: UniversalWebhookItem) => {
    const key = getWebhookKey(item);
    setRotatingSecretId(key);
    try {
      const updated = await rotateUniversalWebhookSecretApi(key);
      if (activeWebhook && getWebhookKey(activeWebhook) === key) {
        setActiveWebhook(updated);
      }
      await loadAll();
      showToast(
        'success',
        'Secret token rotated! Copy the new HTTPS URL for your external platform.',
      );
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to rotate secret');
    } finally {
      setRotatingSecretId(null);
    }
  };

  const handleReplayLog = async (logId: string) => {
    if (!activeWebhook) return;
    setReplayingLogId(logId);
    try {
      const whId = getWebhookKey(activeWebhook);
      const res = await replayUniversalWebhookLogApi(whId, logId);
      await loadLogsForWebhook(whId);
      await loadAll();
      if (res.outcome === 'failed') {
        showToast('error', `Replay failed: ${res.errorReason}`);
      } else {
        showToast(
          'success',
          `Replayed successfully! Outcome: ${res.outcome.toUpperCase()} (${res.normalizedPhone})`,
        );
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to replay log');
    } finally {
      setReplayingLogId(null);
    }
  };

  const currentActionMeta = actionsMeta.find(
    (a) => a.action === (activeWebhook?.targetAction || targetAction),
  );

  const allAvailableSourceKeys = Array.from(
    new Set([
      ...Object.keys(samplePayload || {}),
      ...fieldMappings.map((m) => m.sourceKey),
    ]),
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white">
                Universal Inbound Webhooks (HTTPS-Only Receiver)
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-3 h-3" /> HTTPS Enforced
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Smart Phone Upsert (+91)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Generate custom <code className="text-emerald-300">GET</code> or{' '}
              <code className="text-blue-300">POST</code> webhook endpoints for WordPress,
              Elementor, Typeform, Tally, Shopify, Razorpay, or custom ERPs. Automatically
              captures a sample payload, maps nested fields, and upserts Leads, Contacts, or
              Deals by normalized phone number without creating duplicates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openCreateWizard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            Create Webhook
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Webhooks Dashboard List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading Universal Webhook endpoints...
        </div>
      ) : webhooks.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-950/40">
          <Webhook className="w-9 h-9 text-emerald-400 mx-auto opacity-80" />
          <div className="text-sm font-semibold text-white">
            No Universal Webhooks Configured Yet
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>Create Webhook</strong> to generate an HTTPS-only{' '}
            <code>GET</code> or <code>POST</code> URL, capture a live test payload, map
            fields visually, and automatically upsert records by phone number.
          </p>
          <button
            onClick={openCreateWizard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Your First Webhook
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/70">
                <th className="py-3 px-4">Webhook Name & HTTPS Endpoint</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Target Action</th>
                <th className="py-3 px-3">Dedup Rule</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created / Updated / Failed</th>
                <th className="py-3 px-3">Last Hit</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {webhooks.map((item) => {
                const key = getWebhookKey(item);
                const actionBadge =
                  ACTION_BADGE_META[item.targetAction] || ACTION_BADGE_META.create_lead;
                const fullUrl = buildFullWebhookUrl(item);

                return (
                  <tr key={key} className="hover:bg-slate-900/50 transition group">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{item.name}</span>
                        {(item.triggerWhatsappOnNew || item.triggerWhatsappOnRepeat) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            WA Auto-Reply
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-mono truncate">
                        <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title={fullUrl}>
                          {fullUrl}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          item.allowedMethod === 'GET'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {item.allowedMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium border ${actionBadge.colorClass}`}
                      >
                        {actionBadge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-[11px] text-slate-300">
                      {item.duplicateStrategy === 'overwrite_non_empty' ? (
                        <span className="text-amber-300">Overwrite Non-Empty</span>
                      ) : (
                        <span className="text-slate-300">Fill Empty Only</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {item.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : item.status === 'listening' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Radio className="w-3 h-3 animate-spin" />
                          Listening
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <PauseCircle className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs">
                      <span className="text-emerald-400 font-semibold">
                        {item.stats?.created || 0}
                      </span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-cyan-400 font-semibold">
                        {item.stats?.updated || 0}
                      </span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span
                        className={
                          (item.stats?.failed || 0) > 0
                            ? 'text-rose-400 font-semibold'
                            : 'text-slate-500'
                        }
                      >
                        {item.stats?.failed || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-[11px] text-slate-400">
                      {item.lastReceivedAt
                        ? new Date(item.lastReceivedAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyUrl(item)}
                          title="Copy HTTPS Webhook URL"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
                        >
                          {copiedId === key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy URL
                        </button>

                        <button
                          onClick={() => openEditWizard(item, 2)}
                          title="Capture Sample & Map Fields"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 transition"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Map ({item.fieldMappings?.length || 0})
                        </button>

                        <button
                          onClick={() => openEditWizard(item, 3)}
                          title="View Delivery Logs & Replay"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
                        >
                          <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                          Logs
                        </button>

                        <button
                          onClick={() => openEditWizard(item, 1)}
                          title="Edit Webhook Settings"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleWebhookStatus(item)}
                          title={
                            item.status === 'active'
                              ? 'Pause Webhook'
                              : 'Activate Webhook'
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                            item.status === 'active'
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {item.status === 'active' ? 'Pause' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleRotateSecret(item)}
                          disabled={rotatingSecretId === key}
                          title="Rotate Secret Token"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                        >
                          <KeyRound
                            className={`w-3.5 h-3.5 ${
                              rotatingSecretId === key ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3-Step Create / Edit / Logs Modal Drawer */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header & Step Tabs */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {activeWebhook
                      ? `Webhook: ${activeWebhook.name}`
                      : 'Create Universal HTTPS Webhook'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> HTTPS-Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure method & dedup rules, capture a sample payload to map fields,
                  and inspect real-time delivery logs.
                </p>
              </div>
              <button
                onClick={() => setWizardOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Navigation Bar */}
            <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setWizardStep(1)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  wizardStep === 1
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/25 inline-flex items-center justify-center text-[11px]">
                  1
                </span>
                Endpoint & Action Config
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <button
                onClick={() => {
                  if (!activeWebhook) {
                    showToast('error', 'Save Step 1 first to generate your HTTPS URL.');
                    return;
                  }
                  setWizardStep(2);
                }}
                disabled={!activeWebhook}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-40 ${
                  wizardStep === 2
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/25 inline-flex items-center justify-center text-[11px]">
                  2
                </span>
                Capture Sample & Map Fields
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <button
                onClick={() => {
                  if (!activeWebhook) return;
                  setWizardStep(3);
                  loadLogsForWebhook(getWebhookKey(activeWebhook));
                }}
                disabled={!activeWebhook}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-40 ${
                  wizardStep === 3
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-black/25 inline-flex items-center justify-center text-[11px]">
                  3
                </span>
                Delivery Logs & Replay
              </button>
            </div>

            {/* Step Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* STEP 1: Endpoint & Action Config */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Webhook Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Website RFQ Form, Shopify Orders, Justdial Custom"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Allowed HTTP Method *
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['POST', 'GET'] as WebhookMethod[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setAllowedMethod(m)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                              allowedMethod === m
                                ? m === 'GET'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-blue-500/20 border-blue-500 text-blue-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span>{m}</span>
                            <span className="text-[10px] font-normal opacity-80">
                              {m === 'POST' ? '(JSON / Form Body)' : '(Query Params)'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Target CRM Action */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target CRM Action (Extensible Strategy) *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(actionsMeta.length > 0
                        ? actionsMeta
                        : [
                            {
                              action: 'create_lead' as WebhookTargetAction,
                              label: 'Create / Upsert Lead',
                              description:
                                'Upserts a Lead by normalized phone (+91) with round-robin assignment.',
                              fields: [],
                            },
                            {
                              action: 'create_contact' as WebhookTargetAction,
                              label: 'Create / Upsert B2B Contact',
                              description:
                                'Upserts a B2B Account / Contact by normalized phone (+91).',
                              fields: [],
                            },
                            {
                              action: 'create_deal' as WebhookTargetAction,
                              label: 'Create / Upsert Deal',
                              description:
                                'Upserts a Sales Pipeline Deal by normalized phone (+91).',
                              fields: [],
                            },
                          ]
                      ).map((act) => (
                        <button
                          key={act.action}
                          type="button"
                          onClick={() => setTargetAction(act.action)}
                          className={`text-left p-3.5 rounded-xl border transition ${
                            targetAction === act.action
                              ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{act.label}</div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {act.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duplicate Phone Handling Strategy */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Duplicate Phone Number Handling Rule (Smart Phone Upsert) *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDuplicateStrategy('fill_empty')}
                        className={`text-left p-3.5 rounded-xl border transition ${
                          duplicateStrategy === 'fill_empty'
                            ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            Fill Empty Fields Only
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          If a record with the same normalized phone (<code>+91...</code>)
                          already exists, only populate blank fields and append a timeline
                          activity log without overwriting existing rep edits.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDuplicateStrategy('overwrite_non_empty')}
                        className={`text-left p-3.5 rounded-xl border transition ${
                          duplicateStrategy === 'overwrite_non_empty'
                            ? 'bg-amber-500/15 border-amber-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            Update Non-Empty Incoming Fields
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                            Latest Wins
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Overwrites mapped fields with non-empty incoming values while
                          safely preserving pipeline stage and assigned owner.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Auto-Reply & Optional Header Secret */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-white">
                        Instant WhatsApp Welcome Automation
                      </div>
                      <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={triggerWhatsappOnNew}
                          onChange={(e) => setTriggerWhatsappOnNew(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Trigger WhatsApp Template on New Record Created</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={triggerWhatsappOnRepeat}
                          onChange={(e) => setTriggerWhatsappOnRepeat(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>
                          Also trigger WhatsApp on Repeat Webhook Hits (Existing Phone)
                        </span>
                      </label>
                      {(triggerWhatsappOnNew || triggerWhatsappOnRepeat) && (
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Select Approved WhatsApp Template
                          </label>
                          <select
                            value={whatsappTemplateId}
                            onChange={(e) => setWhatsappTemplateId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="">Default Welcome / Inquiry Template</option>
                            {templates.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name} ({tpl.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-white">
                        Optional Custom Header Secret (<code>X-Webhook-Secret</code>)
                      </label>
                      <p className="text-[11px] text-slate-400">
                        In addition to the encrypted URL token, you can require senders to
                        pass an <code>X-Webhook-Secret</code> header.
                      </p>
                      <input
                        type="text"
                        value={optionalHeaderSecret}
                        onChange={(e) => setOptionalHeaderSecret(e.target.value)}
                        placeholder="Leave blank if sender only supports URL webhooks"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep1}
                      disabled={savingStep1}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                    >
                      {savingStep1
                        ? 'Saving...'
                        : activeWebhook
                        ? 'Save & Continue to Field Mapping'
                        : 'Generate HTTPS Endpoint & Capture Sample'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Capture Sample & Map Fields */}
              {wizardStep === 2 && activeWebhook && (
                <div className="space-y-5">
                  {/* HTTPS URL Copy Box */}
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                            activeWebhook.allowedMethod === 'GET'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {activeWebhook.allowedMethod}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          Your Unique HTTPS-Only Webhook Endpoint URL
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePutIntoListenMode}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
                        >
                          <Radio
                            className={`w-3.5 h-3.5 ${
                              pollingSample ? 'animate-spin' : ''
                            }`}
                          />
                          {activeWebhook.status === 'listening'
                            ? 'Listening for Sample...'
                            : 'Re-listen for Sample'}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendSampleTestPayload}
                          disabled={sendingTestHit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {sendingTestHit
                            ? 'Sending...'
                            : 'Send Test Payload (1-Click)'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-emerald-300 break-all flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{buildFullWebhookUrl(activeWebhook)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(activeWebhook)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy HTTPS URL
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {activeWebhook.allowedMethod === 'GET'
                          ? 'Pass fields via URL query string: ?customer_name=Rajesh&phone=9876543210&city=Delhi'
                          : 'Send application/json or application/x-www-form-urlencoded POST payload.'}
                      </span>
                      {sampleCreatedAt && (
                        <span className="text-emerald-400 font-medium">
                          Latest sample captured at{' '}
                          {new Date(sampleCreatedAt).toLocaleTimeString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Field Mapping Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          Field Mapping Table ({currentActionMeta?.label || 'CRM Action'})
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Map incoming payload keys to CRM fields.{' '}
                          <strong className="text-emerald-300">
                            Phone / WhatsApp Number
                          </strong>{' '}
                          is mandatory for atomic deduplication.
                        </p>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          isPhoneMapped
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {isPhoneMapped
                          ? 'Phone Field Mapped ✓'
                          : 'Required: Map Phone Field'}
                      </div>
                    </div>

                    {allAvailableSourceKeys.length === 0 ? (
                      <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3 bg-slate-950/50">
                        <Radio className="w-7 h-7 text-amber-400 animate-pulse mx-auto" />
                        <div className="text-xs font-semibold text-white">
                          Waiting for Sample Webhook Hit...
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          Send a live request from your external tool to the HTTPS URL
                          above, or click <strong>Send Test Payload (1-Click)</strong> to
                          populate realistic B2B fields immediately.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                              <th className="py-2.5 px-4">Incoming Payload Key</th>
                              <th className="py-2.5 px-4">Sample Value Captured</th>
                              <th className="py-2.5 px-4">Target Leadsetu CRM Field</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70">
                            {allAvailableSourceKeys.map((srcKey) => {
                              const currentTarget =
                                fieldMappings.find((m) => m.sourceKey === srcKey)
                                  ?.targetField || '';
                              const sampleVal = samplePayload?.[srcKey];

                              return (
                                <tr
                                  key={srcKey}
                                  className={
                                    currentTarget === 'phone'
                                      ? 'bg-emerald-500/10'
                                      : 'hover:bg-slate-900/40'
                                  }
                                >
                                  <td className="py-2.5 px-4 font-mono text-xs text-cyan-300">
                                    {srcKey}
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px] max-w-xs truncate">
                                    {sampleVal !== undefined
                                      ? String(sampleVal)
                                      : '(Mapped previously)'}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <select
                                      value={currentTarget}
                                      onChange={(e) =>
                                        handleMappingChange(srcKey, e.target.value)
                                      }
                                      className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                                        currentTarget === 'phone'
                                          ? 'border-emerald-500 text-emerald-300 font-semibold'
                                          : currentTarget
                                          ? 'border-cyan-500/50 text-white'
                                          : 'border-slate-800 text-slate-400'
                                      }`}
                                    >
                                      <option value="">-- Ignore / Unmapped --</option>
                                      {(currentActionMeta?.fields || []).map((f) => (
                                        <option key={f.key} value={f.key}>
                                          {f.label} {f.required ? '★ (Required)' : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      ← Back to Config
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setWizardStep(3);
                          loadLogsForWebhook(getWebhookKey(activeWebhook));
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                      >
                        View Delivery Logs
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAndActivateWebhook}
                        disabled={activatingWebhook || !isPhoneMapped}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 disabled:opacity-40"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {activatingWebhook
                          ? 'Activating...'
                          : 'Save Mapping & Activate Webhook'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Delivery Logs & Replay Drawer */}
              {wizardStep === 3 && activeWebhook && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Last 50 Webhook Deliveries (7-Day Auto-Retention)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Inspect flattened payloads, normalized Indian phone numbers (
                        <code>+91XXXXXXXXXX</code>), and replay failed deliveries after
                        adjusting field mappings.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendSampleTestPayload}
                        disabled={sendingTestHit}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {sendingTestHit ? 'Sending...' : 'Fire Live Test Hit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadLogsForWebhook(getWebhookKey(activeWebhook))}
                        disabled={loadingLogs}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`}
                        />
                        Refresh Logs
                      </button>
                    </div>
                  </div>

                  {loadingLogs ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Loading delivery logs...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                      No webhook deliveries logged yet. Click{' '}
                      <strong>Fire Live Test Hit</strong> above to test your pipeline!
                    </div>
                  ) : (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3">Normalized Phone</th>
                            <th className="py-2.5 px-3">Outcome</th>
                            <th className="py-2.5 px-3">Matched Entity</th>
                            <th className="py-2.5 px-3">Timestamp</th>
                            <th className="py-2.5 px-3 text-right">Inspect / Replay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {logs.map((log) => {
                            const logKey = log.id || log._id || '';
                            const isExpanded = expandedLogId === logKey;
                            return (
                              <React.Fragment key={logKey}>
                                <tr className="hover:bg-slate-900/40">
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        log.method === 'GET'
                                          ? 'bg-emerald-500/15 text-emerald-300'
                                          : 'bg-blue-500/15 text-blue-300'
                                      }`}
                                    >
                                      {log.method}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-xs text-slate-200">
                                    {log.normalizedPhone || '—'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {log.outcome === 'created' && (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        Created New
                                      </span>
                                    )}
                                    {log.outcome === 'updated' && (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                        Dedup Updated
                                      </span>
                                    )}
                                    {log.outcome === 'sample_captured' && (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        Sample Captured
                                      </span>
                                    )}
                                    {log.outcome === 'failed' && (
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                        title={log.errorReason}
                                      >
                                        Failed: {log.errorReason || 'Error'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                                    {log.matchedEntityType
                                      ? `${log.matchedEntityType.toUpperCase()} (${String(
                                          log.matchedRecordId || '',
                                        ).slice(-6)})`
                                      : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                                    {new Date(log.createdAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedLogId(isExpanded ? null : logKey)
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                        JSON
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleReplayLog(logKey)}
                                        disabled={replayingLogId === logKey}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium"
                                      >
                                        <RotateCcw
                                          className={`w-3 h-3 ${
                                            replayingLogId === logKey
                                              ? 'animate-spin'
                                              : ''
                                          }`}
                                        />
                                        Replay
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-950">
                                    <td colSpan={6} className="p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                        <div>
                                          <div className="font-semibold text-slate-400 mb-1">
                                            Raw Incoming Payload:
                                          </div>
                                          <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-300 font-mono overflow-x-auto max-h-48">
                                            {JSON.stringify(log.rawPayload, null, 2)}
                                          </pre>
                                        </div>
                                        <div>
                                          <div className="font-semibold text-slate-400 mb-1">
                                            Flattened Dot-Notation Keys:
                                          </div>
                                          <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-cyan-300 font-mono overflow-x-auto max-h-48">
                                            {JSON.stringify(
                                              log.flattenedPayload,
                                              null,
                                              2,
                                            )}
                                          </pre>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

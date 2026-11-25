'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FlaskConical,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  exchangeMetaOAuthCodeApi,
  fetchMetaConnectionsApi,
  fetchMetaOAuthUrlApi,
  simulateMetaTestLeadApi,
  subscribeMetaPageApi,
  unsubscribeMetaPageApi,
  updateMetaFormConfigApi,
  type MetaConnectionsOverviewResponse,
  type MetaFieldMappingItem,
  type MetaLeadFormConfigDto,
  type MetaPageConnectionDto,
} from '@/lib/meta-leads-api';
import { fetchWhatsAppTemplatesApi } from '@/lib/inbox-api';
import { getErrorMessage } from '@/lib/api-client';
import type { WhatsAppTemplate } from '@/types/contracts';

function resolveBackendBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
  return configured.replace(/\/v1\/?$/, '');
}

const CRM_FIELD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'name', label: 'Lead Full Name (name)' },
  { value: 'phone', label: 'WhatsApp Mobile (+91 phone)' },
  { value: 'email', label: 'Email Address (email)' },
  { value: 'company', label: 'Company / Business Name (company)' },
  { value: 'city', label: 'Delivery City (city)' },
  { value: 'estimatedValue', label: 'Est. Deal Value ₹ (estimatedValue)' },
  { value: 'notes', label: 'Requirement Notes (notes)' },
  { value: 'rawFields', label: 'Store in Meta Form Answers (rawFields)' },
];

export default function MetaLeadAdsOAuthPanel() {
  const [overview, setOverview] =
    useState<MetaConnectionsOverviewResponse | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [togglingPageId, setTogglingPageId] = useState<string | null>(null);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [savingFormKey, setSavingFormKey] = useState<string | null>(null);
  const [simulatingLead, setSimulatingLead] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local editable form state keyed by `${pageId}:${formId}`
  const [formDrafts, setFormDrafts] = useState<
    Record<
      string,
      {
        autoReplyEnabled: boolean;
        whatsappTemplateId: string;
        defaultAssigneeId: string;
        fieldMappings: MetaFieldMappingItem[];
      }
    >
  >({});

  const handledCallbackRef = useRef(false);

  const hydrateDrafts = useCallback(
    (connections: MetaPageConnectionDto[]) => {
      const next: typeof formDrafts = {};
      for (const page of connections) {
        for (const form of page.forms || []) {
          next[`${page.pageId}:${form.formId}`] = {
            autoReplyEnabled: form.autoReplyEnabled !== false,
            whatsappTemplateId: form.whatsappTemplateId || '',
            defaultAssigneeId: form.defaultAssigneeId || '',
            fieldMappings:
              Array.isArray(form.fieldMappings) && form.fieldMappings.length > 0
                ? form.fieldMappings
                : [
                    { metaFieldKey: 'full_name', crmFieldKey: 'name' },
                    { metaFieldKey: 'phone_number', crmFieldKey: 'phone' },
                    { metaFieldKey: 'email', crmFieldKey: 'email' },
                  ],
          };
        }
      }
      setFormDrafts(next);
      if (connections.length > 0) {
        setExpandedPageId((prev) => prev || connections[0].pageId);
      }
    },
    [],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [connRes, tplRes] = await Promise.all([
        fetchMetaConnectionsApi(),
        fetchWhatsAppTemplatesApi({ activeOnly: true }).catch(() => ({
          data: [],
          supportedVariables: [],
        })),
      ]);
      setOverview(connRes);
      setTemplates(tplRes.data || []);
      hydrateDrafts(connRes.connections || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hydrateDrafts]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Handle OAuth Redirect Callback (?code=...&state=...) automatically
  useEffect(() => {
    if (handledCallbackRef.current || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return;

    handledCallbackRef.current = true;
    setConnectingOAuth(true);
    setNotice(null);
    setError(null);

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    exchangeMetaOAuthCodeApi({ code, state, redirectUri })
      .then(async (res) => {
        setNotice(
          `Connected ${res.connectedCount} Facebook Page(s) via Meta OAuth (${
            overview?.graphVersion || 'v25.0'
          }). Toggle webhook subscription below to sync Lead Forms!`,
        );
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, '', url.toString());
        await loadAll();
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setConnectingOAuth(false);
      });
  }, [loadAll, overview?.graphVersion]);

  const handleConnectFacebookPage = async (forceSandboxDemo = false) => {
    setConnectingOAuth(true);
    setError(null);
    setNotice(null);
    try {
      const redirectUri =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : undefined;
      const oauth = await fetchMetaOAuthUrlApi(redirectUri);

      if (!forceSandboxDemo && oauth.isLiveMetaAppConfigured) {
        window.location.href = oauth.oauthUrl;
        return;
      }

      // When META_APP_ID is not yet set in .env (or user clicked Sandbox Connect), complete exchange directly
      const exchanged = await exchangeMetaOAuthCodeApi({
        code: 'sandbox_demo_connect',
        state: oauth.state,
        redirectUri: oauth.redirectUri,
      });
      if (exchanged.connections?.[0]) {
        await subscribeMetaPageApi(exchanged.connections[0].pageId);
      }
      await loadAll();
      setNotice(
        'Connected Facebook Page & subscribed to leadgen webhook forms! Expand Lead Forms below to customize field mappings.',
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleToggleSubscription = async (page: MetaPageConnectionDto) => {
    setTogglingPageId(page.pageId);
    setError(null);
    setNotice(null);
    try {
      if (page.isSubscribed) {
        await unsubscribeMetaPageApi(page.pageId);
        setNotice(
          `Paused leadgen webhook subscription for "${page.pageName}".`,
        );
      } else {
        await subscribeMetaPageApi(page.pageId);
        setExpandedPageId(page.pageId);
        setNotice(
          `Subscribed "${page.pageName}" to Meta leadgen webhooks & synced active Lead Forms!`,
        );
      }
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingPageId(null);
    }
  };

  const handleSaveFormConfig = async (
    pageId: string,
    form: MetaLeadFormConfigDto,
  ) => {
    const key = `${pageId}:${form.formId}`;
    const draft = formDrafts[key];
    if (!draft) return;

    setSavingFormKey(key);
    setError(null);
    setNotice(null);
    try {
      await updateMetaFormConfigApi(pageId, form.formId, draft);
      setNotice(
        `Saved field mappings & WhatsApp auto-reply settings for "${form.formName}".`,
      );
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingFormKey(null);
    }
  };

  const handleSimulateLead = async (pageId?: string, formId?: string) => {
    setSimulatingLead(true);
    setError(null);
    setNotice(null);
    try {
      const res = await simulateMetaTestLeadApi({ pageId, formId });
      setNotice(
        `Meta Lead Ad ingested (${res.leadgenId} → ${res.outcome.toUpperCase()})${
          res.whatsAppSent ? ' · Instant WhatsApp welcome sent!' : ''
        }`,
      );
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSimulatingLead(false);
    }
  };

  const updateDraftField = (
    key: string,
    patch: Partial<(typeof formDrafts)[string]>,
  ) => {
    setFormDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          autoReplyEnabled: true,
          whatsappTemplateId: '',
          defaultAssigneeId: '',
          fieldMappings: [],
        }),
        ...patch,
      },
    }));
  };

  const renderStatusBadge = (page: MetaPageConnectionDto) => {
    if (page.status === 'needs_reconnect') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
          <AlertTriangle className="w-3 h-3" /> Reconnect Required
        </span>
      );
    }
    if (page.isSubscribed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Live Syncing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
        Paused
      </span>
    );
  };

  const webhookFullUrl = `${resolveBackendBaseUrl()}${
    overview?.webhookCallbackPath || '/v1/webhooks/meta/leads'
  }`;

  return (
    <div className="bg-white dark:bg-[#0D1628] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-5 text-xs">
      {/* Header Card */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
                Meta (Facebook &amp; Instagram) Lead Ads — OAuth &amp; Form Field Mapper
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                Graph API {overview?.graphVersion || 'v25.0'} · AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect your Facebook Pages via OAuth, subscribe to real-time `leadgen` webhooks, map custom form questions to CRM fields, and fire instant WhatsApp greetings.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={ connectingOAuth }
            onClick={() => void handleConnectFacebookPage(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-xs disabled:opacity-50"
          >
            {connectingOAuth ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span>Connect Facebook Page</span>
          </button>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 font-bold text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Leads
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-200 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-200 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/*Connected Pages List */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading connected Facebook Pages &amp; Lead Forms...</span>
        </div>
      ) : !overview || overview.connections.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/15 text-center space-y-3">
          <p className="font-bold text-brand-navy dark:text-white text-sm">
            No Facebook Pages Connected Yet
          </p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Click <strong>Connect Facebook Page</strong> above to authorize `leads_retrieval` and `pages_manage_metadata` permissions and start syncing Facebook &amp; Instagram Instant Forms.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {overview.connections.map((page) => {
            const isExpanded = expandedPageId === page.pageId;
            return (
              <div
                key={page.pageId}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#111D33] overflow-hidden"
              >
                <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-brand-navy dark:text-white">
                        {page.pageName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        (ID: {page.pageId})
                      </span>
                      {renderStatusBadge(page)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                      <span>
                        Last Lead Received:{' '}
                        <strong>
                          {page.lastLeadReceivedAt
                            ? new Date(page.lastLeadReceivedAt).toLocaleString(
                                'en-IN',
                              )
                            : 'No leads yet'}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>{page.forms.length} Lead Form(s)</span>
                    </div>
                    {page.lastError && (
                      <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                        Error: {page.lastError}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={page.isSubscribed}
                        disabled={togglingPageId === page.pageId}
                        onChange={() => void handleToggleSubscription(page)}
                      />
                      <span>
                        {togglingPageId === page.pageId
                          ? 'Updating...'
                          : page.isSubscribed
                            ? 'Webhook Subscribed'
                            : 'Subscribe Webhook'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPageId(isExpanded ? null : page.pageId)
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-navy text-white font-bold"
                    >
                      <span>Lead Forms &amp; Field Mapping</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Lead Forms & Field Mapping Drawer/Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-200/80 dark:border-white/10 p-4 bg-white dark:bg-[#0D1628] space-y-4">
                    {page.forms.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111D33] text-center text-slate-500">
                        Toggle <strong>Subscribe Webhook</strong> above to fetch active Lead Forms from this Facebook Page.
                      </div>
                    ) : (
                      page.forms.map((form) => {
                        const key = `${page.pageId}:${form.formId}`;
                        const draft = formDrafts[key] || {
                          autoReplyEnabled: form.autoReplyEnabled,
                          whatsappTemplateId: form.whatsappTemplateId || '',
                          defaultAssigneeId: form.defaultAssigneeId || '',
                          fieldMappings: form.fieldMappings || [],
                        };

                        return (
                          <div
                            key={form.formId}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#111D33] space-y-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="font-extrabold text-brand-navy dark:text-white text-sm">
                                  {form.formName}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  Form ID: {form.formId} · Status: {form.status}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={simulatingLead}
                                onClick={() =>
                                  void handleSimulateLead(
                                    page.pageId,
                                    form.formId,
                                  )
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold"
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                                <span>Test Form Lead</span>
                              </button>
                            </div>

                            {/* Form Auto-Reply, Template & Assignee Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.autoReplyEnabled}
                                  onChange={(e) =>
                                    updateDraftField(key, {
                                      autoReplyEnabled: e.target.checked,
                                    })
                                  }
                                />
                                <span>Instant WhatsApp Auto-Reply</span>
                              </label>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  Approved WhatsApp Template
                                </label>
                                <select
                                  value={draft.whatsappTemplateId}
                                  onChange={(e) =>
                                    updateDraftField(key, {
                                      whatsappTemplateId: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                                >
                                  <option value="">
                                    Default Speed-to-Lead Welcome Text
                                  </option>
                                  {templates.map((t) => (
                                    <option key={t.id} value={t.name}>
                                      {t.name} ({t.category})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  Lead Owner / Routing
                                </label>
                                <select
                                  value={draft.defaultAssigneeId}
                                  onChange={(e) =>
                                    updateDraftField(key, {
                                      defaultAssigneeId: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                                >
                                  <option value="">
                                    Smart Round-Robin / Territory Routing
                                  </option>
                                  {(overview.teamMembers || []).map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.role})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Interactive Field Mapper Table */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                  Field Mapper (Meta Form Question → CRM Lead Field)
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDraftField(key, {
                                      fieldMappings: [
                                        ...draft.fieldMappings,
                                        {
                                          metaFieldKey: 'custom_question',
                                          crmFieldKey: 'rawFields',
                                        },
                                      ],
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue"
                                >
                                  <Plus className="w-3 h-3" /> Add Field Row
                                </button>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1628]">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/10 text-[10px] font-bold uppercase text-slate-400">
                                      <th className="py-2 px-3">
                                        Meta Question Key
                                      </th>
                                      <th className="py-2 px-3">
                                        CRM Lead Target Field
                                      </th>
                                      <th className="py-2 px-3 text-right">
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {draft.fieldMappings.map((row, idx) => (
                                      <tr key={`${row.metaFieldKey}-${idx}`}>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={row.metaFieldKey}
                                            onChange={(e) => {
                                              const nextRows = [
                                                ...draft.fieldMappings,
                                              ];
                                              nextRows[idx] = {
                                                ...row,
                                                metaFieldKey: e.target.value,
                                              };
                                              updateDraftField(key, {
                                                fieldMappings: nextRows,
                                              });
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] font-mono text-[11px]"
                                          />
                                        </td>
                                        <td className="py-2 px-3">
                                          <select
                                            value={row.crmFieldKey}
                                            onChange={(e) => {
                                              const nextRows = [
                                                ...draft.fieldMappings,
                                              ];
                                              nextRows[idx] = {
                                                ...row,
                                                crmFieldKey: e.target.value,
                                              };
                                              updateDraftField(key, {
                                                fieldMappings: nextRows,
                                              });
                                            }}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-[11px] font-semibold"
                                          >
                                            {CRM_FIELD_OPTIONS.map((opt) => (
                                              <option
                                                key={opt.value}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextRows =
                                                draft.fieldMappings.filter(
                                                  (_, i) => i !== idx,
                                                );
                                              updateDraftField(key, {
                                                fieldMappings: nextRows,
                                              });
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-600"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={savingFormKey === key}
                                onClick={() =>
                                  void handleSaveFormConfig(page.pageId, form)
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold disabled:opacity-50"
                              >
                                {savingFormKey === key ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>Save Form Mapping</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* "Test Your Connection" Guide Box */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            <span>Test Your Connection with Meta&apos;s Lead Ads Testing Tool</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Configure your Meta App Webhook URL to{' '}
            <code className="font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#0D1628]">
              {webhookFullUrl}
            </code>{' '}
            (Verify Token:{' '}
            <code className="font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#0D1628]">
              {overview?.verifyToken || 'leadsetu_meta_leads_verify_2026'}
            </code>
            ), then send a test lead from Meta&apos;s Developer Testing Tool or click{' '}
            <strong>Simulate Test Lead</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(webhookFullUrl).catch(() => {});
              setCopiedWebhook(true);
              setTimeout(() => setCopiedWebhook(false), 1600);
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 font-bold"
          >
            {copiedWebhook ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy Webhook</span>
          </button>

          <a
            href="https://developers.facebook.com/tools/lead-ads-testing"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Meta Lead Ads Testing Tool</span>
          </a>
        </div>
      </div>
    </div>
  );
}

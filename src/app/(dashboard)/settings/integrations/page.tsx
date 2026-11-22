'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Send,
  Webhook,
  Loader2,
  AlertCircle,
  ArrowRight,
  Users,
  Code2,
  MessageSquare,
  Phone,
  PlugZap,
  Sparkles,
  Unplug,
  Wifi,
  Building2,
} from 'lucide-react';
import type {
  WebhookCaptureResponse,
  WebhookConfigResponse,
  WhatsAppCloudConfig,
  WhatsAppCloudTestResponse,
} from '@/types/contracts';
import {
  fetchWebhookConfigApi,
  rotateWebhookKeyApi,
  sendTestWebhookApi,
} from '@/lib/leads-capture-api';
import {
  activateLeadsetuManagedWhatsAppApi,
  completeEmbeddedSignupApi,
  connectCompanyWhatsAppNumberApi,
  disconnectWhatsAppApi,
  fetchWhatsAppCloudConfigApi,
  testWhatsAppCloudConfigApi,
} from '@/lib/inbox-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { isWorkspaceAdminRole } from '@/lib/feature-access';
import MetaCapiPanel from '@/components/integrations/MetaCapiPanel';

interface FacebookSdkLoginResponse {
  authResponse?: {
    code?: string;
    accessToken?: string;
  };
  status?: string;
}

interface FacebookSdkInstance {
  init: (params: {
    appId: string;
    autoLogAppEvents: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookSdkLoginResponse) => void,
    options: {
      config_id: string;
      response_type: 'code';
      override_default_response_type: true;
      extras: {
        setup: Record<string, unknown>;
        featureType: string;
        sessionInfoVersion: '3';
      };
    },
  ) => void;
}

declare global {
  interface Window {
    FB?: FacebookSdkInstance;
    fbAsyncInit?: () => void;
  }
}

function loadFacebookSdk(appId: string): Promise<FacebookSdkInstance> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Facebook SDK can only run in browser context.'));
      return;
    }

    if (window.FB) {
      window.FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
      resolve(window.FB);
      return;
    }

    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          'Meta Embedded Signup popup script could not load. Please allow connect.facebook.net and retry.',
        ),
      );
    }, 12000);

    window.fbAsyncInit = () => {
      window.clearTimeout(timeout);
      if (!window.FB) {
        reject(new Error('Meta Facebook SDK failed to initialize.'));
        return;
      }
      window.FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
      resolve(window.FB);
    };

    const existingScript = document.getElementById('facebook-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(
          new Error(
            'Unable to reach Meta Embedded Signup SDK (connect.facebook.net).',
          ),
        );
      };
      document.body.appendChild(script);
    }
  });
}

export default function IntegrationsSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const isAdmin = isWorkspaceAdminRole(user);

  const [config, setConfig] = useState<WebhookConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<WebhookCaptureResponse | null>(
    null,
  );

  // Built-In Leadsetu WhatsApp Onboarding state (only essential company info)
  const [waConfig, setWaConfig] = useState<WhatsAppCloudConfig | null>(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waCompanyName, setWaCompanyName] = useState('');
  const [waCompanyPhone, setWaCompanyPhone] = useState('');
  const [waSavingNumber, setWaSavingNumber] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waActivatingManaged, setWaActivatingManaged] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waDisconnecting, setWaDisconnecting] = useState(false);
  const [waFeedback, setWaFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Live Test Fire form state
  const [payloadPreset, setPayloadPreset] = useState<'indiamart' | 'website'>(
    'indiamart',
  );
  const [testName, setTestName] = useState('Sandeep Kulkarni');
  const [testCompany, setTestCompany] = useState('Kulkarni Switchgears Pvt Ltd');
  const [testPhone, setTestPhone] = useState('+91 98204 77112');
  const [testCity, setTestCity] = useState('Pune');
  const [testValue, setTestValue] = useState('275000');
  const [testNotes, setTestNotes] = useState(
    'Urgent quote needed for 3-Phase Servo Stabilizers (2 units)',
  );

  const apiHost = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'
  ).replace(/\/v1\/?$/, '');

  const fullWebhookUrl = config
    ? `${apiHost}${config.webhookPath}`
    : `${apiHost}/v1/leads/webhook/loading...`;

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWebhookConfigApi();
      setConfig(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load workspace webhook configuration.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadWaConfig = useCallback(async () => {
    setWaLoading(true);
    try {
      const data = await fetchWhatsAppCloudConfigApi();
      setWaConfig(data);
      setWaCompanyName(
        data.businessDisplayName ||
          tenant?.companyName ||
          tenant?.name ||
          '',
      );
      setWaCompanyPhone(data.verifiedPhoneNumber || user?.phone || '');
    } catch {
      // ignore if whatsappCloud module is disabled for this workspace
    } finally {
      setWaLoading(false);
    }
  }, [tenant?.companyName, tenant?.name, user?.phone]);

  useEffect(() => {
    void loadConfig();
    void loadWaConfig();
  }, [loadConfig, loadWaConfig]);

  const handleCopyText = async (
    value: string,
    onDone: (flag: boolean) => void,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      onDone(true);
      setTimeout(() => onDone(false), 1800);
    } catch {
      setError('Clipboard copy failed.');
    }
  };

  const handleConnectCompanyNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waCompanyPhone.trim()) {
      setWaFeedback({
        type: 'error',
        message: 'Please enter your company WhatsApp mobile number (e.g. +91 98204 77112).',
      });
      return;
    }

    setWaSavingNumber(true);
    setWaFeedback(null);
    try {
      const updated = await connectCompanyWhatsAppNumberApi({
        phoneNumber: waCompanyPhone.trim(),
        businessDisplayName: waCompanyName.trim() || undefined,
      });
      setWaConfig(updated);
      setWaCompanyName(updated.businessDisplayName || waCompanyName.trim());
      setWaCompanyPhone(updated.verifiedPhoneNumber || waCompanyPhone.trim());
      setWaFeedback({
        type: 'success',
        message: `Company WhatsApp connected (${updated.verifiedPhoneNumber}${
          updated.businessDisplayName ? ` · ${updated.businessDisplayName}` : ''
        }). All API & webhook routing is managed automatically by Leadsetu.`,
      });
    } catch (err) {
      setWaFeedback({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setWaSavingNumber(false);
    }
  };

  const handleOneClickEmbeddedSignup = async () => {
    if (
      !waConfig?.embeddedSignupAvailable ||
      !waConfig.metaAppId ||
      !waConfig.embeddedSignupConfigId
    ) {
      setWaFeedback({
        type: 'error',
        message:
          '1-Click Embedded Signup is still being provisioned by Leadsetu HQ. Please use Leadsetu Managed Gateway if available, or contact support.',
      });
      return;
    }

    setWaConnecting(true);
    setWaFeedback(null);

    let capturedWabaId = '';
    let capturedPhoneNumberId = '';

    const onEmbeddedMessage = (event: MessageEvent) => {
      if (
        !event.origin.endsWith('.facebook.com') &&
        event.origin !== 'https://www.facebook.com'
      ) {
        return;
      }
      try {
        const parsed =
          typeof event.data === 'string'
            ? (JSON.parse(event.data) as Record<string, unknown>)
            : (event.data as Record<string, unknown>);
        if (
          parsed &&
          parsed.type === 'WA_EMBEDDED_SIGNUP' &&
          (parsed.event === 'FINISH' || parsed.event === 'FINISH_ONLY_WABA')
        ) {
          const payload = (parsed.data || {}) as Record<string, unknown>;
          if (typeof payload.waba_id === 'string') {
            capturedWabaId = payload.waba_id;
          }
          if (typeof payload.phone_number_id === 'string') {
            capturedPhoneNumberId = payload.phone_number_id;
          }
        }
      } catch {
        // Ignore non-JSON postMessage events from Meta popup
      }
    };

    try {
      window.addEventListener('message', onEmbeddedMessage);
      const fb = await loadFacebookSdk(waConfig.metaAppId);

      const finishCodeExchange = async (code: string) => {
        try {
          const updated = await completeEmbeddedSignupApi({
            code,
            ...(capturedWabaId ? { wabaId: capturedWabaId } : {}),
            ...(capturedPhoneNumberId
              ? { phoneNumberId: capturedPhoneNumberId }
              : {}),
          });
          setWaConfig(updated);
          setWaFeedback({
            type: 'success',
            message: `WhatsApp Business connected cleanly${
              updated.verifiedPhoneNumber
                ? ` · ${updated.verifiedPhoneNumber}`
                : ''
            }${
              updated.businessDisplayName
                ? ` (${updated.businessDisplayName})`
                : ''
            }`,
          });
        } catch (err) {
          setWaFeedback({
            type: 'error',
            message: getErrorMessage(err),
          });
        } finally {
          window.removeEventListener('message', onEmbeddedMessage);
          setWaConnecting(false);
        }
      };

      fb.login(
        (response) => {
          const code = response?.authResponse?.code;
          if (!code) {
            window.removeEventListener('message', onEmbeddedMessage);
            setWaConnecting(false);
            setWaFeedback({
              type: 'error',
              message:
                'WhatsApp signup window was closed before completing authorization.',
            });
            return;
          }
          void finishCodeExchange(code);
        },
        {
          config_id: waConfig.embeddedSignupConfigId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: '',
            sessionInfoVersion: '3',
          },
        },
      );
    } catch (err) {
      window.removeEventListener('message', onEmbeddedMessage);
      setWaConnecting(false);
      setWaFeedback({
        type: 'error',
        message: getErrorMessage(err),
      });
    }
  };

  const handleActivateManagedGateway = async () => {
    setWaActivatingManaged(true);
    setWaFeedback(null);
    try {
      const updated = await activateLeadsetuManagedWhatsAppApi();
      setWaConfig(updated);
      setWaFeedback({
        type: 'success',
        message: `Leadsetu Managed WhatsApp Gateway activated${
          updated.verifiedPhoneNumber
            ? ` (${updated.verifiedPhoneNumber})`
            : ''
        }. Official sending & status ticks are live!`,
      });
    } catch (err) {
      setWaFeedback({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setWaActivatingManaged(false);
    }
  };

  const handleTestMetaConnection = async () => {
    setWaTesting(true);
    setWaFeedback(null);
    try {
      const res: WhatsAppCloudTestResponse = await testWhatsAppCloudConfigApi();
      if (res.config) setWaConfig(res.config);
      if (res.ok) {
        setWaFeedback({
          type: 'success',
          message: `WhatsApp Cloud is healthy${
            res.businessDisplayName ? ` · ${res.businessDisplayName}` : ''
          }${res.verifiedPhoneNumber ? ` (${res.verifiedPhoneNumber})` : ''}${
            res.qualityRating ? ` · Quality: ${res.qualityRating}` : ''
          }`,
        });
      } else {
        setWaFeedback({
          type: 'error',
          message: res.error || 'Meta connection verification failed.',
        });
      }
    } catch (err) {
      setWaFeedback({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setWaTesting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setWaDisconnecting(true);
    setWaFeedback(null);
    try {
      const updated = await disconnectWhatsAppApi();
      setWaConfig(updated);
      setWaFeedback({
        type: 'success',
        message:
          'WhatsApp Business disconnected. Messaging now uses CRM Inbox + wa.me fallback.',
      });
    } catch (err) {
      setWaFeedback({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setWaDisconnecting(false);
    }
  };

  const handleRotateKey = async () => {
    setIsRotating(true);
    setError(null);
    try {
      await rotateWebhookKeyApi();
      await loadConfig();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Only Owner/Admin can rotate webhook key.',
      );
    } finally {
      setIsRotating(false);
    }
  };

  const handleFireTestWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.webhookKey) return;
    setIsSending(true);
    setError(null);
    setCaptureResult(null);

    const payload =
      payloadPreset === 'indiamart'
        ? {
            QUERY_ID: `IM-${Date.now()}`,
            SENDER_NAME: testName,
            SENDER_MOBILE: testPhone,
            SENDER_COMPANY: testCompany,
            SENDER_CITY: testCity,
            QUERY_MESSAGE: testNotes,
            estimatedValue: Number(testValue) || 0,
          }
        : {
            source: 'website',
            name: testName,
            phone: testPhone,
            company: testCompany,
            city: testCity,
            notes: testNotes,
            estimatedValue: Number(testValue) || 0,
          };

    try {
      const res = await sendTestWebhookApi(config.webhookKey, payload);
      setCaptureResult(res);
      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test webhook failed.');
    } finally {
      setIsSending(false);
    }
  };

  const sampleJsonPreview =
    payloadPreset === 'indiamart'
      ? JSON.stringify(
          {
            SENDER_NAME: testName,
            SENDER_MOBILE: testPhone,
            SENDER_COMPANY: testCompany,
            SENDER_CITY: testCity,
            QUERY_MESSAGE: testNotes,
          },
          null,
          2,
        )
      : JSON.stringify(
          {
            source: 'website',
            name: testName,
            phone: testPhone,
            company: testCompany,
            city: testCity,
            estimatedValue: Number(testValue) || 0,
            notes: testNotes,
          },
          null,
          2,
        );

  const isOwnConnected =
    waConfig?.enabled &&
    waConfig?.configured &&
    (waConfig.connectionMode === 'own_embedded' ||
      waConfig.connectionMode === 'manual');
  const isManagedConnected =
    waConfig?.enabled &&
    waConfig?.configured &&
    waConfig.connectionMode === 'leadsetu_managed';
  const isWhatsAppLive = Boolean(waConfig?.enabled && waConfig?.configured);

  const connectors = [
    {
      name: 'WhatsApp Business (Built-In by Leadsetu)',
      desc: 'Guided 1-click signup for your business number or instant Leadsetu Managed Gateway — zero Meta developer setup.',
      status: isOwnConnected
        ? 'Connected · Own Number'
        : isManagedConnected
          ? 'Connected · Leadsetu Gateway'
          : 'CRM + wa.me Fallback',
      meta:
        waConfig?.verifiedPhoneNumber ||
        waConfig?.businessDisplayName ||
        (waConfig?.embeddedSignupAvailable
          ? 'Ready for 1-click connect'
          : 'Managed by Leadsetu'),
    },
    {
      name: 'IndiaMART Trade Leads Webhook',
      desc: 'Capture instant B2B buyer inquiries into Leads Command Center with zero lag.',
      status: 'Live Webhook Ready',
      meta: 'Auto-maps SENDER_NAME / SENDER_MOBILE',
    },
    {
      name: 'Meta Lead Ads (FB & Instagram)',
      desc: 'Instant webhook capture for ad form submissions with +91 deduplication.',
      status: 'Webhook Ready',
      meta: 'Graph Webhook v21.0',
    },
    {
      name: 'Justdial & Website Forms',
      desc: 'Push inquiry forms directly to Leadsetu with automatic round-robin rep assignment.',
      status: 'Live Webhook Ready',
      meta: 'JSON POST Endpoint',
    },
    {
      name: 'Razorpay Payment Links',
      desc: 'Attach instant UPI / NEFT payment links inside GST Invoices & WhatsApp.',
      status: 'Connected',
      meta: 'Auto-reconcile receipts',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-blue text-xs font-semibold border border-brand-blue/20 mb-2">
          <Webhook className="w-3.5 h-3.5" />
          <span>Built-In WhatsApp Business · IndiaMART · Website Webhook Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-brand-navy">
          Channels, Webhooks &amp; Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your WhatsApp Business number in 1 click (provided by Leadsetu) and capture inbound buyer inquiries live with +91 deduplication.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Built-In Leadsetu WhatsApp Business Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-brand-navy">
                  Connect Your Company WhatsApp (Built-In by Leadsetu)
                </h2>
                {waLoading ? (
                  <span className="text-[11px] text-slate-400">Checking status...</span>
                ) : isOwnConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                    {waConfig?.verifiedPhoneNumber
                      ? ` · ${waConfig.verifiedPhoneNumber}`
                      : ''}
                  </span>
                ) : isManagedConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    <Wifi className="w-3 h-3" /> Leadsetu Shared Number
                    {waConfig?.verifiedPhoneNumber
                      ? ` · ${waConfig.verifiedPhoneNumber}`
                      : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Sparkles className="w-3 h-3" /> Enter Company Number Below
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter only your company&apos;s display name and WhatsApp mobile number below. Leadsetu handles all WhatsApp Cloud routing, templates, attachments, and delivery ticks automatically — no API tokens or developer setup needed.
              </p>
            </div>
          </div>
        </div>

        {/* Active connection summary banner */}
        {isWhatsAppLive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Company Display Name
              </span>
              <p className="text-sm font-extrabold text-brand-navy mt-0.5">
                {waConfig?.businessDisplayName ||
                  (isManagedConnected ? 'Leadsetu Official Gateway' : 'WhatsApp Business')}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Connected WhatsApp Number
              </span>
              <p className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                {waConfig?.verifiedPhoneNumber || 'Verified via Leadsetu'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Connection Status
              </span>
              <p className="text-xs font-bold text-emerald-700 mt-1">
                {isOwnConnected
                  ? 'Active · Company WhatsApp Number (Managed by Leadsetu)'
                  : 'Active · Leadsetu Shared Gateway (Two-Way + Ticks)'}
              </p>
            </div>
          </div>
        )}

        {waFeedback && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold ${
              waFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {waFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{waFeedback.message}</span>
          </div>
        )}

        {isAdmin ? (
          <form onSubmit={handleConnectCompanyNumber} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-navy inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Company Display Name</span>
                </label>
                <input
                  type="text"
                  value={waCompanyName}
                  onChange={(e) => setWaCompanyName(e.target.value)}
                  placeholder="e.g. Webito Infotech Pvt Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <p className="text-[11px] text-slate-400">
                  Your business name shown to buyers in WhatsApp conversations and templates.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-navy inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Company WhatsApp Number (+91)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={waCompanyPhone}
                  onChange={(e) => setWaCompanyPhone(e.target.value)}
                  placeholder="e.g. +91 98204 77112"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <p className="text-[11px] text-slate-400">
                  Enter your 10-digit Indian mobile or landline WhatsApp Business number.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500">
                No API tokens, Phone Number IDs, or webhook URLs required — Leadsetu configures everything automatically.
              </span>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="submit"
                  disabled={
                    waSavingNumber ||
                    waConnecting ||
                    waActivatingManaged ||
                    waTesting ||
                    waDisconnecting
                  }
                  className="btn-primary-brand inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {waSavingNumber ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isOwnConnected
                      ? 'Update Company WhatsApp'
                      : 'Connect Company WhatsApp'}
                  </span>
                </button>

                {waConfig?.embeddedSignupAvailable && (
                  <button
                    type="button"
                    disabled={
                      waConnecting ||
                      waSavingNumber ||
                      waActivatingManaged ||
                      waTesting ||
                      waDisconnecting
                    }
                    onClick={handleOneClickEmbeddedSignup}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition text-xs font-bold disabled:opacity-50"
                  >
                    {waConnecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Verify with Meta Popup (1-Click)</span>
                  </button>
                )}

                {waConfig?.managedAvailable && !isManagedConnected && (
                  <button
                    type="button"
                    disabled={
                      waActivatingManaged ||
                      waSavingNumber ||
                      waConnecting ||
                      waTesting ||
                      waDisconnecting
                    }
                    onClick={handleActivateManagedGateway}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold disabled:opacity-50"
                  >
                    {waActivatingManaged ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Use Leadsetu Shared Number
                      {waConfig.managedDisplayNumber
                        ? ` (${waConfig.managedDisplayNumber})`
                        : ''}
                    </span>
                  </button>
                )}

                {isWhatsAppLive && (
                  <>
                    <button
                      type="button"
                      disabled={
                        waTesting ||
                        waSavingNumber ||
                        waConnecting ||
                        waDisconnecting
                      }
                      onClick={handleTestMetaConnection}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold disabled:opacity-50"
                    >
                      {waTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PlugZap className="w-3.5 h-3.5" />
                      )}
                      <span>Test Health</span>
                    </button>

                    <button
                      type="button"
                      disabled={
                        waDisconnecting ||
                        waSavingNumber ||
                        waConnecting ||
                        waTesting
                      }
                      onClick={handleDisconnectWhatsApp}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold disabled:opacity-50"
                    >
                      {waDisconnecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unplug className="w-3.5 h-3.5" />
                      )}
                      <span>Disconnect</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 border border-slate-200">
            Only Workspace Owners or Admins can connect or disconnect WhatsApp Business.
          </div>
        )}
      </div>

      {/* Live Inbound Webhook Console */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-brand-navy">
              Live Inbound Webhook Capture URL (No Auth Header Required)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste this URL into IndiaMART CRM Push API, Zapier, Make, or your website contact form.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRotateKey}
            disabled={isRotating || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {isRotating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Rotate Secret Key</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-brand-navy break-all">
            {isLoading ? 'Loading workspace webhook endpoint...' : `POST ${fullWebhookUrl}`}
          </div>
          <button
            type="button"
            onClick={() => config && handleCopyText(fullWebhookUrl, setCopiedUrl)}
            disabled={!config}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-light text-brand-blue border border-brand-blue/25 text-xs font-bold hover:bg-brand-blue hover:text-white transition"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Copied' : 'Copy Webhook URL'}</span>
          </button>
        </div>

        {/* Live Test Fire Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-slate-100">
          <form onSubmit={handleFireTestWebhook} className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
                Fire Live Test Webhook Inquiry
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setPayloadPreset('indiamart')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    payloadPreset === 'indiamart'
                      ? 'bg-white text-brand-blue shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  IndiaMART Payload
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadPreset('website')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    payloadPreset === 'website'
                      ? 'bg-white text-brand-blue shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Website / Custom JSON
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Buyer Full Name"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Mobile (+91...)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
              <input
                type="text"
                value={testCompany}
                onChange={(e) => setTestCompany(e.target.value)}
                placeholder="Company Name"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={testCity}
                  onChange={(e) => setTestCity(e.target.value)}
                  placeholder="City"
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
                <input
                  type="number"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder="Est. Value ₹"
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <input
              type="text"
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              placeholder="Inquiry requirement / query message"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <Users className="w-3.5 h-3.5 text-brand-blue" />
                  Round-Robin Pointer: Slot #{(config?.roundRobinIndex ?? 0) + 1}
                </span>
                <Link
                  href="/settings/routing"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-blue hover:underline"
                >
                  <span>Configure Territory &amp; Load Routing</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <button
                type="submit"
                disabled={isSending || !config}
                className="btn-primary-brand inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Fire Live Test Inquiry</span>
              </button>
            </div>

            {captureResult && (
              <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span>
                  {captureResult.status === 'deduplicated'
                    ? `Matched duplicate phone — appended note to "${captureResult.lead.name}"!`
                    : `Captured new lead "${captureResult.lead.name}" (AI Score ${captureResult.lead.aiScore}/100) -> Assigned to ${captureResult.assignedRepName}`}
                </span>
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1 underline shrink-0"
                >
                  <span>View in Leads</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </form>

          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              <Code2 className="w-3.5 h-3.5 text-brand-blue" />
              <span>Payload Structure ({payloadPreset})</span>
            </div>
            <pre className="flex-1 p-3.5 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto leading-relaxed">
              {sampleJsonPreview}
            </pre>
          </div>
        </div>

        {/* Recent Captured Leads */}
        {config && config.recentWebhookLeads.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Recent Webhook / Portal Captures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {config.recentWebhookLeads.slice(0, 4).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-brand-blue/40 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-light text-brand-blue">
                      {lead.source}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-600">
                      {lead.aiScore}/100
                    </span>
                  </div>
                  <p className="text-xs font-bold text-brand-navy mt-1.5 truncate">
                    {lead.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {lead.company || lead.city}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meta Click-to-WhatsApp Attribution + Conversions API (CAPI) */}
      <MetaCapiPanel />

      {/* Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((c) => (
          <div
            key={c.name}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-brand-navy">{c.name}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> {c.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{c.desc}</p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-3">
              {c.meta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

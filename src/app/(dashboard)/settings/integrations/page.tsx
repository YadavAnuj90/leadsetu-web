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
} from 'lucide-react';
import type { WebhookCaptureResponse, WebhookConfigResponse } from '@/types/contracts';
import {
  fetchWebhookConfigApi,
  rotateWebhookKeyApi,
  sendTestWebhookApi,
} from '@/lib/leads-capture-api';

const connectors = [
  {
    name: 'WhatsApp Cloud API (Official)',
    desc: 'Sync real-time customer chats, auto-qualify in Hinglish, and reply from Inbox.',
    status: 'Connected',
    meta: 'Business Verified · Delhi-NCR',
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
    meta: 'Graph Webhook v19.0',
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

export default function IntegrationsSettingsPage() {
  const [config, setConfig] = useState<WebhookConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<WebhookCaptureResponse | null>(
    null,
  );

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

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleCopyUrl = async () => {
    if (!config) return;
    try {
      await navigator.clipboard.writeText(fullWebhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      setError('Clipboard copy failed.');
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

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-blue text-xs font-semibold border border-brand-blue/20 mb-2">
          <Webhook className="w-3.5 h-3.5" />
          <span>IndiaMART · Justdial · Meta Ads · Website Webhook Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-brand-navy">
          Channels, Webhooks &amp; Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Capture inbound inquiries live in MongoDB with automatic +91 deduplication, AI Lead Scoring, and Round-Robin sales assignment.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
            onClick={handleCopyUrl}
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
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <Users className="w-3.5 h-3.5 text-brand-blue" />
                Round-Robin Pointer: Slot #{(config?.roundRobinIndex ?? 0) + 1}
              </span>
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

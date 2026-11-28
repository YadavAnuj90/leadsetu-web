'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FlaskConical,
  Globe,
  Loader2,
  RefreshCw,
  Save,
  Share2,
  Store,
  Zap,
} from 'lucide-react';
import {
  fetchLeadConnectorsApi,
  simulateConnectorWebhookApi,
  updateBookingStatusApi,
  updateLeadConnectorsApi,
  type LeadConnectorsOverviewResponse,
} from '@/lib/marketplace-sync-api';
import { getErrorMessage } from '@/lib/api-client';

function resolveBackendBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
  return configured.replace(/\/v1\/?$/, '');
}

const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export default function OmnichannelConnectorsPanel() {
  const [data, setData] = useState<LeadConnectorsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'meta' | 'justdial' | 'tradeindia' | 'booking'
  >('meta');

  // Meta Lead Ads state
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaVerifyToken, setMetaVerifyToken] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [metaPageToken, setMetaPageToken] = useState('');
  const [metaPageId, setMetaPageId] = useState('');
  const [metaPageName, setMetaPageName] = useState('');
  const [metaFormId, setMetaFormId] = useState('');
  const [metaAutoWa, setMetaAutoWa] = useState(true);

  // Justdial state
  const [jdEnabled, setJdEnabled] = useState(true);
  const [jdSecret, setJdSecret] = useState('');
  const [jdCategory, setJdCategory] = useState('');
  const [jdAutoWa, setJdAutoWa] = useState(true);
  const [jdPincodeRules, setJdPincodeRules] = useState('');
  const [jdAutoTicketService, setJdAutoTicketService] = useState(true);
  const [jdServiceKeywords, setJdServiceKeywords] = useState(
    'repair, service, amc, installation, complaint, warranty',
  );
  const [jdReviewBooster, setJdReviewBooster] = useState(true);
  const [jdReviewLink, setJdReviewLink] = useState('');

  // TradeIndia state
  const [tiEnabled, setTiEnabled] = useState(true);
  const [tiSecret, setTiSecret] = useState('');
  const [tiUserId, setTiUserId] = useState('');
  const [tiProfileId, setTiProfileId] = useState('');
  const [tiApiKey, setTiApiKey] = useState('');
  const [tiAutoWa, setTiAutoWa] = useState(true);

  // Booking Scheduler state
  const [bkEnabled, setBkEnabled] = useState(true);
  const [bkSlug, setBkSlug] = useState('');
  const [bkTitle, setBkTitle] = useState('');
  const [bkSubtitle, setBkSubtitle] = useState('');
  const [bkDuration, setBkDuration] = useState(30);
  const [bkStartHour, setBkStartHour] = useState('10:00');
  const [bkEndHour, setBkEndHour] = useState('19:00');
  const [bkWorkingDays, setBkWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [bkMeetingType, setBkMeetingType] = useState<
    'video_call' | 'phone_call' | 'in_person'
  >('video_call');
  const [bkConfWa, setBkConfWa] = useState(true);
  const [bkReminderWa, setBkReminderWa] = useState(true);

  const hydrate = useCallback((res: LeadConnectorsOverviewResponse) => {
    setData(res);
    setMetaEnabled(res.metaLeadAds.enabled);
    setMetaVerifyToken(res.metaLeadAds.verifyToken);
    setMetaAppSecret('');
    setMetaPageToken('');
    setMetaPageId(res.metaLeadAds.pageId);
    setMetaPageName(res.metaLeadAds.pageName);
    setMetaFormId(res.metaLeadAds.formId);
    setMetaAutoWa(res.metaLeadAds.autoWhatsAppWelcome);

    setJdEnabled(res.justdialWebhook.enabled);
    setJdSecret(res.justdialWebhook.secretToken);
    setJdCategory(res.justdialWebhook.categoryFilter);
    setJdAutoWa(res.justdialWebhook.autoWhatsAppWelcome);
    setJdPincodeRules(res.justdialWebhook.pincodeZoneRules || '');
    setJdAutoTicketService(
      res.justdialWebhook.autoCreateTicketForService !== false,
    );
    setJdServiceKeywords(
      res.justdialWebhook.serviceCategoryKeywords ||
        'repair, service, amc, installation, complaint, warranty',
    );
    setJdReviewBooster(res.justdialWebhook.reviewBoosterEnabled !== false);
    setJdReviewLink(res.justdialWebhook.reviewLink || '');

    setTiEnabled(res.tradeindiaWebhook.enabled);
    setTiSecret(res.tradeindiaWebhook.secretToken);
    setTiUserId(res.tradeindiaWebhook.apiUserId);
    setTiProfileId(res.tradeindiaWebhook.profileId);
    setTiApiKey('');
    setTiAutoWa(res.tradeindiaWebhook.autoWhatsAppWelcome);

    setBkEnabled(res.bookingScheduler.enabled);
    setBkSlug(res.bookingScheduler.slug);
    setBkTitle(res.bookingScheduler.title);
    setBkSubtitle(res.bookingScheduler.subtitle);
    setBkDuration(res.bookingScheduler.durationMinutes || 30);
    setBkStartHour(res.bookingScheduler.startHour || '10:00');
    setBkEndHour(res.bookingScheduler.endHour || '19:00');
    setBkWorkingDays(res.bookingScheduler.workingDays || [1, 2, 3, 4, 5, 6]);
    setBkMeetingType(res.bookingScheduler.meetingType || 'video_call');
    setBkConfWa(res.bookingScheduler.confirmationWhatsappEnabled !== false);
    setBkReminderWa(res.bookingScheduler.reminder1HrEnabled !== false);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeadConnectorsApi();
      hydrate(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const copyText = (id: string, val: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedKey(id);
    setTimeout(() => setCopiedKey((c) => (c === id ? null : c)), 1800);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await updateLeadConnectorsApi({
        metaLeadAds: {
          enabled: metaEnabled,
          verifyToken: metaVerifyToken.trim() || undefined,
          appSecret: metaAppSecret.trim() || undefined,
          pageAccessToken: metaPageToken.trim() || undefined,
          pageId: metaPageId.trim(),
          pageName: metaPageName.trim(),
          formId: metaFormId.trim(),
          autoWhatsAppWelcome: metaAutoWa,
        },
        justdialWebhook: {
          enabled: jdEnabled,
          secretToken: jdSecret.trim(),
          categoryFilter: jdCategory.trim(),
          autoWhatsAppWelcome: jdAutoWa,
          pincodeZoneRules: jdPincodeRules.trim(),
          autoCreateTicketForService: jdAutoTicketService,
          serviceCategoryKeywords: jdServiceKeywords.trim(),
          reviewBoosterEnabled: jdReviewBooster,
          reviewLink: jdReviewLink.trim(),
        },
        tradeindiaWebhook: {
          enabled: tiEnabled,
          secretToken: tiSecret.trim(),
          apiUserId: tiUserId.trim(),
          profileId: tiProfileId.trim(),
          apiKey: tiApiKey.trim() || undefined,
          autoWhatsAppWelcome: tiAutoWa,
        },
        bookingScheduler: {
          enabled: bkEnabled,
          slug: bkSlug.trim() || undefined,
          title: bkTitle.trim() || undefined,
          subtitle: bkSubtitle.trim(),
          durationMinutes: Number(bkDuration) || 30,
          startHour: bkStartHour,
          endHour: bkEndHour,
          workingDays: bkWorkingDays,
          meetingType: bkMeetingType,
          confirmationWhatsappEnabled: bkConfWa,
          reminder1HrEnabled: bkReminderWa,
        },
      });
      hydrate(res);
      setNotice(
        'Saved Meta Lead Ads, Justdial, TradeIndia & Embeddable Booking Scheduler configuration.',
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async (
    channel: 'meta_lead_ads' | 'justdial_feed' | 'tradeindia_feed',
  ) => {
    setSimulating(channel);
    setError(null);
    setNotice(null);
    try {
      const res = await simulateConnectorWebhookApi({ channel });
      setNotice(
        `${res.summaryText} · Routed & logged in Marketplace Sync + Leads.`,
      );
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSimulating(null);
    }
  };

  const handleBookingStatus = async (
    bookingId: string,
    status: 'completed' | 'no_show' | 'cancelled',
  ) => {
    setUpdatingBookingId(bookingId);
    setError(null);
    try {
      const res = await updateBookingStatusApi(bookingId, status, status === 'no_show');
      setNotice(
        `Appointment ${res.bookingRef} marked ${res.status.toUpperCase()}${res.nudgeSent ? ' · WhatsApp reschedule nudge sent!' : ''}`,
      );
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingBookingId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-[#0D1628] rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-xs text-slate-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading Meta Lead Ads, Justdial, TradeIndia &amp; Booking Scheduler connectors...
      </div>
    );
  }

  const backendOrigin = resolveBackendBaseUrl();
  const webOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://app.leadsetu.in';

  const metaUrl = `${backendOrigin}${data.endpoints.metaLeadAdsWebhookPath}`;
  const jdUrl = `${backendOrigin}${data.endpoints.justdialWebhookPath}`;
  const tiUrl = `${backendOrigin}${data.endpoints.tradeindiaWebhookPath}`;
  const bookingUrl = `${webOrigin}${data.endpoints.bookingPublicPath}`;
  const iframeSnippet = `<iframe src="${bookingUrl}?embed=1" style="width:100%;min-height:640px;border:0;border-radius:16px;" loading="lazy"></iframe>`;

  return (
    <div className="bg-white dark:bg-[#0D1628] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-5 text-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
              Zero-Leakage Acquisition: Meta Lead Ads, Justdial, TradeIndia &amp; Booking Scheduler
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every inquiry &amp; booked slot is deduplicated, auto-routed round-robin/by city, and greeted on WhatsApp within &lt;10 seconds.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 font-bold text-slate-600 dark:text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
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

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'meta' as const, label: 'Meta Lead Ads Webhook', icon: Globe },
          { id: 'justdial' as const, label: 'Justdial Webhook', icon: Store },
          { id: 'tradeindia' as const, label: 'TradeIndia Webhook', icon: Zap },
          {
            id: 'booking' as const,
            label: `Embeddable Booking Scheduler (${data.recentBookings.length})`,
            icon: Calendar,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold border transition ${
                active
                  ? 'bg-brand-navy text-white border-brand-navy'
                  : 'bg-slate-50 dark:bg-[#111D33] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        {/* META LEAD ADS */}
        {activeSubTab === 'meta' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-extrabold text-brand-navy dark:text-white text-sm">
                  Meta Lead Ads (Facebook &amp; Instagram Instant Forms)
                </div>
                <p className="text-[11px] text-slate-500">
                  Supports official Meta Graph Webhook (`hub.challenge` + `X-Hub-Signature-256` + `leadgen_id` auto-fetch) and direct JSON webhooks.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metaEnabled}
                    onChange={(e) => setMetaEnabled(e.target.checked)}
                  />
                  <span>Enabled</span>
                </label>
                <button
                  type="button"
                  disabled={simulating === 'meta_lead_ads'}
                  onClick={() => void handleSimulate('meta_lead_ads')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold"
                >
                  {simulating === 'meta_lead_ads' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="w-3.5 h-3.5" />
                  )}
                  <span>Test Meta Lead Webhook</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Callback URL (Paste in Meta App → Webhooks → Page `leadgen`)
                </div>
                <div className="font-mono text-[11px] truncate text-brand-navy dark:text-slate-200">
                  {metaUrl}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyText('metaUrl', metaUrl)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
              >
                {copiedKey === 'metaUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">Verify Token</label>
                <input
                  type="text"
                  value={metaVerifyToken}
                  onChange={(e) => setMetaVerifyToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Meta App Secret (Optional HMAC)</label>
                <input
                  type="password"
                  value={metaAppSecret}
                  onChange={(e) => setMetaAppSecret(e.target.value)}
                  placeholder={
                    data.metaLeadAds.hasAppSecret
                      ? `Stored: ${data.metaLeadAds.appSecretMask}`
                      : 'App Secret for X-Hub-Signature-256'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Page Access Token (For Graph API fetch)</label>
                <input
                  type="password"
                  value={metaPageToken}
                  onChange={(e) => setMetaPageToken(e.target.value)}
                  placeholder={
                    data.metaLeadAds.hasPageAccessToken
                      ? `Stored: ${data.metaLeadAds.pageAccessTokenMask}`
                      : 'EAAG... (to fetch form answers)'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Facebook Page Name</label>
                <input
                  type="text"
                  value={metaPageName}
                  onChange={(e) => setMetaPageName(e.target.value)}
                  placeholder="Leadsetu Electricals Official"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Page ID</label>
                <input
                  type="text"
                  value={metaPageId}
                  onChange={(e) => setMetaPageId(e.target.value)}
                  placeholder="102938475610293"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Lead Form ID (Optional Filter)</label>
                <input
                  type="text"
                  value={metaFormId}
                  onChange={(e) => setMetaFormId(e.target.value)}
                  placeholder="998877665544332"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={metaAutoWa}
                onChange={(e) => setMetaAutoWa(e.target.checked)}
              />
              <span>Auto-send &lt;10s WhatsApp welcome message when Meta lead arrives</span>
            </label>
          </div>
        )}

        {/* JUSTDIAL */}
        {activeSubTab === 'justdial' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-extrabold text-brand-navy dark:text-white text-sm">
                  Justdial Real-Time Lead Push (`GET` &amp; `POST`)
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts both Justdial&apos;s HTTP GET query parameters (`leadid`, `name`, `mobile`, `city`, `category`) and JSON POST payloads.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jdEnabled}
                    onChange={(e) => setJdEnabled(e.target.checked)}
                  />
                  <span>Enabled</span>
                </label>
                <button
                  type="button"
                  disabled={simulating === 'justdial_feed'}
                  onClick={() => void handleSimulate('justdial_feed')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold"
                >
                  {simulating === 'justdial_feed' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="w-3.5 h-3.5" />
                  )}
                  <span>Simulate Justdial Inquiry</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Justdial Push URL (Share with Justdial Account Manager)
                </div>
                <div className="font-mono text-[11px] truncate text-brand-navy dark:text-slate-200">
                  {jdUrl}
                  {jdSecret ? `?token=${jdSecret}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText('jdUrl', `${jdUrl}${jdSecret ? `?token=${jdSecret}` : ''}`)
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
              >
                {copiedKey === 'jdUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Optional Query Token Guard (`?token=`)</label>
                <input
                  type="text"
                  value={jdSecret}
                  onChange={(e) => setJdSecret(e.target.value)}
                  placeholder="Optional shared secret token"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Default Category Label</label>
                <input
                  type="text"
                  value={jdCategory}
                  onChange={(e) => setJdCategory(e.target.value)}
                  placeholder="Industrial Equipment Dealers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">
                  Pincode Territory Zone Rules (e.g. `110*:Delhi Hub, 201*:Noida Team`)
                </label>
                <input
                  type="text"
                  value={jdPincodeRules}
                  onChange={(e) => setJdPincodeRules(e.target.value)}
                  placeholder="110*:Delhi Hub, 201*:Noida Team, 122*:Gurugram Desk"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  Service-to-Ticket Keywords (Auto-Opens SLA Ticket)
                </label>
                <input
                  type="text"
                  value={jdServiceKeywords}
                  onChange={(e) => setJdServiceKeywords(e.target.value)}
                  placeholder="repair, service, amc, installation, complaint, warranty"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1">
                  Justdial Listing Review URL (For Post-Conversion Rating Booster)
                </label>
                <input
                  type="url"
                  value={jdReviewLink}
                  onChange={(e) => setJdReviewLink(e.target.value)}
                  placeholder="https://www.justdial.com/Delhi/Your-Business-Listing/reviews"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={jdAutoWa}
                  onChange={(e) => setJdAutoWa(e.target.checked)}
                />
                <span>Auto-send &lt;10s WhatsApp welcome message on Justdial inquiry</span>
              </label>
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={jdAutoTicketService}
                  onChange={(e) => setJdAutoTicketService(e.target.checked)}
                />
                <span>Auto-open SLA Ticket for repair/AMC categories</span>
              </label>
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={jdReviewBooster}
                  onChange={(e) => setJdReviewBooster(e.target.checked)}
                />
                <span>Enable Justdial Review Booster</span>
              </label>
            </div>
          </div>
        )}

        {/* TRADEINDIA */}
        {activeSubTab === 'tradeindia' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-extrabold text-brand-navy dark:text-white text-sm">
                  TradeIndia RFI Webhook (`GET` &amp; `POST`)
                </div>
                <p className="text-[11px] text-slate-500">
                  Maps TradeIndia RFI fields (`rfi_id`, `sender_name`, `sender_mobile`, `sender_co`, `sender_city`, `product_name`) into Leads (`source: tradeindia`).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiEnabled}
                    onChange={(e) => setTiEnabled(e.target.checked)}
                  />
                  <span>Enabled</span>
                </label>
                <button
                  type="button"
                  disabled={simulating === 'tradeindia_feed'}
                  onClick={() => void handleSimulate('tradeindia_feed')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold"
                >
                  {simulating === 'tradeindia_feed' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="w-3.5 h-3.5" />
                  )}
                  <span>Simulate TradeIndia RFI</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  TradeIndia Push Endpoint
                </div>
                <div className="font-mono text-[11px] truncate text-brand-navy dark:text-slate-200">
                  {tiUrl}
                  {tiSecret ? `?token=${tiSecret}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText('tiUrl', `${tiUrl}${tiSecret ? `?token=${tiSecret}` : ''}`)
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
              >
                {copiedKey === 'tiUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1">TradeIndia User ID</label>
                <input
                  type="text"
                  value={tiUserId}
                  onChange={(e) => setTiUserId(e.target.value)}
                  placeholder="e.g. 928374"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Profile ID</label>
                <input
                  type="text"
                  value={tiProfileId}
                  onChange={(e) => setTiProfileId(e.target.value)}
                  placeholder="e.g. 104422"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">TradeIndia API Key (Encrypted)</label>
                <input
                  type="password"
                  value={tiApiKey}
                  onChange={(e) => setTiApiKey(e.target.value)}
                  placeholder={
                    data.tradeindiaWebhook.hasApiKey
                      ? `Stored: ${data.tradeindiaWebhook.apiKeyMask}`
                      : 'Optional TradeIndia Key'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Optional Token Guard</label>
                <input
                  type="text"
                  value={tiSecret}
                  onChange={(e) => setTiSecret(e.target.value)}
                  placeholder="Shared secret token"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={tiAutoWa}
                onChange={(e) => setTiAutoWa(e.target.checked)}
              />
              <span>Auto-send &lt;10s WhatsApp welcome message on TradeIndia inquiry</span>
            </label>
          </div>
        )}

        {/* EMBEDDABLE BOOKING SCHEDULER */}
        {activeSubTab === 'booking' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-extrabold text-brand-navy dark:text-white text-sm">
                  Embeddable Appointment &amp; Demo Scheduler (Auto-Creates Lead + Task + 1h WhatsApp Reminder)
                </div>
                <p className="text-[11px] text-slate-500">
                  Share a direct link on WhatsApp/bio or embed in your WordPress/Shopify/website via iframe. Prevents double-booking and sends 1-hour WhatsApp reminders.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bkEnabled}
                    onChange={(e) => setBkEnabled(e.target.checked)}
                  />
                  <span>Active</span>
                </label>
                <a
                  href={`/book/${data.bookingScheduler.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-blue text-white font-extrabold"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Live Booking Page
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Direct Share Link (WhatsApp / Bio / Signature)
                  </div>
                  <div className="font-mono text-[11px] truncate text-brand-navy dark:text-slate-200">
                    {bookingUrl}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('bkUrl', bookingUrl)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
                >
                  {copiedKey === 'bkUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Link</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Code2 className="w-3 h-3" /> Website Embed Iframe (`?embed=1`)
                  </div>
                  <div className="font-mono text-[11px] truncate text-brand-navy dark:text-slate-200">
                    {iframeSnippet}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('iframe', iframeSnippet)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
                >
                  {copiedKey === 'iframe' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy HTML</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">Booking URL Slug</label>
                <input
                  type="text"
                  value={bkSlug}
                  onChange={(e) => setBkSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1">Public Calendar Title</label>
                <input
                  type="text"
                  value={bkTitle}
                  onChange={(e) => setBkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block font-bold mb-1">Subtitle / Buyer Instructions</label>
                <input
                  type="text"
                  value={bkSubtitle}
                  onChange={(e) => setBkSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Slot Duration</label>
                <select
                  value={bkDuration}
                  onChange={(e) => setBkDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Meeting Format</label>
                <select
                  value={bkMeetingType}
                  onChange={(e) =>
                    setBkMeetingType(
                      e.target.value as 'video_call' | 'phone_call' | 'in_person',
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                >
                  <option value="video_call">Video Product Demo</option>
                  <option value="phone_call">Phone Consultation</option>
                  <option value="in_person">Factory / Office Visit</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Opens (IST)</label>
                  <input
                    type="time"
                    value={bkStartHour}
                    onChange={(e) => setBkStartHour(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Closes (IST)</label>
                  <input
                    type="time"
                    value={bkEndHour}
                    onChange={(e) => setBkEndHour(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="font-bold">Working Days:</span>
              {WEEKDAYS.map((d) => {
                const selected = bkWorkingDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setBkWorkingDays((prev) =>
                        selected ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg font-bold border ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-[#0D1628] border-slate-200 dark:border-white/15 text-slate-500'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={bkConfWa}
                  onChange={(e) => setBkConfWa(e.target.checked)}
                />
                <span>Send instant WhatsApp confirmation</span>
              </label>
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={bkReminderWa}
                  onChange={(e) => setBkReminderWa(e.target.checked)}
                />
                <span>Send automatic 1-hour WhatsApp reminder</span>
              </label>
            </div>

            {/* Booked Slots Queue */}
            {data.recentBookings.length > 0 && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="font-extrabold text-brand-navy dark:text-white">
                  Recent Booked Demos &amp; No-Show Recovery
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.recentBookings.slice(0, 8).map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-brand-navy dark:text-white">
                          {b.guestName} ({b.guestPhone}) ·{' '}
                          <span className="font-mono text-brand-blue">{b.bookingRef}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.dateYmd} at {b.slotLabel} IST · Assigned: {b.assignedRepName} ·{' '}
                          <span className="uppercase font-bold">{b.status}</span>
                        </div>
                      </div>
                      {b.status === 'confirmed' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingBookingId === b.id}
                            onClick={() => void handleBookingStatus(b.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                          >
                            Completed
                          </button>
                          <button
                            type="button"
                            disabled={updatingBookingId === b.id}
                            onClick={() => void handleBookingStatus(b.id, 'no_show')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                          >
                            No-Show → WA Nudge
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Connector Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

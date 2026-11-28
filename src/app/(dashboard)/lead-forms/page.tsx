'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  IndianRupee,
  LayoutTemplate,
  Link2,
  MoreVertical,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Printer,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import QrPreview from '@/components/lead-forms/QrPreview';
import {
  formatInr,
  MOCK_LEAD_FORMS,
  type LeadFormConfig,
  type LeadFormStatus,
} from '@/lib/lead-forms-mock';

const STATUS_STYLE: Record<
  LeadFormStatus,
  { label: string; badgeClass: string }
> = {
  live: {
    label: 'Live',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  },
  draft: {
    label: 'Draft',
    badgeClass:
      'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10',
  },
  paused: {
    label: 'Paused',
    badgeClass:
      'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  },
};

export default function InstantFormsHubPage() {
  const [forms, setForms] = useState<LeadFormConfig[]>(MOCK_LEAD_FORMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadFormStatus>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState<LeadFormConfig | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Share modal state
  const [shareTab, setShareTab] = useState<'link' | 'widget' | 'qr'>('link');
  const [utmSource, setUtmSource] = useState('google_ads');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('gst_quote_2026');
  const [widgetPosition, setWidgetPosition] = useState<
    'bottom-right' | 'bottom-left' | 'exit-popup'
  >('bottom-right');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrToast, setQrToast] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://leadsetu.app';

  const kpis = useMemo(() => {
    const views = forms.reduce((sum, f) => sum + f.stats.views, 0);
    const submissions = forms.reduce((sum, f) => sum + f.stats.submissions, 0);
    const otpVerified = forms.reduce((sum, f) => sum + f.stats.otpVerified, 0);
    const otpSubmissions = forms
      .filter((f) => f.requireWhatsappOtp)
      .reduce((sum, f) => sum + f.stats.submissions, 0);
    const revenue = forms.reduce((sum, f) => sum + f.stats.wonRevenueInr, 0);

    const convPct = views > 0 ? ((submissions / views) * 100).toFixed(1) : '0.0';
    const otpPct =
      otpSubmissions > 0
        ? Math.min(100, Math.round((otpVerified / otpSubmissions) * 100))
        : 0;

    return { views, submissions, convPct, otpPct, revenue };
  }, [forms]);

  const filteredForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return forms.filter((f) => {
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesQuery =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        f.headline.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [forms, searchQuery, statusFilter]);

  const handleDuplicate = (form: LeadFormConfig) => {
    const suffix = Math.floor(10 + Math.random() * 89);
    const clone: LeadFormConfig = {
      ...JSON.parse(JSON.stringify(form)),
      id: `${form.id}_copy_${suffix}`,
      slug: `${form.slug}-${suffix}`,
      title: `${form.title} (Copy)`,
      status: 'draft',
      updatedAt: 'Just now',
      stats: {
        views: 0,
        starts: 0,
        otpVerified: 0,
        submissions: 0,
        qualified: 0,
        wonRevenueInr: 0,
      },
    };
    setForms((prev) => [clone, ...prev]);
    setOpenMenuId(null);
  };

  const handleTogglePause = (formId: string) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              status: f.status === 'live' ? 'paused' : 'live',
              updatedAt: 'Just now',
            }
          : f,
      ),
    );
    setOpenMenuId(null);
  };

  const openShareModal = (
    form: LeadFormConfig,
    tab: 'link' | 'widget' | 'qr' = 'link',
  ) => {
    setShareForm(form);
    setShareTab(tab);
    setQrToast(null);
    setOpenMenuId(null);
  };

  const copyText = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
  };

  const generatedUtmUrl = useMemo(() => {
    if (!shareForm) return '';
    const base = `${origin}/f/${shareForm.slug}`;
    const params = new URLSearchParams();
    if (utmSource.trim()) params.set('utm_source', utmSource.trim());
    if (utmMedium.trim()) params.set('utm_medium', utmMedium.trim());
    if (utmCampaign.trim()) params.set('utm_campaign', utmCampaign.trim());
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [origin, shareForm, utmSource, utmMedium, utmCampaign]);

  const generatedWidgetSnippet = useMemo(() => {
    if (!shareForm) return '';
    return `<script src="${origin}/widget.js" data-form="${shareForm.slug}" data-position="${widgetPosition}" async></script>`;
  }, [origin, shareForm, widgetPosition]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-blue/10 dark:bg-sky-500/15 text-brand-blue dark:text-sky-300 border border-brand-blue/20 dark:border-sky-400/25">
            <Sparkles className="w-3.5 h-3.5" />
            <span>First-Party Lead Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white tracking-tight">
            Instant Forms
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Meta-style lead forms, website widget &amp; QR — OTP-verified leads straight into your pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:border-brand-blue/50 text-xs font-semibold text-brand-navy dark:text-slate-200 inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-brand-blue dark:text-sky-400" />
            <span>Templates</span>
          </button>

          <Link
            href="/lead-forms/new"
            className="h-9 px-4 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-brand-blue/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Form</span>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Views
            </p>
            <p className="text-2xl font-extrabold text-brand-navy dark:text-white mt-1 tabular-nums">
              {kpis.views.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Across {forms.length} active &amp; draft forms
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-brand-blue dark:text-sky-400 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Submissions
            </p>
            <p className="text-2xl font-extrabold text-brand-navy dark:text-white mt-1 tabular-nums">
              {kpis.submissions.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              {kpis.convPct}% view-to-lead conversion
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              OTP-Verified %
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {kpis.otpPct}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Zero-spam WhatsApp OTP shield
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Won Revenue
            </p>
            <p className="text-2xl font-extrabold text-brand-navy dark:text-white mt-1 tabular-nums">
              {formatInr(kpis.revenue)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Attributed GST deals closed
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forms by name or /slug..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs text-brand-navy dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>

        <div className="inline-flex items-center p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04] self-start sm:self-auto">
          {(['all', 'live', 'draft', 'paused'] as const).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                  active
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Forms Grid OR Empty State */}
      {filteredForms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-white dark:bg-[#0D1628] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
            No Instant Forms Match Your Filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try clearing your search filter or launch a new Meta-style form with WhatsApp OTP verification.
          </p>
          <div className="pt-1 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Reset Filters
            </button>
            <Link
              href="/lead-forms/new"
              className="h-9 px-4 rounded-xl bg-brand-blue text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Form
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredForms.map((form) => {
            const st = STATUS_STYLE[form.status];
            const views = Math.max(1, form.stats.views);
            const startsWidth = Math.max(
              8,
              Math.round((form.stats.starts / views) * 100),
            );
            const subWidth = Math.max(
              6,
              Math.round((form.stats.submissions / views) * 100),
            );
            const qualWidth = Math.max(
              4,
              Math.round((form.stats.qualified / views) * 100),
            );

            return (
              <div
                key={form.id}
                className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm overflow-hidden flex flex-col justify-between transition hover:border-brand-blue/40"
              >
                {/* Top Color Strip */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ backgroundColor: form.brandColor }}
                />

                <div className="p-5 space-y-4 flex-1">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/lead-forms/${form.slug}`}
                          className="text-sm font-extrabold text-brand-navy dark:text-white hover:text-brand-blue dark:hover:text-sky-300 truncate transition"
                        >
                          {form.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 truncate max-w-[190px]">
                          /f/{form.slug}
                        </span>
                        <span className="text-[10.5px] text-slate-400 truncate">
                          · {form.updatedAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 relative">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${st.badgeClass}`}
                      >
                        {st.label}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((prev) =>
                            prev === form.id ? null : form.id,
                          )
                        }
                        aria-label="Form Actions"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === form.id && (
                        <div className="absolute right-0 top-8 w-40 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] shadow-xl py-1.5 z-20 text-xs">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(form)}
                            className="w-full px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePause(form.id)}
                            className="w-full px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                          >
                            {form.status === 'live' ? (
                              <>
                                <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Pause Form</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Resume Live</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mini Funnel Progress Bar */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Conversion Funnel</span>
                      {form.stats.wonRevenueInr > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {formatInr(form.stats.wonRevenueInr)} Won
                        </span>
                      )}
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden flex gap-0.5 p-0.5">
                      <div
                        className="h-full rounded-l-full bg-slate-400/70"
                        style={{ width: form.stats.views > 0 ? '100%' : '0%' }}
                        title={`Views: ${form.stats.views}`}
                      />
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: form.stats.views > 0 ? `${startsWidth}%` : '0%',
                        }}
                        title={`Starts: ${form.stats.starts}`}
                      />
                      <div
                        className="h-full bg-indigo-500"
                        style={{
                          width: form.stats.views > 0 ? `${subWidth}%` : '0%',
                        }}
                        title={`Submitted: ${form.stats.submissions}`}
                      />
                      <div
                        className="h-full rounded-r-full bg-emerald-500"
                        style={{
                          width: form.stats.views > 0 ? `${qualWidth}%` : '0%',
                        }}
                        title={`Qualified: ${form.stats.qualified}`}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center pt-0.5">
                      <div>
                        <div className="text-xs font-extrabold text-brand-navy dark:text-white tabular-nums">
                          {form.stats.views}
                        </div>
                        <div className="text-[10px] text-slate-400">Views</div>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-blue-600 dark:text-sky-400 tabular-nums">
                          {form.stats.starts}
                        </div>
                        <div className="text-[10px] text-slate-400">Starts</div>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 tabular-nums">
                          {form.stats.submissions}
                        </div>
                        <div className="text-[10px] text-slate-400">Submitted</div>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {form.stats.qualified}
                        </div>
                        <div className="text-[10px] text-slate-400">Qualified</div>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Channel Chips & OTP Tag */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => openShareModal(form, 'link')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        form.channels.link
                          ? 'bg-blue-50/70 dark:bg-blue-500/10 text-brand-blue dark:text-sky-300 border-blue-200/80 dark:border-sky-400/20'
                          : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400 border-slate-200/60 dark:border-white/[0.05] opacity-60'
                      }`}
                    >
                      <Link2 className="w-3 h-3" /> Link
                    </button>

                    <button
                      type="button"
                      onClick={() => openShareModal(form, 'widget')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        form.channels.widget
                          ? 'bg-indigo-50/70 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-400/20'
                          : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400 border-slate-200/60 dark:border-white/[0.05] opacity-60'
                      }`}
                    >
                      <Code2 className="w-3 h-3" /> Widget
                    </button>

                    <button
                      type="button"
                      onClick={() => openShareModal(form, 'qr')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        form.channels.qr
                          ? 'bg-amber-50/70 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-400/20'
                          : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400 border-slate-200/60 dark:border-white/[0.05] opacity-60'
                      }`}
                    >
                      <QrCode className="w-3 h-3" /> QR
                    </button>

                    {form.requireWhatsappOtp && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3" /> OTP Gate
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-2">
                  <Link
                    href={`/lead-forms/${form.slug}`}
                    className="h-8 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-bold text-brand-navy dark:text-slate-100 hover:border-brand-blue/60 inline-flex items-center gap-1.5 transition"
                  >
                    <Pencil className="w-3.5 h-3.5 text-brand-blue dark:text-sky-400" />
                    <span>Edit</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openShareModal(form, 'link')}
                      className="h-8 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:border-brand-blue/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    <Link
                      href={`/f/${form.slug}`}
                      target="_blank"
                      className="h-8 px-3 rounded-xl bg-brand-blue/10 dark:bg-sky-500/15 hover:bg-brand-blue hover:text-white text-brand-blue dark:text-sky-300 text-xs font-bold inline-flex items-center gap-1 transition"
                    >
                      <span>View Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Templates Quick-Start Modal */}
      {templatesOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setTemplatesOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1628] shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.07] pb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
                  Instant Form Templates (Ready in 30 Seconds)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pick an industry-tuned Meta-style template to start customizing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplatesOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {MOCK_LEAD_FORMS.slice(0, 4).map((tpl) => (
                <Link
                  key={tpl.id}
                  href={`/lead-forms/${tpl.slug}`}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-brand-blue/60 bg-slate-50/70 dark:bg-white/[0.03] transition space-y-2 block"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tpl.brandColor }}
                    />
                    <span className="text-xs font-extrabold text-brand-navy dark:text-white flex-1 truncate">
                      {tpl.title}
                    </span>
                    <span className="text-[10px] font-bold text-brand-blue dark:text-sky-400">
                      Use →
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tpl.headline}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal (Link | Website Widget | QR Code) */}
      {shareForm && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShareForm(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1628] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
                  Share &amp; Embed: {shareForm.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribute across Ads, Website popups, or printable Expo QR posters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareForm(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-4">
              <div className="inline-flex p-1 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04]">
                {(
                  [
                    { id: 'link', label: 'Smart Link', icon: Link2 },
                    { id: 'widget', label: 'Website Widget', icon: Code2 },
                    { id: 'qr', label: 'QR Code', icon: QrCode },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = shareTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setShareTab(tab.id)}
                      className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                        active
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-6 space-y-4">
              {shareTab === 'link' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Live Trackable URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedUtmUrl}
                        className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1322] font-mono text-xs text-brand-navy dark:text-slate-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyText('utmLink', generatedUtmUrl)}
                        className="h-9 px-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedId === 'utmLink' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03] space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      UTM Campaign Builder
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                          utm_source
                        </label>
                        <input
                          type="text"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                          placeholder="google_ads"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none focus:ring-2 focus:ring-brand-blue/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                          utm_medium
                        </label>
                        <input
                          type="text"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                          placeholder="cpc"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none focus:ring-2 focus:ring-brand-blue/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                          utm_campaign
                        </label>
                        <input
                          type="text"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                          placeholder="gst_quote_2026"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none focus:ring-2 focus:ring-brand-blue/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {shareTab === 'widget' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Widget Display Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'bottom-right', label: 'Bottom Right' },
                          { id: 'bottom-left', label: 'Bottom Left' },
                          { id: 'exit-popup', label: 'Exit Popup' },
                        ] as const
                      ).map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setWidgetPosition(pos.id)}
                          className={`h-9 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            widgetPosition === pos.id
                              ? 'border-brand-blue bg-brand-blue/10 text-brand-blue dark:text-sky-300'
                              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mini Corner Placement Visual Preview */}
                  <div className="h-28 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-[#0B1322] relative overflow-hidden p-3 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Your Website Page Preview
                    </span>
                    {widgetPosition === 'exit-popup' ? (
                      <div
                        className="px-4 py-2 rounded-xl text-white text-[11px] font-bold shadow-lg"
                        style={{ backgroundColor: shareForm.brandColor }}
                      >
                        Center Instant Quote Popup
                      </div>
                    ) : (
                      <div
                        className={`absolute bottom-3 ${
                          widgetPosition === 'bottom-right' ? 'right-3' : 'left-3'
                        } px-3 py-1.5 rounded-full text-white text-[10.5px] font-bold shadow-lg`}
                        style={{ backgroundColor: shareForm.brandColor }}
                      >
                        ⚡ Get Instant Quote
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Paste 1-Line Script Before &lt;/body&gt;
                      </label>
                      <button
                        type="button"
                        onClick={() => copyText('widgetCode', generatedWidgetSnippet)}
                        className="text-xs font-bold text-brand-blue dark:text-sky-400 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === 'widgetCode' ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                      {generatedWidgetSnippet}
                    </pre>
                  </div>
                </div>
              )}

              {shareTab === 'qr' && (
                <div className="flex flex-col items-center text-center space-y-4">
                  <QrPreview
                    value={`${origin}/f/${shareForm.slug}?utm_source=qr_poster`}
                    size={196}
                    color={shareForm.brandColor}
                  />

                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Print on exhibition banners, factory packaging boxes, or visiting cards. Scans automatically tag source attribution.
                  </div>

                  {qrToast && (
                    <div className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-sky-500/15 border border-blue-200 dark:border-sky-400/25 text-xs font-semibold text-brand-blue dark:text-sky-300">
                      {qrToast}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQrToast(
                          'Coming soon — high-res PNG export activates once form backend is connected.',
                        )
                      }
                      className="h-9 px-4 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQrToast(
                          'Coming soon — printable A4 Expo Poster PDF will generate from here.',
                        )
                      }
                      className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-xs font-semibold text-brand-navy dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Poster</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

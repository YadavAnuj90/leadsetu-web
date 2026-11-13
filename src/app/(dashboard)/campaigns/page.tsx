'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Plus,
  Send,
  CheckCheck,
  Users,
  IndianRupee,
  Search,
  Database,
  Trash2,
  Rocket,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Smartphone,
} from 'lucide-react';
import {
  fetchCampaigns,
  createCampaign,
  launchCampaign,
  deleteCampaign,
  seedCampaigns,
} from '@/lib/campaigns-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  Campaign,
  CampaignStats,
  CampaignSegment,
  CampaignStatus,
} from '@/types/contracts';

const SEGMENT_LABELS: Record<CampaignSegment, string> = {
  all_leads: 'All Active CRM Leads',
  hot_leads: 'AI Score 75+ Hot Prospects',
  noida_delhi_ncr: 'Noida, Delhi & Gurugram Buyers',
  indiamart_buyers: 'IndiaMART Inbound Inquiries',
  gst_customers: 'GSTIN Verified B2B Accounts',
};

const PRESET_TEMPLATES = [
  {
    label: 'Q4 Price List & GST Catalogue (Hinglish)',
    templateName: 'ncr_industrial_pricelist_v2',
    language: 'hinglish' as const,
    ctaLabel: 'Download PDF Price List',
    body: 'Namaste {{name}} ji 👋, {{company}} ke liye humara updated Q4 Factory Price List & 18% GST Catalogue ready hai from Noida Electronic City. Click below for distributor pricing!',
  },
  {
    label: 'IndiaMART 15-Min Instant Follow-up (Hinglish)',
    templateName: 'indiamart_instant_quote_ai',
    language: 'hinglish' as const,
    ctaLabel: 'Book Free Site Visit',
    body: 'Hello {{name}} ji, thank you for your inquiry on IndiaMART for {{company}}. Humari engineering team Noida & Delhi-NCR me same-day site inspection provide karti hai. Reply YES to confirm!',
  },
  {
    label: '30-Day B2B Corporate Credit Offer (English)',
    templateName: 'hot_leads_credit_unlock',
    language: 'english' as const,
    ctaLabel: 'Claim 30-Day Credit Line',
    body: 'Hi {{name}}, exclusive offer for {{company}}: Unlock a 30-day B2B credit cycle + priority dispatch from our Noida Electronic City hub on orders confirmed this week.',
  },
];

export default function CampaignsPage() {
  const router = useRouter();
  const { tenant } = useAuthStore();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalReplies: 0,
    avgDeliveryRate: 0,
    avgReadRate: 0,
    totalAttributedRevenue: 0,
    segmentCounts: {},
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [templateName, setTemplateName] = useState('ncr_industrial_pricelist_v2');
  const [language, setLanguage] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');
  const [channel, setChannel] = useState<'whatsapp_cloud' | 'whatsapp_ai_drip'>('whatsapp_cloud');
  const [targetSegment, setTargetSegment] = useState<CampaignSegment>('noida_delhi_ncr');
  const [messageBody, setMessageBody] = useState(PRESET_TEMPLATES[0].body);
  const [ctaLabel, setCtaLabel] = useState(PRESET_TEMPLATES[0].ctaLabel);
  const [statusMode, setStatusMode] = useState<CampaignStatus>('completed');
  const [scheduledFor, setScheduledFor] = useState('15 Nov 2026, 11:00 AM IST');

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchCampaigns({
        search: search.trim() || undefined,
        status: statusFilter,
        targetSegment: segmentFilter,
      });
      setCampaigns(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, segmentFilter]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleApplyPreset = (idx: number) => {
    const preset = PRESET_TEMPLATES[idx];
    if (!preset) return;
    setTemplateName(preset.templateName);
    setLanguage(preset.language);
    setCtaLabel(preset.ctaLabel);
    setMessageBody(preset.body);
    if (!name.trim()) {
      setName(preset.label.replace(/\s*\(.*?\)\s*/g, ''));
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !messageBody.trim()) return;
    setIsMutating(true);
    setErrorMsg(null);
    try {
      await createCampaign({
        name: name.trim(),
        templateName: templateName.trim(),
        language,
        channel,
        targetSegment,
        messageBody: messageBody.trim(),
        ctaLabel: ctaLabel.trim() || 'Get Instant Quote',
        status: statusMode,
        scheduledFor: statusMode === 'scheduled' ? scheduledFor : '',
      });
      setModalOpen(false);
      setName('');
      await loadCampaigns();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSeed = async () => {
    setIsMutating(true);
    try {
      await seedCampaigns();
      await loadCampaigns();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleLaunchNow = async (id: string) => {
    setIsMutating(true);
    try {
      await launchCampaign(id);
      await loadCampaigns();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsMutating(true);
    try {
      await deleteCampaign(id);
      await loadCampaigns();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const segCounts = (stats.segmentCounts || {}) as Record<string, number>;
  const previewAudienceCount = segCounts[targetSegment] || 140;

  // Render live personalized preview text
  const renderedPreviewText = messageBody
    .replace(/\{\{name\}\}/g, 'Rajesh Sharma')
    .replace(/\{\{company\}\}/g, 'RS Electricals Pvt. Ltd.');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Official Meta WhatsApp Cloud API Broadcasts
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            WhatsApp Broadcast &amp; Drip Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Blast green-tick Hinglish &amp; English templates to segmented leads across Noida, Delhi-NCR &amp; IndiaMART with zero ban risk.
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
            Seed 4 Sample Campaigns
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> Launch WhatsApp Broadcast
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Messages Sent</span>
            <Send className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.totalSent.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across <span className="font-bold text-slate-700">{stats.totalCampaigns}</span> campaigns
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Avg Delivery &amp; Read Rate</span>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {stats.avgDeliveryRate}%{' '}
            <span className="text-sm font-bold text-slate-400">
              / {stats.avgReadRate}% Read
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.totalRead.toLocaleString('en-IN')} blue-tick opens
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>WhatsApp Buyer Replies</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.totalReplies.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Routed directly to Unified AI Inbox
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Attributed Pipeline</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            ₹{stats.totalAttributedRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Revenue generated from WhatsApp blasts
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
            placeholder="Search by campaign name, Meta template slug, or Hinglish message..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="all">All Target Segments</option>
            <option value="noida_delhi_ncr">Noida &amp; Delhi-NCR Buyers</option>
            <option value="hot_leads">AI Score 75+ Hot Leads</option>
            <option value="indiamart_buyers">IndiaMART Inquiries</option>
            <option value="gst_customers">GSTIN Verified Accounts</option>
            <option value="all_leads">All Active Leads</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
            <p className="text-xs font-semibold">
              Loading WhatsApp Broadcast Campaigns from MongoDB...
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-navy">
                No WhatsApp Campaigns Yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Seed 4 high-converting Noida &amp; Delhi-NCR B2B WhatsApp broadcast campaigns or create a new broadcast.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSeed}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Seed 4 Sample Campaigns
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
              >
                + Launch Broadcast
              </button>
            </div>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:border-brand-blue/40 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        camp.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {camp.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {camp.status === 'completed'
                        ? 'Dispatched via WhatsApp Cloud'
                        : `Scheduled (${camp.scheduledFor || 'Pending'})`}
                    </span>

                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Template: {camp.templateName}
                    </span>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue">
                      {SEGMENT_LABELS[camp.targetSegment] || camp.targetSegment}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-brand-navy">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                    &ldquo;{camp.messageBody}&rdquo;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start lg:self-center">
                  {camp.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleLaunchNow(camp.id)}
                      disabled={isMutating}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <Rocket className="w-3.5 h-3.5" /> Blast Now
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(camp.id)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Funnel Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50/80 rounded-xl p-3">
                  <div className="text-slate-400 font-semibold">Target Audience</div>
                  <div className="text-base font-extrabold text-brand-navy mt-0.5">
                    {camp.audienceCount} Buyers
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-3">
                  <div className="text-slate-400 font-semibold">Delivered</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {camp.deliveredCount}{' '}
                    <span className="text-xs font-bold text-slate-400">
                      ({camp.deliveryRate}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-3">
                  <div className="text-slate-400 font-semibold">Blue-Tick Read</div>
                  <div className="text-base font-extrabold text-brand-blue mt-0.5">
                    {camp.readCount}{' '}
                    <span className="text-xs font-bold text-slate-400">
                      ({camp.readRate}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-3">
                  <div className="text-slate-400 font-semibold">WhatsApp Replies</div>
                  <div className="text-base font-extrabold text-indigo-600 mt-0.5">
                    {camp.repliedCount}{' '}
                    <span className="text-xs font-bold text-slate-400">
                      ({camp.replyRate}%)
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 col-span-2 sm:col-span-1">
                  <div className="text-emerald-700 font-semibold">
                    Attributed Revenue
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    ₹{camp.attributedRevenue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── CREATE & PREVIEW WHATSAPP BROADCAST MODAL ────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-extrabold">
                    Launch Official WhatsApp Cloud Broadcast
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Select a Meta-approved Hinglish/English template and preview live on WhatsApp
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

            <form
              onSubmit={handleCreate}
              className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[82vh] overflow-y-auto"
            >
              {/* Left Column: Campaign Builder */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1-Click Approved Template Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TEMPLATES.map((preset, idx) => (
                      <button
                        key={preset.templateName}
                        type="button"
                        onClick={() => handleApplyPreset(idx)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-light hover:border-brand-blue text-xs font-semibold text-slate-700 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Noida Q4 Catalogue Broadcast"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Audience Segment (Live DB)
                    </label>
                    <select
                      value={targetSegment}
                      onChange={(e) =>
                        setTargetSegment(e.target.value as CampaignSegment)
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-semibold"
                    >
                      <option value="noida_delhi_ncr">
                        Noida &amp; Delhi-NCR Buyers ({segCounts.noida_delhi_ncr || 112})
                      </option>
                      <option value="hot_leads">
                        AI Score 75+ Hot Prospects ({segCounts.hot_leads || 48})
                      </option>
                      <option value="indiamart_buyers">
                        IndiaMART Inquiries ({segCounts.indiamart_buyers || 64})
                      </option>
                      <option value="gst_customers">
                        GSTIN Verified B2B Accounts ({segCounts.gst_customers || 38})
                      </option>
                      <option value="all_leads">
                        All Active CRM Leads ({segCounts.all_leads || 140})
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meta Template Slug
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) =>
                        setLanguage(
                          e.target.value as 'hinglish' | 'english' | 'hindi',
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                    >
                      <option value="hinglish">Hinglish (High Reply Rate)</option>
                      <option value="english">Formal English</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quick-Reply CTA Button
                    </label>
                    <input
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      WhatsApp Message Body *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Variables: <code className="text-brand-blue">{'{{name}}'}</code>,{' '}
                      <code className="text-brand-blue">{'{{company}}'}</code>
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dispatch Mode
                    </label>
                    <select
                      value={statusMode}
                      onChange={(e) =>
                        setStatusMode(e.target.value as CampaignStatus)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="completed">
                        Blast Immediately ({previewAudienceCount} Recipients)
                      </option>
                      <option value="scheduled">Schedule for Later</option>
                      <option value="draft">Save as Draft</option>
                    </select>
                  </div>

                  {statusMode === 'scheduled' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Schedule Date &amp; Time (IST)
                      </label>
                      <input
                        type="text"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  )}
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
                    {isMutating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {statusMode === 'completed'
                      ? `Blast to ${previewAudienceCount} Buyers Now`
                      : 'Save Campaign'}
                  </button>
                </div>
              </div>

              {/* Right Column: Live WhatsApp Handset Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900 rounded-3xl p-5 text-white">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Live Buyer Handset Preview
                </div>

                <div className="w-full max-w-xs rounded-2xl overflow-hidden border border-slate-700 bg-[#ECE5DD] text-slate-800 shadow-xl">
                  {/* WhatsApp Top Bar */}
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-extrabold text-xs">
                      LS
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        {tenant?.name || 'Leadsetu Technologies'}
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 fill-emerald-600" />
                      </div>
                      <div className="text-[10px] text-emerald-100">
                        Official Business Account · Noida
                      </div>
                    </div>
                  </div>

                  {/* Message Area */}
                  <div className="p-4 space-y-2">
                    <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-sm space-y-2">
                      <div className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                        GST &amp; Catalogue Update
                      </div>
                      <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                        {renderedPreviewText}
                      </p>
                      <div className="text-[10px] text-slate-400 text-right flex items-center justify-end gap-1">
                        <span>10:42 AM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                    </div>

                    {/* Interactive Quick Reply Button */}
                    <div className="bg-white rounded-xl py-2 px-3 text-center text-xs font-bold text-sky-600 shadow-sm border border-slate-100">
                      {ctaLabel || 'Get Instant Quote'}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  HelpCircle,
  LifeBuoy,
  Loader2,
  MessageSquare,
  PhoneCall,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { isWorkspaceAdminRole } from '@/lib/feature-access';
import {
  createPlatformTicketApi,
  fetchMyPlatformTicketsApi,
  reopenPlatformTicketApi,
  replyPlatformTicketApi,
} from '@/lib/platform-tickets-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  PlatformTicketCategory,
  PlatformTicketItem,
  PlatformTicketPriority,
  PlatformTicketStatus,
} from '@/types/contracts';

const CATEGORY_OPTIONS: Array<{
  key: PlatformTicketCategory;
  label: string;
  desc: string;
  icon: typeof Bug;
}> = [
  {
    key: 'ui_glitch',
    label: 'UI Glitch / Bug',
    desc: 'Broken layout, error screen or button issue',
    icon: Bug,
  },
  {
    key: 'whatsapp_api',
    label: 'WhatsApp Cloud',
    desc: 'WABA hook, templates or delivery problem',
    icon: MessageSquare,
  },
  {
    key: 'indiamart_sync',
    label: 'IndiaMART / Leads',
    desc: 'Lead pull sync, CSV or routing issue',
    icon: Wrench,
  },
  {
    key: 'gst_invoicing',
    label: 'GST & Quotes',
    desc: 'Tax calc, PDF quote or Razorpay link',
    icon: FileSpreadsheet,
  },
  {
    key: 'calling_webrtc',
    label: 'CRM Phone / Calls',
    desc: 'WebRTC mic, dialer or audio issue',
    icon: PhoneCall,
  },
  {
    key: 'billing_plan',
    label: 'Billing & Plan',
    desc: 'Quotas, AI balance or SaaS subscription',
    icon: CreditCard,
  },
  {
    key: 'feature_help',
    label: 'Service Help',
    desc: 'Setup guidance or custom request',
    icon: HelpCircle,
  },
];

const STATUS_META: Record<
  PlatformTicketStatus,
  { label: string; cls: string }
> = {
  open: {
    label: 'Open · In Queue',
    cls: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  },
  in_progress: {
    label: 'HQ Investigating',
    cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  },
  waiting_admin: {
    label: 'Needs Your Reply',
    cls: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
  },
  resolved: {
    label: 'Resolved by HQ ✓',
    cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  },
  closed: {
    label: 'Closed',
    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

const PRIORITY_META: Record<PlatformTicketPriority, string> = {
  urgent: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
  high: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  medium: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export default function HqSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isAdmin = isWorkspaceAdminRole(user);

  const [tickets, setTickets] = useState<PlatformTicketItem[]>([]);
  const [stats, setStats] = useState({ total: 0, openCount: 0, resolvedCount: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Create Ticket Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<PlatformTicketCategory>('ui_glitch');
  const [priority, setPriority] = useState<PlatformTicketPriority>('high');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active Ticket Thread Drawer/Modal State
  const [activeTicket, setActiveTicket] = useState<PlatformTicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyPlatformTicketsApi({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setTickets(res.data || []);
      if (res.stats) setStats(res.stats);
      setActiveTicket((prev) =>
        prev ? (res.data || []).find((t) => t.id === prev.id) || prev : null,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, statusFilter, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Open ticket directly when navigated from notification bell (?ticketId=...)
  useEffect(() => {
    const tid = searchParams.get('ticketId');
    if (tid && tickets.length > 0) {
      const found = tickets.find((t) => t.id === tid);
      if (found) setActiveTicket(found);
    }
  }, [searchParams, tickets]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
        <ShieldCheck className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-lg font-black text-brand-navy dark:text-white">
          Workspace Admin Access Required
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Only Company Owners and Workspace Admins can raise platform tickets directly to Leadsetu Super Admin.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createPlatformTicketApi({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });
      setModalOpen(false);
      setSubject('');
      setDescription('');
      setCategory('ui_glitch');
      setPriority('high');
      setToast(`Submitted ${created.ticketNumber} directly to Leadsetu Super Admin HQ.`);
      setTimeout(() => setToast(null), 4000);
      await loadTickets();
      setActiveTicket(created);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setReplyBusy(true);
    try {
      const updated = await replyPlatformTicketApi(activeTicket.id, {
        message: replyText.trim(),
      });
      setReplyText('');
      setActiveTicket(updated);
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReplyBusy(false);
    }
  };

  const handleReopen = async () => {
    if (!activeTicket) return;
    setReplyBusy(true);
    try {
      const updated = await reopenPlatformTicketApi(activeTicket.id);
      setActiveTicket(updated);
      await loadTickets();
      setToast(`Reopened ${updated.ticketNumber} and notified Leadsetu HQ.`);
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#071021] via-[#0F1F3D] to-[#163466] text-white border border-sky-400/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Direct Escalation to Leadsetu Super Admin
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Leadsetu HQ Platform Support Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Spotted a UI glitch, WhatsApp Cloud hook error, IndiaMART sync snag, or GST billing question? Raise a ticket below — your workspace details attach silently behind the scenes, and you&apos;ll get a live bell notification the instant HQ resolves it.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#0057FF] to-[#2563EB] hover:from-[#0046D5] hover:to-[#1D4ED8] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Raise Platform Issue
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Raised
          </div>
          <div className="text-2xl font-black text-brand-navy dark:text-white mt-1">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Active / In Review
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">
            {stats.openCount}
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Resolved by Super Admin
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">
            {stats.resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl p-3.5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket # (PLT-2026...), subject or issue..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-navy dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">HQ Investigating</option>
            <option value="waiting_admin">Needs Reply</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            type="button"
            onClick={loadTickets}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-brand-blue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {loading && tickets.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
            <span>Loading your HQ support tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-2.5">
            <LifeBuoy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-extrabold text-brand-navy dark:text-white">
              No Platform Support Tickets Yet
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Need help with any bug, glitch, WhatsApp API setup, or plan feature? Click &ldquo;Raise Platform Issue&rdquo; to contact Leadsetu Super Admin directly.
            </p>
          </div>
        ) : (
          tickets.map((tk) => {
            const st = STATUS_META[tk.status] || STATUS_META.open;
            const catMeta = CATEGORY_OPTIONS.find((c) => c.key === tk.category);
            return (
              <div
                key={tk.id}
                onClick={() => setActiveTicket(tk)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-blue">
                      {tk.ticketNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${PRIORITY_META[tk.priority]}`}>
                      {tk.priority}
                    </span>
                    {catMeta && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {catMeta.label}
                      </span>
                    )}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-brand-navy dark:text-white truncate">
                    {tk.subject}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {tk.resolutionSummary
                      ? `HQ Resolution: ${tk.resolutionSummary}`
                      : tk.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-slate-400 inline-flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(tk.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-brand-navy dark:text-white text-xs">
                    Open Thread ({tk.comments?.length || 0}) →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Raise Platform Ticket Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
          >
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-black flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-sky-400" />
                  <span>Report Platform Issue to Super Admin</span>
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Describe only the issue — your organization &amp; session diagnostics are attached automatically in the background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Issue Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = category === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setCategory(opt.key)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-brand-blue bg-brand-light/70 dark:bg-brand-blue/15'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-navy dark:text-white">
                          <Icon className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Issue Subject *
                  </label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. WhatsApp invoice PDF not attaching on click"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-brand-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Urgency
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PlatformTicketPriority)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-navy dark:text-white"
                  >
                    <option value="urgent">Urgent · Blocker</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Normal</option>
                    <option value="low">Low · Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Detailed Problem Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share exact steps, error toast message, or what help you need from Leadsetu HQ..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-brand-navy dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-extrabold text-white inline-flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Ticket to Super Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Thread Detail Modal */}
      {activeTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveTicket(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-sky-400">
                    {activeTicket.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      STATUS_META[activeTicket.status].cls
                    }`}
                  >
                    {STATUS_META[activeTicket.status].label}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black mt-1">
                  {activeTicket.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              {/* Resolution Banner (if HQ resolved) */}
              {activeTicket.resolutionSummary && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 space-y-1">
                  <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Resolution Update {activeTicket.resolvedByName ? `by ${activeTicket.resolvedByName}` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-200 leading-relaxed">
                    {activeTicket.resolutionSummary}
                  </p>
                </div>
              )}

              {/* Original Description */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Reported Issue Details
                </div>
                <p className="text-xs sm:text-sm text-brand-navy dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeTicket.description}
                </p>
              </div>

              {/* Replies Timeline */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Support Conversation ({activeTicket.comments?.length || 0})
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {(activeTicket.comments || []).map((c) => {
                    const isHq = c.authorRole === 'super_admin';
                    const isSys = c.authorRole === 'system';
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl border text-xs ${
                          isHq
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-500/30'
                            : isSys
                              ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                              : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-brand-navy dark:text-white">
                            {isHq ? '★ Leadsetu HQ · ' : ''}
                            {c.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {c.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up Reply / Reopen */}
              <form onSubmit={handleSendReply} className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a follow-up note or confirmation to Leadsetu Super Admin..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-brand-navy dark:text-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {(activeTicket.status === 'resolved' || activeTicket.status === 'closed') ? (
                    <button
                      type="button"
                      disabled={replyBusy}
                      onClick={handleReopen}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-700 dark:text-amber-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reopen Issue
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Super Admin updates automatically trigger your notification bell.
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={replyBusy || !replyText.trim()}
                    className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{replyBusy ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

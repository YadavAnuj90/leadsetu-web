'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hash,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  fetchHqPlatformTicketsApi,
  updateHqPlatformTicketApi,
} from '@/lib/platform-tickets-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  PlatformTicketPriority,
  PlatformTicketStatus,
  SuperAdminPlatformTicketItem,
} from '@/types/contracts';

const CATEGORY_LABELS: Record<string, string> = {
  ui_glitch: 'UI Glitch / Bug',
  whatsapp_api: 'WhatsApp Cloud',
  indiamart_sync: 'IndiaMART / Leads',
  gst_invoicing: 'GST & Quotes',
  calling_webrtc: 'CRM Phone / Calls',
  billing_plan: 'Billing & Plan',
  feature_help: 'Service Help',
  other: 'Other',
};

const STATUS_STYLE: Record<PlatformTicketStatus, string> = {
  open: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  in_progress: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  waiting_admin: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700',
};

const PRIORITY_STYLE: Record<PlatformTicketPriority, string> = {
  urgent: 'bg-rose-600 text-white',
  high: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  medium: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export default function PlatformSupportSection({
  onInspectTenant,
  onCountChange,
}: {
  onInspectTenant?: (tenantId: string) => void;
  onCountChange?: (openCount: number) => void;
}) {
  const [tickets, setTickets] = useState<SuperAdminPlatformTicketItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    openCount: 0,
    inProgressCount: 0,
    waitingAdminCount: 0,
    resolvedCount: 0,
    urgentActiveCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [selected, setSelected] = useState<SuperAdminPlatformTicketItem | null>(null);
  const [nextStatus, setNextStatus] = useState<PlatformTicketStatus>('in_progress');
  const [nextPriority, setNextPriority] = useState<PlatformTicketPriority>('high');
  const [resolutionDraft, setResolutionDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHqPlatformTicketsApi({
        status: statusFilter,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search.trim() || undefined,
      });
      setTickets(res.data || []);
      if (res.stats) {
        setStats(res.stats);
        onCountChange?.(
          (res.stats.openCount || 0) +
            (res.stats.inProgressCount || 0) +
            (res.stats.waitingAdminCount || 0),
        );
      }
      setSelected((prev) =>
        prev ? (res.data || []).find((t) => t.id === prev.id) || prev : null,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search, onCountChange]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = (tk: SuperAdminPlatformTicketItem) => {
    setSelected(tk);
    setNextStatus(tk.status);
    setNextPriority(tk.priority);
    setResolutionDraft(tk.resolutionSummary || '');
    setReplyDraft('');
  };

  const handleSaveResolution = async (
    e?: FormEvent,
    overrideStatus?: PlatformTicketStatus,
  ) => {
    e?.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const targetStatus = overrideStatus ?? nextStatus;
      const updated = await updateHqPlatformTicketApi(selected.id, {
        status: targetStatus,
        priority: nextPriority,
        resolutionSummary: resolutionDraft.trim(),
        replyMessage: replyDraft.trim() || undefined,
      });
      setReplyDraft('');
      setSelected(updated);
      setNextStatus(updated.status);
      setToast(
        `Updated ${updated.ticketNumber} (Acct #${updated.accountId || '—'}) to ${updated.status.toUpperCase()} — notification sent to ${updated.raisedByName}.`,
      );
      setTimeout(() => setToast(null), 4500);
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'New Open',
            value: stats.openCount,
            cls: 'text-rose-600 dark:text-rose-400',
          },
          {
            label: 'Investigating',
            value: stats.inProgressCount,
            cls: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Waiting Admin',
            value: stats.waitingAdminCount,
            cls: 'text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Urgent / High Active',
            value: stats.urgentActiveCount,
            cls: 'text-rose-700 dark:text-rose-300',
          },
          {
            label: 'Resolved Total',
            value: stats.resolvedCount,
            cls: 'text-emerald-600 dark:text-emerald-400',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {kpi.label}
            </div>
            <div className={`text-2xl font-black mt-1 ${kpi.cls}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'active', label: `Active Queue (${stats.openCount + stats.inProgressCount + stats.waitingAdminCount})` },
              { key: 'open', label: `Open (${stats.openCount})` },
              { key: 'in_progress', label: `Investigating (${stats.inProgressCount})` },
              { key: 'resolved', label: `Resolved (${stats.resolvedCount})` },
              { key: 'all', label: `All (${stats.total})` },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                  statusFilter === chip.key
                    ? 'bg-[#0057FF] text-white border-[#0057FF]'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadTickets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[#0057FF]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Account ID #, company name, owner email, PLT ticket #, or glitch keywords..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cross-Tenant Platform Tickets Table/Cards */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {loading && tickets.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0057FF]" />
            <span>Loading global tenant escalation queue...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <LifeBuoy className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-sm font-black text-slate-900 dark:text-white">
              Zero Matching Platform Tickets
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All B2B, B2C, MSME, BPO, and Education workspaces are running smoothly.
            </p>
          </div>
        ) : (
          tickets.map((tk) => (
            <div
              key={tk.id}
              onClick={() => openTicket(tk)}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#0057FF] dark:text-sky-400">
                    {tk.ticketNumber}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-sky-500/20 text-white dark:text-sky-200 font-mono text-[11px] font-black">
                    <Hash className="w-3 h-3" /> Acct {tk.accountId || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-extrabold">
                    <Building2 className="w-3 h-3" /> {tk.companyName || 'Workspace'}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tk.businessMode} · {tk.tenantPlan}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      STATUS_STYLE[tk.status]
                    }`}
                  >
                    {tk.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      PRIORITY_STYLE[tk.priority]
                    }`}
                  >
                    {tk.priority}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {tk.subject}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Raised by:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {tk.raisedByName}
                    </strong>{' '}
                    ({tk.raisedByEmail})
                  </span>
                  <span>· {CATEGORY_LABELS[tk.category] || tk.category}</span>
                  {tk.pageUrl && (
                    <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                      Screen: {tk.pageUrl}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(tk.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTicket(tk);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0046D5] text-white text-xs font-extrabold"
                >
                  Inspect &amp; Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Super Admin Ticket Resolution Workbench Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
          >
            <div className="px-6 py-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-sky-400">
                    {selected.ticketNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 font-mono text-[11px] font-black">
                    Acct #{selected.accountId || '—'}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {selected.companyName} ({selected.businessMode.toUpperCase()} · {selected.tenantPlan.toUpperCase()})
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-1">
                  {selected.subject}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {onInspectTenant && (
                  <button
                    type="button"
                    onClick={() => {
                      const tid = selected.tenantId;
                      setSelected(null);
                      onInspectTenant(tid);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Inspect Tenant
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Auto-Fetched Tenant Identity Grid (Visible Exclusively to Super Admin) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Account ID &amp; Organization
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    #{selected.accountId} · {selected.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Raised By Admin
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
                    <Mail className="w-3 h-3 text-brand-blue" /> {selected.raisedByName} ({selected.raisedByEmail})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Category &amp; Diagnostic Screen
                  </span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {CATEGORY_LABELS[selected.category] || selected.category}{' '}
                    {selected.pageUrl ? `· ${selected.pageUrl}` : ''}
                  </span>
                </div>
              </div>

              {/* Problem Description */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Reported Issue Body
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selected.description}
                </p>
              </div>

              {/* Conversation History */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Timeline &amp; Replies ({selected.comments?.length || 0})
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {(selected.comments || []).map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-2xl border text-xs ${
                        c.authorRole === 'super_admin'
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30'
                          : c.authorRole === 'system'
                            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                            : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white">
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
                      <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {c.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Super Admin Resolution Form */}
              <form
                onSubmit={(e) => handleSaveResolution(e)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#0057FF]" />
                    <span>Super Admin Action &amp; Admin Notification</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={nextStatus}
                      onChange={(e) =>
                        setNextStatus(e.target.value as PlatformTicketStatus)
                      }
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">HQ Investigating</option>
                      <option value="waiting_admin">Waiting Admin Reply</option>
                      <option value="resolved">Resolved ✓</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={nextPriority}
                      onChange={(e) =>
                        setNextPriority(e.target.value as PlatformTicketPriority)
                      }
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Official Resolution Summary (shown in green banner to Admin)
                  </label>
                  <input
                    type="text"
                    value={resolutionDraft}
                    onChange={(e) => setResolutionDraft(e.target.value)}
                    placeholder="e.g. Fixed WABA webhook mapping & verified live delivery for your account."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Reply Message to {selected.raisedByName} (pushes live bell alert)
                  </label>
                  <textarea
                    rows={2}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="Write helpful update or confirmation steps for the workspace admin..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-white"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Save Status / Send Reply</span>
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveResolution(undefined, 'resolved')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{saving ? 'Updating...' : 'Mark Resolved & Notify Admin'}</span>
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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-client';
import {
  deleteSuperAdminContactInquiryApi,
  fetchSuperAdminContactInquiriesApi,
  updateSuperAdminContactInquiryApi,
  type ContactInquiryStatus,
  type SuperAdminContactInquiriesResponse,
  type SuperAdminContactInquiryItem,
} from '@/lib/super-admin-api';

const STATUS_META: Array<{
  value: ContactInquiryStatus;
  label: string;
  badgeClass: string;
}> = [
  {
    value: 'new',
    label: 'New',
    badgeClass:
      'bg-blue-500/10 text-blue-700 dark:text-sky-300 border-blue-500/25',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    badgeClass:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
  },
  {
    value: 'demo_scheduled',
    label: 'Demo Scheduled',
    badgeClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  {
    value: 'converted',
    label: 'Converted',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
  {
    value: 'archived',
    label: 'Archived',
    badgeClass:
      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-400/25',
  },
];

export default function ContactInquiriesSection() {
  const [data, setData] = useState<SuperAdminContactInquiriesResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ContactInquiryStatus>(
    'all',
  );
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loadInquiries = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchSuperAdminContactInquiriesApi();
      setData(res);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const item of res.data) {
          if (next[item.id] === undefined) next[item.id] = item.ownerNotes || '';
        }
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data || []).filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [data?.data, statusFilter, search]);

  const handleUpdate = async (
    item: SuperAdminContactInquiryItem,
    status: ContactInquiryStatus,
    ownerNotes?: string,
  ) => {
    setBusyId(item.id);
    setError(null);
    try {
      await updateSuperAdminContactInquiryApi(item.id, { status, ownerNotes });
      setToast(`Updated ${item.company} (${item.name}) → ${status}`);
      await loadInquiries();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: SuperAdminContactInquiryItem) => {
    if (
      !window.confirm(
        `Delete contact inquiry from ${item.name} (${item.company})?`,
      )
    ) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      await deleteSuperAdminContactInquiryApi(item.id);
      setToast(`Deleted inquiry from ${item.company}.`);
      await loadInquiries();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 rounded-3xl border border-slate-200/80 bg-white p-10 dark:border-slate-800 dark:bg-[#0D1628]">
        <Loader2 className="h-5 w-5 animate-spin text-[#0057FF]" />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
          Loading Sales &amp; Demo Inquiries...
        </span>
      </div>
    );
  }

  const stats = data?.stats || {
    total: 0,
    newCount: 0,
    contactedCount: 0,
    demoScheduledCount: 0,
    convertedCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/85 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0D1628] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
            <MessageSquare className="h-3.5 w-3.5" /> Inbound Sales &amp; Demo Desk
          </div>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            Public Contact &amp; Walkthrough Requests
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Every enterprise demo &amp; integration request submitted on{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
              /company/contact
            </code>{' '}
            is stored here in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/company/contact"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-[#0057FF] hover:text-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>Open /company/contact</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={loadInquiries}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'New / Unread',
            value: stats.newCount,
            sub: `${stats.total} total received`,
            accent: 'text-[#0057FF] dark:text-sky-400',
          },
          {
            label: 'Contacted',
            value: stats.contactedCount,
            sub: 'Reached out by HQ',
            accent: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            label: 'Demo Scheduled',
            value: stats.demoScheduledCount,
            sub: 'Walkthrough booked',
            accent: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Converted',
            value: stats.convertedCount,
            sub: 'Closed workspaces',
            accent: 'text-emerald-600 dark:text-emerald-400',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0D1628]"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className={`mt-1 text-2xl font-black ${kpi.accent}`}>
              {kpi.value}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-[#0D1628]">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, name, email, topic, or message..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
              statusFilter === 'all'
                ? 'bg-[#0057FF] text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All ({stats.total})
          </button>
          {STATUS_META.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                statusFilter === st.value
                  ? 'bg-[#0057FF] text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-[#0D1628] dark:text-slate-400">
          No inquiries match the current filter. Submissions from{' '}
          <code>/company/contact</code> will appear here immediately.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const stMeta =
              STATUS_META.find((s) => s.value === item.status) || STATUS_META[0];
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D1628]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 ${stMeta.badgeClass}`}
                      >
                        {stMeta.label}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[#0057FF] dark:bg-blue-950/60 dark:text-sky-300">
                        {item.topic}
                      </span>
                      {item.createdAt && (
                        <span className="text-slate-400">
                          {new Date(item.createdAt).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                      <span>{item.name}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Building2 className="h-3.5 w-3.5" /> {item.company}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#0057FF] dark:text-sky-400">
                      <a
                        href={`mailto:${item.email}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" /> {item.email}
                      </a>
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-1.5 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" /> {item.phone}
                        </a>
                      )}
                    </div>

                    <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 lg:w-72 shrink-0">
                    <div className="flex gap-2">
                      <select
                        value={item.status}
                        disabled={busyId === item.id}
                        onChange={(e) =>
                          handleUpdate(
                            item,
                            e.target.value as ContactInquiryStatus,
                            noteDrafts[item.id],
                          )
                        }
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {STATUS_META.map((s) => (
                          <option key={s.value} value={s.value}>
                            Status: {s.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleDelete(item)}
                        className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        title="Delete inquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={noteDrafts[item.id] ?? item.ownerNotes ?? ''}
                        onChange={(e) =>
                          setNoteDrafts((p) => ({
                            ...p,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="HQ follow-up notes..."
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          handleUpdate(
                            item,
                            item.status,
                            noteDrafts[item.id] ?? '',
                          )
                        }
                        className="rounded-xl bg-[#0057FF] px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

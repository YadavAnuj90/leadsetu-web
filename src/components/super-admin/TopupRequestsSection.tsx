'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchSuperAdminTopupRequestsApi,
  resolveTopupRequestApi,
  type SuperAdminTopupRequestItem,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

export default function TopupRequestsSection({
  onResolved,
}: {
  onResolved?: () => Promise<void> | void;
}) {
  const [items, setItems] = useState<SuperAdminTopupRequestItem[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [grantAmounts, setGrantAmounts] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [issueInvoices, setIssueInvoices] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuperAdminTopupRequestsApi(statusFilter);
      setItems(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (
    item: SuperAdminTopupRequestItem,
    action: 'approve' | 'reject',
  ) => {
    setBusyId(item.id);
    setError(null);
    setToast(null);
    try {
      const grantedQuantity = grantAmounts[item.id] ?? item.quantity;
      const priceInr = prices[item.id] ?? 0;
      const issueGstInvoice = Boolean(issueInvoices[item.id]);
      const note = notes[item.id] || '';
      await resolveTopupRequestApi(item.tenantId, item.id, {
        action,
        grantedQuantity,
        priceInr,
        issueGstInvoice,
        note,
      });
      setToast(
        action === 'approve'
          ? `Approved +${grantedQuantity.toLocaleString('en-IN')} ${item.resource.toUpperCase()} for ${item.tenantName}.`
          : `Rejected top-up request from ${item.tenantName}.`,
      );
      await load();
      await onResolved?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0057FF]" />
            <span>AI &amp; WhatsApp Top-Up Request Queue</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review Company Admin balance requests and grant quota packs in 1 click with optional 18% GST invoicing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[#0057FF] text-white border-[#0057FF]'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#0057FF] text-white border-[#0057FF]'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            All History ({stats.pending + stats.approved + stats.rejected})
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0057FF]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}
      {toast && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#0057FF]" />
          <span>Loading Company Admin top-up requests...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          No {statusFilter === 'pending' ? 'pending ' : ''}top-up requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isPending = item.status === 'pending';
            const grantVal = grantAmounts[item.id] ?? item.quantity;
            const priceVal = prices[item.id] ?? 0;
            const issueInv = Boolean(issueInvoices[item.id]);
            const noteVal = notes[item.id] ?? '';

            return (
              <div
                key={`${item.tenantId}-${item.id}`}
                className="p-5 rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {item.tenantName}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        #{item.accountId} · {item.city}
                      </span>
                      <span className="px-2 py-0.5 rounded uppercase text-[10px] font-black bg-blue-500/15 text-[#0057FF] dark:text-sky-300">
                        {item.plan}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          item.resource === 'ai'
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        }`}
                      >
                        {item.resource === 'ai' ? (
                          <Sparkles className="w-3 h-3" />
                        ) : (
                          <MessageSquare className="w-3 h-3" />
                        )}
                        +{item.quantity.toLocaleString('en-IN')}{' '}
                        {item.resource === 'ai' ? 'AI Calls' : 'WhatsApp'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Requested by <strong>{item.requestedByName}</strong> ({item.requestedByEmail}) ·{' '}
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </div>
                    {item.note && (
                      <div className="text-xs text-slate-700 dark:text-slate-200 mt-1.5 italic">
                        &ldquo;{item.note}&rdquo;
                      </div>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                      item.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : item.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {item.status === 'approved' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : item.status === 'rejected' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {item.status}
                  </span>
                </div>

                {isPending ? (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Grant Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={grantVal}
                        onChange={(e) =>
                          setGrantAmounts((p) => ({
                            ...p,
                            [item.id]: Math.max(1, Number(e.target.value) || 0),
                          }))
                        }
                        className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Pack Price ₹
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={priceVal}
                        onChange={(e) =>
                          setPrices((p) => ({
                            ...p,
                            [item.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        Audit / Resolution Note
                      </label>
                      <input
                        type="text"
                        value={noteVal}
                        onChange={(e) =>
                          setNotes((p) => ({ ...p, [item.id]: e.target.value }))
                        }
                        placeholder="Optional note..."
                        className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 pb-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={issueInv}
                        onChange={(e) =>
                          setIssueInvoices((p) => ({
                            ...p,
                            [item.id]: e.target.checked,
                          }))
                        }
                      />
                      <span>18% GST Invoice</span>
                    </label>
                    <div className="sm:col-span-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleResolve(item, 'approve')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
                      >
                        Approve &amp; Grant
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleResolve(item, 'reject')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 text-xs font-extrabold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Resolved by {item.resolvedByEmail || 'HQ'} ·{' '}
                    {item.grantedQuantity > 0
                      ? `Granted +${item.grantedQuantity.toLocaleString('en-IN')}`
                      : 'No units granted'}
                    {item.resolutionNote ? ` · "${item.resolutionNote}"` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

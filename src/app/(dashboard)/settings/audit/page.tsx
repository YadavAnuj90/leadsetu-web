'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Search,
  Loader2,
  FileClock,
  Users,
  EyeOff,
  Download,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAuditLogsApi,
  updateSecuritySettingsApi,
} from '@/lib/audit-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type {
  AuditEntityType,
  AuditLogEntry,
  SecuritySettings,
} from '@/types/contracts';

const ENTITY_PILLS: Record<AuditEntityType, string> = {
  security:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  team: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  lead: 'bg-blue-50 text-brand-blue border-blue-200 dark:bg-blue-950/60 dark:text-sky-300 dark:border-blue-800',
  deal: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  contact:
    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
  invoice:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  ticket:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
};

export default function AuditSecurityPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    securityEvents: 0,
    teamEvents: 0,
    revenueEvents: 0,
  });

  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogsApi({
        entityType: entityFilter,
        search: search.trim() || undefined,
        limit: 80,
      });
      setSecurity(res.security);
      setLogs(res.data || []);
      setStats(res.stats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [entityFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSetting = async (
    key: 'maskPhoneForAgents' | 'blockAgentExport',
    nextVal: boolean,
  ) => {
    setSavingKey(key);
    setError(null);
    try {
      const updated = await updateSecuritySettingsApi({ [key]: nextVal });
      setSecurity(updated);
      setToast(
        key === 'maskPhoneForAgents'
          ? `Agent phone masking ${nextVal ? 'enabled' : 'disabled'} (+91 98*** **678).`
          : `Agent bulk export restriction ${nextVal ? 'enabled' : 'disabled'}.`,
      );
      setTimeout(() => setToast(null), 3500);
      await Promise.all([loadData(), refreshProfile()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
        </button>

        <Link
          href="/settings/team"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-xs font-bold text-brand-navy hover:border-brand-blue transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-brand-blue" /> Manage Per-User
          Masking in Team
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Anti-Data-Leak Shield &amp;
            Compliance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Security, Phone Masking &amp; Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Protect Indian buyer mobile numbers from employee attrition and review
            every immutable CRM write action.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-brand-navy hover:border-brand-blue transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Trail
        </button>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {toast}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Anti-Data-Leak Shield Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-brand-navy">
                  Mask Client Phone Numbers for Agents
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Automatically hides full 10-digit buyer mobile numbers across
                  Leads, B2B Directory, Deals, Invoices &amp; Inbox for junior{' '}
                  <strong>Agent</strong> accounts.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!security?.canEditSecurity || savingKey === 'maskPhoneForAgents'}
              onClick={() =>
                toggleSetting(
                  'maskPhoneForAgents',
                  !security?.maskPhoneForAgents,
                )
              }
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 ${
                security?.maskPhoneForAgents
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } disabled:opacity-60`}
            >
              {savingKey === 'maskPhoneForAgents'
                ? 'Saving...'
                : security?.maskPhoneForAgents
                  ? 'Shield ON'
                  : 'Shield OFF'}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Live Agent Display Preview:
            </span>
            <span className="font-mono font-bold text-brand-navy">
              {security?.maskPhoneForAgents
                ? '+91 98*** **678'
                : '+91 98112 45678'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-brand-navy">
                  Block CSV / Excel Bulk Export for Agents
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Prevents non-admin sales executives from exporting full buyer
                  databases when leaving your company.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!security?.canEditSecurity || savingKey === 'blockAgentExport'}
              onClick={() =>
                toggleSetting('blockAgentExport', !security?.blockAgentExport)
              }
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 ${
                security?.blockAgentExport
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } disabled:opacity-60`}
            >
              {savingKey === 'blockAgentExport'
                ? 'Saving...'
                : security?.blockAgentExport
                  ? 'Blocked'
                  : 'Allowed'}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Your Current Session Status:
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-brand-navy">
              {security?.viewerMasked ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  Masked View Active
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  Unmasked Admin View (Acct #{security?.accountId || '—'})
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Audit Events', value: stats.total },
          { label: 'Security Changes', value: stats.securityEvents },
          { label: 'Team RBAC Events', value: stats.teamEvents },
          { label: 'Lead / Deal / GST Events', value: stats.revenueEvents },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {card.label}
            </div>
            <div className="text-2xl font-extrabold text-brand-navy mt-1.5">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Audit Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'All Events'],
                ['security', 'Security'],
                ['team', 'Team'],
                ['lead', 'Leads'],
                ['deal', 'Deals'],
                ['invoice', 'GST Invoices'],
                ['ticket', 'SLA Tickets'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setEntityFilter(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  entityFilter === val
                    ? 'bg-brand-blue text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, user ID, summary..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            <span>Loading immutable audit log...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileClock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-brand-navy">
              No audit events recorded yet
            </p>
            <p className="text-xs text-slate-400">
              Actions like adding team members, changing deal stages, marking GST
              invoices paid, or toggling phone masking will appear here
              automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Actor &amp; UID</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-5">Immutable Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-500">
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-brand-navy">
                        {entry.actorName}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {entry.actorRole}
                        {entry.actorUserCode
                          ? ` · UID #${entry.actorUserCode}`
                          : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          ENTITY_PILLS[entry.entityType] || ENTITY_PILLS.lead
                        }`}
                      >
                        {entry.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {entry.action}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-brand-navy">
                        {entry.summary}
                      </div>
                      {entry.entityLabel && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Target: {entry.entityLabel}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

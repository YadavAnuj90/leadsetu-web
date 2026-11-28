'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react';
import {
  executeChurnRescueApi,
  fetchOnboardingFunnelApi,
  provisionWorkspaceApi,
  type OnboardingFunnelTenantRow,
  type ProvisionWorkspaceResponse,
  type SuperAdminOnboardingFunnelResponse,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

export default function OnboardingFunnelSection({
  onInspectTenant,
  onWorkspaceMutated,
}: {
  onInspectTenant: (tenantId: string) => void;
  onWorkspaceMutated: () => Promise<void> | void;
}) {
  const [funnel, setFunnel] = useState<SuperAdminOnboardingFunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Provision Workspace Form
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [businessMode, setBusinessMode] = useState<
    'b2b' | 'msme' | 'b2c' | 'hybrid' | 'bpo' | 'education'
  >('b2b');
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [status, setStatus] = useState<'trial' | 'active'>('trial');
  const [trialDays, setTrialDays] = useState('14');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [seatLimitOverride, setSeatLimitOverride] = useState('');
  const [managerNote, setManagerNote] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [provisionReceipt, setProvisionReceipt] =
    useState<ProvisionWorkspaceResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Churn Rescue Queue state
  const [queueTab, setQueueTab] = useState<'expiring' | 'dormant' | 'recent'>('expiring');
  const [rescuingKey, setRescuingKey] = useState<string | null>(null);

  const loadFunnel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOnboardingFunnelApi({ expiringWithinDays: 3, dormantDays: 7 });
      setFunnel(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFunnel();
  }, [loadFunnel]);

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(key);
    setTimeout(() => setCopiedId((cur) => (cur === key ? null : cur)), 1800);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    setError(null);
    setNotice(null);
    try {
      const receipt = await provisionWorkspaceApi({
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ...(ownerPassword.trim() ? { ownerPassword: ownerPassword.trim() } : {}),
        ...(ownerPhone.trim() ? { ownerPhone: ownerPhone.trim() } : {}),
        businessMode,
        plan,
        status,
        trialDays: Number(trialDays) || 14,
        city: city.trim() || '',
        ...(gstin.trim() ? { gstin: gstin.trim().toUpperCase() } : {}),
        ...(seatLimitOverride ? { seatLimitOverride: Number(seatLimitOverride) } : {}),
        ...(managerNote.trim() ? { assignedManagerNote: managerNote.trim() } : {}),
      });
      setProvisionReceipt(receipt);
      setNotice(
        `Provisioned "${receipt.companyName}" (#${receipt.accountId}) on ${receipt.plan.toUpperCase()} for ${receipt.owner.email}.`,
      );
      setCompanyName('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
      setOwnerPhone('');
      setGstin('');
      setManagerNote('');
      await Promise.all([loadFunnel(), onWorkspaceMutated()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProvisioning(false);
    }
  };

  const handleRescue = async (
    row: OnboardingFunnelTenantRow,
    action: 'extend_trial_7d' | 'extend_trial_14d' | 'activate_promo_growth' | 'mark_outreach_sent',
  ) => {
    const busyKey = `${row.tenantId}:${action}`;
    setRescuingKey(busyKey);
    setError(null);
    setNotice(null);
    try {
      const res = await executeChurnRescueApi(row.tenantId, { action });
      setNotice(res.summary);
      await Promise.all([loadFunnel(), onWorkspaceMutated()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRescuingKey(null);
    }
  };

  const s = funnel?.summary;
  const activeRows: OnboardingFunnelTenantRow[] =
    queueTab === 'expiring'
      ? funnel?.expiringTrials || []
      : queueTab === 'dormant'
        ? funnel?.dormantWorkspaces || []
        : funnel?.recentProvisioned || [];

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Expiring / Expired Trials</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
            {(s?.expiringSoonCount ?? 0) + (s?.expiredTrialsCount ?? 0)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {s?.expiringSoonCount ?? 0} within 3d · {s?.expiredTrialsCount ?? 0} expired
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Dormant / Zero-Lead</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">
            {s?.dormantActiveCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            7+ days inactive or empty pipeline
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>At-Risk / Pipeline MRR</span>
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {formatINR(s?.totalAtRiskMrrInr ?? 0)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Recoverable monthly SaaS revenue
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Active Paid vs Trial</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {s?.activePaidCount ?? 0} / {s?.trialCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {s?.totalWorkspaces ?? 0} client workspaces
          </div>
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* White-Glove 1-Click Workspace Provisioner + Instant Credentials Receipt */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={handleProvisionSubmit}
          className="xl:col-span-7 rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-cyan-400">
                <Rocket className="w-3.5 h-3.5" />
                <span>White-Glove Enterprise &amp; Agency Provisioning</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                1-Click Client Workspace Creator
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Clean Workspace (Pipeline Ready · Zero Dummy Records)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Company / Workspace Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Bharat Switchgears Pvt. Ltd."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Owner Full Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Owner Work Email *
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="founder@bharatswitchgears.in"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Temp Password (Blank = Auto-Generate)
              </label>
              <input
                type="text"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Auto-generated securely if empty"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Business Segment
              </label>
              <select
                value={businessMode}
                onChange={(e) =>
                  setBusinessMode(
                    e.target.value as
                      | 'b2b'
                      | 'msme'
                      | 'b2c'
                      | 'hybrid'
                      | 'bpo'
                      | 'education',
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="b2b">B2B &amp; Dealers</option>
                <option value="msme">MSME / Trader</option>
                <option value="b2c">B2C / D2C Store</option>
                <option value="education">Education / Coaching</option>
                <option value="bpo">BPO / Call Desk</option>
                <option value="hybrid">Hybrid B2B+B2C</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Plan Tier
              </label>
              <select
                value={plan}
                onChange={(e) =>
                  setPlan(e.target.value as 'starter' | 'growth' | 'enterprise')
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="starter">Starter (₹999/mo)</option>
                <option value="growth">Growth (₹2,399/mo)</option>
                <option value="enterprise">Enterprise (₹5,499/mo)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'trial' | 'active')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="trial">Trial Workspace</option>
                <option value="active">Active Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {status === 'trial' ? 'Trial Days' : 'Seat Cap (Opt.)'}
              </label>
              {status === 'trial' ? (
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              ) : (
                <input
                  type="number"
                  min={1}
                  value={seatLimitOverride}
                  onChange={(e) => setSeatLimitOverride(e.target.value)}
                  placeholder="Default"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City Hub (e.g. Noida)"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={gstin}
              maxLength={15}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="15-char GSTIN (Optional)"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono uppercase text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="Owner Phone (+91...)"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <input
              type="text"
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              placeholder="HQ Onboarding Note (optional)"
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={provisioning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {provisioning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Provision Client Workspace</span>
            </button>
          </div>
        </form>

        {/* Right: Provisioning Credentials Receipt & Welcome Copy */}
        <div className="xl:col-span-5 rounded-3xl p-6 bg-slate-900 text-white border border-slate-800 shadow-lg flex flex-col justify-between space-y-4">
          {provisionReceipt ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-[11px] font-extrabold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Workspace Ready!
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    #{provisionReceipt.accountId}
                  </span>
                </div>

                <h3 className="text-lg font-black">{provisionReceipt.companyName}</h3>
                <p className="text-xs text-slate-300">
                  Segment:{' '}
                  <strong className="uppercase text-white">
                    {provisionReceipt.businessMode}
                  </strong>{' '}
                  · Plan:{' '}
                  <strong className="uppercase text-white">{provisionReceipt.plan}</strong> ·
                  Seeded: {provisionReceipt.seededCounts.leads} leads,{' '}
                  {provisionReceipt.seededCounts.deals} deals,{' '}
                  {provisionReceipt.seededCounts.invoices} GST invoice
                </p>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Owner Email:</span>
                    <span className="text-white">{provisionReceipt.owner.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Temp Password:</span>
                    <span className="text-emerald-300 font-bold">
                      {provisionReceipt.owner.tempPassword}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  {provisionReceipt.onboardingChecklist.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'welcome',
                      `Welcome to Leadsetu AI CRM!\nWorkspace: ${provisionReceipt.companyName} (#${provisionReceipt.accountId})\nLogin Email: ${provisionReceipt.owner.email}\nTemp Password: ${provisionReceipt.owner.tempPassword}\n\nNext steps:\n${provisionReceipt.onboardingChecklist.join('\n')}`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                >
                  {copiedId === 'welcome' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedId === 'welcome'
                      ? 'Copied Welcome Kit!'
                      : 'Copy Client Welcome Kit'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onInspectTenant(provisionReceipt.tenantId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0057FF] hover:bg-blue-600 text-xs font-bold"
                >
                  <span>Govern Workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="my-auto py-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                Instant White-Glove Credentials &amp; Seeded CRM
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Provision a pre-configured tenant for customer pilots, channel partners, or demos in 1 click — complete with segment pipeline stages, starter deals, GST invoice sample, and copyable client welcome credentials.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trial Expiry & Dormancy Churn Rescue Console */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Trial Expiry &amp; Dormancy Churn Rescue Queue</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extend expiring trials in 1 click, convert stuck pilots to promo Growth, or copy personalized founder outreach checklists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['expiring', `Expiring Trials (${funnel?.expiringTrials.length ?? 0})`],
                ['dormant', `Dormant / At-Risk (${funnel?.dormantWorkspaces.length ?? 0})`],
                ['recent', `All Workspaces (${funnel?.recentProvisioned.length ?? 0})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setQueueTab(id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  queueTab === id
                    ? 'bg-slate-900 dark:bg-[#0057FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadFunnel()}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0057FF]"
              title="Refresh Funnel"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {activeRows.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No workspaces matching this churn rescue filter right now.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Workspace &amp; Owner</th>
                  <th className="py-2.5 px-4">Segment / Plan</th>
                  <th className="py-2.5 px-4">Adoption</th>
                  <th className="py-2.5 px-4">Trial / Inactivity</th>
                  <th className="py-2.5 px-4 text-right">1-Click Churn Rescue Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activeRows.map((row) => (
                  <tr
                    key={row.tenantId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {row.companyName}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          #{row.accountId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.ownerName} ({row.ownerEmail}) · {row.city}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold uppercase text-slate-800 dark:text-slate-100">
                        {row.businessMode} · {row.plan}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {row.usersCount} seats · {row.leadsCount} leads · {row.dealsCount} deals
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {row.onboardingScore}% Setup
                      </div>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.onboardingScore >= 70
                              ? 'bg-emerald-500'
                              : row.onboardingScore >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, row.onboardingScore)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {row.status === 'trial' && row.daysRemaining !== null ? (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            row.isExpired
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                              : row.daysRemaining <= 3
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {row.isExpired
                            ? `Expired (${Math.abs(row.daysRemaining)}d ago)`
                            : `${row.daysRemaining}d left`}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-[#0057FF] dark:text-sky-300">
                          {row.status}
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Inactive: {row.daysInactive}d
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        disabled={rescuingKey !== null}
                        onClick={() => void handleRescue(row, 'extend_trial_7d')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300/70 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        {rescuingKey === `${row.tenantId}:extend_trial_7d` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>+7d Trial</span>
                      </button>

                      <button
                        type="button"
                        disabled={rescuingKey !== null}
                        onClick={() => void handleRescue(row, 'activate_promo_growth')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {rescuingKey === `${row.tenantId}:activate_promo_growth` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Gift className="w-3 h-3" />
                        )}
                        <span>Promo Growth</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            `chk-${row.tenantId}`,
                            `Hi ${row.ownerName}, quick check-in from Leadsetu HQ for ${row.companyName} (#${row.accountId}). Your workspace setup is ${row.onboardingScore}% complete — let's activate WhatsApp Cloud & IndiaMART Sync together!`,
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-[#0057FF]"
                      >
                        {copiedId === `chk-${row.tenantId}` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Pitch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectTenant(row.tenantId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0057FF] text-white text-[11px] font-bold hover:bg-blue-700"
                      >
                        <span>Govern</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
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

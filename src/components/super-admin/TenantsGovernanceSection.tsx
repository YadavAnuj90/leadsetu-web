'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  Sparkles,
  Lock,
  Loader2,
  X,
  CheckCircle2,
  LogIn,
  SlidersHorizontal,
  Ban,
  Save,
  RotateCcw,
  KeyRound,
  UserCheck,
  UserX,
  EyeOff,
  Download,
  Trash2,
} from 'lucide-react';
import {
  bulkManageAiAuthorityApi,
  dpdpEraseTenantApi,
  exportTenantDpdpDataApi,
  fetchSuperAdminTenantDetailApi,
  grantTenantQuotaAddonApi,
  impersonateTenantApi,
  issueTenantSubscriptionApi,
  manageTenantAiAuthorityApi,
  revokeAllTenantSessionsApi,
  updateSubscriptionInvoiceStatusApi,
  updateTenantGovernanceApi,
  updateTenantUserRbacApi,
  type ManageAiAuthorityPayload,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  PlatformFeatureKey,
  SuperAdminTenantDetailResponse,
  SuperAdminTenantItem,
} from '@/types/contracts';

function formatINR(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export default function TenantsGovernanceSection({
  tenants,
  selectedTenantId,
  onSelectTenant,
  onRefreshTenants,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
}: {
  tenants: SuperAdminTenantItem[];
  selectedTenantId: string | null;
  onSelectTenant: (id: string | null) => void;
  onRefreshTenants: () => Promise<void>;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  planFilter: string;
  onPlanFilterChange: (v: string) => void;
}) {
  const router = useRouter();
  const { startImpersonation } = useAuthStore();

  const [detail, setDetail] = useState<SuperAdminTenantDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerTab, setDrawerTab] = useState<
    'lifecycle' | 'features' | 'quotas' | 'security' | 'users'
  >('lifecycle');

  // Governance form states
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [status, setStatus] = useState<'trial' | 'active' | 'suspended'>('trial');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [seatOverride, setSeatOverride] = useState('');
  const [managerNote, setManagerNote] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [aiQuota, setAiQuota] = useState(5000);
  const [aiUsedInput, setAiUsedInput] = useState(0);
  const [aiDeltaInput, setAiDeltaInput] = useState(1000);
  const [bulkAiAmount, setBulkAiAmount] = useState(1000);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkStatusMsg, setBulkStatusMsg] = useState<string | null>(null);
  const [bulkErrorMsg, setBulkErrorMsg] = useState<string | null>(null);
  const [waQuota, setWaQuota] = useState(10000);
  const [storageQuota, setStorageQuota] = useState(2048);
  const [enforceMasking, setEnforceMasking] = useState(false);
  const [lockExport, setLockExport] = useState(true);
  const [requireStrongPwd, setRequireStrongPwd] = useState(true);
  const [sessionTtl, setSessionTtl] = useState(24);
  const [allowImpersonation, setAllowImpersonation] = useState(true);
  const [ipAllowlistText, setIpAllowlistText] = useState('');

  const [saving, setSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerToast, setDrawerToast] = useState<string | null>(null);

  // Quick SaaS Billing Action state inside Drawer
  const [drawerGrantCycle, setDrawerGrantCycle] = useState<'monthly' | 'annual'>('monthly');
  const [drawerGrantMode, setDrawerGrantMode] = useState<'paid_offline' | 'complimentary_grant'>('paid_offline');
  const [drawerGrantRef, setDrawerGrantRef] = useState('');
  const [drawerBillingBusy, setDrawerBillingBusy] = useState(false);

  // Destructive confirm, Add-On Quota & DPDP state
  const [suspendConfirmPwd, setSuspendConfirmPwd] = useState('');
  const [addonAi, setAddonAi] = useState(2500);
  const [addonWa, setAddonWa] = useState(5000);
  const [addonMb, setAddonMb] = useState(0);
  const [addonPrice, setAddonPrice] = useState(0);
  const [addonIssueInvoice, setAddonIssueInvoice] = useState(false);
  const [panicReason, setPanicReason] = useState('');
  const [panicPassword, setPanicPassword] = useState('');
  const [dpdpReason, setDpdpReason] = useState('');
  const [dpdpPassword, setDpdpPassword] = useState('');
  const [dpdpBypassRetention, setDpdpBypassRetention] = useState(false);
  const [dpdpBusy, setDpdpBusy] = useState(false);

  // Support Impersonation Modal
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [impersonateBusy, setImpersonateBusy] = useState(false);

  const syncFromDetail = (res: SuperAdminTenantDetailResponse) => {
    setDetail(res);
    const t = res.tenant;
    setPlan(t.plan);
    setStatus(t.status);
    setSuspensionReason(t.securityPolicy.suspensionReason || '');
    setSeatOverride(t.seatLimitOverride ? String(t.seatLimitOverride) : '');
    setManagerNote(t.assignedManagerNote || '');
    setAiQuota(t.quotas.maxMonthlyAiCalls);
    setAiUsedInput(t.quotas.aiCallsUsed);
    setWaQuota(t.quotas.maxMonthlyWhatsapp);
    setStorageQuota(t.quotas.maxStorageMb);
    setEnforceMasking(t.securityPolicy.enforcePhoneMasking);
    setLockExport(t.securityPolicy.lockAgentExport);
    setRequireStrongPwd(t.securityPolicy.requireStrongPassword);
    setSessionTtl(t.securityPolicy.sessionTtlHours);
    setAllowImpersonation(t.securityPolicy.allowImpersonation);
    setIpAllowlistText((t.securityPolicy.ipAllowlist || []).join(', '));
  };

  useEffect(() => {
    if (!selectedTenantId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setDrawerError(null);
    fetchSuperAdminTenantDetailApi(selectedTenantId)
      .then((res) => {
        if (!cancelled) syncFromDetail(res);
      })
      .catch((err) => {
        if (!cancelled) setDrawerError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTenantId]);

  const showToast = (msg: string) => {
    setDrawerToast(msg);
    setTimeout(() => setDrawerToast(null), 3500);
  };

  const handleSaveLifecycle = async (extendTrialDays?: number) => {
    if (!selectedTenantId) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const updated = await updateTenantGovernanceApi(selectedTenantId, {
        plan,
        status,
        suspensionReason: status === 'suspended' ? suspensionReason.trim() : undefined,
        confirmPassword: status === 'suspended' ? suspendConfirmPwd : undefined,
        seatLimitOverride: seatOverride.trim() ? Number(seatOverride) : null,
        extendTrialDays,
        assignedManagerNote: managerNote,
        reason: auditReason.trim() || 'Tenant lifecycle updated by HQ',
      });
      syncFromDetail(updated);
      setAuditReason('');
      setSuspendConfirmPwd('');
      await onRefreshTenants();
      showToast(
        extendTrialDays
          ? `Extended workspace trial by +${extendTrialDays} days.`
          : 'Tenant lifecycle & plan authority updated.'
      );
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureOverride = async (
    key: PlatformFeatureKey,
    val: boolean | null
  ) => {
    if (!selectedTenantId) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const updated = await updateTenantGovernanceApi(selectedTenantId, {
        featureOverrides: { [key]: val },
        reason: `Feature ${key} set to ${val === null ? 'Plan Default' : val ? 'FORCED ON' : 'FORCED OFF'}`,
      });
      syncFromDetail(updated);
      await onRefreshTenants();
      showToast(`Module override updated for ${key}.`);
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuotas = async (resetUsageCounters = false) => {
    if (!selectedTenantId) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const updated = await updateTenantGovernanceApi(selectedTenantId, {
        quotas: {
          maxMonthlyAiCalls: aiQuota,
          aiCallsUsed: resetUsageCounters ? 0 : aiUsedInput,
          maxMonthlyWhatsapp: waQuota,
          maxStorageMb: storageQuota,
          resetUsageCounters,
        },
        reason: resetUsageCounters
          ? 'Monthly usage counters reset by Super Admin'
          : 'Monthly quotas updated',
      });
      syncFromDetail(updated);
      await onRefreshTenants();
      showToast(
        resetUsageCounters ? 'Usage counters reset to 0.' : 'Tenant quotas & AI usage saved.'
      );
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDrawerAiAuthority = async (
    payload: ManageAiAuthorityPayload,
    okMsg: string
  ) => {
    if (!selectedTenantId) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const updated = await manageTenantAiAuthorityApi(selectedTenantId, payload);
      syncFromDetail(updated);
      await onRefreshTenants();
      showToast(okMsg);
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRowAiAuthority = async (
    tenantId: string,
    payload: ManageAiAuthorityPayload,
    okMsg: string
  ) => {
    setBulkBusy(true);
    setBulkErrorMsg(null);
    setBulkStatusMsg(null);
    try {
      const updated = await manageTenantAiAuthorityApi(tenantId, payload);
      if (selectedTenantId === tenantId) {
        syncFromDetail(updated);
      }
      await onRefreshTenants();
      setBulkStatusMsg(okMsg);
      setTimeout(() => setBulkStatusMsg(null), 3500);
    } catch (err) {
      setBulkErrorMsg(getErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkAiAuthority = async (
    payload: ManageAiAuthorityPayload & { tenantIds?: string[] },
    okMsg: string
  ) => {
    setBulkBusy(true);
    setBulkErrorMsg(null);
    setBulkStatusMsg(null);
    try {
      const targetIds = tenants.map((t) => t.id);
      const res = await bulkManageAiAuthorityApi({
        ...payload,
        ...(targetIds.length > 0 ? { tenantIds: targetIds } : {}),
      });
      if (selectedTenantId) {
        const refreshed = await fetchSuperAdminTenantDetailApi(selectedTenantId);
        syncFromDetail(refreshed);
      }
      await onRefreshTenants();
      setBulkStatusMsg(`${okMsg} (${res.updatedCount} Admin account(s) updated)`);
      setTimeout(() => setBulkStatusMsg(null), 4000);
    } catch (err) {
      setBulkErrorMsg(getErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!selectedTenantId) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const updated = await updateTenantGovernanceApi(selectedTenantId, {
        securityPolicy: {
          enforcePhoneMasking: enforceMasking,
          lockAgentExport: lockExport,
          requireStrongPassword: requireStrongPwd,
          sessionTtlHours: sessionTtl,
          allowImpersonation,
          ipAllowlist: ipAllowlistText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        reason: 'Tenant security & compliance shields updated by Super Admin',
      });
      syncFromDetail(updated);
      await onRefreshTenants();
      showToast('Tenant security shield & IP policy enforced.');
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUserRbacUpdate = async (
    userId: string,
    payload: {
      role?: 'owner' | 'admin' | 'manager' | 'agent' | 'support';
      departmentPreset?: string;
      isActive?: boolean;
      maskPhones?: boolean;
      revokeSessions?: boolean;
      reason?: string;
    }
  ) => {
    if (!selectedTenantId) return;
    setSaving(true);
    setDrawerError(null);
    try {
      const updated = await updateTenantUserRbacApi(
        selectedTenantId,
        userId,
        payload
      );
      syncFromDetail(updated);
      await onRefreshTenants();
      showToast('Member RBAC authority updated.');
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmImpersonate = async () => {
    if (!selectedTenantId || impersonateReason.trim().length < 5) {
      setDrawerError('Enter at least 5 characters explaining the support reason.');
      return;
    }
    setImpersonateBusy(true);
    setDrawerError(null);
    try {
      const res = await impersonateTenantApi(selectedTenantId, {
        reason: impersonateReason.trim(),
      });
      startImpersonation({
        targetUser: res.user,
        targetTenant: res.tenant,
        targetAccessToken: res.accessToken,
        actorEmail: res.impersonation.actorEmail,
        reason: res.impersonation.reason,
        expiresInMinutes: res.impersonation.expiresInMinutes,
      });
      setImpersonateOpen(false);
      router.push('/dashboard');
    } catch (err) {
      setDrawerError(getErrorMessage(err));
    } finally {
      setImpersonateBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tenant company, 5-digit Account ID, GSTIN, email, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0057FF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Paid</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Bulk AI Balance & AI Feature Authority Bar (All Filtered Admin Accounts) */}
      <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-brand-blue/25 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0057FF]" />
              <span>Bulk AI Balance &amp; AI Feature Authority ({tenants.length} Admin Account{tenants.length === 1 ? '' : 's'})</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Assign, edit exact monthly caps, deduct/zero-out AI balance, or enable/remove AI features across all visible Admin accounts at once.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">AI Calls Amount</span>
            <input
              type="number"
              min={0}
              value={bulkAiAmount}
              onChange={(e) => setBulkAiAmount(Math.max(0, Number(e.target.value) || 0))}
              className="w-28 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={bulkBusy || tenants.length === 0}
            onClick={() =>
              handleBulkAiAuthority(
                {
                  mode: 'assign_balance',
                  aiCallsDelta: bulkAiAmount,
                  aiScoring: true,
                  reason: `Super Admin bulk assigned +${bulkAiAmount} AI calls`,
                },
                `Assigned +${bulkAiAmount.toLocaleString('en-IN')} AI calls & enabled AI`,
              )
            }
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold disabled:opacity-50"
          >
            + Assign AI Balance to All
          </button>

          <button
            type="button"
            disabled={bulkBusy || tenants.length === 0}
            onClick={() =>
              handleBulkAiAuthority(
                {
                  mode: 'set_balance',
                  maxMonthlyAiCalls: bulkAiAmount,
                  reason: `Super Admin set monthly AI cap to ${bulkAiAmount} for all accounts`,
                },
                `Edited monthly AI cap to ${bulkAiAmount.toLocaleString('en-IN')}`,
              )
            }
            className="px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-[11px] font-extrabold disabled:opacity-50"
          >
            Edit Exact Cap ({bulkAiAmount}) for All
          </button>

          <button
            type="button"
            disabled={bulkBusy || tenants.length === 0}
            onClick={() =>
              handleBulkAiAuthority(
                {
                  mode: 'remove_balance',
                  aiCallsDelta: bulkAiAmount,
                  reason: `Super Admin deducted ${bulkAiAmount} AI calls from accounts`,
                },
                `Removed ${bulkAiAmount.toLocaleString('en-IN')} AI calls`,
              )
            }
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold disabled:opacity-50"
          >
            - Deduct AI Balance
          </button>

          <button
            type="button"
            disabled={bulkBusy || tenants.length === 0}
            onClick={() =>
              handleBulkAiAuthority(
                {
                  mode: 'remove_balance',
                  maxMonthlyAiCalls: 0,
                  reason: 'Super Admin removed all AI balance across filtered accounts',
                },
                'Zeroed out AI balance (0 cap)',
              )
            }
            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[11px] font-extrabold disabled:opacity-50"
          >
            Zero-Out (0) AI Balance for All
          </button>

          <span className="hidden sm:inline-block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            disabled={bulkBusy || tenants.length === 0}
            onClick={() =>
              handleBulkAiAuthority(
                {
                  mode: 'update_features',
                  aiScoring: true,
                  aiWorkflows: true,
                  aiCreditRisk: true,
                  aiVoiceCrm: true,
                  aiDealerDesk: true,
                  aiCopilot: true,
                  reason: 'Super Admin assigned all AI features & 4 pillars ON',
                },
                'Assigned all AI features & pillars ON',
              )
            }
            className="px-3 py-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-[11px] font-extrabold disabled:opacity-50"
          >
            Assign AI Features (ON) All
          </button>

          <button
            type="button"
            disabled={bulkBusy || tenants.length === 0}
            onClick={() =>
              handleBulkAiAuthority(
                {
                  mode: 'update_features',
                  aiScoring: false,
                  aiWorkflows: false,
                  aiCreditRisk: false,
                  aiVoiceCrm: false,
                  aiDealerDesk: false,
                  aiCopilot: false,
                  reason: 'Super Admin removed all AI features & 4 pillars across accounts',
                },
                'Removed all AI features & pillars OFF',
              )
            }
            className="px-3 py-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-600 hover:text-white text-[11px] font-extrabold disabled:opacity-50"
          >
            Remove AI Features (OFF) All
          </button>
        </div>

        {bulkStatusMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {bulkStatusMsg}
          </div>
        )}
        {bulkErrorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300">
            {bulkErrorMsg}
          </div>
        )}
      </div>

      {/* Tenants Governance Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Workspace &amp; Account ID</th>
                <th className="py-3.5 px-3">Plan &amp; Status</th>
                <th className="py-3.5 px-3">Seats</th>
                <th className="py-3.5 px-3">CRM Usage &amp; Won</th>
                <th className="py-3.5 px-3">AI Balance &amp; Features</th>
                <th className="py-3.5 px-3">Security &amp; Overrides</th>
                <th className="py-3.5 px-4 text-right">Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tenants.map((t) => (
                <tr
                  key={t.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors ${
                    selectedTenantId === t.id ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          #{t.accountId || '-----'} · {t.city}
                          {t.gstin ? ` · ${t.gstin}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-sky-300 font-extrabold uppercase text-[10px]">
                        {t.plan}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-extrabold uppercase text-[10px] ${
                          t.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : t.status === 'suspended'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {t.seatsUsed} / {t.seatLimit}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {t.activeUsers} active{t.seatLimitOverride ? ' · custom cap' : ''}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {t.leadsCount} Leads · {t.dealsCount} Deals
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Won: {formatINR(t.wonRevenueInr)}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={bulkBusy}
                        onClick={() =>
                          handleRowAiAuthority(
                            t.id,
                            {
                              mode: 'update_features',
                              aiScoring: !(t.aiEnabled ?? true),
                              aiWorkflows: !(t.aiEnabled ?? true),
                              reason: `Super Admin toggled AI feature ${(t.aiEnabled ?? true) ? 'OFF' : 'ON'} for ${t.name}`,
                            },
                            `${t.name}: AI features ${(t.aiEnabled ?? true) ? 'Removed (OFF)' : 'Assigned (ON)'}`,
                          )
                        }
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-colors ${
                          t.aiEnabled ?? true
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-500'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30 hover:bg-emerald-500/15 hover:text-emerald-500'
                        }`}
                        title="Click to Assign or Remove AI Features for this Admin account"
                      >
                        {t.aiEnabled ?? true ? 'AI Active' : 'AI Removed'}
                      </button>
                      <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                        {(t.aiBalanceRemaining ?? 0).toLocaleString('en-IN')} / {(t.maxMonthlyAiCalls ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {t.aiPillars && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {(
                          [
                            ['P1', t.aiPillars.aiCreditRisk, 'Pillar 1 · Credit & Udhaar AI'],
                            ['P2', t.aiPillars.aiVoiceCrm, 'Pillar 2 · Voice-to-CRM & Call Audit'],
                            ['P3', t.aiPillars.aiDealerDesk, 'Pillar 3 · Dealer RFQ & Beat Planner'],
                            ['Ask', t.aiPillars.aiCopilot, 'Ask AI · Tenant RAG Copilot'],
                          ] as const
                        ).map(([tag, on, tip]) => (
                          <span
                            key={tag}
                            title={`${tip}: ${on ? 'ON' : 'OFF'}`}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              on
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400 line-through'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <button
                        type="button"
                        disabled={bulkBusy}
                        onClick={() =>
                          handleRowAiAuthority(
                            t.id,
                            {
                              mode: 'assign_balance',
                              aiCallsDelta: 1000,
                              aiScoring: true,
                              reason: `Quick +1,000 AI calls assigned to ${t.name}`,
                            },
                            `Added +1,000 AI calls to ${t.name}`,
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold hover:bg-emerald-600 hover:text-white"
                      >
                        +1K AI
                      </button>
                      <button
                        type="button"
                        disabled={bulkBusy}
                        onClick={() =>
                          handleRowAiAuthority(
                            t.id,
                            {
                              mode: 'remove_balance',
                              aiCallsDelta: 1000,
                              reason: `Quick -1,000 AI calls deducted from ${t.name}`,
                            },
                            `Removed 1,000 AI calls from ${t.name}`,
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px] font-extrabold hover:bg-rose-600 hover:text-white"
                      >
                        -1K AI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerTab('quotas');
                          onSelectTenant(t.id);
                        }}
                        className="px-1.5 py-0.5 rounded bg-blue-500/15 text-[#0057FF] dark:text-sky-300 text-[10px] font-extrabold hover:bg-[#0057FF] hover:text-white"
                      >
                        Edit AI
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.maskPhoneForAgents
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {t.maskPhoneForAgents ? 'Phones Masked' : 'Unmasked'}
                      </span>
                      {t.overrideCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                          {t.overrideCount} Flag{t.overrideCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectTenant(t.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Inspect &amp; Govern</span>
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No customer workspaces match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Full Authority Inspector Drawer */}
      {selectedTenantId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0A1220] h-full overflow-y-auto shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Drawer Header */}
            <div className="sticky top-0 z-20 px-6 py-4 bg-white/95 dark:bg-[#0A1220]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-400">
                    Tenant Authority Drawer
                  </span>
                  {detail && (
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Account #{detail.tenant.accountId}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mt-0.5">
                  {detail ? detail.tenant.name : 'Loading Workspace...'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {detail && (
                  <button
                    type="button"
                    onClick={() => setImpersonateOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Support Login</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectTenant(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center p-12 text-xs font-bold text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0057FF]" />
                <span>Loading workspace telemetry, overrides &amp; RBAC roster...</span>
              </div>
            ) : detail ? (
              <div className="p-6 space-y-5 flex-1">
                {drawerError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300">
                    {drawerError}
                  </div>
                )}
                {drawerToast && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {drawerToast}
                  </div>
                )}

                {/* Drawer Summary Counters */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Seats</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {detail.usage.seatsUsed}/{detail.tenant.seatLimit}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Leads</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {detail.usage.leadsCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Deals</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {detail.usage.dealsCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Invoices</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {detail.usage.invoicesCount}
                    </div>
                  </div>
                </div>

                {/* Drawer Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {[
                    { id: 'lifecycle', label: 'Lifecycle & Plan', icon: Building2 },
                    { id: 'features', label: 'Module Overrides', icon: Sparkles },
                    { id: 'quotas', label: 'Quotas & Usage', icon: ShieldCheck },
                    { id: 'security', label: 'Security Policy', icon: Lock },
                    { id: 'users', label: `Team RBAC (${detail.members.length})`, icon: Users },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = drawerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDrawerTab(tab.id as typeof drawerTab)}
                        className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-white dark:bg-[#0D1628] text-[#0057FF] dark:text-sky-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: LIFECYCLE & PLAN */}
                {drawerTab === 'lifecycle' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Subscription Plan
                        </label>
                        <select
                          value={plan}
                          onChange={(e) =>
                            setPlan(e.target.value as 'starter' | 'growth' | 'enterprise')
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        >
                          <option value="starter">Starter (₹999/mo)</option>
                          <option value="growth">Growth (₹2,399/mo)</option>
                          <option value="enterprise">Enterprise (₹5,499/mo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Workspace Status
                        </label>
                        <select
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as 'trial' | 'active' | 'suspended')
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        >
                          <option value="trial">Trial</option>
                          <option value="active">Active (Paid)</option>
                          <option value="suspended">Suspended (Blocked)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Seat Cap Override (Blank = Plan)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={seatOverride}
                          onChange={(e) => setSeatOverride(e.target.value)}
                          placeholder={`Default (${detail.tenant.seatLimit})`}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>
                    </div>

                    {status === 'suspended' && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                        <label className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-300">
                          Mandatory Suspension Reason &amp; Two-Person Root Confirmation
                        </label>
                        <input
                          type="text"
                          value={suspensionReason}
                          onChange={(e) => setSuspensionReason(e.target.value)}
                          placeholder="e.g., Invoice overdue > 15 days or DPDP spam violation"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-800 text-xs"
                        />
                        <input
                          type="password"
                          value={suspendConfirmPwd}
                          onChange={(e) => setSuspendConfirmPwd(e.target.value)}
                          placeholder="Re-enter Super Admin password to authorize suspension *"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-800 text-xs font-bold"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500">Quick Trial Boost:</span>
                      {[7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveLifecycle(days)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold border border-amber-500/30"
                        >
                          +{days} Days Trial
                        </button>
                      ))}
                      {detail.tenant.trialEndsAt && (
                        <span className="text-[11px] text-slate-400">
                          Ends: {new Date(detail.tenant.trialEndsAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Internal HQ Account Manager Note
                      </label>
                      <textarea
                        rows={2}
                        value={managerNote}
                        onChange={(e) => setManagerNote(e.target.value)}
                        placeholder="VIP client remarks, GST exception notes, onboarding SLA..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Governance Audit Reason
                      </label>
                      <input
                        type="text"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Why are you applying this change?"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveLifecycle()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Apply Lifecycle &amp; Plan Authority</span>
                    </button>

                    {/* Direct SaaS Plan Upgrade / Complimentary Grant / Void & Refund */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        SaaS GST Invoice Actions (Issue Upgrade / Grant / Void / Refund)
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={drawerGrantCycle}
                            onChange={(e) =>
                              setDrawerGrantCycle(e.target.value as 'monthly' | 'annual')
                            }
                            className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                          >
                            <option value="monthly">Monthly Cycle</option>
                            <option value="annual">Annual Cycle</option>
                          </select>
                          <select
                            value={drawerGrantMode}
                            onChange={(e) =>
                              setDrawerGrantMode(
                                e.target.value as 'paid_offline' | 'complimentary_grant'
                              )
                            }
                            className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                          >
                            <option value="paid_offline">Paid Offline (NEFT)</option>
                            <option value="complimentary_grant">Complimentary Grant</option>
                          </select>
                          <input
                            type="text"
                            value={drawerGrantRef}
                            onChange={(e) => setDrawerGrantRef(e.target.value)}
                            placeholder="UTR / PO # (Optional)"
                            className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[11px]"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={drawerBillingBusy || !selectedTenantId}
                          onClick={async () => {
                            if (!selectedTenantId) return;
                            setDrawerBillingBusy(true);
                            setDrawerError(null);
                            try {
                              const issued = await issueTenantSubscriptionApi(
                                selectedTenantId,
                                {
                                  plan,
                                  billingCycle: drawerGrantCycle,
                                  grantMode: drawerGrantMode,
                                  paymentReference: drawerGrantRef.trim() || undefined,
                                  reason:
                                    auditReason.trim() ||
                                    `Drawer quick ${drawerGrantMode} for ${plan}`,
                                }
                              );
                              const refreshed = await fetchSuperAdminTenantDetailApi(
                                selectedTenantId
                              );
                              syncFromDetail(refreshed);
                              await onRefreshTenants();
                              setDrawerGrantRef('');
                              showToast(
                                `Issued ${issued.invoice.invoiceNumber} (${formatINR(issued.invoice.totalAmount)}).`
                              );
                            } catch (err) {
                              setDrawerError(getErrorMessage(err));
                            } finally {
                              setDrawerBillingBusy(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                        >
                          {drawerBillingBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>
                            Issue {plan.toUpperCase()} ({drawerGrantMode === 'complimentary_grant' ? '₹0 Grant' : 'Paid GST Bill'})
                          </span>
                        </button>
                      </div>

                      {detail.tenant.subscriptionInvoices?.length > 0 && (
                        <div className="space-y-1.5">
                          {detail.tenant.subscriptionInvoices.slice(0, 5).map((inv) => (
                            <div
                              key={inv.id}
                              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px]"
                            >
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {inv.invoiceNumber}
                                </span>{' '}
                                · <span className="font-extrabold">{formatINR(inv.totalAmount)}</span>{' '}
                                · <span className="uppercase text-slate-500">{inv.status}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {inv.status === 'paid' && (
                                  <button
                                    type="button"
                                    disabled={drawerBillingBusy}
                                    onClick={async () => {
                                      if (!selectedTenantId) return;
                                      setDrawerBillingBusy(true);
                                      try {
                                        await updateSubscriptionInvoiceStatusApi(
                                          selectedTenantId,
                                          inv.id,
                                          {
                                            action: 'refund',
                                            reason:
                                              auditReason.trim() || 'Super Admin drawer refund',
                                          }
                                        );
                                        const refreshed = await fetchSuperAdminTenantDetailApi(
                                          selectedTenantId
                                        );
                                        syncFromDetail(refreshed);
                                        await onRefreshTenants();
                                        showToast(`Refunded ${inv.invoiceNumber}.`);
                                      } catch (err) {
                                        setDrawerError(getErrorMessage(err));
                                      } finally {
                                        setDrawerBillingBusy(false);
                                      }
                                    }}
                                    className="px-2 py-1 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                                  >
                                    Refund
                                  </button>
                                )}
                                {inv.status !== 'voided' && inv.status !== 'refunded' && (
                                  <button
                                    type="button"
                                    disabled={drawerBillingBusy}
                                    onClick={async () => {
                                      if (!selectedTenantId) return;
                                      setDrawerBillingBusy(true);
                                      try {
                                        await updateSubscriptionInvoiceStatusApi(
                                          selectedTenantId,
                                          inv.id,
                                          {
                                            action: 'void',
                                            reason:
                                              auditReason.trim() || 'Super Admin drawer void',
                                          }
                                        );
                                        const refreshed = await fetchSuperAdminTenantDetailApi(
                                          selectedTenantId
                                        );
                                        syncFromDetail(refreshed);
                                        await onRefreshTenants();
                                        showToast(`Voided ${inv.invoiceNumber}.`);
                                      } catch (err) {
                                        setDrawerError(getErrorMessage(err));
                                      } finally {
                                        setDrawerBillingBusy(false);
                                      }
                                    }}
                                    className="px-2 py-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300 font-bold"
                                  >
                                    Void
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: MODULE FEATURE OVERRIDES */}
                {drawerTab === 'features' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-brand-blue/30 bg-brand-blue/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            AI Feature &amp; 4-Pillar Authority (Assign / Edit / Remove)
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            Assign or remove SetuAI Scoring, 3 B2B Pillars, RAG Copilot &amp; AI Workflows for {detail.tenant.name}.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              handleDrawerAiAuthority(
                                {
                                  mode: 'update_features',
                                  aiScoring: true,
                                  aiWorkflows: true,
                                  aiCreditRisk: true,
                                  aiVoiceCrm: true,
                                  aiDealerDesk: true,
                                  aiCopilot: true,
                                  reason: 'Super Admin assigned all AI features & pillars ON',
                                },
                                'Assigned all AI features & pillars ON for this Admin account.',
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                          >
                            Assign All AI (ON)
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              handleDrawerAiAuthority(
                                {
                                  mode: 'update_features',
                                  aiScoring: false,
                                  aiWorkflows: false,
                                  aiCreditRisk: false,
                                  aiVoiceCrm: false,
                                  aiDealerDesk: false,
                                  aiCopilot: false,
                                  reason: 'Super Admin removed all AI features & pillars OFF',
                                },
                                'Removed all AI features & pillars OFF for this Admin account.',
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold"
                          >
                            Remove All AI (OFF)
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              handleDrawerAiAuthority(
                                {
                                  mode: 'update_features',
                                  aiScoring: null,
                                  aiWorkflows: null,
                                  aiCreditRisk: null,
                                  aiVoiceCrm: null,
                                  aiDealerDesk: null,
                                  aiCopilot: null,
                                  reason: 'Super Admin reset AI features & pillars to plan default',
                                },
                                'Reset AI features & pillars to plan default.',
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                          >
                            Plan Default
                          </button>
                        </div>
                      </div>

                      {/* Per-Pillar Quick Toggle Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-brand-blue/20">
                        {(
                          [
                            ['aiCreditRisk', 'Pillar 1 · Credit & Udhaar AI'],
                            ['aiVoiceCrm', 'Pillar 2 · Voice-to-CRM & Call Audit'],
                            ['aiDealerDesk', 'Pillar 3 · Dealer RFQ & Beat Planner'],
                            ['aiCopilot', 'Ask AI · Tenant RAG Copilot'],
                          ] as const
                        ).map(([pKey, pLabel]) => {
                          const eff = detail.tenant.effectiveFeatures[pKey];
                          const isOn = eff?.enabled ?? true;
                          return (
                            <div
                              key={pKey}
                              className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                            >
                              <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                                {pLabel}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleDrawerAiAuthority(
                                      {
                                        mode: 'update_features',
                                        [pKey]: true,
                                        reason: `Super Admin enabled ${pLabel}`,
                                      },
                                      `${pLabel} enabled.`,
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    isOn
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  ON
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleDrawerAiAuthority(
                                      {
                                        mode: 'update_features',
                                        [pKey]: false,
                                        reason: `Super Admin removed ${pLabel}`,
                                      },
                                      `${pLabel} removed (OFF).`,
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    !isOn
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  OFF
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Force individual CRM modules <strong>ON</strong> or <strong>OFF</strong> for this tenant regardless of their base{' '}
                      <span className="uppercase font-bold text-[#0057FF]">{detail.tenant.plan}</span> plan.
                    </p>
                    <div className="space-y-2.5">
                      {detail.featureCatalog.map((feat) => {
                        const eff = detail.tenant.effectiveFeatures[feat.key];
                        return (
                          <div
                            key={feat.key}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {feat.label}
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    eff.source === 'override_on'
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                      : eff.source === 'override_off' || eff.source === 'kill_switch'
                                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {eff.source === 'plan'
                                    ? `Plan Default (${eff.enabled ? 'ON' : 'OFF'})`
                                    : eff.source === 'override_on'
                                      ? 'Forced ON'
                                      : eff.source === 'kill_switch'
                                        ? 'Kill-Switch OFF'
                                        : 'Forced OFF'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {feat.description}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleFeatureOverride(feat.key, true)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                                  eff.enabled
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                ON
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleFeatureOverride(feat.key, false)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                                  !eff.enabled
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                OFF
                              </button>
                              {eff.source !== 'plan' && (
                                <button
                                  type="button"
                                  disabled={saving}
                                  title="Reset to plan default"
                                  onClick={() => handleFeatureOverride(feat.key, null)}
                                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0057FF]"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: QUOTAS, METERING & COST TELEMETRY */}
                {drawerTab === 'quotas' && (
                  <div className="space-y-4">
                    {detail.tenant.costTelemetry && (
                      <div
                        className={`p-4 rounded-xl border space-y-3 ${
                          detail.tenant.costTelemetry.unprofitable
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : detail.tenant.costTelemetry.alertLevel !== 'ok'
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            Live Unit Economics &amp; Infra Cost Guardrail
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              detail.tenant.costTelemetry.unprofitable
                                ? 'bg-rose-600 text-white'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {detail.tenant.costTelemetry.unprofitable
                              ? 'Unprofitable Heavy Tenant'
                              : `Gross Margin ${detail.tenant.costTelemetry.marginPct}%`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <div className="text-slate-400 font-bold uppercase text-[9px]">MRR</div>
                            <div className="font-black text-slate-900 dark:text-white">
                              {formatINR(detail.tenant.costTelemetry.mrrInr)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 font-bold uppercase text-[9px]">SetuAI Cost</div>
                            <div className="font-black text-slate-900 dark:text-white">
                              ₹{detail.tenant.costTelemetry.estimatedAiCostInr} ({detail.tenant.costTelemetry.aiPct}%)
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Meta WhatsApp Cost</div>
                            <div className="font-black text-slate-900 dark:text-white">
                              ₹{detail.tenant.costTelemetry.estimatedWaCostInr} ({detail.tenant.costTelemetry.waPct}%)
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Net Margin</div>
                            <div
                              className={`font-black ${
                                detail.tenant.costTelemetry.grossMarginInr < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {formatINR(detail.tenant.costTelemetry.grossMarginInr)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dedicated Super Admin AI Balance Assign / Edit / Remove Control */}
                    <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-blue/25 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            AI Balance Control (Assign / Edit / Remove)
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300">
                            Remaining Balance:{' '}
                            <strong className="text-[#0057FF] dark:text-sky-300">
                              {Math.max(
                                0,
                                detail.tenant.quotas.maxMonthlyAiCalls -
                                  detail.tenant.quotas.aiCallsUsed,
                              ).toLocaleString('en-IN')}{' '}
                              calls
                            </strong>{' '}
                            ({detail.tenant.quotas.aiCallsUsed.toLocaleString('en-IN')} used /{' '}
                            {detail.tenant.quotas.maxMonthlyAiCalls.toLocaleString('en-IN')} cap)
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            Adjust Calls
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={aiDeltaInput}
                            onChange={(e) =>
                              setAiDeltaInput(Math.max(0, Number(e.target.value) || 0))
                            }
                            className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleDrawerAiAuthority(
                              {
                                mode: 'assign_balance',
                                aiCallsDelta: aiDeltaInput,
                                aiScoring: true,
                                reason: `Assigned +${aiDeltaInput} AI calls`,
                              },
                              `Assigned +${aiDeltaInput.toLocaleString('en-IN')} AI calls.`,
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                        >
                          + Assign {aiDeltaInput} AI Calls
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleDrawerAiAuthority(
                              {
                                mode: 'assign_balance',
                                aiCallsDelta: 2500,
                                aiScoring: true,
                                reason: 'Quick +2,500 AI calls balance assigned',
                              },
                              'Assigned +2,500 AI calls.',
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold"
                        >
                          +2,500
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleDrawerAiAuthority(
                              {
                                mode: 'remove_balance',
                                aiCallsDelta: aiDeltaInput,
                                reason: `Deducted ${aiDeltaInput} AI calls`,
                              },
                              `Removed ${aiDeltaInput.toLocaleString('en-IN')} AI calls.`,
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold"
                        >
                          - Deduct {aiDeltaInput} AI Calls
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleDrawerAiAuthority(
                              {
                                mode: 'remove_balance',
                                maxMonthlyAiCalls: 0,
                                reason: 'Removed all AI balance (cap set to 0)',
                              },
                              'AI balance removed (cap set to 0).',
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold"
                        >
                          Remove AI Balance (Set 0)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Monthly AI Calls Cap
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={aiQuota}
                          onChange={(e) => setAiQuota(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Used: {detail.tenant.quotas.aiCallsUsed} ({detail.tenant.costTelemetry?.aiPct ?? 0}%)
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Edit AI Calls Used
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={aiUsedInput}
                          onChange={(e) =>
                            setAiUsedInput(Math.max(0, Number(e.target.value) || 0))
                          }
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Remaining: {Math.max(0, aiQuota - aiUsedInput)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Monthly WhatsApp Cap
                        </label>
                        <input
                          type="number"
                          value={waQuota}
                          onChange={(e) => setWaQuota(Number(e.target.value) || 0)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Used: {detail.tenant.quotas.whatsappUsed} ({detail.tenant.costTelemetry?.waPct ?? 0}%)
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-bold uppercase text-slate-400">
                          Document Storage (MB)
                        </label>
                        <input
                          type="number"
                          value={storageQuota}
                          onChange={(e) => setStorageQuota(Number(e.target.value) || 128)}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveQuotas(false)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Tenant Quotas</span>
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveQuotas(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-extrabold"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Usage &amp; Cost Counters</span>
                      </button>
                    </div>

                    {/* Add-On Top-Up Pack */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Grant Paid / Complimentary Quota Add-On Pack
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400">+AI Calls</label>
                            <input
                              type="number"
                              min={0}
                              value={addonAi}
                              onChange={(e) => setAddonAi(Number(e.target.value) || 0)}
                              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400">+WhatsApp</label>
                            <input
                              type="number"
                              min={0}
                              value={addonWa}
                              onChange={(e) => setAddonWa(Number(e.target.value) || 0)}
                              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400">+Storage MB</label>
                            <input
                              type="number"
                              min={0}
                              value={addonMb}
                              onChange={(e) => setAddonMb(Number(e.target.value) || 0)}
                              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400">Pack Price ₹</label>
                            <input
                              type="number"
                              min={0}
                              value={addonPrice}
                              onChange={(e) => setAddonPrice(Number(e.target.value) || 0)}
                              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={addonIssueInvoice}
                              onChange={(e) => setAddonIssueInvoice(e.target.checked)}
                            />
                            <span>Attach paid 18% GST invoice if Price &gt; ₹0</span>
                          </label>
                          <button
                            type="button"
                            disabled={saving || !selectedTenantId}
                            onClick={async () => {
                              if (!selectedTenantId) return;
                              setSaving(true);
                              setDrawerError(null);
                              try {
                                const updated = await grantTenantQuotaAddonApi(selectedTenantId, {
                                  addonAiCalls: addonAi,
                                  addonWhatsapp: addonWa,
                                  addonStorageMb: addonMb,
                                  issueGstInvoice: addonIssueInvoice,
                                  addonPriceInr: addonPrice,
                                  reason: auditReason.trim() || 'Super Admin quota pack top-up',
                                });
                                syncFromDetail(updated);
                                await onRefreshTenants();
                                showToast(`Topped up +${addonAi} AI calls & +${addonWa} WhatsApp msgs.`);
                              } catch (err) {
                                setDrawerError(getErrorMessage(err));
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                          >
                            Apply Quota Add-On Pack
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: SECURITY POLICY */}
                {drawerTab === 'security' && (
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Enforce Anti-Data-Leak Phone Masking for Agents',
                        desc: 'Forces +91 98*** **678 masking across leads, contacts & tickets.',
                        val: enforceMasking,
                        set: setEnforceMasking,
                      },
                      {
                        label: 'Lock Bulk CSV Exports for Non-Admin Users',
                        desc: 'Prevents reps from downloading buyer lists or GSTR exports.',
                        val: lockExport,
                        set: setLockExport,
                      },
                      {
                        label: 'Require Strong Password Complexity',
                        desc: 'Enforces minimum HQ security password policy on new invites.',
                        val: requireStrongPwd,
                        set: setRequireStrongPwd,
                      },
                      {
                        label: 'Allow Leadsetu HQ Support Impersonation',
                        desc: 'If disabled, even Super Admins cannot impersonate into this tenant.',
                        val: allowImpersonation,
                        set: setAllowImpersonation,
                      },
                    ].map((row) => (
                      <label
                        key={row.label}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {row.label}
                          </div>
                          <div className="text-[11px] text-slate-500">{row.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={row.val}
                          onChange={(e) => row.set(e.target.checked)}
                          className="w-4 h-4 accent-[#0057FF]"
                        />
                      </label>
                    ))}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Session TTL (Hours)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={720}
                          value={sessionTtl}
                          onChange={(e) => setSessionTtl(Number(e.target.value) || 24)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          IP Allowlist (Comma-separated CIDRs, optional)
                        </label>
                        <input
                          type="text"
                          value={ipAllowlistText}
                          onChange={(e) => setIpAllowlistText(e.target.value)}
                          placeholder="e.g., 103.21.44.0/24, 49.36.12.8"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveSecurity}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enforce Tenant Security Shield</span>
                    </button>

                    {/* Panic Whole-Tenant Force-Logout */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Panic Force-Logout (Whole Workspace Session Revocation)
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Session v{detail.tenant.sessionVersion ?? 1}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={panicReason}
                            onChange={(e) => setPanicReason(e.target.value)}
                            placeholder="Security reason (e.g., Compromised team laptop) *"
                            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-amber-400/50 text-xs"
                          />
                          <input
                            type="password"
                            value={panicPassword}
                            onChange={(e) => setPanicPassword(e.target.value)}
                            placeholder="Super Admin password confirmation *"
                            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-amber-400/50 text-xs font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={dpdpBusy || !selectedTenantId}
                          onClick={async () => {
                            if (!selectedTenantId) return;
                            setDpdpBusy(true);
                            setDrawerError(null);
                            try {
                              const updated = await revokeAllTenantSessionsApi(selectedTenantId, {
                                reason: panicReason.trim() || 'Emergency tenant-wide session revocation',
                                confirmPassword: panicPassword,
                              });
                              syncFromDetail(updated);
                              setPanicReason('');
                              setPanicPassword('');
                              showToast('All active workspace JWT & refresh sessions revoked immediately.');
                            } catch (err) {
                              setDrawerError(getErrorMessage(err));
                            } finally {
                              setDpdpBusy(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Force-Logout Entire Workspace</span>
                        </button>
                      </div>
                    </div>

                    {/* DPDP Data Portability & Right-to-Erasure */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            DPDP Act Compliance: Data Portability &amp; Right-to-Erasure
                          </div>
                          {detail.tenant.dpdpRetention?.purgedAt ? (
                            <div className="text-[11px] text-rose-500 font-bold">
                              Permanently Purged on {detail.tenant.dpdpRetention.purgedAt.slice(0, 10)}
                            </div>
                          ) : detail.tenant.dpdpRetention?.softDeletedAt ? (
                            <div className="text-[11px] text-amber-600 dark:text-amber-300 font-bold">
                              Soft-Deleted · Purge Eligible {detail.tenant.dpdpRetention.purgeScheduledAt?.slice(0, 10)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500">
                              Export full JSON archive or execute soft-delete / verified purge.
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={dpdpBusy || !selectedTenantId}
                          onClick={async () => {
                            if (!selectedTenantId) return;
                            setDpdpBusy(true);
                            setDrawerError(null);
                            try {
                              const { blob, filename } = await exportTenantDpdpDataApi(selectedTenantId);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                              showToast(`Downloaded DPDP backup: ${filename}`);
                            } catch (err) {
                              setDrawerError(getErrorMessage(err));
                            } finally {
                              setDpdpBusy(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Full JSON Backup</span>
                        </button>
                      </div>

                      {!detail.tenant.dpdpRetention?.purgedAt && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                          <div className="grid sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={dpdpReason}
                              onChange={(e) => setDpdpReason(e.target.value)}
                              placeholder="DPDP Erasure Request / Ticket # *"
                              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-800 text-xs"
                            />
                            <input
                              type="password"
                              value={dpdpPassword}
                              onChange={(e) => setDpdpPassword(e.target.value)}
                              placeholder="Super Admin password confirmation *"
                              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-800 text-xs font-bold"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {!detail.tenant.dpdpRetention?.softDeletedAt ? (
                              <button
                                type="button"
                                disabled={dpdpBusy || !selectedTenantId}
                                onClick={async () => {
                                  if (!selectedTenantId) return;
                                  setDpdpBusy(true);
                                  setDrawerError(null);
                                  try {
                                    const updated = await dpdpEraseTenantApi(selectedTenantId, {
                                      mode: 'soft_delete',
                                      reason: dpdpReason.trim(),
                                      confirmPassword: dpdpPassword,
                                    });
                                    syncFromDetail(updated);
                                    setDpdpPassword('');
                                    await onRefreshTenants();
                                    showToast('Workspace Soft-Deleted & queued per DPDP retention.');
                                  } catch (err) {
                                    setDrawerError(getErrorMessage(err));
                                  } finally {
                                    setDpdpBusy(false);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Initiate DPDP Soft-Delete</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={dpdpBusy || !selectedTenantId}
                                  onClick={async () => {
                                    if (!selectedTenantId) return;
                                    setDpdpBusy(true);
                                    setDrawerError(null);
                                    try {
                                      const updated = await dpdpEraseTenantApi(selectedTenantId, {
                                        mode: 'restore',
                                        reason: dpdpReason.trim() || 'Restored before purge',
                                      });
                                      syncFromDetail(updated);
                                      await onRefreshTenants();
                                      showToast('Cancelled soft-delete and restored workspace.');
                                    } catch (err) {
                                      setDrawerError(getErrorMessage(err));
                                    } finally {
                                      setDpdpBusy(false);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold"
                                >
                                  Restore Workspace
                                </button>
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                                  <input
                                    type="checkbox"
                                    checked={dpdpBypassRetention}
                                    onChange={(e) => setDpdpBypassRetention(e.target.checked)}
                                  />
                                  <span>Bypass retention wait</span>
                                </label>
                                <button
                                  type="button"
                                  disabled={dpdpBusy || !selectedTenantId}
                                  onClick={async () => {
                                    if (!selectedTenantId) return;
                                    setDpdpBusy(true);
                                    setDrawerError(null);
                                    try {
                                      const updated = await dpdpEraseTenantApi(selectedTenantId, {
                                        mode: 'permanent_purge',
                                        reason: dpdpReason.trim(),
                                        confirmPassword: dpdpPassword,
                                        forceBypassRetention: dpdpBypassRetention,
                                      });
                                      syncFromDetail(updated);
                                      setDpdpPassword('');
                                      await onRefreshTenants();
                                      showToast('Permanent DPDP erasure executed.');
                                    } catch (err) {
                                      setDrawerError(getErrorMessage(err));
                                    } finally {
                                      setDpdpBusy(false);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-extrabold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Permanent Purge Now</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: USERS & RBAC AUTHORITY */}
                {drawerTab === 'users' && (
                  <div className="space-y-2.5">
                    {detail.members.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {m.name}
                              </span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                UID #{m.userCode || '----------'}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  m.isActive
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {m.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.email} · {m.territory || 'No territory'}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <select
                              value={m.role}
                              disabled={saving}
                              onChange={(e) =>
                                handleUserRbacUpdate(m.id, {
                                  role: e.target.value as 'owner' | 'admin' | 'manager' | 'agent' | 'support',
                                  reason: `Role changed via Super Admin RBAC Inspector`,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="agent">Agent</option>
                              <option value="support">Support Engineer</option>
                            </select>

                            <select
                              value={m.departmentPreset || 'sales'}
                              disabled={saving}
                              onChange={(e) =>
                                handleUserRbacUpdate(m.id, {
                                  departmentPreset: e.target.value,
                                  reason: `Department preset changed via Super Admin`,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                            >
                              <option value="executive">Executive</option>
                              <option value="sales">Sales</option>
                              <option value="finance">Finance</option>
                              <option value="service">Service</option>
                              <option value="marketing">Marketing</option>
                              <option value="operations">Operations</option>
                            </select>

                            <button
                              type="button"
                              disabled={saving}
                              title="Toggle phone masking override"
                              onClick={() =>
                                handleUserRbacUpdate(m.id, {
                                  maskPhones: !m.maskPhones,
                                })
                              }
                              className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                                m.maskPhones
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              title="Force Sign Out / Revoke Sessions"
                              onClick={() =>
                                handleUserRbacUpdate(m.id, {
                                  revokeSessions: true,
                                  reason: 'Force session revocation by HQ',
                                })
                              }
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              title={m.isActive ? 'Suspend user' : 'Activate user'}
                              onClick={() =>
                                handleUserRbacUpdate(m.id, {
                                  isActive: !m.isActive,
                                  reason: m.isActive ? 'User suspended by HQ' : 'User reactivated by HQ',
                                })
                              }
                              className={`p-1.5 rounded-lg border ${
                                m.isActive
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                              }`}
                            >
                              {m.isActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Impersonation Compliance Confirmation Modal */}
      {impersonateOpen && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0D1628] border border-amber-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Start Support Impersonation
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You are about to open a logged, time-boxed support session inside{' '}
              <strong>{detail.tenant.name}</strong> (#{detail.tenant.accountId}). A critical
              audit entry will be recorded with your operator ID and IP address.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Mandatory Audit Reason (Min 5 characters)
              </label>
              <input
                type="text"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="e.g., Verifying GST IGST tax invoice ticket #TKT-102"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImpersonateOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={impersonateBusy}
                onClick={handleConfirmImpersonate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold"
              >
                {impersonateBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Launch Impersonation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

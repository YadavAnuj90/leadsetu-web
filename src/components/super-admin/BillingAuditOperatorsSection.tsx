'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  IndianRupee,
  FileClock,
  ShieldCheck,
  UserPlus,
  Search,
  Lock,
  Loader2,
  UserX,
  UserCheck,
  Receipt,
  Download,
  Tag,
  Handshake,
  BellRing,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  Gift,
} from 'lucide-react';
import {
  createSaasCouponApi,
  createSaasPartnerApi,
  createSuperAdminOperatorApi,
  exportSuperAdminBillingCsvApi,
  fetchSuperAdminRefundRequestsApi,
  issueTenantSubscriptionApi,
  recordPartnerPayoutApi,
  resolveSuperAdminRefundRequestApi,
  runDunningSweepApi,
  toggleSuperAdminOperatorStatusApi,
  updateDunningPolicyApi,
  updateSaasCouponApi,
  updateSubscriptionInvoiceStatusApi,
  type SuperAdminRefundRequestItem,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  DunningPolicyConfig,
  PlanEntitlementSpec,
  PlatformAuditLogItem,
  SuperAdminBillingResponse,
  SuperAdminOperatorItem,
  SuperAdminTenantItem,
} from '@/types/contracts';

function formatINR(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

const DEFAULT_PLAN_PRICES: Record<'starter' | 'growth' | 'enterprise', { monthly: number; annual: number }> = {
  starter: { monthly: 999, annual: 9590 },
  growth: { monthly: 2399, annual: 22990 },
  enterprise: { monthly: 5499, annual: 52790 },
};

const INVOICE_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  paid: {
    label: 'Paid GST',
    cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  complimentary_grant: {
    label: 'Complimentary Grant',
    cls: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  },
  trial_complimentary: {
    label: 'Trial',
    cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
  },
  refunded: {
    label: 'Refunded',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  voided: {
    label: 'Voided',
    cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 line-through',
  },
};

export function BillingLedgerView({
  billing,
  tenants = [],
  planMatrix,
  onRefreshBilling,
}: {
  billing: SuperAdminBillingResponse;
  tenants?: SuperAdminTenantItem[];
  planMatrix?: Record<'starter' | 'growth' | 'enterprise', PlanEntitlementSpec>;
  onRefreshBilling?: (month?: string) => Promise<void>;
}) {
  const [subTab, setSubTab] = useState<'ledger' | 'issue' | 'growth' | 'dunning'>('ledger');
  const [monthFilter, setMonthFilter] = useState<string>(
    billing.monthFilter && billing.monthFilter !== 'all' ? billing.monthFilter : ''
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Invoice status modal state
  const [pendingInvAction, setPendingInvAction] = useState<{
    tenantId: string;
    invoiceId: string;
    invoiceNumber: string;
    action: 'refund' | 'void' | 'mark_paid';
  } | null>(null);
  const [invReason, setInvReason] = useState('');
  const [invPayRef, setInvPayRef] = useState('');
  const [invTds, setInvTds] = useState('0');

  // Manual Grant / Upgrade state
  const [grantTenantId, setGrantTenantId] = useState<string>(tenants[0]?.id || '');
  const [grantPlan, setGrantPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [grantCycle, setGrantCycle] = useState<'monthly' | 'annual'>('monthly');
  const [grantMode, setGrantMode] = useState<'paid_offline' | 'complimentary_grant'>('paid_offline');
  const [grantPaymentMode, setGrantPaymentMode] = useState('Offline NEFT / RTGS');
  const [grantPaymentRef, setGrantPaymentRef] = useState('');
  const [grantCustomBase, setGrantCustomBase] = useState('');
  const [grantCouponCode, setGrantCouponCode] = useState('');
  const [grantPartnerCode, setGrantPartnerCode] = useState('');
  const [grantTds, setGrantTds] = useState('0');
  const [grantNote, setGrantNote] = useState('');
  const [grantReason, setGrantReason] = useState('');

  // Coupon form state
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'flat_inr'>('percent');
  const [couponValue, setCouponValue] = useState('20');
  const [couponCycle, setCouponCycle] = useState<'all' | 'monthly' | 'annual'>('all');
  const [couponMaxRedeem, setCouponMaxRedeem] = useState('50');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponDesc, setCouponDesc] = useState('');

  // Partner form state
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerCity, setPartnerCity] = useState('Delhi-NCR');
  const [partnerRate, setPartnerRate] = useState('15');
  const [payoutTarget, setPayoutTarget] = useState<{
    id: string;
    name: string;
    pending: number;
  } | null>(null);
  const [payoutAmt, setPayoutAmt] = useState('');
  const [payoutRef, setPayoutRef] = useState('');

  // Dunning state synced from billing.dunningPolicy
  const [dunning, setDunning] = useState<DunningPolicyConfig>(
    billing.dunningPolicy || {
      autoRemindersEnabled: true,
      reminderDaysBeforeExpiry: [7, 3, 1],
      gracePeriodDays: 3,
      autoActionOnExpiry: 'pause_writes',
      whatsappTemplateEnabled: true,
      emailReminderEnabled: true,
      reminderMessageTemplate: '',
    }
  );
  const [reminderDaysInput, setReminderDaysInput] = useState(
    (billing.dunningPolicy?.reminderDaysBeforeExpiry || [7, 3, 1]).join(', ')
  );
  const [sweepOutput, setSweepOutput] = useState<{
    summary: string;
    actions: Array<{ tenantName: string; accountId: string; outcome: string }>;
  } | null>(null);
  const [refundRequests, setRefundRequests] = useState<SuperAdminRefundRequestItem[]>([]);
  const [refundPendingCount, setRefundPendingCount] = useState(0);

  const loadRefundRequests = async () => {
    try {
      const res = await fetchSuperAdminRefundRequestsApi();
      setRefundRequests(res.data || []);
      setRefundPendingCount(res.stats?.pending || 0);
    } catch {
      // Non-fatal fallback
    }
  };

  useEffect(() => {
    void loadRefundRequests();
  }, []);

  useEffect(() => {
    if (!grantTenantId && tenants[0]?.id) {
      setGrantTenantId(tenants[0].id);
    }
  }, [tenants, grantTenantId]);

  useEffect(() => {
    if (billing.dunningPolicy) {
      setDunning(billing.dunningPolicy);
      setReminderDaysInput(
        (billing.dunningPolicy.reminderDaysBeforeExpiry || [7, 3, 1]).join(', ')
      );
    }
  }, [billing.dunningPolicy]);

  const notify = (msg: string) => {
    setErrorMsg(null);
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const refreshAll = async (m = monthFilter) => {
    if (onRefreshBilling) {
      await onRefreshBilling(m || 'all');
    }
    await loadRefundRequests();
  };

  const handleResolveRefundRequest = async (
    reqItem: SuperAdminRefundRequestItem,
    action: 'approve' | 'reject'
  ) => {
    const notePrompt = window.prompt(
      action === 'approve'
        ? `Approve GST Credit Note & Refund ₹${(reqItem.amountInr || 0).toLocaleString('en-IN')} for ${reqItem.tenantName} (${reqItem.invoiceNumber})? Optional note:`
        : `Reject refund request for ${reqItem.invoiceNumber}? Reason:`,
      action === 'approve' ? 'Approved & refunded via GST Credit Note' : 'Outside refund eligibility window'
    );
    if (notePrompt === null) return;
    setBusyKey(`refund-req-${reqItem.id}`);
    setErrorMsg(null);
    try {
      await resolveSuperAdminRefundRequestApi(reqItem.tenantId, reqItem.id, {
        action,
        note: notePrompt.trim() || undefined,
      });
      notify(
        action === 'approve'
          ? `Refund approved & invoice ${reqItem.invoiceNumber} marked refunded.`
          : `Refund request for ${reqItem.invoiceNumber} rejected.`
      );
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleDownloadCsv = async (type: 'gstr1' | 'tds') => {
    setBusyKey(`csv-${type}`);
    setErrorMsg(null);
    try {
      const { blob, filename } = await exportSuperAdminBillingCsvApi(
        type,
        monthFilter || 'all'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify(`Downloaded CA export: ${filename}`);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleConfirmInvoiceMutation = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingInvAction) return;
    setBusyKey('inv-action');
    setErrorMsg(null);
    try {
      await updateSubscriptionInvoiceStatusApi(
        pendingInvAction.tenantId,
        pendingInvAction.invoiceId,
        {
          action: pendingInvAction.action,
          paymentReference: invPayRef.trim() || undefined,
          tdsDeducted: Number(invTds || 0),
          reason: invReason.trim(),
        }
      );
      notify(
        `Invoice ${pendingInvAction.invoiceNumber} updated (${pendingInvAction.action.replace('_', ' ')}).`
      );
      setPendingInvAction(null);
      setInvReason('');
      setInvPayRef('');
      setInvTds('0');
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const listPlanBase =
    grantCycle === 'annual'
      ? planMatrix?.[grantPlan]?.annualPrice ?? DEFAULT_PLAN_PRICES[grantPlan].annual
      : planMatrix?.[grantPlan]?.monthlyPrice ?? DEFAULT_PLAN_PRICES[grantPlan].monthly;
  const previewBase =
    grantMode === 'complimentary_grant'
      ? 0
      : grantCustomBase.trim() !== '' && Number.isFinite(Number(grantCustomBase))
        ? Math.max(0, Math.round(Number(grantCustomBase)))
        : listPlanBase;
  const previewGst = Math.round(previewBase * 0.18);
  const previewGrand = previewBase + previewGst;

  const handleIssueSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!grantTenantId) {
      setErrorMsg('Select a customer workspace first.');
      return;
    }
    setBusyKey('issue-grant');
    setErrorMsg(null);
    try {
      const res = await issueTenantSubscriptionApi(grantTenantId, {
        plan: grantPlan,
        billingCycle: grantCycle,
        grantMode,
        paymentMode: grantPaymentMode.trim() || undefined,
        paymentReference: grantPaymentRef.trim() || undefined,
        customBaseAmount:
          grantCustomBase.trim() !== '' ? Number(grantCustomBase) : undefined,
        couponCode: grantCouponCode.trim() || undefined,
        partnerCode: grantPartnerCode.trim() || undefined,
        tdsDeducted: Number(grantTds || 0),
        greetingNote: grantNote.trim() || undefined,
        reason: grantReason.trim() || undefined,
      });
      notify(
        `Issued ${res.invoice.invoiceNumber} (${res.plan.toUpperCase()}) for ${formatINR(res.invoice.totalAmount)}`
      );
      setGrantPaymentRef('');
      setGrantCustomBase('');
      setGrantCouponCode('');
      setGrantTds('0');
      setGrantNote('');
      setGrantReason('');
      await refreshAll();
      setSubTab('ledger');
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    setBusyKey('create-coupon');
    setErrorMsg(null);
    try {
      const created = await createSaasCouponApi({
        code: couponCode.trim().toUpperCase(),
        discountType: couponType,
        discountValue: Number(couponValue),
        billingCycle: couponCycle,
        maxRedemptions: Number(couponMaxRedeem || 0),
        expiresAt: couponExpiry.trim() || undefined,
        description: couponDesc.trim() || undefined,
      });
      notify(`Created promo code ${created.code}.`);
      setCouponCode('');
      setCouponDesc('');
      setCouponExpiry('');
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleCoupon = async (id: string, isActive: boolean) => {
    setBusyKey(`coupon-${id}`);
    setErrorMsg(null);
    try {
      await updateSaasCouponApi(id, { isActive });
      notify(`Coupon ${isActive ? 'activated' : 'paused'}.`);
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreatePartner = async (e: FormEvent) => {
    e.preventDefault();
    setBusyKey('create-partner');
    setErrorMsg(null);
    try {
      const created = await createSaasPartnerApi({
        partnerCode: partnerCode.trim().toUpperCase(),
        name: partnerName.trim(),
        email: partnerEmail.trim(),
        city: partnerCity.trim(),
        commissionRatePct: Number(partnerRate || 15),
      });
      notify(`Registered channel partner ${created.name} (${created.partnerCode}).`);
      setPartnerCode('');
      setPartnerName('');
      setPartnerEmail('');
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleSettlePayout = async (e: FormEvent) => {
    e.preventDefault();
    if (!payoutTarget) return;
    setBusyKey('partner-payout');
    setErrorMsg(null);
    try {
      await recordPartnerPayoutApi(payoutTarget.id, {
        amountInr: Number(payoutAmt),
        reference: payoutRef.trim() || undefined,
      });
      notify(`Settled ${formatINR(Number(payoutAmt))} payout to ${payoutTarget.name}.`);
      setPayoutTarget(null);
      setPayoutAmt('');
      setPayoutRef('');
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveDunning = async (e: FormEvent) => {
    e.preventDefault();
    setBusyKey('save-dunning');
    setErrorMsg(null);
    try {
      const parsedDays = reminderDaysInput
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 0);
      await updateDunningPolicyApi({
        ...dunning,
        reminderDaysBeforeExpiry: parsedDays.length > 0 ? parsedDays : [7, 3, 1],
      });
      notify('Auto-dunning & trial expiry policy saved.');
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleRunSweep = async () => {
    setBusyKey('run-sweep');
    setErrorMsg(null);
    try {
      const res = await runDunningSweepApi();
      setSweepOutput({ summary: res.summary, actions: res.actions || [] });
      notify(res.summary);
      await refreshAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  };

  const trialWatchlist = billing.trialWatchlist || [];
  const coupons = billing.coupons || [];
  const partners = billing.partners || [];
  const urgentTrialsCount = trialWatchlist.filter(
    (t) => t.health === 'expiring_soon' || t.health === 'in_grace' || t.health === 'overdue'
  ).length;

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">Paid SaaS Revenue</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(billing.summary.paidRevenueInr)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {billing.summary.paidCount} paid · {billing.summary.complimentaryCount || 0} granted
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">18% GST Collected</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatINR(billing.summary.totalGstInr)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {billing.summary.b2bRegisteredCount || 0} B2B GSTIN · {billing.summary.b2cCount || 0} B2CS
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">TDS u/s 194J & Refunds</div>
          <div className="text-2xl font-black text-[#0057FF] dark:text-sky-400 mt-1">
            {formatINR(billing.summary.tdsTotalInr || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Refunded/Voided: {formatINR(billing.summary.refundedInr || 0)}
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">Partner Payout Due</div>
          <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
            {formatINR(billing.summary.pendingPartnerPayoutInr || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {partners.length} channel partners · {coupons.filter((c) => c.isActive).length} active promos
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase text-slate-400">Trial Dunning Radar</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">
            {urgentTrialsCount} / {trialWatchlist.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Expiring / grace trials needing nudge
          </div>
        </div>
      </div>

      {/* Sub-navigation + Toast */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white dark:bg-[#0D1628] p-1.5 border border-slate-200/85 dark:border-slate-800 shadow-sm">
          {[
            { id: 'ledger' as const, label: 'GST Ledger & CA Exports', icon: Receipt },
            { id: 'issue' as const, label: 'Manual Upgrade / Grant', icon: Sparkles },
            { id: 'growth' as const, label: 'Coupons & Partners', icon: Tag },
            { id: 'dunning' as const, label: 'Auto-Dunning & Trials', icon: BellRing },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  active
                    ? 'bg-[#0057FF] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {(statusMessage || errorMsg) && (
          <div
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
              errorMsg
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {errorMsg || statusMessage}
          </div>
        )}
      </div>

      {/* SUBTAB 1: GST LEDGER & CA EXPORTS */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          {refundRequests.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-amber-300/70 dark:border-amber-500/30 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-amber-100 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Customer GST Credit Note & Refund Queue
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Self-serve refund requests submitted from tenant workspaces — approving marks the invoice refunded.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {refundPendingCount} Pending
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {refundRequests.map((reqItem) => (
                  <div
                    key={`${reqItem.tenantId}-${reqItem.id}`}
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {reqItem.tenantName}
                        </span>
                        <span className="font-mono font-bold text-[#0057FF] dark:text-[#408BFF]">
                          {reqItem.invoiceNumber}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                          {formatINR(reqItem.amountInr)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            reqItem.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : reqItem.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {reqItem.status}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Reason: {reqItem.reason}
                        {reqItem.requestedByEmail ? ` · By ${reqItem.requestedByEmail}` : ''}
                        {reqItem.resolutionNote ? ` · Review: ${reqItem.resolutionNote}` : ''}
                      </p>
                    </div>
                    {reqItem.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyKey === `refund-req-${reqItem.id}`}
                          onClick={() => void handleResolveRefundRequest(reqItem, 'approve')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve & Refund
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `refund-req-${reqItem.id}`}
                          onClick={() => void handleResolveRefundRequest(reqItem, 'reject')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-60 text-rose-700 dark:text-rose-300 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0057FF]" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Cross-Tenant SaaS Subscription GST Ledger (SAC 998314)
                  </h3>
                <p className="text-[11px] text-slate-500">
                  CGST {formatINR(billing.summary.cgstTotalInr || 0)} · SGST{' '}
                  {formatINR(billing.summary.sgstTotalInr || 0)} · IGST{' '}
                  {formatINR(billing.summary.igstTotalInr || 0)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                value={monthFilter}
                onChange={async (e) => {
                  const val = e.target.value;
                  setMonthFilter(val);
                  await refreshAll(val || 'all');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                title="Filter ledger & CA exports by month"
              />
              {monthFilter && (
                <button
                  type="button"
                  onClick={async () => {
                    setMonthFilter('');
                    await refreshAll('all');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                >
                  All Time
                </button>
              )}
              <button
                type="button"
                disabled={busyKey === 'csv-gstr1'}
                onClick={() => handleDownloadCsv('gstr1')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
              >
                {busyKey === 'csv-gstr1' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>GSTR-1 CSV</span>
              </button>
              <button
                type="button"
                disabled={busyKey === 'csv-tds'}
                onClick={() => handleDownloadCsv('tds')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-extrabold"
              >
                {busyKey === 'csv-tds' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Platform TDS CSV</span>
              </button>
            </div>
          </div>

          {/* Pending invoice status mutation modal bar */}
          {pendingInvAction && (
            <form
              onSubmit={handleConfirmInvoiceMutation}
              className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex flex-wrap items-end gap-3"
            >
              <div className="min-w-[200px]">
                <div className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                  {pendingInvAction.action.replace('_', ' ')} · {pendingInvAction.invoiceNumber}
                </div>
                <input
                  type="text"
                  required
                  value={invReason}
                  onChange={(e) => setInvReason(e.target.value)}
                  placeholder="Mandatory audit reason (e.g., NEFT settled / customer refund)..."
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-amber-400/50 text-xs"
                />
              </div>
              {pendingInvAction.action === 'mark_paid' && (
                <>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500">UTR / Ref</div>
                    <input
                      type="text"
                      value={invPayRef}
                      onChange={(e) => setInvPayRef(e.target.value)}
                      placeholder="UTR / Cheque #"
                      className="mt-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500">TDS (₹)</div>
                    <input
                      type="number"
                      min={0}
                      value={invTds}
                      onChange={(e) => setInvTds(e.target.value)}
                      className="mt-1 w-24 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                disabled={busyKey === 'inv-action'}
                className="px-4 py-2 rounded-xl bg-[#0057FF] text-white text-xs font-extrabold"
              >
                {busyKey === 'inv-action' ? 'Applying...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setPendingInvAction(null)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-500">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Customer Workspace</th>
                  <th className="py-3 px-3">Plan &amp; Tags</th>
                  <th className="py-3 px-3">Taxable</th>
                  <th className="py-3 px-3">18% GST</th>
                  <th className="py-3 px-3">Grand Total / TDS</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {billing.data.map((inv) => {
                  const gst =
                    (inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0);
                  const badge =
                    INVOICE_STATUS_BADGE[inv.status] || INVOICE_STATUS_BADGE.trial_complimentary;
                  return (
                    <tr
                      key={`${inv.tenantId}-${inv.id}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-IN') : ''} ·{' '}
                          {inv.paymentMode}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {inv.tenantName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{inv.accountId} {inv.buyerGstin ? `· GSTIN ${inv.buyerGstin}` : '· B2CS'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold capitalize">
                          {inv.planName} ({inv.billingCycle})
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {inv.couponCode && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[9px] font-bold">
                              {inv.couponCode}
                            </span>
                          )}
                          {inv.partnerCode && (
                            <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[9px] font-bold">
                              Ref: {inv.partnerCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">{formatINR(inv.baseAmount)}</td>
                      <td className="py-3 px-3 text-slate-500">{formatINR(gst)}</td>
                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900 dark:text-white">
                          {formatINR(inv.totalAmount)}
                        </div>
                        {(inv.tdsDeducted || 0) > 0 && (
                          <div className="text-[10px] text-amber-600 font-semibold">
                            TDS: {formatINR(inv.tdsDeducted || 0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {inv.status !== 'paid' && inv.status !== 'voided' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingInvAction({
                                  tenantId: inv.tenantId,
                                  invoiceId: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  action: 'mark_paid',
                                });
                                setInvReason('Offline NEFT/RTGS payment verified by HQ');
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold"
                              title="Mark invoice as Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          {inv.status === 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingInvAction({
                                  tenantId: inv.tenantId,
                                  invoiceId: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  action: 'refund',
                                });
                                setInvReason('');
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Refund
                            </button>
                          )}
                          {inv.status !== 'voided' && inv.status !== 'refunded' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingInvAction({
                                  tenantId: inv.tenantId,
                                  invoiceId: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  action: 'void',
                                });
                                setInvReason('');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 text-[10px] font-extrabold inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {billing.data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No subscription invoices match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MANUAL UPGRADE / OFFLINE DEAL / COMPLIMENTARY GRANT */}
      {subTab === 'issue' && (
        <form
          onSubmit={handleIssueSubscription}
          className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-[#0057FF]">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Manual Plan Upgrade, Offline NEFT/Cheque Deal &amp; Complimentary Grant
                </h3>
                <p className="text-xs text-slate-500">
                  Updates tenant plan, activates workspace, refreshes quotas &amp; issues a Rule-46 18% GST tax invoice.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-950 text-white text-right">
              <div className="text-[10px] uppercase text-slate-400 font-bold">
                Estimated Invoice Total (incl. 18% GST)
              </div>
              <div className="text-lg font-black text-emerald-400">
                {formatINR(previewGrand)}
                <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                  ({formatINR(previewBase)} + {formatINR(previewGst)} GST)
                </span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Customer Workspace *
              </label>
              <select
                required
                value={grantTenantId}
                onChange={(e) => setGrantTenantId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="">Select tenant...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (#{t.accountId} · {t.plan.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Target Plan</label>
              <select
                value={grantPlan}
                onChange={(e) =>
                  setGrantPlan(e.target.value as 'starter' | 'growth' | 'enterprise')
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Billing Cycle</label>
              <select
                value={grantCycle}
                onChange={(e) => setGrantCycle(e.target.value as 'monthly' | 'annual')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (2 months free)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Issuance Mode</label>
              <select
                value={grantMode}
                onChange={(e) =>
                  setGrantMode(e.target.value as 'paid_offline' | 'complimentary_grant')
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="paid_offline">Paid Offline (NEFT/RTGS/Cheque)</option>
                <option value="complimentary_grant">Complimentary HQ Grant (₹0)</option>
              </select>
            </div>
          </div>

          {grantMode === 'paid_offline' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Payment Mode
                </label>
                <input
                  type="text"
                  value={grantPaymentMode}
                  onChange={(e) => setGrantPaymentMode(e.target.value)}
                  placeholder="NEFT / RTGS / Cheque / UPI"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Bank UTR / Cheque Reference
                </label>
                <input
                  type="text"
                  value={grantPaymentRef}
                  onChange={(e) => setGrantPaymentRef(e.target.value)}
                  placeholder="UTR4391882710"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Custom Taxable Base ₹ (Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={grantCustomBase}
                  onChange={(e) => setGrantCustomBase(e.target.value)}
                  placeholder={`List Price (${listPlanBase})`}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  TDS Deducted by Buyer (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={grantTds}
                  onChange={(e) => setGrantTds(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Apply Promo Coupon (Optional)
              </label>
              <input
                type="text"
                list="leadsetu-coupons-list"
                value={grantCouponCode}
                onChange={(e) => setGrantCouponCode(e.target.value)}
                placeholder="e.g. LAUNCH20"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs uppercase font-mono"
              />
              <datalist id="leadsetu-coupons-list">
                {coupons.filter((c) => c.isActive).map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} ({c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`})
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Channel Partner Code (Optional)
              </label>
              <input
                type="text"
                list="leadsetu-partners-list"
                value={grantPartnerCode}
                onChange={(e) => setGrantPartnerCode(e.target.value)}
                placeholder="e.g. DELHI-CA-01"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs uppercase font-mono"
              />
              <datalist id="leadsetu-partners-list">
                {partners.filter((p) => p.isActive).map((p) => (
                  <option key={p.id} value={p.partnerCode}>
                    {p.partnerCode} — {p.name} ({p.commissionRatePct}%)
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Greeting / Invoice Remarks
              </label>
              <input
                type="text"
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="Printed on PDF tax invoice"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Enterprise annual PO #2026-88"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busyKey === 'issue-grant'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md"
          >
            {busyKey === 'issue-grant' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {grantMode === 'complimentary_grant'
                ? 'Grant Complimentary Plan & Attach GST Bill'
                : 'Upgrade Workspace & Issue Paid GST Invoice'}
            </span>
          </button>
        </form>
      )}

      {/* SUBTAB 3: COUPONS & PARTNER COMMISSIONS */}
      {subTab === 'growth' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Coupons */}
          <div className="space-y-4">
            <form
              onSubmit={handleCreateCoupon}
              className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0057FF]" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Promo Codes &amp; Annual Deal Coupons
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Code (LAUNCH20)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase"
                />
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as 'percent' | 'flat_inr')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="percent">% Discount</option>
                  <option value="flat_inr">Flat ₹ Off</option>
                </select>
                <input
                  type="number"
                  required
                  min={1}
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  placeholder="Value"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <select
                  value={couponCycle}
                  onChange={(e) =>
                    setCouponCycle(e.target.value as 'all' | 'monthly' | 'annual')
                  }
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="all">All Cycles</option>
                  <option value="annual">Annual Only</option>
                  <option value="monthly">Monthly Only</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={couponMaxRedeem}
                  onChange={(e) => setCouponMaxRedeem(e.target.value)}
                  placeholder="Max uses (0=∞)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="date"
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  placeholder="Campaign description (e.g., Diwali B2B Founder Promo)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="submit"
                  disabled={busyKey === 'create-coupon'}
                  className="px-4 py-2 rounded-xl bg-[#0057FF] text-white text-xs font-extrabold"
                >
                  {busyKey === 'create-coupon' ? 'Saving...' : 'Create Code'}
                </button>
              </div>
            </form>

            <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {c.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0057FF] dark:text-sky-300 text-[10px] font-extrabold">
                          {c.discountType === 'percent'
                            ? `${c.discountValue}% OFF`
                            : `${formatINR(c.discountValue)} OFF`}
                        </span>
                        <span className="text-[10px] uppercase text-slate-400">
                          {c.billingCycle}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Used {c.redemptionsCount}
                        {c.maxRedemptions > 0 ? ` / ${c.maxRedemptions}` : ''} · Discounted{' '}
                        {formatINR(c.totalDiscountGivenInr)}
                        {c.expiresAt ? ` · Exp ${c.expiresAt.slice(0, 10)}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busyKey === `coupon-${c.id}`}
                      onClick={() => handleToggleCoupon(c.id, !c.isActive)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold ${
                        c.isActive
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                ))}
                {coupons.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No promo coupons created yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Partners */}
          <div className="space-y-4">
            <form
              onSubmit={handleCreatePartner}
              className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Referral &amp; Channel Partner Commissions
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="Code (DELHI-CA-01)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase"
                />
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Partner / CA Firm Name"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="email"
                  required
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="Partner Email"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={partnerCity}
                  onChange={(e) => setPartnerCity(e.target.value)}
                  placeholder="Hub City"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={partnerRate}
                  onChange={(e) => setPartnerRate(e.target.value)}
                  placeholder="Comm %"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <button
                  type="submit"
                  disabled={busyKey === 'create-partner'}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold"
                >
                  {busyKey === 'create-partner' ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>

            {payoutTarget && (
              <form
                onSubmit={handleSettlePayout}
                className="rounded-2xl p-4 bg-violet-500/10 border border-violet-500/30 flex flex-wrap items-end gap-2"
              >
                <div className="flex-1 min-w-[160px]">
                  <div className="text-[10px] font-extrabold uppercase text-violet-600 dark:text-violet-300">
                    Settle Commission · {payoutTarget.name}
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payoutAmt}
                    onChange={(e) => setPayoutAmt(e.target.value)}
                    placeholder="Payout ₹"
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-violet-400/50 text-xs font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="NEFT / UPI Reference"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="submit"
                  disabled={busyKey === 'partner-payout'}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-extrabold"
                >
                  Record Payout
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutTarget(null)}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
              </form>
            )}

            <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[10px] font-bold">
                          {p.partnerCode} · {p.commissionRatePct}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Attributed {formatINR(p.totalAttributedRevenueInr)} ({p.referredTenantsCount}{' '}
                        deals) · Earned {formatINR(p.totalCommissionEarnedInr)} · Paid{' '}
                        {formatINR(p.totalCommissionPaidInr)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-600 dark:text-amber-300">
                        Due {formatINR(p.pendingPayoutInr)}
                      </div>
                      {p.pendingPayoutInr > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayoutTarget({
                              id: p.id,
                              name: p.name,
                              pending: p.pendingPayoutInr,
                            });
                            setPayoutAmt(String(p.pendingPayoutInr));
                          }}
                          className="mt-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-extrabold"
                        >
                          Settle Payout
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {partners.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No channel partners registered yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: AUTO-DUNNING & TRIAL WATCHLIST */}
      {subTab === 'dunning' && (
        <div className="space-y-5">
          <form
            onSubmit={handleSaveDunning}
            className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-500" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Auto-Dunning &amp; 14-Day Trial Expiry Automation
                  </h3>
                  {dunning.lastRunAt && (
                    <p className="text-[11px] text-slate-500">
                      Last sweep: {new Date(dunning.lastRunAt).toLocaleString('en-IN')} —{' '}
                      {dunning.lastRunSummary}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={busyKey === 'run-sweep'}
                onClick={handleRunSweep}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm"
              >
                {busyKey === 'run-sweep' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Run Trial &amp; Dunning Sweep Now</span>
              </button>
            </div>

            {sweepOutput && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <div className="font-extrabold text-amber-700 dark:text-amber-300">
                  {sweepOutput.summary}
                </div>
                {sweepOutput.actions.map((act, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300">
                    • {act.tenantName} (#{act.accountId}): {act.outcome}
                  </div>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={dunning.autoRemindersEnabled}
                  onChange={(e) =>
                    setDunning({ ...dunning, autoRemindersEnabled: e.target.checked })
                  }
                />
                <span>Enable Scheduled Reminders</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={dunning.whatsappTemplateEnabled}
                  onChange={(e) =>
                    setDunning({ ...dunning, whatsappTemplateEnabled: e.target.checked })
                  }
                />
                <span>WhatsApp Cloud Template Dispatch</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={dunning.emailReminderEnabled}
                  onChange={(e) =>
                    setDunning({ ...dunning, emailReminderEnabled: e.target.checked })
                  }
                />
                <span>Owner &amp; Billing Email Alert</span>
              </label>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Reminder Days Before Expiry (comma-separated)
                </label>
                <input
                  type="text"
                  value={reminderDaysInput}
                  onChange={(e) => setReminderDaysInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Grace Period After Trial End (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={dunning.gracePeriodDays}
                  onChange={(e) =>
                    setDunning({ ...dunning, gracePeriodDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Post-Grace Automated Enforcement
                </label>
                <select
                  value={dunning.autoActionOnExpiry}
                  onChange={(e) =>
                    setDunning({
                      ...dunning,
                      autoActionOnExpiry: e.target.value as DunningPolicyConfig['autoActionOnExpiry'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="pause_writes">Pause Outbound Broadcasts &amp; Webhooks</option>
                  <option value="downgrade_starter">Auto-Downgrade to Starter</option>
                  <option value="suspend">Suspend Workspace Access</option>
                  <option value="notify_only">Notify HQ Only (No Lock)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                WhatsApp / Email Dunning Message Template
              </label>
              <textarea
                rows={2}
                value={dunning.reminderMessageTemplate}
                onChange={(e) =>
                  setDunning({ ...dunning, reminderMessageTemplate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={busyKey === 'save-dunning'}
              className="px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold"
            >
              {busyKey === 'save-dunning' ? 'Saving...' : 'Save Dunning Policy'}
            </button>
          </form>

          <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 text-xs font-extrabold text-slate-900 dark:text-white">
              Active Trial Workspaces Watchlist ({trialWatchlist.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-500">
                    <th className="py-2.5 px-4">Workspace</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Trial Ends</th>
                    <th className="py-2.5 px-3">Days Left</th>
                    <th className="py-2.5 px-4 text-right">Dunning State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {trialWatchlist.map((tr) => (
                    <tr key={tr.tenantId}>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                        {tr.tenantName}{' '}
                        <span className="font-mono text-[10px] text-slate-400">
                          #{tr.accountId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 uppercase font-semibold">{tr.plan}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(tr.trialEndsAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-black">
                        {tr.daysRemaining >= 0 ? `${tr.daysRemaining}d left` : `${Math.abs(tr.daysRemaining)}d overdue`}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            tr.health === 'overdue'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : tr.health === 'in_grace'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : tr.health === 'expiring_soon'
                                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {tr.health.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {trialWatchlist.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        All customer workspaces are currently on active/paid plans.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditLogsView({
  logs,
  stats,
  severity,
  onSeverityChange,
  search,
  onSearchChange,
}: {
  logs: PlatformAuditLogItem[];
  stats: { total: number; critical: number; warning: number };
  severity: string;
  onSeverityChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold">
          <FileClock className="w-4 h-4 text-[#0057FF]" />
          <span className="text-slate-900 dark:text-white">
            Immutable Authority Logs ({stats.total})
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px]">
            {stats.critical} Critical
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px]">
            {stats.warning} Warning
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search action, actor, tenant..."
              className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>
          <select
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {logs.map((log) => (
          <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    log.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      : log.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-500/20 text-blue-600 dark:text-sky-300'
                  }`}
                >
                  {log.severity}
                </span>
                <span className="font-mono text-[11px] font-bold text-[#0057FF] dark:text-sky-400">
                  {log.action}
                </span>
                {log.targetTenantName && (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Target: {log.targetTenantName} (#{log.targetAccountId})
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {log.summary}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Actor: <strong>{log.actorName}</strong> ({log.actorEmail})
                </span>
                {log.reason && (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {log.reason}
                  </span>
                )}
                {log.ipAddress && <span className="font-mono">IP: {log.ipAddress}</span>}
              </div>
            </div>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              {new Date(log.createdAt).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-10 text-center text-xs text-slate-400">
            No platform audit events match your filter.
          </div>
        )}
      </div>
    </div>
  );
}

export function OperatorsView({
  operators,
  onUpdated,
}: {
  operators: SuperAdminOperatorItem[];
  onUpdated: (next: SuperAdminOperatorItem[]) => void;
}) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [territory, setTerritory] = useState('Leadsetu HQ Authority');
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const [revokePassword, setRevokePassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createSuperAdminOperatorApi({
        name,
        email,
        phone,
        password,
        territory,
      });
      onUpdated(res.data);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setToast('New HQ Super Admin operator provisioned with Vault access.');
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id: string, nextActive: boolean, email = '') => {
    if (!nextActive) {
      setRevokeTarget({ id, email });
      setRevokePassword('');
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await toggleSuperAdminOperatorStatusApi(id, nextActive);
      onUpdated(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRevokeOperator = async (e: FormEvent) => {
    e.preventDefault();
    if (!revokeTarget) return;
    setBusy(true);
    setError(null);
    try {
      const res = await toggleSuperAdminOperatorStatusApi(
        revokeTarget.id,
        false,
        revokePassword
      );
      onUpdated(res.data);
      setRevokeTarget(null);
      setRevokePassword('');
      setToast(`Revoked HQ operator access for ${revokeTarget.email}.`);
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0057FF]" />
          Authorized Leadsetu HQ Super Admin Operators
        </h3>

        {revokeTarget && (
          <form
            onSubmit={handleConfirmRevokeOperator}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-wrap items-center gap-2"
          >
            <div className="flex-1 min-w-[200px] text-xs font-bold text-rose-600 dark:text-rose-300">
              Confirm password to revoke <span className="underline">{revokeTarget.email}</span>
            </div>
            <input
              type="password"
              required
              value={revokePassword}
              onChange={(e) => setRevokePassword(e.target.value)}
              placeholder="Your Super Admin password"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-rose-400/50 text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-extrabold"
            >
              Confirm Revoke
            </button>
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {operators.map((op) => {
            const isSelf = op.id === user?.id;
            return (
              <div
                key={op.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {op.name}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      UID #{op.userCode}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0057FF] dark:text-sky-400">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {op.email} · {op.territory}
                  </div>
                </div>

                {!isSelf && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggle(op.id, !op.isActive, op.email)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                      op.isActive
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                    }`}
                  >
                    {op.isActive ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-500" />
          Provision New Super Admin Operator
        </h3>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600">
            {error}
          </div>
        )}
        {toast && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-600">
            {toast}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="HQ Work Email (e.g., security@leadsetu.in)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile (+91 ...)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
          />
          <input
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Strong Password (min 10 characters)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
          />
          <input
            type="text"
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            placeholder="HQ Authority Title"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Grant Super Admin Authority</span>
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  HardDrive,
  HeartHandshake,
  Loader2,
  MapPin,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchBillingSummaryApi,
  fetchBillingUsageApi,
  validateBillingCouponApi,
  createBillingCheckoutOrderApi,
  authorizeBillingSandboxOrderApi,
  verifyBillingCheckoutPaymentApi,
  cancelBillingSubscriptionApi,
  resumeBillingAutoRenewalApi,
  scheduleBillingDowngradeApi,
  createBillingRefundRequestApi,
  type BillingSummaryResponse,
  type BillingUsageDashboardResponse,
  type BillingCouponValidationResponse,
  type BillingCheckoutOrderResponse,
} from '@/lib/tenants-api';
import { downloadSubscriptionInvoicePdf } from '@/lib/subscription-pdf';
import { getErrorMessage } from '@/lib/api-client';
import BillingNavTabs from '@/components/settings/BillingNavTabs';
import SubscriptionInvoiceModal from '@/components/settings/SubscriptionInvoiceModal';
import type { SubscriptionInvoice } from '@/types/contracts';

const GREETING_TEMPLATES = [
  {
    id: 'executive',
    label: 'Executive Appreciation',
    text: (company: string, planName: string) =>
      `Dear ${company} Team, thank you for choosing Leadsetu to bridge every B2B lead, deal, and GST workflow! Your ${planName} empowers your organization with AI Lead Scoring, WhatsApp Cloud Inbox & 18% GST ITC compliance. Warm regards, Team Leadsetu (New Delhi).`,
  },
  {
    id: 'growth',
    label: 'Partner Success Welcome',
    text: (company: string, planName: string) =>
      `Warm greetings from Leadsetu Technologies! We are honored to partner with ${company} on the ${planName}. Thank you for trusting India's B2B Revenue & GST CRM — our New Delhi engineering desk is always with you!`,
  },
  {
    id: 'festive',
    label: 'Founder Thank-You Note',
    text: (company: string, planName: string) =>
      `Thank you ${company} for choosing Leadsetu (${planName})! Wishing your sales & accounts teams record conversions and smooth GST settlements all year ahead. — Anjali Yadav & Team Leadsetu, New Delhi.`,
  },
];

export default function BillingSettingsPage() {
  const router = useRouter();
  const { user, tenant, updateProfile } = useAuthStore();

  const [billing, setBilling] = useState<BillingSummaryResponse | null>(null);
  const [usage, setUsage] = useState<BillingUsageDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  );
  const [greetingMode, setGreetingMode] = useState<string>('executive');
  const [customGreeting, setCustomGreeting] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<
    BillingCouponValidationResponse['coupon'] | null
  >(null);
  const [checkoutOrder, setCheckoutOrder] =
    useState<BillingCheckoutOrderResponse | null>(null);
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState(
    'Razorpay UPI (Instant VPA / QR)',
  );
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);
  const [isUpdatingLifecycle, setIsUpdatingLifecycle] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [downgradeTarget, setDowngradeTarget] = useState<'starter' | 'growth'>(
    'starter',
  );
  const [refundModalInvoice, setRefundModalInvoice] =
    useState<SubscriptionInvoice | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [previewInvoice, setPreviewInvoice] =
    useState<SubscriptionInvoice | null>(null);
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'plan' | 'addon'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageBilling =
    user?.role === 'owner' || user?.role === 'admin' || !user?.role;

  const loadBilling = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, usageRes] = await Promise.all([
        fetchBillingSummaryApi(),
        fetchBillingUsageApi().catch(() => null),
      ]);
      setBilling(res);
      if (usageRes) setUsage(usageRes);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        updateProfile({ user: currentUser, tenant: res.tenant });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setIsValidatingCoupon(true);
    setError(null);
    try {
      const targetPlan = (billing?.tenant.plan ||
        tenant?.plan ||
        'growth') as 'starter' | 'growth' | 'enterprise';
      const res = await validateBillingCouponApi({
        code,
        plan: targetPlan,
        billingCycle,
      });
      setAppliedCoupon(res.coupon);
      setCouponInput(res.coupon.code);
      setToast(
        `Promo code ${res.coupon.code} applied! (${res.coupon.description})`,
      );
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setAppliedCoupon(null);
      setError(getErrorMessage(err));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const computePlanPreviewPricing = (listBase: number, proratedCredit = 0) => {
    const afterProration = Math.max(0, listBase - Math.max(0, proratedCredit));
    let discountAmount = 0;
    if (appliedCoupon) {
      discountAmount =
        appliedCoupon.discountType === 'percent'
          ? Math.round((afterProration * appliedCoupon.discountValue) / 100)
          : Math.round(appliedCoupon.discountValue);
      discountAmount = Math.min(afterProration, Math.max(0, discountAmount));
    }
    const netBase = Math.max(0, afterProration - discountAmount);
    const gst = Math.round(netBase * 0.18);
    const total = netBase + gst;
    return { listBase, proratedCredit, discountAmount, netBase, gst, total };
  };

  const buildGreetingForPlan = (planName: string) => {
    const company = tenant?.name || 'Valued Partner';
    const selectedTpl = GREETING_TEMPLATES.find((g) => g.id === greetingMode);
    return greetingMode === 'custom' && customGreeting.trim()
      ? customGreeting.trim()
      : (selectedTpl || GREETING_TEMPLATES[0]).text(company, planName);
  };

  const handleStartCheckout = async (
    planId: 'starter' | 'growth' | 'enterprise',
    planName: string,
  ) => {
    setActivatingPlan(planId);
    setError(null);
    try {
      const greetingNote = buildGreetingForPlan(planName);
      const order = await createBillingCheckoutOrderApi({
        plan: planId,
        billingCycle,
        couponCode: appliedCoupon?.code || undefined,
        greetingNote,
      });

      const win =
        typeof window !== 'undefined'
          ? (window as unknown as {
              Razorpay?: new (opts: Record<string, unknown>) => {
                open: () => void;
              };
            })
          : null;

      if (order.mode === 'razorpay_live' && win?.Razorpay) {
        const rzpInstance = new win.Razorpay({
          key: order.keyId,
          amount: order.amountPaise,
          currency: order.currency,
          name: 'Leadsetu Cloud CRM',
          description: `${order.planName} (${order.billingCycle}) Subscription`,
          order_id: order.orderId,
          prefill: {
            name: order.prefill.name,
            email: order.prefill.email,
            contact: order.prefill.contact,
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verified = await verifyBillingCheckoutPaymentApi({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMode: 'Razorpay Live Checkout',
              greetingNote,
            });
            setBilling(verified);
            if (user) {
              updateProfile({ user, tenant: verified.tenant });
            }
            if (verified.latestInvoice) {
              setPreviewInvoice(verified.latestInvoice);
            }
            setToast(
              `Razorpay payment ${verified.paymentId} verified! GST Invoice ${
                verified.latestInvoice?.invoiceNumber || ''
              } attached to workspace.`,
            );
            setTimeout(() => setToast(null), 5000);
          },
        });
        rzpInstance.open();
      } else {
        setCheckoutOrder(order);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActivatingPlan(null);
    }
  };

  const handleCompleteCheckoutModal = async () => {
    if (!checkoutOrder || isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    setError(null);
    try {
      const greetingNote = buildGreetingForPlan(checkoutOrder.planName);
      const authPay = await authorizeBillingSandboxOrderApi({
        razorpayOrderId: checkoutOrder.orderId,
        paymentMode: checkoutPaymentMode,
      });

      const verified = await verifyBillingCheckoutPaymentApi({
        razorpayOrderId: authPay.razorpayOrderId,
        razorpayPaymentId: authPay.razorpayPaymentId,
        razorpaySignature: authPay.razorpaySignature,
        paymentMode: authPay.paymentMode,
        greetingNote,
      });

      setBilling(verified);
      setCheckoutOrder(null);
      if (user) {
        updateProfile({ user, tenant: verified.tenant });
      }
      if (verified.latestInvoice) {
        setPreviewInvoice(verified.latestInvoice);
      }
      void fetchBillingUsageApi()
        .then((u) => setUsage(u))
        .catch(() => null);
      setToast(
        `${checkoutOrder.planName} (${checkoutOrder.billingCycle}) activated via Razorpay (${verified.paymentId})! GST Tax Invoice ${
          verified.latestInvoice?.invoiceNumber || ''
        } attached.`,
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleCancelAutoRenewal = async () => {
    if (!canManageBilling) return;
    setIsUpdatingLifecycle(true);
    setError(null);
    try {
      await cancelBillingSubscriptionApi({
        reason: cancelReason.trim() || undefined,
      });
      await loadBilling();
      setCancelReason('');
      setToast(
        'Auto-renewal paused/cancelled at period end. Workspace access continues until cycle expiry.',
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdatingLifecycle(false);
    }
  };

  const handleResumeAutoRenewal = async () => {
    if (!canManageBilling) return;
    setIsUpdatingLifecycle(true);
    setError(null);
    try {
      await resumeBillingAutoRenewalApi();
      await loadBilling();
      setToast('Auto-renewal resumed! Pending cancellation or downgrade cleared.');
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdatingLifecycle(false);
    }
  };

  const handleScheduleDowngrade = async () => {
    if (!canManageBilling) return;
    setIsUpdatingLifecycle(true);
    setError(null);
    try {
      await scheduleBillingDowngradeApi({
        targetPlan: downgradeTarget,
        billingCycle,
        reason: cancelReason.trim() || undefined,
      });
      await loadBilling();
      setCancelReason('');
      setToast(
        `Scheduled downgrade to ${downgradeTarget.toUpperCase()} (${billingCycle}) at period end.`,
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdatingLifecycle(false);
    }
  };

  const handleSubmitRefundRequest = async () => {
    if (!refundModalInvoice || refundReason.trim().length < 5) return;
    setIsSubmittingRefund(true);
    setError(null);
    try {
      await createBillingRefundRequestApi({
        invoiceId: refundModalInvoice.id,
        reason: refundReason.trim(),
      });
      await loadBilling();
      setToast(
        `GST Credit Note / Refund request submitted for ${refundModalInvoice.invoiceNumber} to Super Admin HQ.`,
      );
      setRefundModalInvoice(null);
      setRefundReason('');
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const activePlan = billing?.tenant.plan || tenant?.plan || 'growth';
  const invoices = billing?.invoices || [];
  const filteredInvoices = invoices.filter((inv) => {
    const isAddon = String(inv.invoiceNumber || '').startsWith('LS-ADDON');
    if (invoiceFilter === 'plan') return !isAddon;
    if (invoiceFilter === 'addon') return isAddon;
    return true;
  });
  const latestInv = invoices[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
        </button>

        <Link
          href="/settings"
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue transition-colors"
        >
          Workspace Settings Hub
        </Link>
      </div>

      <BillingNavTabs
        aiExceeded={Boolean(usage?.aiCalls && usage.aiCalls.remaining <= 0)}
        aiRemaining={usage?.aiCalls.remaining}
      />

      {toast && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/60 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Active Subscription & Leadsetu Supplier Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
        style={{
          background:
            'linear-gradient(135deg, #091224 0%, #172B56 52%, #1E50B5 100%)',
        }}
      >
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
              <Sparkles className="w-3 h-3 text-sky-300" />
              Active Workspace Plan &amp; GST Invoices
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold capitalize">
                {activePlan} Plan Subscription
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-[11px] font-extrabold text-emerald-200">
                18% GST ITC Eligible
              </span>
            </div>
            <p className="text-xs text-slate-200/90 max-w-2xl">
              Every plan purchased from Leadsetu automatically generates an official
              GST Tax Invoice with Leadsetu&apos;s New Delhi registered address &amp;
              welcome greeting attached permanently to{' '}
              <strong>{tenant?.name || 'your workspace profile'}</strong>.
            </p>
          </div>

          {latestInv && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewInvoice(latestInv)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-colors"
              >
                <Eye className="w-4 h-4 text-sky-300" />
                View Latest Invoice
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadSubscriptionInvoicePdf(latestInv, user?.name)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-extrabold text-white shadow-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF ({latestInv.invoiceNumber})
              </button>
            </div>
          )}
        </div>

        {/* Leadsetu Address & Buyer Profile Summary Bar */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/15 text-xs">
          <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-4 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-300" />
              Supplier Address on Your GST Invoices
            </div>
            <div className="font-extrabold text-white">
              {billing?.seller.sellerCompany ||
                'Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)'}
            </div>
            <div className="text-slate-200/90">
              {billing?.seller.sellerAddress ||
                'Tower B, 7th Floor, Sector 62, Noida Electronic City, UP – 201309, India'}
            </div>
            <div className="font-mono text-[11px] text-emerald-300">
              GSTIN: {billing?.seller.sellerGstin || '07AABCL4821K1Z5'} · SAC 998314
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-4 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              Billed To Profile &amp; Seat Utilization
            </div>
            <div className="font-extrabold text-white">
              {tenant?.companyName?.trim() || 'Leadsetu Workspace'} ·{' '}
              <span className="font-mono text-sky-200">
                {tenant?.gstin || 'Update GSTIN in Settings'}
              </span>
            </div>
            <div className="text-slate-200/90">
              {tenant?.address || tenant?.city || 'Delhi-NCR'} ·{' '}
              {billing
                ? `${billing.usage.activeSeats} / ${billing.usage.seatLimit} Seats Used`
                : 'Loading seats...'}
            </div>
            <div className="text-[11px] text-sky-200">
              Attached Invoices on Profile: <strong>{invoices.length} PDF(s)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Metered Entitlements, Renewal Countdown & Instant Top-Up Dashboard */}
      {usage && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          {/* Top Dunning & Renewal Countdown Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-brand-navy flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-blue" />
                  Metered Entitlements &amp; Live Usage
                </h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    usage.renewal.dunningState === 'past_due_action_required'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : usage.renewal.dunningState === 'grace_period'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : usage.renewal.dunningState === 'expiring_soon'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {usage.renewal.dunningState === 'past_due_action_required'
                    ? 'Expired Beyond Grace'
                    : usage.renewal.dunningState === 'grace_period'
                      ? `Grace Period (${usage.renewal.gracePeriodDays}d Window)`
                      : usage.renewal.dunningState === 'expiring_soon'
                        ? 'Expiring Soon'
                        : 'Billing Good Standing'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Real-time telemetry across Seats, SetuAI Calls, Official WhatsApp Cloud Broadcasts, and Vault Storage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div
                className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 ${
                  usage.renewal.daysRemaining <= 3
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-brand-navy'
                }`}
              >
                <CalendarClock className="w-4 h-4 text-brand-blue shrink-0" />
                <div>
                  <div className="font-extrabold">
                    {usage.renewal.daysRemaining >= 0
                      ? `${usage.renewal.daysRemaining} day(s) until renewal`
                      : `${Math.abs(usage.renewal.daysRemaining)} day(s) overdue`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Period ends {usage.renewal.periodEnd} · Grace:{' '}
                    {usage.renewal.gracePeriodDays}d ({usage.renewal.autoActionOnExpiry.replace(/_/g, ' ')})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void loadBilling()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy hover:border-brand-blue"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-blue" /> Refresh
              </button>
            </div>
          </div>

          {(usage.renewal.inGracePeriod || usage.renewal.expiredBeyondGrace) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold">
                    Subscription Renewal &amp; Dunning Alert
                  </div>
                  <p className="text-[11px] mt-0.5">
                    Your workspace period ended on {usage.renewal.periodEnd}. Renew via Razorpay below within the{' '}
                    {usage.renewal.gracePeriodDays}-day grace window to prevent auto-action ({usage.renewal.autoActionOnExpiry.replace(/_/g, ' ')}).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4 Quota Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 1. Seats */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-blue" /> Team Seats
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {usage.seats.pct}% used
                </span>
              </div>
              <div className="text-xl font-extrabold text-brand-navy">
                {usage.seats.used}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  / {usage.seats.limit} active
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.seats.alertLevel === 'exceeded'
                      ? 'bg-rose-500'
                      : usage.seats.alertLevel === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-brand-blue'
                  }`}
                  style={{ width: `${usage.seats.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>{usage.seats.remaining} seats free</span>
                <span>{usage.seats.totalInvited} total users</span>
              </div>
            </div>

            {/* 2. Monthly AI Calls */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> SetuAI Calls
                </span>
                {usage.aiCalls.addonBalance > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    +{usage.aiCalls.addonBalance.toLocaleString('en-IN')} Add-on
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500">
                    {usage.aiCalls.pct}% used
                  </span>
                )}
              </div>
              <div className="text-xl font-extrabold text-brand-navy">
                {usage.aiCalls.used.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  / {usage.aiCalls.limit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.aiCalls.alertLevel === 'exceeded'
                      ? 'bg-rose-500'
                      : usage.aiCalls.alertLevel === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                  }`}
                  style={{ width: `${usage.aiCalls.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>{usage.aiCalls.remaining.toLocaleString('en-IN')} left</span>
                <span>Est. ₹{usage.aiCalls.estimatedCostInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* 3. WhatsApp Broadcasts */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Cloud
                </span>
                {usage.whatsapp.addonBalance > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    +{usage.whatsapp.addonBalance.toLocaleString('en-IN')} Add-on
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500">
                    {usage.whatsapp.pct}% used
                  </span>
                )}
              </div>
              <div className="text-xl font-extrabold text-brand-navy">
                {usage.whatsapp.used.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  / {usage.whatsapp.limit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.whatsapp.alertLevel === 'exceeded'
                      ? 'bg-rose-500'
                      : usage.whatsapp.alertLevel === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                  }`}
                  style={{ width: `${usage.whatsapp.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>{usage.whatsapp.remaining.toLocaleString('en-IN')} left</span>
                <span>Est. ₹{usage.whatsapp.estimatedCostInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* 4. Vault & CRM Storage */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy inline-flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-sky-600" /> Cloud Storage
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {usage.storage.pct}% used
                </span>
              </div>
              <div className="text-xl font-extrabold text-brand-navy">
                {usage.storage.usedMb.toLocaleString('en-IN')} MB{' '}
                <span className="text-xs font-semibold text-slate-500">
                  / {usage.storage.limitMb.toLocaleString('en-IN')} MB
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.storage.alertLevel === 'exceeded'
                      ? 'bg-rose-500'
                      : usage.storage.alertLevel === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-sky-600'
                  }`}
                  style={{ width: `${usage.storage.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {usage.storage.recordsBreakdown.documentsCount} Docs ·{' '}
                {usage.storage.recordsBreakdown.leadsCount} Leads ·{' '}
                {usage.storage.recordsBreakdown.invoicesCount} Invoices
              </div>
            </div>
          </div>

          {/* Quick Redirect to Page 2: AI Credit & Quota Top-Up Purchases */}
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-brand-navy dark:text-white">
                  Need More AI Credits? Top Up on the Dedicated AI Credits Page
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {usage.aiCalls.remaining <= 0
                    ? 'Your monthly AI credits are exhausted. Buy an AI Credit Top-Up pack to resume AI features immediately.'
                    : `${usage.aiCalls.remaining.toLocaleString('en-IN')} AI credits remaining. Manage AI & WhatsApp top-up packs and credit invoices separately.`}
                </p>
              </div>
            </div>
            <Link
              href="/settings/billing/ai-credits"
              className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white shrink-0"
            >
              <span>Go to AI Credits &amp; Top-Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Choose / Upgrade Subscription Plan + Greeting Studio */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-brand-navy flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-blue" />
              Choose or Upgrade Your Leadsetu Subscription Plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only one active plan runs at a time — switching to another plan immediately replaces previous plan benefits &amp; quotas and archives a GST Tax Invoice PDF.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 p-1 bg-slate-100 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-brand-blue text-brand-navy dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-brand-blue text-brand-navy dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        {/* Greeting Message Selector printed on the Invoice PDF */}
        <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-brand-navy inline-flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-brand-blue" />
              Leadsetu Welcome Greeting Printed on Attached Invoice PDF:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GREETING_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setGreetingMode(tpl.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    greetingMode === tpl.id
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGreetingMode('custom')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  greetingMode === 'custom'
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-white dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                }`}
              >
                Custom Greeting
              </button>
            </div>
          </div>

          {greetingMode === 'custom' ? (
            <input
              type="text"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              placeholder="Write custom welcome & appreciation message to print on your Leadsetu GST Invoice PDF..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
              &ldquo;
              {(
                GREETING_TEMPLATES.find((g) => g.id === greetingMode) ||
                GREETING_TEMPLATES[0]
              ).text(tenant?.name || 'Your Company', 'Selected Plan')}
              &rdquo;
            </p>
          )}
        </div>

        {/* Promo / Coupon Code Redemption Bar */}
        <div className="rounded-2xl p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-extrabold text-brand-navy dark:text-white inline-flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              Have a Leadsetu Promo or Partner Coupon Code?
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Discounts are deducted on base plan value before 18% GST calculation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Enter Promo Code (e.g. LAUNCH20)"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 text-xs font-mono font-bold uppercase text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
            />
            <button
              type="button"
              disabled={isValidatingCoupon || !couponInput.trim()}
              onClick={() => void handleApplyCoupon()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isValidatingCoupon ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Apply Coupon
            </button>
            {appliedCoupon && (
              <button
                type="button"
                onClick={handleClearCoupon}
                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
              >
                Remove ({appliedCoupon.code})
              </button>
            )}
          </div>
        </div>

        {/* 3 Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(billing?.plans || []).map((plan) => {
            const isCurrent = activePlan === plan.id;
            const listPrice =
              billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const pro = billing?.proration?.[plan.id];
            const proratedCredit = pro?.isUpgrade ? pro.proratedCreditInr : 0;
            const calc = computePlanPreviewPricing(listPrice, proratedCredit);

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between gap-4 transition-all ${
                  isCurrent
                    ? 'border-brand-blue bg-brand-light/40 dark:bg-brand-blue/10 ring-1 ring-brand-blue/40'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-brand-navy">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold">
                        ACTIVE PLAN
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      {(calc.discountAmount > 0 || calc.proratedCredit > 0) && (
                        <span className="text-sm font-bold text-slate-400 line-through">
                          ₹{calc.listBase.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-2xl font-extrabold text-brand-navy">
                        ₹{calc.netBase.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        /{billingCycle === 'annual' ? 'year' : 'month'} + GST
                      </span>
                    </div>
                    {calc.proratedCredit > 0 && pro && (
                      <div className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400">
                        Upgrade Prorated Credit ({pro.daysRemaining}d left): -₹
                        {calc.proratedCredit.toLocaleString('en-IN')}
                      </div>
                    )}
                    {calc.discountAmount > 0 && appliedCoupon && (
                      <div className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        Coupon {appliedCoupon.code}: -₹
                        {calc.discountAmount.toLocaleString('en-IN')} saved before GST
                      </div>
                    )}
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Total incl. 18% GST (₹{calc.gst.toLocaleString('en-IN')}):{' '}
                      <strong className="text-brand-navy dark:text-white">
                        ₹{calc.total.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs">
                    {plan.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={!canManageBilling || activatingPlan === plan.id}
                  onClick={() => void handleStartCheckout(plan.id, plan.name)}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all inline-flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'btn-primary-brand text-white'
                  } disabled:opacity-50`}
                >
                  {activatingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {isCurrent
                    ? `Renew via Razorpay (₹${calc.total.toLocaleString('en-IN')})`
                    : `Checkout ${plan.name} (₹${calc.total.toLocaleString('en-IN')})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Self-Serve Subscription Lifecycle (Auto-Renewal, Downgrade & GST Credit Note Requests) */}
      <div className="bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-brand-blue" />
              Subscription Auto-Renewal, Downgrade &amp; Refund Controls
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pause/cancel auto-renewal at period end, schedule a lower tier for next cycle, or track GST Credit Note requests.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
              billing?.lifecycle?.autoRenew === false
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {billing?.lifecycle?.autoRenew === false
              ? 'Auto-Renewal Paused (Period End)'
              : 'Auto-Renewal Active'}
          </span>
        </div>

        {(billing?.lifecycle?.cancelAtPeriodEnd ||
          billing?.lifecycle?.scheduledDowngradePlan) && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              {billing.lifecycle.scheduledDowngradePlan ? (
                <span>
                  Scheduled downgrade to{' '}
                  <strong className="uppercase">
                    {billing.lifecycle.scheduledDowngradePlan}
                  </strong>{' '}
                  ({billing.lifecycle.scheduledDowngradeCycle || billingCycle}) at cycle end.
                </span>
              ) : (
                <span>
                  Cancellation scheduled at period end. Workspace retains full access until expiry.
                </span>
              )}
              {billing.lifecycle.cancellationReason && (
                <span className="ml-2 text-amber-700/80 dark:text-amber-300/80">
                  · Note: {billing.lifecycle.cancellationReason}
                </span>
              )}
            </div>
            {canManageBilling && (
              <button
                type="button"
                disabled={isUpdatingLifecycle}
                onClick={() => void handleResumeAutoRenewal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Resume Auto-Renewal
              </button>
            )}
          </div>
        )}

        {canManageBilling && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 space-y-3 bg-slate-50/70 dark:bg-white/[0.02]">
              <div className="text-xs font-extrabold text-brand-navy dark:text-white">
                Pause / Cancel Auto-Renewal at Period End
              </div>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Optional reason (e.g., seasonal pause, switching cycle)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs text-brand-navy dark:text-white outline-none focus:border-brand-blue"
              />
              <div className="flex flex-wrap gap-2">
                {billing?.lifecycle?.autoRenew !== false ? (
                  <button
                    type="button"
                    disabled={isUpdatingLifecycle}
                    onClick={() => void handleCancelAutoRenewal()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold disabled:opacity-50"
                  >
                    {isUpdatingLifecycle ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PauseCircle className="w-3.5 h-3.5" />
                    )}
                    Pause / Cancel at Period End
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingLifecycle}
                    onClick={() => void handleResumeAutoRenewal()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Resume Auto-Renewal
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 space-y-3 bg-slate-50/70 dark:bg-white/[0.02]">
              <div className="text-xs font-extrabold text-brand-navy dark:text-white">
                Schedule Lower-Tier Downgrade (Effective Next Cycle)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={downgradeTarget}
                  onChange={(e) =>
                    setDowngradeTarget(e.target.value as 'starter' | 'growth')
                  }
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs font-bold text-brand-navy dark:text-white outline-none"
                >
                  <option value="starter">Starter Plan (₹999/mo)</option>
                  {activePlan === 'enterprise' && (
                    <option value="growth">Growth Plan (₹2,399/mo)</option>
                  )}
                </select>
                <button
                  type="button"
                  disabled={isUpdatingLifecycle || activePlan === 'starter'}
                  onClick={() => void handleScheduleDowngrade()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/20 hover:border-brand-blue text-xs font-extrabold text-brand-navy dark:text-white disabled:opacity-50"
                >
                  Schedule Downgrade
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Available for Growth and Enterprise workspaces. Current entitlements remain active until renewal date.
              </p>
            </div>
          </div>
        )}

        {(billing?.refundRequests || []).length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="text-xs font-extrabold text-brand-navy dark:text-white">
              GST Credit Note &amp; Refund Requests
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/10 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
              {(billing?.refundRequests || []).map((req) => (
                <div
                  key={req.id}
                  className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <div>
                    <span className="font-mono font-bold text-brand-navy dark:text-white">
                      {req.invoiceNumber}
                    </span>{' '}
                    <span className="text-slate-500">
                      (₹{req.amountInr.toLocaleString('en-IN')}) — {req.reason}
                    </span>
                    {req.resolutionNote && (
                      <span className="ml-2 text-slate-400">
                        · {req.resolutionNote}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      req.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : req.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attached Subscription Invoices Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-brand-blue" />
            <div>
              <h2 className="text-base font-extrabold text-brand-navy">
                Attached Subscription GST Invoices ({invoices.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every Leadsetu plan invoice is archived on your workspace profile
                for GST audits and PDF download.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/[0.04] text-[11px] font-bold">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'plan', label: 'Platform Plans' },
                  { id: 'addon', label: 'AI & Top-Ups' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInvoiceFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    invoiceFilter === tab.id
                      ? 'bg-white dark:bg-brand-blue text-brand-navy dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/50 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Leadsetu Verified Tax Receipts
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Select any plan above to generate your first GST Tax Invoice PDF.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {filteredInvoices.map((inv) => {
              const isAddonInv = String(inv.invoiceNumber || '').startsWith('LS-ADDON');
              const paidTimestamp = inv.issuedAt
                ? new Date(inv.issuedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : '';
              return (
              <div
                key={inv.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-brand-blue">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                      {isAddonInv
                        ? 'AI Credit / Top-Up'
                        : `${inv.planName} (${inv.billingCycle})`}
                    </span>
                    {paidTimestamp && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-brand-blue" />
                        {paidTimestamp}
                      </span>
                    )}
                    {inv.couponCode && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                        Promo {inv.couponCode} (-₹
                        {(inv.discountAmount || 0).toLocaleString('en-IN')})
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        inv.status === 'refunded'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50'
                      }`}
                    >
                      {inv.status === 'paid'
                        ? 'Paid in Full'
                        : inv.status === 'refunded'
                          ? 'Refunded'
                          : 'Trial Receipt'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Period:{' '}
                      <strong className="text-brand-navy">
                        {inv.periodStart} → {inv.periodEnd}
                      </strong>
                    </span>
                    <span>
                      Mode: <strong>{inv.paymentMode}</strong>
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Ref: {inv.paymentReference}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    From: {inv.sellerCompany} ({inv.sellerAddress}) · &ldquo;
                    {inv.greetingNote}&rdquo;
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-brand-navy">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Base ₹{inv.baseAmount.toLocaleString('en-IN')} + 18% GST
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewInvoice(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-brand-blue text-xs font-bold text-brand-navy dark:text-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-blue" /> Preview
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadSubscriptionInvoicePdf(inv, user?.name)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>

                  {inv.status === 'paid' && canManageBilling && (
                    <button
                      type="button"
                      onClick={() => {
                        setRefundModalInvoice(inv);
                        setRefundReason('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300/80 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 text-xs font-bold text-amber-800 dark:text-amber-200 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Credit Note / Refund
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Razorpay Order Checkout & HMAC-SHA256 Verification Modal */}
      {checkoutOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden my-6">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #091224 0%, #1E50B5 100%)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-sky-300" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    Leadsetu × Razorpay Secure B2B Checkout
                  </h3>
                  <p className="text-[11px] text-sky-200 font-mono">
                    Order ID: {checkoutOrder.orderId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isVerifyingPayment}
                onClick={() => setCheckoutOrder(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan &amp; Billing Cycle</span>
                  <span className="font-extrabold text-brand-navy dark:text-white">
                    {checkoutOrder.planName} (
                    {checkoutOrder.billingCycle.toUpperCase()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">List Plan Price</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    ₹{checkoutOrder.pricing.listBaseAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {(checkoutOrder.pricing.proratedCreditAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sky-600 dark:text-sky-400 font-extrabold">
                    <span>Prorated Upgrade Credit</span>
                    <span>
                      -₹
                      {(
                        checkoutOrder.pricing.proratedCreditAmount ?? 0
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {checkoutOrder.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <span>
                      Coupon Discount ({checkoutOrder.couponCode})
                    </span>
                    <span>
                      -₹
                      {checkoutOrder.pricing.discountAmount.toLocaleString(
                        'en-IN',
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-500">Net Taxable Value (SAC 998314)</span>
                  <span className="font-extrabold text-brand-navy dark:text-white">
                    ₹{checkoutOrder.pricing.netBaseAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {checkoutOrder.pricing.igstAmount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500">18% IGST</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      ₹{checkoutOrder.pricing.igstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-500">9% CGST + 9% SGST (18% GST)</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      ₹
                      {(
                        checkoutOrder.pricing.cgstAmount +
                        checkoutOrder.pricing.sgstAmount
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-sm font-extrabold">
                  <span className="text-brand-navy dark:text-white">
                    Total Payable (incl. 18% GST)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ₹{checkoutOrder.pricing.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Select Payment Method
                </label>
                <select
                  value={checkoutPaymentMode}
                  onChange={(e) => setCheckoutPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white"
                >
                  <option value="Razorpay UPI (Instant VPA / QR)">
                    Razorpay UPI (Instant VPA / QR)
                  </option>
                  <option value="Razorpay Corporate NetBanking (NEFT / RTGS)">
                    Razorpay Corporate NetBanking (NEFT / RTGS)
                  </option>
                  <option value="Razorpay Corporate Credit / Debit Card">
                    Razorpay Corporate Credit / Debit Card
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={() => setCheckoutOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={() => void handleCompleteCheckoutModal()}
                  className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md disabled:opacity-50"
                >
                  {isVerifyingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Pay ₹{checkoutOrder.pricing.totalAmount.toLocaleString('en-IN')} &amp; Verify Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {refundModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-md w-full border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                  Request GST Credit Note / Refund
                </h3>
                <p className="text-[11px] text-slate-500">
                  Invoice {refundModalInvoice.invoiceNumber} · ₹
                  {refundModalInvoice.totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmittingRefund}
                onClick={() => setRefundModalInvoice(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Reason for GST Credit Note / Refund Request
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Describe why you are requesting a refund or GST credit note (min 5 characters)..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04] text-xs text-brand-navy dark:text-white outline-none focus:border-brand-blue"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingRefund}
                  onClick={() => setRefundModalInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRefund || refundReason.trim().length < 5}
                  onClick={() => void handleSubmitRefundRequest()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-extrabold text-white disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingRefund && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewInvoice && (
        <SubscriptionInvoiceModal
          invoice={previewInvoice}
          ownerName={user?.name}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
}

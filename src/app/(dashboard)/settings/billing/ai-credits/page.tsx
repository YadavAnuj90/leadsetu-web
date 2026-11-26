'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  HardDrive,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  authorizeBillingSandboxOrderApi,
  createBillingCheckoutOrderApi,
  createTopupRequestApi,
  fetchBillingSummaryApi,
  fetchBillingUsageApi,
  verifyBillingCheckoutPaymentApi,
  type BillingCheckoutOrderResponse,
  type BillingSummaryResponse,
  type BillingUsageDashboardResponse,
  type TopupPackSpec,
} from '@/lib/tenants-api';
import { downloadSubscriptionInvoicePdf } from '@/lib/subscription-pdf';
import { getErrorMessage } from '@/lib/api-client';
import BillingNavTabs from '@/components/settings/BillingNavTabs';
import SubscriptionInvoiceModal from '@/components/settings/SubscriptionInvoiceModal';
import type { SubscriptionInvoice } from '@/types/contracts';

function formatPaidAt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AiCreditsBillingPage() {
  const router = useRouter();
  const { user, tenant, updateProfile } = useAuthStore();

  const [billing, setBilling] = useState<BillingSummaryResponse | null>(null);
  const [usage, setUsage] = useState<BillingUsageDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [requestingPackId, setRequestingPackId] = useState<string | null>(null);
  const [checkoutOrder, setCheckoutOrder] =
    useState<BillingCheckoutOrderResponse | null>(null);
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState(
    'Razorpay UPI (Instant VPA / QR)',
  );
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [previewInvoice, setPreviewInvoice] =
    useState<SubscriptionInvoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageBilling =
    user?.role === 'owner' || user?.role === 'admin' || !user?.role;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, usageRes] = await Promise.all([
        fetchBillingSummaryApi(),
        fetchBillingUsageApi(),
      ]);
      setBilling(summaryRes);
      setUsage(usageRes);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        updateProfile({ user: currentUser, tenant: summaryRes.tenant });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedPacks = useMemo(() => {
    const packs = [...(usage?.topupPacks || [])];
    return packs.sort((a, b) => {
      if (a.resource === 'ai' && b.resource !== 'ai') return -1;
      if (a.resource !== 'ai' && b.resource === 'ai') return 1;
      return a.priceInr - b.priceInr;
    });
  }, [usage?.topupPacks]);

  const addonInvoices = useMemo(
    () =>
      (billing?.invoices || []).filter((inv) =>
        String(inv.invoiceNumber || '').startsWith('LS-ADDON'),
      ),
    [billing?.invoices],
  );

  const computeGst = (baseAmount: number) => {
    const buyerState = (
      billing?.tenant.state ||
      billing?.tenant.city ||
      'Delhi'
    ).toLowerCase();
    const isIntra =
      buyerState.includes('delhi') ||
      buyerState.includes('new delhi') ||
      buyerState.includes('07');
    const cgst = isIntra ? Math.round(baseAmount * 0.09) : 0;
    const sgst = isIntra ? Math.round(baseAmount * 0.09) : 0;
    const igst = isIntra ? 0 : Math.round(baseAmount * 0.18);
    return {
      baseAmount,
      gst: cgst + sgst + igst,
      total: baseAmount + cgst + sgst + igst,
    };
  };

  const handleBuyTopupPack = async (pack: TopupPackSpec) => {
    setBuyingPackId(pack.id);
    setError(null);
    try {
      const activePlanId = (billing?.tenant.plan ||
        tenant?.plan ||
        'growth') as 'starter' | 'growth' | 'enterprise';
      const order = await createBillingCheckoutOrderApi({
        orderType: 'topup_pack',
        topupPackId: pack.id,
        plan: activePlanId,
        billingCycle: 'monthly',
        greetingNote: `AI & Quota Top-Up Credit Purchase: ${pack.name} — ${pack.description}`,
      });
      setCheckoutOrder(order);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBuyingPackId(null);
    }
  };

  const handleCompleteCheckoutModal = async () => {
    if (!checkoutOrder || isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    setError(null);
    try {
      const greetingNote = `AI & Quota Top-Up Purchase (${checkoutOrder.planName})`;
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
      const refreshedUsage = await fetchBillingUsageApi().catch(() => null);
      if (refreshedUsage) setUsage(refreshedUsage);
      setToast(
        `Top-Up credits added via Razorpay (${verified.paymentId})! Invoice ${
          verified.latestInvoice?.invoiceNumber || ''
        } saved with timestamp.`,
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleRequestTopupApproval = async (pack: TopupPackSpec) => {
    if (pack.resource === 'storage') return;
    setRequestingPackId(pack.id);
    setError(null);
    try {
      await createTopupRequestApi({
        resource: pack.resource,
        quantity: pack.quantity,
        note: `Top-up approval requested from AI Credits Billing: ${pack.name} (₹${pack.priceInr})`,
      });
      const refreshedUsage = await fetchBillingUsageApi();
      setUsage(refreshedUsage);
      setToast(
        `Submitted ${pack.name} top-up request to Leadsetu Super Admin HQ.`,
      );
      setTimeout(() => setToast(null), 4500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRequestingPackId(null);
    }
  };

  const aiQuotaExceeded =
    Boolean(usage?.aiCalls) && (usage?.aiCalls.remaining ?? 0) <= 0;

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
        aiExceeded={aiQuotaExceeded}
        aiRemaining={usage?.aiCalls.remaining}
      />

      {toast && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/60 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* AI Credit Exhaustion Callout */}
      {aiQuotaExceeded && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/40 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-extrabold text-rose-800 dark:text-rose-200">
                SetuAI Credits Exhausted — Top Up Your Account to Resume AI Calls
              </div>
              <p className="text-xs text-rose-700/90 dark:text-rose-300 mt-0.5">
                All AI scoring, call transcription, WhatsApp drafting, and Copilot actions are paused until you purchase an AI Credit Top-Up Pack below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI, WhatsApp & Storage Credit Balance Cards */}
      <div className="bg-white dark:bg-[#0D1628] rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h1 className="text-xl font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI Credits Balance &amp; Top-Up Purchases
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant Razorpay AI Credit Top-Up Packs separate from your Platform Subscription Plan, with downloadable 18% GST Invoices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-blue ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Credits
          </button>
        </div>

        {usage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/25 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy dark:text-white inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> SetuAI Credits
                </span>
                {usage.aiCalls.addonBalance > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    +{usage.aiCalls.addonBalance.toLocaleString('en-IN')} Top-Up Added
                  </span>
                )}
              </div>
              <div className="text-2xl font-extrabold text-brand-navy dark:text-white">
                {usage.aiCalls.remaining.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  credits left (of {usage.aiCalls.limit.toLocaleString('en-IN')})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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
                <span>Used: {usage.aiCalls.used.toLocaleString('en-IN')}</span>
                <span>Est. ₹{usage.aiCalls.estimatedCostInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy dark:text-white inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Cloud Credits
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {usage.whatsapp.pct}% used
                </span>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy dark:text-white">
                {usage.whatsapp.remaining.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  left (of {usage.whatsapp.limit.toLocaleString('en-IN')})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${usage.whatsapp.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Used: {usage.whatsapp.used.toLocaleString('en-IN')}</span>
                <span>Add-on: +{usage.whatsapp.addonBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brand-navy dark:text-white inline-flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-sky-600" /> Cloud Vault Storage
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {usage.storage.pct}% used
                </span>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy dark:text-white">
                {usage.storage.remainingMb.toLocaleString('en-IN')} MB{' '}
                <span className="text-xs font-semibold text-slate-500">
                  free (of {usage.storage.limitMb.toLocaleString('en-IN')} MB)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-600"
                  style={{ width: `${usage.storage.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500">
                {usage.storage.recordsBreakdown.documentsCount} Docs ·{' '}
                {usage.storage.recordsBreakdown.leadsCount} Leads
              </div>
            </div>
          </div>
        )}

        {/* Top-Up Packs Grid */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            Buy Instant AI Credit &amp; Add-On Top-Up Packs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPacks.map((pack) => {
              const calc = computeGst(pack.priceInr);
              return (
                <div
                  key={pack.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                    pack.resource === 'ai'
                      ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/15'
                      : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-brand-navy dark:text-white">
                        {pack.name}
                      </span>
                      {pack.badge && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-light text-brand-blue whitespace-nowrap">
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {pack.description}
                    </p>
                    <div className="text-sm font-extrabold text-brand-navy dark:text-white pt-0.5">
                      ₹{calc.baseAmount.toLocaleString('en-IN')}{' '}
                      <span className="text-[11px] font-semibold text-slate-500">
                        + 18% GST (Total ₹{calc.total.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!canManageBilling || buyingPackId === pack.id}
                      onClick={() => void handleBuyTopupPack(pack)}
                      className="flex-1 btn-primary-brand inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-extrabold text-white disabled:opacity-50"
                    >
                      {buyingPackId === pack.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      Top Up via Razorpay
                    </button>

                    {pack.resource !== 'storage' && (
                      <button
                        type="button"
                        disabled={!canManageBilling || requestingPackId === pack.id}
                        onClick={() => void handleRequestTopupApproval(pack)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-[11px] font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue disabled:opacity-50"
                      >
                        {requestingPackId === pack.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Request'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {usage?.topupRequests && usage.topupRequests.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Top-Up Approval Requests ({usage.topupRequests.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {usage.topupRequests.slice(0, 6).map((req) => (
                  <div
                    key={req.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center gap-2"
                  >
                    <span className="font-extrabold uppercase text-brand-blue">
                      {req.resource}
                    </span>
                    <span className="font-bold text-brand-navy dark:text-white">
                      +{req.quantity.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
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
      </div>

      {/* AI Credit & Add-On Invoices Ledger with Exact Date & Time */}
      <div className="bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
                AI Credit &amp; Top-Up Payment History ({addonInvoices.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every AI credit / top-up purchase generates an archived GST invoice with exact payment date &amp; time.
              </p>
            </div>
          </div>
          <Link
            href="/settings/billing"
            className="text-xs font-bold text-brand-blue hover:underline"
          >
            View Platform Subscription Invoices →
          </Link>
        </div>

        {addonInvoices.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No AI credit top-up purchases yet. Select a top-up pack above when needed.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {addonInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-brand-blue">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                      AI Credit / Top-Up Pack
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">
                      <Clock className="w-3 h-3 text-brand-blue" />
                      {formatPaidAt(inv.issuedAt)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Mode: <strong>{inv.paymentMode}</strong>
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Ref: {inv.paymentReference}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {inv.greetingNote}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-brand-navy dark:text-white">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Base ₹{inv.baseAmount.toLocaleString('en-IN')} + 18% GST
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewInvoice(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-brand-blue text-xs font-bold text-brand-navy dark:text-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-blue" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSubscriptionInvoicePdf(inv, user?.name)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Razorpay Checkout Modal */}
      {checkoutOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
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
                    AI Credit Top-Up Checkout
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
                  <span className="text-slate-500">Top-Up Pack</span>
                  <span className="font-extrabold text-brand-navy dark:text-white">
                    {checkoutOrder.planName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Taxable Value</span>
                  <span className="font-bold">
                    ₹{checkoutOrder.pricing.netBaseAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-sm font-extrabold">
                  <span>Total Payable (incl. 18% GST)</span>
                  <span className="text-emerald-600">
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={() => void handleCompleteCheckoutModal()}
                  className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {isVerifyingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Pay ₹{checkoutOrder.pricing.totalAmount.toLocaleString('en-IN')} &amp; Add Credits
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

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileText,
  HeartHandshake,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchBillingSummaryApi,
  subscribePlanApi,
  type BillingSummaryResponse,
} from '@/lib/tenants-api';
import { downloadSubscriptionInvoicePdf } from '@/lib/subscription-pdf';
import { getErrorMessage } from '@/lib/api-client';
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
      `Thank you ${company} for choosing Leadsetu (${planName})! Wishing your sales & accounts teams record conversions and smooth GST settlements all year ahead. — Anuj & Team Leadsetu, New Delhi.`,
  },
];

export default function BillingSettingsPage() {
  const router = useRouter();
  const { user, tenant, updateProfile } = useAuthStore();

  const [billing, setBilling] = useState<BillingSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  );
  const [greetingMode, setGreetingMode] = useState<string>('executive');
  const [customGreeting, setCustomGreeting] = useState('');
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] =
    useState<SubscriptionInvoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageBilling =
    user?.role === 'owner' || user?.role === 'admin' || !user?.role;

  const loadBilling = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBillingSummaryApi();
      setBilling(res);
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

  const handleSubscribePlan = async (
    planId: 'starter' | 'growth' | 'enterprise',
    planName: string,
  ) => {
    setActivatingPlan(planId);
    setError(null);
    try {
      const company = tenant?.name || 'Valued Partner';
      const selectedTpl = GREETING_TEMPLATES.find((g) => g.id === greetingMode);
      const greetingNote =
        greetingMode === 'custom' && customGreeting.trim()
          ? customGreeting.trim()
          : (selectedTpl || GREETING_TEMPLATES[0]).text(company, planName);

      const res = await subscribePlanApi({
        plan: planId,
        billingCycle,
        paymentMode: 'Razorpay UPI / NEFT Corporate',
        greetingNote,
      });
      setBilling(res);
      if (user) {
        updateProfile({ user, tenant: res.tenant });
      }
      if (res.latestInvoice) {
        setPreviewInvoice(res.latestInvoice);
      }
      setToast(
        `${planName} (${billingCycle}) activated! GST Tax Invoice ${
          res.latestInvoice?.invoiceNumber || ''
        } attached to your profile.`,
      );
      setTimeout(() => setToast(null), 4500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActivatingPlan(null);
    }
  };

  const activePlan = billing?.tenant.plan || tenant?.plan || 'growth';
  const invoices = billing?.invoices || [];
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
                'Leadsetu Technologies (Anujalite Tech Pvt. Ltd.)'}
            </div>
            <div className="text-slate-200/90">
              {billing?.seller.sellerAddress ||
                'Tower B, 7th Floor, Sector 62, Noida & Connaught Place, New Delhi – 110001, India'}
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
              {tenant?.name || 'Leadsetu Workspace'} ·{' '}
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

      {/* Choose / Upgrade Subscription Plan + Greeting Studio */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-brand-navy flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-blue" />
              Choose or Upgrade Your Leadsetu Subscription Plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecting any plan attaches its 18% GST Tax Invoice PDF directly to
              your workspace billing ledger.
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

        {/* 3 Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(billing?.plans || []).map((plan) => {
            const isCurrent = activePlan === plan.id;
            const price =
              billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const gst = Math.round(price * 0.18);
            const total = price + gst;

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
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-brand-navy">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        /{billingCycle === 'annual' ? 'year' : 'month'} + GST
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Total incl. 18% GST: ₹{total.toLocaleString('en-IN')}
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
                  onClick={() => handleSubscribePlan(plan.id, plan.name)}
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
                    ? 'Renew & Attach Paid PDF Invoice'
                    : `Select ${plan.name} & Generate PDF`}
                </button>
              </div>
            );
          })}
        </div>
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

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/50 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Leadsetu Verified Tax Receipts
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Select any plan above to generate your first GST Tax Invoice PDF.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {invoices.map((inv) => (
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
                      {inv.planName} ({inv.billingCycle})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 uppercase">
                      {inv.status === 'paid' ? 'Paid in Full' : 'Trial Receipt'}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

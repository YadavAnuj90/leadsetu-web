'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Minus,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Zap,
  Users,
  Bot,
  MessageSquare,
  HardDrive,
  Receipt,
} from 'lucide-react';

interface PlanCardItem {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  eyebrow: string;
  description: string;
  monthlyPrice: number;
  annualMonthlyEquivalent: number;
  annualBilled: number;
  quotas: {
    seats: string;
    aiCalls: string;
    whatsapp: string;
    storage: string;
  };
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

const plans: PlanCardItem[] = [
  {
    id: 'starter',
    name: 'Starter',
    eyebrow: 'For solo founders & agile sales desks',
    description:
      'Replace scattered Excel sheets and personal phones with a structured WhatsApp CRM & GST invoicing workspace.',
    monthlyPrice: 999,
    annualMonthlyEquivalent: 799,
    annualBilled: 9590,
    quotas: {
      seats: 'Up to 4 Seats',
      aiCalls: '300 SetuAI / mo',
      whatsapp: '500 WA Cloud / mo',
      storage: '2 GB Vault',
    },
    features: [
      'Up to 4 team members included',
      'Leads, Deals Kanban & B2B Contacts directory',
      'Official WhatsApp Cloud API shared inbox',
      'Rule-46 GST Tax Invoices & Proforma Quotations',
      'IndiaMART & Web form lead capture',
      'Standard email & onboarding support',
    ],
    ctaLabel: 'Start 14-Day Free Trial',
    ctaHref: '/signup?plan=starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    eyebrow: 'For scaling B2B SMEs & high-velocity teams',
    description:
      'Full SetuAI lead intent scoring, WhatsApp Cloud broadcasts, automated follow-ups, and Razorpay AR reconciliation.',
    monthlyPrice: 2399,
    annualMonthlyEquivalent: 1919,
    annualBilled: 23030,
    quotas: {
      seats: 'Up to 12 Seats',
      aiCalls: '2,500 SetuAI / mo',
      whatsapp: '3,000 WA Cloud / mo',
      storage: '15 GB Vault',
    },
    features: [
      'Up to 12 team members included',
      'SetuAI LLM Lead Intent Scoring & Next Best Action',
      'Hinglish / English WhatsApp AI Drafts & Thread Summary',
      'Natural-language zero-code Workflow Rule Builder',
      'Product & Document Vault RAG Copilot',
      'Razorpay payment links, AR ledger & auto WhatsApp receipts',
      'WhatsApp template broadcasts & Meta Lead Ads sync',
      'Priority WhatsApp & phone support',
    ],
    ctaLabel: 'Start 14-Day Free Trial',
    ctaHref: '/signup?plan=growth',
    highlighted: true,
    badge: 'Most Popular for SMEs',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    eyebrow: 'For multi-branch factories, distributors & large orgs',
    description:
      'Anti-Data-Leak privacy shield, custom RBAC hierarchies, SLA Field Service Desk, and dedicated onboarding.',
    monthlyPrice: 5499,
    annualMonthlyEquivalent: 4399,
    annualBilled: 52790,
    quotas: {
      seats: 'Up to 50 Seats',
      aiCalls: '10,000 SetuAI / mo',
      whatsapp: '15,000 WA Cloud / mo',
      storage: '100 GB Vault',
    },
    features: [
      'Up to 50 team members & multi-branch teams',
      'Anti-Data-Leak Phone Masking & Export Shield',
      'Granular Role-Based Access Control (RBAC)',
      'SLA Service & AMC Field Ticket Desk',
      'Custom Tally Prime / ERP / Webhook integrations',
      'Full Audit Shield (DPDP Act 2023 logs)',
      'Dedicated Delhi-NCR onboarding specialist',
      '99.9% Uptime SLA guarantee',
    ],
    ctaLabel: 'Start Trial or Contact Sales',
    ctaHref: '/signup?plan=enterprise',
  },
];

const topupPacks = [
  {
    title: '+1,000 SetuAI Credits',
    price: '₹499',
    unit: 'One-time pack',
    desc: 'Extra LLM lead scoring, WhatsApp reply drafts & Document RAG queries anytime.',
    icon: Bot,
    accent: 'text-[#0057FF] bg-blue-50 dark:bg-blue-950/60 dark:text-sky-400',
  },
  {
    title: '+2,500 WhatsApp Broadcasts',
    price: '₹799',
    unit: 'One-time pack',
    desc: 'Extra Meta Cloud template & payment chaser messages beyond monthly quota.',
    icon: MessageSquare,
    accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    title: '+5 GB Document Vault',
    price: '₹699',
    unit: 'One-time pack',
    desc: 'Expand capacity for product catalogues, brochures, POs & GST invoices.',
    icon: HardDrive,
    accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  },
];

type MatrixCell = boolean | string;

const comparisonGroups: {
  category: string;
  rows: { label: string; starter: MatrixCell; growth: MatrixCell; enterprise: MatrixCell }[];
}[] = [
  {
    category: 'Workspace & Team Capacity',
    rows: [
      { label: 'Included Team Seats', starter: '4 Seats', growth: '12 Seats', enterprise: '50 Seats' },
      { label: 'Visual Deal Pipelines & Kanban', starter: true, growth: true, enterprise: true },
      { label: 'B2B Company & Contact Directory', starter: true, growth: true, enterprise: true },
      { label: 'Granular RBAC & Territory Permissions', starter: false, growth: 'Standard Roles', enterprise: 'Custom RBAC' },
    ],
  },
  {
    category: 'WhatsApp Cloud & Lead Capture',
    rows: [
      { label: 'Official WhatsApp Cloud Inbox', starter: '500 / mo', growth: '3,000 / mo', enterprise: '15,000 / mo' },
      { label: 'IndiaMART & Meta Lead Ads Sync', starter: 'IndiaMART', growth: true, enterprise: true },
      { label: 'Green-Tick Broadcast Campaigns', starter: false, growth: true, enterprise: true },
      { label: 'Call Logs & Disposition Tracking', starter: true, growth: true, enterprise: true },
    ],
  },
  {
    category: 'SetuAI & Automation Engine',
    rows: [
      { label: 'Monthly SetuAI Calls', starter: '300 / mo', growth: '2,500 / mo', enterprise: '10,000 / mo' },
      { label: 'LLM Lead Intent Scoring & Next Action', starter: false, growth: true, enterprise: true },
      { label: 'Natural-Language AI Workflow Builder', starter: false, growth: true, enterprise: true },
      { label: 'Product Catalogue & Doc Vault RAG Copilot', starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: '18% GST Billing & Collections',
    rows: [
      { label: 'Rule-46 GST Invoices & CPQ Quotes', starter: true, growth: true, enterprise: true },
      { label: 'Razorpay Payment Links & Webhook Reconciliation', starter: false, growth: true, enterprise: true },
      { label: 'Auto Credit Hold Removal & WA Receipts', starter: false, growth: true, enterprise: true },
      { label: 'GSTR-1 & Tally Prime Export Ready', starter: true, growth: true, enterprise: true },
    ],
  },
  {
    category: 'Security, Privacy & Support',
    rows: [
      { label: 'Anti-Data-Leak Phone Masking', starter: false, growth: false, enterprise: true },
      { label: 'Immutable DPDP Act 2023 Audit Trail', starter: 'Basic Logs', growth: 'Full Logs', enterprise: 'Full + SIEM Export' },
      { label: 'SLA Field Service & AMC Desk', starter: false, growth: true, enterprise: true },
      { label: 'Support & Onboarding SLA', starter: 'Email & Chat', growth: 'Priority WA', enterprise: '99.9% SLA + AM' },
    ],
  },
];

const faqs = [
  {
    q: 'Do I need a credit card or UPI mandate to start the 14-day free trial?',
    a: 'No. You can create your Leadsetu workspace, connect your WhatsApp Business number, import leads, and test SetuAI + GST invoicing for 14 days without entering any card or UPI details.',
  },
  {
    q: 'Can I connect my existing WhatsApp Business number?',
    a: 'Yes. Leadsetu integrates directly with Official Meta WhatsApp Cloud API so multiple sales reps can reply from one verified business number with zero ban risk and green-tick verification guidance.',
  },
  {
    q: 'Are GST Tax Invoices generated for my subscription for Input Tax Credit (ITC)?',
    a: 'Yes. Every subscription & top-up payment via Razorpay issues a compliant 18% GST Tax Invoice (SAC 998314 — automatic CGST+SGST for Delhi NCR or IGST for other states) directly inside Settings → Billing.',
  },
  {
    q: 'How do plan upgrades, proration credits, downgrades, or cancellations work?',
    a: 'If you upgrade mid-cycle (for example, Starter → Growth), unused days from your current paid cycle are automatically credited against the upgrade before 18% GST. Owners can also pause/cancel auto-renewal, schedule next-cycle downgrades, or submit GST Credit Note / Refund requests directly from Settings → Billing.',
  },
  {
    q: 'What happens if my team hits monthly AI calls or WhatsApp broadcast limits?',
    a: 'You never have to prematurely upgrade your entire tier for a busy campaign month. Simply buy an instant 1-Click Top-Up Pack for SetuAI Credits, WhatsApp Broadcasts, or Vault Storage directly inside Billing.',
  },
  {
    q: 'Can Leadsetu automate customer payment collection & AR reconciliation?',
    a: 'Yes. Growth and Enterprise workspaces generate Razorpay payment links on B2B quotes and tax invoices. When your customer pays via UPI/NEFT/card, Leadsetu automatically flips the invoice to Paid, removes Buyer Credit Hold, records the AR entry, and dispatches an instant WhatsApp receipt.',
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section
      id="pricing"
      className="relative pt-28 pb-20 md:pt-36 md:pb-28 bg-white dark:bg-[#070D19] transition-colors duration-200 overflow-hidden"
    >
      {/* Subtle Ambient SaaS Header Gradient */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[440px] dark:opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 87, 255, 0.11) 0%, rgba(56, 189, 248, 0.05) 45%, transparent 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── 1. Hero Header & Billing Cycle Toggle ───────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 border bg-blue-50/90 dark:bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-300 border-[#0057FF]/25 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent INR SaaS Pricing · +18% GST ITC</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Predictable team plans.{' '}
            <span className="bg-gradient-to-r from-[#0057FF] to-[#2563EB] dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              Built for Indian B2B growth.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
            No hidden dollar per-seat surprises. Pick a workspace plan, scale with optional AI &amp;
            WhatsApp packs, and claim full 18% GST Input Tax Credit.
          </p>

          {/* Billing Period Switcher */}
          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !annual
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                annual
                  ? 'bg-[#0D1628] dark:bg-[#0057FF] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/25">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ─── 2. 3 SaaS Tier Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
          {plans.map((plan) => {
            const displayMonthly = annual
              ? plan.annualMonthlyEquivalent
              : plan.monthlyPrice;
            const annualSavings = plan.monthlyPrice * 12 - plan.annualBilled;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.highlighted
                    ? 'shadow-2xl shadow-[#0057FF]/15 lg:-translate-y-3 border-2'
                    : 'border border-slate-200/90 dark:border-slate-800 hover:border-[#0057FF]/45 hover:shadow-xl bg-[#FAFCFF] dark:bg-[#0D1628]'
                }`}
                style={
                  plan.highlighted
                    ? {
                        background:
                          'linear-gradient(160deg, #0D1B35 0%, #091224 58%, #070E1D 100%)',
                        borderColor: '#3978EA',
                      }
                    : undefined
                }
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                    style={{
                      background:
                        'linear-gradient(135deg, #3978EA 0%, #2563EB 100%)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div>
                  {/* Eyebrow & Name */}
                  <div className="mb-5">
                    <div
                      className={`text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                        plan.highlighted
                          ? 'text-sky-300'
                          : 'text-[#0057FF] dark:text-sky-400'
                      }`}
                    >
                      {plan.eyebrow}
                    </div>
                    <h2
                      className={`font-black text-2xl mb-2 ${
                        plan.highlighted
                          ? 'text-white'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {plan.name}
                    </h2>
                    <p
                      className={`text-sm leading-relaxed ${
                        plan.highlighted
                          ? 'text-slate-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div
                    className={`mb-5 pb-5 border-b ${
                      plan.highlighted
                        ? 'border-white/10'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      {annual && (
                        <span
                          className={`text-lg font-bold line-through ${
                            plan.highlighted ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span
                        className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums ${
                          plan.highlighted
                            ? 'text-white'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        ₹{displayMonthly.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">
                        / month
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {annual ? (
                        <>
                          <span className="font-bold text-emerald-500 dark:text-emerald-400">
                            Save ₹{annualSavings.toLocaleString('en-IN')}/yr
                          </span>
                          <span
                            className={
                              plan.highlighted ? 'text-slate-400' : 'text-slate-500'
                            }
                          >
                            Billed ₹{plan.annualBilled.toLocaleString('en-IN')}/yr + 18% GST
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">
                          Billed monthly + 18% GST (ITC Eligible)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Included Quotas Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {[
                      { icon: Users, text: plan.quotas.seats },
                      { icon: Bot, text: plan.quotas.aiCalls },
                      { icon: MessageSquare, text: plan.quotas.whatsapp },
                      { icon: HardDrive, text: plan.quotas.storage },
                    ].map(({ icon: QIcon, text }) => (
                      <div
                        key={text}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold border ${
                          plan.highlighted
                            ? 'bg-white/[0.06] border-white/10 text-slate-100'
                            : 'bg-white dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <QIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            plan.highlighted
                              ? 'text-sky-400'
                              : 'text-[#0057FF] dark:text-sky-400'
                          }`}
                        />
                        <span className="truncate">{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            background: plan.highlighted
                              ? 'rgba(57, 120, 234, 0.28)'
                              : 'rgba(0, 87, 255, 0.10)',
                            color: plan.highlighted ? '#7CB3FF' : '#0057FF',
                          }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.6]" />
                        </div>
                        <span
                          className={
                            plan.highlighted
                              ? 'text-slate-200'
                              : 'text-slate-600 dark:text-slate-300'
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-[#0057FF] hover:bg-[#0046D5] text-white shadow-lg shadow-[#0057FF]/30 hover:-translate-y-0.5'
                      : 'bg-blue-50 dark:bg-slate-800 text-[#0057FF] dark:text-sky-300 hover:bg-[#0057FF] hover:text-white dark:hover:bg-[#0057FF]'
                  }`}
                >
                  <span>{plan.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* All Plans Trust Strip */}
        <div className="mt-10 rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2 text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-[#0057FF]" /> Included on every plan:
          </span>
          <span>✓ 14-Day Free Trial</span>
          <span>✓ Prorated Mid-Cycle Upgrades</span>
          <span>✓ Automated 18% GST ITC Invoices</span>
          <span>✓ Self-Serve Cancellation &amp; Refunds</span>
        </div>

        {/* ─── 3. On-Demand Top-Up Packs ──────────────────────────────── */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-1.5">
                <Zap className="w-3.5 h-3.5" /> Flexible Top-Up Packs
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Need extra AI or WhatsApp burst volume?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Top up instantly via Razorpay inside <strong>Settings → Billing</strong> anytime without changing your base tier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topupPacks.map((pack) => {
              const Icon = pack.icon;
              return (
                <div
                  key={pack.title}
                  className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex items-start gap-4"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${pack.accent}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {pack.title}
                      </h3>
                      <span className="text-base font-black text-[#0057FF] dark:text-sky-400 tabular-nums shrink-0">
                        {pack.price}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {pack.unit} + 18% GST
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {pack.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 4. Side-by-Side Feature Comparison Matrix ────────────────── */}
        <div id="compare" className="mt-24 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
              <Receipt className="w-4 h-4" /> Full Feature Breakdown
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Compare every capability side-by-side
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1628] shadow-sm overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70">
                  <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Modules &amp; Limits
                  </th>
                  <th className="py-4 px-5 text-sm font-black text-slate-900 dark:text-white text-center">
                    Starter
                  </th>
                  <th className="py-4 px-5 text-sm font-black text-[#0057FF] dark:text-sky-400 text-center bg-blue-50/50 dark:bg-[#0057FF]/10">
                    Growth
                  </th>
                  <th className="py-4 px-5 text-sm font-black text-slate-900 dark:text-white text-center">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonGroups.map((group) => (
                  <FragmentGroup key={group.category} group={group} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── 5. SaaS Billing & Product Q&A ───────────────────────────── */}
        <div id="faq" className="mt-24 max-w-3xl mx-auto scroll-mt-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
              <HelpCircle className="w-4 h-4" /> Pricing &amp; Billing Q&amp;A
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Questions before getting started?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Everything about INR billing, 18% GST tax invoices, upgrades, and WhatsApp onboarding.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isOpen
                      ? 'border-[#0057FF]/40 bg-blue-50/30 dark:bg-[#0D1628] shadow-sm'
                      : 'border-slate-200/85 dark:border-slate-800 bg-white dark:bg-[#0D1628]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0057FF] flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function renderMatrixValue(val: MatrixCell, highlight?: boolean) {
  if (val === true) {
    return (
      <span
        className={`inline-flex w-6 h-6 rounded-full items-center justify-center ${
          highlight
            ? 'bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-400'
            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[2.8]" />
      </span>
    );
  }
  if (val === false) {
    return (
      <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-slate-300 dark:text-slate-600">
        <Minus className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
      {val}
    </span>
  );
}

function FragmentGroup({
  group,
}: {
  group: (typeof comparisonGroups)[number];
}) {
  return (
    <>
      <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
        <td
          colSpan={4}
          className="py-2.5 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {group.category}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr
          key={row.label}
          className="border-b border-slate-100 dark:border-slate-800/70 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
        >
          <td className="py-3.5 px-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            {row.label}
          </td>
          <td className="py-3.5 px-5 text-center">
            {renderMatrixValue(row.starter)}
          </td>
          <td className="py-3.5 px-5 text-center bg-blue-50/35 dark:bg-[#0057FF]/5">
            {renderMatrixValue(row.growth, true)}
          </td>
          <td className="py-3.5 px-5 text-center">
            {renderMatrixValue(row.enterprise)}
          </td>
        </tr>
      ))}
    </>
  );
}

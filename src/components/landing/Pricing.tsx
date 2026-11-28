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
  PhoneCall,
  TrendingDown,
  Layers,
  X,
} from 'lucide-react';

interface PlanCardItem {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  eyebrow: string;
  description: string;
  monthlyPrice: number;
  annualMonthlyEquivalent: number;
  annualBilled: number;
  seatCount: number;
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
      'Replace scattered spreadsheets and per-seat fees with a structured WhatsApp Cloud CRM, instant lead capture, and 18% GST billing.',
    monthlyPrice: 999,
    annualMonthlyEquivalent: 799,
    annualBilled: 9590,
    seatCount: 4,
    quotas: {
      seats: 'Up to 4 Seats',
      aiCalls: '500 SetuAI / mo',
      whatsapp: '1,000 WA / mo',
      storage: '512 MB Vault',
    },
    features: [
      'Up to 4 team members (Owner, Admin, Manager, Agent)',
      'Leads, Deals Kanban & verified GSTIN B2B Contacts',
      'Official WhatsApp Cloud API shared team inbox',
      'Public Instant Micro-Forms with WhatsApp OTP verification',
      'Public 1-click Appointment & Demo Booking scheduler',
      'IndiaMART, Justdial & HTTPS Webhook lead capture',
      'Rule-46 18% GST Invoices, Proforma Quotes & GSTR-1 / Tally CSV',
    ],
    ctaLabel: 'Start 14-Day Free Trial',
    ctaHref: '/signup?plan=starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    eyebrow: 'For scaling B2B SMEs & high-velocity teams',
    description:
      'Complete WhatsApp Bot Flows, 24x7 AI Sales Concierge, Voice Calling Wallet, Razorpay Collect-on-WhatsApp, and Buyer Magic Portal.',
    monthlyPrice: 2399,
    annualMonthlyEquivalent: 1919,
    annualBilled: 23030,
    seatCount: 12,
    quotas: {
      seats: 'Up to 12 Seats',
      aiCalls: '5,000 SetuAI / mo',
      whatsapp: '10,000 WA / mo',
      storage: '2 GB Vault',
    },
    features: [
      'Up to 12 team members & custom RBAC permissions',
      'Interactive Multi-Step WhatsApp Bot Flows (EN / HI / Hinglish)',
      '24x7 SetuAI Sales Concierge, RAG Vault & Intent Scoring',
      'WhatsApp Business WebRTC Calling & Voice-Note-to-Quote AI',
      'Razorpay / UPI Collect-on-WhatsApp + Webhook Auto-Reconcile',
      'Meta Lead Ads Sync + Meta CAPI Purchase Conversion Loop',
      'B2B Buyer Self-Serve Portal, Dealer Beat & SLA Desk',
      'Anti-Data-Leak Phone Masking & Priority WhatsApp Support',
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
      '10x AI & WhatsApp scale, custom RBAC hierarchies, SIEM audit exports, multi-territory governance, and dedicated migration onboarding.',
    monthlyPrice: 5499,
    annualMonthlyEquivalent: 4399,
    annualBilled: 52790,
    seatCount: 50,
    quotas: {
      seats: 'Up to 50 Seats',
      aiCalls: '50,000 SetuAI / mo',
      whatsapp: '1,00,000 WA / mo',
      storage: '10 GB Vault',
    },
    features: [
      'Up to 50 team members & multi-branch territories',
      'Custom Role-Based Access Control (RBAC) & team quotas',
      'Anti-Data-Leak Phone Masking, Export Shield & IP controls',
      'Full Immutable DPDP Act 2023 Audit Trail + SIEM / CSV export',
      'Custom Tally Prime / ERP / HMAC Webhook automations',
      'Dedicated onboarding & migration specialist',
      '99.9% Uptime SLA & priority engineering escalation',
    ],
    ctaLabel: 'Start Trial or Contact Sales',
    ctaHref: '/signup?plan=enterprise',
  },
];

const marketComparisonRows = [
  {
    category: 'CRM Pipeline & Team Seats (12 users)',
    separateStack: '₹9,600 – ₹30,000 / mo',
    separateNote: 'Published Indian per-seat CRMs (₹800–₹2,500/user/mo)',
    leadsetuIncluded: 'Included (12 Seats)',
  },
  {
    category: 'Official WhatsApp BSP + No-Code Bot Flows',
    separateStack: '₹2,799 – ₹5,999 / mo',
    separateNote: 'Standalone WhatsApp API tools + seat markups',
    leadsetuIncluded: 'Included (10,000/mo)',
  },
  {
    category: 'AI Concierge, Booking Scheduler & OTP Forms',
    separateStack: '₹1,200 – ₹3,000 / mo',
    separateNote: 'Separate scheduling, form & AI copilot add-ons',
    leadsetuIncluded: 'Included (5,000 AI/mo)',
  },
  {
    category: 'Rule-46 GST Invoicing & Razorpay AR Auto-Sync',
    separateStack: '₹800 – ₹2,500 / mo',
    separateNote: 'Extra GST billing + payment reconciliation scripts',
    leadsetuIncluded: 'Included + 18% GST ITC',
  },
];

const whyUsAdvantages = [
  {
    title: 'Flat Team Bundles vs. Per-Seat Tax',
    otherCrms:
      'Typical Indian CRMs bill ₹800–₹2,500 per user every month, penalizing you every time a rep, billing clerk, or manager joins.',
    leadsetu:
      'Include 4, 12, or 50 seats in one predictable INR workspace — add support, accounts, and sales staff without surprise seat bills.',
  },
  {
    title: 'Native WhatsApp Cloud, Bots & Calling',
    otherCrms:
      'Traditional CRMs force a second subscription to an external WhatsApp API vendor plus fragile webhook connectors.',
    leadsetu:
      'Official Meta WhatsApp Cloud inbox, EN/HI/Hinglish interactive bots, broadcasts, and ₹0.45/min WebRTC calling live natively inside the CRM.',
  },
  {
    title: '24x7 Autonomous AI Concierge Built-In',
    otherCrms:
      'Most domestic CRMs offer static forms or manual follow-up reminders with zero context from your product catalogues.',
    leadsetu:
      'SetuAI reads your brochures & pricing docs, scores lead intent, drafts Hinglish replies, and qualifies prospects around the clock.',
  },
  {
    title: 'Collect-on-WhatsApp + 18% GST Auto-Sync',
    otherCrms:
      'Standard CRMs stop at "Deal Won", forcing teams to switch to separate accounting software for invoices and payment tracking.',
    leadsetu:
      'Issue Rule-46 GST invoices, send Razorpay UPI links right on WhatsApp, auto-reconcile paid receipts, and export GSTR-1 / Tally CSV.',
  },
  {
    title: 'Anti-Data-Leak Phone Masking & DPDP Audit',
    otherCrms:
      'Generic CRMs let agents copy customer phone numbers or export your entire buyer database with basic permissions.',
    leadsetu:
      'Protect your lead book with agent phone masking, CSV export locks, territory RBAC, and an immutable DPDP Act 2023 audit log.',
  },
  {
    title: 'Direct Lead Sources + Closed-Loop Ad ROI',
    otherCrms:
      'Require third-party automation bridges for marketplaces and never tell Meta Ads which leads actually paid an invoice.',
    leadsetu:
      'Native IndiaMART, Justdial, OTP Micro-Forms, Demo Booking, and automatic Meta CAPI Purchase events optimize your ad spend.',
  },
];

const topupPacks = [
  {
    title: '+1,000 SetuAI Credits',
    price: '₹499',
    unit: 'Also available: +5,000 Scale Pack (₹1,999)',
    desc: 'Extra LLM lead scoring, 24x7 AI Concierge replies, Voice-to-Quote & Document RAG actions anytime.',
    icon: Bot,
    accent: 'text-[#0057FF] bg-blue-50 dark:bg-blue-950/60 dark:text-sky-400',
  },
  {
    title: '+2,500 WhatsApp Broadcasts',
    price: '₹799',
    unit: 'Also available: +10,000 Bulk Pack (₹2,499)',
    desc: 'Extra official Meta Cloud template dispatches, payment reminders & interactive bot flow runs.',
    icon: MessageSquare,
    accent:
      'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    title: '+₹500 WA Calling Wallet',
    price: '₹500',
    unit: 'Also available: +₹2,000 Scale Pack (₹2,000)',
    desc: 'Prepaid Meta Business Voice credit at ₹0.45/min (6-second pulses; inbound calls are free).',
    icon: PhoneCall,
    accent:
      'text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400',
  },
  {
    title: '+5 GB Document Vault',
    price: '₹599',
    unit: 'One-time workspace expansion',
    desc: 'Expand encrypted cloud storage for brochures, CAD specs, POs, call logs & GST invoices.',
    icon: HardDrive,
    accent:
      'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  },
];

type MatrixCell = boolean | string;

const comparisonGroups: {
  category: string;
  rows: {
    label: string;
    starter: MatrixCell;
    growth: MatrixCell;
    enterprise: MatrixCell;
    market: string;
  }[];
}[] = [
  {
    category: 'Workspace, Routing & Capture',
    rows: [
      {
        label: 'Included Team Seats (Flat Workspace)',
        starter: '4 Seats',
        growth: '12 Seats',
        enterprise: '50 Seats',
        market: '₹800–₹2,500 / user',
      },
      {
        label: 'Visual Deal Pipelines, Tasks & Custom Fields',
        starter: true,
        growth: true,
        enterprise: true,
        market: 'Paid Tier Add-On',
      },
      {
        label: 'Auto Lead Routing & Round-Robin Assignment',
        starter: 'Basic Rules',
        growth: true,
        enterprise: 'Territory + Branch',
        market: 'Enterprise Only',
      },
      {
        label: 'Instant Micro-Forms with WA OTP Verification',
        starter: true,
        growth: true,
        enterprise: true,
        market: 'Not Included',
      },
      {
        label: 'Public Appointment & Demo Booking Scheduler',
        starter: true,
        growth: true,
        enterprise: true,
        market: '3rd-Party Tool Extra',
      },
      {
        label: 'Granular RBAC & Multi-Territory Rules',
        starter: false,
        growth: 'Custom Roles',
        enterprise: 'Multi-Branch RBAC',
        market: 'Limited',
      },
    ],
  },
  {
    category: 'Omnichannel Inbox, Calling & Bot Flows',
    rows: [
      {
        label: 'Monthly Official WhatsApp Cloud Messages',
        starter: '1,000 / mo',
        growth: '10,000 / mo',
        enterprise: '1,00,000 / mo',
        market: 'Extra BSP (₹2,800+/mo)',
      },
      {
        label: 'Email CRM Sync, IndiaMART, Justdial & Webhooks',
        starter: true,
        growth: true,
        enterprise: true,
        market: 'Middleware Extra',
      },
      {
        label: 'Interactive Multi-Step Bot Flows (EN/HI/Hinglish)',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Separate Bot Tool',
      },
      {
        label: 'Green-Tick Broadcast Campaigns & Meta Lead Ads',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Separate BSP Fee',
      },
      {
        label: 'WhatsApp WebRTC Calling & Video Consult Links',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Separate Dialer',
      },
    ],
  },
  {
    category: 'SetuAI & Autonomous Revenue Engine',
    rows: [
      {
        label: 'Monthly SetuAI Calls & Copilot Quota',
        starter: '500 / mo',
        growth: '5,000 / mo',
        enterprise: '50,000 / mo',
        market: 'Paid AI Add-On',
      },
      {
        label: 'SetuAI Lead Intent Scoring & GSTIN Risk Check',
        starter: true,
        growth: true,
        enterprise: true,
        market: 'Higher Tiers Only',
      },
      {
        label: '24x7 Autonomous AI Sales Concierge & KB RAG',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Not Included',
      },
      {
        label: 'Voice-Note-to-Quote AI & No-Code Workflows',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Not Included',
      },
      {
        label: 'Dealer RFQ Desk & Field Beat Planner',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Not Included',
      },
    ],
  },
  {
    category: 'Quotes, Razorpay UPI & 18% GST Collections',
    rows: [
      {
        label: 'HSN/SAC Catalogue & Interactive Public Quotes',
        starter: true,
        growth: true,
        enterprise: true,
        market: 'Static PDF Only',
      },
      {
        label: 'Rule-46 GST Invoices & GSTR-1 / Tally CSV Exports',
        starter: true,
        growth: true,
        enterprise: true,
        market: 'Separate Billing App',
      },
      {
        label: 'Collect-on-WhatsApp UPI Links & Auto-Reconcile',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Not Included',
      },
      {
        label: 'Meta CAPI Purchase Attribution Loop',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Custom Dev Needed',
      },
      {
        label: 'B2B Buyer Self-Serve Magic Portal',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Not Included',
      },
    ],
  },
  {
    category: 'Analytics, Security & Support',
    rows: [
      {
        label: 'Document & Catalogue Cloud Vault',
        starter: '512 MB',
        growth: '2 GB',
        enterprise: '10 GB',
        market: '100–500 MB Base',
      },
      {
        label: 'Anti-Data-Leak Phone Masking & Export Shield',
        starter: false,
        growth: true,
        enterprise: 'Full + SIEM Export',
        market: 'Enterprise Only',
      },
      {
        label: 'SLA Service & AMC Field Ticket Desk',
        starter: false,
        growth: true,
        enterprise: true,
        market: 'Separate Helpdesk',
      },
      {
        label: 'Attribution Analytics & Onboarding SLA',
        starter: 'Email & Docs',
        growth: 'Priority WA',
        enterprise: 'Dedicated + 99.9% SLA',
        market: 'Paid Onboarding',
      },
    ],
  },
];

const faqs = [
  {
    q: 'Do I need a credit card or UPI mandate to start the 14-day free trial?',
    a: 'No. Create your Leadsetu workspace, connect your WhatsApp Business number, launch Instant Micro-Forms or Booking links, and test SetuAI + 18% GST invoicing for 14 days without entering any card or UPI details.',
  },
  {
    q: 'How does Leadsetu replace paying separately for a CRM and a WhatsApp BSP?',
    a: 'Most Indian CRMs charge ₹800 to ₹2,500 per user every month and still require a separate ₹2,799–₹5,999/month WhatsApp API provider. Leadsetu bundles flat workspace seats (4, 12, or 50 reps), Official WhatsApp Cloud API, multi-step bot flows, AI Concierge, booking, and GST/Razorpay billing into one INR plan.',
  },
  {
    q: 'How are Meta WhatsApp template fees and WhatsApp Calling billed?',
    a: 'Your plan includes up to 1,000 / 10,000 / 1,00,000 monthly WhatsApp Cloud dispatches at zero Leadsetu software markup. Optional Meta Business WebRTC Calling runs on a transparent prepaid wallet (top up ₹500 or ₹2,000 anytime) billed at ₹0.45/min in 6-second pulses, while inbound customer calls are free.',
  },
  {
    q: 'Are GST Tax Invoices generated for my subscription for Input Tax Credit (ITC)?',
    a: 'Yes. Every subscription & top-up payment via Razorpay issues a compliant 18% GST Tax Invoice (SAC 998314 — automatic CGST+SGST for intra-state or IGST for inter-state SaaS purchases) with your company GSTIN directly inside Settings → Billing.',
  },
  {
    q: 'How do plan upgrades, proration credits, downgrades, or top-up packs work?',
    a: 'If you upgrade mid-cycle (for example, Starter → Growth), unused days from your active paid cycle are automatically credited against the upgrade before 18% GST. For busy festive or campaign weeks, you can buy instant SetuAI, WhatsApp, Calling Wallet, or Vault top-ups via Razorpay without changing tiers.',
  },
  {
    q: 'Can Leadsetu automate UPI / Razorpay collections and Meta Ads conversion tracking?',
    a: 'Yes. On Growth and Enterprise, invoices generate live Razorpay Pay links directly inside WhatsApp interactive CTA messages. Once your buyer pays via UPI, NEFT, or card, Leadsetu automatically marks the invoice Paid, removes Buyer Credit Hold, sends a WhatsApp receipt, and fires a verified Purchase event back to Meta CAPI.',
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
            <span>Transparent Workspace INR Pricing · +18% GST ITC</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Flat team pricing.{' '}
            <span className="bg-gradient-to-r from-[#0057FF] to-[#2563EB] dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              Built to replace 3 SaaS bills.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
            No ₹800–₹2,500 per-user seat tax. Combine your CRM, Official WhatsApp Cloud Bots, 24x7
            AI Concierge, Booking Scheduler, and Razorpay 18% GST Billing in one workspace plan.
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
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                  annual
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/25'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                }`}
              >
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
            const effectivePerSeat = Math.round(displayMonthly / plan.seatCount);

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

                    <div
                      className={`mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        plan.highlighted
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>
                        Effective ~₹{effectivePerSeat}/seat/mo at full {plan.seatCount}-seat capacity
                      </span>
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
          <span>✓ 14-Day Free Trial (No Card)</span>
          <span>✓ Zero Per-Seat Lock-In</span>
          <span>✓ Prorated Mid-Cycle Upgrades</span>
          <span>✓ Automated 18% GST ITC Invoices</span>
          <span>✓ Self-Serve Cancellation &amp; Refunds</span>
        </div>

        {/* ─── 3. Indian Market TCO Comparison ──────────────────────────── */}
        <div className="mt-20 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-[#0D1628] dark:via-[#0B1324] dark:to-[#081020] p-6 sm:p-9 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                <TrendingDown className="w-4 h-4" /> Indian SME Market Benchmark
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Why 12-person sales teams save 85%+ vs. stitched tools
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">
                Most Indian SMEs pay separately for a per-user CRM, a WhatsApp Business API vendor, a booking tool, and GST invoicing.
              </p>
            </div>
            <div className="rounded-2xl bg-[#0D1628] dark:bg-[#0057FF]/15 border border-slate-800 dark:border-[#0057FF]/35 px-5 py-3 text-right shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-sky-300">
                Typical Separate Stack vs. Leadsetu Growth ({annual ? 'Annual' : 'Monthly'})
              </div>
              <div className="flex items-baseline justify-end gap-2.5 mt-0.5">
                <span className="text-sm font-bold line-through text-slate-500">
                  ₹14,399 – ₹41,499/mo
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {annual ? '₹1,919/mo' : '₹2,399/mo'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#070D19]">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">Software Capability</th>
                  <th className="py-3.5 px-5">Typical Fragmented Stack</th>
                  <th className="py-3.5 px-5 text-[#0057FF] dark:text-sky-400 bg-blue-50/50 dark:bg-[#0057FF]/10">
                    Leadsetu Growth ({annual ? '₹1,919/mo' : '₹2,399/mo'})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {marketComparisonRows.map((item) => (
                  <tr key={item.category}>
                    <td className="py-3.5 px-5 text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {item.separateStack}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.separateNote}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 bg-blue-50/30 dark:bg-[#0057FF]/5">
                      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 stroke-[2.6]" />
                        {item.leadsetuIncluded}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
            * Benchmark reflects typical published Indian SaaS pricing across per-seat CRM platforms and standalone WhatsApp BSPs for a 12-user workspace billed annually. Standard Meta WhatsApp template &amp; optional WebRTC calling wallet usage are metered transparently.
          </p>
        </div>

        {/* ─── 3B. Why Choose Leadsetu Over Other Indian Market CRMs ──── */}
        <div id="why-leadsetu" className="mt-20 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
              <Layers className="w-4 h-4" /> Why Switch to Leadsetu?
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Built where traditional Indian CRMs leave gaps
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              See why growing B2B teams replace legacy per-seat CRMs and disconnected WhatsApp tools with one unified revenue platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyUsAdvantages.map((adv) => (
              <div
                key={adv.title}
                className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-[#0057FF]/40 transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
                    {adv.title}
                  </h3>

                  <div className="space-y-3">
                    <div className="rounded-xl p-3 bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-900/40">
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                        <X className="w-3.5 h-3.5 stroke-[2.8]" />
                        <span>Other Market CRMs</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {adv.otherCrms}
                      </p>
                    </div>

                    <div className="rounded-xl p-3 bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/40">
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                        <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                        <span>With Leadsetu CRM</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                        {adv.leadsetu}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 4. On-Demand Top-Up Packs ──────────────────────────────── */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-1.5">
                <Zap className="w-3.5 h-3.5" /> Flexible Top-Up Packs
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Scale AI, WhatsApp, Calling, or Storage on demand
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Buy 1-click packs via Razorpay inside <strong>Settings → Billing</strong> anytime without upgrading your monthly tier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topupPacks.map((pack) => {
              const Icon = pack.icon;
              return (
                <div
                  key={pack.title}
                  className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pack.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-black text-[#0057FF] dark:text-sky-400 tabular-nums shrink-0">
                      {pack.price}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {pack.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {pack.unit} · +18% GST
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

        {/* ─── 5. Side-by-Side Feature Comparison Matrix ────────────────── */}
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
            <table className="w-full min-w-[780px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70">
                  <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Modules &amp; Limits
                  </th>
                  <th className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white text-center">
                    Starter
                  </th>
                  <th className="py-4 px-4 text-sm font-black text-[#0057FF] dark:text-sky-400 text-center bg-blue-50/50 dark:bg-[#0057FF]/10">
                    Growth
                  </th>
                  <th className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white text-center">
                    Enterprise
                  </th>
                  <th className="py-4 px-4 text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 text-center bg-rose-50/40 dark:bg-rose-950/20">
                    Other Market CRMs
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

        {/* ─── 6. SaaS Billing & Product Q&A ───────────────────────────── */}
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
          colSpan={5}
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
          <td className="py-3.5 px-4 text-center">
            {renderMatrixValue(row.starter)}
          </td>
          <td className="py-3.5 px-4 text-center bg-blue-50/35 dark:bg-[#0057FF]/5">
            {renderMatrixValue(row.growth, true)}
          </td>
          <td className="py-3.5 px-4 text-center">
            {renderMatrixValue(row.enterprise)}
          </td>
          <td className="py-3.5 px-4 text-center bg-rose-50/25 dark:bg-rose-950/10">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {row.market}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

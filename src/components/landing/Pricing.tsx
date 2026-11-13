'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    tagline: 'For solo founders & small sales teams',
    price: { monthly: 999, annual: 799 },
    description: 'Everything you need to stop losing leads on spreadsheets and personal WhatsApp.',
    features: [
      'Up to 3 team members included',
      '1,000 active leads / month',
      'Official WhatsApp Cloud API inbox',
      'Visual Kanban pipeline (3 stages)',
      'Gemini AI lead scoring (100/mo)',
      'Standard email & chat support',
    ],
    cta: 'Start 14-Day Free Trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    tagline: 'For scaling SMEs & high-velocity teams',
    price: { monthly: 2999, annual: 2399 },
    description: 'Full AI automation, marketplace integrations & multi-agent WhatsApp power.',
    features: [
      'Up to 12 team members included',
      '10,000 active leads / month',
      'WhatsApp + IndiaMART + Meta Ads sync',
      'Unlimited custom pipelines & stages',
      'Unlimited Gemini AI scoring & replies',
      'Zero-code workflow & follow-up automation',
      '1-Click GST quotation & Razorpay links',
      'Priority WhatsApp & phone support',
    ],
    cta: 'Start 14-Day Free Trial',
    highlighted: true,
    badge: 'Most Popular for SMEs',
  },
  {
    name: 'Enterprise',
    tagline: 'For multi-branch & large organizations',
    price: { monthly: 7999, annual: 6399 },
    description: 'Custom AI agents, dedicated account manager, ERP sync & enterprise SLAs.',
    features: [
      'Unlimited team members & branches',
      'Unlimited leads & conversations',
      'Custom Tally Prime / ERP / Webhook sync',
      'Custom-trained Gemini AI sales agent',
      'Role-based hierarchy & field permissions',
      'Dedicated Delhi-NCR onboarding manager',
      '99.9% uptime SLA & audit logs',
    ],
    cta: 'Talk to Sales Team',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Do I need a credit card to start the 14-day free trial?',
    a: 'No! You can create your workspace, connect your WhatsApp Business number, and invite your team in under 5 minutes without entering any card or UPI details.',
  },
  {
    q: 'Can I use my existing WhatsApp Business number?',
    a: 'Yes. As an Official Meta Tech Partner integration, we help you connect your existing number to the WhatsApp Cloud API with green-tick verification support and multi-agent access.',
  },
  {
    q: 'Will you help migrate our existing leads from Excel or another CRM?',
    a: 'Absolutely. Every Growth and Enterprise plan includes free white-glove CSV/Excel import and pipeline setup by our onboarding specialists.',
  },
  {
    q: 'Do you provide GST-compliant tax invoices?',
    a: 'Yes, all subscriptions are billed in INR (₹) and you receive an automated 18% GST tax invoice every billing cycle so you can claim full Input Tax Credit (ITC).',
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="pricing" className="py-24 md:py-32 bg-white dark:bg-[#070D19] relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border bg-brand-light dark:bg-brand-blue/15 text-brand-blue dark:text-brand-sky border-brand-blue/25">
            <Sparkles className="w-3.5 h-3.5" /> Honest INR Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-brand-navy dark:text-white">
            Flat team pricing.{' '}
            <span className="text-gradient-navy">Zero per-seat surprises.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg mb-8">
            Unlike foreign CRMs that charge $50 per user every month, Leadsetu gives your whole
            team predictable INR pricing.
          </p>

          {/* Billing Period Switcher */}
          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !annual
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-navy dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                annual
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.highlighted
                  ? 'shadow-navy-xl lg:-translate-y-3 border-2'
                  : 'border border-slate-200/90 dark:border-slate-800 hover:border-brand-blue/50 hover:shadow-brand-sm bg-[#FAFCFF] dark:bg-[#0F172A]'
              }`}
              style={
                plan.highlighted
                  ? {
                      background: 'linear-gradient(160deg, #17243A 0%, #0D1829 100%)',
                      borderColor: '#3978EA',
                    }
                  : undefined
              }
            >
              {plan.badge && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #3978EA 0%, #2563EB 100%)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" /> {plan.badge}
                </div>
              )}

              <div>
                {/* Plan Title & Tagline */}
                <div className="mb-6">
                  <div
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      plan.highlighted ? 'text-brand-sky' : 'text-brand-blue'
                    }`}
                  >
                    {plan.tagline}
                  </div>
                  <h3
                    className={`font-extrabold text-2xl mb-2 ${
                      plan.highlighted ? 'text-white' : 'text-brand-navy dark:text-white'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      plan.highlighted ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-7 pb-6 border-b border-slate-200/20 dark:border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${
                        plan.highlighted ? 'text-white' : 'text-brand-navy dark:text-white'
                      }`}
                    >
                      ₹{(annual ? plan.price.annual : plan.price.monthly).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        plan.highlighted ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      / month
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    {annual ? (
                      <span className="font-semibold text-emerald-500">
                        You save ₹
                        {((plan.price.monthly - plan.price.annual) * 12).toLocaleString('en-IN')}{' '}
                        per year
                      </span>
                    ) : (
                      <span className={plan.highlighted ? 'text-slate-400' : 'text-slate-400'}>
                        Billed monthly · Switch to annual for 20% off
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: plan.highlighted
                            ? 'rgba(57, 120, 234, 0.25)'
                            : 'rgba(57, 120, 234, 0.12)',
                          color: plan.highlighted ? '#68A0FF' : '#3978EA',
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className={plan.highlighted ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register"
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  plan.highlighted
                    ? 'btn-primary-brand text-white hover:-translate-y-0.5'
                    : 'bg-brand-light dark:bg-slate-800 text-brand-blue dark:text-brand-sky hover:bg-brand-blue hover:text-white'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* All Plans Include Trust Strip */}
        <div className="mt-10 rounded-2xl p-5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2 text-brand-navy dark:text-white">
            <ShieldCheck className="w-4 h-4 text-brand-blue" /> Included in every plan:
          </span>
          <span>✓ 14-Day Free Trial</span>
          <span>✓ Free Excel / CSV Lead Migration</span>
          <span>✓ 18% GST Tax Invoice (Claim ITC)</span>
          <span>✓ 256-Bit Encrypted Indian Cloud</span>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue dark:text-brand-sky mb-2">
              <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white">
              Got questions? We&apos;ve got answers.
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="font-bold text-sm sm:text-base text-brand-navy dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-blue flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
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

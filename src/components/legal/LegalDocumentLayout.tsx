import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export interface LegalSection {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
}

const LEGAL_NAV = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'DPDP & Compliance', href: '/compliance' },
  { label: 'Security Policy', href: '/security' },
  { label: 'Uptime SLA', href: '/sla' },
];

export default function LegalDocumentLayout({
  activeHref,
  badge,
  title,
  subtitle,
  lastUpdated = 'November 28, 2026',
  sections,
}: {
  activeHref: string;
  badge: string;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen font-sans antialiased bg-white dark:bg-[#070D19] text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-28 pb-12 md:pt-36 md:pb-14 border-b border-slate-200/80 dark:border-white/10 bg-[#F8FAFF] dark:bg-[#091224]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-sky-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Effective Date: {lastUpdated}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border bg-brand-light dark:bg-brand-blue/15 text-brand-blue dark:text-sky-300 border-brand-blue/25">
            <ShieldCheck className="w-3.5 h-3.5" /> {badge}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-brand-navy dark:text-white">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {subtitle}
          </p>

          {/* Cross-navigation pills across legal pages */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {LEGAL_NAV.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                      : 'bg-white dark:bg-[#0D1628] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-brand-blue/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sticky TOC & Entity Info */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#0D1628] p-5 space-y-3 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                <FileText className="w-3.5 h-3.5 text-brand-blue" />
                <span>Document Outline</span>
              </div>
              <nav className="space-y-1.5">
                {sections.map((s, idx) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-blue dark:hover:text-sky-400 py-1 transition-colors"
                  >
                    {idx + 1}. {s.title}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Leadsetu Technologies
                    </div>
                    <div>Anujali Technologies Pvt. Ltd.</div>
                    <div>Sector 62, Noida, UP – 201309, India</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                  <a
                    href="mailto:hello@leadsetu.in"
                    className="font-bold text-brand-blue dark:text-sky-400 hover:underline"
                  >
                    hello@leadsetu.in
                  </a>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>DPDP Act 2023 &amp; GST Compliant</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Policy Clauses */}
          <div className="lg:col-span-8 space-y-6">
            {sections.map((s, idx) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-24 rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1628] p-6 space-y-3 shadow-xs"
              >
                <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white">
                  {idx + 1}. {s.title}
                </h2>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {s.body.map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="pt-1 space-y-2">
                    {s.bullets.map((item, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

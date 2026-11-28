import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Cpu,
  Globe,
  Layers,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';
import CompanySubnav from '@/components/company/CompanySubnav';

export const metadata: Metadata = {
  title: 'About Us | Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)',
  description:
    'Meet Anjali Yadav (Founder & CEO) and learn how Leadsetu Technologies builds India’s flagship AI-powered B2B CRM, WhatsApp Cloud & 18% GST platform.',
};

const companyStats = [
  { value: '4,500+', label: 'Indian B2B Teams', accent: 'text-[#0057FF] dark:text-sky-400' },
  { value: '14', label: 'Unified CRM Modules', accent: 'text-emerald-600 dark:text-emerald-400' },
  { value: '< 15 sec', label: 'AI WhatsApp Draft Speed', accent: 'text-indigo-600 dark:text-indigo-400' },
  { value: '100%', label: 'Rule-46 GST & DPDP Ready', accent: 'text-amber-600 dark:text-amber-400' },
];

export default function AboutCompanyPage() {
  return (
    <main className="min-h-screen font-sans antialiased bg-white dark:bg-[#070D19]">
      <Navbar />

      {/* ─── 1. Hero Header ───────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden border-b border-slate-200/70 dark:border-slate-800">
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[480px] dark:opacity-35"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 87, 255, 0.14) 0%, rgba(56, 189, 248, 0.06) 45%, transparent 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <CompanySubnav />

          <div className="block">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-blue-50/90 dark:bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-300 border-[#0057FF]/25">
              <Sparkles className="w-3.5 h-3.5" /> Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] max-w-4xl mx-auto">
            Engineering India&apos;s sharpest{' '}
            <span className="bg-gradient-to-r from-[#0057FF] to-[#2563EB] dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              B2B Revenue Operating System.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Built for Indian commerce, Leadsetu unifies IndiaMART lead capture, Official WhatsApp Cloud,
            SetuAI deal intelligence, and automated 18% GST collections inside a single platform built
            for how Indian businesses actually close deals.
          </p>

          {/* Key Company Metrics */}
          <div className="pt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {companyStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 bg-white/90 dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm text-center"
              >
                <div className={`text-2xl sm:text-3xl font-black tracking-tight ${stat.accent}`}>
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. Founder & CEO Note Spotlight ──────────────────────────── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-[32px] p-8 sm:p-10 lg:p-12 text-white shadow-2xl border border-white/10 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #091224 0%, #102145 55%, #0D182F 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)' }}
          />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-start gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0057FF] via-sky-500 to-emerald-400 p-[2px] shadow-xl">
                <div className="w-full h-full rounded-[22px] bg-[#0B1528] flex items-center justify-center text-2xl font-black text-white">
                  AY
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold uppercase tracking-wider text-sky-300 mb-2">
                  <Award className="w-3.5 h-3.5" /> Founder &amp; CEO
                </div>
                <h2 className="text-2xl font-black text-white">Anjali Yadav</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Leadsetu Technologies · Anujali Technologies Pvt. Ltd.
                </p>
              </div>
              <Link
                href="/company/leadership"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-300 hover:text-white transition-colors"
              >
                <span>Read Leadership &amp; Mission</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <Quote className="w-8 h-8 text-sky-400/70" />
              <p className="text-base sm:text-xl font-semibold text-slate-100 leading-relaxed">
                &ldquo;Indian B2B companies don&apos;t fail because they lack leads—they lose deals in
                personal WhatsApp chats, delayed quotes, and manual GST reconciliation. We built
                Leadsetu so every SME from Noida to Mumbai can run with enterprise AI precision,
                strict data privacy, and predictable INR pricing.&rdquo;
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2 text-[11px] font-bold text-slate-300">
                <span className="px-3 py-1 rounded-full bg-white/[0.07] border border-white/10">
                  Noida Sector 62 HQ
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.07] border border-white/10">
                  Built for Indian B2B SMEs
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Why Leadsetu Architecture Stands Apart ────────────────── */}
      <section className="py-16 bg-slate-50/75 dark:bg-[#091224] border-y border-slate-200/70 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              One platform replacing four disconnected tools
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Designed from the ground up around Indian B2B buyer behavior and compliance standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: 'Official WhatsApp & Marketplace Sync',
                points: [
                  'Meta WhatsApp Cloud API green-tick inbox',
                  'Real-time IndiaMART, Meta & Justdial sync',
                  'WebRTC browser voice calling & diagnostics',
                ],
              },
              {
                icon: Cpu,
                title: 'SetuAI Neural Core Engine',
                points: [
                  'Live 1–100 lead intent & urgency scoring',
                  'Hinglish & English AI replies in < 15 sec',
                  'Product & Document Vault RAG Copilot',
                ],
              },
              {
                icon: ShieldCheck,
                title: 'Rule-46 GST & DPDP Governance',
                points: [
                  'Auto CGST+SGST / IGST CPQ & Tax Invoices',
                  'Razorpay AR settlement & auto credit hold clear',
                  'Anti-Data-Leak phone masking & audit trail',
                ],
              },
            ].map(({ icon: Icon, title, points }) => (
              <div
                key={title}
                className="rounded-3xl p-7 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Explore More About Leadsetu ───────────────────────────── */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: 'Leadership & Mission',
              desc: 'Explore Anjali Yadav’s product vision, engineering principles, and growth roadmap.',
              href: '/company/leadership',
              cta: 'Meet Leadership',
            },
            {
              icon: Layers,
              title: 'Careers at Leadsetu',
              desc: 'Join builders shipping NestJS, Next.js, WebRTC, and LLM systems for Indian SMEs.',
              href: '/company/careers',
              cta: 'View Open Roles',
            },
            {
              icon: Building2,
              title: 'Contact & Office',
              desc: 'Visit our Noida Sector 62 HQ or book a live product walkthrough with our team.',
              href: '/company/contact',
              cta: 'Get in Touch',
            },
          ].map(({ icon: Icon, title, desc, href, cta }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-3xl p-7 bg-[#FAFCFF] dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 hover:border-[#0057FF]/50 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-sky-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#0057FF] dark:group-hover:text-sky-400 transition-colors">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {desc}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0057FF] dark:text-sky-400">
                {cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <CTABanner />
      <Footer />
    </main>
  );
}

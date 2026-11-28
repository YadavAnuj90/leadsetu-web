import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Cpu,
  Lock,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';
import CompanySubnav from '@/components/company/CompanySubnav';

export const metadata: Metadata = {
  title: 'Leadership & Mission | Leadsetu Technologies',
  description:
    'Leadership profile of Anjali Yadav, Founder & CEO of Leadsetu Technologies (Anujali Technologies Pvt. Ltd.), our mission, core operating principles, and milestones.',
};

const principles = [
  {
    icon: Target,
    title: 'Built for Real Indian Sales Floors',
    desc: 'Every screen is tested against real B2B bottlenecks: messy IndiaMART exports, multilingual Hinglish buyer chats, and multi-state CGST/IGST calculations.',
  },
  {
    icon: Lock,
    title: 'Multi-Tenant Privacy & DPDP First',
    desc: 'Customer business data belongs strictly to that workspace. Phone masking, agent export shields, immutable audit trails, and audited support access are non-negotiable.',
  },
  {
    icon: Cpu,
    title: 'Practical AI That Closes Deals',
    desc: 'No gimmick chatbots. SetuAI scores buyer urgency, summarizes WhatsApp threads, drafts quotes grounded in your exact SKUs/HSN codes, and builds automations from plain English.',
  },
];

const milestones = [
  {
    year: '2024',
    title: 'Foundation of Leadsetu',
    detail:
      'Anjali Yadav founded Leadsetu Technologies (Anujali Technologies Pvt. Ltd.) after seeing SME distributors lose 30%+ inbound inquiries between spreadsheets and personal WhatsApp.',
  },
  {
    year: '2025',
    title: 'SetuAI & Official WhatsApp Cloud',
    detail:
      'Launched real-time Lead Intent Scoring, Hinglish Smart Drafts, Meta Cloud shared inbox, and WebRTC browser calling with TURN diagnostics.',
  },
  {
    year: '2026',
    title: '14-Module Full Revenue & GST OS',
    detail:
      'Expanded to full Rule-46 18% GST CPQ & invoicing, Razorpay webhook AR auto-reconciliation, Document RAG Copilot, and Super Admin multi-tenant governance across 4,500+ teams.',
  },
];

export default function LeadershipMissionPage() {
  return (
    <main className="min-h-screen font-sans antialiased bg-white dark:bg-[#070D19]">
      <Navbar />

      {/* ─── Hero Header ──────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden border-b border-slate-200/70 dark:border-slate-800">
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[440px] dark:opacity-35"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 87, 255, 0.14) 0%, transparent 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <CompanySubnav />

          <div className="block">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-blue-50/90 dark:bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-300 border-[#0057FF]/25">
              <Compass className="w-3.5 h-3.5" /> Leadership &amp; Mission
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-4xl mx-auto">
            Driven by clarity, compliance &amp;{' '}
            <span className="bg-gradient-to-r from-[#0057FF] to-[#2563EB] dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              measurable SME growth.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Our leadership combines deep Indian B2B commerce intuition with modern AI infrastructure
            so growing teams scale from 3 reps to 500 without software chaos.
          </p>
        </div>
      </section>

      {/* ─── Executive Profile: Anjali Yadav (Founder & CEO) ──────────── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div
            className="lg:col-span-5 rounded-[32px] p-8 text-white shadow-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden"
            style={{
              background:
                'linear-gradient(155deg, #0D1B38 0%, #091224 65%, #060B16 100%)',
            }}
          >
            <div
              className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, #0057FF 0%, transparent 70%)' }}
            />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0057FF] via-sky-500 to-emerald-400 p-[2px] shadow-xl">
                  <div className="w-full h-full rounded-[22px] bg-[#0B1528] flex items-center justify-center text-2xl font-black text-white">
                    AY
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-extrabold text-emerald-300">
                  CEO &amp; Founder
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Anjali Yadav</h2>
                <p className="text-xs font-semibold text-sky-300 mt-1">
                  Founder &amp; Chief Executive Officer · Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Leading product architecture, enterprise partnerships, and AI revenue strategy across
                Pan-India, focused on helping Indian businesses replace fragmented tools
                with one unified CRM + GST engine.
              </p>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Architect of SetuAI &amp; Zero-Leak B2B CRM Vision</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Based in Noida HQ &amp; New Delhi, India</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-[32px] p-8 sm:p-10 bg-[#FAFCFF] dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
                <Award className="w-4 h-4" /> CEO&apos;s Letter &amp; Vision
              </div>
              <Quote className="w-7 h-7 text-[#0057FF]/40" />
              <blockquote className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                &ldquo;Software should adapt to how Indian founders, managers, and GST accountants
                actually work—never the other way around.&rdquo;
              </blockquote>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                At Leadsetu Technologies, our commitment under Anjali Yadav&apos;s leadership is
                simple: keep pricing honest in INR, protect tenant customer data with strict RBAC and
                DPDP privacy boundaries, and ship pragmatic SetuAI automations that save every sales
                team hours every day.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <Link
                href="/company/careers"
                className="px-5 py-2.5 rounded-full text-xs font-extrabold text-white bg-[#0057FF] hover:bg-[#0046D5] inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Build With Us</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/company/contact"
                className="px-5 py-2.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Connect With Leadership Desk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Operating Principles ─────────────────────────────────────── */}
      <section className="py-16 bg-slate-50/75 dark:bg-[#091224] border-y border-slate-200/70 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Our Operating Principles
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              How every Leadsetu product decision is made
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {principles.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl p-7 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Journey & Milestones ─────────────────────────────────────── */}
      <section className="py-16 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
            <ShieldCheck className="w-4 h-4" /> Company Journey
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            From Noida whiteboard to 4,500+ active teams
          </h2>
        </div>

        <div className="space-y-4">
          {milestones.map((m) => (
            <div
              key={m.year}
              className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="px-4 py-2 rounded-xl bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-400 font-black text-lg tabular-nums shrink-0 text-center">
                {m.year}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {m.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {m.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTABanner />
      <Footer />
    </main>
  );
}

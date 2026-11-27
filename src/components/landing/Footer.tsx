'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  Building2,
  Globe,
  Cpu,
} from 'lucide-react';

const footerLinks = {
  'About Company': [
    { label: 'About Us', href: '/company' },
    { label: 'Careers', href: '/company/careers' },
    { label: 'Leadership & Mission', href: '/company/leadership' },
    { label: 'Customer Stories', href: '/#testimonials' },
    { label: 'Contact & Offices', href: '/company/contact' },
  ],
  'Indian Integrations': [
    { label: 'WhatsApp Business Cloud', href: '/#integrations' },
    { label: 'IndiaMART Lead Sync', href: '/#integrations' },
    { label: 'Meta & Google Lead Ads', href: '/#integrations' },
    { label: 'Razorpay UPI & NEFT', href: '/#integrations' },
    { label: 'Rule-46 GSTR-1 & Tally CSV', href: '/#features' },
  ],
  'Company & Plans': [
    { label: 'Plans & Billing FAQ', href: '/pricing' },
    { label: 'Compare All Plans', href: '/pricing#compare' },
    { label: 'Customer Case Studies', href: '/#testimonials' },
    { label: 'Start 14-Day Free Trial', href: '/signup' },
    { label: 'Sign In to Workspace', href: '/login' },
    { label: 'Register Company Account', href: '/register' },
  ],
  'Trust & Compliance': [
    { label: 'DPDP Act 2023 Shield', href: '/#integrations' },
    { label: 'Anti-Data-Leak Phone Masking', href: '/#features' },
    { label: 'Immutable Audit Trail', href: '/#features' },
    { label: '256-Bit SSL Encryption', href: '/pricing#faq' },
    { label: '99.9% Uptime SLA Policy', href: '/pricing#faq' },
  ],
};

export default function Footer() {
  const [subEmail, setSubEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubscribed(true);
    setSubEmail('');
  };

  return (
    <footer
      className="relative overflow-hidden text-slate-300"
      style={{
        background:
          'linear-gradient(180deg, #091224 0%, #060C18 60%, #040812 100%)',
      }}
    >
      {/* Luminous Top Accent Line */}
      <div
        className="h-[2px] w-full opacity-90"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #0057FF 25%, #38BDF8 50%, #E42527 80%, transparent 100%)',
        }}
      />

      {/* Ambient Corporate Radial Glows */}
      <div
        className="pointer-events-none absolute -top-28 left-1/4 w-[520px] h-[280px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #0057FF 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-16 right-1/5 w-[420px] h-[240px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* ─── 1. Frosted Newsletter & Executive Brief Card ───────────── */}
        <div className="rounded-3xl p-6 sm:p-8 lg:p-10 bg-white/[0.03] border border-white/[0.09] backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-7">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#0057FF]/15 text-sky-300 border border-[#0057FF]/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> The Monday Revenue Dispatch
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-[26px] font-black text-white tracking-tight leading-snug">
              Steal-worthy WhatsApp templates, Hinglish AI prompts &amp; GST closing playbooks — every Monday.
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Trusted by 4,500+ founders, revenue heads, and finance teams scaling B2B sales across Delhi-NCR &amp; Pan-India.
            </p>
          </div>

          {subscribed ? (
            <div className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Subscribed! Check your inbox for this week&apos;s WhatsApp &amp; GST playbook.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl sm:rounded-full bg-white/[0.04] border border-white/15 focus-within:border-[#0057FF]/70 transition-colors"
            >
              <input
                type="email"
                required
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder="Enter your work email..."
                className="w-full sm:w-64 lg:w-72 px-4 py-2.5 rounded-full text-sm text-white placeholder-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#E42527] to-[#D61F3C] hover:from-[#C81E1E] hover:to-[#B81632] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5"
              >
                <span>Subscribe Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* ─── 2. Corporate Profile & Sitemap Grid ────────────────────── */}
        <div className="py-14 grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10">
          {/* Corporate Column */}
          <div className="col-span-2 md:col-span-6 lg:col-span-4 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-white/20 bg-gradient-to-br from-[#0057FF] to-[#0D1628] flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Leadsetu Logo"
                  className="w-full h-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070E1A]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-white tracking-tight">
                    Leadsetu
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-wide bg-gradient-to-r from-[#0057FF] to-[#2563EB] text-white">
                    CRM
                  </span>
                </div>
                <span className="block text-[11px] text-sky-400/90 font-semibold mt-0.5">
                  Bridge Every Lead to Revenue
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-[13px] leading-relaxed max-w-sm">
              Built by <strong className="text-slate-200 font-semibold">Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)</strong> — India&apos;s flagship AI revenue platform combining Official WhatsApp Cloud, SetuAI Intent Scoring, and Rule-46 18% GST collections.
            </p>

            {/* Corporate Office Cards */}
            <div className="rounded-2xl p-4 bg-white/[0.025] border border-white/[0.08] space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Noida HQ:</strong> Sector 62, Noida Electronic City, UP – 201309
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Delhi Desk:</strong> Connaught Place, New Delhi – 110001
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.07] flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <a
                  href="mailto:hello@leadsetu.in"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>hello@leadsetu.in</span>
                </a>
                <a
                  href="tel:+918851520832"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>+91 8851520832</span>
                </a>
              </div>
            </div>

            {/* Quick Auth Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#E42527] to-[#D61F3C] hover:from-[#C81E1E] hover:to-[#B81632] text-white shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
              >
                <span>Start 14-Day Trial</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-bold border border-white/15 bg-white/[0.03] text-white hover:bg-white/10 transition-colors"
              >
                Workspace Sign In
              </Link>
            </div>
          </div>

          {/* 4 Navigation Columns */}
          {Object.entries(footerLinks).map(([category, items]) => (
            <div key={category} className="col-span-1 md:col-span-3 lg:col-span-2">
              <h4 className="font-extrabold text-white text-[11px] uppercase tracking-[0.14em] mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]" />
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-slate-400 text-[13px] hover:text-white hover:translate-x-0.5 inline-flex items-center transition-all"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── 3. Enterprise Trust & Regional Cloud Status Bar ─────────── */}
        <div className="py-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> DPDP Act 2023 Ready
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-sky-400" /> 256-Bit TLS &amp; SAC 998314 GST
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Meta Cloud Partner API
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-300 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational · Mumbai &amp; Delhi-NCR Region</span>
          </div>
        </div>

        {/* Subtle Architectural Brand Wordmark Accent */}
        <div
          aria-hidden="true"
          className="pt-4 pb-2 text-center select-none overflow-hidden"
        >
          <div className="text-[48px] sm:text-[84px] lg:text-[108px] font-black tracking-[-0.04em] leading-none text-white/[0.028]">
            LEADSETU TECHNOLOGIES
          </div>
        </div>

        {/* ─── 4. Bottom Copyright Bar ────────────────────────────────── */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Leadsetu Technologies (Anujali Technologies Pvt. Ltd.) · CIN &amp; GSTIN Compliance Ready · Built in Delhi-NCR, India.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <span>Intelligence powered by</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#0057FF]/15 border border-[#0057FF]/35 text-sky-300">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> SetuAI Neural Core
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

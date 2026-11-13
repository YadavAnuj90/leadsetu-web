'use client';

import Link from 'next/link';
import {
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'AI Lead Scoring', href: '#features' },
    { label: 'WhatsApp Cloud Inbox', href: '#features' },
    { label: 'Visual Deal Pipelines', href: '#features' },
    { label: 'Zero-Code Workflows', href: '#how-it-works' },
    { label: 'Pricing & Plans', href: '#pricing' },
  ],
  Integrations: [
    { label: 'WhatsApp Business API', href: '#integrations' },
    { label: 'IndiaMART Lead Sync', href: '#integrations' },
    { label: 'Meta & Google Ads', href: '#integrations' },
    { label: 'Razorpay Payment Links', href: '#integrations' },
    { label: 'Tally Prime & GST', href: '#integrations' },
  ],
  Company: [
    { label: 'About Leadsetu', href: '#' },
    { label: 'Customer Stories', href: '#testimonials' },
    { label: 'Partner Program', href: '#' },
    { label: 'Careers (Hiring)', href: '#' },
    { label: 'Contact Sales', href: '#pricing' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'DPDP Act 2023 Compliance', href: '#' },
    { label: 'Security & Encryption', href: '#' },
    { label: 'Refund & SLA Policy', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer
      className="text-slate-300 border-t border-white/10"
      style={{ background: 'linear-gradient(180deg, #0D1829 0%, #08101D 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Playbook Strip */}
        <div className="py-12 border-b border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-sky mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Free Weekly SME Sales Playbook
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Get high-converting WhatsApp templates &amp; AI sales tips
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Read by 4,500+ founders and sales heads across Delhi, Noida &amp; Gurugram.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <input
              type="email"
              placeholder="Enter your work email..."
              className="w-full sm:w-72 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-400 bg-white/5 border border-white/15 focus:outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              className="btn-primary-brand px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Main Footer Columns */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10">
          {/* Brand & Contact Column */}
          <div className="col-span-2 md:col-span-6 lg:col-span-4 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-white/20 flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Leadsetu Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Lead<span style={{ color: '#68A0FF' }}>setu</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium -mt-0.5">
                  Bridge Every Lead to Revenue
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              India&apos;s first AI-powered CRM engineered for high-velocity SMEs. Capture,
              qualify, and close buyers across WhatsApp, IndiaMART, Meta Ads, and field sales.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand-sky flex-shrink-0" />
                <span>Noida Electronic City, Noida, Uttar Pradesh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-sky flex-shrink-0" />
                <span>hello@leadsetu.in · support@leadsetu.in</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-sky flex-shrink-0" />
                <a href="tel:+918851520832" className="hover:text-white transition-colors">
                  +91 8851520832 (Mon–Sat, 9 AM – 8 PM IST)
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              {[
                { label: 'X', icon: '𝕏' },
                { label: 'LinkedIn', icon: 'in' },
                { label: 'YouTube', icon: '▶' },
                { label: 'WhatsApp', icon: 'WA' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white hover:bg-brand-blue/20 hover:border-brand-blue/40 transition-all border border-white/10"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, items]) => (
            <div key={category} className="col-span-1 md:col-span-3 lg:col-span-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-slate-400 text-sm hover:text-brand-sky transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance & Security Badges Strip */}
        <div className="py-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> DPDP Act 2023 Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              <Lock className="w-4 h-4 text-brand-sky" /> 256-Bit SSL Encryption
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Meta Business Partner Ready
            </span>
          </div>

          {/* Live System Status */}
          <div className="inline-flex items-center gap-2 text-xs text-slate-300 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational · Mumbai &amp; Delhi NCR Regions</span>
          </div>
        </div>

        {/* Bottom Copyright & Gemini Badge */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Leadsetu Technologies Pvt. Ltd. All rights reserved.
            Crafted with ❤️ in Delhi-NCR, India.
          </p>

          <div className="flex items-center gap-2">
            <span>Intelligence powered by</span>
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border"
              style={{
                background: 'rgba(57, 120, 234, 0.16)',
                borderColor: 'rgba(104, 160, 255, 0.3)',
                color: '#93C5FD',
              }}
            >
              <Sparkles className="w-3 h-3" /> Google Gemini AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

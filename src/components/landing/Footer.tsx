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
  Lock,
  CheckCircle2,
  Building2,
} from 'lucide-react';

const footerLinks = {
  'Product Suite': [
    { label: '360° Orbit Ecosystem', href: '/#orbit-360' },
    { label: 'Department Role Views', href: '/#team-views' },
    { label: 'AI Lead Scoring (1–100)', href: '/#features' },
    { label: '18% GST Invoices & CPQ', href: '/#features' },
    { label: 'SLA Field Service Desk', href: '/#team-views' },
    { label: 'INR Flat Team Pricing', href: '/#pricing' },
  ],
  'Indian Integrations': [
    { label: 'WhatsApp Business Cloud', href: '/#integrations' },
    { label: 'IndiaMART Lead Sync', href: '/#integrations' },
    { label: 'Meta & Google Lead Ads', href: '/#integrations' },
    { label: 'Razorpay UPI & NEFT', href: '/#integrations' },
    { label: 'Rule-46 GSTR-1 & Tally CSV', href: '/#features' },
  ],
  'Quick Access': [
    { label: 'Sign In to Workspace', href: '/login' },
    { label: 'Start 14-Day Free Trial', href: '/signup' },
    { label: 'Register Company Account', href: '/register' },
    { label: 'Compare Plans', href: '/#pricing' },
    { label: 'Customer Case Studies', href: '/#testimonials' },
  ],
  'Trust & Compliance': [
    { label: 'DPDP Act 2023 Shield', href: '/#integrations' },
    { label: 'Anti-Data-Leak Phone Masking', href: '/#features' },
    { label: 'Immutable Audit Trail', href: '/#features' },
    { label: '256-Bit SSL Encryption', href: '/#pricing' },
    { label: '99.9% Uptime SLA Policy', href: '/#pricing' },
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
      className="text-slate-300 border-t border-white/10"
      style={{ background: 'linear-gradient(180deg, #0D1829 0%, #070E1A 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Playbook & Quick-Launch Strip */}
        <div className="py-12 border-b border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Weekly Indian B2B Growth Playbook
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Get high-converting Hinglish WhatsApp templates &amp; GST sales checklists
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Trusted by 4,500+ founders and sales directors across Noida, New Delhi &amp; Gurugram.
            </p>
          </div>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Subscribed! Check your inbox for this week&apos;s WhatsApp templates.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <input
                type="email"
                required
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder="Enter your work email..."
                className="w-full sm:w-72 px-5 py-3 rounded-full text-sm text-white placeholder-slate-400 bg-white/5 border border-white/15 focus:outline-none focus:border-[#0057FF]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-sm font-bold text-white bg-[#E42527] hover:bg-[#C81E1E] inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-rose-600/20 transition-all"
              >
                <span>Subscribe Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Main Footer Columns */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10">
          {/* Brand & Offices Column */}
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
                  Lead<span style={{ color: '#68A0FF' }}>setu</span>{' '}
                  <span className="text-sm font-bold text-slate-300">CRM</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium -mt-0.5">
                  Bridge Every Lead to Revenue
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              India&apos;s flagship AI-powered CRM engineered for high-velocity B2B teams. Capture,
              qualify, quote with 18% GST, and collect payments faster across WhatsApp &amp; field sales.
            </p>

            {/* Dual Corporate Office Info */}
            <div className="space-y-2.5 text-xs text-slate-400 pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Noida HQ:</strong> Sector 62, Noida Electronic
                  City, Uttar Pradesh – 201309
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Delhi Office:</strong> Connaught Place, New
                  Delhi – 110001
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>hello@leadsetu.in · billing@leadsetu.in</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href="tel:+918851520832" className="hover:text-white transition-colors">
                  +91 8851520832 (Mon–Sat, 9 AM – 8 PM IST)
                </a>
              </div>
            </div>

            {/* Quick Auth Actions inside Footer */}
            <div className="flex items-center gap-2.5 pt-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-xs font-bold border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#E42527] hover:bg-[#C81E1E] text-white transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* 4 Navigation Columns */}
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
                      className="text-slate-400 text-sm hover:text-sky-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance & System Status Strip */}
        <div className="py-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> DPDP Act 2023 Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              <Lock className="w-4 h-4 text-sky-400" /> 256-Bit SSL &amp; GST Rule-46
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Meta Cloud Partner Ready
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-slate-300 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All 14 Modules Operational · Mumbai &amp; Delhi-NCR Cloud</span>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Leadsetu Technologies (Anujalite Tech Pvt. Ltd.). All rights
            reserved. Crafted in Delhi-NCR, India.
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

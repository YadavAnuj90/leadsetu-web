'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Bot,
  MessageSquare,
  Kanban,
  Workflow,
  Receipt,
  ShieldCheck,
  Send,
  Headphones,
  FileText,
  BarChart3,
  Building2,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useAuthStore } from '@/store/auth.store';

const productHighlights = [
  {
    icon: Bot,
    title: 'SetuAI Lead Scoring (1–100)',
    desc: 'Auto-qualify & rank every IndiaMART, Meta & WhatsApp buyer in real time',
    badge: 'Popular',
    href: '/#features',
  },
  {
    icon: MessageSquare,
    title: 'Unified WhatsApp Cloud Inbox',
    desc: 'Official Meta API, Hinglish & English AI smart replies in < 15 sec',
    badge: 'Official API',
    href: '/#features',
  },
  {
    icon: Receipt,
    title: '18% GST Invoices & CPQ Quotes',
    desc: 'Auto CGST+SGST (UP) or IGST (Inter-state) with HSN codes & Razorpay links',
    badge: 'Rule-46 GST',
    href: '/#orbit-360',
  },
  {
    icon: Send,
    title: 'WhatsApp Broadcast Campaigns',
    desc: 'Green-tick festival & catalogue blasts with live handset preview',
    badge: 'Zero Ban',
    href: '/#features',
  },
  {
    icon: Workflow,
    title: 'Zero-Code AI Workflows',
    desc: 'IF-THIS-THEN-THAT rules that auto-create tasks & route hot leads',
    href: '/#how-it-works',
  },
  {
    icon: Kanban,
    title: 'Department Views & Team RBAC',
    desc: '5-digit Account ID, 10-digit User IDs, territory views & revenue tracking',
    badge: '360° View',
    href: '/#team-views',
  },
];

const resourceLinks = [
  {
    icon: FileText,
    title: 'GSTR-1 & Tally Prime Guide',
    desc: 'Export CA-ready HSN summaries & TDS u/s 194C/194J reports',
    href: '/#features',
  },
  {
    icon: Headphones,
    title: 'SLA Field Service & AMC Desk',
    desc: '24h dispatch timers, engineer visit logs & buyer CSAT ratings',
    href: '/#team-views',
  },
  {
    icon: ShieldCheck,
    title: 'DPDP Act 2023 Security Shield',
    desc: 'Anti-Data-Leak phone masking, immutable audit logs & CSV locks',
    href: '/#integrations',
  },
  {
    icon: BarChart3,
    title: 'CEO Multi-Hub Analytics',
    desc: 'Noida, New Delhi & Gurugram attribution across 8 live collections',
    href: '/#orbit-360',
  },
];

const aiQuickPrompts = [
  {
    prompt: 'Score an IndiaMART 150 KVA Stabilizer inquiry',
    answer:
      'SetuAI Score: 94/100 (HOT BUYER). Detected: High-ticket B2B machinery request (Est. ₹4,50,000, Pan-India). Recommended Next Action: Auto-send Hinglish GST brochure on WhatsApp & assign to Senior Closer with a 15-min call task.',
  },
  {
    prompt: 'Calculate 18% GST split for Noida vs Delhi buyer',
    answer:
      'Seller Hub: Noida, UP (State Code 09). • If Buyer is in Uttar Pradesh (09): Auto-splits into 9% CGST + 9% SGST. • If Buyer is in New Delhi (07) / Haryana (06): Auto-applies 18% IGST with HSN verification & Rule-46 compliance.',
  },
  {
    prompt: 'Draft a polite Hinglish WhatsApp payment follow-up',
    answer:
      '"Namaste Rajesh ji 👋, RS Electricals Pvt. Ltd. ke Invoice #INV-2026-1002 ka ₹3,72,000 balance due hai. Instant NEFT / UPI / Razorpay settlement ke liye link open karein — 18% GST ITC copy attached hai. Dhanyavaad!"',
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<
    null | 'features' | 'resources'
  >(null);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [customQuery, setCustomQuery] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 14);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeAiResponse =
    customQuery.trim().length > 3
      ? `SetuAI Analysis for "${customQuery.trim()}": Leadsetu routes this across WhatsApp Cloud API, qualifies buyer intent via SetuAI Neural Core, generates a 18% GST Proforma Quote, and logs complete activity in your Audit Shield.`
      : aiQuickPrompts[selectedPromptIdx].answer;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* ─── Subtle Luminous Top Accent Line ─────────────────────────── */}
        <div
          className="h-[2px] w-full opacity-90"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, #0057FF 25%, #38BDF8 50%, #E42527 80%, transparent 100%)',
          }}
        />

        {/* ─── Main Sticky Product Navigation Bar ───────────────────────── */}
        <nav
          className={`transition-all duration-300 ${
            scrolled
              ? 'bg-white/95 dark:bg-[#070E1C]/95 backdrop-blur-2xl shadow-[0_12px_36px_-14px_rgba(15,23,42,0.28)] border-b border-slate-200/80 dark:border-white/10 py-2.5'
              : 'bg-white/80 dark:bg-[#070E1C]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/[0.08] py-3'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              {/* Brand Mark (Infinity Bridge CRM emblem + Leadsetu CRM) */}
              <Link
                href="/"
                className="flex items-center gap-2.5 group shrink-0 whitespace-nowrap"
              >
                <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-[#0057FF]/15 ring-1 ring-[#0057FF]/30 bg-gradient-to-br from-[#0057FF] to-[#0D1628] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <img
                    src="/logo.png"
                    alt="Leadsetu Logo"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#070E1C]" />
                </div>
                <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                      Leadsetu
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[11px] font-black tracking-wide bg-gradient-to-r from-[#0057FF] to-[#2563EB] text-white shadow-sm">
                      CRM
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-sky-400/90 tracking-wide mt-0.5 hidden xl:block">
                    Bridge Every Lead to Revenue
                  </span>
                </div>
              </Link>

              {/* Center Pill Navigation */}
              <div className="hidden lg:flex items-center gap-0.5 rounded-full px-1.5 py-1 bg-slate-100/80 dark:bg-white/[0.045] border border-slate-200/80 dark:border-white/[0.08]">
                {/* Features Mega Menu */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu('features')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    className={`flex items-center gap-1 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                      openMenu === 'features'
                        ? 'bg-white dark:bg-white/10 text-[#0057FF] dark:text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>Features</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        openMenu === 'features' ? 'rotate-180 text-[#0057FF] dark:text-sky-400' : ''
                      }`}
                    />
                  </button>

                  {openMenu === 'features' && (
                    <div className="absolute top-full left-0 pt-2.5 w-[640px] z-50">
                      <div className="bg-white dark:bg-[#0D1628] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5">
                        <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Leadsetu 360° AI Revenue Suite
                          </span>
                          <span className="text-[11px] font-bold text-[#0057FF] dark:text-sky-400">
                            Noida · New Delhi · Gurugram · Pan-India
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {productHighlights.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.title}
                                href={item.href}
                                onClick={() => setOpenMenu(null)}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/70 dark:hover:bg-slate-800/80 transition-colors group"
                              >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-sky-400">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0057FF]">
                                      {item.title}
                                    </span>
                                    {item.badge && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#0057FF] dark:text-sky-300">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                        <div className="p-3 rounded-xl flex items-center justify-between bg-[#111C33] text-white">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-slate-200 font-medium">
                              DPDP Act 2023 Shield · Rule-46 GST · 5-Digit Account ID
                            </span>
                          </div>
                          <Link
                            href="/signup"
                            onClick={() => setOpenMenu(null)}
                            className="text-xs font-bold text-sky-400 flex items-center gap-1 hover:underline"
                          >
                            Start 14-Day Trial <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/#orbit-360"
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all"
                >
                  360° Orbit
                </Link>

                <Link
                  href="/#team-views"
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all"
                >
                  Team Views
                </Link>

                <Link
                  href="/pricing"
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                    pathname === '/pricing'
                      ? 'bg-white dark:bg-[#0057FF]/25 text-[#0057FF] dark:text-sky-300 shadow-sm ring-1 ring-[#0057FF]/25'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  Pricing
                </Link>

                <Link
                  href="/#testimonials"
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all"
                >
                  Customers
                </Link>

                {/* Resources Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu('resources')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    className={`flex items-center gap-1 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                      openMenu === 'resources'
                        ? 'bg-white dark:bg-white/10 text-[#0057FF] dark:text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>Resources</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        openMenu === 'resources' ? 'rotate-180 text-[#0057FF] dark:text-sky-400' : ''
                      }`}
                    />
                  </button>

                  {openMenu === 'resources' && (
                    <div className="absolute top-full right-0 pt-2.5 w-80 z-50">
                      <div className="bg-white dark:bg-[#0D1628] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-1">
                        {resourceLinks.map((res) => {
                          const Icon = res.icon;
                          return (
                            <Link
                              key={res.title}
                              href={res.href}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {res.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                  {res.desc}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right CTAs: Compact ThemeToggle + Ask Setu AI + Sign In + Get Started */}
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <ThemeToggle compact />

                {/* Ask Setu AI Pill */}
                <button
                  type="button"
                  onClick={() => setAskAiOpen(true)}
                  className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-[#0E1A30] border border-[#0057FF]/35 dark:border-sky-400/30 shadow-sm hover:shadow-md hover:border-[#0057FF] dark:hover:border-sky-400 transition-all"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, rgba(0,87,255,0.08) 0%, rgba(168,85,247,0.10) 100%)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
                  <span>Ask Setu AI</span>
                </button>

                {!isAuthenticated && (
                  <Link
                    href="/login"
                    className="whitespace-nowrap px-3.5 py-2 rounded-full text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-all"
                  >
                    Sign In
                  </Link>
                )}

                <Link
                  href={isAuthenticated ? '/dashboard' : '/signup'}
                  className="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-[#E42527] to-[#D61F3C] hover:from-[#C81E1E] hover:to-[#B81632] shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5"
                >
                  <span>{isAuthenticated ? 'Open CRM' : 'Get Started'}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-2 lg:hidden shrink-0">
                <ThemeToggle compact />
                <button
                  type="button"
                  onClick={() => setAskAiOpen(true)}
                  className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-slate-800 text-[#0057FF] dark:text-sky-400 border border-blue-200 dark:border-slate-700"
                >
                  <Sparkles className="w-3 h-3" /> AI
                </button>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/signup'}
                  className="whitespace-nowrap text-xs font-bold px-3.5 py-2 rounded-full text-white bg-gradient-to-r from-[#E42527] to-[#D61F3C]"
                >
                  {isAuthenticated ? 'CRM' : 'Get Started'}
                </Link>
                <button
                  type="button"
                  aria-label="Toggle Menu"
                  className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="lg:hidden bg-white dark:bg-[#0B1320] border-t border-slate-100 dark:border-slate-800 shadow-2xl px-4 pt-4 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {productHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col gap-1.5"
                    >
                      <Icon className="w-4 h-4 text-[#0057FF]" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-col space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                {[
                  { label: '360° Orbit Ecosystem', href: '/#orbit-360' },
                  { label: 'Department Role Views', href: '/#team-views' },
                  { label: '14-Module Interactive Tour', href: '/#features' },
                  { label: 'Integrations', href: '/#integrations' },
                  { label: 'Pricing & Q&A', href: '/pricing' },
                  { label: 'Customer Stories', href: '/#testimonials' },
                ].map((nav) => (
                  <Link
                    key={nav.label}
                    href={nav.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#0057FF] transition-colors"
                  >
                    {nav.label}
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-center border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  Sign In to Account
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-3 rounded-xl text-sm font-bold text-center text-white bg-[#E42527] flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ─── Interactive "Ask Setu AI" Assistant Modal ───────────────────── */}
      {askAiOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAskAiOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-[#0B1320] via-[#17243A] to-[#0057FF] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sky-300" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">Ask Setu AI · Copilot Preview</div>
                  <div className="text-[11px] text-sky-200">
                    Test Hinglish Scoring, 18% GST Splits &amp; WhatsApp Replies
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAskAiOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                aria-label="Close AI preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Click a live B2B prompt or ask your own
              </div>

              <div className="flex flex-wrap gap-2">
                {aiQuickPrompts.map((item, idx) => (
                  <button
                    key={item.prompt}
                    type="button"
                    onClick={() => {
                      setCustomQuery('');
                      setSelectedPromptIdx(idx);
                    }}
                    className={`text-left text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                      selectedPromptIdx === idx && !customQuery.trim()
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-[#0057FF] text-[#0057FF] dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {item.prompt}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl p-4 bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SetuAI Response (Instant Preview)
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                  {activeAiResponse}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Type a scenario (e.g., Auto-assign Gurgaon real estate leads)..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0057FF]"
                />
                <Link
                  href="/signup"
                  onClick={() => setAskAiOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E42527] hover:bg-[#C81E1E] whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  <span>Try Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

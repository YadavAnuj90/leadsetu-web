'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Search,
  Globe,
  Headphones,
  FileText,
  BarChart3,
  Building2,
  Layers,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useAuthStore } from '@/store/auth.store';

const suiteModules = [
  { label: 'WhatsApp Cloud', href: '/#features' },
  { label: 'IndiaMART Sync', href: '/#integrations' },
  { label: '18% GST Billing', href: '/#orbit-360' },
  { label: 'CPQ Quotes', href: '/#orbit-360' },
  { label: 'SLA Desk', href: '/#team-views' },
  { label: 'Gemini AI Agents', href: '/#features' },
];

const productHighlights = [
  {
    icon: Bot,
    title: 'Gemini AI Lead Scoring (1–100)',
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
      'Gemini AI Score: 94/100 (HOT BUYER). Detected: High-ticket B2B machinery request (Est. ₹4,50,000, Delhi-NCR). Recommended Next Action: Auto-send Hinglish GST brochure on WhatsApp & assign to Senior Closer with a 15-min call task.',
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
  const { isAuthenticated, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<
    null | 'features' | 'resources' | 'suite'
  >(null);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [customQuery, setCustomQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [langLabel, setLangLabel] = useState<'English (India)' | 'Hinglish (NCR)'>('English (India)');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 14);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeAiResponse =
    customQuery.trim().length > 3
      ? `Setu AI Analysis for "${customQuery.trim()}": Leadsetu routes this across WhatsApp Cloud API, qualifies buyer intent via Gemini 2.5, generates a 18% GST Proforma Quote, and logs complete activity in your Audit Shield.`
      : aiQuickPrompts[selectedPromptIdx].answer;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* ─── TIER 1: Global Suite Utility Bar (Zoho-style Top Bar) ─────── */}
        <div
          className={`hidden md:block border-b border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#08101D]/95 backdrop-blur-md transition-all duration-300 ${
            scrolled ? 'h-0 overflow-hidden opacity-0 border-b-0' : 'h-11 opacity-100'
          }`}
        >
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
            {/* Left Suite Brand + Quick Module Links */}
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-extrabold tracking-tight text-slate-900 dark:text-white"
              >
                <img
                  src="/logo.png"
                  alt="Leadsetu Logo"
                  className="w-5 h-5 rounded-md object-cover shadow-sm ring-1 ring-[#0057FF]/30"
                />
                <span className="text-[11px] font-black tracking-[0.14em] text-slate-800 dark:text-slate-100 uppercase">
                  Leadsetu
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
                {suiteModules.map((mod) => (
                  <Link
                    key={mod.label}
                    href={mod.href}
                    className="hover:text-[#0057FF] dark:hover:text-sky-400 transition-colors whitespace-nowrap"
                  >
                    {mod.label}
                  </Link>
                ))}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu('suite')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF]"
                  >
                    All Modules <ChevronDown className="w-3 h-3" />
                  </button>
                  {openMenu === 'suite' && (
                    <div className="absolute top-full left-0 pt-2 w-72 z-50">
                      <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-1">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          14 Integrated CRM Modules
                        </div>
                        {[
                          { name: 'AI Command & Analytics', tag: 'CEO Cockpit', href: '/#orbit-360' },
                          { name: 'WhatsApp Cloud & Inbox', tag: 'Meta Official', href: '/#features' },
                          { name: 'GST Tax Invoices & AR Ledger', tag: 'Rule 46', href: '/#features' },
                          { name: 'Proforma Quotes (CPQ)', tag: 'Buyer Sign-off', href: '/#orbit-360' },
                          { name: 'SLA Service & AMC Tickets', tag: 'Field Desk', href: '/#team-views' },
                          { name: 'Document Center & Audit Shield', tag: 'DPDP 2023', href: '/#integrations' },
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                          >
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-sky-400">
                              {item.tag}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Quick module search"
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setLangLabel((prev) =>
                    prev === 'English (India)' ? 'Hinglish (NCR)' : 'English (India)'
                  )
                }
                className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{langLabel}</span>
              </button>

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="font-bold text-[#E42527] hover:text-[#C81E1E] transition-colors"
                  >
                    Sign In
                  </Link>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <Link
                    href="/signup"
                    className="font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] transition-colors"
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── TIER 2: Main Sticky Product Navigation Bar ────────────────── */}
        <nav
          className={`transition-all duration-300 ${
            scrolled
              ? 'bg-white/95 dark:bg-[#0B1320]/95 backdrop-blur-xl shadow-lg shadow-slate-900/5 border-b border-slate-200/80 dark:border-slate-800 py-2.5'
              : 'bg-white/90 dark:bg-[#0B1320]/90 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/80 py-3'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Brand Mark (Infinity Bridge CRM emblem + Leadsetu CRM) */}
              <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#0057FF]/25 bg-gradient-to-br from-[#0057FF] to-[#17243A] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <img
                    src="/logo.png"
                    alt="Leadsetu Logo"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="flex flex-col leading-none">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Leadsetu
                    </span>
                    <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                      CRM
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0057FF] dark:text-sky-400 tracking-wide mt-0.5 hidden sm:block">
                    Bridge Every Lead to Revenue
                  </span>
                </div>
              </Link>

              {/* Center Links */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Features Mega Menu */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu('features')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                  >
                    Features
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        openMenu === 'features' ? 'rotate-180 text-[#0057FF]' : ''
                      }`}
                    />
                  </button>

                  {openMenu === 'features' && (
                    <div className="absolute top-full left-0 pt-2 w-[640px] z-50">
                      <div className="bg-white dark:bg-[#0F1829] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5">
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
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                >
                  360° Orbit
                </Link>

                <Link
                  href="/#team-views"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                >
                  Team Views
                </Link>

                <Link
                  href="/#pricing"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                >
                  Pricing
                </Link>

                <Link
                  href="/#testimonials"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
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
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0057FF] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                  >
                    Resources
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        openMenu === 'resources' ? 'rotate-180 text-[#0057FF]' : ''
                      }`}
                    />
                  </button>

                  {openMenu === 'resources' && (
                    <div className="absolute top-full right-0 pt-2 w-80 z-50">
                      <div className="bg-white dark:bg-[#0F1829] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-1">
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

              {/* Right CTAs: ThemeToggle + Ask Setu AI + Get Started (Crimson CTA) */}
              <div className="hidden lg:flex items-center gap-2.5">
                <ThemeToggle />

                {/* Ask Setu AI Pill (inspired by Ask Zia) */}
                <button
                  type="button"
                  onClick={() => setAskAiOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-[#0057FF]/35 shadow-sm hover:shadow-md hover:border-[#0057FF] transition-all"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, rgba(0,87,255,0.06) 0%, rgba(168,85,247,0.08) 100%)',
                  }}
                >
                  <span>Ask Setu AI</span>
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                </button>

                {scrolled && !isAuthenticated && (
                  <Link
                    href="/login"
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#E42527] transition-colors"
                  >
                    Sign In
                  </Link>
                )}

                <Link
                  href={isAuthenticated ? '/dashboard' : '/signup'}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-md shadow-rose-600/20 transition-all hover:-translate-y-0.5"
                >
                  <span>{isAuthenticated ? 'Open CRM' : 'Get Started'}</span>
                </Link>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setAskAiOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-slate-800 text-[#0057FF] dark:text-sky-400 border border-blue-200 dark:border-slate-700"
                >
                  <Sparkles className="w-3 h-3" /> AI
                </button>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/signup'}
                  className="text-xs font-bold px-3 py-2 rounded-lg text-white bg-[#E42527]"
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

            {/* Expandable Top Bar Search Strip */}
            {searchOpen && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Jump to:</span>
                {[
                  { label: '360° Concentric Orbit', href: '/#orbit-360' },
                  { label: 'Department Role Views', href: '/#team-views' },
                  { label: '18% GST & CPQ Quotes', href: '/#features' },
                  { label: 'WhatsApp & IndiaMART', href: '/#integrations' },
                  { label: 'INR Pricing', href: '/#pricing' },
                  { label: 'Sign In', href: '/login' },
                  { label: 'Create Free Workspace', href: '/signup' },
                ].map((tag) => (
                  <Link
                    key={tag.label}
                    href={tag.href}
                    onClick={() => setSearchOpen(false)}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#0057FF] hover:text-white transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            )}
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
                  { label: 'Pricing & FAQ', href: '/#pricing' },
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> Gemini AI Response (Instant Preview)
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

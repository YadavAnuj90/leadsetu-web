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
  PhoneCall,
  Send,
} from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';

const productHighlights = [
  {
    icon: Bot,
    title: 'Gemini AI Lead Scoring (1–100)',
    desc: 'Auto-qualify & rank every IndiaMART, Meta & WhatsApp buyer in real time',
    badge: 'Popular',
  },
  {
    icon: MessageSquare,
    title: 'Unified WhatsApp Cloud Inbox',
    desc: 'Official Meta API, Hinglish & English AI smart replies in < 15 sec',
    badge: 'Official API',
  },
  {
    icon: Receipt,
    title: '18% GST Invoices & Quotations',
    desc: 'Auto CGST+SGST (UP) or IGST (Inter-state) with HSN codes & Razorpay links',
    badge: 'Rule-46 GST',
  },
  {
    icon: Send,
    title: 'WhatsApp Broadcast Campaigns',
    desc: 'Green-tick festival & catalogue blasts with live handset preview',
    badge: 'Zero Ban',
  },
  {
    icon: Workflow,
    title: 'Zero-Code AI Workflows',
    desc: 'IF-THIS-THEN-THAT rules that auto-create tasks & route hot leads',
  },
  {
    icon: Kanban,
    title: 'Visual Kanban & Team RBAC',
    desc: '5-digit Account ID, 10-digit User IDs, rep targets & revenue attribution',
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Announcement Bar */}
      {bannerVisible && (
        <div
          className="relative text-white text-xs py-2 px-4 border-b border-white/10"
          style={{
            background:
              'linear-gradient(90deg, #0B1320 0%, #17243A 50%, #0B1320 100%)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 text-center pr-6">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(57, 120, 234, 0.25)',
                color: '#7EB3FF',
                border: '1px solid rgba(57, 120, 234, 0.4)',
              }}
            >
              <Sparkles className="w-3 h-3" /> All 11 Modules Live
            </span>
            <span className="text-slate-200 font-medium truncate">
              Leadsetu 2.0: Gemini AI Scoring + 18% GST Billing + Official WhatsApp Broadcasts + Team RBAC
            </span>
            <a
              href="#features"
              className="hidden sm:inline-flex items-center gap-1 font-semibold hover:underline whitespace-nowrap"
              style={{ color: '#68A0FF' }}
            >
              Explore interactive tour <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? 'glass-header shadow-lg shadow-brand-navy/5 border-b border-slate-200/80 dark:border-slate-800 py-2.5'
            : 'bg-white/95 dark:bg-[#0B1320]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-brand-blue/30 transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Leadsetu Logo"
                  className="w-full h-full object-cover"
                />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-brand-navy dark:text-white">
                    Lead<span className="text-brand-blue">setu</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-brand-sky">
                    AI CRM
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                  Bridge Every Lead to Revenue
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Product Dropdown Trigger */}
              <div
                className="relative"
                onMouseEnter={() => setProductMenuOpen(true)}
                onMouseLeave={() => setProductMenuOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                >
                  Product Suite
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      productMenuOpen ? 'rotate-180 text-brand-blue' : ''
                    }`}
                  />
                </button>

                {/* Mega Dropdown */}
                {productMenuOpen && (
                  <div className="absolute top-full left-0 pt-2 w-[620px] z-50">
                    <div className="bg-white dark:bg-[#0F1829] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
                      <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Complete 11-Module AI CRM Suite
                        </span>
                        <span className="text-[11px] font-semibold text-brand-blue dark:text-brand-sky">
                          Noida · Delhi-NCR · Pan-India
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {productHighlights.map((item) => {
                          const Icon = item.icon;
                          return (
                            <a
                              key={item.title}
                              href="#features"
                              onClick={() => setProductMenuOpen(false)}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-light/60 dark:hover:bg-slate-800/80 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-brand-sky">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-brand-navy dark:text-slate-100 group-hover:text-brand-blue">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-brand-sky">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                  {item.desc}
                                </p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                      <div
                        className="p-3 rounded-xl flex items-center justify-between"
                        style={{ background: '#17243A' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-slate-200 font-medium">
                            DPDP Act 2023 Compliant · 5-Digit Account ID Security
                          </span>
                        </div>
                        <Link
                          href="/register"
                          className="text-xs font-bold flex items-center gap-1 hover:underline"
                          style={{ color: '#68A0FF' }}
                        >
                          Try Free <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a
                href="#features"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
              >
                How It Works
              </a>
              <a
                href="#integrations"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
              >
                Integrations
              </a>
              <a
                href="#pricing"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
              >
                Customers
              </a>
            </div>

            {/* Desktop Right CTAs + Theme Toggle */}
            <div className="hidden lg:flex items-center gap-2.5">
              <ThemeToggle />

              <a
                href="#pricing"
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-brand-blue" />
                Book Demo
              </a>

              <Link
                href="/login"
                className="text-sm font-semibold px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-brand-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="btn-primary-brand group inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Hamburger + Theme Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <Link
                href="/register"
                className="text-xs font-semibold px-3 py-2 rounded-lg text-white"
                style={{ background: '#3978EA' }}
              >
                Try Free
              </Link>
              <button
                type="button"
                aria-label="Toggle Menu"
                className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
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
                  <a
                    key={item.title}
                    href="#features"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col gap-1.5"
                  >
                    <Icon className="w-4 h-4 text-brand-blue" />
                    <span className="text-xs font-bold text-brand-navy dark:text-slate-100">
                      {item.title}
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              {[
                { label: 'Interactive Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Integrations', href: '#integrations' },
                { label: 'Pricing & FAQ', href: '#pricing' },
                { label: 'Customer Stories', href: '#testimonials' },
              ].map((nav) => (
                <a
                  key={nav.label}
                  href={nav.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-light dark:hover:bg-slate-800 hover:text-brand-blue transition-colors"
                >
                  {nav.label}
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-center border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                Sign In to Account
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary-brand w-full py-3 rounded-xl text-sm font-semibold text-center text-white flex items-center justify-center gap-2"
              >
                Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

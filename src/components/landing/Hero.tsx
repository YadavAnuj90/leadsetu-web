'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Kanban,
  LayoutDashboard,
  TrendingUp,
  Zap,
  Send,
  Phone,
  Bot,
  ShieldCheck,
} from 'lucide-react';

type PreviewTab = 'dashboard' | 'whatsapp' | 'pipeline';

export default function Hero() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard');

  return (
    <section className="hero-theme-surface relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 transition-colors duration-300">
      {/* Ambient Glow Orbs */}
      <div
        className="pointer-events-none absolute top-28 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: '#3978EA' }}
      />
      <div
        className="pointer-events-none absolute bottom-12 right-1/5 w-[28rem] h-[28rem] rounded-full opacity-15 blur-3xl"
        style={{ background: '#68A0FF' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Trust & AI Pill */}
        <div className="inline-flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 rounded-full text-xs font-semibold mb-7 border backdrop-blur-md shadow-sm bg-brand-light/90 dark:bg-brand-blue/15 border-brand-blue/30 text-brand-navy dark:text-sky-300">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-brand-blue">
            <Sparkles className="w-3 h-3" /> Gemini AI
          </span>
          <span>India&apos;s #1 AI-Powered CRM for Fast-Growing SMEs</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-brand-navy dark:text-white leading-[1.08] mb-6 tracking-tight max-w-4xl mx-auto transition-colors">
          Bridge Every Lead{' '}
          <span className="relative inline-block">
            <span className="text-gradient-brand">to Revenue</span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-brand-blue/60"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 9.5C52 2.5 148 2.5 198 9.5"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-9 leading-relaxed font-normal transition-colors">
          Capture leads from{' '}
          <span className="text-brand-navy dark:text-white font-semibold">
            WhatsApp, IndiaMART, Meta Ads &amp; Web
          </span>
          , auto-qualify them with Gemini AI in Hinglish or English, and close deals{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            3.2x faster
          </span>
          .
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/register"
            className="btn-primary-brand group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:-translate-y-0.5"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-brand-navy dark:text-white text-base border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 backdrop-blur-sm transition-all shadow-sm"
          >
            <span className="w-6 h-6 rounded-full bg-brand-blue/20 dark:bg-brand-blue/30 flex items-center justify-center">
              <Play className="w-3 h-3 fill-brand-blue dark:fill-white text-brand-blue dark:text-white ml-0.5" />
            </span>
            <span>See 2-Min Interactive Tour</span>
          </a>
        </div>

        {/* Micro Trust Checkmarks */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 mb-12">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Official WhatsApp Cloud API
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Go live in under 15 minutes
          </span>
        </div>

        {/* Interactive Product Preview Switcher Pills */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl mb-6 border border-white/10 bg-slate-900/70 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            AI Command Center
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp &amp; AI Inbox
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Smart Revenue Pipeline
          </button>
        </div>

        {/* Interactive Mock Application Frame */}
        <div className="relative mx-auto max-w-6xl">
          {/* Floating Live AI Toast — Left */}
          <div className="hidden xl:flex items-center gap-3 absolute -left-8 top-20 z-20 glass-dark px-4 py-3 rounded-2xl shadow-2xl animate-float-slow text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                AI Qualified Hot Lead
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300">
                  94/100
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                RS Traders (Karol Bagh) · Budget ₹4.5L
              </div>
            </div>
          </div>

          {/* Floating Live Deal Toast — Right */}
          <div className="hidden xl:flex items-center gap-3 absolute -right-8 bottom-16 z-20 glass-dark px-4 py-3 rounded-2xl shadow-2xl animate-float-delayed text-left">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-sky">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">WhatsApp Quote Sent</div>
              <div className="text-[11px] text-emerald-400 font-medium">
                Replied in 14 secs · Assigned to Rohit
              </div>
            </div>
          </div>

          {/* Browser Window Container */}
          <div className="rounded-2xl overflow-hidden shadow-navy-xl border border-white/15 bg-[#0B1524]">
            {/* Browser Top Chrome */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-white/10"
              style={{ background: '#122036' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400/90" />
                <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
              </div>
              <div className="flex items-center gap-2 px-4 py-1 rounded-lg text-xs text-slate-300 bg-white/5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>app.leadsetu.in/{activeTab}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  WhatsApp Sync Active
                </span>
              </div>
            </div>

            {/* App Body Grid */}
            <div className="grid grid-cols-12 text-left min-h-[410px]">
              {/* Left Sidebar */}
              <div
                className="hidden md:flex md:col-span-2 border-r border-white/10 p-4 flex-col justify-between"
                style={{ background: '#0B1320' }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2 py-2 mb-3">
                    <img
                      src="/logo.png"
                      alt="Leadsetu"
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-white/20"
                    />
                    <span className="text-xs font-bold text-white tracking-tight">
                      Leadsetu Workspace
                    </span>
                  </div>
                  {[
                    { name: 'AI Command', id: 'dashboard' as PreviewTab },
                    { name: 'WhatsApp Inbox', id: 'whatsapp' as PreviewTab, badge: '4' },
                    { name: 'Deal Pipeline', id: 'pipeline' as PreviewTab },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'font-semibold text-white bg-brand-blue/25 border border-brand-blue/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                  {['Campaigns', 'Automations', 'Invoices (GST)', 'Analytics'].map((nav) => (
                    <div
                      key={nav}
                      className="text-xs px-3 py-2 rounded-lg text-slate-500 cursor-default"
                    >
                      {nav}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl border border-brand-blue/30 bg-brand-blue/10">
                  <div className="text-[11px] font-semibold text-brand-sky mb-1">
                    Gemini AI Agent
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Auto-replied to 38 leads today
                  </div>
                </div>
              </div>

              {/* Dynamic Main Viewport */}
              <div className="col-span-12 md:col-span-10 p-5 sm:p-6 bg-[#0E1A2D]">
                {activeTab === 'dashboard' && (
                  <div className="space-y-5">
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {[
                        {
                          label: 'Total Active Leads',
                          value: '1,482',
                          change: '+18.4% this week',
                          color: '#68A0FF',
                        },
                        {
                          label: 'Pipeline Revenue',
                          value: '₹18.6L',
                          change: '+31% vs last month',
                          color: '#34D399',
                        },
                        {
                          label: 'WhatsApp Response',
                          value: '18 sec',
                          change: 'AI Auto-Responder On',
                          color: '#FBBF24',
                        },
                        {
                          label: 'Win Rate (AI Scored)',
                          value: '36.8%',
                          change: '+9.2% conversion lift',
                          color: '#A78BFA',
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl p-4 border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                            <span>{stat.label}</span>
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div className="text-xl sm:text-2xl font-extrabold text-white">
                            {stat.value}
                          </div>
                          <div className="text-[11px] font-medium mt-1" style={{ color: stat.color }}>
                            {stat.change}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Leads Table with AI Intent */}
                    <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            Priority Leads (Real-Time AI Ranked)
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-brand-blue/20 text-brand-sky border border-brand-blue/30">
                            Live Sync: IndiaMART · WhatsApp · Meta
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">Updated 2 secs ago</span>
                      </div>

                      <div className="divide-y divide-white/5">
                        {[
                          {
                            name: 'Rajesh Sharma',
                            co: 'RS Electricals · Karol Bagh, Delhi',
                            source: 'WhatsApp',
                            intent: 'Asked for 500 unit bulk GST quote',
                            score: 94,
                            status: 'Hot',
                            value: '₹4,50,000',
                          },
                          {
                            name: 'Priya Malhotra',
                            co: 'Malhotra Interiors · Sector 62, Noida',
                            source: 'Meta Lead Ad',
                            intent: 'Booked site visit for Thursday 11 AM',
                            score: 88,
                            status: 'Hot',
                            value: '₹2,80,000',
                          },
                          {
                            name: 'Vikramjit Singh',
                            co: 'Apex Auto Parts · Udyog Vihar, Gurugram',
                            source: 'IndiaMART',
                            intent: 'Comparing catalogue pricing & MOQ',
                            score: 76,
                            status: 'Warm',
                            value: '₹1,95,000',
                          },
                          {
                            name: 'Ananya Verma',
                            co: 'Verma Foods · Faridabad',
                            source: 'Website Form',
                            intent: 'Downloaded brochure · AI follow-up scheduled',
                            score: 64,
                            status: 'Warm',
                            value: '₹85,000',
                          },
                        ].map((lead) => (
                          <div
                            key={lead.name}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #3978EA, #1e40af)' }}
                              >
                                {lead.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{lead.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                                    {lead.source}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400">{lead.co}</div>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-300 hidden lg:block max-w-xs truncate">
                              <span className="text-brand-sky font-medium">AI Summary:</span>{' '}
                              {lead.intent}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <span className="text-xs font-bold text-white">{lead.value}</span>
                              <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-md border"
                                style={{
                                  background:
                                    lead.score >= 85
                                      ? 'rgba(34,197,94,0.15)'
                                      : 'rgba(245,158,11,0.15)',
                                  borderColor:
                                    lead.score >= 85
                                      ? 'rgba(34,197,94,0.35)'
                                      : 'rgba(245,158,11,0.35)',
                                  color: lead.score >= 85 ? '#4ADE80' : '#FBBF24',
                                }}
                              >
                                AI {lead.score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'whatsapp' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                    {/* Chat Thread */}
                    <div className="lg:col-span-8 rounded-xl border border-white/10 bg-[#0B1422] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                              RS
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                Rajesh Sharma (+91 98112 •••••)
                              </div>
                              <div className="text-[11px] text-emerald-400">
                                WhatsApp Business · Online
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-blue/20 text-brand-sky font-semibold">
                            AI Copilot Active
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="max-w-md rounded-2xl rounded-tl-sm bg-white/10 p-3 text-slate-200">
                            Hi team, hume Karol Bagh warehouse ke liye 500 units chahiye. Kya aaj
                            quotation mil sakta hai with GST?
                            <div className="text-[10px] text-slate-400 mt-1">11:42 AM</div>
                          </div>

                          <div className="max-w-md ml-auto rounded-2xl rounded-tr-sm bg-brand-blue p-3 text-white">
                            <div className="text-[10px] font-semibold text-blue-100 mb-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Auto-Drafted by Gemini AI
                            </div>
                            Namaste Rajesh ji! Bilkul, 500 units par 12% bulk discount applicable
                            hai. Maine GST proforma invoice attach kar diya hai. Shall I schedule a
                            5-min call at 2 PM?
                            <div className="text-[10px] text-blue-200 mt-1 text-right">
                              11:42 AM · Delivered ✓✓
                            </div>
                          </div>

                          <div className="max-w-md rounded-2xl rounded-tl-sm bg-white/10 p-3 text-slate-200">
                            Great, 2 PM works. Please share payment link as well.
                            <div className="text-[10px] text-slate-400 mt-1">11:44 AM</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300">
                          AI Suggestion: &ldquo;Sending Razorpay link + confirming 2 PM call...&rdquo;
                        </div>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </div>
                    </div>

                    {/* AI Context Panel */}
                    <div className="lg:col-span-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Gemini AI Lead Intelligence</span>
                        <span className="text-emerald-400 font-extrabold">94 / 100</span>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
                        High-intent buyer detected: Mentioned exact quantity (500 units), GST
                        billing &amp; payment link.
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Estimated Deal Value</span>
                          <span className="text-white font-bold">₹4,50,000</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Pipeline Stage</span>
                          <span className="text-brand-sky font-semibold">Negotiation</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Next Automated Action</span>
                          <span className="text-white">2:00 PM Call Reminder</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="w-full py-2 rounded-lg bg-white/10 text-center text-xs font-semibold text-white flex items-center justify-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" /> One-Click Cloud Call
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pipeline' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        stage: 'Qualified (AI Scored)',
                        total: '₹6.4L',
                        color: '#68A0FF',
                        deals: [
                          { title: 'Mehta Exports — Noida', amount: '₹2.8L', tag: 'AI 88 · Meta Ads' },
                          { title: 'Karan Logistics — Okhla', amount: '₹3.6L', tag: 'AI 84 · IndiaMART' },
                        ],
                      },
                      {
                        stage: 'Proposal & GST Quote Sent',
                        total: '₹8.2L',
                        color: '#FBBF24',
                        deals: [
                          { title: 'RS Electricals — Delhi', amount: '₹4.5L', tag: 'AI 94 · WhatsApp' },
                          { title: 'Apex Auto — Gurugram', amount: '₹3.7L', tag: 'AI 79 · Referral' },
                        ],
                      },
                      {
                        stage: 'Won & Payment Collected',
                        total: '₹12.5L',
                        color: '#34D399',
                        deals: [
                          { title: 'Vardhman Textiles — Ludhiana', amount: '₹7.2L', tag: 'Paid via Razorpay' },
                          { title: 'Zenith Clinic — South Ex', amount: '₹5.3L', tag: 'Annual Contract' },
                        ],
                      },
                    ].map((col) => (
                      <div
                        key={col.stage}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <span className="text-xs font-bold text-white">{col.stage}</span>
                          <span
                            className="text-xs font-extrabold px-2 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.06)', color: col.color }}
                          >
                            {col.total}
                          </span>
                        </div>
                        {col.deals.map((d) => (
                          <div
                            key={d.title}
                            className="p-3 rounded-lg border border-white/10 bg-[#0B1422] space-y-2"
                          >
                            <div className="text-xs font-bold text-white">{d.title}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-emerald-400">
                                {d.amount}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-blue/20 text-brand-sky">
                                {d.tag}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Metrics & Sectors Strip */}
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">
            Powering High-Velocity Sales Teams Across Delhi, Noida, Gurugram &amp; Faridabad
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '500+', label: 'Active Indian SMEs' },
              { value: '3.2x', label: 'Faster Lead-to-Deal Velocity' },
              { value: '₹14Cr+', label: 'Monthly Pipeline Tracked' },
              { value: '4.9 / 5 ★', label: 'Customer Satisfaction Rating' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm"
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
                  {item.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

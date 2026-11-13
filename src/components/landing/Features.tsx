'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  MessageSquare,
  Kanban,
  Workflow,
  Inbox,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  PlugZap,
  Receipt,
  Send,
  ShieldCheck,
  Building2,
  Zap,
  CheckCheck,
  Hash,
  FileText,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';

const interactiveTabs = [
  {
    id: 'ai-scoring',
    label: 'Gemini AI Scoring',
    badge: '94/100 Accuracy',
    icon: Bot,
    color: '#3978EA',
    headline: 'Rank every IndiaMART, Meta & WhatsApp inquiry 1–100 in 2 seconds',
    summary:
      'Gemini AI reads Hinglish and English messages, extracts buyer budget, quantity, and city, and tells your sales rep the exact next action to close the deal.',
    bullets: [
      'Automatic Hot / Warm / Cold tagging on arrival',
      'Extracts INR budget, GST requirement & city hub',
      'Drafts context-aware Hinglish replies in 1 click',
    ],
  },
  {
    id: 'gst-billing',
    label: '18% GST Invoices',
    badge: 'Rule-46 Compliant',
    icon: Receipt,
    color: '#10B981',
    headline: 'Generate HSN-ready GST Tax Invoices & Proforma Quotes in 1 click',
    summary:
      'Convert any Lead or Kanban Deal into a GST-compliant Tax Invoice. Automatically splits 9% CGST + 9% SGST for Uttar Pradesh or applies 18% IGST for inter-state buyers.',
    bullets: [
      'Auto-fills buyer 15-digit GSTIN from B2B directory',
      'Itemized HSN/SAC table with discount & tax breakup',
      'Shares printable PDF + Razorpay payment link on WhatsApp',
    ],
  },
  {
    id: 'whatsapp-campaigns',
    label: 'WhatsApp Broadcasts',
    badge: 'Official Meta API',
    icon: Send,
    color: '#059669',
    headline: 'Blast green-tick Hinglish catalogues & offers with zero ban risk',
    summary:
      'Segment your MongoDB database by AI Score (Hot 75+), City (Noida / Delhi-NCR), or IndiaMART source and dispatch approved WhatsApp Cloud templates.',
    bullets: [
      'Live buyer smartphone preview with {{name}} & {{company}}',
      'Real-time Sent, Delivered, Blue-Tick Read & Reply funnel',
      'Tracks exact INR pipeline revenue attributed per blast',
    ],
  },
  {
    id: 'ai-workflows',
    label: 'Zero-Code Workflows',
    badge: '14-Sec SLA',
    icon: Workflow,
    color: '#8B5CF6',
    headline: 'IF-THIS-THEN-THAT sales automation that runs 24/7 on autopilot',
    summary:
      'Trigger instant WhatsApp brochures, auto-create high-priority call tasks, and generate GST invoice drafts the moment a lead arrives or a deal stage changes.',
    bullets: [
      'Visual WHEN Trigger -> IF Condition -> THEN Action builder',
      'Auto-creates follow-up tasks in /tasks on new hot leads',
      'Live execution audit logs & rep hours saved counter',
    ],
  },
  {
    id: 'team-rbac',
    label: 'Team & Account ID',
    badge: '5-Digit Account ID',
    icon: ShieldCheck,
    color: '#F59E0B',
    headline: '5-Digit Workspace Account ID + 10-Digit User IDs for every rep',
    summary:
      'Onboard Admins, Managers, and Sales Agents using their email and 10-digit Indian mobile number. Track rep-wise targets, territories, and closed-won revenue.',
    bullets: [
      'Unique 5-digit Account ID (#48213) & 10-digit User IDs',
      '1-click WhatsApp credential sharing with temporary password',
      'Safe lead/deal re-assignment to Owner when a rep leaves',
    ],
  },
  {
    id: 'kanban-analytics',
    label: 'Kanban & Analytics',
    badge: 'Live MongoDB',
    icon: BarChart3,
    color: '#EC4899',
    headline: 'Visual INR Deal Pipeline + Cross-Collection Executive Analytics',
    summary:
      'Move deals from Qualified to Closed Won with weighted revenue forecasting, channel attribution (WhatsApp vs IndiaMART vs Meta), and NCR city heatmaps.',
    bullets: [
      '5-stage Kanban board with win-probability weighting',
      'Channel conversion & ROI breakdown across 8 collections',
      'Noida Electronic City, New Delhi & Gurugram hub analytics',
    ],
  },
];

const features = [
  {
    icon: Bot,
    badge: 'Gemini AI Powered',
    metric: '94% Scoring Accuracy',
    title: 'AI Lead Scoring & Intent Detection',
    description:
      'Reads incoming inquiries in English & Hinglish, detects buyer budget and urgency, and scores every lead 1–100 so reps call hot buyers first.',
    accent: '#3978EA',
    highlights: [
      'Hinglish + English NLP',
      'Auto-detects bulk & B2B intent',
      'Instant next-best-action',
    ],
  },
  {
    icon: Receipt,
    badge: '18% GST Engine',
    metric: 'CGST/SGST & IGST',
    title: 'GST Tax Invoices & Proforma Quotes',
    description:
      'Create Rule-46 GST invoices with 15-digit GSTIN, HSN/SAC line items, automatic intra/inter-state tax split, and 1-click Razorpay payment links.',
    accent: '#10B981',
    highlights: [
      'Auto 9%+9% CGST/SGST or 18% IGST',
      '1-Click Deal to GST Invoice',
      'Printable PDF & WhatsApp share',
    ],
  },
  {
    icon: Send,
    badge: 'Official Meta Cloud',
    metric: '96% Delivery Rate',
    title: 'WhatsApp Broadcast Campaigns',
    description:
      'Blast green-tick price lists, festival offers, and AMC reminders to segmented Noida & Delhi-NCR buyers with live handset preview.',
    accent: '#059669',
    highlights: [
      'Dynamic MongoDB audience segments',
      'Blue-tick read & reply tracking',
      'Attributed INR revenue per blast',
    ],
  },
  {
    icon: Kanban,
    badge: 'Revenue Visibility',
    metric: '3.2x Faster Velocity',
    title: 'Visual Kanban Sales Pipelines',
    description:
      'Move B2B deals across Qualified, Discovery, Proposal, Negotiation, and Closed Won with weighted INR revenue forecasting.',
    accent: '#F59E0B',
    highlights: [
      'Weighted INR forecast',
      'Stage-change activity timeline',
      '1-click convert to GST quote',
    ],
  },
  {
    icon: Workflow,
    badge: 'Zero-Code Builder',
    metric: '14-Sec Response SLA',
    title: 'AI Workflows & Auto-Routing',
    description:
      'IF-THIS-THEN-THAT rules that automatically fire when a new lead is created or scored 80+, creating tasks and sending WhatsApp templates.',
    accent: '#8B5CF6',
    highlights: [
      'Cross-module task creation',
      'Live execution audit logs',
      'One-click Test / Run Now',
    ],
  },
  {
    icon: ShieldCheck,
    badge: 'Enterprise Identity',
    metric: '5-Digit Account ID',
    title: 'Team RBAC & 10-Digit User IDs',
    description:
      'Every workspace gets a unique 5-digit Account ID and every team member gets a 10-digit User ID with Owner, Admin, Manager, and Agent roles.',
    accent: '#6366F1',
    highlights: [
      'Add reps by Email + Indian Mobile',
      'Monthly INR target progress bars',
      'Zero-orphan lead reassignment',
    ],
  },
  {
    icon: Inbox,
    badge: 'Omnichannel',
    metric: '< 15 Sec First Reply',
    title: 'Unified WhatsApp & IndiaMART Inbox',
    description:
      'Consolidate WhatsApp Cloud, IndiaMART, and Email buyer threads into a single team inbox with Gemini AI smart reply drafting.',
    accent: '#EC4899',
    highlights: [
      '1-click Hinglish AI smart replies',
      'Buyer AI score badge in chat',
      'Instant thread resolution',
    ],
  },
  {
    icon: Building2,
    badge: 'B2B Directory',
    metric: '15-Digit GSTIN',
    title: 'B2B Contacts & Lifetime Value',
    description:
      'Maintain a verified directory of Customers, Prospects, Partners, and Vendors with GSTIN records and cumulative INR Lifetime Value.',
    accent: '#0EA5E9',
    highlights: [
      'Verified 15-digit GSTIN lookup',
      'Account type segmentation',
      'Auto-fills GST invoice builder',
    ],
  },
  {
    icon: BarChart3,
    badge: 'CEO Cockpit',
    metric: '8-Collection Sync',
    title: 'Real-Time Attribution Analytics',
    description:
      'Live MongoDB aggregation across Leads, Deals, Invoices, Campaigns, and Workflows with NCR regional hub breakdowns.',
    accent: '#06B6D4',
    highlights: [
      'WhatsApp vs IndiaMART vs Meta ROI',
      'Noida, Delhi & Gurugram hub stats',
      'Live GST tax liability tracker',
    ],
  },
];

const integrations = [
  {
    name: 'WhatsApp Cloud API',
    category: 'Official Green-Tick',
    dot: 'bg-emerald-500',
  },
  {
    name: 'IndiaMART Lead Sync',
    category: 'B2B Marketplace',
    dot: 'bg-rose-500',
  },
  {
    name: 'Justdial Inquiries',
    category: 'Local B2B Leads',
    dot: 'bg-orange-500',
  },
  {
    name: 'Meta Lead Ads',
    category: 'FB & Instagram',
    dot: 'bg-blue-500',
  },
  {
    name: 'Google Ads',
    category: 'Search & Display',
    dot: 'bg-amber-500',
  },
  {
    name: 'Razorpay Links',
    category: 'Instant UPI & NEFT',
    dot: 'bg-indigo-500',
  },
  {
    name: 'Rule-46 GST & Tally',
    category: 'HSN & CGST/IGST',
    dot: 'bg-teal-500',
  },
  {
    name: 'Google Gemini AI',
    category: 'Hinglish NLP Engine',
    dot: 'bg-violet-500',
  },
];

export default function Features() {
  const [activeTabId, setActiveTabId] = useState<string>('ai-scoring');
  const activeTab =
    interactiveTabs.find((t) => t.id === activeTabId) || interactiveTabs[0];

  return (
    <section
      id="features"
      className="py-24 md:py-32 bg-white dark:bg-[#070D19] relative overflow-hidden transition-colors duration-200"
    >
      {/* Subtle Top Background Pattern */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-grid-light opacity-70" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border bg-brand-light dark:bg-brand-blue/15 text-brand-blue dark:text-brand-sky border-brand-blue/25">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Product Tour · 11 Live Modules
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight text-brand-navy dark:text-white">
            Every tool an Indian SME needs to{' '}
            <span className="text-gradient-navy">turn leads into GST revenue</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            Click any module below to explore how Leadsetu connects your WhatsApp, IndiaMART,
            Kanban pipeline, 18% GST billing, and sales team in one unified platform.
          </p>
        </div>

        {/* ─── INTERACTIVE 6-TAB MODULE EXPLORER ──────────────────────── */}
        <div className="mb-24">
          {/* Tab Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {interactiveTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 border ${
                    isActive
                      ? 'bg-brand-navy text-white border-brand-blue shadow-brand-sm scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-brand-blue/50'
                  }`}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isActive ? '#68A0FF' : tab.color }}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Spotlight Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-[#F8FAFF] via-white to-[#EEF3FD]/50 dark:from-[#0B1320] dark:via-[#0F172A] dark:to-[#13203B] p-6 sm:p-10 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Narrative */}
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-brand-sky">
                  <span>{activeTab.badge}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight leading-snug">
                  {activeTab.headline}
                </h3>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeTab.summary}
                </p>

                <div className="space-y-2.5 pt-1">
                  {activeTab.bullets.map((b) => (
                    <div
                      key={b}
                      className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: activeTab.color }}
                      />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register"
                    className="btn-primary-brand inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white"
                  >
                    <span>Try {activeTab.label} Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-brand-navy dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Open Live Demo →
                  </Link>
                </div>
              </div>

              {/* Right Interactive Visual Preview */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-[#0B1320] text-white border border-slate-800 shadow-2xl overflow-hidden">
                  {/* Window Top Bar */}
                  <div className="px-4 py-3 bg-[#111C2D] border-b border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="ml-2 font-mono text-[11px] text-slate-400">
                        app.leadsetu.in/{activeTab.id}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      MongoDB Atlas Live
                    </span>
                  </div>

                  {/* Tab-Specific Mockup Body */}
                  <div className="p-5 sm:p-6">
                    {activeTab.id === 'ai-scoring' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">
                                Rajesh Sharma · RS Electricals Pvt. Ltd.
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                                INDIAMART
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Noida Electronic City · Est. Deal Value: ₹4,50,000
                            </p>
                          </div>
                          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-xs">
                            Gemini AI: 94/100 · HOT
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-sky flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI Intent &amp; Hinglish Smart Reply
                          </div>
                          <p className="text-xs text-slate-200">
                            &ldquo;Buyer requested urgent quote for 2x 150 KVA Servo Stabilizers in Noida Sector 62. High B2B intent — share 18% GST proforma within 15 mins.&rdquo;
                          </p>
                          <div className="pt-2 flex flex-wrap gap-2">
                            <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-600 text-white">
                              Send Hinglish Quote on WhatsApp
                            </span>
                            <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-white/10 text-slate-200">
                              Convert to Kanban Deal
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab.id === 'gst-billing' && (
                      <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-brand-sky">
                              RULE 46 GST TAX INVOICE
                            </div>
                            <div className="text-base font-mono font-extrabold text-white">
                              INV-2026-1001 · Malhotra Luxury Interiors
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Buyer GSTIN: 09AAECM5678G1Z2 · Place of Supply: 09 - Uttar Pradesh
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            Paid via Razorpay
                          </span>
                        </div>

                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                          <div className="flex justify-between text-slate-300">
                            <span>Modular Workstations (HSN: 940330) × 2</span>
                            <span className="font-bold text-white">₹2,80,000</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>CGST (9% Intra-State UP) + SGST (9%)</span>
                            <span>₹25,200 + ₹25,200</span>
                          </div>
                          <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-extrabold text-emerald-400">
                            <span>Grand Total (Incl. 18% GST)</span>
                            <span>₹3,30,400</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab.id === 'whatsapp-campaigns' && (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-[#075E54]/40 border border-emerald-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Leadsetu Verified Business (Green-Tick)
                            </span>
                            <span className="font-mono text-[11px] text-emerald-200">
                              Template: ncr_industrial_pricelist_v2
                            </span>
                          </div>
                          <p className="text-slate-100 bg-black/25 p-3 rounded-xl">
                            &ldquo;Namaste Rajesh Sharma ji 👋, RS Electricals Pvt. Ltd. ke liye humara updated Q4 Factory Price List &amp; 18% GST Catalogue ready hai from Noida Electronic City!&rdquo;
                          </p>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5 text-center">
                          <div className="p-2.5 rounded-xl bg-white/5">
                            <div className="text-slate-400 text-[10px]">Audience</div>
                            <div className="font-extrabold text-sm text-white">340</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/5">
                            <div className="text-slate-400 text-[10px]">Delivered</div>
                            <div className="font-extrabold text-sm text-emerald-400">96%</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/5">
                            <div className="text-slate-400 text-[10px]">Blue-Tick Read</div>
                            <div className="font-extrabold text-sm text-brand-sky">78%</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                            <div className="text-emerald-300 text-[10px]">Revenue</div>
                            <div className="font-extrabold text-sm text-emerald-300">₹8.4L</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab.id === 'ai-workflows' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="font-bold text-amber-300 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> WHEN: New Lead Captured (IndiaMART / WhatsApp)
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">lead.created</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="font-bold text-brand-sky">
                            IF: Gemini AI Score &gt;= 80 AND City IN [Noida, Delhi-NCR]
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400">Matched ✓</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                          <span className="font-bold text-emerald-300">
                            THEN: Send Hinglish Brochure on WhatsApp + Create Call Task in /tasks
                          </span>
                          <span className="text-[10px] font-extrabold text-white">342 Runs</span>
                        </div>
                      </div>
                    )}

                    {activeTab.id === 'team-rbac' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-brand-sky">
                              5-Digit Admin Workspace Account ID
                            </div>
                            <div className="text-lg font-mono font-extrabold text-white tracking-widest">
                              #48213 · Leadsetu Technologies
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
                            RBAC Active
                          </span>
                        </div>

                        <div className="space-y-2">
                          {[
                            {
                              name: 'Anuj Yadav',
                              uid: '4827301956',
                              role: 'Owner',
                              target: '₹12.5L Won',
                            },
                            {
                              name: 'Rohit Verma',
                              uid: '7391048261',
                              role: 'Manager · Noida Sec 62',
                              target: '₹6.8L (91%)',
                            },
                            {
                              name: 'Neha Kapoor',
                              uid: '9182736450',
                              role: 'Agent · Gurugram',
                              target: '₹4.2L (84%)',
                            },
                          ].map((m) => (
                            <div
                              key={m.uid}
                              className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-white">{m.name}</div>
                                <div className="text-[11px] text-slate-400">{m.role}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-[11px] text-brand-sky">
                                  UID #{m.uid}
                                </div>
                                <div className="text-[11px] font-bold text-emerald-400">
                                  {m.target}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab.id === 'kanban-analytics' && (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-[10px] text-slate-400">Discovery (45%)</div>
                            <div className="font-extrabold text-sm text-white mt-0.5">
                              4 Deals · ₹6.2L
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-[10px] text-slate-400">Proposal Sent (65%)</div>
                            <div className="font-extrabold text-sm text-brand-sky mt-0.5">
                              3 Deals · ₹8.4L
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                            <div className="text-[10px] text-emerald-300">Closed Won ✓</div>
                            <div className="font-extrabold text-sm text-emerald-300 mt-0.5">
                              5 Deals · ₹14.8L
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                          <div className="flex justify-between font-bold">
                            <span>WhatsApp Cloud API Attribution</span>
                            <span className="text-emerald-400">42% Share · 38% Win Rate</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 w-[42%]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ALL 9 MODULES BENTO GRID ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-[#FAFCFF] to-white dark:from-[#0F172A] dark:to-[#0B1320] hover:border-brand-blue/60 hover:shadow-brand-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Corner Accent Glow */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-300 blur-2xl"
                  style={{ background: feature.accent }}
                />

                <div>
                  {/* Icon & Metric Pill Row */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${feature.accent}15`,
                        color: feature.accent,
                        border: `1px solid ${feature.accent}30`,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-light dark:bg-slate-800 text-brand-navy dark:text-slate-200">
                      {feature.metric}
                    </span>
                  </div>

                  {/* Badge */}
                  <div
                    className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: feature.accent }}
                  >
                    {feature.badge}
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-xl mb-3 tracking-tight text-brand-navy dark:text-white group-hover:text-brand-blue transition-colors flex items-center justify-between">
                    <span>{feature.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-brand-blue flex-shrink-0" />
                  </h3>

                  {/* Description */}
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                {/* Feature Micro-Highlights */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {feature.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: feature.accent }}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Native Indian SME Integrations Banner */}
        <div
          id="integrations"
          className="mt-20 rounded-3xl p-8 md:p-12 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #17243A 0%, #0F1C2E 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
            style={{ background: '#3978EA' }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 text-left">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{
                  background: 'rgba(57, 120, 234, 0.2)',
                  color: '#7EB3FF',
                }}
              >
                <PlugZap className="w-3.5 h-3.5" /> 1-Click Native Integrations
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
                Plugs directly into your Indian business stack
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                No expensive webhooks or Zapier bills. Connect your lead sources, WhatsApp number,
                and 18% GST billing tools in under 5 minutes.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {integrations.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl p-4 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Live Sync
                    </span>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Search,
  Bell,
  Plus,
  Settings,
  Check,
  Home,
  FileBarChart,
  FolderKanban,
  ClipboardList,
  Lock,
  Compass,
  Pause,
  Play,
} from 'lucide-react';

// ─── 1. 360° CONCENTRIC ORBIT NODES ───────────────────────────────────────────
interface OrbitNode {
  id: string;
  labelLine1: string;
  labelLine2: string;
  x: number; // % left inside container
  y: number; // % top inside container
  svgX: number; // viewBox x (960)
  svgY: number; // viewBox y (460)
  badge: string;
  summary: string;
  metric: string;
}

const ORBIT_CX = 480;
const ORBIT_CY = 155;
const BEAM_RX = 435;
const BEAM_RY = 205;

const orbitNodes: OrbitNode[] = [
  {
    id: 'canvas',
    labelLine1: 'Canvas Design',
    labelLine2: 'Studio',
    x: 50,
    y: 8,
    svgX: 480,
    svgY: 38,
    badge: 'Visual UI Studio',
    summary:
      'Customize Kanban deal stages, custom CRM fields, and territory views for your Indian B2B sales workflow.',
    metric: '14 Live Modules',
  },
  {
    id: 'module-360',
    labelLine1: 'Module 360',
    labelLine2: '& GSTIN',
    x: 69,
    y: 18,
    svgX: 662,
    svgY: 84,
    badge: 'Unified Customer 360°',
    summary:
      'See every WhatsApp chat, 15-digit GSTIN, Proforma Quote, Tax Invoice, and SLA ticket in one unified contact timeline.',
    metric: 'Rule-46 Ready',
  },
  {
    id: 'agents',
    labelLine1: 'SetuAI',
    labelLine2: 'Agents',
    x: 80,
    y: 44,
    svgX: 770,
    svgY: 205,
    badge: 'Autonomous Copilot',
    summary:
      'SetuAI scores every inquiry 1–100 in Hinglish/English and drafts context-aware WhatsApp quotes in < 15 sec.',
    metric: '94% Scoring Accuracy',
  },
  {
    id: 'sfa',
    labelLine1: 'Sales Force',
    labelLine2: 'Automation',
    x: 63,
    y: 57,
    svgX: 605,
    svgY: 262,
    badge: 'Auto-Routing Engine',
    summary:
      'Zero-code IF-THIS-THEN-THAT workflows assign Noida, Delhi & Gurugram leads to closers and create follow-up tasks automatically.',
    metric: '14-Sec SLA',
  },
  {
    id: 'analytics',
    labelLine1: 'Advanced',
    labelLine2: 'Analytics',
    x: 68,
    y: 86,
    svgX: 652,
    svgY: 392,
    badge: 'CEO Revenue Cockpit',
    summary:
      'Live Cloud attribution across IndiaMART, Meta Ads & WhatsApp, plus AR Udhaar aging and rep target attainment.',
    metric: '8 Collections Synced',
  },
  {
    id: 'bi',
    labelLine1: 'Predictive',
    labelLine2: 'AI & BI',
    x: 47,
    y: 91,
    svgX: 450,
    svgY: 416,
    badge: 'Weighted Forecast',
    summary:
      'Real-time win probability forecasting, CGST/SGST vs IGST tax liability summaries, and 1-click CA-ready GSTR-1 CSV export.',
    metric: 'CA-Ready GSTR-1',
  },
  {
    id: 'sla-kiosk',
    labelLine1: 'SLA Field',
    labelLine2: 'Service Desk',
    x: 20,
    y: 59,
    svgX: 192,
    svgY: 272,
    badge: 'Post-Sales Desk',
    summary:
      'Manage E-Way bill delays, warranty claims, site installations, and AMC job sheets with live SLA breach countdowns.',
    metric: '4.8★ Buyer CSAT',
  },
  {
    id: 'cpq',
    labelLine1: 'CPQ & GST',
    labelLine2: 'Quotations',
    x: 37,
    y: 50,
    svgX: 356,
    svgY: 228,
    badge: 'Highlighted Engine',
    summary:
      'Configure HSN-itemized Proforma Quotes with discounts & 18% GST, share a public buyer approval link, and convert to Invoice in 1 click.',
    metric: '1-Click Quote → Invoice',
  },
  {
    id: 'journey',
    labelLine1: 'Journey',
    labelLine2: 'Orchestration',
    x: 27,
    y: 30,
    svgX: 258,
    svgY: 138,
    badge: 'Omnichannel Drips',
    summary:
      'Automated Official WhatsApp Cloud broadcasts and polite Hinglish payment nudges with Razorpay UPI/NEFT settlement links.',
    metric: '96% Delivery Rate',
  },
];

function getNodeParamDeg(node: OrbitNode): number {
  const deg =
    (Math.atan2((node.svgY - ORBIT_CY) / BEAM_RY, (node.svgX - ORBIT_CX) / BEAM_RX) * 180) /
    Math.PI;
  return (deg + 360) % 360;
}

function shortestAngleDiff(a: number, b: number): number {
  const diff = ((a - b + 540) % 360) - 180;
  return Math.abs(diff);
}

// ─── 2. ALL 9 DEPARTMENT ROLE WORKSPACES (Auto-Selecting Switcher) ───────────
interface DeptRow {
  datePill: string;
  dateColor: string;
  title: string;
  amount: string;
  stage: string;
  stageColor: string;
  closingDate: string;
}

interface DeptKpi {
  label: string;
  value: string;
  delta: string;
}

interface DepartmentWorkspace {
  key: string;
  code: string;
  codeColor: string;
  name: string;
  menuLabel: string;
  personaRole: string;
  avatarBg: string;
  avatarInitials: string;
  moduleTitle: string;
  scopeLabel: string;
  primaryCta: string;
  views: string[];
  featuresList: string[];
  sidebarModules: string[];
  kpis: DeptKpi[];
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  totalLabel: string;
  rows: DeptRow[];
}

const departmentWorkspaces: DepartmentWorkspace[] = [
  {
    key: 'sales',
    code: 'Sa',
    codeColor: '#F43F5E',
    name: 'Sales',
    menuLabel: 'Sales',
    personaRole: 'Revenue & Deals',
    avatarBg: '#1D4ED8',
    avatarInitials: 'RS',
    moduleTitle: 'Deals',
    scopeLabel: 'All Territories',
    primaryCta: 'Create Deal',
    views: [
      'NCR Deals',
      'Hot AI 85+',
      'New Deals',
      'Recently Created',
      'Closing This Month',
    ],
    featuresList: [
      'Visual 5-Stage Kanban Board',
      'SetuAI Buyer Intent Score (1–100)',
      '1-Click Deal to GST Proforma Quote',
      'Weighted INR Territory Forecast',
    ],
    sidebarModules: [
      'Kanban Deal Pipeline',
      'SetuAI Lead Queue',
      'Proforma Quotes (CPQ)',
      'Monthly Target Tracker',
    ],
    kpis: [
      { label: 'Active Pipeline', value: '₹60.5L', delta: '+18% this week' },
      { label: 'Hot AI Leads (85+)', value: '24 Deals', delta: '14-sec SLA' },
      { label: 'Projected Won', value: '₹21.8L', delta: '74% target' },
    ],
    col1: 'Deal Name',
    col2: 'Amount',
    col3: 'Stage',
    col4: 'Closing Date',
    totalLabel: '574k',
    rows: [
      {
        datePill: 'TODAY',
        dateColor: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
        title: 'RS Electricals · 150 KVA Servo Order',
        amount: '₹12,60,000',
        stage: 'Needs Analysis',
        stageColor: 'bg-rose-500 text-white',
        closingDate: 'Nov 28, 2026',
      },
      {
        datePill: 'TODAY',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'Malhotra Luxury Interiors · Noida Sec 62',
        amount: '₹3,30,400',
        stage: 'Closed Won',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: 'Nov 14, 2026',
      },
      {
        datePill: 'NOV 14',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'Apex Auto Components · Annual AMC',
        amount: '₹7,08,000',
        stage: 'Negotiation/Review',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: 'Nov 21, 2026',
      },
      {
        datePill: 'NOV 12',
        dateColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        title: 'Bansal Steel & Infra · LT Panel Board',
        amount: '₹4,48,400',
        stage: 'Qualification',
        stageColor: 'bg-sky-500 text-white',
        closingDate: 'Nov 19, 2026',
      },
    ],
  },
  {
    key: 'finance',
    code: 'Fi',
    codeColor: '#8B5CF6',
    name: 'Finance',
    menuLabel: 'Finance & GST',
    personaRole: 'GST & AR Ledger',
    avatarBg: '#7C3AED',
    avatarInitials: 'AK',
    moduleTitle: 'GST Invoices',
    scopeLabel: 'FY 2026–27',
    primaryCta: 'Create Invoice',
    views: [
      'Tax Invoices',
      'Partial / TDS',
      'Proforma Quotes',
      'GSTR-1 Export',
      'Overdue Alerts',
    ],
    featuresList: [
      'Rule-46 Auto CGST/SGST & IGST Split',
      'Partial Payments & u/s 194C/194J TDS',
      '1-Click CA-Ready GSTR-1 CSV Export',
      'WhatsApp Razorpay Settlement Nudges',
    ],
    sidebarModules: [
      '18% GST Tax Invoices',
      'AR Ledger & TDS Tranches',
      'GSTR-1 / Tally Export',
      'Subscription GST Bills',
    ],
    kpis: [
      { label: 'Billed This Quarter', value: '₹42.8L', delta: '100% Rule-46' },
      { label: 'TDS / AR Collected', value: '₹31.4L', delta: 'Zero Leakage' },
      { label: 'ITC Claim Ready', value: '18% GST', delta: 'HSN Verified' },
    ],
    col1: 'Invoice & Buyer',
    col2: 'Grand Total',
    col3: 'AR Status',
    col4: 'Due Date',
    totalLabel: '₹42.8L',
    rows: [
      {
        datePill: 'GSTIN ✓',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'INV-2026-1001 · Malhotra Interiors (UP 09)',
        amount: '₹3,71,700',
        stage: 'Paid in Full',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: 'Nov 15, 2026',
      },
      {
        datePill: 'IGST 18%',
        dateColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        title: 'INV-2026-1002 · RS Electricals (Delhi 07)',
        amount: '₹5,31,000',
        stage: 'Partial + TDS',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: 'Nov 20, 2026',
      },
      {
        datePill: 'QTN LINK',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'QTN-2026-1003 · Apex Auto Components',
        amount: '₹7,08,000',
        stage: 'Buyer Approved',
        stageColor: 'bg-sky-500 text-white',
        closingDate: 'Nov 25, 2026',
      },
      {
        datePill: 'OVERDUE',
        dateColor: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
        title: 'INV-2026-1004 · Bansal Steel & Infra',
        amount: '₹4,48,400',
        stage: 'Nudge Sent',
        stageColor: 'bg-rose-500 text-white',
        closingDate: 'Nov 05, 2026',
      },
    ],
  },
  {
    key: 'service',
    code: 'Se',
    codeColor: '#EC4899',
    name: 'Service',
    menuLabel: 'Service & SLA',
    personaRole: 'SLA Field Desk',
    avatarBg: '#059669',
    avatarInitials: 'NS',
    moduleTitle: 'SLA Tickets',
    scopeLabel: 'Post-Sales & AMC',
    primaryCta: 'New SLA Ticket',
    views: [
      'Open Queue',
      'E-Way Bill Delays',
      'Warranty Claims',
      'Site Commissioning',
      'CSAT 4.8★',
    ],
    featuresList: [
      '24-Hour SLA Breach Countdown Timers',
      'Field Engineer Job Sheets & Visits',
      'E-Way Bill & GST Correction Queue',
      'Verified Buyer CSAT Star Sign-Off',
    ],
    sidebarModules: [
      'SLA Kanban & Queue',
      'Field Visit Workbench',
      'Warranty & AMC Tracker',
      'CSAT & Resolution Logs',
    ],
    kpis: [
      { label: 'On-Time SLA', value: '98.4%', delta: '0 Breaches' },
      { label: 'Active Field Visits', value: '11 Sites', delta: 'Delhi-NCR' },
      { label: 'Buyer CSAT Score', value: '4.8 / 5.0', delta: 'Verified' },
    ],
    col1: 'Ticket & Client Site',
    col2: 'Priority',
    col3: 'SLA Status',
    col4: 'Target Due',
    totalLabel: '98.4%',
    rows: [
      {
        datePill: 'URGENT',
        dateColor: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
        title: 'TKT-2026-101 · Switchgear E-Way Bill Verify',
        amount: 'Urgent SLA',
        stage: 'In Progress',
        stageColor: 'bg-amber-500 text-white',
        closingDate: 'Today, 6 PM',
      },
      {
        datePill: 'GST FIX',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'TKT-2026-102 · Apex Auto Place of Supply Fix',
        amount: 'High Priority',
        stage: 'Open Queue',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: 'Nov 15, 2026',
      },
      {
        datePill: 'SOLAR',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'TKT-2026-103 · Bansal 50kW Commissioning',
        amount: 'CSAT 5.0 ★',
        stage: 'Resolved',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: 'Completed',
      },
      {
        datePill: 'AMC',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'TKT-2026-104 · Okhla Phase-II Servo Calibration',
        amount: 'Medium SLA',
        stage: 'Field Assigned',
        stageColor: 'bg-sky-500 text-white',
        closingDate: 'Nov 16, 2026',
      },
    ],
  },
  {
    key: 'marketing',
    code: 'Ma',
    codeColor: '#3B82F6',
    name: 'Marketing',
    menuLabel: 'Marketing',
    personaRole: 'WhatsApp Campaigns',
    avatarBg: '#0EA5E9',
    avatarInitials: 'MK',
    moduleTitle: 'Campaigns',
    scopeLabel: 'Meta Cloud API',
    primaryCta: 'Launch Blast',
    views: [
      'Completed Blasts',
      'Hinglish Templates',
      'IndiaMART Drips',
      'Hot Score Segments',
      'Revenue Attributed',
    ],
    featuresList: [
      'Green-Tick Official WhatsApp Broadcasts',
      'AI Score & City Audience Segmentation',
      'Blue-Tick Read & Reply Funnel Tracking',
      'INR Revenue Attributed Per Campaign',
    ],
    sidebarModules: [
      'WhatsApp Broadcast Studio',
      'Hinglish Template Builder',
      'IndiaMART / Meta Sync',
      'Campaign ROI Analytics',
    ],
    kpis: [
      { label: 'Delivery Rate', value: '96.2%', delta: 'Zero-Ban API' },
      { label: 'Blue-Tick Read', value: '78.4%', delta: '+24% Replies' },
      { label: 'Attributed Rev', value: '₹19.7L', delta: 'Q4 Blasts' },
    ],
    col1: 'Broadcast Campaign',
    col2: 'Attributed Rev',
    col3: 'Delivery',
    col4: 'Channel',
    totalLabel: '₹19.7L',
    rows: [
      {
        datePill: 'GREEN ✓',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'Noida & Delhi-NCR Q4 Industrial Price List',
        amount: '₹8,40,000',
        stage: '96% Delivered',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: 'WhatsApp Cloud',
      },
      {
        datePill: 'AI DRIP',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'IndiaMART Hot Leads — 15-Min Instant Quote',
        amount: '₹6,20,000',
        stage: '78% Blue-Tick',
        stageColor: 'bg-sky-500 text-white',
        closingDate: 'WhatsApp AI',
      },
      {
        datePill: '80+ AI',
        dateColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        title: 'Hot Prospects — 30-Day Corporate Credit',
        amount: '₹5,10,000',
        stage: '24% Reply Rate',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: 'WhatsApp Cloud',
      },
      {
        datePill: 'SCHED',
        dateColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        title: 'GST Verified Buyers — Year-End AMC Drive',
        amount: '128 Buyers',
        stage: 'Scheduled',
        stageColor: 'bg-amber-500 text-white',
        closingDate: 'Nov 15, 11 AM',
      },
    ],
  },
  {
    key: 'operations',
    code: 'Op',
    codeColor: '#F97316',
    name: 'Operations',
    menuLabel: 'Operations',
    personaRole: 'Workflows & Tasks',
    avatarBg: '#EA580C',
    avatarInitials: 'OP',
    moduleTitle: 'Automations',
    scopeLabel: 'Noida Cloud Engine',
    primaryCta: 'New Workflow',
    views: [
      'Active Rules',
      'Lead Auto-Routing',
      'Call Tasks Queue',
      'Execution Logs',
      'Hours Saved',
    ],
    featuresList: [
      'Zero-Code IF-THIS-THEN-THAT Rules',
      'Instant Auto-Routing by NCR Territory',
      'Auto Call-Task & Follow-Up Generation',
      'Deal Won → Auto GST Invoice Draft',
    ],
    sidebarModules: [
      'IF-THIS-THEN-THAT Builder',
      'Auto-Routing Queues',
      'Task & Follow-Up Board',
      'Execution Run Logs',
    ],
    kpis: [
      { label: 'Workflow Runs', value: '623 Runs', delta: '99.9% Success' },
      { label: 'Rep Hours Saved', value: '93 Hrs', delta: 'This Month' },
      { label: 'First Response', value: '14 Sec', delta: 'Auto-Triggered' },
    ],
    col1: 'Automation Rule / Task',
    col2: 'Executions',
    col3: 'Status',
    col4: 'Hours Saved',
    totalLabel: '623 Runs',
    rows: [
      {
        datePill: 'ACTIVE',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'IndiaMART & Meta → 15-Sec WhatsApp Brochure',
        amount: '342 Runs',
        stage: 'Auto-Running',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: '51 hrs saved',
      },
      {
        datePill: 'ACTIVE',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'Hot Lead (Score ≥ 80) → Senior Closer Alert',
        amount: '128 Runs',
        stage: 'SLA Enforced',
        stageColor: 'bg-sky-500 text-white',
        closingDate: '19 hrs saved',
      },
      {
        datePill: 'ACTIVE',
        dateColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        title: 'Deal Won → Auto-Generate 18% GST Tax Invoice',
        amount: '64 Runs',
        stage: 'Zero-Touch',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: '10 hrs saved',
      },
      {
        datePill: 'ACTIVE',
        dateColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        title: 'Overdue Invoice → Polite Hinglish UPI Nudge',
        amount: '89 Runs',
        stage: 'Auto-Collecting',
        stageColor: 'bg-amber-500 text-white',
        closingDate: '13 hrs saved',
      },
    ],
  },
  {
    key: 'hr',
    code: 'HR',
    codeColor: '#EAB308',
    name: 'HR & RBAC',
    menuLabel: 'HR & RBAC',
    personaRole: 'Team & Permissions',
    avatarBg: '#CA8A04',
    avatarInitials: 'AY',
    moduleTitle: 'Team & RBAC',
    scopeLabel: 'Acct #931001',
    primaryCta: 'Invite Rep',
    views: [
      'Active Members',
      'Monthly INR Targets',
      'Role Matrix',
      'WhatsApp Credentials',
      'Rep Offboarding',
    ],
    featuresList: [
      'Unique 5-Digit Account ID + 10-Digit UID',
      'Owner, Admin, Manager & Agent RBAC',
      '1-Click WhatsApp Credential Dispatch',
      'Zero-Orphan Lead Transfer on Exit',
    ],
    sidebarModules: [
      'Team Directory & UIDs',
      'Role Permission Matrix',
      'Quota & INR Targets',
      'Offboarding Reassign',
    ],
    kpis: [
      { label: 'Active Reps', value: '12 Seats', delta: 'UIDs Issued' },
      { label: 'Quota Attainment', value: '88.6%', delta: '+₹23.5L Won' },
      { label: 'Data Masking', value: 'Enabled', delta: 'Zero Leak' },
    ],
    col1: 'Team Member & Hub',
    col2: '10-Digit UID',
    col3: 'RBAC Role',
    col4: 'Monthly Target',
    totalLabel: '12 Members',
    rows: [
      {
        datePill: 'OWNER',
        dateColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        title: 'Anuj Yadav · Noida Sector 62 HQ',
        amount: '#8858834914',
        stage: 'Workspace Owner',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: '₹12.5L Won',
      },
      {
        datePill: 'MANAGER',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'Rohit Verma · Connaught Place Hub',
        amount: '#7391048261',
        stage: 'Sales Manager',
        stageColor: 'bg-sky-500 text-white',
        closingDate: '91% Quota',
      },
      {
        datePill: 'AGENT',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'Neha Kapoor · Gurugram DLF Ph-3',
        amount: '#9182736450',
        stage: 'Senior Closer',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: '84% Quota',
      },
      {
        datePill: 'FINANCE',
        dateColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        title: 'Arjun Kulkarni · GST & Audit Desk',
        amount: '#6420193847',
        stage: 'Billing Admin',
        stageColor: 'bg-violet-500 text-white',
        closingDate: 'Zero Errors',
      },
    ],
  },
  {
    key: 'onboarding',
    code: 'On',
    codeColor: '#EA580C',
    name: 'Onboarding',
    menuLabel: 'Onboarding',
    personaRole: 'B2B Account Setup',
    avatarBg: '#EA580C',
    avatarInitials: 'VS',
    moduleTitle: 'Client Onboarding',
    scopeLabel: 'New GST Accounts',
    primaryCta: 'New Account',
    views: [
      'KYC & GSTIN Check',
      'HSN Catalogue Setup',
      'Site Handover',
      'Completed',
    ],
    featuresList: [
      'Verified 15-Digit GSTIN Buyer Directory',
      'HSN/SAC Catalogue & Price Book Mapping',
      'Signed Proforma & Document Checklist',
      'Automated Welcome WhatsApp Sequence',
    ],
    sidebarModules: [
      'B2B Contacts (GSTIN)',
      'Product & HSN Master',
      'Document Center',
      'Handover Checklists',
    ],
    kpis: [
      { label: 'Accounts Onboarded', value: '38 B2B', delta: 'Nov Cohort' },
      { label: 'Avg Go-Live', value: '48 Hrs', delta: '2x Faster' },
      { label: 'GSTIN Verified', value: '100%', delta: 'Rule-46 Safe' },
    ],
    col1: 'Buyer Company & Hub',
    col2: 'Est. Annual LTV',
    col3: 'Handover Stage',
    col4: 'Kickoff Date',
    totalLabel: '38 Accounts',
    rows: [
      {
        datePill: 'KYC ✓',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'RS Electricals Pvt. Ltd. · Noida Sec 62',
        amount: '₹18,40,000',
        stage: 'Live in Production',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: 'Nov 10, 2026',
      },
      {
        datePill: 'DOCS',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'Malhotra Luxury Interiors · Gurugram',
        amount: '₹9,80,000',
        stage: 'HSN Sync Ready',
        stageColor: 'bg-sky-500 text-white',
        closingDate: 'Nov 14, 2026',
      },
      {
        datePill: 'STEP 2',
        dateColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        title: 'Bansal Steel & Infra · Faridabad',
        amount: '₹14,20,000',
        stage: 'Site Kickoff',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: 'Nov 17, 2026',
      },
    ],
  },
  {
    key: 'legal',
    code: 'Le',
    codeColor: '#10B981',
    name: 'Legal & Audit',
    menuLabel: 'Legal & Audit',
    personaRole: 'DPDP Act & Compliance',
    avatarBg: '#059669',
    avatarInitials: 'DP',
    moduleTitle: 'Audit & Shield',
    scopeLabel: 'DPDP Act 2023',
    primaryCta: 'Export Audit Log',
    views: [
      'Phone Masking Events',
      'CSV Export Locks',
      'Signed Agreements',
      'Immutable Trails',
    ],
    featuresList: [
      'Anti-Data-Leak Buyer Phone Masking',
      'Role-Locked Bulk CSV Export Shield',
      'Immutable Timestamps & IP Activity Trail',
      'DPDP Act 2023 Workspace Compliance',
    ],
    sidebarModules: [
      'Immutable Audit Logs',
      'Phone Masking Shield',
      'Signed Contracts Vault',
      'DPDP Compliance Report',
    ],
    kpis: [
      { label: 'Audit Coverage', value: '100%', delta: 'Immutable' },
      { label: 'Masked Exports', value: '0 Leaks', delta: 'Admin Locked' },
      { label: 'DPDP Status', value: 'Compliant', delta: 'India Hosted' },
    ],
    col1: 'Security & Audit Event',
    col2: 'Actor / Role',
    col3: 'Policy Action',
    col4: 'Timestamp',
    totalLabel: '4,812 Events',
    rows: [
      {
        datePill: 'DPDP ✓',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: 'Phone Masking Enforced for Agent Export View',
        amount: 'Owner Policy',
        stage: 'Verified Shield',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: '2 mins ago',
      },
      {
        datePill: 'LOCKED',
        dateColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        title: 'GSTR-1 Monthly HSN Register Exported by Finance',
        amount: 'Billing Admin',
        stage: 'Logged + Hashed',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: 'Today, 4:15 PM',
      },
      {
        datePill: 'SIGNED',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: 'QTN-2026-1003 Buyer Digital Approval & GSTIN',
        amount: 'Apex Auto Ltd.',
        stage: 'Tamper-Proof',
        stageColor: 'bg-sky-500 text-white',
        closingDate: 'Today, 1:40 PM',
      },
    ],
  },
  {
    key: 'dev',
    code: 'De',
    codeColor: '#6366F1',
    name: 'Integrations',
    menuLabel: 'Development',
    personaRole: 'Webhooks & APIs',
    avatarBg: '#4F46E5',
    avatarInitials: 'DV',
    moduleTitle: 'API & Webhooks',
    scopeLabel: 'REST v1 + Cloud',
    primaryCta: 'Test Webhook',
    views: [
      'IndiaMART Webhook',
      'Meta Cloud API',
      'Razorpay Events',
      'SetuAI Keys',
    ],
    featuresList: [
      'Real-Time IndiaMART & Justdial Ingestion',
      'Official WhatsApp Cloud Webhook Receiver',
      'Razorpay Payment & UTR Callback Sync',
      'Multi-Tenant JWT + Account ID API Guard',
    ],
    sidebarModules: [
      'Webhook Endpoints',
      'Meta Cloud API Logs',
      'IndiaMART Pull Config',
      'API Keys & RateGuard',
    ],
    kpis: [
      { label: 'API Uptime', value: '99.98%', delta: '30ms Latency' },
      { label: 'Webhook Sync', value: 'Live 200 OK', delta: '8 Sources' },
      { label: 'Tenant Isolation', value: 'Strict', delta: 'JWT Scoped' },
    ],
    col1: 'Connector / Webhook Endpoint',
    col2: 'Events (24h)',
    col3: 'Health',
    col4: 'Avg Latency',
    totalLabel: '99.98% SLA',
    rows: [
      {
        datePill: 'META API',
        dateColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        title: '/v1/inbox/webhook · Official WhatsApp Cloud',
        amount: '1,842 calls',
        stage: '200 OK Live',
        stageColor: 'bg-emerald-500 text-white',
        closingDate: '28 ms',
      },
      {
        datePill: 'B2B PULL',
        dateColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
        title: '/v1/leads/ingest · IndiaMART CRM Push API',
        amount: '416 calls',
        stage: 'Synced Auto',
        stageColor: 'bg-sky-500 text-white',
        closingDate: '42 ms',
      },
      {
        datePill: 'RAZORPAY',
        dateColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        title: '/v1/invoices/payment-hook · UPI & NEFT UTR',
        amount: '94 calls',
        stage: 'Signature Verified',
        stageColor: 'bg-indigo-500 text-white',
        closingDate: '31 ms',
      },
    ],
  },
];

// ─── 3. INTERACTIVE 6-TAB EXPLORER + 9-MODULE BENTO + INTEGRATIONS ───────────
const interactiveTabs = [
  {
    id: 'ai-scoring',
    label: 'SetuAI Scoring',
    badge: '94/100 Accuracy',
    icon: Bot,
    color: '#3978EA',
    headline: 'Rank every IndiaMART, Meta & WhatsApp inquiry 1–100 in 2 seconds',
    summary:
      'SetuAI reads Hinglish and English messages, extracts buyer budget, quantity, and city, and tells your sales rep the exact next action to close the deal.',
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
      'Segment your workspace database by AI Score (Hot 75+), City (Noida / Delhi-NCR), or IndiaMART source and dispatch approved WhatsApp Cloud templates.',
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
    badge: 'Live Sync',
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
    badge: 'SetuAI Powered',
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
      'Dynamic CRM audience segments',
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
      'Consolidate WhatsApp Cloud, IndiaMART, and Email buyer threads into a single team inbox with SetuAI smart reply drafting.',
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
      'Live workspace aggregation across Leads, Deals, Invoices, Campaigns, and Workflows with NCR regional hub breakdowns.',
    accent: '#06B6D4',
    highlights: [
      'WhatsApp vs IndiaMART vs Meta ROI',
      'Noida, Delhi & Gurugram hub stats',
      'Live GST tax liability tracker',
    ],
  },
];

const integrations = [
  { name: 'WhatsApp Cloud API', category: 'Official Green-Tick', dot: 'bg-emerald-500' },
  { name: 'IndiaMART Lead Sync', category: 'B2B Marketplace', dot: 'bg-rose-500' },
  { name: 'Justdial Inquiries', category: 'Local B2B Leads', dot: 'bg-orange-500' },
  { name: 'Meta Lead Ads', category: 'FB & Instagram', dot: 'bg-blue-500' },
  { name: 'Google Ads', category: 'Search & Display', dot: 'bg-amber-500' },
  { name: 'Razorpay Links', category: 'Instant UPI & NEFT', dot: 'bg-indigo-500' },
  { name: 'Rule-46 GST & Tally', category: 'HSN & CGST/IGST', dot: 'bg-teal-500' },
  { name: 'SetuAI Neural Core', category: 'Hinglish NLP Engine', dot: 'bg-violet-500' },
];

// ─── SECTION A COMPONENT: CONTINUOUS 360° AUTO-ROTATING LIGHT FOCUS ORBIT ────
function Orbit360Section() {
  const [beamAngleDeg, setBeamAngleDeg] = useState<number>(175);
  const [hoveredOrbitId, setHoveredOrbitId] = useState<string | null>(null);
  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(true);

  const nodeAngles = useMemo(
    () =>
      orbitNodes.map((n) => ({
        id: n.id,
        deg: getNodeParamDeg(n),
      })),
    []
  );

  // Smooth continuous 360-degree rotating light beam sweep
  useEffect(() => {
    if (!isAutoOrbit || hoveredOrbitId !== null) return;

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - lastTs, 64);
      lastTs = now;
      // 32 deg/sec -> ~11.25 seconds per smooth full 360° revolution
      setBeamAngleDeg((prev) => (prev + (dt / 1000) * 32) % 360);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoOrbit, hoveredOrbitId]);

  // Determine which node is currently under the rotating spotlight (or explicitly hovered)
  const activeOrbitId = useMemo(() => {
    if (hoveredOrbitId) return hoveredOrbitId;
    let bestId = nodeAngles[0].id;
    let bestDiff = 360;
    for (const item of nodeAngles) {
      const diff = shortestAngleDiff(beamAngleDeg, item.deg);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestId = item.id;
      }
    }
    return bestId;
  }, [beamAngleDeg, hoveredOrbitId, nodeAngles]);

  const activeOrbit =
    orbitNodes.find((n) => n.id === activeOrbitId) || orbitNodes[7];

  const focusNode = (node: OrbitNode) => {
    setHoveredOrbitId(node.id);
    setBeamAngleDeg(getNodeParamDeg(node));
  };

  // Beam cone wedge geometry centered at (ORBIT_CX, ORBIT_CY)
  const baseRad = (beamAngleDeg * Math.PI) / 180;
  const spread = 0.31;
  const x1 = ORBIT_CX + BEAM_RX * Math.cos(baseRad - spread);
  const y1 = ORBIT_CY + BEAM_RY * Math.sin(baseRad - spread);
  const x2 = ORBIT_CX + BEAM_RX * Math.cos(baseRad + spread);
  const y2 = ORBIT_CY + BEAM_RY * Math.sin(baseRad + spread);
  const tipX = ORBIT_CX + BEAM_RX * Math.cos(baseRad);
  const tipY = ORBIT_CY + BEAM_RY * Math.sin(baseRad);

  return (
    <section
      id="orbit-360"
      className="py-20 md:py-28 bg-[#FDF5EA] dark:bg-[#070E1A] relative overflow-hidden transition-colors duration-300"
    >
      {/* Subtle ambient background glow */}
      <div
        className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 w-[780px] h-[380px] rounded-full opacity-35 dark:opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,87,255,0.22) 0%, rgba(56,189,248,0.12) 45%, transparent 75%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Live 360 Radar Control Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-blue-500/20 shadow-sm text-xs font-bold text-[#0057FF] dark:text-sky-400">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>360° Continuous Auto-Focus Router</span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              {Math.round(beamAngleDeg)}°
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setHoveredOrbitId(null);
              setIsAutoOrbit((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-[#0057FF] transition-colors"
          >
            {isAutoOrbit && !hoveredOrbitId ? (
              <>
                <Pause className="w-3 h-3 text-[#0057FF]" />
                <span>Pause Sweep</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-500" />
                <span>Resume 360° Sweep</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Concentric Orbital Diagram */}
        <div className="relative mx-auto max-w-5xl h-[360px] sm:h-[430px] md:h-[470px] select-none">
          <svg
            viewBox="0 0 960 460"
            className="w-full h-full overflow-visible"
            aria-label="Leadsetu 360-degree CRM ecosystem diagram"
          >
            <defs>
              <radialGradient id="prismBeamGrad" cx="50%" cy="34%" r="68%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.65" />
                <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.34" />
                <stop offset="85%" stopColor="#A855F7" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#FACC15" stopOpacity="0.02" />
              </radialGradient>
              <linearGradient id="beamEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0057FF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="hubPeachGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </radialGradient>
              <filter id="beamSoftGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Continuous 360° Auto-Rotating Prismatic Light Focus Beam */}
            <path
              d={`M ${ORBIT_CX} ${ORBIT_CY} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${BEAM_RX} ${BEAM_RY} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
              fill="url(#prismBeamGrad)"
              filter="url(#beamSoftGlow)"
            />

            {/* Crisp Light Focus Boundary Rays + Center Spotlight Core Line */}
            <line
              x1={ORBIT_CX}
              y1={ORBIT_CY}
              x2={x1.toFixed(1)}
              y2={y1.toFixed(1)}
              stroke="#38BDF8"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <line
              x1={ORBIT_CX}
              y1={ORBIT_CY}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke="#38BDF8"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <line
              x1={ORBIT_CX}
              y1={ORBIT_CY}
              x2={tipX.toFixed(1)}
              y2={tipY.toFixed(1)}
              stroke="#0057FF"
              strokeOpacity="0.55"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <circle
              cx={tipX.toFixed(1)}
              cy={tipY.toFixed(1)}
              r="6"
              fill="#38BDF8"
              fillOpacity="0.85"
            />

            {/* 5 Perspective Concentric Elliptical Rings */}
            {[
              { rx: 115, ry: 48, sw: 1.5, op: 0.72 },
              { rx: 195, ry: 86, sw: 1.4, op: 0.65 },
              { rx: 275, ry: 124, sw: 1.4, op: 0.58 },
              { rx: 355, ry: 162, sw: 1.4, op: 0.52 },
              { rx: 435, ry: 198, sw: 1.5, op: 0.55 },
            ].map((ring, idx) => (
              <ellipse
                key={idx}
                cx={ORBIT_CX}
                cy={ORBIT_CY + idx * 11}
                rx={ring.rx}
                ry={ring.ry}
                fill="none"
                stroke="#1D5CFF"
                strokeWidth={ring.sw}
                strokeOpacity={ring.op}
              />
            ))}

            {/* Small Orbital Bead Accents */}
            {[
              { x: 480, y: 272 },
              { x: 645, y: 185 },
              { x: 300, y: 160 },
              { x: 745, y: 315 },
              { x: 540, y: 95 },
            ].map((dot, idx) => (
              <circle
                key={idx}
                cx={dot.x}
                cy={dot.y}
                r="4.5"
                fill="#FFFFFF"
                stroke="#1D5CFF"
                strokeWidth="2"
              />
            ))}

            {/* Center Luminous Elevation Disk beneath the Official Leadsetu Logo */}
            <ellipse
              cx={ORBIT_CX}
              cy={ORBIT_CY}
              rx="88"
              ry="40"
              fill="url(#hubPeachGrad)"
              stroke="#3B82F6"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
          </svg>

          {/* Official Leadsetu Logo Center 360° Hub (Replaces Zoho Infinity Mark) */}
          <div
            style={{
              left: '50%',
              top: '33.7%',
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-white dark:bg-[#0D1829] p-1.5 shadow-[0_0_35px_rgba(0,87,255,0.45)] ring-2 ring-[#0057FF]/60 flex items-center justify-center">
              <div
                className="absolute -inset-2 rounded-3xl border border-dashed border-sky-400/70 animate-spin"
                style={{ animationDuration: '14s' }}
              />
              <img
                src="/logo.png"
                alt="Leadsetu Official Logo"
                className="w-full h-full rounded-xl object-cover relative z-10"
              />
            </div>
            <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-[#0057FF] text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase shadow-md">
              Leadsetu 360°
            </span>
          </div>

          {/* Floating Interactive Pill Nodes */}
          {orbitNodes.map((node) => {
            const isSelected = node.id === activeOrbitId;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => focusNode(node)}
                onMouseEnter={() => focusNode(node)}
                onMouseLeave={() => setHoveredOrbitId(null)}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-10 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-center transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'bg-white dark:bg-[#0F1E36] border-[#0057FF] dark:border-sky-400 shadow-[0_0_28px_rgba(0,87,255,0.5)] scale-110 ring-4 ring-[#0057FF]/25'
                    : 'bg-white/95 dark:bg-slate-900/90 border-white/80 dark:border-slate-700/90 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.16)] hover:scale-105 hover:border-[#0057FF]/60'
                }`}
              >
                <span className="block text-[10px] sm:text-xs font-extrabold leading-tight text-[#0057FF] dark:text-sky-400 whitespace-nowrap">
                  {node.labelLine1}
                </span>
                <span className="block text-[10px] sm:text-xs font-extrabold leading-tight text-[#0057FF] dark:text-sky-400 whitespace-nowrap">
                  {node.labelLine2}
                </span>
              </button>
            );
          })}
        </div>

        {/* Synchronized Active Orbit Engine Spotlight Card */}
        <div className="max-w-2xl mx-auto mt-3 mb-9 rounded-2xl bg-white/90 dark:bg-[#0E182B]/95 backdrop-blur-md border border-blue-500/20 dark:border-sky-500/25 px-5 py-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-left transition-all duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#0057FF] dark:text-sky-400 border border-blue-200 dark:border-blue-800">
                {activeOrbit.badge}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {activeOrbit.labelLine1} {activeOrbit.labelLine2}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              {activeOrbit.summary}
            </p>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-full whitespace-nowrap">
            {activeOrbit.metric}
          </span>
        </div>

        {/* Center Callout Headline & CTAs */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Everything your business needs,
            </p>
            <h2 className="text-3xl sm:text-5xl md:text-[56px] font-black tracking-tight text-[#0057FF] dark:text-sky-400 leading-[1.1] mt-1">
              with a neat 360° view.
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-full font-extrabold text-xs sm:text-sm tracking-wider text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5 uppercase"
            >
              GET STARTED
            </Link>
            <a
              href="#pricing"
              className="px-8 py-3.5 rounded-full font-extrabold text-xs sm:text-sm tracking-wider text-white bg-[#0B0F19] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 shadow-lg transition-all hover:-translate-y-0.5 uppercase"
            >
              SEE PRICING
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION B COMPONENT: AUTO-SELECTING DEPARTMENT WORKSPACE SWITCHER ────────
function TeamViewsSection() {
  const [deptIndex, setDeptIndex] = useState<number>(0);
  const [isAutoDept, setIsAutoDept] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Automatic cycling through every department in the workspace switcher
  useEffect(() => {
    if (!isAutoDept || isHovered) return;
    const timer = setInterval(() => {
      setDeptIndex((prev) => (prev + 1) % departmentWorkspaces.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isAutoDept, isHovered]);

  const activeDept = departmentWorkspaces[deptIndex] || departmentWorkspaces[0];

  const cycleDept = (dir: -1 | 1) => {
    setDeptIndex(
      (prev) =>
        (prev + dir + departmentWorkspaces.length) % departmentWorkspaces.length
    );
  };

  return (
    <section
      id="team-views"
      className="pb-20 pt-8 md:pb-28 bg-[#FDF5EA] dark:bg-[#070E1A] border-b border-amber-900/10 dark:border-slate-800 relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading + Auto-Select Mode Badge */}
        <div className="text-center max-w-2xl mx-auto mb-6 space-y-3">
          <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
            Click any department in the workspace switcher —{' '}
            <span className="font-bold text-slate-950 dark:text-white">
              they see exactly what they need and nothing else.
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Auto-Selecting Workspace:
              <span className="text-[#0057FF] dark:text-sky-400">
                {activeDept.menuLabel} ({deptIndex + 1}/{departmentWorkspaces.length})
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsAutoDept((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-[#0057FF] transition-colors"
            >
              {isAutoDept ? (
                <>
                  <Pause className="w-3 h-3 text-[#0057FF]" />
                  <span>Pause Auto</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-500" />
                  <span>Auto Tour</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Mockup Wrapper (Hover pauses auto-selection cleanly) */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative max-w-5xl mx-auto flex items-center gap-3 sm:gap-5"
        >
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => cycleDept(-1)}
            aria-label="Previous department workspace"
            className="hidden sm:flex w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-md items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-[#0057FF] hover:text-white hover:border-[#0057FF] transition-all flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Desktop Application Frame */}
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.28)]">
            <div className="grid grid-cols-12 min-h-[500px]">
              {/* Left Dark-Navy Sidebar with Live Auto-Selecting Workspace Switcher */}
              <div className="hidden md:flex md:col-span-3 bg-[#1A2144] text-slate-200 flex-col justify-between p-3 relative">
                <div>
                  {/* Brand Bar with Official Leadsetu Logo */}
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
                    <img
                      src="/logo.png"
                      alt="Leadsetu CRM"
                      className="w-6 h-6 rounded-md object-cover ring-1 ring-white/25"
                    />
                    <span className="text-xs font-extrabold text-white tracking-tight">
                      Leadsetu CRM
                    </span>
                  </div>

                  {/* Base Nav */}
                  <div className="space-y-0.5 text-[11px] font-medium text-slate-300 mb-3">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>Home</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                      <FileBarChart className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reports</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                      <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Requests</span>
                    </div>
                  </div>

                  {/* Active Team Switcher Header */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/15 text-white text-xs font-bold mb-1.5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded text-[10px] font-extrabold text-white flex items-center justify-center shadow-sm"
                        style={{ background: activeDept.codeColor }}
                      >
                        {activeDept.code}
                      </span>
                      <span>{activeDept.menuLabel}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-200" />
                  </div>

                  {/* Auto-Selecting Workspace Switcher Card */}
                  <div className="rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200/90 dark:border-slate-700 shadow-2xl p-1.5 space-y-0.5 relative z-20 md:-mr-5">
                    {departmentWorkspaces.map((item, idx) => {
                      const isCurrent = item.key === activeDept.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setDeptIndex(idx)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200 ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/80 font-bold text-slate-950 dark:text-white ring-1 ring-[#0057FF]/30'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded text-[9px] font-extrabold text-white flex items-center justify-center"
                              style={{ background: item.codeColor }}
                            >
                              {item.code}
                            </span>
                            <span>{item.menuLabel}</span>
                          </div>
                          {isCurrent && (
                            <span className="w-4 h-4 rounded-full bg-[#0057FF] text-white flex items-center justify-center shadow-sm">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role-Specific Sidebar Modules (Changes dynamically per selected department!) */}
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1 px-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-sky-300 mb-1">
                    {activeDept.name} Sidebar Modules
                  </div>
                  {activeDept.sidebarModules.map((mod) => (
                    <div
                      key={mod}
                      className="flex items-center gap-1.5 text-[10px] text-slate-200 truncate"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="truncate">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Workspace Canvas */}
              <div className="col-span-12 md:col-span-9 flex flex-col justify-between bg-white dark:bg-[#0F172A] relative">
                <div>
                  {/* Workspace Top Toolbar */}
                  <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {activeDept.moduleTitle}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        {activeDept.scopeLabel} <ChevronDown className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 w-44">
                        <Search className="w-3.5 h-3.5" />
                        <span>Search {activeDept.name}...</span>
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                      <span className="relative w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Bell className="w-3.5 h-3.5" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] text-white font-bold flex items-center justify-center">
                          4
                        </span>
                      </span>
                      <span className="hidden sm:flex w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-500">
                        <Settings className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* TAILORED FEATURES UNLOCKED FOR SELECTED DEPARTMENT */}
                  <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/80 dark:from-[#0B172C] dark:via-[#101F3B] dark:to-[#131C35] border-b border-blue-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0057FF] dark:text-sky-400 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Tailored Features Unlocked for {activeDept.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-500" />
                        Zero Clutter · RBAC Scoped
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeDept.featuresList.map((feat) => (
                        <span
                          key={feat}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-700 text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live Role KPI Mini Strip */}
                  <div className="px-4 sm:px-6 py-2.5 grid grid-cols-3 gap-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B1322]">
                    {activeDept.kpis.map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {kpi.label}
                          </div>
                          <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {kpi.value}
                          </div>
                        </div>
                        <span className="hidden sm:inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          {kpi.delta}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Sub-tabs + Filter/Create Row */}
                  <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-[11px]">
                      {activeDept.views.map((view, idx) => (
                        <span
                          key={view}
                          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-semibold ${
                            idx === 0
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-[#0057FF] dark:text-sky-400 border border-indigo-200/70 dark:border-indigo-800'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {view}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Filter className="w-3 h-3" /> Filter
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpDown className="w-3 h-3" /> Sort
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" /> Board
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-block px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          Fetch Records
                        </span>
                        <Link
                          href="/signup"
                          className="px-3 py-1 rounded-md bg-[#0057FF] hover:bg-blue-700 text-white font-bold transition-colors"
                        >
                          {activeDept.primaryCta}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Department Selector Pills */}
                  <div className="flex md:hidden items-center gap-1.5 px-4 py-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800">
                    {departmentWorkspaces.map((d, idx) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setDeptIndex(idx)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                          idx === deptIndex
                            ? 'bg-[#0057FF] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {d.menuLabel}
                      </button>
                    ))}
                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 pl-5 pr-2 w-24">Tag</th>
                          <th className="py-2.5 px-3">{activeDept.col1}</th>
                          <th className="py-2.5 px-3">{activeDept.col2}</th>
                          <th className="py-2.5 px-3">{activeDept.col3}</th>
                          <th className="py-2.5 pr-5 pl-3 text-right">
                            {activeDept.col4}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-[11px]">
                        {activeDept.rows.map((row) => (
                          <tr
                            key={row.title}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 pl-5 pr-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${row.dateColor}`}
                              >
                                {row.datePill}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                              {row.title}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {row.amount}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.stageColor}`}
                              >
                                {row.stage}
                              </span>
                            </td>
                            <td className="py-2.5 pr-5 pl-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {row.closingDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Footer + Floating Blue Team Persona Pill */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 relative">
                  <span>
                    Total Record:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {activeDept.totalLabel}
                    </strong>{' '}
                    ·{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Role-Based Access Verified
                    </span>
                  </span>

                  <div className="hidden sm:flex items-center gap-3 pl-5 pr-2 py-1.5 rounded-full bg-[#0057FF] text-white shadow-xl shadow-blue-600/30 border-2 border-white dark:border-slate-900 -mt-10 relative z-20">
                    <div className="text-left pr-1">
                      <div className="text-[10px] text-blue-100 font-semibold leading-none">
                        Team
                      </div>
                      <div className="text-base font-black tracking-tight leading-tight">
                        {activeDept.name}
                      </div>
                    </div>
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white ring-2 ring-white/80"
                      style={{ background: activeDept.avatarBg }}
                    >
                      {activeDept.avatarInitials}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => cycleDept(1)}
            aria-label="Next department workspace"
            className="hidden sm:flex w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-md items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-[#0057FF] hover:text-white hover:border-[#0057FF] transition-all flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Editorial Statement */}
        <div className="text-center mt-14 max-w-3xl mx-auto">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Staying relevant and driving B2B innovation across India.
          </h3>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN FEATURES EXPORT ────────────────────────────────────────────────────
export default function Features() {
  const [activeTabId, setActiveTabId] = useState<string>('ai-scoring');
  const [tourHovered, setTourHovered] = useState<boolean>(false);

  // Auto-cycle interactive product tour when user isn't interacting with it
  useEffect(() => {
    if (tourHovered) return;
    const timer = setInterval(() => {
      setActiveTabId((prev) => {
        const idx = interactiveTabs.findIndex((t) => t.id === prev);
        return interactiveTabs[(idx + 1) % interactiveTabs.length].id;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [tourHovered]);

  const activeTab =
    interactiveTabs.find((t) => t.id === activeTabId) || interactiveTabs[0];

  return (
    <>
      {/* SECTION A: CONTINUOUS 360° CONCENTRIC ORBIT ECOSYSTEM */}
      <Orbit360Section />

      {/* SECTION B: AUTO-SELECTING DEPARTMENT & ROLE CRM WORKSPACE SWITCHER */}
      <TeamViewsSection />

      {/* SECTION C: INTERACTIVE 14-MODULE TOUR, ENHANCED BENTO GRID & INTEGRATIONS */}
      <section
        id="features"
        className="py-24 md:py-32 bg-white dark:bg-[#070D19] relative overflow-hidden transition-colors duration-200"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-grid-light opacity-70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border bg-brand-light dark:bg-brand-blue/15 text-brand-blue dark:text-brand-sky border-brand-blue/25">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Product Tour · 14 Live Modules
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
          <div
            className="mb-24"
            onMouseEnter={() => setTourHovered(true)}
            onMouseLeave={() => setTourHovered(false)}
          >
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
                        ? 'bg-brand-navy text-white border-brand-blue shadow-brand-sm scale-[1.03]'
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

            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-[#F8FAFF] via-white to-[#EEF3FD]/50 dark:from-[#0B1320] dark:via-[#0F172A] dark:to-[#13203B] p-6 sm:p-10 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
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
                      href="/signup"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-md transition-colors"
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

                <div className="lg:col-span-7">
                  <div className="rounded-2xl bg-[#0B1320] text-white border border-slate-800 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-[#111C2D] border-b border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <img
                          src="/logo.png"
                          alt="Leadsetu"
                          className="w-4 h-4 rounded object-cover ml-1.5"
                        />
                        <span className="font-mono text-[11px] text-slate-300">
                          app.leadsetu.in/{activeTab.id}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Leadsetu Cloud Live
                      </span>
                    </div>

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
                              SetuAI: 94/100 · HOT
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
                              IF: SetuAI Score &gt;= 80 AND City IN [Noida, Delhi-NCR]
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
                              { name: 'Anuj Yadav', uid: '4827301956', role: 'Owner', target: '₹12.5L Won' },
                              { name: 'Rohit Verma', uid: '7391048261', role: 'Manager · Noida Sec 62', target: '₹6.8L (91%)' },
                              { name: 'Neha Kapoor', uid: '9182736450', role: 'Agent · Gurugram', target: '₹4.2L (84%)' },
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
                                  <div className="font-mono text-[11px] text-brand-sky">UID #{m.uid}</div>
                                  <div className="text-[11px] font-bold text-emerald-400">{m.target}</div>
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
                              <div className="font-extrabold text-sm text-white mt-0.5">4 Deals · ₹6.2L</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-[10px] text-slate-400">Proposal Sent (65%)</div>
                              <div className="font-extrabold text-sm text-brand-sky mt-0.5">3 Deals · ₹8.4L</div>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                              <div className="text-[10px] text-emerald-300">Closed Won ✓</div>
                              <div className="font-extrabold text-sm text-emerald-300 mt-0.5">5 Deals · ₹14.8L</div>
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

          {/* ─── ENHANCED 9-MODULE BENTO GRID ───────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-3xl p-7 border border-slate-200/85 dark:border-slate-800/95 bg-gradient-to-b from-[#FAFCFF] to-white dark:from-[#0F172A] dark:to-[#0A111E] hover:border-brand-blue/70 hover:-translate-y-1 hover:shadow-[0_24px_60px_-15px_rgba(0,87,255,0.22)] transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Accent Line */}
                  <div
                    className="absolute inset-x-0 top-0 h-1 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${feature.accent} 50%, transparent 100%)`,
                    }}
                  />

                  {/* Ambient Radial Hover Glow */}
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-2xl"
                    style={{ background: feature.accent }}
                  />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `${feature.accent}18`,
                          color: feature.accent,
                          border: `1px solid ${feature.accent}40`,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 text-brand-navy dark:text-slate-100 border border-slate-200/60 dark:border-slate-700"
                      >
                        {feature.metric}
                      </span>
                    </div>

                    <div
                      className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: feature.accent }}
                    >
                      {feature.badge}
                    </div>

                    <h3 className="font-extrabold text-xl mb-3 tracking-tight text-brand-navy dark:text-white group-hover:text-brand-blue dark:group-hover:text-sky-400 transition-colors flex items-center justify-between gap-2">
                      <span>{feature.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-brand-blue dark:text-sky-400 flex-shrink-0" />
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      {feature.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 mb-4">
                      {feature.highlights.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: feature.accent }}
                          />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-brand-blue dark:text-sky-400 group-hover:gap-2.5 transition-all"
                    >
                      <span>Explore Live Module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
                      <div className="text-xs sm:text-sm font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

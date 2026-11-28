'use client';

import React from 'react';
import Link from 'next/link';
import { Webhook, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import UniversalWebhooksManager from '@/components/integrations/UniversalWebhooksManager';

export default function UniversalWebhooksHubPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            HTTPS-Only Self-Serve Inbound Webhooks Hub
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white flex items-center gap-2.5">
            <Webhook className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Universal Webhooks &amp; Smart Phone Upsert
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Connect any website form, landing page, ERP, billing software, or automation
            tool via <code className="text-emerald-700 dark:text-emerald-300 font-bold">GET</code> or{' '}
            <code className="text-brand-blue dark:text-blue-300 font-bold">POST</code> HTTPS webhooks. Capture live
            payloads, map fields visually, and upsert Leads, B2B Contacts, or Deals by
            normalized phone number (<code className="font-semibold">+91XXXXXXXXXX</code>).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/settings/integrations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111D33] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/15 shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            All Native Integrations
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Manager Component */}
      <UniversalWebhooksManager />
    </div>
  );
}

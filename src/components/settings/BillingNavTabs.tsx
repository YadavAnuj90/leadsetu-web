'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Sparkles } from 'lucide-react';

export default function BillingNavTabs({
  aiExceeded = false,
  aiRemaining,
}: {
  aiExceeded?: boolean;
  aiRemaining?: number;
}) {
  const pathname = usePathname();
  const isAiCreditsPage = pathname?.startsWith('/settings/billing/ai-credits');

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-1.5 shadow-sm">
      <Link
        href="/settings/billing"
        className={`flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all ${
          !isAiCreditsPage
            ? 'bg-brand-navy text-white shadow-sm dark:bg-brand-blue'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <CreditCard className="w-4 h-4" />
        <span>1. Platform Subscription Billing</span>
      </Link>

      <Link
        href="/settings/billing/ai-credits"
        className={`flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all ${
          isAiCreditsPage
            ? 'bg-brand-navy text-white shadow-sm dark:bg-brand-blue'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span>2. AI Credits &amp; Top-Up Purchases</span>
        {aiExceeded ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
            Credits Exhausted
          </span>
        ) : typeof aiRemaining === 'number' ? (
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
            {aiRemaining.toLocaleString('en-IN')} left
          </span>
        ) : null}
      </Link>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  fetchBillingUsageApi,
  type BillingUsageDashboardResponse,
} from '@/lib/tenants-api';

interface SubscriptionDunningBannerProps {
  enabled: boolean;
}

export default function SubscriptionDunningBanner({
  enabled,
}: SubscriptionDunningBannerProps) {
  const [usage, setUsage] = useState<BillingUsageDashboardResponse | null>(
    null,
  );

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchBillingUsageApi()
      .then((res) => {
        if (active) setUsage(res);
      })
      .catch(() => {
        // ignore background banner fetch error
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  if (!enabled || !usage) return null;

  const { dunningState, daysRemaining, gracePeriodDays, periodEnd } =
    usage.renewal;

  if (dunningState === 'active') return null;

  const isCritical =
    dunningState === 'past_due_action_required' ||
    dunningState === 'grace_period';

  return (
    <div
      className={`px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b ${
        isCritical
          ? 'bg-rose-600/95 text-white border-rose-500'
          : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {isCritical ? (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        ) : (
          <CalendarClock className="w-4 h-4 shrink-0" />
        )}
        <span>
          {dunningState === 'past_due_action_required'
            ? `Subscription Expired (${Math.abs(daysRemaining)}d past grace period ended ${periodEnd}) — Renew immediately to keep workspace writes active.`
            : dunningState === 'grace_period'
              ? `Subscription in ${gracePeriodDays}-Day Grace Period (${Math.abs(daysRemaining)}d past ${periodEnd}) — Renew now to avoid service pause.`
              : `Subscription Renewal Due in ${daysRemaining} day(s) (Period ends ${periodEnd}) · ${usage.plan.name}`}
        </span>
      </div>

      <Link
        href="/settings/billing"
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
          isCritical
            ? 'bg-white text-rose-700 hover:bg-slate-100'
            : 'bg-amber-600 text-white hover:bg-amber-700'
        }`}
      >
        1-Click Renew Now <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

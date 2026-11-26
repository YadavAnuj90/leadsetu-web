'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, AlertTriangle, ArrowRight, X } from 'lucide-react';
import {
  fetchBillingUsageApi,
  type BillingUsageDashboardResponse,
} from '@/lib/tenants-api';

interface SubscriptionDunningBannerProps {
  enabled: boolean;
  isAdmin?: boolean;
}

export default function SubscriptionDunningBanner({
  enabled,
  isAdmin = false,
}: SubscriptionDunningBannerProps) {
  const [usage, setUsage] = useState<BillingUsageDashboardResponse | null>(
    null,
  );
  const [dismissedToday, setDismissedToday] = useState(false);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dismissStorageKey = `leadsetu_expiry_reminder_dismissed_${todayKey}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setDismissedToday(window.localStorage.getItem(dismissStorageKey) === '1');
    } catch {
      setDismissedToday(false);
    }
  }, [dismissStorageKey]);

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

  const { dunningState, daysRemaining, periodEnd } = usage.renewal;
  const isExpired =
    dunningState === 'past_due_action_required' ||
    dunningState === 'grace_period' ||
    daysRemaining < 0;
  const isExpiringIn7Days = !isExpired && daysRemaining >= 0 && daysRemaining <= 7;

  if (!isExpired && !isExpiringIn7Days) return null;
  if (!isExpired && dismissedToday) return null;

  const handleDismissToday = () => {
    setDismissedToday(true);
    try {
      window.localStorage.setItem(dismissStorageKey, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b ${
        isExpired
          ? 'bg-rose-600/95 text-white border-rose-500'
          : daysRemaining <= 2
            ? 'bg-amber-500 text-slate-950 border-amber-400'
            : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {isExpired ? (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        ) : (
          <CalendarClock className="w-4 h-4 shrink-0" />
        )}
        <span>
          {isExpired
            ? `Subscription Expired (${periodEnd}) — Data is completely safe, but all manual & AI features are paused until your Admin renews.`
            : `Daily Reminder (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left): ${usage.plan.name} expires on ${periodEnd}. Renew before expiry to keep CRM & AI features active.`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Link
            href="/settings/billing"
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
              isExpired
                ? 'bg-white text-rose-700 hover:bg-slate-100'
                : 'bg-amber-700 text-white hover:bg-amber-800'
            }`}
          >
            1-Click Renew Now <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <span className="px-2.5 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-[11px] font-bold">
            Notify Workspace Admin to Renew
          </span>
        )}

        {!isExpired && (
          <button
            type="button"
            onClick={handleDismissToday}
            title="Remind me again tomorrow"
            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="Dismiss reminder for today"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

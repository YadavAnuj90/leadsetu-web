'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import {
  fetchPreCallContextApi,
  type PreCallContextBrief,
} from '@/lib/calls-api';

interface PreCallContextCardProps {
  entityType?: string;
  entityId?: string;
  phone?: string;
  variant?: 'dark' | 'light';
}

export default function PreCallContextCard({
  entityType,
  entityId,
  phone,
  variant = 'light',
}: PreCallContextCardProps) {
  const [ctx, setCtx] = useState<PreCallContextBrief | null>(null);
  const [loading, setLoading] = useState(false);

  const hasLookupKey = Boolean(entityId?.trim() || phone?.trim());

  useEffect(() => {
    if (!hasLookupKey) {
      setCtx(null);
      return;
    }
    let active = true;
    setLoading(true);
    fetchPreCallContextApi({
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(phone ? { phone } : {}),
    })
      .then((res) => {
        if (active) setCtx(res);
      })
      .catch(() => {
        if (active) setCtx(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [entityId, entityType, hasLookupKey, phone]);

  if (!hasLookupKey) return null;

  const isDark = variant === 'dark';

  if (loading && !ctx) {
    return (
      <div
        className={`rounded-xl px-3 py-2 text-[11px] flex items-center gap-2 border ${
          isDark
            ? 'bg-white/10 border-white/15 text-slate-300'
            : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-500'
        }`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
        <span>Loading CRM Context Brief...</span>
      </div>
    );
  }

  if (!ctx || !ctx.found) return null;

  const hasBilling =
    ctx.billing.openQuotesCount > 0 ||
    ctx.billing.pendingInvoicesCount > 0 ||
    ctx.billing.pendingBalanceInr > 0;

  if (!ctx.aiNextAction && !ctx.lastWhatsApp && !hasBilling) return null;

  return (
    <div
      className={`rounded-2xl p-3 text-left space-y-2 border ${
        isDark
          ? 'bg-white/10 border-white/15 text-slate-100 backdrop-blur-sm'
          : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider ${
            isDark ? 'text-sky-300' : 'text-brand-blue dark:text-sky-300'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Pre-Call Context Brief
        </span>
        {ctx.aiScore > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isDark
                ? 'bg-emerald-400/20 text-emerald-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {ctx.aiLabel || 'AI'} {ctx.aiScore}/100
          </span>
        )}
      </div>

      {ctx.aiNextAction && (
        <div className="text-[11px] leading-snug">
          <span className="font-bold opacity-80">Next Action: </span>
          <span>{ctx.aiNextAction}</span>
        </div>
      )}

      {ctx.lastWhatsApp?.text && (
        <div
          className={`rounded-xl px-2.5 py-1.5 text-[11px] flex items-start gap-1.5 ${
            isDark
              ? 'bg-emerald-500/15 border border-emerald-400/25 text-emerald-100'
              : 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">
            <strong>Last WA:</strong> {ctx.lastWhatsApp.text}
          </span>
        </div>
      )}

      {hasBilling && (
        <div
          className={`rounded-xl px-2.5 py-1.5 text-[11px] flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-amber-400/15 border border-amber-300/25 text-amber-100'
              : 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <span className="inline-flex items-center gap-1.5 font-semibold truncate">
            <FileText className="w-3 h-3 shrink-0" />
            <span>
              {ctx.billing.openQuotesCount} Quote{ctx.billing.openQuotesCount === 1 ? '' : 's'}
              {ctx.billing.pendingInvoicesCount > 0
                ? ` · ${ctx.billing.pendingInvoicesCount} Pending Bill`
                : ''}
            </span>
          </span>
          {ctx.billing.pendingBalanceInr > 0 && (
            <span className="font-mono font-extrabold shrink-0">
              Due ₹{ctx.billing.pendingBalanceInr.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

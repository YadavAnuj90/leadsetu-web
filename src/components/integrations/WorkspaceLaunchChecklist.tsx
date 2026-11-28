'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  MessageSquare,
  QrCode,
  Rocket,
  Target,
} from 'lucide-react';
import {
  fetchRecoveryOverviewApi,
  updateRecoveryConfigApi,
} from '@/lib/invoices-api';
import { fetchLeadConnectorsApi } from '@/lib/marketplace-sync-api';
import { fetchMetaCapiOverviewApi } from '@/lib/meta-capi-api';
import { fetchBillingSummaryApi } from '@/lib/tenants-api';
import { getErrorMessage } from '@/lib/api-client';
import type { WhatsAppCloudConfig } from '@/types/contracts';

interface WorkspaceLaunchChecklistProps {
  waConfig: WhatsAppCloudConfig | null;
  onSelectChannel?: (
    tab: 'whatsapp' | 'indiamart' | 'webhooks' | 'meta' | 'omnichannel',
  ) => void;
}

export default function WorkspaceLaunchChecklist({
  waConfig,
  onSelectChannel,
}: WorkspaceLaunchChecklistProps) {
  const [loading, setLoading] = useState(true);
  const [razorpayMode, setRazorpayMode] = useState<'razorpay_live' | 'razorpay_sandbox'>(
    'razorpay_sandbox',
  );
  const [upiConfigured, setUpiConfigured] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [capiConfigured, setCapiConfigured] = useState(false);
  const [capiPixelId, setCapiPixelId] = useState('');
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingPath, setBookingPath] = useState('');

  const [editingUpi, setEditingUpi] = useState(false);
  const [upiDraft, setUpiDraft] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiErr, setUpiErr] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const [billingRes, recoveryRes, capiRes, connectorsRes] =
        await Promise.allSettled([
          fetchBillingSummaryApi(),
          fetchRecoveryOverviewApi(),
          fetchMetaCapiOverviewApi(),
          fetchLeadConnectorsApi(),
        ]);

      if (billingRes.status === 'fulfilled' && billingRes.value.razorpay) {
        setRazorpayMode(billingRes.value.razorpay.mode);
      }
      if (recoveryRes.status === 'fulfilled' && recoveryRes.value.recoveryConfig) {
        const vpa = String(recoveryRes.value.recoveryConfig.upiId || '').trim();
        const isVpaSet = Boolean(vpa && vpa.includes('@'));
        setUpiConfigured(isVpaSet);
        setUpiId(vpa);
        setUpiDraft(isVpaSet ? vpa : '');
      }
      if (capiRes.status === 'fulfilled' && capiRes.value.config) {
        setCapiConfigured(
          Boolean(
            capiRes.value.config.enabled && capiRes.value.config.pixelId?.trim(),
          ),
        );
        setCapiPixelId(capiRes.value.config.pixelId || '');
      }
      if (connectorsRes.status === 'fulfilled') {
        const b = connectorsRes.value.bookingScheduler;
        setBookingEnabled(Boolean(b?.enabled && b?.slug));
        setBookingPath(
          connectorsRes.value.endpoints?.bookingPublicPath ||
            (b?.slug ? `/book/${b.slug}` : ''),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChecklist();
  }, [loadChecklist]);

  const handleQuickSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const vpa = upiDraft.trim();
    if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(vpa)) {
      setUpiErr('Enter valid VPA (e.g. brand@okicici)');
      return;
    }
    setSavingUpi(true);
    setUpiErr(null);
    try {
      const updated = await updateRecoveryConfigApi({ upiId: vpa });
      const savedVpa = String(updated.upiId || vpa).trim();
      setUpiConfigured(Boolean(savedVpa && savedVpa.includes('@')));
      setUpiId(savedVpa);
      setEditingUpi(false);
    } catch (err) {
      setUpiErr(getErrorMessage(err));
    } finally {
      setSavingUpi(false);
    }
  };

  const whatsappReady = Boolean(waConfig?.enabled && waConfig?.configured);
  const razorpayLive = razorpayMode === 'razorpay_live';
  const webOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalOrigin = /localhost|127\.0\.0\.1/i.test(webOrigin);
  const bookingFullUrl =
    bookingPath && webOrigin ? `${webOrigin}${bookingPath}` : bookingPath;

  const checks = [
    {
      id: 'whatsapp',
      label: 'WhatsApp Cloud',
      ready: whatsappReady,
      detail: whatsappReady
        ? waConfig?.verifiedPhoneNumber || 'Gateway Active'
        : 'Connect Number',
      icon: MessageSquare,
      onClick: () => onSelectChannel?.('whatsapp'),
    },
    {
      id: 'razorpay',
      label: 'Razorpay Pay Links',
      ready: razorpayLive,
      detail: razorpayLive
        ? 'Live Checkout Ready'
        : 'Sandbox / Test Keys Active',
      icon: CreditCard,
      href: '/settings/billing',
    },
    {
      id: 'upi',
      label: 'Business UPI VPA',
      ready: upiConfigured,
      detail: upiConfigured ? upiId : 'Set VPA for QR',
      icon: QrCode,
      onClick: () => setEditingUpi((v) => !v),
    },
    {
      id: 'capi',
      label: 'Meta CAPI Purchase',
      ready: capiConfigured,
      detail: capiConfigured ? `Pixel ${capiPixelId}` : 'Add Pixel & Token',
      icon: Target,
      onClick: () => onSelectChannel?.('meta'),
    },
    {
      id: 'booking',
      label: 'Booking URL',
      ready: bookingEnabled && !isLocalOrigin,
      partial: bookingEnabled && isLocalOrigin,
      detail: bookingEnabled
        ? isLocalOrigin
          ? `${bookingPath} (Localhost)`
          : bookingFullUrl
        : 'Enable Scheduler',
      icon: Calendar,
      onClick: () => onSelectChannel?.('omnichannel'),
    },
  ];

  const readyCount = checks.filter((c) => c.ready).length;

  return (
    <div className="bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-sky-400 flex items-center justify-center">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-brand-navy dark:text-white">
              Workspace Production Launch Checklist
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live readiness across WhatsApp Cloud, Razorpay + UPI QR, Meta CAPI &amp; Public Booking Origin (`FRONTEND_URL`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                readyCount === checks.length
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
              }`}
            >
              {readyCount} / {checks.length} Production Ready
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {checks.map((chk) => {
          const Icon = chk.icon;
          const statusClass = chk.ready
            ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
            : chk.partial
              ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
              : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10';

          const content = (
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-navy dark:text-white">
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{chk.label}</span>
                </div>
                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate mt-1">
                  {chk.detail}
                </div>
              </div>
              {chk.ready ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </div>
          );

          return chk.href ? (
            <Link
              key={chk.id}
              href={chk.href}
              className={`p-3 rounded-2xl border text-left hover:border-brand-blue transition-all flex items-center ${statusClass}`}
            >
              {content}
            </Link>
          ) : (
            <button
              key={chk.id}
              type="button"
              onClick={chk.onClick}
              className={`p-3 rounded-2xl border text-left hover:border-brand-blue transition-all flex items-center ${statusClass}`}
            >
              {content}
            </button>
          );
        })}
      </div>

      {editingUpi && (
        <form
          onSubmit={(e) => void handleQuickSaveUpi(e)}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-2 text-xs"
        >
          <span className="font-bold text-brand-navy dark:text-white">
            Set Business UPI VPA:
          </span>
          <input
            type="text"
            required
            value={upiDraft}
            onChange={(e) => setUpiDraft(e.target.value)}
            placeholder="yourbusiness@okicici"
            className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 font-mono text-brand-navy dark:text-white"
          />
          <button
            type="submit"
            disabled={savingUpi}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold disabled:opacity-50"
          >
            {savingUpi ? 'Saving...' : 'Save UPI ID'}
          </button>
          <button
            type="button"
            onClick={() => setEditingUpi(false)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 font-bold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          {upiErr && (
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
              {upiErr}
            </span>
          )}
        </form>
      )}

      {bookingEnabled && isLocalOrigin && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200">
          <span>
            Booking link currently resolves against <code className="font-bold">{webOrigin}</code>. Before deploying live, set <code className="font-bold">FRONTEND_URL</code> &amp; <code className="font-bold">PUBLIC_WEB_URL</code> to your custom HTTPS domain on the API server.
          </span>
          {bookingPath && (
            <a
              href={bookingPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-extrabold underline shrink-0"
            >
              Preview Booking Page <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

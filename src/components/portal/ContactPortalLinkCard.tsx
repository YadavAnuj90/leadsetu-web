'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { manageContactPortalLinkApi } from '@/lib/portal-api';
import { getErrorMessage } from '@/lib/api-client';

interface ContactPortalLinkCardProps {
  contactId: string;
  contactName: string;
  companyName?: string;
  initialToken?: string;
  initialEnabled?: boolean;
  lastAccessedAt?: string;
  onUpdated?: (next: {
    portalToken: string;
    portalEnabled: boolean;
    portalLastAccessedAt: string;
  }) => void;
}

export function ContactPortalLinkCard({
  contactId,
  contactName,
  companyName,
  initialToken = '',
  initialEnabled = true,
  lastAccessedAt = '',
  onUpdated,
}: ContactPortalLinkCardProps) {
  const [token, setToken] = useState(initialToken);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [lastSeen, setLastSeen] = useState(lastAccessedAt);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fullUrl = token ? `${origin}/portal/${token}` : '';

  const callManage = async (payload: { regenerate?: boolean; enabled?: boolean }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await manageContactPortalLinkApi(contactId, payload);
      setToken(res.portalToken);
      setEnabled(res.portalEnabled);
      setLastSeen(res.portalLastAccessedAt || '');
      onUpdated?.({
        portalToken: res.portalToken,
        portalEnabled: res.portalEnabled,
        portalLastAccessedAt: res.portalLastAccessedAt || '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-brand-navy flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0057FF]" />
            B2B Buyer / Dealer Self-Service Magic Portal
            {token && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {enabled ? 'Active' : 'Paused'}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Share one passwordless link with {companyName || contactName} to approve GST
            quotes, check Udhaar balance &amp; invoices, pay via UPI QR, and raise support tickets.
          </p>
        </div>

        {!token ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void callManage({ enabled: true })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span>Generate Magic Portal Link</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void callManage({ enabled: !enabled })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              {enabled ? <ShieldOff className="w-3.5 h-3.5 text-rose-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
              <span>{enabled ? 'Disable' : 'Re-Enable'}</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void callManage({ regenerate: true, enabled: true })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              title="Rotate secret portal token"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
              <span>Rotate Link</span>
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

      {token && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <code className="text-[11px] font-mono font-semibold text-slate-700 break-all flex-1">
            {fullUrl}
          </code>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <a
              href={`/portal/${token}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold"
            >
              <span>Open Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {lastSeen && (
        <p className="text-[11px] text-slate-400">
          Last viewed by buyer: {new Date(lastSeen).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}

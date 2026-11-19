'use client';

import { useState } from 'react';
import {
  PhoneCall,
  Copy,
  Check,
  MessageSquare,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  createCallShareLinkApi,
  type ShareCallLinkResponse,
} from '@/lib/calls-api';

interface ShareVoiceCallLinkButtonProps {
  entityType: 'lead' | 'deal' | 'ticket';
  entityId: string;
  recipientName?: string;
  recipientPhone?: string;
}

export default function ShareVoiceCallLinkButton({
  entityType,
  entityId,
  recipientName,
  recipientPhone,
}: ShareVoiceCallLinkButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ShareCallLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullUrl =
    result && typeof window !== 'undefined'
      ? `${window.location.origin}${result.urlPath}`
      : result?.urlPath || '';

  const copyToClipboard = (url: string) => {
    if (!url || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await createCallShareLinkApi({
        entityType,
        entityId,
        expiresInDays: 7,
      });
      setResult(res);
      const url =
        typeof window !== 'undefined'
          ? `${window.location.origin}${res.urlPath}`
          : res.urlPath;
      copyToClipboard(url);
    } catch {
      setError('Unable to create voice call link.');
    } finally {
      setGenerating(false);
    }
  };

  const rawDigits = (recipientPhone || result?.customerPhone || '').replace(
    /\D/g,
    '',
  );
  const waTarget = rawDigits
    ? rawDigits.startsWith('91') || rawDigits.length > 10
      ? rawDigits
      : `91${rawDigits}`
    : '';
  const waText = result
    ? `Namaste ${recipientName || result.customerName || 'ji'}, tap this secure link to speak directly with ${result.agent.name} at ${result.companyName} (free browser voice call): ${fullUrl}`
    : '';
  const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(waText)}`;

  if (!result) {
    return (
      <div className="inline-flex flex-col items-start">
        <button
          type="button"
          disabled={generating}
          onClick={() => void handleGenerate()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50"
          title="Generate a Click-to-Call link routed to the assigned agent"
        >
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PhoneCall className="w-3.5 h-3.5" />
          )}
          <span>Send Voice Call Link</span>
        </button>
        {error && (
          <span className="text-[10px] font-semibold text-rose-600 mt-1">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
      <button
        type="button"
        onClick={() => copyToClipboard(fullUrl)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copied Call Link</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Call Link</span>
          </>
        )}
      </button>

      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>WhatsApp Voice Link</span>
      </a>

      <a
        href={result.urlPath}
        target="_blank"
        rel="noreferrer"
        className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-white/70 dark:hover:bg-slate-800"
        title="Open Customer Voice Page"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

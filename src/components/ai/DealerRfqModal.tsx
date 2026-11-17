'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  PackageSearch,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Loader2,
  X,
} from 'lucide-react';
import {
  parseAiDealerRfqApi,
  type DealerRfqAiResult,
} from '@/lib/ai-copilot-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface DealerRfqModalProps {
  open: boolean;
  onClose: () => void;
  initialMessage?: string;
  dealerName?: string;
  companyName?: string;
  dealerCity?: string;
  dealerPhone?: string;
  onInsertReply?: (text: string) => void;
}

export default function DealerRfqModal({
  open,
  onClose,
  initialMessage = '',
  dealerName = '',
  companyName = '',
  dealerCity = '',
  dealerPhone = '',
  onInsertReply,
}: DealerRfqModalProps) {
  const tenant = useAuthStore((s) => s.tenant);
  const [message, setMessage] = useState(initialMessage);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DealerRfqAiResult | null>(null);
  const [providerMeta, setProviderMeta] = useState<{
    provider?: string;
    model?: string;
    tokensUsed?: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setMessage(initialMessage || '');
      setResult(null);
      setError(null);
      setProviderMeta(null);
    }
  }, [open, initialMessage]);

  if (!open) return null;

  const handleParse = async () => {
    if (!message.trim() || message.trim().length < 5) {
      setError('Paste a Hinglish or English WhatsApp buyer message first.');
      return;
    }
    setIsParsing(true);
    setError(null);
    try {
      const res = await parseAiDealerRfqApi({
        message: message.trim(),
        dealerName: dealerName || undefined,
        dealerCity: dealerCity || undefined,
        companyName: tenant?.name || companyName || undefined,
      });
      setResult(res.response?.structured || null);
      setProviderMeta(
        res.response
          ? {
              provider: res.response.provider,
              model: res.response.model,
              tokensUsed: res.response.tokensUsed,
            }
          : null,
      );
      if (!res.response) {
        setError('Leadsetu AI Gateway did not return a response.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsParsing(false);
    }
  };

  const handleUseReply = (text: string) => {
    if (onInsertReply) {
      onInsertReply(text);
    }
    onClose();
  };

  const urgencyBadge = (urgency?: DealerRfqAiResult['urgency']) => {
    if (urgency === 'urgent') {
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30';
    }
    if (urgency === 'normal') {
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30';
    }
    return 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15';
  };

  const quoteTitle = result?.lineItems?.length
    ? `${companyName || dealerName || 'Dealer'} — ${result.lineItems
        .slice(0, 3)
        .map((i) => `${i.quantity} ${i.unit} ${i.itemText}`)
        .join(', ')}`
    : `${companyName || dealerName || 'Dealer'} RFQ Quotation`;

  const quoteHref = `/quotations?client=${encodeURIComponent(
    companyName || dealerName || '',
  )}&contact=${encodeURIComponent(dealerName || '')}&phone=${encodeURIComponent(
    dealerPhone || '',
  )}&city=${encodeURIComponent(
    result?.deliveryCity || dealerCity || '',
  )}&title=${encodeURIComponent(quoteTitle.slice(0, 140))}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-blue/15 text-brand-blue border border-brand-blue/30 mb-1.5">
              <Sparkles className="w-3 h-3" /> Pillar 3 AI · WhatsApp Dealer RFQ Parser
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-white">
              Extract Multi-SKU Order Lines &amp; Instant Quote Reply
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dealerName || companyName
                ? `${dealerName}${companyName ? ` · ${companyName}` : ''}${dealerCity ? ` (${dealerCity})` : ''}`
                : 'Parse Hinglish WhatsApp dealer inquiries into clean SKU quantities, GST flag, and ready-to-send replies.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close RFQ Parser"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Incoming WhatsApp Buyer / Dealer Message
            </label>
          </div>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste messy Hinglish WhatsApp order request..."
            className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white outline-none focus:border-brand-blue"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              {providerMeta
                ? `Parsed via SetuAI Neural Core (${providerMeta.tokensUsed || 0} tokens)`
                : 'Detects SKU quantities, units, delivery city & 18% GST requirement'}
            </span>
            <button
              type="button"
              disabled={isParsing}
              onClick={handleParse}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white disabled:opacity-60"
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackageSearch className="w-4 h-4" />
              )}
              <span>{isParsing ? 'Parsing SKU Lines...' : 'Parse Dealer RFQ'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Classification Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  result.isRfq
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15'
                }`}
              >
                {result.isRfq ? 'Verified B2B RFQ' : 'General Inquiry'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${urgencyBadge(result.urgency)}`}
              >
                Urgency: {result.urgency}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-700 dark:text-slate-200">
                {result.gstInvoiceRequested
                  ? '18% GST Tax Invoice Requested'
                  : 'GST Billing TBD'}
              </span>
              {result.deliveryCity && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-brand-blue/30 bg-brand-blue/10 text-brand-blue">
                  Delivery: {result.deliveryCity}
                </span>
              )}
            </div>

            {/* Line Items Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#111D33] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                  Extracted Line Items ({result.lineItems.length})
                </span>
                <Link
                  href={quoteHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-brand-blue text-white hover:opacity-90"
                >
                  <FileText className="w-3.5 h-3.5" /> Create Proforma Quote
                </Link>
              </div>
              {result.lineItems.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/60 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-bold">#</th>
                      <th className="px-4 py-2 font-bold">Item / SKU Description</th>
                      <th className="px-4 py-2 font-bold text-right">Qty</th>
                      <th className="px-4 py-2 font-bold">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {result.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-brand-navy dark:text-white">
                          {item.itemText}
                        </td>
                        <td className="px-4 py-2.5 text-right font-extrabold text-brand-blue">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 uppercase text-slate-600 dark:text-slate-300 font-semibold">
                          {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-xs text-slate-400">
                  No explicit SKU quantities matched; ask buyer to confirm product specs below.
                </div>
              )}
            </div>

            {/* Missing Details */}
            {result.missingDetails.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="text-[11px] font-extrabold uppercase text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Missing Commercial Details
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingDetails.map((m, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-200"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ready Replies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  label: 'Suggested Hinglish Reply',
                  text: result.suggestedHinglishReply,
                },
                {
                  label: 'Suggested English Reply',
                  text: result.suggestedEnglishReply,
                },
              ].map((draft) => (
                <div
                  key={draft.label}
                  className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-[#111D33] p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {draft.label}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {draft.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseReply(draft.text)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-blue text-white hover:opacity-90"
                  >
                    <Send className="w-3.5 h-3.5" /> Insert into WhatsApp Composer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

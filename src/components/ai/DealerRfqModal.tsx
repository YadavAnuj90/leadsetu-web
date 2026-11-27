'use client';

import { useEffect, useRef, useState } from 'react';
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
  Mic,
  Square,
  Upload,
  Volume2,
  ShoppingCart,
} from 'lucide-react';
import {
  parseVoiceNoteToQuoteApi,
  type VoiceNoteRfqQuoteResult,
} from '@/lib/ai-copilot-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type { PrefilledCartLineInput } from '@/components/inbox/WhatsAppCartBuilderModal';

interface DealerRfqModalProps {
  open: boolean;
  onClose: () => void;
  initialMessage?: string;
  initialAudioUrl?: string;
  dealerName?: string;
  companyName?: string;
  dealerCity?: string;
  dealerPhone?: string;
  onInsertReply?: (text: string) => void;
  onBuildCartFromQuote?: (
    lines: PrefilledCartLineInput[],
    deliveryCity?: string | null,
  ) => void;
}

export default function DealerRfqModal({
  open,
  onClose,
  initialMessage = '',
  initialAudioUrl = '',
  dealerName = '',
  companyName = '',
  dealerCity = '',
  dealerPhone = '',
  onInsertReply,
  onBuildCartFromQuote,
}: DealerRfqModalProps) {
  const tenant = useAuthStore((s) => s.tenant);
  const [message, setMessage] = useState(initialMessage);
  const [audioDataUrl, setAudioDataUrl] = useState<string>('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceNoteRfqQuoteResult | null>(null);
  const [providerMeta, setProviderMeta] = useState<{
    provider?: string;
    model?: string;
    tokensUsed?: number;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      const cleanedInitial =
        initialMessage && initialMessage !== '[Voice Note received via WhatsApp]'
          ? initialMessage
          : '';
      setMessage(cleanedInitial);
      setAudioDataUrl('');
      setAudioPreviewUrl(
        initialAudioUrl && !initialAudioUrl.startsWith('meta-media://')
          ? initialAudioUrl
          : '',
      );
      setResult(null);
      setError(null);
      setProviderMeta(null);
      setIsRecording(false);
      setRecordingSec(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [open, initialMessage, initialAudioUrl]);

  // If opened directly from an inbound WhatsApp voice-note bubble, trigger automatic Whisper STT + quote match
  useEffect(() => {
    if (
      open &&
      initialAudioUrl &&
      !initialAudioUrl.startsWith('meta-media://')
    ) {
      void runParse({ audioUrl: initialAudioUrl });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialAudioUrl]);

  if (!open) return null;

  const runParse = async (override?: {
    audioUrl?: string;
    audioDataUrl?: string;
    transcript?: string;
  }) => {
    const useAudioDataUrl = override?.audioDataUrl ?? audioDataUrl;
    const useAudioUrl = override?.audioUrl ?? audioPreviewUrl;
    const useTranscript = override?.transcript ?? message.trim();

    if (!useAudioDataUrl && !useAudioUrl && useTranscript.length < 4) {
      setError(
        'Record a Hinglish voice note, upload buyer audio, or paste a WhatsApp message.',
      );
      return;
    }

    setIsParsing(true);
    setError(null);
    try {
      const res = await parseVoiceNoteToQuoteApi({
        ...(useAudioUrl ? { audioUrl: useAudioUrl } : {}),
        ...(useAudioDataUrl ? { audioDataUrl: useAudioDataUrl } : {}),
        ...(useTranscript ? { transcript: useTranscript } : {}),
        dealerName: dealerName || undefined,
        dealerCity: dealerCity || undefined,
        companyName: tenant?.name || companyName || undefined,
      });
      const structured = res.response?.structured || null;
      setResult(structured);
      if (structured?.transcript && !useTranscript) {
        setMessage(structured.transcript);
      }
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

  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore stop error
      }
      return;
    }

    setError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError('Microphone recording is unavailable in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAudioDataUrl(reader.result);
            setAudioPreviewUrl(reader.result);
            void runParse({ audioDataUrl: reader.result });
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSec(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    } catch {
      setError('Allow microphone permission or upload a buyer audio note.');
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('Audio file must be under 6 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAudioDataUrl(reader.result);
        setAudioPreviewUrl(reader.result);
        void runParse({ audioDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseReply = (text: string) => {
    if (onInsertReply) {
      onInsertReply(text);
    }
    onClose();
  };

  const handleOpenPrefilledCart = () => {
    if (!result || !onBuildCartFromQuote) return;
    const lines: PrefilledCartLineInput[] =
      result.matchedItems && result.matchedItems.length > 0
        ? result.matchedItems.map((m) => ({
            ...(m.matchedProductId ? { productId: m.matchedProductId } : {}),
            ...(m.matchedSku ? { sku: m.matchedSku } : {}),
            description: m.matchedName || m.itemText,
            hsnSac: m.hsnSac || '850440',
            quantity: Math.max(1, Number(m.quantity || 1)),
            unitPrice: Math.max(0, Number(m.unitPrice || 0)),
          }))
        : (result.lineItems || []).map((l) => ({
            description: l.itemText,
            hsnSac: '850440',
            quantity: Math.max(1, Number(l.quantity || 1)),
            unitPrice: 0,
          }));
    onBuildCartFromQuote(lines, result.deliveryCity || dealerCity || null);
    onClose();
  };

  const urgencyBadge = (urgency?: VoiceNoteRfqQuoteResult['urgency']) => {
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
  )}&amount=${encodeURIComponent(
    String(result?.estimatedGrandTotalInr || 0),
  )}&title=${encodeURIComponent(quoteTitle.slice(0, 140))}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 shadow-2xl p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-blue/15 text-brand-blue dark:text-sky-300 border border-brand-blue/30 mb-1.5">
              <Sparkles className="w-3 h-3" /> Phase 1 Moat · Hinglish Voice-Note → Auto Quote Builder
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-white">
              Voice Note / RFQ → /products SKU Match → 1-Click GST Quote
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dealerName || companyName
                ? `${dealerName}${companyName ? ` · ${companyName}` : ''}${dealerCity ? ` (${dealerCity})` : ''}`
                : 'Transcribe buyer Hinglish voice notes with Whisper STT, match catalog rates & launch instant UPI QR quote.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close Voice-to-Quote Builder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voice Note Capture + Text Area */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#081020] border border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={audioFileRef}
                type="file"
                accept="audio/*,.ogg,.mp3,.wav,.m4a,.webm"
                onChange={handleAudioFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isParsing}
                onClick={() => void handleToggleRecord()}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                    : 'bg-brand-navy dark:bg-brand-blue text-white hover:opacity-90'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Recording ({recordingSec}s)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Hinglish Voice Note</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isParsing}
                onClick={() => audioFileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue"
              >
                <Upload className="w-3.5 h-3.5 text-brand-blue" />
                <span>Upload Audio Note</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              Supports Whisper Hinglish STT (.ogg, .mp3, .wav, .m4a, .webm)
            </span>
          </div>

          {audioPreviewUrl && (
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-brand-blue/10 border border-blue-200 dark:border-brand-blue/30 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue dark:text-sky-300 shrink-0">
                <Volume2 className="w-4 h-4" />
                <span>Buyer Voice Audio:</span>
              </div>
              <audio
                controls
                src={audioPreviewUrl}
                className="h-9 flex-1 max-w-full"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transcript / WhatsApp Buyer Message (Hinglish or English)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='e.g. "Bhaiya 50 pcs Industrial Switchgear aur 20 box MCB panel Noida bhej do GST bill ke saath"'
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              {providerMeta
                ? `Processed via SetuAI (${result?.sttProvider || 'text'} · ${providerMeta.tokensUsed || 0} tokens)`
                : 'Auto-matches quantities & SKUs against your live /products price catalog'}
            </span>
            <button
              type="button"
              disabled={isParsing}
              onClick={() => void runParse()}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white disabled:opacity-60"
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackageSearch className="w-4 h-4" />
              )}
              <span>
                {isParsing ? 'Transcribing & Matching SKUs...' : 'Match SKUs & Build Quote'}
              </span>
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
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border border-violet-300 dark:border-violet-500/35 bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
                {result.languageDetected} · {result.sttProvider}
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
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-brand-blue/30 bg-brand-blue/10 text-brand-blue dark:text-sky-300">
                  Delivery: {result.deliveryCity}
                </span>
              )}
            </div>

            {/* Catalog-Matched SKU Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-[#111D33] border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                    Catalog-Matched Quote Lines ({result.matchedItems?.length || result.lineItems.length})
                  </span>
                  {result.estimatedGrandTotalInr > 0 && (
                    <span className="ml-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                      Est. Total incl. GST: ₹
                      {result.estimatedGrandTotalInr.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onBuildCartFromQuote && (
                    <button
                      type="button"
                      onClick={handleOpenPrefilledCart}
                      disabled={
                        (!result.matchedItems || result.matchedItems.length === 0) &&
                        result.lineItems.length === 0
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>1-Click Build Quote &amp; UPI QR</span>
                    </button>
                  )}
                  <Link
                    href={quoteHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-brand-blue/15 text-brand-blue dark:text-sky-300 border border-brand-blue/30 hover:bg-brand-blue hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5" /> Full Quote PDF
                  </Link>
                </div>
              </div>

              {result.matchedItems && result.matchedItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-2 font-bold">Requested Item</th>
                        <th className="px-4 py-2 font-bold">Matched /products SKU</th>
                        <th className="px-4 py-2 font-bold">HSN</th>
                        <th className="px-4 py-2 font-bold text-right">Qty</th>
                        <th className="px-4 py-2 font-bold text-right">Rate (₹)</th>
                        <th className="px-4 py-2 font-bold text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {result.matchedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-semibold text-brand-navy dark:text-white">
                            {item.itemText}
                          </td>
                          <td className="px-4 py-2.5">
                            {item.matchedName ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                                {item.matchedName}
                                {item.matchedSku ? ` (${item.matchedSku})` : ''}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 text-[11px]">
                                Custom Item (set rate in cart)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                            {item.hsnSac}
                          </td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-brand-blue dark:text-sky-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-brand-navy dark:text-white">
                            {item.unitPrice > 0
                              ? `₹${item.unitPrice.toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.lineTotal > 0
                              ? `₹${item.lineTotal.toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  label: 'Suggested Hinglish Quote Reply',
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
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue dark:text-sky-300 flex items-center gap-1">
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

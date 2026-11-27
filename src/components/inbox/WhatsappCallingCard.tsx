'use client';

import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  IndianRupee,
  Loader2,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  ShieldAlert,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { triggerWhatsappCallPostprocessApi } from '@/lib/whatsapp-calling-api';
import type { WhatsappCallLogItem } from '@/types/contracts';

export function isWhatsappCallingTimelineText(content?: string): boolean {
  const c = String(content || '').trim();
  return (
    c.startsWith('📞 [WhatsApp Call Permission') ||
    c.startsWith('✅ [WhatsApp Call Permission') ||
    c.startsWith('🚫 [WhatsApp Call Permission') ||
    c.startsWith('📞 [WhatsApp Voice Call')
  );
}

export function WhatsappPermissionTimelineCard({
  content,
  createdAt,
}: {
  content: string;
  createdAt: string;
}) {
  const isGranted = content.startsWith('✅');
  const isDeclined = content.startsWith('🚫');
  const isCallSummary = content.startsWith('📞 [WhatsApp Voice Call');

  const toneClass = isGranted
    ? 'border-emerald-300 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-200'
    : isDeclined
      ? 'border-rose-300 bg-rose-50/90 text-rose-900 dark:border-rose-500/35 dark:bg-rose-950/40 dark:text-rose-200'
      : isCallSummary
        ? 'border-blue-300 bg-blue-50/90 text-brand-navy dark:border-blue-500/35 dark:bg-blue-950/40 dark:text-blue-100'
        : 'border-amber-300 bg-amber-50/90 text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-200';

  return (
    <div className="flex justify-center my-1">
      <div
        className={`max-w-lg w-full sm:w-auto rounded-2xl border px-4 py-2.5 text-xs shadow-xs flex items-start gap-2.5 ${toneClass}`}
      >
        <div className="pt-0.5 shrink-0">
          {isGranted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          ) : isDeclined ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-300" />
          ) : (
            <PhoneCall className="w-4 h-4 text-brand-blue dark:text-blue-300" />
          )}
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="font-bold leading-snug break-words">{content}</div>
          <div className="text-[10px] opacity-75">
            {new Date(createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getSentimentBadgeClass(sentiment?: string): string {
  switch (String(sentiment || '').toLowerCase()) {
    case 'positive':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'cautious':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30';
    case 'negative':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/15';
  }
}

export function WhatsappCallLogsStrip({
  logs,
}: {
  logs: WhatsappCallLogItem[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, WhatsappCallLogItem>
  >({});

  if (!logs || logs.length === 0) return null;

  const handleSummarize = async (callId: string) => {
    setSummarizingId(callId);
    try {
      const updated = await triggerWhatsappCallPostprocessApi(callId);
      setLocalOverrides((prev) => ({ ...prev, [callId]: updated }));
    } catch {
      // Errors surface via socket / silent retry
    } finally {
      setSummarizingId(null);
    }
  };

  return (
    <div className="mx-3 sm:mx-5 mt-2 rounded-2xl bg-white dark:bg-[#111D33] border border-slate-200/90 dark:border-white/10 p-2.5 sm:p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
          <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
          WhatsApp Voice Call Logs ({logs.length})
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {logs.slice(0, 5).map((rawLog) => {
          const log = localOverrides[rawLog.id] || rawLog;
          const bant = log.bantUpdates || {};
          const bullets = Array.isArray(bant.summaryBullets) && bant.summaryBullets.length > 0
            ? bant.summaryBullets
            : log.aiSummary
              ? log.aiSummary
                  .split('\n')
                  .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
                  .filter(Boolean)
              : [];
          const isExpanded = expandedId === log.id;
          const isSummarizing = summarizingId === log.id;

          return (
            <div
              key={log.id}
              className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-2.5 text-xs space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-brand-navy dark:text-white">
                  {log.direction === 'inbound' ? (
                    <PhoneIncoming className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <PhoneOutgoing className="w-3.5 h-3.5 text-brand-blue" />
                  )}
                  <span className="capitalize">{log.direction}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10">
                    {log.status}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-300">
                    {log.displayPhone}
                  </span>
                  {bant.sentiment && (
                    <span
                      className={`text-[10px] font-bold capitalize px-1.5 py-0.5 rounded border ${getSentimentBadgeClass(
                        bant.sentiment,
                      )}`}
                    >
                      {bant.sentiment}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Clock className="w-3 h-3" /> {log.durationSeconds}s
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-300 font-bold">
                    <IndianRupee className="w-3 h-3" />
                    {log.direction === 'inbound'
                      ? '0.00 (Free)'
                      : `${log.costInr.toFixed(2)} (${log.billedPulses}p)`}
                  </span>
                  {log.status === 'completed' && (
                    <button
                      type="button"
                      disabled={isSummarizing}
                      onClick={() => void handleSummarize(log.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                      title="Transcribe audio via Whisper & extract Hinglish BANT summary"
                    >
                      {isSummarizing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{bullets.length > 0 ? 'Re-run AI' : 'AI Summary'}</span>
                    </button>
                  )}
                </div>
              </div>

              {log.recordingUrl && (
                <audio
                  controls
                  preload="none"
                  src={log.recordingUrl}
                  className="w-full h-8"
                />
              )}

              {bullets.length > 0 && (
                <div className="rounded-lg bg-white dark:bg-[#0D1628] px-3 py-2 border border-slate-200/70 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                      <Sparkles className="w-3 h-3" /> Hinglish AI Call Summary
                    </span>
                    {log.transcript && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : log.id)
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-blue dark:text-sky-300 hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Hide Transcript
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> View Transcript
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-200">
                    {bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>

                  {(bant.budget ||
                    bant.need ||
                    bant.timeline ||
                    bant.nextFollowUpDate) && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold">
                      {bant.budget && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          Budget: {bant.budget}
                        </span>
                      )}
                      {bant.need && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-brand-blue dark:text-blue-300">
                          Need: {bant.need}
                        </span>
                      )}
                      {bant.timeline && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                          Timeline: {bant.timeline}
                        </span>
                      )}
                      {bant.nextFollowUpDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                          <CalendarClock className="w-3 h-3" /> Follow-up:{' '}
                          {bant.nextFollowUpDate}
                        </span>
                      )}
                    </div>
                  )}

                  {isExpanded && log.transcript && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/70 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {log.transcript}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

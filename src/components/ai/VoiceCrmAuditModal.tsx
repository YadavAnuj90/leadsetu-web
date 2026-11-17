'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  UserPlus,
  FileCheck2,
  Loader2,
  X,
  PhoneCall,
} from 'lucide-react';
import {
  extractAiVoiceToCrmApi,
  auditAiCallApi,
  type VoiceToCrmAiResult,
  type CallAuditAiResult,
} from '@/lib/ai-copilot-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface VoiceCrmAuditModalProps {
  open: boolean;
  onClose: () => void;
  initialDealerName?: string;
  initialCompany?: string;
  initialPhone?: string;
  initialCity?: string;
  initialStage?: string;
  onLeadCreated?: () => Promise<void> | void;
  onActivitySaved?: (
    type: 'call' | 'note',
    description: string,
  ) => Promise<void> | void;
}

function computeDueIso(hint?: string): string {
  const d = new Date();
  const lower = (hint || '').toLowerCase();
  if (lower.includes('kal') || lower.includes('tomorrow')) {
    d.setDate(d.getDate() + 1);
  } else if (lower.includes('monday') || lower.includes('week')) {
    d.setDate(d.getDate() + 3);
  } else {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

export default function VoiceCrmAuditModal({
  open,
  onClose,
  initialDealerName = '',
  initialCompany = '',
  initialPhone = '',
  initialCity = '',
  initialStage = '',
  onLeadCreated,
  onActivitySaved,
}: VoiceCrmAuditModalProps) {
  const user = useAuthStore((s) => s.user);
  const [dealerOrCompany, setDealerOrCompany] = useState(
    initialCompany || initialDealerName || '',
  );
  const [cityHint, setCityHint] = useState(initialCity || '');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [isLoggingCall, setIsLoggingCall] = useState(false);

  const [extractResult, setExtractResult] = useState<VoiceToCrmAiResult | null>(
    null,
  );
  const [auditResult, setAuditResult] = useState<CallAuditAiResult | null>(
    null,
  );
  const [providerMeta, setProviderMeta] = useState<{
    provider?: string;
    model?: string;
    tokensUsed?: number;
  } | null>(null);

  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    setDealerOrCompany(initialCompany || initialDealerName || '');
    setCityHint(initialCity || '');
  }, [initialCompany, initialDealerName, initialCity, open]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      };
      setSpeechSupported(
        Boolean(win.SpeechRecognition || win.webkitSpeechRecognition),
      );
    }
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  if (!open) return null;

  const handleToggleMic = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore stop errors
      }
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const SpeechCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setError('Browser voice dictation is unavailable; paste or type notes.');
      return;
    }

    setError(null);
    const recognition = new SpeechCtor();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const pieces: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i]?.[0]?.transcript;
        if (chunk) pieces.push(chunk.trim());
      }
      if (pieces.length > 0) {
        setTranscript((prev) =>
          prev ? `${prev.trim()} ${pieces[pieces.length - 1]}` : pieces.join(' '),
        );
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim() || transcript.trim().length < 10) {
      setError('Please enter at least a short Hinglish or English call note.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setActionMsg(null);
    try {
      const [extRes, audRes] = await Promise.all([
        extractAiVoiceToCrmApi({
          transcript: transcript.trim(),
          repName: user?.name || 'Sales Rep',
          leadOrDealerName: dealerOrCompany.trim() || undefined,
          cityHint: cityHint.trim() || undefined,
        }),
        auditAiCallApi({
          transcript: transcript.trim(),
          repName: user?.name || 'Sales Rep',
          leadOrDealerName: dealerOrCompany.trim() || undefined,
          dealStage: initialStage || undefined,
        }),
      ]);

      setExtractResult(extRes.response?.structured || null);
      setAuditResult(audRes.response?.structured || null);
      const primaryResp = extRes.response || audRes.response;
      setProviderMeta(
        primaryResp
          ? {
              provider: primaryResp.provider,
              model: primaryResp.model,
              tokensUsed:
                (extRes.response?.tokensUsed || 0) +
                (audRes.response?.tokensUsed || 0),
            }
          : null,
      );
      if (!primaryResp) {
        setError('Leadsetu AI Gateway returned no response. Verify port 3002.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!extractResult?.nextTask?.title) return;
    setIsCreatingTask(true);
    setError(null);
    setActionMsg(null);
    try {
      await apiClient.post('/tasks', {
        title: extractResult.nextTask.title,
        description: `${extractResult.summary}\nDue hint: ${extractResult.nextTask.dueHint}`,
        priority: extractResult.nextTask.priority || 'high',
        category: 'call',
        dueDate: computeDueIso(extractResult.nextTask.dueHint),
        relatedName:
          initialDealerName || extractResult.leadUpdate?.buyerName || '',
        relatedCompany:
          dealerOrCompany || extractResult.leadUpdate?.buyerName || '',
        relatedPhone: initialPhone || '',
      });
      setActionMsg('Follow-up task added to CRM Tasks.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleLogToLead = async () => {
    if (!onActivitySaved || !extractResult) return;
    setIsLoggingCall(true);
    setError(null);
    setActionMsg(null);
    try {
      const auditTag = auditResult
        ? ` | QA Audit: ${auditResult.auditScore}/100 (${auditResult.verdict})`
        : '';
      const flagsTag =
        auditResult && auditResult.complianceFlags.length > 0
          ? ` | Compliance Flag: ${auditResult.complianceFlags.join('; ')}`
          : '';
      await onActivitySaved(
        'call',
        `[AI Voice-to-CRM] ${extractResult.summary}${auditTag}${flagsTag}`,
      );
      setActionMsg('Call summary & QA audit logged to Lead Timeline.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoggingCall(false);
    }
  };

  const handleCreateLead = async () => {
    if (!extractResult) return;
    setIsCreatingLead(true);
    setError(null);
    setActionMsg(null);
    try {
      const buyer =
        extractResult.leadUpdate?.buyerName ||
        dealerOrCompany.trim() ||
        'B2B Voice Inquiry';
      await apiClient.post('/leads', {
        name: buyer,
        company: dealerOrCompany.trim() || buyer,
        phone: initialPhone || undefined,
        city: extractResult.leadUpdate?.city || cityHint.trim() || 'Delhi-NCR',
        source: 'manual',
        status: 'qualified',
        estimatedValue: Number(extractResult.leadUpdate?.quotedValueInr || 0),
        tags: extractResult.leadUpdate?.productInterest?.slice(0, 4) || [],
        notes: `${extractResult.summary}${
          extractResult.leadUpdate?.paymentTerms
            ? ` | Terms: ${extractResult.leadUpdate.paymentTerms}`
            : ''
        }`,
      });
      setActionMsg(`Lead created for ${buyer}.`);
      await onLeadCreated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreatingLead(false);
    }
  };

  const verdictBadgeClass = (verdict?: CallAuditAiResult['verdict']) => {
    switch (verdict) {
      case 'EXCELLENT':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
      case 'GOOD':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30';
      case 'COMPLIANCE_FLAG':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30';
      default:
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-blue/15 text-brand-blue border border-brand-blue/30 mb-1.5">
              <Sparkles className="w-3 h-3" /> Pillar 2 AI · Hinglish Voice-to-CRM &amp; Call Audit
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-white">
              Extract Buyer Fields, Follow-Up Task &amp; Compliance Risks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak or paste Hinglish / Hindi / English sales call notes to auto-structure CRM updates and run QA audit.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context Inputs + Transcript */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Buyer / Dealer Name
              </label>
              <input
                type="text"
                value={dealerOrCompany}
                onChange={(e) => setDealerOrCompany(e.target.value)}
                placeholder="e.g. Bansal Hardware"
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                City / Cluster Hint
              </label>
              <input
                type="text"
                value={cityHint}
                onChange={(e) => setCityHint(e.target.value)}
                placeholder="e.g. Noida Sector 63"
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sales Call Transcript / Voice Note (Hinglish / English)
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                        : 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3 h-3" /> Stop Mic
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" /> Dictate (IN)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Aaj dealer se baat hui, 200 pcs MOQ chahiye ₹1,80,000 GST billing ke saath, kal 11 baje quote bhejna hai..."
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {providerMeta
                ? `Processed via SetuAI Neural Core (${providerMeta.tokensUsed || 0} tokens)`
                : 'Runs extraction & 5-point compliance audit in parallel'}
            </div>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyze}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white disabled:opacity-60"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PhoneCall className="w-4 h-4" />
              )}
              <span>
                {isAnalyzing ? 'Analyzing Call...' : 'Analyze Call & Audit QA'}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {actionMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Dual Result Panels */}
        {(extractResult || auditResult) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Left: Voice-to-CRM Structured Fields */}
            {extractResult && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50/70 dark:bg-[#111D33]/80 p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-brand-blue" /> Extracted CRM Fields
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-blue/15 text-brand-blue">
                      {extractResult.languageDetected}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                      {extractResult.sentiment}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {extractResult.summary}
                </p>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B1426] border border-slate-200/80 dark:border-white/10">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Buyer &amp; City
                    </div>
                    <div className="font-bold text-brand-navy dark:text-white mt-0.5">
                      {extractResult.leadUpdate?.buyerName || dealerOrCompany || '—'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {extractResult.leadUpdate?.city || cityHint || '—'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B1426] border border-slate-200/80 dark:border-white/10">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Value / MOQ / GST
                    </div>
                    <div className="font-bold text-brand-navy dark:text-white mt-0.5">
                      {extractResult.leadUpdate?.quotedValueInr
                        ? `₹${Number(extractResult.leadUpdate.quotedValueInr).toLocaleString('en-IN')}`
                        : 'Value TBD'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      MOQ: {extractResult.leadUpdate?.moqUnits ?? '—'} ·{' '}
                      {extractResult.leadUpdate?.gstIncluded
                        ? '18% GST Included'
                        : 'GST Extra / TBD'}
                    </div>
                  </div>
                </div>

                {extractResult.leadUpdate?.paymentTerms && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      Payment Terms:{' '}
                    </span>
                    {extractResult.leadUpdate.paymentTerms}
                  </div>
                )}

                {extractResult.commitments.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Commitments Captured
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {extractResult.commitments.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Task Box */}
                <div className="p-3 rounded-xl bg-brand-blue/10 border border-brand-blue/25 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                      Suggested Follow-up Task
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-blue/15 text-brand-blue">
                      {extractResult.nextTask.priority} · {extractResult.nextTask.dueHint}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-brand-navy dark:text-white">
                    {extractResult.nextTask.title}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isCreatingTask}
                      onClick={handleCreateTask}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-brand-blue text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {isCreatingTask ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CalendarPlus className="w-3 h-3" />
                      )}
                      <span>Create CRM Task</span>
                    </button>

                    {onActivitySaved ? (
                      <button
                        type="button"
                        disabled={isLoggingCall}
                        onClick={handleLogToLead}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {isLoggingCall ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <PhoneCall className="w-3 h-3" />
                        )}
                        <span>Log Call to Lead Timeline</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isCreatingLead}
                        onClick={handleCreateLead}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {isCreatingLead ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        <span>Create Lead from Call</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Right: Call QA & Compliance Audit */}
            {auditResult && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50/70 dark:bg-[#111D33]/80 p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white flex items-center gap-1.5">
                    {auditResult.complianceFlags.length > 0 ? (
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    )}
                    Call QA &amp; Compliance Audit
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-brand-navy dark:text-white">
                      {auditResult.auditScore}/100
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${verdictBadgeClass(auditResult.verdict)}`}
                    >
                      {auditResult.verdict.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Compliance Alert Box */}
                {auditResult.complianceFlags.length > 0 ? (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 space-y-1">
                    <div className="text-[11px] font-extrabold uppercase text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Compliance Risk Flagged
                    </div>
                    <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-200">
                      {auditResult.complianceFlags.map((flag, i) => (
                        <li key={i}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>No GST / kacha-bill compliance flags detected.</span>
                  </div>
                )}

                {/* 5-Point Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    ['Requirement Qualified', auditResult.checklist.requirementQualified],
                    ['Pricing & GST Anchored', auditResult.checklist.pricingAndGstAnchored],
                    ['Credit Terms Clarified', auditResult.checklist.creditTermsClarified],
                    ['Objection Addressed', auditResult.checklist.objectionAddressed],
                    ['Next Step Locked', auditResult.checklist.nextStepLocked],
                  ].map(([label, ok]) => (
                    <div
                      key={String(label)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                        ok
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200/60 dark:bg-white/5 border-slate-300/70 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      )}
                      <span className="font-semibold">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Coaching Tip */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-slate-700 dark:text-slate-200">
                  <span className="font-extrabold text-amber-700 dark:text-amber-300">
                    Rep Coaching Tip:{' '}
                  </span>
                  {auditResult.coachingTip}
                </div>

                {auditResult.missedChecks.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Missed Discovery / Follow-up Checks
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                      {auditResult.missedChecks.map((m, idx) => (
                        <li key={idx}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Loader2,
  Database,
  Bot,
  User,
} from 'lucide-react';
import { askAiCopilotChatApi } from '@/lib/ai-copilot-api';
import { getErrorMessage } from '@/lib/api-client';

interface AskAiCopilotDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Array<{ entityType: string; entityId: string; excerpt: string }>;
  meta?: string;
}

const STARTER_PROMPTS = [
  'Which buyers or invoices have overdue Udhaar balances right now?',
  'Summarize our top leads and open deal pipeline in Delhi-NCR',
  'What high-priority follow-up tasks are pending today?',
];

export default function AskAiCopilotDrawer({
  open,
  onClose,
}: AskAiCopilotDrawerProps) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  if (!open) return null;

  const submitQuestion = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError(null);
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setTurns((prev) => [...prev, userTurn]);
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await askAiCopilotChatApi({ question: trimmed });
      const env = res.response;
      if (!env) {
        setError('Leadsetu AI Gateway returned no answer.');
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          id: env.requestId || `a-${Date.now()}`,
          role: 'assistant',
          text: env.result,
          sources: env.sources || [],
          meta: `${env.provider || 'ai'} · ${env.model} · ${env.tokensUsed} tokens (${env.durationMs}ms)`,
        },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitQuestion(question);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg h-full bg-white dark:bg-[#0D1628] border-l border-slate-200 dark:border-white/15 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-brand-blue text-white flex items-center justify-center shadow-md shadow-brand-blue/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                Ask Leadsetu AI Copilot
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3 text-brand-blue" /> Tenant-isolated RAG over live leads, deals, invoices &amp; tasks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close Ask AI Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {turns.length === 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ask anything about your company&apos;s CRM workspace — answers are grounded strictly in your tenant&apos;s live records and cite exact entity IDs.
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Workspace Questions
                </div>
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitQuestion(prompt)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/12 bg-white dark:bg-[#111D33]/70 text-brand-navy dark:text-slate-200 hover:border-brand-blue transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex gap-2.5 ${
                turn.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {turn.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-brand-blue/15 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs space-y-2 ${
                  turn.role === 'user'
                    ? 'bg-brand-blue text-white font-semibold'
                    : 'bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/12 text-slate-800 dark:text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{turn.text}</p>

                {turn.sources && turn.sources.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/70 dark:border-white/10 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-brand-blue">
                      Grounded Records Cited
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {turn.sources.map((src, i) => (
                        <span
                          key={i}
                          title={src.excerpt}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
                        >
                          {src.entityType}#{src.entityId.slice(-6)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {turn.meta && (
                  <div className="text-[10px] text-slate-400">{turn.meta}</div>
                )}
              </div>
              {turn.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isAsking && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              <span>Searching tenant records &amp; generating grounded answer...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about overdue Udhaar, pipeline deals, leads..."
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-900 dark:text-white outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="btn-primary-brand px-4 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Ask
          </button>
        </form>
      </div>
    </div>
  );
}

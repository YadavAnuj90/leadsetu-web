'use client';

import { useState, FormEvent } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface MessageComposerProps {
  aiSuggestedReply?: string;
  isSending?: boolean;
  onSend: (content: string, isAiDrafted?: boolean) => Promise<void>;
}

const quickTemplates = [
  'Namaste! Sharing our 18% GST proforma quotation & bulk price list right away.',
  'Can we schedule a quick 5-minute discovery call today at 3:00 PM?',
  'Here is our verified Razorpay link for the 50% booking advance.',
];

export default function MessageComposer({
  aiSuggestedReply,
  isSending = false,
  onSend,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [usedAi, setUsedAi] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onSend(text.trim(), usedAi);
    setText('');
    setUsedAi(false);
  };

  const applyAiDraft = (draft: string) => {
    setText(draft);
    setUsedAi(true);
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200/80 space-y-3">
      {/* Gemini AI Suggested Reply Banner */}
      {aiSuggestedReply && (
        <div className="p-3 rounded-2xl bg-brand-light/80 border border-brand-blue/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2 text-xs text-brand-navy">
            <Sparkles className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-brand-blue">Gemini AI Draft: </span>
              <span>{aiSuggestedReply}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => applyAiDraft(aiSuggestedReply)}
            className="px-3 py-1.5 rounded-xl bg-brand-blue text-white text-[11px] font-bold whitespace-nowrap hover:bg-brand-navy transition-colors"
          >
            Use AI Reply
          </button>
        </div>
      )}

      {/* Quick Hinglish / SME Templates */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {quickTemplates.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyAiDraft(tpl)}
            className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-brand-light hover:text-brand-blue whitespace-nowrap transition-colors"
          >
            ⚡ {tpl.slice(0, 48)}...
          </button>
        ))}
      </div>

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a WhatsApp reply in English or Hinglish..."
          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-brand-navy focus:outline-none focus:bg-white focus:border-brand-blue"
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          className="btn-primary-brand px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

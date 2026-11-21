'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AskAiCopilotDrawer from './AskAiCopilotDrawer';

export default function AIAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-navy to-brand-blue text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
      >
        <Sparkles className="w-3.5 h-3.5" /> Ask SetuAI Copilot
      </button>
      <AskAiCopilotDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

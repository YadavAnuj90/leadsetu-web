'use client';

import { PhoneIncoming, PhoneOff, ShieldCheck } from 'lucide-react';
import type { IncomingWhatsappCallEvent } from '@/types/contracts';

interface IncomingWhatsappCallModalProps {
  incomingCall: IncomingWhatsappCallEvent | null;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingWhatsappCallModal({
  incomingCall,
  onAccept,
  onReject,
}: IncomingWhatsappCallModalProps) {
  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D1628] text-white border border-emerald-400/40 shadow-2xl p-6 space-y-5 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 animate-pulse">
          <PhoneIncoming className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
            Incoming WhatsApp Call
          </div>
          <h3 className="text-lg font-extrabold text-white pt-1">
            {incomingCall.callerName}
          </h3>
          <p className="text-xs text-slate-300">
            {incomingCall.company ? `${incomingCall.company} · ` : ''}
            <span className="font-mono">{incomingCall.maskedPhone}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-emerald-200 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Free Inbound · Auto-grants 7-day Callback Permission</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white transition-colors"
          >
            <PhoneOff className="w-4 h-4" /> Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-extrabold text-white shadow-sm transition-colors"
          >
            <PhoneIncoming className="w-4 h-4" /> Accept Call
          </button>
        </div>
      </div>
    </div>
  );
}

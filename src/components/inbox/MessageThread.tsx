'use client';

import {
  Phone,
  CheckCircle2,
  Sparkles,
  CheckCheck,
  ExternalLink,
  Mic,
  PackageSearch,
} from 'lucide-react';
import type { Conversation } from '@/types/contracts';

interface MessageThreadProps {
  conversation: Conversation;
  onToggleStatus: (id: string, nextStatus: 'open' | 'resolved') => void;
  onOpenVoiceAudit?: () => void;
  onOpenRfqParser?: () => void;
}

export default function MessageThread({
  conversation,
  onToggleStatus,
  onOpenVoiceAudit,
  onOpenRfqParser,
}: MessageThreadProps) {
  const cleanPhone = (conversation.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FC] dark:bg-[#081020] overflow-hidden">
      {/* Top Thread Header */}
      <div className="px-6 py-3.5 bg-white dark:bg-[#0D1628] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
            }}
          >
            {conversation.contactName[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-brand-navy dark:text-white">
                {conversation.contactName}
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                {conversation.channel}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {conversation.company} · {conversation.phone} · {conversation.city}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenRfqParser && (
            <button
              type="button"
              onClick={onOpenRfqParser}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-indigo-400/35 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
              title="Parse WhatsApp Dealer RFQ SKUs & Draft Reply"
            >
              <PackageSearch className="w-3.5 h-3.5" /> Parse RFQ AI
            </button>
          )}
          {onOpenVoiceAudit && (
            <button
              type="button"
              onClick={onOpenVoiceAudit}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-brand-blue/30 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
              title="Analyze Hinglish Call Notes & QA Audit"
            >
              <Mic className="w-3.5 h-3.5" /> Call Audit AI
            </button>
          )}
          {cleanPhone && (
            <a
              href={`https://wa.me/${
                cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
              }`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
            >
              <ExternalLink className="w-3.5 h-3.5" /> WhatsApp Web
            </a>
          )}
          {conversation.phone && (
            <a
              href={`tel:${conversation.phone}`}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-blue hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
              title="Call Buyer"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() =>
              onToggleStatus(
                conversation.id,
                conversation.status === 'open' ? 'resolved' : 'open'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              conversation.status === 'resolved'
                ? 'bg-emerald-500 text-white'
                : 'border border-slate-200 text-slate-700 hover:border-brand-blue dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {conversation.status === 'resolved'
                ? 'Resolved ✓'
                : 'Mark Resolved'}
            </span>
          </button>
        </div>
      </div>

      {/* SetuAI Context Banner */}
      {conversation.aiSummary && (
        <div
          className="px-6 py-2.5 text-xs text-white flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(90deg, #17243A 0%, #243B61 100%)',
          }}
        >
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-brand-sky flex-shrink-0" />
            <span className="font-semibold text-brand-sky">SetuAI Summary:</span>
            <span className="text-slate-200 truncate">{conversation.aiSummary}</span>
          </div>
          <span className="font-extrabold text-emerald-400 whitespace-nowrap">
            Est. ₹{(conversation.estimatedValue || 0).toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {(conversation.messages || []).map((msg) => {
          const isOutbound = msg.direction === 'outbound';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isOutbound ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-lg rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isOutbound
                    ? 'bg-brand-blue text-white rounded-tr-sm'
                    : 'bg-white text-brand-navy border border-slate-200/80 rounded-tl-sm dark:bg-[#111D33] dark:text-slate-100 dark:border-white/10'
                }`}
              >
                {msg.isAiDrafted && (
                  <div className="text-[10px] font-bold text-blue-100 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> SetuAI Smart Reply
                  </div>
                )}
                <div>{msg.content}</div>
                <div
                  className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                    isOutbound ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isOutbound && <CheckCheck className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import {
  Phone,
  CheckCircle2,
  Sparkles,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import type { Conversation } from '@/types/contracts';

interface MessageThreadProps {
  conversation: Conversation;
  onToggleStatus: (id: string, nextStatus: 'open' | 'resolved') => void;
}

export default function MessageThread({
  conversation,
  onToggleStatus,
}: MessageThreadProps) {
  const cleanPhone = (conversation.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FC] overflow-hidden">
      {/* Top Thread Header */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4">
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
              <h3 className="font-extrabold text-sm text-brand-navy">
                {conversation.contactName}
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {conversation.channel}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {conversation.company} · {conversation.phone} · {conversation.city}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cleanPhone && (
            <a
              href={`https://wa.me/${
                cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
              }`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <ExternalLink className="w-3.5 h-3.5" /> WhatsApp Web
            </a>
          )}
          {conversation.phone && (
            <a
              href={`tel:${conversation.phone}`}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-blue hover:bg-slate-50"
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
                : 'border border-slate-200 text-slate-700 hover:border-brand-blue'
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

      {/* Gemini AI Context Banner */}
      {conversation.aiSummary && (
        <div
          className="px-6 py-2.5 text-xs text-white flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(90deg, #17243A 0%, #243B61 100%)',
          }}
        >
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-brand-sky flex-shrink-0" />
            <span className="font-semibold text-brand-sky">Gemini AI Summary:</span>
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
                    : 'bg-white text-brand-navy border border-slate-200/80 rounded-tl-sm'
                }`}
              >
                {msg.isAiDrafted && (
                  <div className="text-[10px] font-bold text-blue-100 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini AI Smart Reply
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

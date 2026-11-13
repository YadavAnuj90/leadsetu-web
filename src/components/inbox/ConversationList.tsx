'use client';

import { Search, Sparkles } from 'lucide-react';
import type { Conversation } from '@/types/contracts';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: 'all' | 'open' | 'resolved';
  onStatusFilterChange: (val: 'all' | 'open' | 'resolved') => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ConversationListProps) {
  return (
    <div className="h-full flex flex-col border-r border-slate-200/80 bg-white">
      {/* Top Filter & Search */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-brand-navy">
            WhatsApp &amp; AI Inbox
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {conversations.length} Threads
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search buyer or company..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy focus:outline-none focus:bg-white focus:border-brand-blue"
          />
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'open', 'resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-brand-navy shadow-sm'
                  : 'text-slate-500 hover:text-brand-navy'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {conversations.map((conv) => {
          const isSelected = conv.id === activeId;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                isSelected
                  ? 'bg-brand-light/70 border-l-4 border-brand-blue'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0"
                style={{
                  background:
                    conv.channel === 'whatsapp'
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
                }}
              >
                {conv.contactName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs sm:text-sm text-brand-navy truncate">
                    {conv.contactName}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex items-center gap-0.5 flex-shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> {conv.aiScore}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  {conv.company} · {conv.city}
                </div>

                <p className="text-xs text-slate-600 truncate mt-1.5">
                  {conv.lastMessage || 'No messages yet'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

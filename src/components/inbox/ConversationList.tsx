'use client';

import { Plus, Search, Settings2, Sparkles } from 'lucide-react';
import type { Conversation } from '@/types/contracts';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: 'all' | 'open' | 'resolved';
  onStatusFilterChange: (val: 'all' | 'open' | 'resolved') => void;
  onNewConversation: () => void;
  onOpenTemplates: () => void;
  isLiveConnected?: boolean;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onNewConversation,
  onOpenTemplates,
  isLiveConnected,
}: ConversationListProps) {
  return (
    <div className="h-full flex flex-col border-r border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0D1628]">
      {/* Top Filter & Search */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-extrabold text-base text-brand-navy dark:text-slate-100 truncate">
              WhatsApp &amp; AI Inbox
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">
                {conversations.length} Threads
              </span>
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Push
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenTemplates}
              title="Manage WhatsApp Templates"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-[11px] font-bold text-slate-600 dark:text-slate-200 hover:border-brand-blue hover:text-brand-blue"
            >
              <Settings2 className="w-3.5 h-3.5" /> Templates
            </button>
            <button
              type="button"
              onClick={onNewConversation}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search buyer, company, or CRM link..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy dark:bg-[#111D33] dark:border-white/10 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-[#152440] focus:border-brand-blue"
          />
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#081020] p-1 rounded-xl border border-slate-200/70 dark:border-white/10">
          {(['all', 'open', 'resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-brand-navy shadow-sm dark:bg-[#1B2B4B] dark:text-white'
                  : 'text-slate-600 hover:text-brand-navy dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10">
        {conversations.map((conv) => {
          const isSelected = conv.id === activeId;
          const unread = conv.unreadCount || 0;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                isSelected
                  ? 'bg-brand-light/70 dark:bg-brand-blue/20 border-l-4 border-brand-blue'
                  : 'hover:bg-slate-50 dark:hover:bg-white/5'
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
                  <span className="font-bold text-xs sm:text-sm text-brand-navy dark:text-white truncate">
                    {conv.contactName}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                        {unread}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> {conv.aiScore}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  <span className="truncate">
                    {conv.company || 'Individual'} · {conv.city}
                  </span>
                  {conv.linkedEntityType && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-brand-blue dark:text-blue-300 text-[9px] font-extrabold uppercase shrink-0">
                      {conv.linkedEntityType}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-1.5">
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

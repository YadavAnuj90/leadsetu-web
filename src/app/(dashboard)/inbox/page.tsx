'use client';

import { MessageSquare, Database, Loader2 } from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import ConversationList from '@/components/inbox/ConversationList';
import MessageThread from '@/components/inbox/MessageThread';
import MessageComposer from '@/components/inbox/MessageComposer';

export default function InboxPage() {
  const {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    isLoading,
    isSending,
    sendMessage,
    toggleStatus,
    seedInbox,
  } = useInbox();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] bg-white rounded-3xl border border-slate-200/80 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-[calc(100vh-7rem)] bg-white rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-brand-navy">
          Your Unified WhatsApp &amp; IndiaMART Inbox is Empty
        </h2>
        <p className="text-sm text-slate-500 max-w-md">
          Load 3 realistic Delhi-NCR buyer conversations (Hinglish + English) with Gemini AI
          smart reply suggestions to test the inbox immediately.
        </p>
        <button
          type="button"
          onClick={seedInbox}
          disabled={isSending}
          className="btn-primary-brand px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          <span>Load 3 Sample WhatsApp Conversations</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 h-full overflow-hidden">
        <ConversationList
          conversations={conversations}
          activeId={activeConversation?.id || activeId}
          onSelect={setActiveId}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            <MessageThread
              conversation={activeConversation}
              onToggleStatus={toggleStatus}
            />
            <MessageComposer
              aiSuggestedReply={activeConversation.aiSuggestedReply}
              isSending={isSending}
              onSend={sendMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { useAuthStore } from '@/store/auth.store';
import { isFeatureEnabled } from '@/lib/feature-access';
import ConversationList from '@/components/inbox/ConversationList';
import MessageThread from '@/components/inbox/MessageThread';
import MessageComposer from '@/components/inbox/MessageComposer';
import VoiceCrmAuditModal from '@/components/ai/VoiceCrmAuditModal';
import DealerRfqModal from '@/components/ai/DealerRfqModal';

export default function InboxPage() {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const baseAiEnabled = isFeatureEnabled(tenant, 'aiScoring', user);
  const canUseVoiceCrm = baseAiEnabled && isFeatureEnabled(tenant, 'aiVoiceCrm', user);
  const canUseDealerDesk = baseAiEnabled && isFeatureEnabled(tenant, 'aiDealerDesk', user);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<{
    text: string;
    seq: number;
  } | null>(null);
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
          Incoming buyer messages from your connected WhatsApp Business Cloud, IndiaMART, and
          website webhooks will appear here automatically.
        </p>
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
              onOpenVoiceAudit={
                canUseVoiceCrm ? () => setVoiceModalOpen(true) : undefined
              }
              onOpenRfqParser={
                canUseDealerDesk ? () => setRfqModalOpen(true) : undefined
              }
            />
            <MessageComposer
              aiSuggestedReply={activeConversation.aiSuggestedReply}
              isSending={isSending}
              externalDraft={composerDraft}
              onSend={sendMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Select a conversation to view messages
          </div>
        )}
      </div>

      <VoiceCrmAuditModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        initialDealerName={activeConversation?.contactName}
        initialCompany={activeConversation?.company}
        initialPhone={activeConversation?.phone}
        initialCity={activeConversation?.city}
      />

      <DealerRfqModal
        open={rfqModalOpen}
        onClose={() => setRfqModalOpen(false)}
        initialMessage={
          [...(activeConversation?.messages || [])]
            .reverse()
            .find((m) => m.direction === 'inbound')?.content ||
          activeConversation?.lastMessage ||
          ''
        }
        dealerName={activeConversation?.contactName}
        companyName={activeConversation?.company}
        dealerCity={activeConversation?.city}
        dealerPhone={activeConversation?.phone}
        onInsertReply={(text) => setComposerDraft({ text, seq: Date.now() })}
      />
    </div>
  );
}

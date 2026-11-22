'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MessageSquare, Plus, Settings2 } from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { useAuthStore } from '@/store/auth.store';
import { useWhatsAppUiStore } from '@/store/whatsapp-ui.store';
import { isFeatureEnabled } from '@/lib/feature-access';
import ConversationList from '@/components/inbox/ConversationList';
import MessageThread from '@/components/inbox/MessageThread';
import MessageComposer from '@/components/inbox/MessageComposer';
import StartConversationModal from '@/components/inbox/StartConversationModal';
import LinkCrmEntityModal from '@/components/inbox/LinkCrmEntityModal';
import WhatsAppTemplateManagerModal from '@/components/inbox/WhatsAppTemplateManagerModal';
import VoiceCrmAuditModal from '@/components/ai/VoiceCrmAuditModal';
import DealerRfqModal from '@/components/ai/DealerRfqModal';
import { AiConciergeModal } from '@/components/inbox/AiConciergeModal';

function InboxPageContent() {
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');

  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const {
    templateManagerOpen,
    openTemplateManager,
    closeTemplateManager,
  } = useWhatsAppUiStore();

  const baseAiEnabled = isFeatureEnabled(tenant, 'aiScoring', user);
  const canUseVoiceCrm =
    baseAiEnabled && isFeatureEnabled(tenant, 'aiVoiceCrm', user);
  const canUseDealerDesk =
    baseAiEnabled && isFeatureEnabled(tenant, 'aiDealerDesk', user);

  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [conciergeModalOpen, setConciergeModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<{
    text: string;
    seq: number;
    templateId?: string;
    isAiDrafted?: boolean;
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
    isGeneratingAi,
    isLiveConnected,
    waCloudConfig,
    metaTemplates,
    aiAgentPolicy,
    setAiAgentPolicy,
    sendMessage,
    generateAiAssist,
    toggleStatus,
    toggleAutopilot,
    simulateInbound,
    linkEntity,
    upsertAndSelectConversation,
  } = useInbox(threadParam);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <>
      {conversations.length === 0 ? (
        <div className="h-[calc(100vh-7rem)] bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">
            Your Unified WhatsApp &amp; IndiaMART Inbox is Ready
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Start a WhatsApp conversation linked to any Lead, Contact, Deal, or
            Ticket, or customize your reusable Hinglish &amp; English templates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStartModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Start New Conversation
            </button>
            <button
              type="button"
              onClick={openTemplateManager}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue"
            >
              <Settings2 className="w-4 h-4 text-brand-blue" /> Manage Templates
            </button>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-7rem)] bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-4 h-full overflow-hidden">
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?.id || activeId}
              onSelect={setActiveId}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onNewConversation={() => setStartModalOpen(true)}
              onOpenTemplates={openTemplateManager}
              isLiveConnected={isLiveConnected}
            />
          </div>

          <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
            {activeConversation ? (
              <>
                <MessageThread
                  conversation={activeConversation}
                  onToggleStatus={toggleStatus}
                  onOpenLinkModal={() => setLinkModalOpen(true)}
                  onRefreshAiSummary={() => {
                    void generateAiAssist(activeConversation.id, {
                      mode: 'both',
                      language: 'hinglish',
                    });
                  }}
                  isGeneratingAi={isGeneratingAi}
                  aiAgentMode={aiAgentPolicy?.mode || 'draft_only'}
                  onOpenAiConcierge={() => setConciergeModalOpen(true)}
                  onToggleAutopilot={toggleAutopilot}
                  onOpenVoiceAudit={
                    canUseVoiceCrm ? () => setVoiceModalOpen(true) : undefined
                  }
                  onOpenRfqParser={
                    canUseDealerDesk ? () => setRfqModalOpen(true) : undefined
                  }
                />
                <MessageComposer
                  conversation={activeConversation}
                  agentName={user?.name}
                  aiSuggestedReply={activeConversation.aiSuggestedReply}
                  isSending={isSending}
                  isGeneratingAi={isGeneratingAi}
                  externalDraft={composerDraft}
                  waCloudConfig={waCloudConfig}
                  metaTemplates={metaTemplates}
                  onOpenTemplateManager={openTemplateManager}
                  onGenerateAiDraft={async ({ language, tone }) => {
                    const res = await generateAiAssist(activeConversation.id, {
                      mode: 'both',
                      language,
                      tone,
                    });
                    if (res?.aiSuggestedReply) {
                      setComposerDraft({
                        text: res.aiSuggestedReply,
                        seq: Date.now(),
                        isAiDrafted: true,
                      });
                    }
                  }}
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
      )}

      <StartConversationModal
        open={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        onCreated={upsertAndSelectConversation}
      />

      <LinkCrmEntityModal
        open={linkModalOpen}
        conversation={activeConversation}
        onClose={() => setLinkModalOpen(false)}
        onLink={async (linkedEntityType, linkedEntityId) => {
          if (!activeConversation) return;
          await linkEntity(
            activeConversation.id,
            linkedEntityType,
            linkedEntityId,
          );
        }}
      />

      <WhatsAppTemplateManagerModal
        open={templateManagerOpen}
        onClose={closeTemplateManager}
        previewContext={
          activeConversation
            ? {
                buyerName: activeConversation.contactName,
                company: activeConversation.company,
                dealValue: activeConversation.estimatedValue,
                city: activeConversation.city,
                phone: activeConversation.phone,
                agentName: user?.name || 'Sales Team',
              }
            : undefined
        }
        onSelectTemplate={(tpl) =>
          setComposerDraft({
            text: tpl.body,
            seq: Date.now(),
            templateId: tpl.id,
            isAiDrafted: false,
          })
        }
      />

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

      <AiConciergeModal
        open={conciergeModalOpen}
        onClose={() => setConciergeModalOpen(false)}
        activeThreadId={activeConversation?.id}
        activeThreadName={activeConversation?.contactName}
        onPolicyUpdated={(policy) => setAiAgentPolicy(policy)}
        onSimulateInbound={
          activeConversation
            ? async (message) => {
                await simulateInbound(activeConversation.id, message);
              }
            : undefined
        }
      />
    </>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-7rem)] bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  );
}

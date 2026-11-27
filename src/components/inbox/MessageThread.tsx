'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Mic,
  PackageSearch,
  PauseCircle,
  Phone,
  PlayCircle,
  Sparkles,
  Wrench,
} from 'lucide-react';
import AISummaryCard from '@/components/ai/AISummaryCard';
import {
  WhatsappCallLogsStrip,
  WhatsappPermissionTimelineCard,
  isWhatsappCallingTimelineText,
} from '@/components/inbox/WhatsappCallingCard';
import { buildWhatsAppMeUrl } from '@/lib/whatsapp-templates';
import type {
  Conversation,
  LinkedCrmEntityType,
  WhatsappCallLogItem,
  WhatsappCallPermissionState,
  WhatsappCallingWalletSummary,
} from '@/types/contracts';

interface MessageThreadProps {
  conversation: Conversation;
  onBackToList?: () => void;
  onToggleStatus: (id: string, nextStatus: 'open' | 'resolved') => void;
  onOpenLinkModal: () => void;
  onOpenVoiceAudit?: () => void;
  onOpenRfqParser?: () => void;
  onOpenVoiceNoteQuote?: (audioUrl?: string, fallbackText?: string) => void;
  onRefreshAiSummary?: () => void;
  isGeneratingAi?: boolean;
  aiAgentMode?: 'autopilot' | 'draft_only' | 'off';
  onOpenAiConcierge?: () => void;
  onToggleAutopilot?: (id: string, paused: boolean) => void;
  whatsappPermission?: WhatsappCallPermissionState | null;
  whatsappPermissionLoading?: boolean;
  requestingWhatsappPermission?: boolean;
  whatsappWallet?: WhatsappCallingWalletSummary | null;
  whatsappCallLogs?: WhatsappCallLogItem[];
  isWhatsappCallActive?: boolean;
  whatsappCallError?: string | null;
  onRequestWhatsappPermission?: () => void;
  onStartWhatsappCall?: () => void;
  onDismissWhatsappCallError?: () => void;
}

function getEntityHref(type?: LinkedCrmEntityType, id?: string): string {
  if (!type || !id) return '#';
  if (type === 'lead') return `/leads/${id}`;
  if (type === 'contact') return `/contacts/${id}`;
  if (type === 'deal') return `/deals/${id}`;
  if (type === 'ticket') return '/tickets';
  return '#';
}

export default function MessageThread({
  conversation,
  onBackToList,
  onToggleStatus,
  onOpenLinkModal,
  onOpenVoiceAudit,
  onOpenRfqParser,
  onOpenVoiceNoteQuote,
  onRefreshAiSummary,
  isGeneratingAi = false,
  aiAgentMode = 'draft_only',
  onOpenAiConcierge,
  onToggleAutopilot,
  whatsappPermission,
  whatsappPermissionLoading = false,
  requestingWhatsappPermission = false,
  whatsappWallet,
  whatsappCallLogs = [],
  isWhatsappCallActive = false,
  whatsappCallError,
  onRequestWhatsappPermission,
  onStartWhatsappCall,
  onDismissWhatsappCallError,
}: MessageThreadProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [toolsOpen]);

  const waUrl = buildWhatsAppMeUrl(conversation.phone);
  const hasLinkedLead =
    conversation.linkedEntityType === 'lead' &&
    Boolean(conversation.linkedEntityId);
  const istOpen = whatsappPermission?.istWindow?.isWithinHours ?? true;
  const hasMinCallBalance = whatsappWallet?.hasMinimumBalance ?? true;
  const canRequestPerm =
    istOpen &&
    (whatsappPermission ? whatsappPermission.canRequestPermission : true);
  const requestDisabledTooltip = !istOpen
    ? 'WhatsApp calling & permission requests are only allowed between 09:00 and 21:00 IST.'
    : whatsappPermission && !whatsappPermission.canRequestPermission
      ? 'Meta 24h/7d permission request limit reached (max 1/24h, 2/7d).'
      : 'Send Meta WhatsApp Call Permission Request';

  const hasSecondaryTools = Boolean(
    onOpenAiConcierge ||
      onRefreshAiSummary ||
      onOpenRfqParser ||
      onOpenVoiceAudit ||
      waUrl ||
      (conversation.phone && !conversation.phone.includes('*')),
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7FC] dark:bg-[#081020] overflow-hidden">
      {/* Clean Single-Row Top Thread Header */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-white dark:bg-[#0D1628] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back (mobile/tablet) + Buyer Identity & CRM / Calling Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
              aria-label="Back to conversation list"
              title="Back to Conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-sm text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
            }}
          >
            {conversation.contactName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm text-brand-navy dark:text-white truncate">
                {conversation.contactName}
              </h3>
              <span className="hidden sm:inline-flex shrink-0 text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                {conversation.channel}
              </span>
              {(conversation.adPlatform === 'meta_ctwa' ||
                Boolean(conversation.ctwaClid) ||
                Boolean(conversation.adId)) && (
                <span
                  title={
                    conversation.ctwaClid
                      ? `CTWA Click ID: ${conversation.ctwaClid}`
                      : 'Meta Click-to-WhatsApp Ad'
                  }
                  className="hidden xl:inline-flex shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 max-w-[160px] truncate"
                >
                  Meta Ad{conversation.adHeadline ? `: ${conversation.adHeadline}` : ''}
                </span>
              )}
              {conversation.linkedEntityType && conversation.linkedEntityId ? (
                <div className="hidden md:inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-brand-blue dark:text-blue-300 shrink-0">
                  <Link
                    href={getEntityHref(
                      conversation.linkedEntityType,
                      conversation.linkedEntityId,
                    )}
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" />
                    <span className="capitalize">{conversation.linkedEntityType}:</span>
                    <span className="max-w-[110px] truncate">
                      {conversation.linkedEntityLabel || conversation.linkedEntityId}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={onOpenLinkModal}
                    className="ml-0.5 opacity-75 hover:opacity-100 underline"
                    title="Change linked CRM record"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLinkModal}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/15 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue whitespace-nowrap shrink-0"
                >
                  <Link2 className="w-3 h-3" /> Link CRM
                </button>
              )}
              {conversation.channel === 'whatsapp' &&
                hasLinkedLead &&
                whatsappPermission?.isPermitted && (
                  <span
                    className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0"
                    title="WhatsApp Callback Permission active"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Call OK ({whatsappPermission.remainingLabel})
                  </span>
                )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {conversation.company || 'B2B Account'} ·{' '}
              {conversation.phone || 'No phone'} · {conversation.city}
            </div>
          </div>
        </div>

        {/* Right: Clean Compact Action Controls (Never Wraps into 2-Line Blocks) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Primary WhatsApp Voice Call CTA */}
          {conversation.channel === 'whatsapp' &&
            (hasLinkedLead ? (
              whatsappPermissionLoading ? (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/15 text-slate-400 whitespace-nowrap">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </span>
              ) : whatsappPermission?.isPermitted ? (
                <button
                  type="button"
                  disabled={!istOpen || !hasMinCallBalance || isWhatsappCallActive}
                  onClick={onStartWhatsappCall}
                  title={
                    !istOpen
                      ? 'Outbound WhatsApp calls are restricted outside 09:00-21:00 IST.'
                      : !hasMinCallBalance
                        ? `Insufficient calling balance (₹${(
                            whatsappWallet?.displayBalanceInr ?? 0
                          ).toFixed(2)}). Top up in Settings > Billing.`
                        : `Call on WhatsApp (${whatsappPermission.remainingLabel} · Bal ₹${(
                            whatsappWallet?.displayBalanceInr ?? 25
                          ).toFixed(2)})`
                  }
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canRequestPerm || requestingWhatsappPermission}
                  onClick={onRequestWhatsappPermission}
                  title={requestDisabledTooltip}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-amber-400/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {requestingWhatsappPermission ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Phone className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Request Call</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onOpenLinkModal}
                title="Link a CRM Lead to enable WhatsApp Calling"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-white/15 text-slate-500 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            ))}

          {/* Unified AI 24x7 Capsule */}
          {onOpenAiConcierge && (
            <div
              className={`hidden sm:inline-flex items-center h-8 rounded-lg border text-xs font-bold overflow-hidden ${
                aiAgentMode === 'autopilot'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={onOpenAiConcierge}
                className="inline-flex items-center gap-1.5 h-full px-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                title="Configure 24x7 AI Sales Concierge & Simulator"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>
                  {aiAgentMode === 'autopilot'
                    ? 'AI 24×7'
                    : aiAgentMode === 'draft_only'
                      ? 'AI Draft'
                      : 'AI Off'}
                </span>
              </button>
              {onToggleAutopilot && aiAgentMode === 'autopilot' && (
                <button
                  type="button"
                  onClick={() =>
                    onToggleAutopilot(
                      conversation.id,
                      !conversation.aiAutopilotPaused,
                    )
                  }
                  className="inline-flex items-center justify-center h-full px-2 border-l border-emerald-500/30 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title={
                    conversation.aiAutopilotPaused
                      ? 'Resume AI Auto-Pilot on this thread'
                      : 'Pause AI Auto-Pilot (Human takeover)'
                  }
                >
                  {conversation.aiAutopilotPaused ? (
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Secondary AI & External Tools Dropdown */}
          {hasSecondaryTools && (
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setToolsOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-brand-blue transition-colors whitespace-nowrap"
                title="AI & Workspace Tools"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden md:inline">Tools</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {toolsOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#111D33] border border-slate-200 dark:border-white/15 shadow-xl p-1.5 z-40 space-y-0.5 text-xs">
                  {onOpenAiConcierge && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        onOpenAiConcierge();
                      }}
                      className="sm:hidden w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-white/10"
                    >
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      <span>Configure AI 24×7</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      onOpenLinkModal();
                    }}
                    className="md:hidden w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold text-brand-blue dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-white/10"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {conversation.linkedEntityId
                        ? 'Change Linked CRM'
                        : 'Link CRM Record'}
                    </span>
                  </button>
                  {onRefreshAiSummary && (
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={() => {
                        setToolsOpen(false);
                        onRefreshAiSummary();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-white/10 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {conversation.aiSummary
                          ? 'Refresh AI Summary'
                          : 'Summarize Thread AI'}
                      </span>
                    </button>
                  )}
                  {onOpenRfqParser && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        onOpenRfqParser();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-white/10"
                    >
                      <PackageSearch className="w-3.5 h-3.5 shrink-0" />
                      <span>Voice-to-Quote &amp; RFQ AI</span>
                    </button>
                  )}
                  {onOpenVoiceAudit && (
                    <button
                      type="button"
                      onClick={() => {
                        setToolsOpen(false);
                        onOpenVoiceAudit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold text-brand-blue dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-white/10"
                    >
                      <Mic className="w-3.5 h-3.5 shrink-0" />
                      <span>Call Audit AI</span>
                    </button>
                  )}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setToolsOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-white/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Open WhatsApp Web</span>
                    </a>
                  )}
                  {conversation.phone && !conversation.phone.includes('*') && (
                    <a
                      href={`tel:${conversation.phone}`}
                      onClick={() => setToolsOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>Direct Tel Call</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary Thread Resolution Toggle */}
          <button
            type="button"
            onClick={() =>
              onToggleStatus(
                conversation.id,
                conversation.status === 'open' ? 'resolved' : 'open',
              )
            }
            title={
              conversation.status === 'resolved'
                ? 'Reopen conversation'
                : 'Mark conversation resolved'
            }
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              conversation.status === 'resolved'
                ? 'bg-emerald-500 text-white'
                : 'border border-slate-200 text-slate-700 hover:border-brand-blue dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {conversation.status === 'resolved' ? 'Resolved' : 'Resolve'}
            </span>
          </button>
        </div>
      </div>

      {/* SetuAI Context Banner */}
      {conversation.aiSummary && (
        <AISummaryCard
          summary={conversation.aiSummary}
          estimatedValue={conversation.estimatedValue}
          isRefreshing={isGeneratingAi}
          onRefresh={onRefreshAiSummary}
        />
      )}

      {/* 24x7 AI Concierge Qualification & Handoff Banner */}
      {(conversation.aiHandoffReason ||
        conversation.aiQualifiedData?.productName ||
        conversation.aiQualifiedData?.quantity ||
        conversation.aiQualifiedData?.gstin) && (
        <div className="mx-6 mt-2 p-3 rounded-2xl bg-white dark:bg-[#111D33] border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs space-y-1.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700 dark:text-emerald-300">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Qualification Snapshot (Score {conversation.aiScore}/100)</span>
            </span>
            {conversation.aiHandoffReason && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold">
                Handoff: {conversation.aiHandoffReason}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {conversation.aiQualifiedData?.productName && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-brand-navy dark:text-slate-200">
                SKU: {conversation.aiQualifiedData.productName} ({conversation.aiQualifiedData.hsnSac})
              </span>
            )}
            {conversation.aiQualifiedData?.quantity && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-300">
                Qty: {conversation.aiQualifiedData.quantity}
              </span>
            )}
            {conversation.aiQualifiedData?.city && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                City: {conversation.aiQualifiedData.city}
              </span>
            )}
            {conversation.aiQualifiedData?.gstin && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 font-mono text-emerald-700 dark:text-emerald-300">
                GSTIN: {conversation.aiQualifiedData.gstin}
              </span>
            )}
            {conversation.aiQualifiedData?.estimatedTotal ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                Est: ₹{conversation.aiQualifiedData.estimatedTotal.toLocaleString('en-IN')}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Low / Empty Calling Balance Callout (never blocks chat or free inbound calls) */}
      {conversation.channel === 'whatsapp' &&
        whatsappWallet &&
        whatsappWallet.isLowBalance && (
          <div
            className={`mx-5 mt-2 px-3.5 py-2 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              !whatsappWallet.hasMinimumBalance
                ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-200'
                : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300'
            }`}
          >
            <span>
              <strong>
                WhatsApp Calling Balance: ₹
                {whatsappWallet.displayBalanceInr.toFixed(2)}
              </strong>{' '}
              (~{whatsappWallet.estimatedMinutesRemaining} mins left @ ₹
              {whatsappWallet.rateInrPerMin.toFixed(2)}/min · Inbound calls are
              always free)
            </span>
            <Link
              href="/settings/billing/ai-credits"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold whitespace-nowrap"
            >
              Add Calling Balance
            </Link>
          </div>
        )}

      {/* WhatsApp Calling Policy / WebRTC Error Alert */}
      {whatsappCallError && (
        <div className="mx-6 mt-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-500/35 dark:text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{whatsappCallError}</span>
          </div>
          {onDismissWhatsappCallError && (
            <button
              type="button"
              onClick={onDismissWhatsappCallError}
              className="text-[11px] font-bold underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* WhatsApp Business Voice Call Logs & Playable Cloudinary Recordings */}
      {conversation.channel === 'whatsapp' && (
        <WhatsappCallLogsStrip logs={whatsappCallLogs} />
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
        {(conversation.messages || []).length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center">
            No messages yet in this thread. Pick a WhatsApp template below to send the first message.
          </div>
        ) : (
          (conversation.messages || []).map((msg) => {
            if (isWhatsappCallingTimelineText(msg.content)) {
              return (
                <WhatsappPermissionTimelineCard
                  key={msg.id}
                  content={msg.content}
                  createdAt={msg.createdAt}
                />
              );
            }

            const isOutbound = msg.direction === 'outbound';
            const canPreviewAttachment =
              msg.attachment?.url && !msg.attachment.url.startsWith('meta-media://');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isOutbound ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-lg rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-sm break-words ${
                    isOutbound
                      ? msg.status === 'failed'
                        ? 'bg-rose-600 text-white rounded-tr-sm'
                        : 'bg-brand-blue text-white rounded-tr-sm'
                      : 'bg-white text-brand-navy border border-slate-200/80 rounded-tl-sm dark:bg-[#111D33] dark:text-slate-100 dark:border-white/10'
                  }`}
                >
                  {(msg.isAiDrafted ||
                    msg.templateName ||
                    msg.metaTemplateName ||
                    msg.via === 'wa_me' ||
                    msg.deliveryProvider === 'meta_cloud') && (
                    <div
                      className={`text-[10px] font-bold mb-1.5 flex flex-wrap items-center gap-1.5 ${
                        isOutbound ? 'text-blue-100' : 'text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {msg.deliveryProvider === 'meta_cloud' && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/25">
                          Meta Cloud API
                        </span>
                      )}
                      {msg.isAiDrafted && (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> SetuAI Smart Reply
                        </span>
                      )}
                      {msg.templateName && (
                        <span className="px-1.5 py-0.5 rounded bg-white/15">
                          Template: {msg.templateName}
                        </span>
                      )}
                      {msg.metaTemplateName && (
                        <span className="px-1.5 py-0.5 rounded bg-white/15">
                          Meta Template: {msg.metaTemplateName}
                        </span>
                      )}
                      {msg.via === 'wa_me' && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/30">
                          via WhatsApp Web
                        </span>
                      )}
                    </div>
                  )}

                  {msg.attachment && (
                    <div className="mb-2">
                      {msg.attachment.type === 'image' && canPreviewAttachment ? (
                        <a
                          href={msg.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl overflow-hidden border border-white/20"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.filename || 'WhatsApp image'}
                            className="max-h-52 w-auto object-cover"
                          />
                        </a>
                      ) : msg.attachment.type === 'audio' ? (
                        <div className="space-y-2">
                          {canPreviewAttachment ? (
                            <audio
                              controls
                              src={msg.attachment.url}
                              className="h-9 max-w-[260px]"
                            />
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 text-xs font-semibold">
                              <Mic className="w-3.5 h-3.5 shrink-0" />
                              <span>{msg.attachment.filename || 'Voice Note'}</span>
                            </div>
                          )}
                          {onOpenVoiceNoteQuote && (
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenVoiceNoteQuote(
                                    canPreviewAttachment ? msg.attachment?.url : undefined,
                                    msg.content,
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                  isOutbound
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white dark:bg-sky-500/20 dark:text-sky-300'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Transcribe &amp; Build Quote</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                            isOutbound
                              ? 'bg-white/15 text-white'
                              : 'bg-slate-100 dark:bg-white/10 text-brand-navy dark:text-white'
                          }`}
                        >
                          {msg.attachment.type === 'image' ? (
                            <ImageIcon className="w-4 h-4 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]">
                            {msg.attachment.filename || 'Attachment'}
                          </span>
                          {canPreviewAttachment && (
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline ml-1 shrink-0"
                            >
                              Open
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <div className="whitespace-pre-line">{msg.content}</div>
                  )}

                  {msg.status === 'failed' && msg.deliveryError && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-black/20 text-[11px] flex items-center gap-1.5 text-rose-100">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.deliveryError}</span>
                    </div>
                  )}

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
                    {isOutbound &&
                      (msg.status === 'failed' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-200" />
                      ) : msg.status === 'read' ? (
                        <span className="inline-flex items-center gap-0.5 text-cyan-200 font-bold" title="Read by buyer">
                          <CheckCheck className="w-3.5 h-3.5" /> Read
                        </span>
                      ) : msg.status === 'delivered' ? (
                        <span title="Delivered">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span title="Sent to Meta Cloud">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

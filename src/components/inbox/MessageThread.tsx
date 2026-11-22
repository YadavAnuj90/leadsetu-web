'use client';

import Link from 'next/link';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
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
} from 'lucide-react';
import AISummaryCard from '@/components/ai/AISummaryCard';
import { buildWhatsAppMeUrl } from '@/lib/whatsapp-templates';
import type { Conversation, LinkedCrmEntityType } from '@/types/contracts';

interface MessageThreadProps {
  conversation: Conversation;
  onToggleStatus: (id: string, nextStatus: 'open' | 'resolved') => void;
  onOpenLinkModal: () => void;
  onOpenVoiceAudit?: () => void;
  onOpenRfqParser?: () => void;
  onRefreshAiSummary?: () => void;
  isGeneratingAi?: boolean;
  aiAgentMode?: 'autopilot' | 'draft_only' | 'off';
  onOpenAiConcierge?: () => void;
  onToggleAutopilot?: (id: string, paused: boolean) => void;
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
  onToggleStatus,
  onOpenLinkModal,
  onOpenVoiceAudit,
  onOpenRfqParser,
  onRefreshAiSummary,
  isGeneratingAi = false,
  aiAgentMode = 'draft_only',
  onOpenAiConcierge,
  onToggleAutopilot,
}: MessageThreadProps) {
  const waUrl = buildWhatsAppMeUrl(conversation.phone);

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FC] dark:bg-[#081020] overflow-hidden">
      {/* Top Thread Header */}
      <div className="px-6 py-3.5 bg-white dark:bg-[#0D1628] border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
            }}
          >
            {conversation.contactName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-sm text-brand-navy dark:text-white truncate">
                {conversation.contactName}
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
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
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 max-w-[200px] truncate"
                >
                  Meta Ad
                  {conversation.adHeadline
                    ? `: ${conversation.adHeadline}`
                    : ''}
                </span>
              )}
              {conversation.linkedEntityType && conversation.linkedEntityId ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue dark:text-blue-300">
                  <Link
                    href={getEntityHref(
                      conversation.linkedEntityType,
                      conversation.linkedEntityId,
                    )}
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" />
                    <span className="capitalize">{conversation.linkedEntityType}:</span>
                    <span className="max-w-[140px] truncate">
                      {conversation.linkedEntityLabel || conversation.linkedEntityId}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={onOpenLinkModal}
                    className="ml-1 text-[10px] underline hover:text-brand-navy dark:hover:text-white"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLinkModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/15 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue"
                >
                  <Link2 className="w-3 h-3" /> Link CRM
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {conversation.company || 'B2B Account'} ·{' '}
              {conversation.phone || 'No phone'} · {conversation.city}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAiConcierge && (
            <button
              type="button"
              onClick={onOpenAiConcierge}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                aiAgentMode === 'autopilot'
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                  : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-brand-blue'
              }`}
              title="Configure 24x7 AI Sales Concierge & Test Simulator"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>
                {aiAgentMode === 'autopilot'
                  ? 'AI 24×7 ON'
                  : aiAgentMode === 'draft_only'
                    ? 'AI Draft Mode'
                    : 'AI Off'}
              </span>
            </button>
          )}
          {onToggleAutopilot && aiAgentMode === 'autopilot' && (
            <button
              type="button"
              onClick={() =>
                onToggleAutopilot(conversation.id, !conversation.aiAutopilotPaused)
              }
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                conversation.aiAutopilotPaused
                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-300'
              }`}
              title={
                conversation.aiAutopilotPaused
                  ? 'Resume AI Auto-Pilot on this thread'
                  : 'Pause AI Auto-Pilot on this thread (Human takeover)'
              }
            >
              {conversation.aiAutopilotPaused ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resume AI</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pause AI</span>
                </>
              )}
            </button>
          )}
          {onRefreshAiSummary && (
            <button
              type="button"
              disabled={isGeneratingAi}
              onClick={onRefreshAiSummary}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50"
              title="Summarize Thread & Generate AI Reply Draft"
            >
              {isGeneratingAi ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{conversation.aiSummary ? 'Refresh AI' : 'Summarize AI'}</span>
            </button>
          )}
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
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
            >
              <ExternalLink className="w-3.5 h-3.5" /> WhatsApp Web
            </a>
          )}
          {conversation.phone && !conversation.phone.includes('*') && (
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
                conversation.status === 'open' ? 'resolved' : 'open',
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
              {conversation.status === 'resolved' ? 'Resolved ✓' : 'Mark Resolved'}
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

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {(conversation.messages || []).length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center">
            No messages yet in this thread. Pick a WhatsApp template below to send the first message.
          </div>
        ) : (
          (conversation.messages || []).map((msg) => {
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
                  className={`max-w-lg rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
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

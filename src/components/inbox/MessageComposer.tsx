'use client';

import { useEffect, useMemo, useRef, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { renderWhatsAppTemplate } from '@/lib/whatsapp-templates';
import { useWhatsAppUiStore } from '@/store/whatsapp-ui.store';
import type {
  ChatAttachment,
  Conversation,
  MetaApprovedTemplate,
  WhatsAppCloudConfig,
  WhatsAppTemplate,
} from '@/types/contracts';

interface MessageComposerProps {
  conversation: Conversation;
  agentName?: string;
  aiSuggestedReply?: string;
  isSending?: boolean;
  isGeneratingAi?: boolean;
  externalDraft?: {
    text: string;
    seq: number;
    templateId?: string;
    isAiDrafted?: boolean;
  } | null;
  waCloudConfig?: WhatsAppCloudConfig | null;
  metaTemplates?: MetaApprovedTemplate[];
  onOpenTemplateManager: () => void;
  onGenerateAiDraft?: (opts: {
    language: 'hinglish' | 'english' | 'hindi';
    tone: 'helpful' | 'closing' | 'followup';
  }) => Promise<void>;
  onSend: (
    content: string,
    opts?: {
      isAiDrafted?: boolean;
      templateId?: string;
      via?: 'inbox' | 'wa_me';
      logToTimeline?: boolean;
      sendMode?: 'text' | 'meta_template';
      metaTemplate?: {
        name: string;
        languageCode?: string;
        bodyParams?: string[];
      };
      attachment?: ChatAttachment;
    },
  ) => Promise<void>;
}

export default function MessageComposer({
  conversation,
  agentName,
  aiSuggestedReply,
  isSending = false,
  isGeneratingAi = false,
  externalDraft,
  waCloudConfig,
  metaTemplates = [],
  onOpenTemplateManager,
  onGenerateAiDraft,
  onSend,
}: MessageComposerProps) {
  const { templates, templatesLoading, loadTemplates } = useWhatsAppUiStore();
  const [text, setText] = useState('');
  const [usedAi, setUsedAi] = useState(false);
  const [aiLang, setAiLang] = useState<'hinglish' | 'english' | 'hindi'>('hinglish');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [metaPickerOpen, setMetaPickerOpen] = useState(false);
  const [selectedMetaTpl, setSelectedMetaTpl] =
    useState<MetaApprovedTemplate | null>(null);
  const [metaParams, setMetaParams] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.isActive),
    [templates],
  );

  const variableContext = useMemo(
    () => ({
      buyerName: conversation.contactName,
      company: conversation.company,
      dealValue: conversation.estimatedValue,
      city: conversation.city,
      phone: conversation.phone,
      agentName: agentName || 'Sales Team',
    }),
    [conversation, agentName],
  );

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (externalDraft?.text) {
      setText(renderWhatsAppTemplate(externalDraft.text, variableContext));
      setUsedAi(Boolean(externalDraft.isAiDrafted ?? !externalDraft.templateId));
      setSelectedTemplateId(externalDraft.templateId || '');
      setSelectedMetaTpl(null);
    }
  }, [
    externalDraft?.seq,
    externalDraft?.text,
    externalDraft?.templateId,
    externalDraft?.isAiDrafted,
    variableContext,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachError(null);
    if (file.size > 4.5 * 1024 * 1024) {
      setAttachError('Attachment must be under 4.5 MB.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      setAttachError('Supported attachments: PDF documents and images.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment({
          type: isImage ? 'image' : 'document',
          url: reader.result,
          filename: file.name,
          mimeType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectMetaTemplate = (tpl: MetaApprovedTemplate) => {
    setSelectedMetaTpl(tpl);
    setMetaPickerOpen(false);
    setSelectedTemplateId('');
    setUsedAi(false);
    const defaults = Array.from({ length: tpl.parameterCount }, (_, idx) => {
      if (idx === 0) return conversation.contactName || '';
      if (idx === 1) return conversation.company || '';
      return '';
    });
    setMetaParams(defaults);
    setText(tpl.bodyText);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment && !selectedMetaTpl) return;

    if (selectedMetaTpl) {
      let renderedPreview = selectedMetaTpl.bodyText;
      metaParams.forEach((val, idx) => {
        renderedPreview = renderedPreview.replace(
          new RegExp(`\\{\\{\\s*${idx + 1}\\s*\\}\\}`, 'g'),
          val || `{{${idx + 1}}}`,
        );
      });
      await onSend(renderedPreview, {
        sendMode: 'meta_template',
        metaTemplate: {
          name: selectedMetaTpl.name,
          languageCode: selectedMetaTpl.language || 'en',
          bodyParams: metaParams,
        },
        attachment: attachment || undefined,
        via: 'inbox',
        logToTimeline: true,
      });
    } else {
      await onSend(text.trim(), {
        isAiDrafted: usedAi,
        templateId: selectedTemplateId || undefined,
        attachment: attachment || undefined,
        via: 'inbox',
        logToTimeline: true,
      });
    }

    setText('');
    setUsedAi(false);
    setSelectedTemplateId('');
    setAttachment(null);
    setSelectedMetaTpl(null);
    setMetaParams([]);
  };

  const applyAiDraft = (draft: string) => {
    setText(renderWhatsAppTemplate(draft, variableContext));
    setUsedAi(true);
    setSelectedTemplateId('');
    setSelectedMetaTpl(null);
  };

  const applyTemplate = (tpl: WhatsAppTemplate) => {
    setText(renderWhatsAppTemplate(tpl.body, variableContext));
    setUsedAi(false);
    setSelectedTemplateId(tpl.id);
    setSelectedMetaTpl(null);
  };

  const metaLive = Boolean(waCloudConfig?.enabled && waCloudConfig?.configured);

  return (
    <div className="p-4 bg-white dark:bg-[#0D1628] border-t border-slate-200/80 dark:border-white/10 space-y-3">
      {/* SetuAI Suggested Reply Banner */}
      {aiSuggestedReply && (
        <div className="p-3 rounded-2xl bg-brand-light/80 dark:bg-indigo-950/60 border border-brand-blue/25 dark:border-indigo-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2 text-xs text-brand-navy dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-brand-blue dark:text-indigo-300 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-brand-blue dark:text-indigo-300">
                SetuAI Draft:{' '}
              </span>
              <span>{aiSuggestedReply}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onGenerateAiDraft && (
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={() =>
                  void onGenerateAiDraft({ language: aiLang, tone: 'helpful' })
                }
                className="px-2.5 py-1.5 rounded-xl border border-brand-blue/30 bg-white/80 dark:bg-white/10 text-brand-blue dark:text-indigo-200 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-white disabled:opacity-50"
                title="Regenerate AI Draft"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Regenerate</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => applyAiDraft(aiSuggestedReply)}
              className="px-3 py-1.5 rounded-xl bg-brand-blue text-white text-[11px] font-bold whitespace-nowrap hover:bg-brand-navy transition-colors"
            >
              Use AI Reply
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Workspace Templates + Meta Templates + Manage Link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
          {templatesLoading && activeTemplates.length === 0 ? (
            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading templates...
            </span>
          ) : (
            activeTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  selectedTemplateId === tpl.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-brand-light hover:text-brand-blue dark:bg-[#14223D] dark:text-slate-200 dark:border-white/10 dark:hover:bg-brand-blue/25 dark:hover:text-sky-300'
                }`}
                title={tpl.body}
              >
                {tpl.name}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {metaTemplates.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMetaPickerOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap"
              >
                Meta Approved ({metaTemplates.length})
              </button>
              {metaPickerOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-72 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-[#111D33] border border-slate-200 dark:border-white/15 shadow-xl p-2 z-30 space-y-1">
                  {metaTemplates.map((mt) => (
                    <button
                      key={`${mt.name}-${mt.language}`}
                      type="button"
                      onClick={() => handleSelectMetaTemplate(mt)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-1 text-xs font-bold text-brand-navy dark:text-white">
                        <span className="truncate">{mt.name}</span>
                        <span className="text-[10px] text-emerald-600">
                          {mt.language}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {mt.bodyText}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {onGenerateAiDraft && (
            <div className="inline-flex items-center rounded-xl border border-brand-blue/25 bg-brand-blue/5 dark:bg-brand-sky/10 overflow-hidden">
              <select
                value={aiLang}
                onChange={(e) =>
                  setAiLang(e.target.value as 'hinglish' | 'english' | 'hindi')
                }
                aria-label="AI Draft Language"
                className="bg-transparent pl-2 pr-1 py-1.5 text-[11px] font-semibold text-brand-navy dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="hinglish" className="text-slate-900">Hinglish</option>
                <option value="english" className="text-slate-900">English</option>
                <option value="hindi" className="text-slate-900">Hindi</option>
              </select>
              <button
                type="button"
                disabled={isGeneratingAi || isSending}
                onClick={() =>
                  void onGenerateAiDraft({ language: aiLang, tone: 'helpful' })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-brand-blue dark:text-brand-sky hover:bg-brand-blue/10 disabled:opacity-60 whitespace-nowrap border-l border-brand-blue/20"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Draft with AI
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenTemplateManager}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-[11px] font-bold text-brand-blue hover:bg-brand-light dark:hover:bg-white/10 whitespace-nowrap"
          >
            <Settings2 className="w-3.5 h-3.5" /> Manage Templates
          </button>
        </div>
      </div>

      {/* Selected Approved Meta Template Parameter Inputs */}
      {selectedMetaTpl && (
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
            <span>
              Sending Approved Meta Template: <code>{selectedMetaTpl.name}</code> ({selectedMetaTpl.language})
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedMetaTpl(null);
                setMetaParams([]);
              }}
              className="text-slate-400 hover:text-rose-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {selectedMetaTpl.parameterCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metaParams.map((val, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const next = [...metaParams];
                    next[idx] = e.target.value;
                    setMetaParams(next);
                  }}
                  placeholder={`Variable {{${idx + 1}}}`}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111D33] border border-emerald-200 dark:border-white/15 text-xs text-brand-navy dark:text-white"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Attachment Preview */}
      {(attachment || attachError) && (
        <div className="flex flex-wrap items-center gap-2">
          {attachment && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-xs font-semibold text-brand-navy dark:text-slate-100">
              {attachment.type === 'image' ? (
                <ImageIcon className="w-3.5 h-3.5 text-brand-blue" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-brand-blue" />
              )}
              <span className="truncate max-w-[220px]">{attachment.filename}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-slate-400 hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {attachError && (
            <span className="text-xs font-semibold text-rose-600">{attachError}</span>
          )}
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach PDF or Image"
          className="p-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-slate-600 dark:text-slate-300 hover:text-brand-blue hover:border-brand-blue transition-colors"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={text}
          readOnly={Boolean(selectedMetaTpl)}
          onChange={(e) => {
            setText(e.target.value);
            if (!e.target.value) setSelectedTemplateId('');
          }}
          placeholder={
            attachment
              ? 'Add optional caption for PDF / image...'
              : 'Type a WhatsApp reply or pick a template above...'
          }
          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-brand-navy dark:bg-[#111D33] dark:border-white/15 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#152440] focus:border-brand-blue"
        />
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !attachment && !selectedMetaTpl)}
          className="btn-primary-brand px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{selectedMetaTpl ? 'Send Meta Template' : 'Send'}</span>
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          {metaLive ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              {waCloudConfig?.connectionMode === 'leadsetu_managed'
                ? `Leadsetu WhatsApp Gateway (${waCloudConfig?.verifiedPhoneNumber || waCloudConfig?.managedDisplayNumber || 'Live'})`
                : `WhatsApp Business Live (${waCloudConfig?.verifiedPhoneNumber || waCloudConfig?.phoneNumberId})`}
            </span>
          ) : (
            <span className="text-slate-400">
              CRM + <code>wa.me</code> fallback mode ·{' '}
              <Link
                href="/settings/integrations"
                className="text-brand-blue font-bold hover:underline"
              >
                Connect WhatsApp (1-Click) →
              </Link>
            </span>
          )}
        </div>

        {conversation.linkedEntityType && (
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
            <Link2 className="w-3.5 h-3.5" />
            <span>
              Auto-logging to {conversation.linkedEntityType} timeline
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

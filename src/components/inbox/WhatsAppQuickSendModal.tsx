'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-client';
import {
  fetchWhatsAppCloudConfigApi,
  startOrGetConversationApi,
} from '@/lib/inbox-api';
import {
  WHATSAPP_VARIABLE_LIST,
  buildWhatsAppMeUrl,
  renderWhatsAppTemplate,
  type WhatsAppVariableContext,
} from '@/lib/whatsapp-templates';
import { useAuthStore } from '@/store/auth.store';
import { useWhatsAppUiStore } from '@/store/whatsapp-ui.store';
import WhatsAppTemplateManagerModal from './WhatsAppTemplateManagerModal';
import type {
  ChatAttachment,
  WhatsAppCloudConfig,
  WhatsAppTemplate,
} from '@/types/contracts';

export default function WhatsAppQuickSendModal() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    quickSendTarget,
    closeQuickSend,
    templates,
    templatesLoading,
    loadTemplates,
    templateManagerOpen,
    openTemplateManager,
    closeTemplateManager,
  } = useWhatsAppUiStore();

  const [messageText, setMessageText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [logToTimeline, setLogToTimeline] = useState(true);
  const [waCloudConfig, setWaCloudConfig] = useState<WhatsAppCloudConfig | null>(
    null,
  );
  const [submittingMode, setSubmittingMode] = useState<
    'open_inbox' | 'inbox' | 'wa_me' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    conversationId: string;
    via: 'inbox' | 'wa_me';
    timelineLogged: boolean;
    deliveryProvider?: string;
    deliveryFailedError?: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!quickSendTarget) return;
    void loadTemplates();
    setMessageText('');
    setSelectedTemplateId('');
    setAttachment(null);
    setLogToTimeline(true);
    setError(null);
    setSuccessResult(null);
    fetchWhatsAppCloudConfigApi()
      .then((cfg) => setWaCloudConfig(cfg))
      .catch(() => {});
  }, [quickSendTarget, loadTemplates]);

  const variableContext = useMemo<WhatsAppVariableContext>(
    () => ({
      buyerName: quickSendTarget?.contactName || '',
      company: quickSendTarget?.company || '',
      dealValue: quickSendTarget?.estimatedValue || 0,
      city: quickSendTarget?.city || '',
      phone: quickSendTarget?.phone || '',
      agentName: user?.name || 'Sales Team',
    }),
    [quickSendTarget, user?.name],
  );

  // Auto-populate the first active template cleanly when opening if empty
  useEffect(() => {
    if (!quickSendTarget || messageText || templates.length === 0) return;
    const firstActive = templates.find((t) => t.isActive) || templates[0];
    if (firstActive) {
      setSelectedTemplateId(firstActive.id);
      setMessageText(renderWhatsAppTemplate(firstActive.body, variableContext));
    }
  }, [quickSendTarget, templates, messageText, variableContext]);

  const isPhoneMasked = Boolean(quickSendTarget?.phone?.includes('*'));
  const waPreviewUrl = useMemo(
    () => buildWhatsAppMeUrl(quickSendTarget?.phone, messageText),
    [quickSendTarget?.phone, messageText],
  );

  if (!quickSendTarget) return null;

  const metaLive = Boolean(waCloudConfig?.enabled && waCloudConfig?.configured);

  const applyTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplateId(tpl.id);
    setMessageText(renderWhatsAppTemplate(tpl.body, variableContext));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (file.size > 4.5 * 1024 * 1024) {
      setError('Attachment must be under 4.5 MB.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      setError('Supported attachments: PDF documents and images.');
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

  const insertResolvedVariable = (token: string) => {
    const resolved = renderWhatsAppTemplate(token, variableContext);
    const el = textareaRef.current;
    if (!el) {
      setMessageText((prev) => (prev ? `${prev} ${resolved}` : resolved));
      return;
    }
    const start = el.selectionStart ?? messageText.length;
    const end = el.selectionEnd ?? messageText.length;
    const next = messageText.slice(0, start) + resolved + messageText.slice(end);
    setMessageText(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + resolved.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleOpenInInboxOnly = async () => {
    setSubmittingMode('open_inbox');
    setError(null);
    try {
      const res = await startOrGetConversationApi({
        linkedEntityType: quickSendTarget.entityType || '',
        linkedEntityId: quickSendTarget.entityId || '',
        contactName: quickSendTarget.contactName,
        company: quickSendTarget.company,
        phone: quickSendTarget.phone,
        city: quickSendTarget.city,
        estimatedValue: quickSendTarget.estimatedValue,
        channel: 'whatsapp',
      });
      closeQuickSend();
      router.push(`/inbox?thread=${encodeURIComponent(res.conversation.id)}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingMode(null);
    }
  };

  const handleSend = async (via: 'inbox' | 'wa_me') => {
    const cleanText = messageText.trim();
    if (!cleanText && !attachment) {
      setError('Enter a WhatsApp message, attach a PDF/image, or pick a template first.');
      return;
    }
    if (via === 'wa_me' && !waPreviewUrl) {
      setError('External WhatsApp Web requires a visible 10+ digit phone number.');
      return;
    }

    setSubmittingMode(via);
    setError(null);
    try {
      const res = await startOrGetConversationApi({
        linkedEntityType: quickSendTarget.entityType || '',
        linkedEntityId: quickSendTarget.entityId || '',
        contactName: quickSendTarget.contactName,
        company: quickSendTarget.company,
        phone: quickSendTarget.phone,
        city: quickSendTarget.city,
        estimatedValue: quickSendTarget.estimatedValue,
        channel: 'whatsapp',
        initialMessage: cleanText,
        templateId: selectedTemplateId || undefined,
        attachment: attachment || undefined,
        via,
        logToTimeline,
      });

      if (quickSendTarget.entityType && quickSendTarget.entityId) {
        window.dispatchEvent(
          new CustomEvent('leadsetu:whatsapp-logged', {
            detail: {
              entityType: quickSendTarget.entityType,
              entityId: quickSendTarget.entityId,
              conversationId: res.conversation.id,
            },
          }),
        );
      }

      if (via === 'wa_me') {
        const finalUrl = buildWhatsAppMeUrl(
          quickSendTarget.phone,
          res.conversation.lastMessage || cleanText,
        );
        if (finalUrl) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }
      }

      const lastMsg =
        res.conversation.messages[res.conversation.messages.length - 1];

      setSuccessResult({
        conversationId: res.conversation.id,
        via,
        timelineLogged: res.timelineLogged,
        deliveryProvider: lastMsg?.deliveryProvider,
        deliveryFailedError:
          lastMsg?.status === 'failed' ? lastMsg.deliveryError : undefined,
      });
      setAttachment(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[65] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold text-brand-navy dark:text-white truncate">
                    WhatsApp Composer
                  </h2>
                  {quickSendTarget.entityType && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      {quickSendTarget.entityType}
                    </span>
                  )}
                  {metaLive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      <ShieldCheck className="w-3 h-3" />{' '}
                      {waCloudConfig?.connectionMode === 'leadsetu_managed'
                        ? 'Leadsetu Gateway Live'
                        : 'WhatsApp Business Live'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {quickSendTarget.contactName}
                  {quickSendTarget.company ? ` · ${quickSendTarget.company}` : ''}
                  {quickSendTarget.phone ? ` · ${quickSendTarget.phone}` : ''}
                  {quickSendTarget.estimatedValue
                    ? ` · ₹${Number(quickSendTarget.estimatedValue).toLocaleString('en-IN')}`
                    : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeQuickSend}
              className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Close WhatsApp composer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {isPhoneMasked && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Phone number is protected by Anti-Data-Leak Shield. Use{' '}
                  <strong>Send &amp; Log in Inbox</strong> or{' '}
                  <strong>Open in Inbox</strong> — external <code>wa.me</code> is disabled for masked contacts.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {successResult && (
              <div
                className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                  successResult.deliveryFailedError
                    ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {successResult.deliveryFailedError
                      ? `Saved to Inbox, Meta delivery failed: ${successResult.deliveryFailedError}`
                      : successResult.deliveryProvider === 'meta_cloud'
                        ? 'Sent live via Meta Cloud API'
                        : successResult.via === 'wa_me'
                          ? 'Saved to Inbox & opened WhatsApp Web'
                          : 'Saved to Inbox'}
                    {successResult.timelineLogged ? ' · Logged to CRM timeline' : ''}
                  </span>
                </div>
                <Link
                  href={`/inbox?thread=${encodeURIComponent(successResult.conversationId)}`}
                  onClick={closeQuickSend}
                  className="font-extrabold hover:underline"
                >
                  View in Inbox →
                </Link>
              </div>
            )}

            {/* Dynamic Template Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Templates ({templates.filter((t) => t.isActive).length})
                </span>
                <button
                  type="button"
                  onClick={openTemplateManager}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Manage Templates
                </button>
              </div>

              {templatesLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading templates...
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {templates
                    .filter((t) => t.isActive)
                    .map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors ${
                          selectedTemplateId === tpl.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-emerald-400 dark:bg-[#14223D] dark:text-slate-200 dark:border-white/10'
                        }`}
                      >
                        {tpl.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                rows={4}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setSuccessResult(null);
                }}
                placeholder="Write a WhatsApp message or click a template above..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-sm text-brand-navy dark:text-white leading-relaxed focus:outline-none focus:border-emerald-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">
                    Insert:
                  </span>
                  {WHATSAPP_VARIABLE_LIST.slice(0, 6).map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertResolvedVariable(v.token)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#14223D] text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                <div>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/15 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue"
                  >
                    <Paperclip className="w-3 h-3" /> Attach PDF / Image
                  </button>
                </div>
              </div>

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
            </div>

            {quickSendTarget.entityType && quickSendTarget.entityId && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={logToTimeline}
                  onChange={(e) => setLogToTimeline(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Auto-log message to CRM activity timeline
              </label>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#081020] border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              disabled={submittingMode !== null}
              onClick={handleOpenInInboxOnly}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-slate-100 hover:border-brand-blue disabled:opacity-50"
            >
              {submittingMode === 'open_inbox' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Inbox className="w-3.5 h-3.5 text-brand-blue" />
              )}
              <span>Open in Inbox</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={submittingMode !== null || (!messageText.trim() && !attachment)}
                onClick={() => handleSend('inbox')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy dark:bg-brand-blue text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
              >
                {submittingMode === 'inbox' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {metaLive ? 'Send Live via Meta + Log' : 'Send & Log in Inbox'}
                </span>
              </button>

              <button
                type="button"
                disabled={submittingMode !== null || !waPreviewUrl || !messageText.trim()}
                onClick={() => handleSend('wa_me')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {submittingMode === 'wa_me' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                <span>Send via WhatsApp Web + Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppTemplateManagerModal
        open={templateManagerOpen}
        onClose={closeTemplateManager}
        previewContext={variableContext}
        onSelectTemplate={applyTemplate}
      />
    </>
  );
}

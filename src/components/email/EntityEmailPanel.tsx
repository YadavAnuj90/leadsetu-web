'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  RefreshCw,
  Loader2,
  Eye,
  Inbox,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchEmailCrmConfigApi,
  fetchEntityEmailsApi,
  sendTrackedEmailApi,
  syncInboundEmailsApi,
} from '@/lib/email-crm-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  EmailAccountInfo,
  EmailMessageItem,
  EmailTemplateItem,
} from '@/types/contracts';

interface EntityEmailPanelProps {
  entityType: 'lead' | 'contact' | 'deal';
  entityId: string;
  entityLabel: string;
  defaultToEmail?: string;
  contactName?: string;
  companyName?: string;
  dealValueLabel?: string;
  senderName?: string;
  onEmailActivity?: () => void;
}

function interpolateTemplateVars(
  raw: string,
  vars: Record<string, string>,
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value || ''),
    raw,
  );
}

export function EntityEmailPanel({
  entityType,
  entityId,
  entityLabel,
  defaultToEmail = '',
  contactName = '',
  companyName = '',
  dealValueLabel = '',
  senderName = 'Sales Team',
  onEmailActivity,
}: EntityEmailPanelProps) {
  const [account, setAccount] = useState<EmailAccountInfo | null>(null);
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [messages, setMessages] = useState<EmailMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  const [toEmail, setToEmail] = useState(defaultToEmail);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (defaultToEmail && !toEmail) {
      setToEmail(defaultToEmail);
    }
  }, [defaultToEmail, toEmail]);

  const loadData = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const [cfg, thread] = await Promise.all([
        fetchEmailCrmConfigApi(),
        fetchEntityEmailsApi({ entityType, entityId, limit: 30 }),
      ]);
      setAccount(cfg.account);
      setTemplates(cfg.templates || []);
      setMessages(thread.data || []);
    } catch {
      // Fail gracefully if unconfigured
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const vars = {
      contactName: contactName || entityLabel || 'Sir/Ma’am',
      companyName: companyName || entityLabel || 'your organization',
      dealValue: dealValueLabel || 'Commercial Offer',
      senderName: account?.displayName || senderName,
    };
    setSubject(interpolateTemplateVars(tpl.subject, vars));
    setBodyHtml(interpolateTemplateVars(tpl.bodyHtml, vars));
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim()) return;
    setSending(true);
    setNotice(null);
    try {
      const sent = await sendTrackedEmailApi({
        toEmail: toEmail.trim(),
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim() || '<p></p>',
        entityType,
        entityId,
        entityLabel,
        templateId: selectedTemplateId || undefined,
      });
      setMessages((prev) => [sent, ...prev]);
      setSubject('');
      setBodyHtml('');
      setSelectedTemplateId('');
      setComposeOpen(false);
      setNotice({
        type: 'success',
        text: `Tracked email sent to ${sent.toEmail} and logged to activity timeline.`,
      });
      onEmailActivity?.();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  const handleSyncReplies = async () => {
    setSyncing(true);
    setNotice(null);
    try {
      const syncRes = await syncInboundEmailsApi();
      const thread = await fetchEntityEmailsApi({ entityType, entityId, limit: 30 });
      setMessages(thread.data || []);
      setNotice({
        type: 'success',
        text: `IMAP Inbox checked (${syncRes.importedCount} new messages imported).`,
      });
      if (syncRes.importedCount > 0) {
        onEmailActivity?.();
      }
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="card-surface p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-500" />
            2-Way Email Thread &amp; Composer
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {messages.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {account
              ? `Connected mailbox: ${account.emailAddress} · Open tracking active`
              : 'Connect Gmail/Zoho/Outlook SMTP in Settings -> Email CRM to send tracked emails.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {account ? (
            <>
              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncReplies}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Sync Replies</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setComposeOpen((prev) => !prev);
                  setNotice(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{composeOpen ? 'Hide Composer' : 'Send Email'}</span>
              </button>
            </>
          ) : (
            <Link
              href="/settings/email"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Connect SMTP / Gmail</span>
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {composeOpen && account && (
        <form
          onSubmit={handleSend}
          className="p-4 rounded-2xl border border-brand-blue/30 bg-slate-50/80 dark:bg-slate-900/60 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Recipient Email *
              </label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="buyer@company.in"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Load Reusable Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
              >
                <option value="">-- Choose B2B Template (Optional) --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    [{tpl.category.toUpperCase()}] {tpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email Subject"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-brand-navy"
          />

          <textarea
            rows={5}
            required
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder="<p>Namaste...</p> Write HTML or plain message (open tracking pixel & signature added automatically)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Tracked Email</span>
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading email thread...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          No emails exchanged for this {entityType} yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            return (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    className="flex items-center gap-2 text-left min-w-0 flex-1"
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                        msg.direction === 'inbound'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}
                    >
                      {msg.direction === 'inbound' ? <Inbox className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                      {msg.direction === 'inbound' ? 'Reply' : 'Sent'}
                    </span>
                    <span className="text-xs font-extrabold text-brand-navy truncate">
                      {msg.subject}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 shrink-0 text-[11px]">
                    {msg.direction === 'outbound' && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                          msg.openCount > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {msg.openCount > 0 ? `Opened ${msg.openCount}x` : 'Unopened'}
                      </span>
                    )}
                    <span className="font-mono text-slate-400">
                      {new Date(msg.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {msg.fromEmail} → {msg.toEmail}
                </p>

                {isExpanded && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.bodyText || 'No plain text body.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

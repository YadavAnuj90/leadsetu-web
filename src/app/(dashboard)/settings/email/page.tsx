'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
  PlugZap,
  Save,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Inbox,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  createEmailTemplateApi,
  deleteEmailTemplateApi,
  fetchEmailCrmConfigApi,
  saveEmailAccountApi,
  syncInboundEmailsApi,
  testEmailConnectionApi,
  updateEmailTemplateApi,
} from '@/lib/email-crm-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  EmailAccountInfo,
  EmailMessageItem,
  EmailProviderPreset,
  EmailTemplateCategory,
  EmailTemplateItem,
} from '@/types/contracts';

const PROVIDER_PRESETS: Record<
  EmailProviderPreset,
  {
    label: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    imapHost: string;
    imapPort: number;
    imapSecure: boolean;
    hint: string;
  }
> = {
  gmail: {
    label: 'Gmail App Password',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    hint: 'Enable 2-Step Verification in Google Account -> Security -> App Passwords (16 characters).',
  },
  zoho: {
    label: 'Zoho Mail India',
    smtpHost: 'smtp.zoho.in',
    smtpPort: 465,
    smtpSecure: true,
    imapHost: 'imap.zoho.in',
    imapPort: 993,
    imapSecure: true,
    hint: 'Use Zoho Mail -> My Account -> Security -> Application-Specific Password (smtp.zoho.in).',
  },
  outlook: {
    label: 'Outlook / Microsoft 365',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    hint: 'Uses STARTTLS on port 587 for SMTP and SSL 993 for IMAP.',
  },
  custom: {
    label: 'Custom Domain SMTP/IMAP',
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    hint: 'Enter your cPanel, Hostinger, AWS SES, or company mailserver host and ports.',
  },
};

const TEMPLATE_CATEGORIES: Array<{ value: EmailTemplateCategory; label: string }> = [
  { value: 'proforma', label: 'Proforma' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'followup', label: 'Follow-Up' },
  { value: 'udhaar', label: 'Udhaar Reminder' },
  { value: 'welcome', label: 'Partner Welcome' },
  { value: 'custom', label: 'Custom' },
];

export default function EmailCrmSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<EmailAccountInfo | null>(null);
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [recentMessages, setRecentMessages] = useState<EmailMessageItem[]>([]);

  // Mailbox form state
  const [providerPreset, setProviderPreset] = useState<EmailProviderPreset>('gmail');
  const [emailAddress, setEmailAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [imapHost, setImapHost] = useState('imap.gmail.com');
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [signatureHtml, setSignatureHtml] = useState('');

  const [savingAccount, setSavingAccount] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [testResult, setTestResult] = useState<{
    smtpOk: boolean;
    smtpError: string;
    imapOk: boolean;
    imapError: string;
  } | null>(null);

  // Template editor modal/form
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState<EmailTemplateCategory>('proforma');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBodyHtml, setTplBodyHtml] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);
  const [showTplForm, setShowTplForm] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await fetchEmailCrmConfigApi();
      setAccount(cfg.account);
      setTemplates(cfg.templates || []);
      setRecentMessages(cfg.recentMessages || []);
      if (cfg.account) {
        setProviderPreset(cfg.account.providerPreset || 'gmail');
        setEmailAddress(cfg.account.emailAddress);
        setDisplayName(cfg.account.displayName || '');
        setSmtpHost(cfg.account.smtpHost);
        setSmtpPort(cfg.account.smtpPort);
        setSmtpSecure(cfg.account.smtpSecure);
        setImapHost(cfg.account.imapHost || '');
        setImapPort(cfg.account.imapPort || 993);
        setImapSecure(cfg.account.imapSecure);
        setUsername(cfg.account.username || cfg.account.emailAddress);
        setSignatureHtml(cfg.account.signatureHtml || '');
      }
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const applyPreset = (preset: EmailProviderPreset) => {
    setProviderPreset(preset);
    const p = PROVIDER_PRESETS[preset];
    if (preset !== 'custom') {
      setSmtpHost(p.smtpHost);
      setSmtpPort(p.smtpPort);
      setSmtpSecure(p.smtpSecure);
      setImapHost(p.imapHost);
      setImapPort(p.imapPort);
      setImapSecure(p.imapSecure);
    }
  };

  const handleSaveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setNotice(null);
    setTestResult(null);
    try {
      const saved = await saveEmailAccountApi({
        providerPreset,
        emailAddress: emailAddress.trim(),
        displayName: displayName.trim() || undefined,
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        smtpSecure,
        imapHost: imapHost.trim() || undefined,
        imapPort: Number(imapPort) || 993,
        imapSecure,
        username: username.trim() || emailAddress.trim(),
        appPassword: appPassword.trim() || undefined,
        signatureHtml,
        isActive: true,
      });
      setAccount(saved);
      setAppPassword('');
      setNotice({
        type: 'success',
        text: 'Mailbox SMTP/IMAP settings encrypted and saved securely.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setNotice(null);
    setTestResult(null);
    try {
      const res = await testEmailConnectionApi();
      setTestResult(res);
      if (res.smtpOk && res.imapOk) {
        setNotice({
          type: 'success',
          text: `Live SMTP & IMAP handshake succeeded for ${res.emailAddress}!`,
        });
      } else {
        setNotice({
          type: 'error',
          text: `Handshake check completed with issues. Inspect SMTP/IMAP diagnostics below.`,
        });
      }
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSyncInbound = async () => {
    setSyncingInbox(true);
    setNotice(null);
    try {
      const res = await syncInboundEmailsApi();
      setRecentMessages(res.data || []);
      setNotice({
        type: 'success',
        text: `IMAP INBOX synced (${res.importedCount} new buyer replies matched to CRM records).`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSyncingInbox(false);
    }
  };

  const startNewTemplate = () => {
    setEditingTemplateId(null);
    setTplName('');
    setTplCategory('proforma');
    setTplSubject('');
    setTplBodyHtml('<p>Namaste {{contactName}},</p><p></p><p>Regards,<br/>{{senderName}}</p>');
    setShowTplForm(true);
  };

  const startEditTemplate = (tpl: EmailTemplateItem) => {
    setEditingTemplateId(tpl.id);
    setTplName(tpl.name);
    setTplCategory(tpl.category);
    setTplSubject(tpl.subject);
    setTplBodyHtml(tpl.bodyHtml);
    setShowTplForm(true);
  };

  const handleSaveTemplate = async (e: FormEvent) => {
    e.preventDefault();
    setSavingTpl(true);
    setNotice(null);
    try {
      if (editingTemplateId) {
        const updated = await updateEmailTemplateApi(editingTemplateId, {
          name: tplName.trim(),
          category: tplCategory,
          subject: tplSubject.trim(),
          bodyHtml: tplBodyHtml,
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setNotice({ type: 'success', text: `Template "${updated.name}" updated.` });
      } else {
        const created = await createEmailTemplateApi({
          name: tplName.trim(),
          category: tplCategory,
          subject: tplSubject.trim(),
          bodyHtml: tplBodyHtml,
        });
        setTemplates((prev) => [created, ...prev]);
        setNotice({ type: 'success', text: `Template "${created.name}" created.` });
      }
      setShowTplForm(false);
      setEditingTemplateId(null);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSavingTpl(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    try {
      await deleteEmailTemplateApi(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setNotice({ type: 'success', text: `Deleted template "${name}".` });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-brand-navy flex items-center gap-2">
              <Mail className="w-6 h-6 text-sky-500" />
              2-Way Email CRM &amp; Reusable Templates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Connect Gmail, Zoho Mail, Outlook, or custom SMTP/IMAP to send tracked quotations and sync buyer replies onto timelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!account || syncingInbox}
            onClick={handleSyncInbound}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
          >
            {syncingInbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Sync Inbox Replies</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
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

      {loading ? (
        <div className="card-surface p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
          <span>Loading Email CRM configuration...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Mailbox Config */}
          <form onSubmit={handleSaveAccount} className="xl:col-span-6 card-surface p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <PlugZap className="w-4 h-4 text-sky-500" />
                  SMTP &amp; IMAP Mailbox Connection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Credentials are encrypted at rest with AES-256-GCM before storage.
                </p>
              </div>
              {account && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Connected
                </span>
              )}
            </div>

            {/* Provider Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(PROVIDER_PRESETS) as EmailProviderPreset[]).map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => applyPreset(presetKey)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    providerPreset === presetKey
                      ? 'border-brand-blue bg-brand-light text-brand-blue shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {PROVIDER_PRESETS[presetKey].label}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-200">
              {PROVIDER_PRESETS[providerPreset].hint}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sender Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="sales@yourcompany.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Anuj · Sales Desk"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  required
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
                  />
                </div>
                <label className="flex items-center gap-2 pt-5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>SSL / TLS</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  IMAP Host (2-Way Reply Sync)
                </label>
                <input
                  type="text"
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="imap.gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    IMAP Port
                  </label>
                  <input
                    type="number"
                    value={imapPort}
                    onChange={(e) => setImapPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
                  />
                </div>
                <label className="flex items-center gap-2 pt-5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={imapSecure}
                    onChange={(e) => setImapSecure(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>IMAP SSL</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Auth Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Defaults to sender email"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  App Password / SMTP Password {account?.hasPassword ? `(${account.appPasswordMasked})` : '*'}
                </label>
                <input
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  required={!account?.hasPassword}
                  placeholder={account?.hasPassword ? 'Leave blank to keep stored secret' : '16-char Gmail App Password'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Email Signature (HTML appended to outgoing emails)
              </label>
              <textarea
                rows={3}
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                placeholder="<p>Regards,<br/><strong>Webito Infotech Sales Team</strong></p>"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
              />
            </div>

            {testResult && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">SMTP Outbound Handshake:</span>
                  <span className={testResult.smtpOk ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {testResult.smtpOk ? 'OK' : `Failed: ${testResult.smtpError}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">IMAP Inbound Handshake:</span>
                  <span className={testResult.imapOk ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {testResult.imapOk ? 'OK' : `Failed: ${testResult.imapError}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="submit"
                disabled={savingAccount}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-60"
              >
                {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Encrypted Mailbox</span>
              </button>

              <button
                type="button"
                disabled={!account || testingConn}
                onClick={handleTestConnection}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-brand-navy disabled:opacity-50"
              >
                {testingConn ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
                <span>Test Live Handshake</span>
              </button>
            </div>
          </form>

          {/* Reusable Templates */}
          <div className="xl:col-span-6 card-surface p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Reusable Email Templates ({templates.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Variables supported: <code className="font-mono">{'{{contactName}}'}</code>,{' '}
                  <code className="font-mono">{'{{companyName}}'}</code>,{' '}
                  <code className="font-mono">{'{{dealValue}}'}</code>,{' '}
                  <code className="font-mono">{'{{senderName}}'}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={startNewTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Template</span>
              </button>
            </div>

            {showTplForm && (
              <form
                onSubmit={handleSaveTemplate}
                className="p-4 rounded-2xl border border-brand-blue/30 bg-slate-50 dark:bg-slate-900/60 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    placeholder="Template Name (e.g. Q4 Dealer Price List)"
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                  />
                  <select
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value as EmailTemplateCategory)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                  >
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  required
                  value={tplSubject}
                  onChange={(e) => setTplSubject(e.target.value)}
                  placeholder="Email Subject Line"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-brand-navy"
                />
                <textarea
                  rows={5}
                  required
                  value={tplBodyHtml}
                  onChange={(e) => setTplBodyHtml(e.target.value)}
                  placeholder="HTML body..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-brand-navy"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingTpl}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {savingTpl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{editingTemplateId ? 'Update Template' : 'Create Template'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTplForm(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-brand-navy">{tpl.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        Subject: {tpl.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditTemplate(tpl)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-blue"
                        title="Edit template"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tracked Messages & Open Telemetry */}
          <div className="xl:col-span-12 card-surface p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-indigo-500" />
                  Recent Workspace Email Activity &amp; Open Tracking
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time log of tracked outbound quotations and synced inbound buyer replies.
                </p>
              </div>
              {account?.lastSyncedAt && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Last IMAP Sync: {new Date(account.lastSyncedAt).toLocaleString()}
                </span>
              )}
            </div>

            {recentMessages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                No tracked emails yet. Connect your mailbox above and send an email directly from any Lead, Contact, or Deal detail page.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            msg.direction === 'inbound'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                          }`}
                        >
                          {msg.direction === 'inbound' ? <Inbox className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          {msg.direction}
                        </span>
                        <span className="font-bold text-brand-navy">{msg.subject}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        From <span className="font-mono">{msg.fromEmail}</span> →{' '}
                        <span className="font-mono">{msg.toEmail}</span>
                        {msg.entityLabel ? ` · Linked: ${msg.entityLabel}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {msg.direction === 'outbound' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            msg.openCount > 0
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          {msg.openCount > 0 ? `Opened ${msg.openCount}x` : 'Sent'}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(msg.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

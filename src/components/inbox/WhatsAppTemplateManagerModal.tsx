'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Edit3,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-client';
import {
  createWhatsAppTemplateApi,
  deleteWhatsAppTemplateApi,
  updateWhatsAppTemplateApi,
} from '@/lib/inbox-api';
import {
  WHATSAPP_VARIABLE_LIST,
  extractTemplateVariables,
  renderWhatsAppTemplate,
  type WhatsAppVariableContext,
} from '@/lib/whatsapp-templates';
import { useAuthStore } from '@/store/auth.store';
import { useWhatsAppUiStore } from '@/store/whatsapp-ui.store';
import type {
  WhatsAppTemplate,
  WhatsAppTemplateCategory,
  WhatsAppTemplateLanguage,
} from '@/types/contracts';

interface WhatsAppTemplateManagerModalProps {
  open: boolean;
  onClose: () => void;
  previewContext?: WhatsAppVariableContext;
  onSelectTemplate?: (template: WhatsAppTemplate) => void;
}

const CATEGORIES: Array<{ id: 'all' | WhatsAppTemplateCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'greeting', label: 'Greeting' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'payment', label: 'Payment' },
  { id: 'support', label: 'Support' },
  { id: 'custom', label: 'Custom' },
];

const LANGUAGES: WhatsAppTemplateLanguage[] = ['Hinglish', 'English', 'Hindi'];

export default function WhatsAppTemplateManagerModal({
  open,
  onClose,
  previewContext,
  onSelectTemplate,
}: WhatsAppTemplateManagerModalProps) {
  const user = useAuthStore((s) => s.user);
  const { templates, templatesLoading, loadTemplates, setTemplates } =
    useWhatsAppUiStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | WhatsAppTemplateCategory
  >('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<WhatsAppTemplateCategory>('custom');
  const [language, setLanguage] = useState<WhatsAppTemplateLanguage>('Hinglish');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      void loadTemplates(true);
      setError(null);
    }
  }, [open, loadTemplates]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (categoryFilter !== 'all' && tpl.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.body.toLowerCase().includes(q) ||
        tpl.slug.toLowerCase().includes(q)
      );
    });
  }, [templates, categoryFilter, search]);

  const mergedPreviewCtx = useMemo<WhatsAppVariableContext>(
    () => ({
      buyerName: previewContext?.buyerName || 'Rajesh Sharma',
      company: previewContext?.company || 'Apex Steel Pvt Ltd',
      dealValue: previewContext?.dealValue || 250000,
      city: previewContext?.city || 'Delhi-NCR',
      phone: previewContext?.phone || '+91 98112 45678',
      agentName: previewContext?.agentName || user?.name || 'Sales Team',
      quoteLink: previewContext?.quoteLink || 'https://leadsetu.in/quote/demo',
      callLink: previewContext?.callLink || 'https://leadsetu.in/call/demo',
    }),
    [previewContext, user?.name],
  );

  const detectedVariables = useMemo(() => extractTemplateVariables(body), [body]);
  const livePreview = useMemo(
    () => renderWhatsAppTemplate(body, mergedPreviewCtx),
    [body, mergedPreviewCtx],
  );

  const startNewTemplate = () => {
    setEditingId(null);
    setName('');
    setCategory('custom');
    setLanguage('Hinglish');
    setBody('');
    setError(null);
  };

  const startEditTemplate = (tpl: WhatsAppTemplate) => {
    setEditingId(tpl.id);
    setName(tpl.name);
    setCategory(tpl.category);
    setLanguage(tpl.language);
    setBody(tpl.body);
    setError(null);
  };

  const insertVariableToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => (prev ? `${prev} ${token}` : token));
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      setError('Template name and message body are required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await updateWhatsAppTemplateApi(editingId, {
          name: name.trim(),
          category,
          language,
          body: body.trim(),
        });
        setTemplates(
          templates.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await createWhatsAppTemplateApi({
          name: name.trim(),
          category,
          language,
          body: body.trim(),
        });
        setTemplates([created, ...templates]);
        setEditingId(created.id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteWhatsAppTemplateApi(id);
      setTemplates(templates.filter((t) => t.id !== id));
      if (editingId === id) {
        startNewTemplate();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
                Dynamic WhatsApp Template Manager
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create reusable English / Hinglish templates with automatic{' '}
                <code className="text-emerald-600 dark:text-emerald-300 font-semibold">
                  {'{{buyer_name}}'}
                </code>{' '}
                &amp;{' '}
                <code className="text-emerald-600 dark:text-emerald-300 font-semibold">
                  {'{{company}}'}
                </code>{' '}
                variables.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
            aria-label="Close template manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Pane: Template Library */}
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/10 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <button
                  type="button"
                  onClick={startNewTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> New Template
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryFilter(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                      categoryFilter === c.id
                        ? 'bg-brand-navy text-white dark:bg-brand-blue'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#111D33] dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  Loading templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No matching templates found. Create one on the right.
                </div>
              ) : (
                filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                      editingId === tpl.id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                        : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111D33] hover:border-brand-blue/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-xs text-brand-navy dark:text-white truncate">
                            {tpl.name}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {tpl.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-brand-blue dark:text-blue-300">
                            {tpl.language}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Used {tpl.usageCount} times ·{' '}
                          {tpl.variables.length > 0
                            ? tpl.variables.map((v) => `{{${v}}}`).join(', ')
                            : 'Static text'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onSelectTemplate && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTemplate(tpl);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" /> Use
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditTemplate(tpl)}
                          title="Edit template"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-white/10"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === tpl.id}
                          onClick={() => handleDelete(tpl.id)}
                          title="Delete template"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 disabled:opacity-50"
                        >
                          {deletingId === tpl.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {tpl.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Pane: Create / Edit Form + Live Preview */}
          <form
            onSubmit={handleSave}
            className="lg:col-span-6 p-5 overflow-y-auto space-y-4 bg-slate-50/70 dark:bg-[#081020]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-slate-200">
                {editingId ? 'Edit Template' : 'Create New Template'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={startNewTemplate}
                  className="text-[11px] font-bold text-brand-blue hover:underline"
                >
                  + Switch to New
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bulk Order Price List & GST Quote"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as WhatsAppTemplateCategory)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as WhatsAppTemplateLanguage)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Message Body
                </label>
                <span className="text-[10px] text-slate-400">
                  Click variable chips below to insert
                </span>
              </div>
              <textarea
                ref={textareaRef}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Namaste {{buyer_name}} ji from {{company}}, sharing updated pricing ({{deal_value}})..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white leading-relaxed focus:outline-none focus:border-brand-blue"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {WHATSAPP_VARIABLE_LIST.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariableToken(v.token)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#14223D] border border-slate-200 dark:border-white/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 transition-colors"
                    title={`${v.label} (e.g. ${v.example})`}
                  >
                    + {v.token}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Variable Preview */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111D33] border border-emerald-200/80 dark:border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Variable Preview
                </span>
                <span className="text-[10px] text-slate-400">
                  {detectedVariables.length} vars detected
                </span>
              </div>
              <p className="text-xs text-brand-navy dark:text-slate-100 whitespace-pre-line leading-relaxed">
                {livePreview || 'Type a message above to preview variable replacement...'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{editingId ? 'Save Changes' : 'Create Template'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

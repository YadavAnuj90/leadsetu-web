'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Loader2,
  MessageSquarePlus,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-client';
import {
  fetchInboxCrmEntitiesApi,
  startOrGetConversationApi,
} from '@/lib/inbox-api';
import { renderWhatsAppTemplate } from '@/lib/whatsapp-templates';
import { useAuthStore } from '@/store/auth.store';
import { useWhatsAppUiStore } from '@/store/whatsapp-ui.store';
import type {
  Conversation,
  InboxCrmEntitiesResponse,
  InboxLinkableEntity,
  LinkedCrmEntityType,
} from '@/types/contracts';

interface StartConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

type EntityTab = 'lead' | 'contact' | 'deal' | 'ticket';

export default function StartConversationModal({
  open,
  onClose,
  onCreated,
}: StartConversationModalProps) {
  const user = useAuthStore((s) => s.user);
  const { templates, loadTemplates } = useWhatsAppUiStore();

  const [mode, setMode] = useState<'crm' | 'manual'>('crm');
  const [entityTab, setEntityTab] = useState<EntityTab>('lead');
  const [search, setSearch] = useState('');
  const [entities, setEntities] = useState<InboxCrmEntitiesResponse>({
    leads: [],
    contacts: [],
    deals: [],
    tickets: [],
  });
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const [selectedEntity, setSelectedEntity] = useState<InboxLinkableEntity | null>(
    null,
  );
  const [contactName, setContactName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Delhi-NCR');
  const [estimatedValue, setEstimatedValue] = useState(0);

  const [initialMessage, setInitialMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadTemplates();
    setSelectedEntity(null);
    setContactName('');
    setCompany('');
    setPhone('');
    setCity('Delhi-NCR');
    setEstimatedValue(0);
    setInitialMessage('');
    setSelectedTemplateId('');
    setError(null);
  }, [open, loadTemplates]);

  useEffect(() => {
    if (!open || mode !== 'crm') return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoadingEntities(true);
      try {
        const res = await fetchInboxCrmEntitiesApi(search);
        if (active) setEntities(res);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setIsLoadingEntities(false);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, mode, search]);

  const currentList = useMemo(() => {
    if (entityTab === 'lead') return entities.leads;
    if (entityTab === 'contact') return entities.contacts;
    if (entityTab === 'deal') return entities.deals;
    return entities.tickets;
  }, [entities, entityTab]);

  if (!open) return null;

  const chooseEntity = (item: InboxLinkableEntity) => {
    setSelectedEntity(item);
    setContactName(item.contactName);
    setCompany(item.company);
    setPhone(item.phone);
    setCity(item.city || 'Delhi-NCR');
    setEstimatedValue(item.estimatedValue || 0);
  };

  const applyTemplate = (tplId: string, body: string) => {
    setSelectedTemplateId(tplId);
    const rendered = renderWhatsAppTemplate(body, {
      buyerName: contactName,
      company,
      dealValue: estimatedValue,
      city,
      phone,
      agentName: user?.name || 'Sales Team',
    });
    setInitialMessage(rendered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() && !phone.trim()) {
      setError('Select a CRM record or enter a buyer name / phone number.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const linkedType: LinkedCrmEntityType =
        mode === 'crm' && selectedEntity ? selectedEntity.type : '';
      const linkedId = mode === 'crm' && selectedEntity ? selectedEntity.id : '';
      const res = await startOrGetConversationApi({
        linkedEntityType: linkedType,
        linkedEntityId: linkedId,
        contactName: contactName.trim(),
        company: company.trim(),
        phone: phone.trim(),
        city: city.trim(),
        estimatedValue,
        channel: 'whatsapp',
        initialMessage: initialMessage.trim() || undefined,
        templateId: selectedTemplateId || undefined,
        via: 'inbox',
        logToTimeline: true,
      });
      onCreated(res.conversation);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                Start New WhatsApp Conversation
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Link directly to a Lead, Contact, Deal, or Ticket, or enter manual details.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#081020]">
            <button
              type="button"
              onClick={() => setMode('crm')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'crm'
                  ? 'bg-white dark:bg-[#1B2B4B] text-brand-navy dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              From CRM Record
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setSelectedEntity(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 ${
                mode === 'manual'
                  ? 'bg-white dark:bg-[#1B2B4B] text-brand-navy dark:text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Manual Contact
            </button>
          </div>

          {mode === 'crm' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Leads, Contacts, Deals, or Tickets..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/10 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-[#081020] p-1 rounded-xl">
                {(
                  [
                    { id: 'lead', label: `Leads (${entities.leads.length})` },
                    { id: 'contact', label: `Contacts (${entities.contacts.length})` },
                    { id: 'deal', label: `Deals (${entities.deals.length})` },
                    { id: 'ticket', label: `Tickets (${entities.tickets.length})` },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEntityTab(t.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      entityTab === t.id
                        ? 'bg-white dark:bg-[#1B2B4B] text-brand-navy dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-brand-navy dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/10">
                {isLoadingEntities ? (
                  <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading CRM records...
                  </div>
                ) : currentList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No matching records found.
                  </div>
                ) : (
                  currentList.map((item) => {
                    const picked =
                      selectedEntity?.id === item.id &&
                      selectedEntity?.type === item.type;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => chooseEntity(item)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors ${
                          picked
                            ? 'bg-emerald-50 dark:bg-emerald-500/15'
                            : 'hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-brand-navy dark:text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sublabel} {item.phone ? `· ${item.phone}` : ''}
                          </div>
                        </div>
                        {picked && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Buyer Name *"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (+91 98...)"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white"
              />
            </div>
          )}

          {/* Optional Starter Message & Templates */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Optional First Message (auto-fills {'{{variables}}'})
              </span>
            </div>
            {templates.filter((t) => t.isActive).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {templates
                  .filter((t) => t.isActive)
                  .map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl.id, tpl.body)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                        selectedTemplateId === tpl.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 dark:bg-[#14223D] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
              </div>
            )}
            <textarea
              rows={3}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Leave empty to just open the thread, or type / pick a template..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {initialMessage.trim() ? 'Create & Send' : 'Open Conversation'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, Search, Unlink, X } from 'lucide-react';
import { getErrorMessage } from '@/lib/api-client';
import { fetchInboxCrmEntitiesApi } from '@/lib/inbox-api';
import type {
  Conversation,
  InboxCrmEntitiesResponse,
  LinkedCrmEntityType,
} from '@/types/contracts';

interface LinkCrmEntityModalProps {
  open: boolean;
  conversation: Conversation | null;
  onClose: () => void;
  onLink: (
    linkedEntityType: LinkedCrmEntityType,
    linkedEntityId?: string,
  ) => Promise<void>;
}

type EntityTab = 'lead' | 'contact' | 'deal' | 'ticket';

export default function LinkCrmEntityModal({
  open,
  conversation,
  onClose,
  onLink,
}: LinkCrmEntityModalProps) {
  const [entityTab, setEntityTab] = useState<EntityTab>('lead');
  const [search, setSearch] = useState('');
  const [entities, setEntities] = useState<InboxCrmEntitiesResponse>({
    leads: [],
    contacts: [],
    deals: [],
    tickets: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchInboxCrmEntitiesApi(search);
        if (active) setEntities(res);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, search]);

  const currentList = useMemo(() => {
    if (entityTab === 'lead') return entities.leads;
    if (entityTab === 'contact') return entities.contacts;
    if (entityTab === 'deal') return entities.deals;
    return entities.tickets;
  }, [entities, entityTab]);

  if (!open || !conversation) return null;

  const handleSelect = async (
    entityType: LinkedCrmEntityType,
    entityId?: string,
  ) => {
    setIsSaving(true);
    setError(null);
    try {
      await onLink(entityType, entityId);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                Link Conversation to CRM Record
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Outbound replies will auto-log to the linked timeline.
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

        <div className="p-5 space-y-3 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {conversation.linkedEntityType && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Currently Linked ({conversation.linkedEntityType})
                </span>
                <span className="font-bold text-brand-navy dark:text-white truncate block">
                  {conversation.linkedEntityLabel || conversation.linkedEntityId}
                </span>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSelect('')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[11px] font-bold hover:bg-rose-100 shrink-0"
              >
                <Unlink className="w-3 h-3" /> Unlink
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Leads, Contacts, Deals, Tickets..."
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

          <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/10">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading CRM records...
              </div>
            ) : currentList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching records found.
              </div>
            ) : (
              currentList.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSelect(item.type, item.id)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between gap-2 transition-colors disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-brand-navy dark:text-white truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.sublabel} {item.phone ? `· ${item.phone}` : ''}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-brand-blue shrink-0">
                    Link →
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

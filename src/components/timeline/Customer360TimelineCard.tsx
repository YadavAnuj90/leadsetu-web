'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import {
  Activity,
  MessageSquare,
  Phone,
  FileText,
  CheckSquare,
  LifeBuoy,
  Briefcase,
  Clock,
  RefreshCw,
  Send,
  ArrowUpRight,
  Loader2,
  UserCheck,
  Building2,
} from 'lucide-react';
import {
  fetchCustomer360TimelineApi,
  addCustomer360TimelineNoteApi,
  TimelineEntityType,
  Timeline360Event,
  Customer360TimelineResponse,
} from '@/lib/timeline-api';
import { getErrorMessage } from '@/lib/api-client';

interface Props {
  entityType: TimelineEntityType;
  entityId: string;
  onActivityAdded?: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All 360° Touchpoints' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'calls', label: 'Calls & Audits' },
  { id: 'invoices', label: 'Quotes & GST Bills' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'tickets', label: 'SLA Tickets' },
  { id: 'notes', label: 'Notes & Stages' },
];

function getCategoryStyle(category: Timeline360Event['category']) {
  if (category === 'whatsapp') {
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
    };
  }
  if (category === 'calls') {
    return {
      bg: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: <Phone className="w-3.5 h-3.5 text-violet-600" />,
    };
  }
  if (category === 'invoices') {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <FileText className="w-3.5 h-3.5 text-amber-600" />,
    };
  }
  if (category === 'tasks') {
    return {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: <CheckSquare className="w-3.5 h-3.5 text-sky-600" />,
    };
  }
  if (category === 'tickets') {
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <LifeBuoy className="w-3.5 h-3.5 text-rose-600" />,
    };
  }
  if (category === 'deals') {
    return {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Briefcase className="w-3.5 h-3.5 text-indigo-600" />,
    };
  }
  return {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Clock className="w-3.5 h-3.5 text-brand-blue" />,
  };
}

export default function Customer360TimelineCard({
  entityType,
  entityId,
  onActivityAdded,
}: Props) {
  const [data, setData] = useState<Customer360TimelineResponse | null>(null);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [noteType, setNoteType] = useState<'note' | 'call' | 'whatsapp'>('note');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load360 = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomer360TimelineApi(entityType, entityId, category);
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, category]);

  useEffect(() => {
    void load360();
  }, [load360]);

  useEffect(() => {
    const onRefresh = () => {
      void load360();
    };
    window.addEventListener('leadsetu:sim-call-logged', onRefresh);
    window.addEventListener('leadsetu:whatsapp-logged', onRefresh);
    return () => {
      window.removeEventListener('leadsetu:sim-call-logged', onRefresh);
      window.removeEventListener('leadsetu:whatsapp-logged', onRefresh);
    };
  }, [load360]);

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || savingNote) return;
    setSavingNote(true);
    setError(null);
    try {
      const updated = await addCustomer360TimelineNoteApi(entityType, entityId, {
        type: noteType,
        description: noteText.trim(),
      });
      setData(updated);
      setNoteText('');
      onActivityAdded?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingNote(false);
    }
  };

  const summary = data?.summary;
  const linked = data?.linkedEntities;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-brand-navy">
                Customer 360° Unified Timeline
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {summary?.totalEvents ?? 0} Omnichannel Events
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregates WhatsApp chats, calls, deals, GST invoices, tasks &amp; SLA tickets matched by +91 phone &amp; ID
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void load360()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync 360°
        </button>
      </div>

      {/* Omnichannel Counter Tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[10px] font-bold uppercase text-emerald-700">
              WhatsApp Chats
            </div>
            <div className="text-lg font-extrabold text-emerald-900 mt-0.5">
              {summary.whatsappCount}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-200/70">
            <div className="text-[10px] font-bold uppercase text-violet-700">
              Calls &amp; Audits
            </div>
            <div className="text-lg font-extrabold text-violet-900 mt-0.5">
              {summary.callsCount}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70">
            <div className="text-[10px] font-bold uppercase text-amber-800">
              Quotes &amp; Invoices
            </div>
            <div className="text-lg font-extrabold text-amber-900 mt-0.5">
              {summary.invoicesCount}{' '}
              {summary.totalInvoicedInr > 0 && (
                <span className="text-xs font-bold">
                  (₹{summary.totalInvoicedInr.toLocaleString('en-IN')})
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/70">
            <div className="text-[10px] font-bold uppercase text-sky-700">
              Tasks &amp; SLA Tickets
            </div>
            <div className="text-lg font-extrabold text-sky-900 mt-0.5">
              {summary.tasksCount + summary.ticketsCount}
            </div>
          </div>
        </div>
      )}

      {/* Cross-Linked Records Strip (Jump between Lead <-> Contact <-> Deal) */}
      {linked &&
        (linked.leads.length > 0 ||
          linked.contacts.length > 0 ||
          linked.deals.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1">
              Linked 360° Records:
            </span>
            {linked.leads.map((l) => (
              <Link
                key={`lead-${l.id}`}
                href={`/leads/${l.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-brand-navy font-bold"
              >
                <UserCheck className="w-3 h-3 text-brand-blue" />
                <span>Lead: {l.name}</span>
                <span className="text-[10px] uppercase text-slate-400">
                  ({l.status})
                </span>
              </Link>
            ))}
            {linked.contacts.map((c) => (
              <Link
                key={`contact-${c.id}`}
                href={`/contacts/${c.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-brand-navy font-bold"
              >
                <Building2 className="w-3 h-3 text-emerald-600" />
                <span>Contact: {c.company || c.name}</span>
              </Link>
            ))}
            {linked.deals.map((d) => (
              <Link
                key={`deal-${d.id}`}
                href={`/deals/${d.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-brand-navy font-bold"
              >
                <Briefcase className="w-3 h-3 text-indigo-600" />
                <span>Deal: {d.title}</span>
                <span className="text-[10px] font-extrabold text-emerald-600">
                  ₹{d.value.toLocaleString('en-IN')}
                </span>
              </Link>
            ))}
          </div>
        )}

      {/* Quick Inline Logger */}
      <form
        onSubmit={handleAddNote}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <select
          value={noteType}
          onChange={(e) =>
            setNoteType(e.target.value as 'note' | 'call' | 'whatsapp')
          }
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy bg-slate-50"
        >
          <option value="note">📝 Note</option>
          <option value="call">📞 Call Log</option>
          <option value="whatsapp">💬 WhatsApp Note</option>
        </select>
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a quick note, call summary, or follow-up update to the 360° timeline..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
        />
        <button
          type="submit"
          disabled={savingNote || !noteText.trim()}
          className="btn-primary-brand inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
        >
          {savingNote ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Log Activity
        </button>
      </form>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              category === tab.id
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
          {error}
        </div>
      )}

      {/* Chronological Feed */}
      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          <span>Aggregating Customer 360° touchpoints...</span>
        </div>
      ) : !data || data.events.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No activities found in this category yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
          {data.events.map((ev) => {
            const st = getCategoryStyle(ev.category);
            return (
              <div
                key={ev.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${st.bg}`}
                >
                  {st.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-brand-navy">
                        {ev.title}
                      </span>
                      {ev.badgeText && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                          {ev.badgeText}
                        </span>
                      )}
                    </div>

                    {ev.linkHref && (
                      <Link
                        href={ev.linkHref}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand-blue hover:underline"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500">
                      {ev.actorName}
                    </span>
                    <span>·</span>
                    <span className="uppercase text-[10px] font-bold text-slate-400">
                      {ev.sourceModule}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(ev.occurredAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

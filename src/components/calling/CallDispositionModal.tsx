'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import {
  X,
  FileText,
  Tag,
  CheckCircle2,
  CalendarPlus,
  Loader2,
  Search,
  Link2,
  Smartphone,
} from 'lucide-react';
import {
  fetchCallCrmEntitiesApi,
  logSimCallApi,
  saveCallDispositionApi,
  type CrmLinkableEntity,
} from '@/lib/calls-api';
import { formatCallDuration, useCallUiStore } from '@/store/call-ui.store';

export const CALL_OUTCOME_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'interested', label: 'Interested' },
  { id: 'rnr', label: 'RNR (No Answer)' },
  { id: 'busy', label: 'Busy' },
  { id: 'callback', label: 'Callback Scheduled' },
  { id: 'not_interested', label: 'Not Interested' },
  { id: 'dnd', label: 'DND / Do Not Call' },
  { id: 'quote_discussed', label: 'Quote Discussed' },
  { id: 'followup_requested', label: 'Follow-up Requested' },
  { id: 'support_resolved', label: 'Support Resolved' },
  { id: 'escalated', label: 'Escalated' },
];

export default function CallDispositionModal() {
  const { dispositionModalCall, setDispositionModalCall, handlers } =
    useCallUiStore();

  const [entityType, setEntityType] = useState<
    '' | 'lead' | 'deal' | 'ticket' | 'contact'
  >('');
  const [entityId, setEntityId] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [crmEntities, setCrmEntities] = useState<{
    leads: CrmLinkableEntity[];
    deals: CrmLinkableEntity[];
    tickets: CrmLinkableEntity[];
    contacts: CrmLinkableEntity[];
  }>({ leads: [], deals: [], tickets: [], contacts: [] });
  const [loadingEntities, setLoadingEntities] = useState(false);

  const [simStatus, setSimStatus] = useState<'completed' | 'missed' | 'rejected'>(
    'completed',
  );
  const [simDurationSec, setSimDurationSec] = useState(0);
  const [outcomeTag, setOutcomeTag] = useState('');
  const [notes, setNotes] = useState('');
  const [createTask, setCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>(
    'high',
  );
  const [taskCategory, setTaskCategory] = useState<
    'call' | 'whatsapp' | 'meeting' | 'quote' | 'followup'
  >('call');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const isSimMode = dispositionModalCall?.mode === 'sim';

  useEffect(() => {
    if (!dispositionModalCall) return;
    setEntityType(dispositionModalCall.linkedEntityType || '');
    setEntityId(dispositionModalCall.linkedEntityId || '');
    setEntitySearch('');
    setSimStatus(dispositionModalCall.simStatus || 'completed');
    setSimDurationSec(Math.max(0, dispositionModalCall.durationSeconds || 0));
    setOutcomeTag(dispositionModalCall.outcomeTag || '');
    setNotes(dispositionModalCall.notes || '');
    setCreateTask(false);
    setTaskTitle(`Follow up with ${dispositionModalCall.peerName}`);
    setTaskPriority('high');
    setTaskCategory('call');
    setTaskDueDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    setError(null);
    setSavedNotice(null);
  }, [dispositionModalCall]);

  useEffect(() => {
    if (!dispositionModalCall) return;
    let active = true;
    setLoadingEntities(true);
    fetchCallCrmEntitiesApi(entitySearch.trim() || undefined)
      .then((res) => {
        if (!active) return;
        setCrmEntities(res);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingEntities(false);
      });
    return () => {
      active = false;
    };
  }, [dispositionModalCall, entitySearch]);

  const activeList = useMemo(() => {
    if (entityType === 'lead') return crmEntities.leads;
    if (entityType === 'deal') return crmEntities.deals;
    if (entityType === 'ticket') return crmEntities.tickets;
    if (entityType === 'contact') return crmEntities.contacts;
    return [];
  }, [crmEntities, entityType]);

  if (!dispositionModalCall) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const commonPayload = {
        linkedEntityType: entityType,
        linkedEntityId: entityType ? entityId : '',
        outcomeTag,
        notes: notes.trim(),
        createFollowUpTask: createTask && Boolean(taskTitle.trim()),
        taskTitle: taskTitle.trim(),
        taskPriority,
        taskCategory,
        taskDueDate,
      };

      if (isSimMode) {
        await logSimCallApi({
          ...commonPayload,
          contactName: dispositionModalCall.peerName,
          customerPhone: dispositionModalCall.customerPhone || '',
          status: simStatus,
          durationSeconds: simStatus === 'completed' ? simDurationSec : 0,
        });
      } else {
        await saveCallDispositionApi(dispositionModalCall.callId, commonPayload);
      }

      setSavedNotice('Call outcome, notes, and CRM timeline updated!');
      void handlers?.refreshHistory();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('leadsetu:sim-call-logged', {
            detail: { entityType, entityId },
          }),
        );
      }
      setTimeout(() => {
        setDispositionModalCall(null);
      }, 650);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save call disposition.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-black text-brand-navy dark:text-white flex items-center gap-2">
              {isSimMode ? (
                <Smartphone className="w-4 h-4 text-emerald-500" />
              ) : (
                <FileText className="w-4 h-4 text-brand-blue" />
              )}
              {isSimMode
                ? 'Log Mobile SIM Call & CRM Disposition'
                : 'Post-Call Notes & CRM Disposition'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Call with <strong>{dispositionModalCall.peerName}</strong>
              {dispositionModalCall.customerPhone
                ? ` (${dispositionModalCall.customerPhone})`
                : ''}
              {!isSimMode && dispositionModalCall.durationSeconds > 0
                ? ` · ${formatCallDuration(dispositionModalCall.durationSeconds)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDispositionModalCall(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[82vh] overflow-y-auto"
        >
          {isSimMode && (
            <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-brand-navy dark:text-white">
                  SIM Call Result
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'completed', label: 'Connected / Answered' },
                      { id: 'missed', label: 'No Answer' },
                      { id: 'rejected', label: 'Busy / Declined' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSimStatus(st.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                        simStatus === st.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {simStatus === 'completed' && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Estimated Call Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={36000}
                    value={simDurationSec}
                    onChange={(e) =>
                      setSimDurationSec(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-28 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-brand-navy dark:text-white text-right"
                  />
                </div>
              )}
            </div>
          )}

          {/* 1. Link to Lead / Contact / Deal / Ticket */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-brand-blue" />
              Link Call &amp; Save Activity to CRM Timeline
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: '', label: 'None / Internal' },
                  { id: 'lead', label: `Lead (${crmEntities.leads.length})` },
                  {
                    id: 'contact',
                    label: `Contact (${crmEntities.contacts.length})`,
                  },
                  { id: 'deal', label: `Deal (${crmEntities.deals.length})` },
                  {
                    id: 'ticket',
                    label: `Ticket (${crmEntities.tickets.length})`,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id || 'none'}
                  type="button"
                  onClick={() => {
                    setEntityType(t.id);
                    setEntityId('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    entityType === t.id
                      ? 'bg-brand-navy text-white border-brand-navy dark:bg-brand-blue dark:border-brand-blue'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-blue'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {entityType && (
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={entitySearch}
                    onChange={(e) => setEntitySearch(e.target.value)}
                    placeholder={`Search ${entityType}s by name, company, or phone...`}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {loadingEntities ? (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading {entityType}s...
                  </div>
                ) : (
                  <select
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="">
                      {activeList.length === 0
                        ? `No ${entityType}s found`
                        : `-- Select ${entityType} record --`}
                    </option>
                    {activeList.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.label} {ent.sublabel ? `· ${ent.sublabel}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* 2. Outcome Tag Pills */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-blue" />
              Call Outcome Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CALL_OUTCOME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setOutcomeTag((prev) => (prev === opt.id ? '' : opt.id))
                  }
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                    outcomeTag === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Call Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-brand-navy dark:text-white">
              Call Notes &amp; Summary
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write key discussion points, pricing agreed, customer objection, or next steps..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue"
            />
          </div>

          {/* 4. Optional Follow-up Task Creator */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="text-xs font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4 text-brand-blue" />
                Create Follow-up Task in CRM
              </span>
              <input
                type="checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600"
              />
            </label>

            {createTask && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Send revised quotation on WhatsApp)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(
                        e.target.value as 'high' | 'medium' | 'low',
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={taskCategory}
                    onChange={(e) =>
                      setTaskCategory(
                        e.target.value as
                          | 'call'
                          | 'whatsapp'
                          | 'meeting'
                          | 'quote'
                          | 'followup',
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white"
                  >
                    <option value="call">Call</option>
                    <option value="followup">Follow-up</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="quote">Quote</option>
                    <option value="meeting">Meeting</option>
                  </select>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-brand-navy dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          {savedNotice && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setDispositionModalCall(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Call Notes &amp; Outcome</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

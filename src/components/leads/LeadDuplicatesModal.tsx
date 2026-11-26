'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Crown,
  GitMerge,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  DuplicateLeadCandidate,
  DuplicateLeadGroup,
  LeadSource,
  LeadStatus,
  MergeLeadsPayload,
} from '@/types/contracts';
import {
  fetchDuplicateLeadsApi,
  mergeDuplicateLeadsApi,
} from '@/lib/leads-capture-api';

interface LeadDuplicatesModalProps {
  onClose: () => void;
  onMerged: () => Promise<void> | void;
}

type MergeFieldKey =
  | 'name'
  | 'company'
  | 'phone'
  | 'email'
  | 'city'
  | 'source'
  | 'status'
  | 'estimatedValue'
  | 'notes';

const MERGE_FIELDS: Array<{
  key: MergeFieldKey;
  label: string;
}> = [
  { key: 'name', label: 'Buyer Name' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone (+91)' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'source', label: 'Lead Source' },
  { key: 'status', label: 'Stage' },
  { key: 'estimatedValue', label: 'Est. Value (₹)' },
  { key: 'notes', label: 'Notes' },
];

function getFieldValue(
  lead: DuplicateLeadCandidate,
  key: MergeFieldKey,
): string | number {
  switch (key) {
    case 'name':
      return lead.name || '';
    case 'company':
      return lead.company || '';
    case 'phone':
      return lead.phone || '';
    case 'email':
      return lead.email || '';
    case 'city':
      return lead.city || '';
    case 'source':
      return lead.source || 'manual';
    case 'status':
      return lead.status || 'new';
    case 'estimatedValue':
      return Number(lead.estimatedValue || 0);
    case 'notes':
      return lead.notes || '';
  }
}

export default function LeadDuplicatesModal({
  onClose,
  onMerged,
}: LeadDuplicatesModalProps) {
  const [groups, setGroups] = useState<DuplicateLeadGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [primaryId, setPrimaryId] = useState<string>('');
  const [fieldSources, setFieldSources] = useState<Record<MergeFieldKey, string>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    city: '',
    source: '',
    status: '',
    estimatedValue: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const initializeSelectionForGroup = useCallback((group: DuplicateLeadGroup) => {
    setSelectedGroupId(group.groupId);
    const masterId = group.suggestedPrimaryId || group.leads[0]?.id || '';
    setPrimaryId(masterId);

    const masterLead =
      group.leads.find((l) => l.id === masterId) || group.leads[0];
    const nextSources = {} as Record<MergeFieldKey, string>;

    for (const f of MERGE_FIELDS) {
      if (f.key === 'estimatedValue') {
        const highest = [...group.leads].sort(
          (a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0),
        )[0];
        nextSources[f.key] = highest?.id || masterId;
        continue;
      }
      const masterVal = masterLead ? String(getFieldValue(masterLead, f.key)).trim() : '';
      if (masterVal) {
        nextSources[f.key] = masterId;
      } else {
        const firstNonEmpty = group.leads.find(
          (l) => String(getFieldValue(l, f.key)).trim() !== '',
        );
        nextSources[f.key] = firstNonEmpty?.id || masterId;
      }
    }
    setFieldSources(nextSources);
  }, []);

  const loadDuplicates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDuplicateLeadsApi();
      const loadedGroups = res.groups || [];
      setGroups(loadedGroups);
      if (loadedGroups.length > 0) {
        initializeSelectionForGroup(loadedGroups[0]);
      } else {
        setSelectedGroupId('');
        setPrimaryId('');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to scan for duplicate leads.',
      );
    } finally {
      setLoading(false);
    }
  }, [initializeSelectionForGroup]);

  useEffect(() => {
    void loadDuplicates();
  }, [loadDuplicates]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.groupId === selectedGroupId) || groups[0] || null,
    [groups, selectedGroupId],
  );

  const handleSelectGroup = (group: DuplicateLeadGroup) => {
    setBannerMsg(null);
    initializeSelectionForGroup(group);
  };

  const handleSelectPrimary = (newPrimaryId: string) => {
    setPrimaryId(newPrimaryId);
    if (!activeGroup) return;
    const newMaster = activeGroup.leads.find((l) => l.id === newPrimaryId);
    if (!newMaster) return;

    setFieldSources((prev) => {
      const updated = { ...prev };
      for (const f of MERGE_FIELDS) {
        if (f.key === 'estimatedValue') continue;
        const val = String(getFieldValue(newMaster, f.key)).trim();
        if (val) updated[f.key] = newPrimaryId;
      }
      return updated;
    });
  };

  const handleMergeGroup = async () => {
    if (!activeGroup || !primaryId) return;
    const secondaryIds = activeGroup.leads
      .map((l) => l.id)
      .filter((id) => id !== primaryId);

    if (secondaryIds.length === 0) return;

    setMerging(true);
    setError(null);
    setBannerMsg(null);

    try {
      const findSourceLead = (key: MergeFieldKey) =>
        activeGroup.leads.find((l) => l.id === fieldSources[key]) ||
        activeGroup.leads.find((l) => l.id === primaryId) ||
        activeGroup.leads[0];

      const fieldOverrides: MergeLeadsPayload['fieldOverrides'] = {
        name: String(getFieldValue(findSourceLead('name'), 'name')),
        company: String(getFieldValue(findSourceLead('company'), 'company')),
        phone: String(getFieldValue(findSourceLead('phone'), 'phone')),
        email: String(getFieldValue(findSourceLead('email'), 'email')),
        city: String(getFieldValue(findSourceLead('city'), 'city')),
        source: String(getFieldValue(findSourceLead('source'), 'source')) as LeadSource,
        status: String(getFieldValue(findSourceLead('status'), 'status')) as LeadStatus,
        estimatedValue: Number(
          getFieldValue(findSourceLead('estimatedValue'), 'estimatedValue'),
        ),
        notes: String(getFieldValue(findSourceLead('notes'), 'notes')),
      };

      const res = await mergeDuplicateLeadsApi({
        primaryId,
        secondaryIds,
        fieldOverrides,
      });

      const repointTotal = Object.values(res.repointedCounts || {}).reduce(
        (acc, n) => acc + (Number(n) || 0),
        0,
      );

      setBannerMsg(
        `Merged ${res.mergedCount} duplicate record(s) into "${res.primaryLead.name}"${
          repointTotal > 0 ? ` · repointed ${repointTotal} linked records` : ''
        }.`,
      );

      await onMerged();
      await loadDuplicates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to merge duplicate leads.',
      );
    } finally {
      setMerging(false);
    }
  };

  const combinedStats = useMemo(() => {
    if (!activeGroup) return null;
    const totalActivities = activeGroup.leads.reduce(
      (acc, l) => acc + (l.activitiesCount || l.activities?.length || 0),
      0,
    );
    const totalDeals = activeGroup.leads.reduce(
      (acc, l) => acc + (l.dealsCount || 0),
      0,
    );
    const totalTasks = activeGroup.leads.reduce(
      (acc, l) => acc + (l.tasksCount || 0),
      0,
    );
    const tagCount = new Set(
      activeGroup.leads.flatMap((l) => l.tags || []),
    ).size;
    return { totalActivities, totalDeals, totalTasks, tagCount };
  }, [activeGroup]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-slate-100">
                Duplicate Lead Detector &amp; Side-by-Side Merge
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Finds matching +91 phone numbers or emails and merges timelines, deals, tasks, and custom fields into one master lead.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadDuplicates()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-scan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(error || bannerMsg) && (
          <div className="px-6 pt-4 space-y-2">
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {bannerMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bannerMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
              <p className="text-xs font-semibold text-slate-500">
                Scanning leads for matching +91 phone numbers and emails...
              </p>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-14 max-w-md mx-auto text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-brand-navy dark:text-white">
                Zero Duplicate Leads Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every lead in your current workspace view has a unique normalized +91 phone number and email address.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Sidebar: Duplicate Clusters */}
              <div className="lg:col-span-4 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {groups.length} Duplicate Cluster{groups.length === 1 ? '' : 's'} Found
                </div>
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {groups.map((g) => {
                    const isSelected = activeGroup?.groupId === g.groupId;
                    return (
                      <button
                        key={g.groupId}
                        type="button"
                        onClick={() => handleSelectGroup(g)}
                        className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-brand-blue bg-blue-50/70 shadow-sm dark:border-blue-500/60 dark:bg-blue-500/15'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-navy dark:text-slate-100 truncate">
                            {g.matchReason === 'email' ? (
                              <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            ) : (
                              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate">{g.matchKey}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            {g.leads.length} leads
                          </span>
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {g.leads.map((l) => l.name).join(' · ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Side-by-Side Merge Table */}
              {activeGroup && (
                <div className="lg:col-span-8 space-y-4">
                  {/* Master Selector Header */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3 px-3.5 w-36 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Field
                          </th>
                          {activeGroup.leads.map((lead, idx) => {
                            const isMaster = lead.id === primaryId;
                            return (
                              <th key={lead.id} className="py-3 px-3.5 min-w-[200px] align-top">
                                <button
                                  type="button"
                                  onClick={() => handleSelectPrimary(lead.id)}
                                  className={`w-full rounded-xl border p-2.5 text-left transition-all ${
                                    isMaster
                                      ? 'border-emerald-400 bg-emerald-50/80 dark:border-emerald-500/60 dark:bg-emerald-500/15'
                                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-navy dark:text-slate-100">
                                      <Crown
                                        className={`w-3.5 h-3.5 ${
                                          isMaster ? 'text-emerald-600' : 'text-slate-400'
                                        }`}
                                      />
                                      {isMaster ? 'Master Record' : `Duplicate #${idx + 1}`}
                                    </span>
                                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                      AI {lead.aiScore}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                    Owner: {lead.ownerName || 'Rep'} ·{' '}
                                    {lead.activitiesCount || 0} notes · {lead.dealsCount || 0} deals
                                  </div>
                                </button>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {MERGE_FIELDS.map((field) => (
                          <tr key={field.key}>
                            <td className="py-2.5 px-3.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/30">
                              {field.label}
                            </td>
                            {activeGroup.leads.map((lead) => {
                              const rawVal = getFieldValue(lead, field.key);
                              const displayVal =
                                field.key === 'estimatedValue'
                                  ? `₹${Number(rawVal || 0).toLocaleString('en-IN')}`
                                  : String(rawVal || '').trim() || '—';
                              const isPicked = fieldSources[field.key] === lead.id;

                              return (
                                <td key={`${field.key}-${lead.id}`} className="py-2 px-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFieldSources((prev) => ({
                                        ...prev,
                                        [field.key]: lead.id,
                                      }))
                                    }
                                    className={`w-full flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                                      isPicked
                                        ? 'border-brand-blue bg-blue-50/70 text-brand-navy font-semibold dark:border-blue-500/60 dark:bg-blue-500/15 dark:text-white'
                                        : 'border-slate-200/80 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    <span className="truncate max-w-[190px]">
                                      {displayVal}
                                    </span>
                                    {isPicked && (
                                      <Check className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Preserved History & Merge CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10 p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Zero-Loss History Combine</span>
                      </div>
                      <p className="text-[11px] text-emerald-800/85 dark:text-emerald-200/80">
                        Combines{' '}
                        <strong>{combinedStats?.totalActivities || 0} timeline events</strong>,{' '}
                        <strong>{combinedStats?.totalDeals || 0} deals</strong>,{' '}
                        <strong>{combinedStats?.totalTasks || 0} tasks</strong>, and{' '}
                        <strong>{combinedStats?.tagCount || 0} tags</strong> (plus calls, WhatsApp threads &amp; invoices) into Master.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={merging || !primaryId}
                      onClick={() => void handleMergeGroup()}
                      className="btn-primary-brand shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                    >
                      {merging ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <GitMerge className="w-4 h-4" />
                      )}
                      <span>Merge into Master Record</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

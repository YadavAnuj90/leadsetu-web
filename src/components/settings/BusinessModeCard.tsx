'use client';

import { useEffect, useState } from 'react';
import { Check, Layers, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  BUSINESS_MODE_OPTIONS,
  DEFAULT_HIDDEN_MODULES_BY_MODE,
  WORKSPACE_NAV_MODULES,
  getBusinessModeMeta,
  getSegmentCopy,
  normalizeWorkspaceBusinessMode,
} from '@/lib/business-modes';
import { applyModePresetPipelineApi } from '@/lib/pipelines-api';
import { updateCurrentTenantApi } from '@/lib/tenants-api';
import { getErrorMessage } from '@/lib/api-client';
import type { WorkspaceBusinessMode } from '@/types/contracts';

interface BusinessModeCardProps {
  onUpdated?: () => Promise<void> | void;
}

export default function BusinessModeCard({ onUpdated }: BusinessModeCardProps) {
  const { user, tenant, updateProfile } = useAuthStore();

  const [selectedMode, setSelectedMode] = useState<WorkspaceBusinessMode>(() =>
    normalizeWorkspaceBusinessMode(tenant?.businessMode),
  );
  const [hiddenModules, setHiddenModules] = useState<string[]>(() =>
    Array.isArray(tenant?.hiddenNavModules)
      ? tenant.hiddenNavModules
      : DEFAULT_HIDDEN_MODULES_BY_MODE[normalizeWorkspaceBusinessMode(tenant?.businessMode)],
  );
  const [syncPipelineStages, setSyncPipelineStages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const mode = normalizeWorkspaceBusinessMode(tenant?.businessMode);
    setSelectedMode(mode);
    setHiddenModules(
      Array.isArray(tenant?.hiddenNavModules)
        ? tenant.hiddenNavModules
        : DEFAULT_HIDDEN_MODULES_BY_MODE[mode],
    );
  }, [tenant?.businessMode, tenant?.hiddenNavModules]);

  const handleModeSelect = (mode: WorkspaceBusinessMode) => {
    setSelectedMode(mode);
    setHiddenModules([...(DEFAULT_HIDDEN_MODULES_BY_MODE[mode] || [])]);
    setNotice(null);
  };

  const toggleModuleVisibility = (feature: string) => {
    setHiddenModules((prev) =>
      prev.includes(feature) ? prev.filter((item) => item !== feature) : [...prev, feature],
    );
    setNotice(null);
  };

  const handleResetDefaults = () => {
    setHiddenModules([...(DEFAULT_HIDDEN_MODULES_BY_MODE[selectedMode] || [])]);
    setNotice(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateCurrentTenantApi({
        businessMode: selectedMode,
        hiddenNavModules: hiddenModules,
      });
      let pipelineNotice = '';
      if (syncPipelineStages) {
        const synced = await applyModePresetPipelineApi(selectedMode).catch(() => null);
        if (synced?.pipeline?.name) {
          pipelineNotice = ` Pipeline "${synced.pipeline.name}" stages applied cleanly.`;
        }
      }
      if (user) {
        updateProfile({
          user,
          tenant: updated.tenant,
        });
      }
      if (onUpdated) {
        await onUpdated();
      }
      const meta = getBusinessModeMeta(selectedMode);
      setNotice({
        type: 'ok',
        text: `Workspace switched to ${meta.label}. Sidebar, Leads & Billing terminology updated immediately.${pipelineNotice}`,
      });
    } catch (err) {
      setNotice({
        type: 'err',
        text: getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const activeMeta = getBusinessModeMeta(selectedMode);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">
            <Layers className="w-3.5 h-3.5" /> Multi-Segment Workspace Engine
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy">
            Business Model &amp; Module Terminology
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Tailor Leadsetu sidebar names and visible tools for your exact workflow—B2B wholesale,
            small MSME, B2C retail/D2C, Hybrid, BPO calling, or Education admissions—with zero feature loss.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
          <Sparkles className="w-3.5 h-3.5" />
          Active: {activeMeta.shortBadge}
        </span>
      </div>

      {/* 6 Segment Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BUSINESS_MODE_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleModeSelect(option.id)}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'border-brand-blue bg-brand-light/70 shadow-sm ring-2 ring-brand-blue/15'
                  : 'border-slate-200/80 hover:border-brand-blue/40 hover:bg-slate-50/70'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-brand-blue text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {option.shortBadge}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="text-sm font-extrabold text-brand-navy">
                  {option.label}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {option.tagline}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200/60">
                {option.highlights.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Fine-Grained Sidebar Module Visibility */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-extrabold text-brand-navy">
              Visible Sidebar Modules for {activeMeta.shortBadge}
            </div>
            <p className="text-[11px] text-slate-500">
              Uncheck unused tools to keep your team&apos;s navigation clean. Re-enable anytime without losing data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:text-brand-navy"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Mode Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {WORKSPACE_NAV_MODULES.map((mod) => {
            const visible = !hiddenModules.includes(mod.feature);
            return (
              <label
                key={mod.feature}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  visible
                    ? 'bg-white border-slate-200/90'
                    : 'bg-slate-100/70 border-slate-200/50 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleModuleVisibility(mod.feature)}
                  className="mt-0.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-brand-navy truncate">
                    {mod.label}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug">
                    {mod.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-blue/30 bg-brand-light/40 dark:bg-slate-900/80 p-3.5 flex items-start gap-3">
        <input
          id="sync-pipeline-stages"
          type="checkbox"
          checked={syncPipelineStages}
          onChange={(e) => setSyncPipelineStages(e.target.checked)}
          className="mt-1 rounded border-slate-300 dark:border-slate-600 text-brand-blue focus:ring-brand-blue"
        />
        <label htmlFor="sync-pipeline-stages" className="cursor-pointer space-y-0.5">
          <div className="text-xs font-extrabold text-brand-navy dark:text-white">
            Auto-sync default Kanban stages for {activeMeta.shortBadge}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            Stages: <span className="font-semibold text-brand-navy dark:text-sky-300">{getSegmentCopy(selectedMode).pipelineStageSummary}</span>
          </div>
        </label>
      </div>

      {notice && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Apply Business Mode &amp; Navigation</span>
        </button>
      </div>
    </section>
  );
}

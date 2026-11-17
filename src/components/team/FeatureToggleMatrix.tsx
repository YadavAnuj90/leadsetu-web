'use client';

import { Lock, CheckCircle2 } from 'lucide-react';
import {
  DEFAULT_USER_FEATURE_MAP,
  getRoleDefaultFeatures,
  USER_FEATURE_CATALOG,
} from '@/lib/feature-access';
import type { UserFeatureKey } from '@/types/contracts';

interface FeatureToggleMatrixProps {
  value: Record<UserFeatureKey, boolean>;
  onChange: (next: Record<UserFeatureKey, boolean>) => void;
  workspaceFeatures?: Record<string, boolean>;
  roleLabel?: string;
}

const CATEGORIES: Array<'Core CRM' | 'Omnichannel & AI' | 'Revenue & Operations'> = [
  'Core CRM',
  'Omnichannel & AI',
  'Revenue & Operations',
];

export default function FeatureToggleMatrix({
  value,
  onChange,
  workspaceFeatures,
  roleLabel,
}: FeatureToggleMatrixProps) {
  const isWorkspaceAllowed = (key: UserFeatureKey) =>
    !workspaceFeatures || workspaceFeatures[key] === undefined
      ? true
      : Boolean(workspaceFeatures[key]);

  const applyPreset = (map: Record<UserFeatureKey, boolean>) => {
    const clamped = { ...map };
    for (const item of USER_FEATURE_CATALOG) {
      if (!isWorkspaceAllowed(item.key)) clamped[item.key] = false;
    }
    onChange(clamped);
  };

  const toggleKey = (key: UserFeatureKey) => {
    if (!isWorkspaceAllowed(key)) return;
    onChange({
      ...value,
      [key]: !value[key],
    });
  };

  const enabledCount = USER_FEATURE_CATALOG.filter(
    (item) => isWorkspaceAllowed(item.key) && Boolean(value[item.key]),
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
          <span>
            Assigned Modules{roleLabel ? ` (${roleLabel})` : ''}:{' '}
            <span className="text-brand-blue font-extrabold">
              {enabledCount}/{USER_FEATURE_CATALOG.length} ON
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset(getRoleDefaultFeatures('manager'))}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-brand-blue"
          >
            Manager Preset
          </button>
          <button
            type="button"
            onClick={() => applyPreset(getRoleDefaultFeatures('agent'))}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-brand-blue"
          >
            User Rep Preset
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ ...DEFAULT_USER_FEATURE_MAP })}
            className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
          >
            All ON
          </button>
          <button
            type="button"
            onClick={() => {
              const none = { ...DEFAULT_USER_FEATURE_MAP };
              for (const k of Object.keys(none) as UserFeatureKey[]) none[k] = false;
              applyPreset(none);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {CATEGORIES.map((category) => {
          const items = USER_FEATURE_CATALOG.filter((i) => i.category === category);
          return (
            <div key={category} className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {category}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => {
                  const allowed = isWorkspaceAllowed(item.key);
                  const on = allowed && Boolean(value[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={!allowed}
                      onClick={() => toggleKey(item.key)}
                      className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        !allowed
                          ? 'opacity-55 cursor-not-allowed bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                          : on
                            ? 'bg-brand-light/70 dark:bg-brand-blue/15 border-brand-blue/40 dark:border-sky-400/40'
                            : 'bg-white dark:bg-[#0D1628] border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-brand-navy dark:text-slate-100 truncate flex items-center gap-1">
                          {item.label}
                          {!allowed && <Lock className="w-3 h-3 text-rose-500 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {allowed ? item.description : 'Unavailable on workspace plan'}
                        </div>
                      </div>
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          !allowed
                            ? 'bg-slate-200 dark:bg-slate-700'
                            : on
                              ? 'bg-emerald-500'
                              : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            on ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

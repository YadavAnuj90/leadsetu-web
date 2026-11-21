'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Save,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useCustomFields } from '@/hooks/useCustomFields';
import CustomFieldsInputs from './CustomFieldsInputs';
import type { CustomFieldEntity } from '@/types/contracts';

interface CustomFieldsDisplayCardProps {
  entity: CustomFieldEntity;
  values?: Record<string, unknown>;
  onSave: (nextValues: Record<string, unknown>) => Promise<void>;
}

export default function CustomFieldsDisplayCard({
  entity,
  values = {},
  onSave,
}: CustomFieldsDisplayCardProps) {
  const { fields, isLoading } = useCustomFields(entity);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(values || {});
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(values || {});
  }, [values]);

  const activeFields = fields.filter((f) => f.isActive !== false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="bg-white dark:bg-[#0D172B] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-blue dark:text-sky-400" />
          <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
            Custom Industry Fields
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {activeFields.length > 0 && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
          <Link
            href="/settings/custom-fields"
            className="text-[11px] font-bold text-brand-blue dark:text-sky-400 hover:underline"
          >
            Configure
          </Link>
        </div>
      </div>

      {activeFields.length === 0 ? (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between gap-3">
          <span>
            No custom fields configured for {entity}s yet (e.g. MOQ, Credit Days, Drug License No.).
          </span>
          <Link
            href="/settings/custom-fields"
            className="px-3 py-1.5 rounded-xl bg-brand-light text-brand-blue font-bold flex-shrink-0 hover:bg-brand-blue hover:text-white transition-colors"
          >
            + Add Fields
          </Link>
        </div>
      ) : editing ? (
        <div className="space-y-3">
          <CustomFieldsInputs
            fields={activeFields}
            values={draft}
            onChange={setDraft}
            title={`Edit ${entity} custom fields`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(values || {});
                setEditing(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Fields</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {activeFields.map((field) => {
            const val = values?.[field.key];
            const display =
              val === undefined || val === null || val === ''
                ? '—'
                : field.type === 'checkbox'
                  ? val
                    ? 'Yes'
                    : 'No'
                  : String(val);

            return (
              <div
                key={field.id}
                className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {field.label}
                </div>
                <div className="text-xs sm:text-sm font-bold text-brand-navy dark:text-white mt-0.5 truncate">
                  {display}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

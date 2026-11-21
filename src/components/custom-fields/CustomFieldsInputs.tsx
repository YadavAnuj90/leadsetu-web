'use client';

import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import type { CustomFieldDef } from '@/types/contracts';

interface CustomFieldsInputsProps {
  fields: CustomFieldDef[];
  values: Record<string, unknown>;
  onChange: (nextValues: Record<string, unknown>) => void;
  title?: string;
}

export default function CustomFieldsInputs({
  fields,
  values,
  onChange,
  title = 'Custom Industry Fields',
}: CustomFieldsInputsProps) {
  const activeFields = fields.filter((f) => f.isActive !== false);
  if (activeFields.length === 0) return null;

  const setFieldValue = (key: string, val: unknown) => {
    onChange({
      ...values,
      [key]: val,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue dark:text-sky-400 inline-flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" /> {title}
        </span>
        <Link
          href="/settings/custom-fields"
          className="text-[11px] font-bold text-slate-500 hover:text-brand-blue hover:underline"
        >
          Manage Fields
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeFields.map((field) => {
          const rawVal = values[field.key];
          const strVal =
            rawVal !== undefined && rawVal !== null
              ? String(rawVal)
              : field.defaultValue !== undefined && field.defaultValue !== null
                ? String(field.defaultValue)
                : '';

          if (field.type === 'checkbox') {
            const checked = Boolean(
              rawVal !== undefined ? rawVal : field.defaultValue,
            );
            return (
              <label
                key={field.id}
                className="sm:col-span-2 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
              >
                <span className="text-xs font-bold text-brand-navy dark:text-slate-100">
                  {field.label}
                  {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setFieldValue(field.key, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-blue"
                />
              </label>
            );
          }

          return (
            <div key={field.id}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                {field.label}
                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
              </label>

              {field.type === 'dropdown' ? (
                <select
                  required={field.required}
                  value={strVal}
                  onChange={(e) => setFieldValue(field.key, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="">
                    {field.placeholder || `Select ${field.label}`}
                  </option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    field.type === 'number'
                      ? 'number'
                      : field.type === 'date'
                        ? 'date'
                        : 'text'
                  }
                  required={field.required}
                  value={strVal}
                  onChange={(e) =>
                    setFieldValue(
                      field.key,
                      field.type === 'number'
                        ? e.target.value === ''
                          ? ''
                          : Number(e.target.value)
                        : e.target.value,
                    )
                  }
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

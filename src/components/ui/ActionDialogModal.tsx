'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Phone, X } from 'lucide-react';

export interface ActionDialogModalProps {
  open: boolean;
  mode: 'confirm' | 'prompt';
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  inputType?: 'text' | 'phone' | 'textarea';
  inputLabel?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  required?: boolean;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void> | void;
}

export function normalizeIndianPhoneInput(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  const last10 =
    digits.length === 10
      ? digits
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits.length === 12 && digits.startsWith('91')
          ? digits.slice(2)
          : digits.length > 10
            ? digits.slice(-10)
            : '';
  if (!/^[6-9]\d{9}$/.test(last10)) {
    return null;
  }
  return `+91${last10}`;
}

export default function ActionDialogModal({
  open,
  mode,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  inputType = 'text',
  inputLabel,
  inputPlaceholder,
  defaultValue = '',
  required = true,
  onClose,
  onConfirm,
}: ActionDialogModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    setError(null);
    setBusy(false);
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let finalVal = value.trim();

    if (mode === 'prompt') {
      if (inputType === 'phone') {
        const normalized = normalizeIndianPhoneInput(finalVal);
        if (!normalized) {
          setError(
            'Enter a valid 10-digit Indian WhatsApp number (starts with 6–9, e.g. +91 98110 01122).',
          );
          return;
        }
        finalVal = normalized;
      } else if (required && !finalVal) {
        setError('Please enter a value before continuing.');
        return;
      }
    }

    setBusy(true);
    try {
      await onConfirm(finalVal);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                danger
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : inputType === 'phone'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-brand-blue/15 text-brand-blue dark:text-sky-400'
              }`}
            >
              {inputType === 'phone' ? (
                <Phone className="w-4 h-4" />
              ) : danger ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-sm font-extrabold text-brand-navy dark:text-white truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {description}
            </p>
          )}

          {mode === 'prompt' && (
            <div className="space-y-1.5">
              {inputLabel && (
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {inputLabel}
                </label>
              )}
              {inputType === 'textarea' ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-blue"
                />
              ) : inputType === 'phone' ? (
                <div className="flex items-center rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/15 overflow-hidden focus-within:border-emerald-500">
                  <span className="px-3 py-2.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-500/10 border-r border-slate-200 dark:border-white/10 select-none">
                    IN +91
                  </span>
                  <input
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={inputPlaceholder || '98110 01122'}
                    className="flex-1 px-3 py-2.5 bg-transparent text-xs font-mono text-brand-navy dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              ) : (
                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/15 text-xs text-brand-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-blue"
                />
              )}
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[11px] font-semibold text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-xs transition-colors disabled:opacity-50 ${
                danger
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : inputType === 'phone'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-brand-blue hover:bg-blue-700'
              }`}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

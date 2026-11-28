'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  Laptop,
  ListChecks,
  MessageSquare,
  Palette,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import InstantFormRenderer from '@/components/lead-forms/InstantFormRenderer';
import PhonePreviewFrame from '@/components/lead-forms/PhonePreviewFrame';
import {
  BRAND_COLOR_PRESETS,
  getMockFormBySlug,
  type LeadFormConfig,
  type LeadFormFieldType,
} from '@/lib/lead-forms-mock';

type StudioTab = 'design' | 'questions' | 'verification' | 'thankyou' | 'automation';

export default function FormStudioBuilderPage() {
  const params = useParams<{ id: string }>();
  const slugParam = String(params?.id || 'new');

  const [form, setForm] = useState<LeadFormConfig>(() =>
    getMockFormBySlug(slugParam),
  );
  const [activeTab, setActiveTab] = useState<StudioTab>('design');
  const [previewStep, setPreviewStep] = useState(0);
  const [deviceVariant, setDeviceVariant] = useState<'mobile' | 'desktop'>(
    'mobile',
  );
  const [newFieldTypeByStep, setNewFieldTypeByStep] = useState<
    Record<number, LeadFormFieldType>
  >({});
  const [banner, setBanner] = useState<string | null>(null);

  const previewSteps = useMemo(() => {
    const list: Array<{ index: number; label: string }> = [{ index: 0, label: 'Intro' }];
    form.steps.forEach((_, idx) => {
      list.push({ index: idx + 1, label: `Step ${idx + 1}` });
    });
    if (form.requireWhatsappOtp) {
      list.push({ index: form.steps.length + 1, label: 'OTP' });
      list.push({ index: form.steps.length + 2, label: 'Thanks' });
    } else {
      list.push({ index: form.steps.length + 1, label: 'Thanks' });
    }
    return list;
  }, [form.steps, form.requireWhatsappOtp]);

  const updateTrustBullet = (index: number, val: string) => {
    const next = [...form.trustBullets];
    next[index] = val;
    setForm((prev) => ({ ...prev, trustBullets: next }));
  };

  const addStep = () => {
    const nextNum = form.steps.length + 1;
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          title: `Step ${nextNum}: Additional Info`,
          fields: [
            {
              key: `custom_field_${Date.now()}`,
              label: 'Preferred Quantity / Notes',
              type: 'text',
              required: false,
              placeholder: 'Enter details...',
            },
          ],
        },
      ],
    }));
  };

  const removeStep = (stepIdx: number) => {
    if (form.steps.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, idx) => idx !== stepIdx),
    }));
    setPreviewStep(0);
  };

  const addFieldToStep = (stepIdx: number) => {
    const type: LeadFormFieldType = newFieldTypeByStep[stepIdx] || 'text';
    const labelMap: Record<LeadFormFieldType, string> = {
      text: 'Custom Text Question',
      phone: 'Alternate Mobile Number',
      email: 'Business Email',
      chips: 'Select Option',
      select: 'Choose From List',
    };
    const newField = {
      key: `field_${type}_${Date.now().toString().slice(-4)}`,
      label: labelMap[type],
      type,
      required: type === 'phone',
      placeholder: type === 'email' ? 'name@company.in' : 'Enter response',
      ...(type === 'chips' || type === 'select'
        ? { options: ['Option 1', 'Option 2', 'Option 3'] }
        : {}),
    };

    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, idx) =>
        idx === stepIdx ? { ...s, fields: [...s.fields, newField] } : s,
      ),
    }));
  };

  const updateField = (
    stepIdx: number,
    fieldIdx: number,
    patch: Partial<LeadFormConfig['steps'][number]['fields'][number]>,
  ) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, sIdx) =>
        sIdx === stepIdx
          ? {
              ...s,
              fields: s.fields.map((f, fIdx) =>
                fIdx === fieldIdx ? { ...f, ...patch } : f,
              ),
            }
          : s,
      ),
    }));
  };

  const removeField = (stepIdx: number, fieldIdx: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, sIdx) =>
        sIdx === stepIdx
          ? { ...s, fields: s.fields.filter((_, fIdx) => fIdx !== fieldIdx) }
          : s,
      ),
    }));
  };

  const handleSaveDraft = () => {
    setForm((prev) => ({ ...prev, status: 'draft', updatedAt: 'Saved just now' }));
    setBanner('Draft saved locally in Form Studio preview.');
  };

  const handlePublish = () => {
    setForm((prev) => ({ ...prev, status: 'live', updatedAt: 'Published just now' }));
    setBanner(`Published "${form.title}" live at /f/${form.slug}!`);
  };

  const statusBadgeClass =
    form.status === 'live'
      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
      : form.status === 'paused'
        ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Sticky Studio Top Bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F8FAFF]/90 dark:bg-[#09111F]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/lead-forms"
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1628] text-slate-600 dark:text-slate-300 hover:border-brand-blue/50 flex items-center justify-center shrink-0 transition"
            title="Back to Instant Forms Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            aria-label="Form Title"
            className="min-w-0 max-w-xs sm:max-w-sm bg-transparent border-0 text-base sm:text-lg font-extrabold text-brand-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 rounded-lg px-2 py-1"
          />

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize shrink-0 ${statusBadgeClass}`}
          >
            {form.status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/f/${form.slug}`}
            target="_blank"
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:border-brand-blue/50 text-xs font-semibold text-brand-navy dark:text-slate-200 inline-flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Link>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:border-brand-blue/50 text-xs font-semibold text-brand-navy dark:text-slate-200 inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="h-9 px-4 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-brand-blue/25 transition cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {banner && (
        <div className="px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {banner}
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split-Screen Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* LEFT: Configuration Sections */}
        <div className="space-y-5 min-w-0">
          {/* Segmented Section Tabs */}
          <div className="overflow-x-auto pb-1">
            <div className="inline-flex p-1 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04] gap-1">
              {(
                [
                  { id: 'design', label: 'Design', icon: Palette },
                  { id: 'questions', label: 'Questions', icon: ListChecks },
                  { id: 'verification', label: 'Verification', icon: ShieldCheck },
                  { id: 'thankyou', label: 'Thank-You', icon: Sparkles },
                  { id: 'automation', label: 'Automation', icon: Zap },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-brand-blue text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Design */}
          {activeTab === 'design' && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 space-y-5">
              <div>
                <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                  Brand Identity &amp; Intro Card
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize the first screen visitors see before answering your micro-steps.
                </p>
              </div>

              {/* Color Swatches */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Brand Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const selected =
                      form.brandColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, brandColor: preset.hex }))
                        }
                        title={preset.name}
                        className={`w-8 h-8 rounded-xl transition cursor-pointer ${
                          selected
                            ? 'ring-2 ring-offset-2 ring-brand-blue dark:ring-offset-[#0D1628] scale-105'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      />
                    );
                  })}
                  <input
                    type="text"
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brandColor: e.target.value }))
                    }
                    className="w-24 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] font-mono text-xs focus:ring-2 focus:ring-brand-blue/30 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Logo Initials
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={form.logoText}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, logoText: e.target.value }))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-extrabold uppercase focus:ring-2 focus:ring-brand-blue/30 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Company Display Name
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs focus:ring-2 focus:ring-brand-blue/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Offer Headline
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-semibold focus:ring-2 focus:ring-brand-blue/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Subheadline
                </label>
                <textarea
                  rows={2}
                  value={form.subheadline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subheadline: e.target.value }))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs focus:ring-2 focus:ring-brand-blue/30 outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  3 Trust Bullets (Shown on Intro Card)
                </label>
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={form.trustBullets[idx] || ''}
                    onChange={(e) => updateTrustBullet(idx, e.target.value)}
                    placeholder={`Trust bullet #${idx + 1}`}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs focus:ring-2 focus:ring-brand-blue/30 outline-none"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {form.steps.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="w-6 h-6 rounded-lg text-white text-[11px] font-extrabold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: form.brandColor }}
                      >
                        {sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            steps: prev.steps.map((st, idx) =>
                              idx === sIdx ? { ...st, title: e.target.value } : st,
                            ),
                          }))
                        }
                        className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-extrabold focus:ring-2 focus:ring-brand-blue/30 outline-none"
                      />
                    </div>

                    {form.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(sIdx)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                      >
                        Remove Step
                      </button>
                    )}
                  </div>

                  {/* Fields List */}
                  <div className="space-y-2.5">
                    {step.fields.map((field, fIdx) => (
                      <div
                        key={field.key}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              updateField(sIdx, fIdx, { label: e.target.value })
                            }
                            className="flex-1 min-w-[160px] h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-blue/30"
                          />
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-sky-500/15 text-brand-blue dark:text-sky-300 text-[10px] font-mono font-bold uppercase">
                            {field.type}
                          </span>
                          <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(sIdx, fIdx, {
                                  required: e.target.checked,
                                })
                              }
                            />
                            <span>Required</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeField(sIdx, fIdx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {(field.type === 'chips' || field.type === 'select') && (
                          <div className="pl-6">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Options (Comma-separated)
                            </label>
                            <input
                              type="text"
                              value={(field.options || []).join(', ')}
                              onChange={(e) =>
                                updateField(sIdx, fIdx, {
                                  options: e.target.value
                                    .split(',')
                                    .map((v) => v.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-[11px] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Field Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={newFieldTypeByStep[sIdx] || 'text'}
                      onChange={(e) =>
                        setNewFieldTypeByStep((prev) => ({
                          ...prev,
                          [sIdx]: e.target.value as LeadFormFieldType,
                        }))
                      }
                      className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-semibold outline-none"
                    >
                      <option value="text">Text Field</option>
                      <option value="phone">WhatsApp Phone (+91)</option>
                      <option value="email">Email Address</option>
                      <option value="chips">Tap Chips</option>
                      <option value="select">Dropdown Select</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => addFieldToStep(sIdx)}
                      className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] hover:border-brand-blue/50 text-xs font-semibold text-brand-navy dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Field</span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addStep}
                className="w-full h-10 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 hover:border-brand-blue text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-blue flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Card Step</span>
              </button>
            </div>
          )}

          {/* Tab 3: Verification */}
          {activeTab === 'verification' && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 space-y-5">
              <div>
                <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                  Lead Verification &amp; Anti-Spam Shield
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Stop fake numbers and bot submissions before they reach your sales team.
                </p>
              </div>

              <label className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-brand-navy dark:text-white">
                      WhatsApp OTP Shield
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Send a 4-digit verification code via your connected Official WhatsApp Cloud before submitting. Ensures 100% reachable mobile numbers.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.requireWhatsappOtp}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      requireWhatsappOtp: e.target.checked,
                    }));
                    setPreviewStep(0);
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
              </label>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-blue dark:text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Bot Honeypot &amp; Rate-Limit Guard
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Always active · Blocks automated bots &amp; max 5 submissions/min per IP
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-bold border border-emerald-200 dark:border-emerald-500/30">
                  Protected
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Duplicate Phone Handling
                </label>
                <select
                  value={form.duplicateStrategy || 'merge'}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duplicateStrategy: e.target.value as 'merge' | 'create_new',
                    }))
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none focus:ring-2 focus:ring-brand-blue/30"
                >
                  <option value="merge">
                    Merge into existing Lead &amp; log repeat inquiry activity
                  </option>
                  <option value="create_new">
                    Always create a separate new Lead card
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 4: Thank-You */}
          {activeTab === 'thankyou' && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 space-y-5">
              <div>
                <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                  Actionable Thank-You Screen
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Turn completed forms directly into scheduled demos, WhatsApp chats, or PDF downloads.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirmation Title
                </label>
                <input
                  type="text"
                  value={form.thankYou.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      thankYou: { ...prev.thankYou, title: e.target.value },
                    }))
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirmation Message
                </label>
                <textarea
                  rows={2}
                  value={form.thankYou.message}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      thankYou: { ...prev.thankYou, message: e.target.value },
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none"
                />
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer text-xs">
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Show &ldquo;Book a 15-Min Call / Demo&rdquo; CTA
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Connects straight to your workspace scheduler (/book/[slug])
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.thankYou.bookingCta}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        thankYou: {
                          ...prev.thankYou,
                          bookingCta: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer text-xs">
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Show &ldquo;Chat on WhatsApp Now&rdquo; CTA
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Opens pre-filled WhatsApp thread with assigned rep
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.thankYou.whatsappCta}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        thankYou: {
                          ...prev.thankYou,
                          whatsappCta: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>

                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-brand-navy dark:text-white">
                        Show &ldquo;Download Catalog &amp; Price List&rdquo; CTA
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Instant PDF brochure / spec sheet download
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.thankYou.brochureCta}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          thankYou: {
                            ...prev.thankYou,
                            brochureCta: e.target.checked,
                          },
                        }))
                      }
                    />
                  </label>
                  {form.thankYou.brochureCta && (
                    <input
                      type="url"
                      value={form.thankYou.brochureUrl || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          thankYou: {
                            ...prev.thankYou,
                            brochureUrl: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://.../brochure.pdf"
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] font-mono text-xs outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Automation */}
          {activeTab === 'automation' && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-brand-navy dark:text-white">
                  Instant Pipeline &amp; CRM Automation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure how verified submissions trigger SetuAI scoring, routing, and WhatsApp replies.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer">
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Auto-Assign via Smart Lead Routing
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Applies territory city rules &amp; round-robin rep capacity
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.automation?.autoAssignRouting !== false}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        automation: {
                          ...(prev.automation || {
                            autoAssignRouting: true,
                            instantWhatsappWelcome: true,
                            whatsappTemplate: 'b2b_gst_proforma_instant_v2',
                            fireMetaCapi: true,
                            defaultSourceTag: 'Leadsetu Instant Form',
                            setuAiScoring: true,
                          }),
                          autoAssignRouting: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>

                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-bold text-brand-navy dark:text-white">
                        Instant WhatsApp Welcome (&lt;10s Speed-to-Lead)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically sends catalog brochure &amp; interactive pills
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.automation?.instantWhatsappWelcome !== false}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          automation: {
                            ...(prev.automation || {
                              autoAssignRouting: true,
                              instantWhatsappWelcome: true,
                              whatsappTemplate: 'b2b_gst_proforma_instant_v2',
                              fireMetaCapi: true,
                              defaultSourceTag: 'Leadsetu Instant Form',
                              setuAiScoring: true,
                            }),
                            instantWhatsappWelcome: e.target.checked,
                          },
                        }))
                      }
                    />
                  </label>
                  <select
                    value={
                      form.automation?.whatsappTemplate ||
                      'b2b_gst_proforma_instant_v2'
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        automation: {
                          ...(prev.automation || {
                            autoAssignRouting: true,
                            instantWhatsappWelcome: true,
                            whatsappTemplate: 'b2b_gst_proforma_instant_v2',
                            fireMetaCapi: true,
                            defaultSourceTag: 'Leadsetu Instant Form',
                            setuAiScoring: true,
                          }),
                          whatsappTemplate: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none"
                  >
                    <option value="b2b_gst_proforma_instant_v2">
                      Template: b2b_gst_proforma_instant_v2
                    </option>
                    <option value="dealer_welcome_kit_v1">
                      Template: dealer_welcome_kit_v1
                    </option>
                    <option value="expo_booth_followup">
                      Template: expo_booth_followup
                    </option>
                    <option value="insta_catalog_v1">
                      Template: insta_catalog_v1
                    </option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer">
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Fire Meta CAPI &ldquo;LeadSubmitted&rdquo; Event
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sends server-side conversion signal if fbclid / ad pixel present
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.automation?.fireMetaCapi !== false}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        automation: {
                          ...(prev.automation || {
                            autoAssignRouting: true,
                            instantWhatsappWelcome: true,
                            whatsappTemplate: 'b2b_gst_proforma_instant_v2',
                            fireMetaCapi: true,
                            defaultSourceTag: 'Leadsetu Instant Form',
                            setuAiScoring: true,
                          }),
                          fireMetaCapi: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer">
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      Run SetuAI Lead Intent Scoring (1–100)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Auto-tags Hot / Warm buyers from answers &amp; GSTIN
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.automation?.setuAiScoring !== false}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        automation: {
                          ...(prev.automation || {
                            autoAssignRouting: true,
                            instantWhatsappWelcome: true,
                            whatsappTemplate: 'b2b_gst_proforma_instant_v2',
                            fireMetaCapi: true,
                            defaultSourceTag: 'Leadsetu Instant Form',
                            setuAiScoring: true,
                          }),
                          setuAiScoring: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Default Lead Source Tag
                  </label>
                  <input
                    type="text"
                    value={form.automation?.defaultSourceTag || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        automation: {
                          ...(prev.automation || {
                            autoAssignRouting: true,
                            instantWhatsappWelcome: true,
                            whatsappTemplate: 'b2b_gst_proforma_instant_v2',
                            fireMetaCapi: true,
                            defaultSourceTag: 'Leadsetu Instant Form',
                            setuAiScoring: true,
                          }),
                          defaultSourceTag: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1322] text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sticky Interactive Live Preview */}
        <div className="lg:sticky lg:top-20 space-y-3.5">
          {/* Device & Step Jump Header */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1628] shadow-sm p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Interactive Preview
              </span>
              <div className="inline-flex p-0.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setDeviceVariant('mobile')}
                  className={`px-2 py-1 rounded-md text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                    deviceVariant === 'mobile'
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3 h-3" /> Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceVariant('desktop')}
                  className={`px-2 py-1 rounded-md text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                    deviceVariant === 'desktop'
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  <Laptop className="w-3 h-3" /> Desktop
                </button>
              </div>
            </div>

            {/* Step Jump Bar */}
            <div className="flex flex-wrap items-center gap-1">
              {previewSteps.map((st) => (
                <button
                  key={st.index}
                  type="button"
                  onClick={() => setPreviewStep(st.index)}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                    previewStep === st.index
                      ? 'bg-brand-blue/15 text-brand-blue dark:text-sky-300 border border-brand-blue/30'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <PhonePreviewFrame variant={deviceVariant}>
            <InstantFormRenderer
              form={form}
              mode="preview"
              activeStep={previewStep}
              onStepChange={setPreviewStep}
            />
          </PhonePreviewFrame>
        </div>
      </div>
    </div>
  );
}

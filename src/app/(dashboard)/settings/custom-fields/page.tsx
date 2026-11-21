'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Briefcase,
  Building2,
  Users,
  Edit3,
  Power,
} from 'lucide-react';
import { useCustomFields } from '@/hooks/useCustomFields';
import { getErrorMessage } from '@/lib/api-client';
import type {
  CustomFieldDef,
  CustomFieldEntity,
  CustomFieldType,
} from '@/types/contracts';

const ENTITY_TABS: Array<{
  id: CustomFieldEntity;
  label: string;
  icon: typeof Users;
  href: string;
}> = [
  { id: 'lead', label: 'Leads', icon: Users, href: '/leads' },
  { id: 'contact', label: 'Contacts (B2B)', icon: Building2, href: '/contacts' },
  { id: 'deal', label: 'Deals Pipeline', icon: Briefcase, href: '/deals' },
];

const FIELD_TYPES: Array<{ value: CustomFieldType; label: string; hint: string }> = [
  { value: 'text', label: 'Text', hint: 'Plant Location, Drug License No.' },
  { value: 'number', label: 'Number', hint: 'MOQ, Credit Days, Sq.Ft' },
  { value: 'dropdown', label: 'Dropdown', hint: 'Predefined selectable options' },
  { value: 'date', label: 'Date', hint: 'Delivery Date, Renewal Date' },
  { value: 'checkbox', label: 'Checkbox (Yes/No)', hint: 'Cold Chain, Loan Pre-Approved' },
];

const INDUSTRY_PRESET_BUTTONS: Array<{
  id:
    | 'manufacturing_b2b'
    | 'pharma_medical'
    | 'wholesale_distribution'
    | 'real_estate';
  title: string;
  items: string;
}> = [
  {
    id: 'manufacturing_b2b',
    title: 'Manufacturing & Industrial',
    items: 'MOQ, Plant Location, Credit Days, Dispatch Mode',
  },
  {
    id: 'pharma_medical',
    title: 'Pharma & Medical Supply',
    items: 'Drug License No., Cold Chain Required, Delivery Date',
  },
  {
    id: 'wholesale_distribution',
    title: 'Wholesale & Dealers',
    items: 'Sales Beat Day, Monthly Offtake INR, Trade Scheme',
  },
  {
    id: 'real_estate',
    title: 'Real Estate & Builders',
    items: 'Budget Bracket, Site Visit Date, Loan Pre-Approved',
  },
];

export default function CustomFieldsBuilderPage() {
  const router = useRouter();
  const {
    fields,
    isLoading,
    isSaving,
    error,
    createField,
    applyPreset,
    updateField,
    reorderFields,
    deleteField,
  } = useCustomFields(undefined, true);

  const [activeEntity, setActiveEntity] = useState<CustomFieldEntity>('lead');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Add / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDef | null>(null);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [optionsText, setOptionsText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [required, setRequired] = useState(false);
  const [showInCard, setShowInCard] = useState(true);

  const entityFields = fields.filter((f) => f.entity === activeEntity);

  const openCreateModal = () => {
    setEditingField(null);
    setLabel('');
    setType('text');
    setOptionsText('');
    setPlaceholder('');
    setDefaultValue('');
    setRequired(false);
    setShowInCard(true);
    setModalOpen(true);
  };

  const openEditModal = (field: CustomFieldDef) => {
    setEditingField(field);
    setLabel(field.label);
    setType(field.type);
    setOptionsText((field.options || []).join(', '));
    setPlaceholder(field.placeholder || '');
    setDefaultValue(
      field.defaultValue !== null && field.defaultValue !== undefined
        ? String(field.defaultValue)
        : '',
    );
    setRequired(field.required);
    setShowInCard(field.showInCard);
    setModalOpen(true);
  };

  const handleSaveField = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parsedOptions = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedDefault =
      defaultValue === ''
        ? null
        : type === 'number'
          ? Number(defaultValue)
          : type === 'checkbox'
            ? defaultValue === 'true'
            : defaultValue;

    try {
      if (editingField) {
        await updateField(editingField.id, {
          label: label.trim(),
          type,
          options: type === 'dropdown' ? parsedOptions : [],
          placeholder: placeholder.trim(),
          defaultValue: parsedDefault,
          required,
          showInCard,
        });
        setFeedback({
          type: 'success',
          text: `Updated custom field "${label.trim()}".`,
        });
      } else {
        await createField({
          entity: activeEntity,
          label: label.trim(),
          type,
          options: type === 'dropdown' ? parsedOptions : [],
          placeholder: placeholder.trim(),
          defaultValue: parsedDefault,
          required,
          showInCard,
        });
        setFeedback({
          type: 'success',
          text: `Added "${label.trim()}" to ${activeEntity} forms & detail views.`,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    }
  };

  const handleApplyPreset = async (
    preset:
      | 'manufacturing_b2b'
      | 'pharma_medical'
      | 'wholesale_distribution'
      | 'real_estate',
  ) => {
    setFeedback(null);
    try {
      const res = await applyPreset(preset);
      setFeedback({
        type: 'success',
        text: `Imported ${res.createdCount} custom field(s) across Leads, Contacts & Deals (${res.skippedCount} already existed).`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    }
  };

  const handleMoveOrder = async (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= entityFields.length) return;
    const nextOrder = [...entityFields];
    const [moved] = nextOrder.splice(idx, 1);
    nextOrder.splice(target, 0, moved);
    await reorderFields(
      activeEntity,
      nextOrder.map((f) => f.id),
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {ENTITY_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-brand-navy dark:text-slate-200 hover:bg-brand-light hover:text-brand-blue"
            >
              Open {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Industry Schema Studio
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy">
            Custom Fields Builder (Leads, Contacts &amp; Deals)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define custom inputs (`text`, `number`, `dropdown`, `date`, `checkbox`) that render dynamically inside creation modals and record detail pages.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Custom Field
        </button>
      </div>

      {/* 1-Click Industry Starter Presets */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          1-Click Indian B2B Vertical Starter Packs
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INDUSTRY_PRESET_BUTTONS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={isSaving}
              onClick={() => void handleApplyPreset(p.id)}
              className="text-left p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-brand-light/70 hover:border-brand-blue/50 transition-all space-y-1 disabled:opacity-60"
            >
              <div className="text-xs font-extrabold text-brand-navy">
                + {p.title}
              </div>
              <div className="text-[11px] text-slate-500 leading-snug">
                {p.items}
              </div>
            </button>
          ))}
        </div>
      </div>

      {(feedback || error) && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
            feedback?.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback?.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback?.text || error}</span>
        </div>
      )}

      {/* Entity Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {ENTITY_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = fields.filter((f) => f.entity === tab.id).length;
          const selected = activeEntity === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEntity(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                selected
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-brand-navy hover:border-brand-blue'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  selected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Field Definitions List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
            <span>Loading custom field definitions...</span>
          </div>
        ) : entityFields.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-extrabold text-brand-navy">
              No custom fields on {activeEntity}s yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add custom fields like MOQ, Credit Days, or Drug License No., or click one of the industry starter packs above.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create First {activeEntity} Field
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entityFields.map((field, idx) => (
              <div
                key={field.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  field.isActive
                    ? 'bg-slate-50/80 border-slate-200/80'
                    : 'bg-slate-100/50 border-slate-200/50 opacity-65'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-brand-navy">
                      {field.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-light text-brand-blue text-[10px] font-extrabold uppercase">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold">
                        Required
                      </span>
                    )}
                    {!field.isActive && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                    <span>
                      Key: <code>{field.key}</code>
                    </span>
                    {field.placeholder && <span>Hint: {field.placeholder}</span>}
                    {field.type === 'dropdown' && field.options?.length > 0 && (
                      <span>Options: {field.options.join(' · ')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0 || isSaving}
                    onClick={() => void handleMoveOrder(idx, -1)}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === entityFields.length - 1 || isSaving}
                    onClick={() => void handleMoveOrder(idx, 1)}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(field)}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-brand-navy hover:border-brand-blue"
                    title="Edit field"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateField(field.id, { isActive: !field.isActive })
                    }
                    className={`p-2 rounded-xl border bg-white ${
                      field.isActive
                        ? 'border-emerald-200 text-emerald-600'
                        : 'border-slate-200 text-slate-400'
                    }`}
                    title={field.isActive ? 'Pause field' : 'Activate field'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteField(field.id)}
                    className="p-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                    title="Delete field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Field Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">
                {editingField
                  ? `Edit ${activeEntity} Field`
                  : `Add Custom Field to ${activeEntity.toUpperCase()}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Field Label *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. MOQ (Minimum Order Qty)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Field Input Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomFieldType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white font-semibold"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label} — {ft.hint}
                    </option>
                  ))}
                </select>
              </div>

              {type === 'dropdown' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Dropdown Options (comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Advance, Net 15 Days, Net 30 Days, Net 45 Days"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Placeholder Hint
                  </label>
                  <input
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="e.g. 500 units"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Default Value
                  </label>
                  <input
                    type="text"
                    value={defaultValue}
                    onChange={(e) => setDefaultValue(e.target.value)}
                    placeholder="Optional default"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1 text-xs font-bold text-brand-navy">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                  />
                  <span>Required inside forms</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInCard}
                    onChange={(e) => setShowInCard(e.target.checked)}
                  />
                  <span>Show in record profile cards</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingField
                      ? 'Save Changes'
                      : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

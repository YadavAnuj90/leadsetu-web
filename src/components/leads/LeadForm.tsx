'use client';

import { useState, FormEvent } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Sparkles,
  Loader2,
  Tag,
} from 'lucide-react';
import type {
  CreateLeadPayload,
  Lead,
  LeadSource,
  LeadStatus,
} from '@/types/contracts';

interface LeadFormProps {
  initialData?: Lead | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLeadPayload) => Promise<void>;
}

export default function LeadForm({
  initialData,
  isSubmitting = false,
  onClose,
  onSubmit,
}: LeadFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [city, setCity] = useState(initialData?.city || 'New Delhi');
  const [source, setSource] = useState<LeadSource>(
    initialData?.source || 'whatsapp'
  );
  const [status, setStatus] = useState<LeadStatus>(
    initialData?.status || 'new'
  );
  const [estimatedValue, setEstimatedValue] = useState<string>(
    initialData?.estimatedValue ? String(initialData.estimatedValue) : ''
  );
  const [tagsText, setTagsText] = useState(
    initialData?.tags?.join(', ') || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSubmit({
      name,
      company,
      phone,
      email,
      city,
      source,
      status,
      estimatedValue: Number(estimatedValue) || 0,
      tags,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div
          className="px-6 py-5 text-white flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
          }}
        >
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-sky mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Gemini AI Auto-Scoring Enabled
            </div>
            <h3 className="text-lg font-extrabold">
              {initialData ? 'Edit Lead Details' : 'Capture New Lead'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Contact Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Company / Business Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. RS Electricals Pvt. Ltd."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                WhatsApp / Mobile (+91)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98112 45678"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@company.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="whatsapp">WhatsApp Business</option>
                <option value="indiamart">IndiaMART</option>
                <option value="justdial">Justdial</option>
                <option value="meta_ads">Meta Lead Ads</option>
                <option value="google_ads">Google Ads</option>
                <option value="website">Website Form</option>
                <option value="referral">Client Referral</option>
                <option value="manual">Direct / Walk-in</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Pipeline Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="new">New Inquiry</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal / GST Quote</option>
                <option value="converted">Converted (Won)</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Est. Deal Value (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={0}
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="250000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                City / Territory
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Karol Bagh, New Delhi"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tags (comma separated)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="Bulk Order, Urgent, B2B"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Buyer Requirement &amp; Notes (Used by Gemini AI Scorer)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe buyer requirement, quantity, GST billing details, or follow-up timing..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-brand px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Save Changes' : 'Create & Score Lead'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

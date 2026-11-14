'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  MessageSquare,
  Sparkles,
  IndianRupee,
  CheckCircle2,
  Loader2,
  Trash2,
  Briefcase,
  FileText,
} from 'lucide-react';
import { fetchSingleLead, addLeadActivityApi } from '@/hooks/useLeads';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import LeadTimeline from '@/components/leads/LeadTimeline';
import type { Deal, Lead, LeadActivity, LeadStatus } from '@/types/contracts';

const stages: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'New Inquiry' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal / Quote' },
  { id: 'converted', label: 'Converted (Won)' },
];

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const leadId = params?.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConvertingDeal, setIsConvertingDeal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSingleLead(leadId);
      setLead(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  const handleStageChange = async (status: LeadStatus) => {
    if (!lead) return;
    try {
      const { data } = await apiClient.patch<Lead>(`/leads/${lead.id}`, {
        status,
      });
      setLead(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAddActivity = async (payload: {
    type: LeadActivity['type'];
    description: string;
  }) => {
    if (!lead) return;
    const updated = await addLeadActivityApi(lead.id, payload);
    setLead(updated);
  };

  const handleDelete = async () => {
    if (!lead) return;
    await apiClient.delete(`/leads/${lead.id}`);
    router.push('/leads');
  };

  const handleConvertToDeal = async () => {
    if (!lead) return;
    setIsConvertingDeal(true);
    setError(null);
    try {
      const { data: createdDeal } = await apiClient.post<Deal>('/deals', {
        title: `${lead.company || lead.name} — B2B Requirement`,
        company: lead.company || lead.name,
        contactName: lead.name,
        contactPhone: lead.phone,
        contactEmail: lead.email,
        city: lead.city || 'Delhi-NCR',
        value: Number(lead.estimatedValue || 0) || 150000,
        stage: 'proposal',
        probability: 65,
        source: lead.source,
        notes: lead.notes || `Converted from Lead ${lead.name}`,
      });
      await apiClient.patch(`/leads/${lead.id}`, { status: 'converted' });
      router.push(`/deals/${createdDeal.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setIsConvertingDeal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
        <p className="text-base font-extrabold text-brand-navy">
          {error || 'Lead not found.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
          </button>
          <Link
            href="/leads"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50"
          >
            All Leads
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${
        cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
      }?text=${encodeURIComponent(
        `Namaste ${lead.name} ji, sharing updates regarding your inquiry with ${lead.company || 'us'}.`
      )}`
    : '#';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Leads
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isConvertingDeal}
            onClick={handleConvertToDeal}
            className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          >
            {isConvertingDeal ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Briefcase className="w-3.5 h-3.5" />
            )}
            <span>Convert to Deal</span>
          </button>

          <Link
            href={`/quotations?leadId=${encodeURIComponent(lead.id)}&client=${encodeURIComponent(lead.company || lead.name)}&contact=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone || '')}&email=${encodeURIComponent(lead.email || '')}&city=${encodeURIComponent(lead.city || '')}&amount=${lead.estimatedValue || 0}&title=${encodeURIComponent(lead.company ? `${lead.company} Supply Proposal` : `${lead.name} Quotation`)}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Create Proforma Quote
          </Link>

          <Link
            href={`/invoices?docType=tax_invoice&leadId=${encodeURIComponent(lead.id)}&client=${encodeURIComponent(lead.company || lead.name)}&contact=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone || '')}&email=${encodeURIComponent(lead.email || '')}&city=${encodeURIComponent(lead.city || '')}&amount=${lead.estimatedValue || 0}&title=${encodeURIComponent(lead.company ? `${lead.company} Tax Supply` : `${lead.name} Supply`)}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-brand-navy hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-brand-blue" /> GST Invoice
          </Link>

          {lead.phone && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Open in WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Pipeline Stage Progression (Click to update)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stages.map((st) => {
            const active = lead.status === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStageChange(st.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  active
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-brand-light hover:text-brand-blue'
                }`}
              >
                {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Profile & AI Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Buyer Profile */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg text-white"
                  style={{
                    background:
                      'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
                  }}
                >
                  {lead.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-brand-navy">
                    {lead.name}
                  </h1>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {lead.company || 'Direct Buyer'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-brand-light text-brand-blue uppercase">
                {lead.source}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Est. Deal Value
                </div>
                <div className="text-lg font-extrabold text-brand-navy flex items-center gap-0.5 mt-0.5">
                  <IndianRupee className="w-4 h-4 text-brand-blue" />
                  {(lead.estimatedValue || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Gemini AI Score
                </div>
                <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
                  {lead.aiScore} / 100 ({lead.aiLabel})
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              {lead.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-brand-blue" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-brand-blue" />
                  <span>{lead.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand-blue" />
                <span>{lead.city || 'Delhi-NCR'}</span>
              </div>
            </div>

            {lead.notes && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <div className="font-bold text-brand-navy mb-1">
                  Requirement Notes:
                </div>
                {lead.notes}
              </div>
            )}
          </div>

          {/* Gemini AI Next-Best-Action Card */}
          <div
            className="rounded-3xl p-6 text-white space-y-3 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #1E3358 100%)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-sky">
                <Sparkles className="w-4 h-4" /> Gemini AI Recommendation
              </span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Score {lead.aiScore}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {lead.aiInsight ||
                'Send introductory WhatsApp message and share GST quotation.'}
            </p>
          </div>
        </div>

        {/* Right Activity & Notes Timeline */}
        <div className="lg:col-span-7">
          <LeadTimeline
            activities={lead.activities || []}
            onAddActivity={handleAddActivity}
          />
        </div>
      </div>
    </div>
  );
}

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
  Sparkles,
  IndianRupee,
  CheckCircle2,
  Loader2,
  Trash2,
  Briefcase,
  FileText,
  Mic,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchSingleLead,
  addLeadActivityApi,
  analyzeLeadAiApi,
  verifyLeadGstinApi,
} from '@/hooks/useLeads';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { autoAssignLeadApi } from '@/lib/lead-routing-api';
import { useAuthStore } from '@/store/auth.store';
import { isFeatureEnabled, isWorkspaceAdminRole } from '@/lib/feature-access';
import LeadTimeline from '@/components/leads/LeadTimeline';
import VoiceCrmAuditModal from '@/components/ai/VoiceCrmAuditModal';
import ShareVoiceCallLinkButton from '@/components/calling/ShareVoiceCallLinkButton';
import CallMobileButton from '@/components/calling/CallMobileButton';
import WhatsAppActionButton from '@/components/inbox/WhatsAppActionButton';
import CustomFieldsDisplayCard from '@/components/custom-fields/CustomFieldsDisplayCard';
import { EntityEmailPanel } from '@/components/email/EntityEmailPanel';
import Customer360TimelineCard from '@/components/timeline/Customer360TimelineCard';
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
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const isAdmin = isWorkspaceAdminRole(user);
  const voiceCrmEnabled =
    isFeatureEnabled(tenant, 'aiScoring', user) &&
    isFeatureEnabled(tenant, 'aiVoiceCrm', user);

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConvertingDeal, setIsConvertingDeal] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [gstinInput, setGstinInput] = useState('');
  const [verifyingGstin, setVerifyingGstin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSingleLead(leadId);
      setLead(data);
      setGstinInput(data.gstin || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  useEffect(() => {
    const onEntityActivityLogged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ entityType?: string; entityId?: string }>).detail;
      if (detail?.entityType === 'lead' && detail?.entityId === leadId) {
        void loadLead();
      }
    };
    window.addEventListener('leadsetu:sim-call-logged', onEntityActivityLogged);
    window.addEventListener('leadsetu:whatsapp-logged', onEntityActivityLogged);
    return () => {
      window.removeEventListener('leadsetu:sim-call-logged', onEntityActivityLogged);
      window.removeEventListener('leadsetu:whatsapp-logged', onEntityActivityLogged);
    };
  }, [loadLead, leadId]);

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

  const handleAnalyzeAi = async () => {
    if (!lead || isAnalyzingAi) return;
    setIsAnalyzingAi(true);
    setError(null);
    try {
      const res = await analyzeLeadAiApi(lead.id);
      if (res?.lead) {
        setLead(res.lead);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleVerifyLeadGstin = async () => {
    if (!lead || verifyingGstin) return;
    const cleaned = (gstinInput || lead.gstin || '').trim().toUpperCase();
    if (!cleaned) return;
    setVerifyingGstin(true);
    setError(null);
    try {
      const res = await verifyLeadGstinApi(lead.id, cleaned);
      if (res?.lead) {
        setLead(res.lead);
        setGstinInput(res.lead.gstin || cleaned);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerifyingGstin(false);
    }
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
        city: lead.city || '',
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

          {voiceCrmEnabled && (
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
            >
              <Mic className="w-3.5 h-3.5" /> Voice-to-CRM &amp; Audit
            </button>
          )}

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
            <WhatsAppActionButton
              phone={lead.phone}
              contactName={lead.name}
              company={lead.company}
              city={lead.city}
              estimatedValue={lead.estimatedValue}
              entityType="lead"
              entityId={lead.id}
              label="WhatsApp"
            />
          )}
          <CallMobileButton
            phone={lead.phone}
            contactName={lead.name}
            company={lead.company}
            entityType="lead"
            entityId={lead.id}
          />
          <ShareVoiceCallLinkButton
            entityType="lead"
            entityId={lead.id}
            recipientName={lead.name}
            recipientPhone={lead.phone}
          />
          <button
            type="button"
            onClick={async () => {
              const res = await autoAssignLeadApi(lead.id);
              if (res?.lead) setLead(res.lead);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            title="Auto-assign lead using Smart Lead Routing rules"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Auto-Route Rep
          </button>
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

              <span
                title={
                  lead.metaLeadData?.formName
                    ? `Meta Form: ${lead.metaLeadData.formName}`
                    : undefined
                }
                className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                  lead.source === 'meta_lead_ads' || lead.metaLeadData?.leadgenId
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-brand-light text-brand-blue'
                }`}
              >
                {lead.source === 'meta_lead_ads' || lead.metaLeadData?.leadgenId
                  ? 'Meta Lead Ad'
                  : lead.source}
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
                  SetuAI Score
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
                  <span>
                    {!isAdmin && !lead.phone.includes('X')
                      ? (() => {
                          const d = lead.phone.replace(/\D/g, '');
                          const ten = d.length >= 10 ? d.slice(-10) : d;
                          return ten.length === 10
                            ? `+91 ${ten.slice(0, 2)}XXXXXX${ten.slice(-2)}`
                            : lead.phone;
                        })()
                      : lead.phone}
                  </span>
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
                <span>{lead.city || '—'}</span>
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

          {/* Phase 1 Moat: B2B GSTIN Trust & Credit-Risk Guard */}
          {lead.accountKind !== 'consumer' && (
            <div className="bg-white dark:bg-[#0D1628] rounded-3xl p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue dark:text-sky-400">
                    B2B Underwriting &amp; Credit Guard
                  </div>
                  <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                    GSTIN Trust Verification
                  </h3>
                </div>
                {lead.gstinProfile && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                      lead.gstinProfile.recommendedTerms === 'safe_credit'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                        : lead.gstinProfile.recommendedTerms === 'advance_100' ||
                            !lead.gstinProfile.checksumValid
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                          : 'bg-blue-50 text-brand-blue border-blue-200 dark:bg-brand-blue/15 dark:text-sky-300 dark:border-brand-blue/30'
                    }`}
                  >
                    Trust {lead.gstinProfile.trustScore}/100
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={15}
                  value={gstinInput}
                  onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                  placeholder="Enter 15-digit Buyer GSTIN"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/15 text-xs font-mono uppercase text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                />
                <button
                  type="button"
                  disabled={verifyingGstin || !gstinInput.trim()}
                  onClick={() => void handleVerifyLeadGstin()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-xs font-bold disabled:opacity-50 shrink-0"
                >
                  {verifyingGstin ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Verify</span>
                </button>
              </div>

              {lead.gstinProfile ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                        State Jurisdiction
                      </span>
                      <span className="font-bold text-brand-navy dark:text-white">
                        {lead.gstinProfile.stateName || '—'} ({lead.gstinProfile.stateCode || '—'})
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                        Entity Constitution
                      </span>
                      <span className="font-bold text-brand-navy dark:text-white truncate block">
                        {lead.gstinProfile.entityType || 'Business'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                      lead.gstinProfile.recommendedTerms === 'safe_credit'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200'
                        : lead.gstinProfile.recommendedTerms === 'advance_100' ||
                            !lead.gstinProfile.checksumValid
                          ? 'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200'
                          : 'bg-blue-50/80 border-blue-200 text-brand-navy dark:bg-brand-blue/10 dark:border-brand-blue/30 dark:text-sky-200'
                    }`}
                  >
                    {lead.gstinProfile.recommendedTerms === 'advance_100' ||
                    !lead.gstinProfile.checksumValid ? (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider">
                        {lead.gstinProfile.recommendedTerms === 'safe_credit'
                          ? 'Recommended: Safe for B2B Credit'
                          : lead.gstinProfile.recommendedTerms === 'advance_100'
                            ? 'Recommended: 100% Advance Required'
                            : lead.gstinProfile.recommendedTerms === 'manual_review'
                              ? 'Action Needed: Verify GSTIN Check Digit'
                              : 'Recommended: 50% Advance + Balance on LR'}
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {lead.gstinProfile.creditAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Enter buyer&apos;s 15-character GSTIN to validate Mod-36 checksum, State Code, Entity Type, and Workspace Overdue Ledger before quoting credit terms.
                </p>
              )}
            </div>
          )}

          {/* Meta Form Answers Section */}
          {(lead.metaLeadData || lead.source === 'meta_lead_ads') && (
            <div className="bg-white rounded-3xl p-6 border border-blue-200/80 shadow-sm space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                    Meta (Facebook &amp; Instagram) Lead Ads
                  </div>
                  <h3 className="text-sm font-extrabold text-brand-navy mt-0.5">
                    Meta Form Answers
                    {lead.metaLeadData?.formName
                      ? ` · ${lead.metaLeadData.formName}`
                      : ''}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                    lead.autoWhatsAppWelcomeSent
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    {lead.autoWhatsAppWelcomeSent
                      ? 'WhatsApp Auto-Greeting Delivered'
                      : 'WhatsApp Auto-Greeting Pending'}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">
                    Ad ID
                  </span>
                  <span className="font-mono font-bold text-brand-navy">
                    {lead.metaLeadData?.adId || lead.adId || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">
                    Leadgen ID
                  </span>
                  <span className="font-mono font-bold text-brand-navy">
                    {lead.metaLeadData?.leadgenId || lead.externalQueryId || '—'}
                  </span>
                </div>
              </div>

              {lead.metaLeadData?.rawFields &&
              Object.keys(lead.metaLeadData.rawFields).length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                  {Object.entries(lead.metaLeadData.rawFields).map(
                    ([questionKey, answerVal]) => (
                      <div
                        key={questionKey}
                        className="p-3 bg-slate-50/60 flex items-start justify-between gap-3"
                      >
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {questionKey}
                        </span>
                        <span className="font-semibold text-brand-navy text-right">
                          {String(answerVal)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-500">
                  Submitted via Meta Lead Form{' '}
                  {lead.metaLeadData?.pageName
                    ? `on ${lead.metaLeadData.pageName}`
                    : ''}
                  .
                </div>
              )}
            </div>
          )}

          <CustomFieldsDisplayCard
            entity="lead"
            values={lead.customFields}
            onSave={async (nextValues) => {
              const { data } = await apiClient.patch<Lead>(`/leads/${lead.id}`, {
                customFields: nextValues,
              });
              setLead(data);
            }}
          />

          {/* SetuAI Next-Best-Action Card */}
          <div
            className="rounded-3xl p-6 text-white space-y-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #1E3358 100%)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-sky">
                <Sparkles className="w-4 h-4" /> SetuAI 360° Lead Intelligence
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Score {lead.aiScore} · {lead.aiLabel}
                </span>
                <button
                  type="button"
                  disabled={isAnalyzingAi}
                  onClick={() => void handleAnalyzeAi()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white disabled:opacity-60 transition-colors"
                >
                  {isAnalyzingAi ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Rescore AI
                </button>
              </div>
            </div>

            {lead.aiSummary && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AI Context Summary
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {lead.aiSummary}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-sky">
                Recommended Next Best Action
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {lead.aiNextAction ||
                  lead.aiInsight ||
                  'Send introductory WhatsApp message and share GST quotation.'}
              </p>
            </div>

            {lead.aiReasons && lead.aiReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {lead.aiReasons.map((reason, idx) => (
                  <span
                    key={`${reason}-${idx}`}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-slate-200"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Activity, Notes Timeline & 2-Way Email Thread */}
        <div className="lg:col-span-7 space-y-6">
          <Customer360TimelineCard
            entityType="lead"
            entityId={lead.id}
            onActivityAdded={() => void loadLead()}
          />
          <LeadTimeline
            activities={lead.activities || []}
            onAddActivity={handleAddActivity}
          />
          <EntityEmailPanel
            entityType="lead"
            entityId={lead.id}
            entityLabel={lead.company || lead.name}
            defaultToEmail={lead.email || ''}
            contactName={lead.name}
            companyName={lead.company || ''}
            dealValueLabel={
              lead.estimatedValue
                ? `₹${Number(lead.estimatedValue).toLocaleString('en-IN')}`
                : ''
            }
            senderName={user?.name || 'Sales Desk'}
            onEmailActivity={() => void loadLead()}
          />
        </div>
      </div>

      <VoiceCrmAuditModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        initialDealerName={lead.name}
        initialCompany={lead.company}
        initialPhone={lead.phone}
        initialCity={lead.city}
        initialStage={lead.status}
        onActivitySaved={(type, description) =>
          handleAddActivity({ type, description })
        }
      />
    </div>
  );
}

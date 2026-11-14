'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Sparkles,
  Users,
  Flame,
  IndianRupee,
  CheckCircle2,
  LayoutGrid,
  List,
  MessageSquare,
  Phone,
  Edit3,
  Trash2,
  ArrowUpRight,
  Loader2,
  Database,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { Upload } from 'lucide-react';
import BulkCsvImportModal from '@/components/leads/BulkCsvImportModal';
import LeadForm from '@/components/leads/LeadForm';
import LeadCard from '@/components/leads/LeadCard';
import type { CreateLeadPayload, Lead, LeadStatus } from '@/types/contracts';

const statusTabs: { id: string; label: string }[] = [
  { id: 'all', label: 'All Leads' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal Sent' },
  { id: 'converted', label: 'Converted (Won)' },
  { id: 'lost', label: 'Lost' },
];

const sourceLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  indiamart: 'IndiaMART',
  justdial: 'Justdial',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  website: 'Website',
  referral: 'Referral',
  manual: 'Direct',
};

export default function LeadsPage() {
  const {
    leads,
    stats,
    filters,
    setFilters,
    isLoading,
    isMutating,
    error,
    createLead,
    updateLead,
    deleteLead,
    seedSamples,
    fetchLeads,
  } = useLeads();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleOpenCreate = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleFormSubmit = async (payload: CreateLeadPayload) => {
    if (editingLead) {
      await updateLead(editingLead.id, payload);
    } else {
      await createLead(payload);
    }
    setModalOpen(false);
    setEditingLead(null);
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    await updateLead(id, { status });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Gemini AI Lead Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Leads Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Capture, score, and convert buyers from WhatsApp, IndiaMART, and Meta Ads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.total === 0 && (
            <button
              type="button"
              onClick={seedSamples}
              disabled={isMutating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Load 5 Sample Delhi-NCR Leads</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCsvModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-brand-navy hover:bg-slate-50 transition-all"
          >
            <Upload className="w-4 h-4 text-brand-blue" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Leads',
            value: stats.total.toLocaleString('en-IN'),
            sub: `${stats.qualifiedCount} qualified in pipeline`,
            icon: Users,
            color: '#3978EA',
          },
          {
            label: 'Hot AI Leads (80+)',
            value: stats.hotCount.toLocaleString('en-IN'),
            sub: `Avg AI Score: ${stats.avgAiScore}/100`,
            icon: Flame,
            color: '#10B981',
          },
          {
            label: 'Active Pipeline Value',
            value: `₹${stats.totalPipelineValue.toLocaleString('en-IN')}`,
            sub: 'Excluding lost inquiries',
            icon: IndianRupee,
            color: '#F59E0B',
          },
          {
            label: 'Converted Deals',
            value: stats.convertedCount.toLocaleString('en-IN'),
            sub:
              stats.total > 0
                ? `${Math.round((stats.convertedCount / stats.total) * 100)}% conversion rate`
                : 'Ready to convert',
            icon: CheckCircle2,
            color: '#8B5CF6',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">
                  {kpi.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}15`, color: kpi.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-brand-navy">
                {kpi.value}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-1">
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const active = (filters.status || 'all') === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, status: tab.id }))
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Dropdown Filters + View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search by buyer name, company, +91 phone, or Delhi-NCR city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filters.source || 'all'}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, source: e.target.value }))
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="all">All Sources</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="indiamart">IndiaMART</option>
              <option value="justdial">Justdial</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
            </select>

            <select
              value={filters.aiLabel || 'all'}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, aiLabel: e.target.value }))
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="all">All AI Temperatures</option>
              <option value="Hot">🔥 Hot (80–100)</option>
              <option value="Warm">⚡ Warm (58–79)</option>
              <option value="Cold">❄️ Cold (&lt;58)</option>
            </select>

            <select
              value={filters.sortBy || 'aiScore'}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as 'aiScore' | 'createdAt' | 'estimatedValue',
                }))
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="aiScore">Sort: Highest AI Score</option>
              <option value="estimatedValue">Sort: Highest Deal Value</option>
              <option value="createdAt">Sort: Newest First</option>
            </select>

            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-brand-blue'
                    : 'text-slate-400'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-brand-blue'
                    : 'text-slate-400'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Leads Content */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <span className="text-sm font-semibold text-slate-600">
            Fetching &amp; scoring leads from MongoDB Atlas...
          </span>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center max-w-xl mx-auto my-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-brand-navy">
            No leads match your current view
          </h3>
          <p className="text-sm text-slate-500">
            Add your first buyer inquiry manually or load 5 realistic Delhi-NCR sample leads to
            test AI Lead Scoring &amp; WhatsApp actions immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Lead
            </button>
            <button
              type="button"
              onClick={seedSamples}
              disabled={isMutating}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all inline-flex items-center gap-2"
            >
              <Database className="w-4 h-4" /> Load 5 Sample Leads
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={handleStatusChange}
              onEdit={handleOpenEdit}
              onDelete={deleteLead}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Lead &amp; Company</th>
                  <th className="py-3.5 px-4">Source &amp; City</th>
                  <th className="py-3.5 px-4">Gemini AI Score</th>
                  <th className="py-3.5 px-4">Est. Deal Value</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.map((lead) => {
                  const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                  const waUrl = cleanPhone
                    ? `https://wa.me/${
                        cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
                      }?text=${encodeURIComponent(
                        `Namaste ${lead.name} ji, following up regarding your inquiry.`
                      )}`
                    : '#';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0"
                            style={{
                              background:
                                'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
                            }}
                          >
                            {lead.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/leads/${lead.id}`}
                              className="font-bold text-brand-navy hover:text-brand-blue inline-flex items-center gap-1"
                            >
                              <span>{lead.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            <div className="text-xs text-slate-500">
                              {lead.company || 'Direct Buyer'}{' '}
                              {lead.phone ? `· ${lead.phone}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md bg-brand-light text-brand-blue">
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">
                          {lead.city || 'Delhi-NCR'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                              lead.aiLabel === 'Hot'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : lead.aiLabel === 'Warm'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            AI {lead.aiScore} · {lead.aiLabel}
                          </span>
                        </div>
                        {lead.aiInsight && (
                          <div className="text-[11px] text-slate-400 max-w-xs truncate mt-1">
                            {lead.aiInsight}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-extrabold text-brand-navy">
                        ₹{(lead.estimatedValue || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(
                              lead.id,
                              e.target.value as LeadStatus
                            )
                          }
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="converted">Converted ✓</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {lead.phone && (
                            <>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Chat"
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                              <a
                                href={`tel:${lead.phone}`}
                                title="Call Buyer"
                                className="p-2 rounded-lg bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lead)}
                            title="Edit Lead"
                            className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLead(lead.id)}
                            title="Delete Lead"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <LeadForm
          initialData={editingLead}
          isSubmitting={isMutating}
          onClose={() => {
            setModalOpen(false);
            setEditingLead(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* CSV Bulk Importer Modal */}
      {csvModalOpen && (
        <BulkCsvImportModal
          onClose={() => setCsvModalOpen(false)}
          onImported={() => fetchLeads()}
        />
      )}
    </div>
  );
}

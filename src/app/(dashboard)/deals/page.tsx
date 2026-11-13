'use client';

import { useState, FormEvent } from 'react';
import {
  Plus,
  Search,
  IndianRupee,
  TrendingUp,
  Trophy,
  Kanban,
  Database,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import KanbanBoard from '@/components/deals/KanbanBoard';
import type { DealStage } from '@/types/contracts';

export default function DealsPage() {
  const {
    deals,
    stats,
    search,
    setSearch,
    isLoading,
    isMutating,
    error,
    createDeal,
    moveStage,
    deleteDeal,
    seedDeals,
  } = useDeals();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<DealStage>('proposal');
  const [notes, setNotes] = useState('');

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createDeal({
      title,
      company,
      contactName,
      contactPhone,
      city,
      value: Number(value) || 0,
      stage,
      notes,
      tags: ['GST 18%', 'B2B'],
    });
    setModalOpen(false);
    setTitle('');
    setCompany('');
    setContactName('');
    setContactPhone('');
    setValue('');
    setNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Visual Revenue Kanban
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Deals &amp; Sales Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Drag and drop deals across stages or update status in one click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.totalDeals === 0 && (
            <button
              type="button"
              onClick={seedDeals}
              disabled={isMutating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Load 5 Sample Delhi-NCR Deals</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Pipeline KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Open Pipeline Value',
            value: `₹${stats.openPipelineValue.toLocaleString('en-IN')}`,
            sub: `${stats.openCount} active deals`,
            icon: Kanban,
            color: '#3978EA',
          },
          {
            label: 'Weighted AI Forecast',
            value: `₹${stats.weightedForecast.toLocaleString('en-IN')}`,
            sub: 'Probability-adjusted INR',
            icon: TrendingUp,
            color: '#8B5CF6',
          },
          {
            label: 'Closed Won Revenue',
            value: `₹${stats.wonRevenue.toLocaleString('en-IN')}`,
            sub: `${stats.wonCount} deals won`,
            icon: Trophy,
            color: '#10B981',
          },
          {
            label: 'Avg. Deal Size',
            value: `₹${
              stats.totalDeals > 0
                ? Math.round(
                    (stats.openPipelineValue + stats.wonRevenue) /
                      stats.totalDeals
                  ).toLocaleString('en-IN')
                : '0'
            }`,
            sub: 'Across all stages',
            icon: IndianRupee,
            color: '#F59E0B',
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

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pipeline by deal title, company, or city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          💡 Tip: Drag any card between columns to update its stage &amp; win probability
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <span className="text-sm font-semibold text-slate-600">
            Loading Kanban pipeline from MongoDB Atlas...
          </span>
        </div>
      ) : (
        <KanbanBoard
          deals={deals}
          onMoveStage={moveStage}
          onDelete={deleteDeal}
        />
      )}

      {/* New Deal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">Create Pipeline Deal</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 500 Switchgear Units Supply"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="RS Electricals Pvt. Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Deal Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="450000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Buyer Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    WhatsApp Phone (+91)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98112 45678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as DealStage)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white"
                  >
                    <option value="qualified">Qualified (25%)</option>
                    <option value="discovery">Discovery (45%)</option>
                    <option value="proposal">Proposal Sent (65%)</option>
                    <option value="negotiation">Negotiation (85%)</option>
                    <option value="won">Closed Won (100%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    City / Territory
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karol Bagh, New Delhi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Proposal &amp; GST Billing Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Proforma invoice details, advance terms..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

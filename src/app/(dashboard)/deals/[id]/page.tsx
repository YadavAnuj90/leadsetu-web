'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Send,
  Trash2,
  FileText,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { Deal, DealStage } from '@/types/contracts';

const stages: { id: DealStage; label: string }[] = [
  { id: 'qualified', label: 'Qualified (25%)' },
  { id: 'discovery', label: 'Discovery (45%)' },
  { id: 'proposal', label: 'Proposal Sent (65%)' },
  { id: 'negotiation', label: 'Negotiation (85%)' },
  { id: 'won', label: 'Closed Won ✓' },
];

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dealId = params?.id;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDeal = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<Deal>(`/deals/${dealId}`);
      setDeal(data);
    } catch {
      setDeal(null);
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  const handleStageChange = async (stage: DealStage) => {
    if (!deal) return;
    const { data } = await apiClient.patch<Deal>(`/deals/${deal.id}`, { stage });
    setDeal(data);
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!deal || !note.trim()) return;
    const { data } = await apiClient.post<Deal>(`/deals/${deal.id}/activities`, {
      type: 'note',
      description: note.trim(),
    });
    setDeal(data);
    setNote('');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
        <p className="text-lg font-extrabold text-brand-navy">Deal not found</p>
        <p className="text-xs sm:text-sm text-slate-500">
          This deal record may have been removed or moved.
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
            href="/deals"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50"
          >
            All Deals
          </Link>
        </div>
      </div>
    );
  }

  const gstAmount = Math.round((deal.value || 0) * 0.18);
  const totalWithGst = (deal.value || 0) + gstAmount;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Kanban Pipeline
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/invoices?client=${encodeURIComponent(deal.company || deal.contactName || deal.title)}&contact=${encodeURIComponent(deal.contactName || '')}&phone=${encodeURIComponent(deal.contactPhone || '')}&amount=${deal.value || 0}&title=${encodeURIComponent(deal.title)}`}
            className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          >
            <FileText className="w-3.5 h-3.5" /> Generate GST Invoice
          </Link>

          <button
            type="button"
            onClick={async () => {
              await apiClient.delete(`/deals/${deal.id}`);
              router.push('/deals');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Deal
          </button>
        </div>
      </div>

      {/* Stage Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {stages.map((st) => {
            const active = deal.stage === st.id;
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
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h1 className="text-xl font-extrabold text-brand-navy">{deal.title}</h1>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-blue" />
              <span>{deal.company || 'B2B Client'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Deal Value</span>
                <span className="font-bold text-brand-navy">
                  ₹{deal.value.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST (18% IGST/CGST+SGST)</span>
                <span className="font-bold text-slate-600">
                  ₹{gstAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-brand-navy">Total Invoice Value</span>
                <span className="font-extrabold text-emerald-600">
                  ₹{totalWithGst.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2">
              {deal.contactName && <div>Contact: <strong>{deal.contactName}</strong></div>}
              {deal.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-blue" /> {deal.contactPhone}
                </div>
              )}
              {deal.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-blue" /> {deal.contactEmail}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" /> {deal.city}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <h3 className="font-extrabold text-base text-brand-navy">
            Deal Activity &amp; Negotiation Log
          </h3>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Log negotiation update, discount approval, or payment milestone..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
            />
            <button
              type="submit"
              className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Add Note
            </button>
          </form>

          <div className="space-y-3">
            {(deal.activities || []).map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="text-xs sm:text-sm font-medium text-brand-navy">
                  {act.description}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  @{act.authorName} ·{' '}
                  {new Date(act.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Trash2,
  Edit3,
} from 'lucide-react';
import type { Lead, LeadStatus } from '@/types/contracts';

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

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

export default function LeadCard({
  lead,
  onStatusChange,
  onEdit,
  onDelete,
}: LeadCardProps) {
  const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(
        `Namaste ${lead.name} ji, connecting from Leadsetu regarding your inquiry.`
      )}`
    : '#';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-blue/40 transition-all flex flex-col justify-between space-y-4">
      <div>
        {/* Top Row: Avatar + Name + AI Score */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
              }}
            >
              {lead.name[0]?.toUpperCase()}
            </div>
            <div className="truncate">
              <Link
                href={`/leads/${lead.id}`}
                className="font-bold text-sm text-brand-navy hover:text-brand-blue transition-colors inline-flex items-center gap-1"
              >
                <span className="truncate">{lead.name}</span>
                <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
              </Link>
              <div className="text-xs text-slate-500 truncate">
                {lead.company || 'Individual Buyer'}
              </div>
            </div>
          </div>

          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border flex-shrink-0 ${
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

        {/* Value & Source Row */}
        <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Est. Value
            </span>
            <span className="font-extrabold text-sm text-brand-navy">
              ₹{(lead.estimatedValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Source
            </span>
            <span className="font-semibold text-brand-blue">
              {sourceLabels[lead.source] || lead.source}
            </span>
          </div>
        </div>

        {/* AI Insight Box */}
        {lead.aiInsight && (
          <div className="p-2.5 rounded-xl bg-brand-light/70 border border-brand-blue/15 text-[11px] text-brand-navy flex items-start gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-blue flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{lead.aiInsight}</span>
          </div>
        )}

        {/* Location & Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          {lead.city && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100">
              <MapPin className="w-3 h-3 text-slate-400" /> {lead.city}
            </span>
          )}
          {lead.tags?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded bg-brand-light text-brand-blue font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <select
          value={lead.status}
          onChange={(e) =>
            onStatusChange(lead.id, e.target.value as LeadStatus)
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

        <div className="flex items-center gap-1.5">
          {lead.phone && (
            <>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                title="Chat on WhatsApp"
                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
              <a
                href={`tel:${lead.phone}`}
                title="Call Lead"
                className="p-2 rounded-lg bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => onEdit(lead)}
            title="Edit Lead"
            className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(lead.id)}
            title="Delete Lead"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  Building2,
  MessageSquare,
  Phone,
  Calendar,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import type { Deal, DealStage } from '@/types/contracts';

interface DealCardProps {
  deal: Deal;
  onMoveStage: (id: string, stage: DealStage) => void;
  onDelete: (id: string) => void;
}

export default function DealCard({
  deal,
  onMoveStage,
  onDelete,
}: DealCardProps) {
  const cleanPhone = (deal.contactPhone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${
        cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
      }?text=${encodeURIComponent(
        `Namaste ${deal.contactName || 'Sir'}, following up on our proposal for ${deal.title}.`
      )}`
    : '#';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', deal.id);
      }}
      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-blue/50 transition-all cursor-grab active:cursor-grabbing space-y-2.5 overflow-hidden"
    >
      {/* Top Row: Title + Probability */}
      <div className="flex items-start justify-between gap-1.5">
        <Link
          href={`/deals/${deal.id}`}
          className="font-bold text-xs text-brand-navy hover:text-brand-blue transition-colors inline-flex items-start gap-1 leading-snug min-w-0"
        >
          <span className="line-clamp-2">{deal.title}</span>
          <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        </Link>

        <span
          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
            deal.probability >= 80
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : deal.probability >= 45
              ? 'bg-brand-light text-brand-blue'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {deal.probability}%
        </span>
      </div>

      {/* Company & Contact */}
      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 min-w-0">
        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="truncate">
          {deal.company || deal.contactName || 'B2B Client'} · {deal.city}
        </span>
      </div>

      {/* Value & Close Date */}
      <div className="flex flex-wrap items-center justify-between gap-1 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
        <span className="font-extrabold text-xs sm:text-sm text-brand-navy">
          ₹{(deal.value || 0).toLocaleString('en-IN')}
        </span>
        {deal.expectedCloseDate && (
          <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {deal.expectedCloseDate}
          </span>
        )}
      </div>

      {/* Tags */}
      {deal.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-light text-brand-blue truncate max-w-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stage Selector & Quick Actions — Fitted cleanly inside narrow Kanban columns */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <select
          value={deal.stage}
          onChange={(e) => onMoveStage(deal.id, e.target.value as DealStage)}
          className="flex-1 min-w-0 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 text-brand-navy bg-white focus:outline-none focus:border-brand-blue truncate"
        >
          <option value="qualified">Qualified</option>
          <option value="discovery">Discovery</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won ✓</option>
          <option value="lost">Lost</option>
        </select>

        <div className="flex items-center gap-1 flex-shrink-0">
          {deal.contactPhone && (
            <>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp Client"
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
              <a
                href={`tel:${deal.contactPhone}`}
                title="Call Client"
                className="p-1.5 rounded-lg bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => onDelete(deal.id)}
            title="Delete Deal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import DealCard from './DealCard';
import type { Deal, DealStage } from '@/types/contracts';

interface KanbanBoardProps {
  deals: Deal[];
  onMoveStage: (id: string, stage: DealStage) => void;
  onDelete: (id: string) => void;
}

const columns: {
  id: DealStage;
  title: string;
  accent: string;
}[] = [
  { id: 'qualified', title: 'Qualified (25%)', accent: '#3978EA' },
  { id: 'discovery', title: 'Discovery & Sample (45%)', accent: '#8B5CF6' },
  { id: 'proposal', title: 'GST Proposal Sent (65%)', accent: '#F59E0B' },
  { id: 'negotiation', title: 'Negotiation (85%)', accent: '#EC4899' },
  { id: 'won', title: 'Closed Won ✓ (100%)', accent: '#10B981' },
];

export default function KanbanBoard({
  deals,
  onMoveStage,
  onDelete,
}: KanbanBoardProps) {
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
      {columns.map((col) => {
        const colDeals = deals.filter((d) => d.stage === col.id);
        const colTotal = colDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
        const isOver = dragOverStage === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(col.id);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              const dealId = e.dataTransfer.getData('text/plain');
              if (dealId) {
                onMoveStage(dealId, col.id);
              }
            }}
            className={`rounded-3xl p-3.5 border transition-all min-h-[460px] flex flex-col ${
              isOver
                ? 'bg-brand-light/70 border-brand-blue ring-2 ring-brand-blue/20'
                : 'bg-slate-100/80 border-slate-200/80'
            }`}
          >
            {/* Column Header */}
            <div className="p-2 mb-3 border-b border-slate-200/70">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: col.accent }}
                  />
                  <h3 className="font-extrabold text-xs text-brand-navy">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                  {colDeals.length}
                </span>
              </div>
              <div className="text-xs font-extrabold text-slate-600 pl-4">
                ₹{colTotal.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Cards Stack */}
            <div className="space-y-3 flex-1">
              {colDeals.length === 0 ? (
                <div className="h-32 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400 text-center px-3">
                  Drag a deal card here
                </div>
              ) : (
                colDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onMoveStage={onMoveStage}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

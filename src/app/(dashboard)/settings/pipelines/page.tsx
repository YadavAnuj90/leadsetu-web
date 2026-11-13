'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Kanban } from 'lucide-react';

const stages = [
  { name: 'Qualified Inquiry', prob: '25%' },
  { name: 'Discovery & Site Visit', prob: '45%' },
  { name: 'Proposal & GST Quote Sent', prob: '65%' },
  { name: 'Commercial Negotiation', prob: '85%' },
  { name: 'Closed Won', prob: '100%' },
];

export default function PipelinesSettingsPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Kanban className="w-5 h-5 text-brand-blue" />
          <h1 className="text-xl font-extrabold text-brand-navy">
            Sales Pipeline Stages
          </h1>
        </div>
        <div className="space-y-2.5">
          {stages.map((s, idx) => (
            <div
              key={s.name}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-bold text-brand-navy"
            >
              <span>
                Stage 0{idx + 1}: {s.name}
              </span>
              <span className="text-brand-blue">Win Probability: {s.prob}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

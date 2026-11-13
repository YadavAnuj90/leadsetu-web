'use client';

import { useState, FormEvent } from 'react';
import {
  MessageSquare,
  PhoneCall,
  FileText,
  Sparkles,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';
import type { LeadActivity } from '@/types/contracts';

interface LeadTimelineProps {
  activities: LeadActivity[];
  onAddActivity: (payload: {
    type: LeadActivity['type'];
    description: string;
  }) => Promise<void>;
}

export default function LeadTimeline({
  activities,
  onAddActivity,
}: LeadTimelineProps) {
  const [noteText, setNoteText] = useState('');
  const [activityType, setActivityType] =
    useState<LeadActivity['type']>('note');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsSaving(true);
    try {
      await onAddActivity({
        type: activityType,
        description: noteText.trim(),
      });
      setNoteText('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-brand-navy">
          Activity &amp; Follow-up Timeline
        </h3>
        <span className="text-xs text-slate-400">
          {activities?.length || 0} logged events
        </span>
      </div>

      {/* Add Note / Call Log Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'note', label: 'Internal Note', icon: FileText },
              { id: 'whatsapp', label: 'WhatsApp Follow-up', icon: MessageSquare },
              { id: 'call', label: 'Phone Call Log', icon: PhoneCall },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActivityType(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activityType === t.id
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-blue'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Log call summary, buyer objection, or next follow-up date..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            disabled={isSaving || !noteText.trim()}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Log Activity</span>
          </button>
        </div>
      </form>

      {/* Timeline List */}
      <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {(activities || []).map((act) => (
          <div key={act.id} className="relative pl-10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center absolute left-0 top-0 border bg-white shadow-sm"
              style={{ borderColor: 'rgba(57, 120, 234, 0.25)', color: '#3978EA' }}
            >
              {act.type === 'whatsapp' ? (
                <MessageSquare className="w-4 h-4 text-emerald-500" />
              ) : act.type === 'call' ? (
                <PhoneCall className="w-4 h-4 text-brand-blue" />
              ) : act.type === 'status_change' ? (
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
              ) : act.type === 'created' ? (
                <Sparkles className="w-4 h-4 text-brand-blue" />
              ) : (
                <FileText className="w-4 h-4 text-slate-500" />
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="text-xs sm:text-sm font-medium text-brand-navy">
                {act.description}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span className="font-semibold text-slate-500">
                  @{act.authorName || 'team'}
                </span>
                <span>·</span>
                <span>
                  {new Date(act.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

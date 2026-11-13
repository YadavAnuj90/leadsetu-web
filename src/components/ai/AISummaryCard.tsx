'use client';

export default function AISummaryCard({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <div className="p-4 rounded-2xl bg-brand-light text-xs text-brand-navy">
      {summary}
    </div>
  );
}

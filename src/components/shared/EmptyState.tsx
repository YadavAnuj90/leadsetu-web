'use client';

export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80">
      <h3 className="text-base font-extrabold text-brand-navy">{title}</h3>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

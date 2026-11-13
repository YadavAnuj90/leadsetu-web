'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
      <span>{label}</span>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, LayoutDashboard } from 'lucide-react';

export default function DashboardErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-5">
      <h2 className="text-xl font-extrabold text-brand-navy">
        Couldn&apos;t load this section
      </h2>
      <p className="text-xs sm:text-sm text-slate-500">
        You can go straight back to your previous tab without losing your session.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back to Previous Tab</span>
        </button>

        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>

        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-brand-blue" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

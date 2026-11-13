'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, LayoutDashboard, AlertTriangle } from 'lucide-react';

export default function GlobalErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-brand-navy">
            Unable to load this view
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Return to your previous tab or retry loading this page.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
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
    </div>
  );
}

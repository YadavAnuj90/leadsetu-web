'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
          }}
        >
          <Compass className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue">
            404 · Page Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-brand-navy mt-1">
            This page or record couldn&apos;t be found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            The link may have been moved or deleted. You can jump right back to your previous
            tab without losing your work.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-primary-brand w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Previous Tab</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50 inline-flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-brand-blue" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

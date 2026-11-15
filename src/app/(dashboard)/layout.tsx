'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { getRouteFeatureRestriction } from '@/lib/feature-access';
import { Loader2, ShieldAlert, ArrowUpRight, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, refreshProfile, user, tenant } = useAuth();
  const { impersonationBackup, restoreFromImpersonation } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    } else if (isHydrated && isAuthenticated) {
      refreshProfile();
    }
  }, [isHydrated, isAuthenticated, pathname, router, refreshProfile]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    const onFocus = () => {
      refreshProfile();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isHydrated, isAuthenticated, refreshProfile]);

  const handleExitImpersonation = () => {
    const ok = restoreFromImpersonation();
    if (ok) {
      router.push('/super-admin');
    }
  };

  const restriction = getRouteFeatureRestriction(pathname, tenant);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-brand-navy">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
          <span>Loading your Leadsetu workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-shell dashboard-shell-surface h-screen overflow-hidden flex dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {impersonationBackup && (
          <div className="px-4 py-2 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white flex flex-wrap items-center justify-between gap-2 text-xs font-bold shadow-md z-30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>
                SUPPORT IMPERSONATION ACTIVE · Viewing{' '}
                <strong className="underline">{tenant?.name}</strong> (#{tenant?.accountId}) · Reason:{' '}
                <span className="font-normal opacity-95">{impersonationBackup.reason}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitImpersonation}
              className="px-3 py-1 rounded-lg bg-white text-rose-700 hover:bg-rose-50 font-extrabold transition-colors shadow-sm"
            >
              Exit to Super Admin Vault →
            </button>
          </div>
        )}

        {!impersonationBackup && user?.role === 'super_admin' && (
          <div className="px-4 py-1.5 bg-[#091224] text-sky-200 border-b border-sky-500/30 flex items-center justify-between gap-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Signed in with Leadsetu HQ Super Admin Authority</span>
            </div>
            <Link
              href="/super-admin"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-300 hover:bg-sky-500/30 font-bold"
            >
              <span>Open Super Admin Panel</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        <Header />
        <main className="flex-1 p-6 overflow-y-auto overscroll-contain">
          {tenant?.maintenanceMode && user?.role !== 'super_admin' ? (
            <div className="max-w-xl mx-auto mt-12 rounded-3xl border border-rose-500/30 bg-white dark:bg-[#0D1628] p-8 text-center shadow-xl space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-brand-navy dark:text-white">
                Platform Maintenance Mode Active
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Leadsetu Cloud has temporarily paused workspace access for scheduled maintenance. All CRM records remain safely preserved.
              </p>
            </div>
          ) : restriction ? (
            <div className="max-w-xl mx-auto mt-12 rounded-3xl border border-amber-500/30 bg-white dark:bg-[#0D1628] p-8 text-center shadow-xl space-y-5">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">
                  {restriction.source === 'kill_switch'
                    ? 'Global Kill-Switch OFF'
                    : restriction.source === 'plan'
                      ? 'Plan Entitlement Lock'
                      : 'Forced OFF by Super Admin'}
                </span>
                <h2 className="text-xl font-black text-brand-navy dark:text-white">
                  {restriction.label} Is Disabled
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {restriction.reasonText}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0057FF] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Dashboard
                </Link>
                {impersonationBackup && (
                  <button
                    type="button"
                    onClick={handleExitImpersonation}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    Exit to Super Admin Vault →
                  </button>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

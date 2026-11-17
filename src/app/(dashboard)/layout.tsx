'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { useAuth } from '@/hooks/useAuth';
import { getRouteFeatureRestriction, isWorkspaceAdminRole } from '@/lib/feature-access';
import { Loader2, ShieldAlert, Lock, ArrowLeft, UserCircle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, refreshProfile, user, tenant } = useAuth();

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

  const isAdmin = isWorkspaceAdminRole(user);
  const restriction = getRouteFeatureRestriction(pathname, tenant, user);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] dark:bg-[#070D19]">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-brand-navy dark:text-slate-100">
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
        <Header />
        {(tenant?.quotas?.aiWarning ||
          tenant?.quotas?.waWarning ||
          tenant?.quotas?.aiExceeded ||
          tenant?.quotas?.waExceeded) && (
          <div
            className={`px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b ${
              tenant.quotas.aiExceeded || tenant.quotas.waExceeded
                ? 'bg-rose-600/95 text-white border-rose-500'
                : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {tenant.quotas.aiExceeded || tenant.quotas.waExceeded
                  ? 'Monthly Quota Limit Reached (100%):'
                  : 'High Quota Usage Alert (80%+):'}{' '}
                Gemini AI {tenant.quotas.aiCallsUsed}/{tenant.quotas.maxMonthlyAiCalls} ({tenant.quotas.aiPct}%) · WhatsApp {tenant.quotas.whatsappUsed}/{tenant.quotas.maxMonthlyWhatsapp} ({tenant.quotas.waPct}%)
              </span>
            </div>
            {isAdmin && (
              <Link
                href="/settings"
                className="px-2.5 py-1 rounded-lg bg-white/90 text-slate-900 hover:bg-white text-[11px] font-extrabold"
              >
                Upgrade / Add-On Pack →
              </Link>
            )}
          </div>
        )}
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
                  {restriction.source === 'admin_only'
                    ? 'Admin Access Only'
                    : restriction.source === 'user_restricted'
                      ? 'Not Assigned to Your Profile'
                      : restriction.source === 'kill_switch'
                        ? 'Module Temporarily Unavailable'
                        : restriction.source === 'plan'
                          ? 'Plan Entitlement Lock'
                          : 'Module Disabled'}
                </span>
                <h2 className="text-xl font-black text-brand-navy dark:text-white">
                  {restriction.source === 'admin_only'
                    ? 'Reserved for Workspace Admin'
                    : `${restriction.label} Is Disabled`}
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
                {!isAdmin && (
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-brand-navy dark:text-slate-100 hover:border-brand-blue transition"
                  >
                    <UserCircle className="w-3.5 h-3.5 text-brand-blue" />
                    Open My Profile
                  </Link>
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

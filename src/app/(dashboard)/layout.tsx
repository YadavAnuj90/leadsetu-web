'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, refreshProfile } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    } else if (isHydrated && isAuthenticated) {
      refreshProfile();
    }
  }, [isHydrated, isAuthenticated, router, refreshProfile]);

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
        <Header />
        <main className="flex-1 p-6 overflow-y-auto overscroll-contain">{children}</main>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  const isLoginRoute = pathname === '/super-admin/login';

  useEffect(() => {
    if (!isHydrated || isLoginRoute) return;
    if (!isAuthenticated || !user || user.role !== 'super_admin') {
      router.replace('/super-admin/login');
    }
  }, [isHydrated, isLoginRoute, isAuthenticated, user, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!isHydrated) {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
            <Shield className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">
            Verifying Leadsetu HQ Authority Vault...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'super_admin') {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3 text-center">
          <Shield className="h-7 w-7 text-amber-400" />
          <p className="text-sm text-slate-300">
            Super Admin clearance required. Redirecting to HQ Vault Sign-In...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

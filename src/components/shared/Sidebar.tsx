'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  MessageSquare,
  CheckSquare,
  Workflow,
  BarChart3,
  FileText,
  ScrollText,
  FolderOpen,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  Sparkles,
  Megaphone,
  LifeBuoy,
  UserCircle,
  Hash,
  PhoneCall,
  Webhook,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCallUiStore } from '@/store/call-ui.store';
import {
  isFeatureEnabled,
  isWorkspaceAdminRole,
  USER_FEATURE_CATALOG,
} from '@/lib/feature-access';
import {
  getBusinessModeMeta,
  getSidebarModuleLabel,
  isNavModuleHiddenForTenant,
} from '@/lib/business-modes';
import type { UserFeatureKey } from '@/types/contracts';

const navItems: Array<{
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  feature?: UserFeatureKey;
  adminOnly?: boolean;
  userOnly?: boolean;
}> = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users, badge: 'AI', feature: 'leads' },
  { label: 'Instant Forms', href: '/lead-forms', icon: ClipboardList, badge: 'New', feature: 'leads' },
  { label: 'Contacts (B2B)', href: '/contacts', icon: Building2, feature: 'contacts' },
  { label: 'Deals Pipeline', href: '/deals', icon: Kanban, feature: 'deals' },
  { label: 'WhatsApp Inbox', href: '/inbox', icon: MessageSquare, badge: 'Live', feature: 'whatsappCloud' },
  { label: 'CRM Phone', href: '/calls', icon: PhoneCall, badge: 'Voice' },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone, feature: 'whatsappBroadcasts' },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, feature: 'tasks' },
  { label: 'SLA Tickets', href: '/tickets', icon: LifeBuoy, feature: 'slaTickets' },
  { label: 'Workflows', href: '/workflows', icon: Workflow, feature: 'aiWorkflows' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, feature: 'analytics' },
  { label: 'Products & HSN', href: '/products', icon: Package, feature: 'products' },
  { label: 'Quotations', href: '/quotations', icon: ScrollText, badge: 'PDF', feature: 'gstBilling' },
  { label: 'GST Invoices', href: '/invoices', icon: FileText, feature: 'gstBilling' },
  { label: 'Document Center', href: '/documents', icon: FolderOpen, feature: 'documentVault' },
  { label: 'Webhooks Hub', href: '/webhooks', icon: Webhook, badge: 'HTTPS', adminOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  { label: 'My Profile', href: '/profile', icon: UserCircle, userOnly: true },
];

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user, tenant, requestLogout } = useAuth();
  const pendingMissed = useCallUiStore(
    (s) => s.historyStats.pendingCallbacks || 0,
  );
  const isAdmin = isWorkspaceAdminRole(user);

  useEffect(() => {
    onCloseMobile?.();
    // Close mobile drawer whenever route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.userOnly && isAdmin) return false;
    if (isNavModuleHiddenForTenant(tenant, item.feature)) return false;
    if (!item.feature) return true;
    return isFeatureEnabled(tenant, item.feature, user);
  });
  const modeMeta = getBusinessModeMeta(tenant?.businessMode);
  const aiOn = isFeatureEnabled(tenant, 'aiScoring', user);
  const waOn = isFeatureEnabled(tenant, 'whatsappCloud', user);
  const assignedCount = USER_FEATURE_CATALOG.filter((f) =>
    isFeatureEnabled(tenant, f.key, user),
  ).length;
  const roleDisplay =
    user?.role === 'manager'
      ? 'Sales Manager'
      : user?.role === 'agent'
        ? 'Sales User'
        : user?.role === 'support'
          ? 'Support Engineer'
          : user?.role === 'owner'
            ? 'Owner'
            : 'Workspace Admin';

  const homeHref = user?.role === 'support' ? '/tickets' : '/dashboard';

  const sidebarContent = (isDrawer: boolean) => (
    <aside
      className={`sidebar-theme-surface w-64 h-full flex-shrink-0 flex flex-col text-white border-r border-white/10 overflow-hidden transition-colors ${
        isDrawer ? 'w-72 max-w-[85vw] shadow-2xl' : 'hidden md:flex'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 pb-4 flex-shrink-0 flex items-center justify-between gap-2">
        <Link
          href={homeHref}
          onClick={() => isDrawer && onCloseMobile?.()}
          className="flex items-center gap-2.5 min-w-0 flex-1"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-1 ring-white/20 flex-shrink-0 bg-white/10">
            <img
              src={tenant?.logoUrl || '/logo.png'}
              alt={tenant?.companyName?.trim() || 'Leadsetu Logo'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="truncate">
            <div className="font-extrabold text-lg leading-tight text-white">
              Lead<span style={{ color: '#68A0FF' }}>setu</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {tenant?.companyName?.trim() || 'AI CRM Workspace'}
            </div>
            <div className="text-[10px] font-bold text-brand-sky/90 uppercase tracking-wider truncate mt-0.5">
              {modeMeta.shortBadge}
            </div>
          </div>
        </Link>
        {isDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Independent Scrollable Navigation Links */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const isCallsAlert = item.href === '/calls' && pendingMissed > 0;
          const badgeText =
            item.href === '/leads' && !aiOn
              ? undefined
              : isCallsAlert
                ? `${pendingMissed} Missed`
                : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isDrawer && onCloseMobile?.()}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {getSidebarModuleLabel(tenant?.businessMode, item.href, item.label)}
                </span>
              </span>
              {badgeText && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isCallsAlert
                      ? 'bg-rose-500 text-white'
                      : active
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-blue/20 text-brand-sky'
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Card */}
      <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0">
        {isAdmin ? (
          <Link
            href="/settings/billing"
            onClick={() => isDrawer && onCloseMobile?.()}
            className="block p-3 rounded-xl bg-brand-blue/15 border border-brand-blue/30 hover:border-brand-sky/50 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-sky">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="capitalize">
                {tenant?.plan || 'Growth'} Plan · {tenant?.status === 'active' ? 'Active' : 'Trial'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {aiOn && waOn
                ? 'SetuAI & WhatsApp Active'
                : aiOn
                  ? 'SetuAI Active · WhatsApp Off'
                  : waOn
                    ? 'WhatsApp Active · AI Paused'
                    : 'Modules Managed by Plan'}
            </div>
          </Link>
        ) : (
          <Link
            href="/profile"
            onClick={() => isDrawer && onCloseMobile?.()}
            className="block p-3 rounded-xl bg-brand-blue/15 border border-brand-blue/30 hover:border-brand-sky/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-brand-sky">
              <span>{roleDisplay}</span>
              <span className="font-mono text-[10px] text-emerald-300">
                {assignedCount} {assignedCount === 1 ? 'Module' : 'Modules'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1 font-mono">
              <Hash className="w-3 h-3 text-slate-400" />
              <span>UID #{user?.userCode || '—'}</span>
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.06] border border-white/10 shadow-inner">
          <Link
            href={isAdmin ? '/settings' : '/profile'}
            onClick={() => isDrawer && onCloseMobile?.()}
            className="flex items-center gap-2.5 min-w-0 flex-1 group"
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0057FF] via-[#2563EB] to-[#38BDF8] flex items-center justify-center text-xs font-black text-white shadow-md ring-1 ring-white/25 group-hover:scale-105 transition-transform">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0D1628]"
                title="Online"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-white capitalize truncate">
                  {user?.name || 'Leadsetu User'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/25 shrink-0">
                  {user?.role === 'owner'
                    ? 'Owner'
                    : user?.role === 'admin'
                      ? 'Admin'
                      : user?.role === 'manager'
                        ? 'Mgr'
                        : user?.role === 'support'
                          ? 'Support'
                          : 'Rep'}
                </span>
              </div>
              <div className="text-[10.5px] text-slate-300/80 truncate mt-0.5">
                {user?.email || ''}
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (isDrawer) onCloseMobile?.();
              requestLogout();
            }}
            title="Sign Out"
            aria-label="Sign Out"
            className="p-2 rounded-xl bg-white/[0.07] border border-white/10 text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/40 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {sidebarContent(false)}

      {/* Mobile & Small Tablet Slide-Out Navigation Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{sidebarContent(true)}</div>
        </div>
      )}
    </>
  );
}

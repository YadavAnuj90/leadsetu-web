'use client';

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
  Settings,
  LogOut,
  Sparkles,
  Megaphone,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users, badge: 'AI' },
  { label: 'Contacts (B2B)', href: '/contacts', icon: Building2 },
  { label: 'Deals Pipeline', href: '/deals', icon: Kanban },
  { label: 'WhatsApp Inbox', href: '/inbox', icon: MessageSquare, badge: 'Live' },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'SLA Tickets', href: '/tickets', icon: LifeBuoy },
  { label: 'Workflows', href: '/workflows', icon: Workflow },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'GST Invoices', href: '/invoices', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();

  return (
    <aside
      className="w-64 flex-shrink-0 hidden md:flex flex-col justify-between text-white border-r border-white/10"
      style={{ background: '#0B1320' }}
    >
      <div className="p-5">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-1 ring-white/20 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Leadsetu Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="truncate">
            <div className="font-extrabold text-lg leading-tight text-white">
              Lead<span style={{ color: '#68A0FF' }}>setu</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {tenant?.name || 'AI CRM Workspace'}
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-blue/20 text-brand-sky'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="p-3 rounded-xl bg-brand-blue/15 border border-brand-blue/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-sky">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="capitalize">{tenant?.plan || 'Growth'} Plan Trial</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            Gemini AI &amp; WhatsApp Active
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: '#3978EA' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || 'Leadsetu User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

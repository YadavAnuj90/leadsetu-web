'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  PlugZap,
  CreditCard,
  Kanban,
  ShieldCheck,
  FileClock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const settingSections = [
  {
    title: 'Team & Role Permissions',
    desc: 'Invite sales reps, managers, and configure territory access.',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Security, Number Masking & Audit Logs',
    desc: 'Enable Anti-Data-Leak phone masking for agents and inspect immutable activity logs.',
    href: '/settings/audit',
    icon: FileClock,
  },
  {
    title: 'WhatsApp & Marketplace Integrations',
    desc: 'Connect WhatsApp Cloud API, IndiaMART, Justdial & Meta Lead Ads.',
    href: '/settings/integrations',
    icon: PlugZap,
  },
  {
    title: 'Sales Pipelines & Custom Stages',
    desc: 'Customize Kanban deal stages, win probabilities, and rotting alerts.',
    href: '/settings/pipelines',
    icon: Kanban,
  },
  {
    title: 'Subscription, GST Billing & Plan',
    desc: 'Manage your Growth trial, download 18% GST invoices, and add seats.',
    href: '/settings/billing',
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, tenant } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure your organization profile, integrations, and team access.
        </p>
      </div>

      {/* Organization Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
            }}
          >
            {tenant?.name?.[0]?.toUpperCase() || 'L'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-navy">
                {tenant?.name || 'Leadsetu Workspace'}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 capitalize">
                {tenant?.plan || 'Growth'} Plan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: {user?.name} ({user?.email}) · Hub: {tenant?.city || 'Delhi-NCR'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4" /> DPDP Act Compliant
        </span>
      </div>

      {/* Settings Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settingSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-blue/50 transition-all flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-navy">
                  {sec.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {sec.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

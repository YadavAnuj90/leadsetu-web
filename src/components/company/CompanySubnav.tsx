'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Briefcase, Compass, MapPin } from 'lucide-react';

const tabs = [
  { label: 'About Us', href: '/company', icon: Building2 },
  { label: 'Leadership & Mission', href: '/company/leadership', icon: Compass },
  { label: 'Careers', href: '/company/careers', icon: Briefcase },
  { label: 'Contact & Offices', href: '/company/contact', icon: MapPin },
];

export default function CompanySubnav() {
  const pathname = usePathname();

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 shadow-sm">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              active
                ? 'bg-white dark:bg-[#0057FF] text-[#0057FF] dark:text-white shadow-sm ring-1 ring-[#0057FF]/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.06]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

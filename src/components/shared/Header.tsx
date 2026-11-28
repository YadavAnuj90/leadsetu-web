'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  LogOut,
  ArrowLeft,
  Shield,
  Users,
  Building2,
  Kanban,
  FileText,
  CheckSquare,
  LifeBuoy,
  MessageSquare,
  Loader2,
  CheckCheck,
  Sparkles,
  X,
  ArrowRight,
  Command,
  FolderOpen,
  Phone,
  AtSign,
  Coffee,
  GitMerge,
  Plus,
  Upload,
  CreditCard,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/shared/ThemeToggle';
import NavbarBreakToggle from '@/components/shared/NavbarBreakToggle';
import AskAiCopilotDrawer from '@/components/ai/AskAiCopilotDrawer';
import { useCallUiStore } from '@/store/call-ui.store';
import { fetchNotificationsApi, globalSearchApi } from '@/lib/command-api';
import {
  getRouteFeatureRestriction,
  isFeatureEnabled,
  isWorkspaceAdminRole,
} from '@/lib/feature-access';
import type { GlobalSearchItem, NotificationItem } from '@/types/contracts';

const TYPE_META: Record<
  GlobalSearchItem['type'],
  { label: string; icon: typeof Users; pill: string }
> = {
  lead: {
    label: 'Lead',
    icon: Users,
    pill: 'bg-blue-50 text-brand-blue dark:bg-blue-950/60 dark:text-sky-300',
  },
  contact: {
    label: 'B2B Contact',
    icon: Building2,
    pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  deal: {
    label: 'Deal',
    icon: Kanban,
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  invoice: {
    label: 'GST Invoice',
    icon: FileText,
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
  task: {
    label: 'Task',
    icon: CheckSquare,
    pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  ticket: {
    label: 'SLA Ticket',
    icon: LifeBuoy,
    pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
  document: {
    label: 'Document',
    icon: FolderOpen,
    pill: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
  },
};

const NOTIF_ICON: Record<NotificationItem['category'], typeof Users> = {
  billing: CreditCard,
  mention: AtSign,
  lead: Sparkles,
  invoice: FileText,
  task: CheckSquare,
  inbox: MessageSquare,
  ticket: LifeBuoy,
};

const SEVERITY_DOT: Record<NotificationItem['severity'], string> = {
  urgent: 'bg-rose-500',
  high: 'bg-amber-500',
  medium: 'bg-brand-blue',
  info: 'bg-emerald-500',
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header({
  onOpenMobileMenu,
}: {
  onOpenMobileMenu?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, requestLogout } = useAuth();
  const {
    myStatus: callPresence,
    callState,
    historyStats,
    setDialerDrawerOpen,
  } = useCallUiStore();
  const pendingMissed = historyStats.pendingCallbacks || 0;

  const showBackButton = pathname && pathname !== '/dashboard';

  // ─── Global Ctrl+K Command Search ────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // ─── Live Notification Bell ──────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  const seenStorageKey = useMemo(
    () => `leadsetu_seen_notifs_${user?.id || 'anon'}`,
    [user?.id],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(seenStorageKey);
      if (saved) setSeenIds(JSON.parse(saved));
    } catch {
      setSeenIds([]);
    }
  }, [seenStorageKey]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsNotifLoading(true);
    try {
      const res = await fetchNotificationsApi();
      const filteredNotifs = (res.items || []).filter(
        (n) => !n.href || getRouteFeatureRestriction(n.href, tenant, user) === null,
      );
      setNotifications(filteredNotifs);
    } catch {
      // keep existing notifications on transient error
    } finally {
      setIsNotifLoading(false);
    }
  }, [user, tenant]);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.includes(n.id)).length,
    [notifications, seenIds],
  );

  const markAllRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const merged = Array.from(new Set([...seenIds, ...allIds])).slice(-120);
    setSeenIds(merged);
    try {
      localStorage.setItem(seenStorageKey, JSON.stringify(merged));
    } catch {
      // ignore storage quota
    }
  }, [notifications, seenIds, seenStorageKey]);

  const markOneRead = useCallback(
    (id: string) => {
      if (seenIds.includes(id)) return;
      const merged = [...seenIds, id].slice(-120);
      setSeenIds(merged);
      try {
        localStorage.setItem(seenStorageKey, JSON.stringify(merged));
      } catch {
        // ignore
      }
    },
    [seenIds, seenStorageKey],
  );

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setNotifOpen(false);
        setPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Auto-focus modal search input & run debounced query
  useEffect(() => {
    if (!paletteOpen) return;
    setTimeout(() => paletteInputRef.current?.focus(), 20);
    let cancelled = false;
    setIsSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await globalSearchApi(searchQuery);
        if (!cancelled) {
          const allowed = (res.items || []).filter(
            (item) =>
              !item.href ||
              getRouteFeatureRestriction(item.href, tenant, user) === null,
          );
          setSearchResults(allowed);
          setSelectedIndex(0);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [paletteOpen, searchQuery]);

  const navigateFromPalette = useCallback(
    (item: GlobalSearchItem) => {
      setPaletteOpen(false);
      setSearchQuery('');
      router.push(item.href);
    },
    [router],
  );

  interface QuickActionItem {
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    keywords: string;
    icon: typeof Plus;
    pillClass: string;
    run: () => void;
  }

  const allQuickActions = useMemo<QuickActionItem[]>(() => {
    const isBreakEligibleRole =
      user?.role === 'manager' ||
      user?.role === 'agent' ||
      user?.role === 'support';
    const isAway =
      user?.availabilityStatus === 'away' ||
      user?.availabilityStatus === 'on_leave';

    const openLeadsAction = (action: 'new' | 'duplicates' | 'import') => {
      setPaletteOpen(false);
      setSearchQuery('');
      if (pathname === '/leads') {
        window.dispatchEvent(
          new CustomEvent('leadsetu:leads-action', { detail: { action } }),
        );
      } else {
        router.push(`/leads?action=${action}`);
      }
    };

    const actions: QuickActionItem[] = [
      {
        id: 'qa-new-lead',
        title: 'New Lead',
        subtitle: 'Create & SetuAI-score a buyer inquiry',
        badge: 'Quick Action',
        keywords: 'new lead create add buyer inquiry',
        icon: Plus,
        pillClass:
          'bg-blue-50 text-brand-blue dark:bg-blue-500/20 dark:text-sky-300',
        run: () => openLeadsAction('new'),
      },
      {
        id: 'qa-find-duplicates',
        title: 'Find Duplicates',
        subtitle: 'Scan matching +91 phones & emails and merge records',
        badge: 'Quick Action',
        keywords: 'duplicate merge cleanup phone email dedup',
        icon: GitMerge,
        pillClass:
          'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        run: () => openLeadsAction('duplicates'),
      },
      {
        id: 'qa-import-csv',
        title: 'Import CSV / Excel',
        subtitle: 'Launch 3-step mapped .csv / .xlsx lead wizard',
        badge: 'Quick Action',
        keywords: 'import csv excel xlsx upload bulk leads',
        icon: Upload,
        pillClass:
          'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        run: () => openLeadsAction('import'),
      },
      ...(isBreakEligibleRole
        ? [
            isAway
              ? {
                  id: 'qa-end-break',
                  title: 'End Break & Resume Leads',
                  subtitle: 'Mark yourself Available so Smart Lead Routing resumes',
                  badge: 'Availability',
                  keywords: 'break resume available coffee tea routing',
                  icon: Coffee,
                  pillClass:
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                  run: () => {
                    setPaletteOpen(false);
                    setSearchQuery('');
                    window.dispatchEvent(new CustomEvent('leadsetu:end-break'));
                  },
                }
              : {
                  id: 'qa-coffee-break',
                  title: 'Start Coffee Break (15 min)',
                  subtitle: 'Set status Away for 15 min & pause lead routing',
                  badge: 'Break Mode',
                  keywords: 'coffee tea casual break away pause timer',
                  icon: Coffee,
                  pillClass:
                    'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                  run: () => {
                    setPaletteOpen(false);
                    setSearchQuery('');
                    window.dispatchEvent(
                      new CustomEvent('leadsetu:start-break', {
                        detail: { breakType: 'Coffee Break', durationMin: 15 },
                      }),
                    );
                  },
                },
          ]
        : []),
      {
        id: 'qa-softphone',
        title: 'Open Voice Softphone',
        subtitle: 'Make click-to-call WebRTC / SIM calls & view callbacks',
        badge: 'Calling',
        keywords: 'call phone dialer softphone webrtc',
        icon: Phone,
        pillClass:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        run: () => {
          setPaletteOpen(false);
          setSearchQuery('');
          setDialerDrawerOpen(true);
        },
      },
      {
        id: 'qa-inbox',
        title: 'Open WhatsApp Inbox',
        subtitle: 'Jump to live buyer conversations & SetuAI replies',
        badge: 'Go to Page',
        keywords: 'whatsapp inbox chat messages',
        icon: MessageSquare,
        pillClass:
          'bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
        run: () => {
          setPaletteOpen(false);
          setSearchQuery('');
          router.push('/inbox');
        },
      },
    ];

    return actions;
  }, [pathname, router, setDialerDrawerOpen, user?.availabilityStatus, user?.role]);

  const filteredQuickActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allQuickActions;
    return allQuickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.keywords.toLowerCase().includes(q),
    );
  }, [allQuickActions, searchQuery]);

  const totalPaletteItems = filteredQuickActions.length + searchResults.length;

  const activatePaletteIndex = useCallback(
    (idx: number) => {
      if (idx < filteredQuickActions.length) {
        filteredQuickActions[idx]?.run();
      } else {
        const record = searchResults[idx - filteredQuickActions.length];
        if (record) navigateFromPalette(record);
      }
    },
    [filteredQuickActions, navigateFromPalette, searchResults],
  );

  const onPaletteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) =>
        totalPaletteItems ? (i + 1) % totalPaletteItems : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) =>
        totalPaletteItems ? (i - 1 + totalPaletteItems) % totalPaletteItems : 0,
      );
    } else if (e.key === 'Enter' && totalPaletteItems > 0) {
      e.preventDefault();
      activatePaletteIndex(selectedIndex);
    }
  };

  return (
    <>
      <header className="h-14 sm:h-16 bg-white/90 dark:bg-[#09111F]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-[0_1px_16px_-6px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.55)] px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors relative z-40 overflow-visible">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 max-w-md lg:max-w-lg">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Open Navigation Menu"
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200/85 dark:border-white/[0.09] bg-slate-100/80 dark:bg-white/[0.04] text-brand-navy dark:text-slate-200 hover:border-brand-blue hover:bg-white dark:hover:bg-white/[0.08] transition-all shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              title="Go Back to Previous Tab"
              className="h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200/85 dark:border-white/[0.09] bg-slate-100/80 dark:bg-white/[0.04] text-xs font-semibold text-brand-navy dark:text-slate-200 hover:border-brand-blue/60 hover:text-brand-blue hover:bg-white dark:hover:bg-white/[0.08] transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Global Command Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false);
              setPaletteOpen(true);
            }}
            title="Search leads, deals, invoices, or quick actions (Ctrl+K)"
            className="h-9 sm:h-[38px] sm:w-full min-w-0 flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-3.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/85 dark:border-white/[0.08] text-xs sm:text-[13px] text-slate-400 dark:text-slate-400 hover:border-brand-blue/60 hover:bg-white dark:hover:bg-white/[0.07] transition-all text-left group shadow-xs"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-blue dark:group-hover:text-sky-400 transition-colors shrink-0" />
              <span className="hidden sm:inline truncate">
                Search leads, GSTINs, deals, invoices, tickets...
              </span>
            </span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200/75 dark:bg-white/[0.07] border border-slate-300/70 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Status & Segmented Action Dock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user?.maskPhones && (
            <span
              title="Anti-Data-Leak Shield active: client mobile numbers are masked"
              className="hidden 2xl:inline-flex h-8 items-center gap-1.5 text-[11px] font-bold px-2.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/70"
            >
              <Shield className="w-3.5 h-3.5" />
              Shield On
            </span>
          )}

          {(user?.role === 'manager' ||
            user?.role === 'agent' ||
            user?.role === 'support') && <NavbarBreakToggle />}

          <ThemeToggle />

          {/* Unified Communication & Intelligence Controls */}
          <div className="flex items-center gap-1.5">
            {/* CRM Voice Softphone Trigger */}
            <button
              type="button"
              onClick={() => {
                setNotifOpen(false);
                setDialerDrawerOpen(true);
              }}
              className={`h-9 relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all ${
                callState !== 'idle'
                  ? 'border-emerald-400 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                  : 'border-slate-200/85 dark:border-white/[0.09] bg-slate-100/85 dark:bg-white/[0.04] text-brand-navy dark:text-slate-100 hover:border-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-white dark:hover:bg-white/[0.07]'
              }`}
              title="Open CRM Voice Softphone"
            >
              <span className="relative flex items-center justify-center">
                <Phone className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#09111F] ${
                    callPresence === 'online'
                      ? 'bg-emerald-500'
                      : callPresence === 'busy'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
              </span>
              <span className="hidden lg:inline">
                {callState === 'connected' ? 'On Call' : 'Phone'}
              </span>
              {pendingMissed > 0 && callState === 'idle' && (
                <span
                  className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black leading-none shadow-xs"
                  title={`${pendingMissed} pending missed call / callback${pendingMissed === 1 ? '' : 's'}`}
                >
                  {pendingMissed}
                </span>
              )}
            </button>

            {isWorkspaceAdminRole(user) && (
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  router.push('/support-hq');
                }}
                className="h-9 inline-flex items-center gap-1.5 px-2 lg:pl-2 lg:pr-3 rounded-xl text-xs font-semibold border border-indigo-300/65 dark:border-indigo-500/35 bg-indigo-50/90 dark:bg-indigo-950/55 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-xs"
                title="Raise Platform Issue or Glitch Directly to Leadsetu Super Admin"
              >
                <img
                  src="/hq-support-icon.png"
                  alt="HQ Support"
                  className="w-5 h-5 object-contain shrink-0"
                />
                <span className="hidden xl:inline whitespace-nowrap">
                  HQ Support
                </span>
              </button>
            )}

            {isFeatureEnabled(tenant, 'aiScoring', user) &&
              isFeatureEnabled(tenant, 'aiCopilot', user) && (
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    setAiCopilotOpen(true);
                  }}
                  className="h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border border-brand-blue/35 dark:border-sky-400/30 bg-gradient-to-r from-brand-blue/12 via-indigo-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/15 text-brand-blue dark:text-sky-300 hover:from-brand-blue hover:to-indigo-600 hover:border-transparent hover:text-white transition-all shadow-xs"
                  title="Ask Leadsetu AI Copilot (Tenant-Scoped RAG)"
                >
                  <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="hidden md:inline whitespace-nowrap">
                    Ask AI
                  </span>
                </button>
              )}

            {/* Live Notification Bell */}
            <div className="relative" ref={notifContainerRef}>
              <button
                type="button"
                onClick={() => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next) loadNotifications();
                }}
                className={`relative h-9 w-9 inline-flex items-center justify-center rounded-xl border transition-all ${
                  notifOpen
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue dark:text-sky-300'
                    : 'border-slate-200/85 dark:border-white/[0.09] bg-slate-100/85 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:text-brand-blue dark:hover:text-sky-300 hover:border-brand-blue/50 hover:bg-white dark:hover:bg-white/[0.07]'
                }`}
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow ring-2 ring-white dark:ring-[#09111F]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed inset-x-3 top-[4.25rem] sm:inset-x-auto sm:absolute sm:top-full sm:right-0 sm:mt-2.5 w-auto sm:w-96 max-h-[calc(100dvh-5.5rem)] rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/95 dark:border-white/[0.12] shadow-[0_24px_60px_-14px_rgba(2,6,23,0.45)] overflow-hidden z-[90]">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
                      <span>Command Alerts</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-[10px]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Live leads, GST dues, follow-ups &amp; SLA tickets
                    </div>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {isNotifLoading && notifications.length === 0 ? (
                    <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                      <span>Checking workspace alerts...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      All caught up! No pending leads, tasks, or overdue GST invoices.
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const Icon = NOTIF_ICON[item.category] || Bell;
                      const isUnread = !seenIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            markOneRead(item.id);
                            setNotifOpen(false);
                            router.push(item.href);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                            isUnread ? 'bg-brand-light/25 dark:bg-brand-blue/5' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-brand-blue mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-brand-navy dark:text-white truncate">
                                {item.title}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isUnread
                                    ? SEVERITY_DOT[item.severity]
                                    : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {timeAgo(item.createdAt)}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200/80 dark:bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 rounded-2xl sm:bg-slate-100/85 sm:dark:bg-white/[0.04] sm:border sm:border-slate-200/85 sm:dark:border-white/[0.09] shadow-xs">
            <Link
              href={isWorkspaceAdminRole(user) ? '/settings' : '/profile'}
              title={
                isWorkspaceAdminRole(user)
                  ? 'Company & Workspace Settings'
                  : 'Open My Profile & Feature Access'
              }
              className="group flex items-center gap-2 sm:px-2 sm:py-0.5 rounded-xl hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all"
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0057FF] via-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-xs font-black text-white shadow-sm ring-1 ring-white/25 group-hover:scale-[1.03] transition-transform">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#09111F]"
                  title="Active Session"
                />
              </div>

              <div className="text-left hidden md:block min-w-0 max-w-[180px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-brand-navy dark:text-white capitalize truncate">
                    {user?.name || 'User'}
                  </span>
                  {tenant?.accountId && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-brand-blue/10 dark:bg-sky-500/15 border border-brand-blue/20 dark:border-sky-400/25 text-brand-blue dark:text-sky-300 font-black tracking-tight shrink-0">
                      #{tenant.accountId}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.role === 'manager'
                    ? 'Sales Manager'
                    : user?.role === 'agent'
                      ? 'Sales User'
                      : user?.role === 'support'
                        ? 'Support Engineer'
                        : user?.role === 'owner'
                          ? 'Owner'
                          : 'Admin'}
                  {tenant?.companyName?.trim() ? ` · ${tenant.companyName.trim()}` : ''}
                  {(user?.role === 'manager' || user?.role === 'agent' || user?.role === 'support') && user?.userCode
                    ? ` · UID #${user.userCode}`
                    : ''}
                </div>
              </div>
            </Link>

            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10" />

            <button
              type="button"
              onClick={requestLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="h-8 inline-flex items-center gap-1.5 text-[11px] font-bold px-2 sm:px-2.5 rounded-xl bg-slate-200/75 dark:bg-white/[0.06] border border-slate-300/65 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Ctrl+K Command Search Palette */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-start justify-center pt-4 sm:pt-20 px-2.5 sm:px-4"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-brand-blue flex-shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onPaletteKeyDown}
                placeholder="Search or Quick Action..."
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-medium text-brand-navy dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              )}
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuickActions.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-slate-50/90 dark:bg-slate-900/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Quick Actions
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQuickActions.map((qa, qIdx) => {
                      const Icon = qa.icon;
                      const active = qIdx === selectedIndex;
                      return (
                        <button
                          key={qa.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(qIdx)}
                          onClick={qa.run}
                          className={`w-full text-left px-5 py-3 flex items-center justify-between gap-4 transition-colors ${
                            active
                              ? 'bg-brand-light/60 dark:bg-brand-blue/15'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${qa.pillClass}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-brand-navy dark:text-white truncate">
                                  {qa.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${qa.pillClass}`}
                                >
                                  {qa.badge}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {qa.subtitle}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-slate-50/90 dark:bg-slate-900/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {searchQuery.trim() ? 'Matching CRM Records' : 'Recent CRM Records'}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map((item, idx) => {
                      const meta = TYPE_META[item.type] || TYPE_META.lead;
                      const Icon = meta.icon;
                      const flatIdx = filteredQuickActions.length + idx;
                      const active = flatIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          onClick={() => navigateFromPalette(item)}
                          className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                            active
                              ? 'bg-brand-light/60 dark:bg-brand-blue/15'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-brand-blue">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-brand-navy dark:text-white truncate">
                                  {item.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.pill}`}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.badge}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredQuickActions.length === 0 && searchResults.length === 0 && (
                <div className="p-10 text-center text-xs text-slate-400">
                  {isSearching
                    ? 'Searching across all Leadsetu CRM collections...'
                    : `No matching actions or records found for "${searchQuery}".`}
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Use ↑ ↓ to navigate · Enter to open · Esc to close</span>
              <span>
                {user?.maskPhones
                  ? 'Phone numbers masked by workspace Shield'
                  : 'Searching 6 CRM collections live'}
              </span>
            </div>
          </div>
        </div>
      )}

      <AskAiCopilotDrawer
        open={aiCopilotOpen}
        onClose={() => setAiCopilotOpen(false)}
      />
    </>
  );
}

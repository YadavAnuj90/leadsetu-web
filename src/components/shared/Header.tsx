'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { fetchNotificationsApi, globalSearchApi } from '@/lib/command-api';
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

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();

  const showBackButton = pathname && pathname !== '/dashboard';

  // ─── Global Ctrl+K Command Search ────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false);
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
      setNotifications(res.items || []);
    } catch {
      // keep existing notifications on transient error
    } finally {
      setIsNotifLoading(false);
    }
  }, [user?.id]);

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
          setSearchResults(res.items || []);
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

  const onPaletteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) =>
        searchResults.length ? (i + 1) % searchResults.length : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) =>
        searchResults.length
          ? (i - 1 + searchResults.length) % searchResults.length
          : 0,
      );
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      navigateFromPalette(searchResults[selectedIndex]);
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-[#0B1320] border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between gap-4 transition-colors relative z-30">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              title="Go Back to Previous Tab"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue hover:text-brand-blue hover:bg-brand-light/40 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {/* Global Command Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false);
              setPaletteOpen(true);
            }}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-400 hover:border-brand-blue hover:bg-white dark:hover:bg-slate-800 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                Search leads, GSTINs, deals, invoices, or tickets...
              </span>
            </span>
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300 flex-shrink-0">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user?.maskPhones && (
            <span
              title="Anti-Data-Leak Shield active: client mobile numbers are masked"
              className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            >
              <Shield className="w-3.5 h-3.5" />
              Shield On
            </span>
          )}

          <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {tenant?.city || 'Delhi-NCR'} · Live Sync
          </span>

          <ThemeToggle />

          {/* Live Notification Bell */}
          <div className="relative" ref={notifContainerRef}>
            <button
              type="button"
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next) loadNotifications();
              }}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0F1829] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-50">
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

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-brand-navy dark:text-white flex items-center justify-end gap-1.5">
                <span>{user?.name}</span>
                {tenant?.accountId && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-sky-300 font-extrabold">
                    Acct #{tenant.accountId}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 capitalize">
                {user?.role || 'Owner'} · {tenant?.name}
                {user?.userCode ? ` · UID #${user.userCode}` : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Ctrl+K Command Search Palette */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-brand-blue flex-shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onPaletteKeyDown}
                placeholder="Search any Lead, B2B Contact, GSTIN, Deal, Invoice #, Task, or Ticket..."
                className="flex-1 bg-transparent text-sm font-medium text-brand-navy dark:text-white placeholder-slate-400 focus:outline-none"
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

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  {isSearching
                    ? 'Searching across all Leadsetu CRM collections...'
                    : `No matching records found for "${searchQuery}".`}
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const meta = TYPE_META[item.type] || TYPE_META.lead;
                  const Icon = meta.icon;
                  const active = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
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
                })
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
    </>
  );
}

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Unlock,
  Edit3,
  X,
  KeyRound,
  Save,
  Sun,
  Moon,
  Palette,
  Sparkles,
  ArrowUpRight,
  Target,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { updateSelfProfileApi, changePasswordApi } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import {
  fetchMyPerformanceApi,
  fetchMyTeamApi,
  type MyPerformanceResponse,
  type MyTeamResponse,
} from '@/lib/team-api';
import {
  USER_FEATURE_CATALOG,
  isFeatureEnabled,
  isWorkspaceAdminRole,
} from '@/lib/feature-access';
import type { ColorThemeId } from '@/components/shared/ThemeToggle';
import type { Task } from '@/types/contracts';

const ROLE_DISPLAY: Record<string, { label: string; desc: string; badge: string }> = {
  owner: {
    label: 'Company Owner',
    desc: 'Company administration & team feature governance',
    badge:
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/30',
  },
  admin: {
    label: 'Company Admin',
    desc: 'Company administration & team feature governance',
    badge:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/30',
  },
  super_admin: {
    label: 'Company Admin',
    desc: 'Company administration & team feature governance',
    badge:
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/30',
  },
  manager: {
    label: 'Sales Manager',
    desc: 'Dedicated team lead & pipeline workspace with admin-assigned modules',
    badge:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30',
  },
  agent: {
    label: 'Sales User',
    desc: 'Focused field & inside-sales workspace with assigned CRM tools',
    badge:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30',
  },
};

const COLOR_PRESETS: {
  id: ColorThemeId;
  name: string;
  desc: string;
  swatch: string;
}[] = [
  {
    id: 'aurora-live',
    name: 'Aurora Live',
    desc: 'Animated ambient gradient',
    swatch: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #06B6D4 100%)',
  },
  {
    id: 'static-blue',
    name: 'Royal Sapphire',
    desc: 'Crisp classic Leadsetu Blue',
    swatch: '#3978EA',
  },
  {
    id: 'static-emerald',
    name: 'Emerald Forest',
    desc: 'Calm forest green workspace',
    swatch: '#059669',
  },
];

const MODE_STORAGE_KEY = 'leadsetu-theme';
const COLOR_STORAGE_KEY = 'leadsetu-color-theme';
const THEME_EVENT = 'leadsetu-theme-change';

function formatShortDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, tenant, refreshProfile, logout } = useAuth();
  const updateProfileStore = useAuthStore((s) => s.updateProfile);
  const isAdmin = isWorkspaceAdminRole(user);

  useEffect(() => {
    if (user && isAdmin) {
      router.replace('/settings');
    }
  }, [user, isAdmin, router]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [territory, setTerritory] = useState('');
  const [profileLocked, setProfileLocked] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLocked, setPasswordLocked] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorThemeId>('static-blue');
  const [myPerf, setMyPerf] = useState<MyPerformanceResponse | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [myTeam, setMyTeam] = useState<MyTeamResponse | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchMyPerformanceApi()
      .then((res) => {
        if (!cancelled) setMyPerf(res);
      })
      .catch(() => {});
    apiClient
      .get<{ data: Task[] }>('/tasks', { params: { status: 'pending' } })
      .then((res) => {
        if (!cancelled) {
          const todayIso = new Date().toISOString().slice(0, 10);
          const list = (res.data?.data || []).filter(
            (t) => !t.dueDate || t.dueDate.slice(0, 10) <= todayIso,
          );
          setTodayTasks(list.slice(0, 5));
        }
      })
      .catch(() => {});
    if (user.role === 'manager') {
      fetchMyTeamApi()
        .then((res) => {
          if (!cancelled) setMyTeam(res);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setTerritory(user.territory || '');
  }, [user]);

  useEffect(() => {
    const syncFromStorage = () => {
      const savedMode =
        localStorage.getItem(MODE_STORAGE_KEY) ||
        localStorage.getItem('leadsetu_theme');
      const savedColor =
        (localStorage.getItem(COLOR_STORAGE_KEY) as ColorThemeId | null) ||
        'static-blue';
      setIsDark(savedMode === 'dark');
      setColorTheme(
        COLOR_PRESETS.some((p) => p.id === savedColor)
          ? savedColor
          : 'static-blue',
      );
    };
    syncFromStorage();

    const onThemeEvent = (e: Event) => {
      const detail = (
        e as CustomEvent<{ isDark?: boolean; colorTheme?: ColorThemeId }>
      ).detail;
      if (typeof detail?.isDark === 'boolean') setIsDark(detail.isDark);
      if (detail?.colorTheme) setColorTheme(detail.colorTheme);
    };
    window.addEventListener(THEME_EVENT, onThemeEvent);
    return () => window.removeEventListener(THEME_EVENT, onThemeEvent);
  }, []);

  const applyTheme = useCallback((nextDark: boolean, nextColor: ColorThemeId) => {
    setIsDark(nextDark);
    setColorTheme(nextColor);
    const root = document.documentElement;
    if (nextDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    root.setAttribute('data-color-theme', nextColor);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, nextDark ? 'dark' : 'light');
      localStorage.setItem('leadsetu_theme', nextDark ? 'dark' : 'light');
      localStorage.setItem(COLOR_STORAGE_KEY, nextColor);
    } catch {
      // Ignore storage error
    }
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, {
        detail: { isDark: nextDark, colorTheme: nextColor },
      }),
    );
  }, []);

  const copyValue = async (key: string, value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const roleMeta =
    ROLE_DISPLAY[user?.role || 'agent'] || ROLE_DISPLAY.agent;

  const featureSummary = useMemo(() => {
    return USER_FEATURE_CATALOG.map((item) => ({
      ...item,
      enabled: isFeatureEnabled(tenant, item.key, user),
    }));
  }, [tenant, user]);

  const assignedFeatures = useMemo(
    () => featureSummary.filter((f) => f.enabled),
    [featureSummary],
  );
  const enabledFeatureCount = assignedFeatures.length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileNotice({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      const updated = await updateSelfProfileApi({
        name: name.trim(),
        phone: phone.trim(),
        territory: territory.trim(),
      });
      updateProfileStore({
        user: updated.user,
        tenant: updated.tenant ?? tenant ?? null,
      });
      await refreshProfile();
      setProfileNotice({
        type: 'success',
        text: 'Profile details updated and locked.',
      });
      setProfileLocked(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to update profile details.';
      setProfileNotice({ type: 'error', text: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);
    if (newPassword.length < 8) {
      setPasswordNotice({
        type: 'error',
        text: 'New password must be at least 8 characters.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }
    setSavingPassword(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice({
        type: 'success',
        text: 'Password updated and security locked! Use your new password on next sign-in.',
      });
      setPasswordLocked(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to change password.';
      setPasswordNotice({ type: 'error', text: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (user && isAdmin) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          <span>Opening Company Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Identity Hero Card */}
      <div className="card-surface p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
              }}
            >
              {initials || 'LS'}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-brand-navy">
                  {user?.name || 'Workspace Member'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${roleMeta.badge}`}
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {roleMeta.label}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {roleMeta.desc}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {user?.userCode && (
                  <button
                    type="button"
                    onClick={() => copyValue('uid', user.userCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 hover:border-brand-blue transition-colors"
                    title="Copy 10-digit User ID"
                  >
                    <span>User ID: #{user.userCode}</span>
                    {copiedKey === 'uid' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                )}

                {tenant?.accountId && (
                  <button
                    type="button"
                    onClick={() => copyValue('acct', tenant.accountId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 hover:border-brand-blue transition-colors"
                    title="Copy Workspace Account ID"
                  >
                    <Building2 className="w-3.5 h-3.5 text-brand-blue" />
                    <span>
                      {tenant.companyName?.trim()
                        ? `${tenant.companyName.trim()} · #${tenant.accountId}`
                        : `Workspace #${tenant.accountId}`}
                    </span>
                    {copiedKey === 'acct' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {enabledFeatureCount} Assigned{' '}
                  {enabledFeatureCount === 1 ? 'Module' : 'Modules'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-navy hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              Workspace Home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Metadata Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-700/60">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-blue" /> Login Email
            </div>
            <div className="text-xs sm:text-sm font-bold text-brand-navy mt-1 truncate">
              {user?.email || '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Territory
            </div>
            <div className="text-xs sm:text-sm font-bold text-brand-navy mt-1 truncate">
              {user?.territory || 'Not assigned'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" /> Monthly Target
            </div>
            <div className="text-xs sm:text-sm font-bold text-brand-navy mt-1">
              ₹{Number(user?.monthlyTarget || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Last Sign-In
            </div>
            <div className="text-xs sm:text-sm font-bold text-brand-navy mt-1 flex items-center gap-2">
              <span>{formatShortDate(user?.lastLoginAt)}</span>
              {user?.createdAt && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined{' '}
                  {formatShortDate(user.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Performance, AI Quota & Today's Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 card-surface p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-blue" />
                <span>My Target &amp; Pipeline Progress</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live closed-won revenue vs. monthly target and daily AI copilot allowance.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-brand-blue/10 text-brand-blue border border-brand-blue/25">
              <Sparkles className="w-3 h-3" /> AI Today: {myPerf?.aiCallsToday ?? 0}/
              {myPerf?.aiDailyCallLimit ? myPerf.aiDailyCallLimit : '∞'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                Won Revenue: ₹{Number(myPerf?.performance?.wonRevenue || 0).toLocaleString('en-IN')}
              </span>
              <span className="font-extrabold text-brand-blue">
                {myPerf?.performance?.targetAchievedPct ?? 0}% of ₹
                {Number(myPerf?.monthlyTarget ?? user?.monthlyTarget ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(100, myPerf?.performance?.targetAchievedPct ?? 0)}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Leads</div>
                <div className="font-extrabold text-brand-navy">
                  {myPerf?.performance?.leadsCount ?? 0} ({myPerf?.performance?.hotLeads ?? 0} hot)
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Open Pipeline</div>
                <div className="font-extrabold text-brand-navy">
                  ₹{Number(myPerf?.performance?.openPipeline || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Won Deals</div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {myPerf?.performance?.wonDeals ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 card-surface p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>My Today&apos;s Beat &amp; Follow-Ups</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pending calls, site visits, and reminders due today or overdue.
              </p>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-extrabold text-brand-blue hover:underline inline-flex items-center gap-1"
            >
              <span>All Tasks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 text-center text-xs text-slate-400">
              All caught up! No pending tasks due today.
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((t) => (
                <Link
                  key={t.id}
                  href="/tasks"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-brand-blue transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-brand-navy truncate">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t.relatedCompany || t.relatedName || 'General follow-up'} · Due{' '}
                      {t.dueDate || 'Today'}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                      t.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'bg-brand-blue/15 text-brand-blue'
                    }`}
                  >
                    {t.priority}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales Manager Territory Team View */}
      {user?.role === 'manager' && myTeam && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>My Territory Sales Team ({myTeam.territory})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Read-only pipeline, target attainment, and pending task overview for reps in your beat territory.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-brand-navy">
                Reps: {myTeam.summary.repCount}
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold">
                Team Won: ₹{myTeam.summary.totalWonRevenue.toLocaleString('en-IN')}
              </span>
              <span className="px-3 py-1 rounded-xl bg-brand-blue/15 text-brand-blue font-extrabold">
                Pipeline: ₹{myTeam.summary.totalOpenPipeline.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {myTeam.data.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 text-center text-xs text-slate-400">
              No sales reps are currently assigned to your territory.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myTeam.data.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-xs text-brand-navy">
                        {rep.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        UID #{rep.userCode} · {rep.territory || 'NCR'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rep.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Won: </span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        ₹{rep.performance.wonRevenue.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Pipeline: </span>
                      <strong className="text-brand-navy">
                        ₹{rep.performance.openPipeline.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Target: </span>
                      <strong>{rep.performance.targetAchievedPct}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Open Tasks: </span>
                      <strong>{rep.pendingTasks}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Edit Profile + Security */}
        <div className="xl:col-span-5 space-y-6">
          {/* Edit Personal Details */}
          <form onSubmit={handleSaveProfile} className="card-surface p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-blue" />
                  Personal Profile Details
                  {profileLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profileLocked
                    ? 'Details are locked. Click Edit to modify your name, phone, or territory.'
                    : 'Update your display name, mobile number, and beat territory.'}
                </p>
              </div>
              {profileLocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileNotice(null);
                    setProfileLocked(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white text-xs font-bold transition-all shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setName(user?.name || '');
                    setPhone(user?.phone || '');
                    setTerritory(user?.territory || '');
                    setProfileNotice(null);
                    setProfileLocked(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            {profileNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  profileNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300'
                }`}
              >
                {profileNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{profileNotice.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={profileLocked}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:bg-slate-100 dark:disabled:bg-slate-900/80 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={profileLocked}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:bg-slate-100 dark:disabled:bg-slate-900/80 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sales Territory / Region
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    disabled={profileLocked}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:bg-slate-100 dark:disabled:bg-slate-900/80 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="e.g., Delhi-NCR, West UP"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                Email (<strong className="text-brand-navy">{user?.email}</strong>),
                User ID, and Role are managed by your Workspace Admin.
              </div>
            </div>

            {!profileLocked && (
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary-brand w-full py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile Changes
              </button>
            )}
          </form>

          {/* Change Password */}
          <form
            onSubmit={handleChangePassword}
            className="card-surface p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  Account Password & Security
                  {passwordLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {passwordLocked
                    ? 'Security credentials are locked. Click Edit to change your password.'
                    : 'Update your email & password sign-in credentials.'}
                </p>
              </div>
              {passwordLocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setPasswordNotice(null);
                    setPasswordLocked(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white text-xs font-bold transition-all shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordNotice(null);
                    setPasswordLocked(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            {passwordNotice && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  passwordNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300'
                }`}
              >
                {passwordNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordNotice.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLocked}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:bg-slate-100 dark:disabled:bg-slate-900/80 disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={passwordLocked ? '••••••••' : 'Enter current password'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLocked}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:bg-slate-100 dark:disabled:bg-slate-900/80 disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={passwordLocked ? '••••••••' : 'Create a strong password'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordLocked}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:bg-slate-100 dark:disabled:bg-slate-900/80 disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder={passwordLocked ? '••••••••' : 'Repeat new password'}
                />
              </div>
            </div>

            {!passwordLocked && (
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-brand-blue text-xs font-bold text-white hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Update Password
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Assigned CRM Features + Appearance */}
        <div className="xl:col-span-7 space-y-6">
          {/* Assigned Feature Access */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  My Assigned CRM Features
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAdmin
                    ? 'You are a Workspace Admin. Manage individual Sales Manager and User toggles in Team Management.'
                    : 'These CRM modules are enabled for your account by your Workspace Admin.'}
                </p>
              </div>
              {isAdmin && (
                <Link
                  href="/settings/team"
                  className="px-3 py-2 rounded-xl bg-brand-blue/10 text-brand-blue text-xs font-bold inline-flex items-center gap-1.5 hover:bg-brand-blue/20 transition-colors shrink-0"
                >
                  Manage Team Toggles <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {assignedFeatures.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 text-center space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  No CRM modules assigned yet
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Contact your Workspace Admin to assign modules to your account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignedFeatures.map((feat) => (
                  <Link
                    key={feat.key}
                    href={feat.href}
                    className="group p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/25 hover:border-brand-blue transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-extrabold text-brand-navy group-hover:text-brand-blue transition-colors truncate">
                          {feat.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {feat.description}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Display & Theme Preferences */}
          <div className="card-surface p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                Workspace Display & Theme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize your personal Light/Dark mode and color palette.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => applyTheme(false, colorTheme)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  !isDark
                    ? 'border-brand-blue bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-brand-blue/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-brand-navy">
                    Light Mode
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    High-clarity daylight UI
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyTheme(true, colorTheme)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isDark
                    ? 'border-brand-blue bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-brand-blue/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-indigo-300 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-brand-navy">
                    Dark Mode
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reduced-glare night UI
                  </div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COLOR_PRESETS.map((preset) => {
                const active = colorTheme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyTheme(isDark, preset.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-brand-blue bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-brand-blue/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="w-6 h-6 rounded-lg shadow-sm border border-white/40"
                        style={{ background: preset.swatch }}
                      />
                      {active && (
                        <Check className="w-4 h-4 text-brand-blue" />
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-brand-navy">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

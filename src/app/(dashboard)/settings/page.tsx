'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileClock,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  HeartHandshake,
  ImagePlus,
  Kanban,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Moon,
  Palette,
  Phone,
  PlugZap,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { isFeatureEnabled } from '@/lib/feature-access';
import { prepareOrganizationLogoDataUrl } from '@/lib/logo-upload';
import BusinessModeCard from '@/components/settings/BusinessModeCard';
import {
  fetchCurrentTenantApi,
  updateCurrentTenantApi,
} from '@/lib/tenants-api';
import {
  fetchAuditLogsApi,
  updateSecuritySettingsApi,
} from '@/lib/audit-api';
import { TwoFactorSecurityCard } from '@/components/auth/TwoFactorSecurityCard';
import { getErrorMessage } from '@/lib/api-client';
import { downloadSubscriptionInvoicePdf } from '@/lib/subscription-pdf';
import SubscriptionInvoiceModal from '@/components/settings/SubscriptionInvoiceModal';
import AiUsageTelemetryCard from '@/components/ai/AiUsageTelemetryCard';
import type { ColorThemeId } from '@/components/shared/ThemeToggle';
import type {
  SecuritySettings,
  SubscriptionInvoice,
} from '@/types/contracts';

const MODE_STORAGE_KEY = 'leadsetu-theme';
const COLOR_STORAGE_KEY = 'leadsetu-color-theme';
const THEME_EVENT = 'leadsetu-theme-change';

const THEME_PRESETS: {
  id: ColorThemeId;
  name: string;
  tag: 'LIVE' | 'STATIC';
  tagline: string;
  swatch: string;
  ring: string;
}[] = [
  {
    id: 'aurora-live',
    name: 'Aurora Live',
    tag: 'LIVE',
    tagline: 'Animated ambient Indigo–Cyan flow',
    swatch: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #06B6D4 100%)',
    ring: 'from-indigo-500 via-blue-500 to-cyan-400',
  },
  {
    id: 'static-blue',
    name: 'Royal Sapphire',
    tag: 'STATIC',
    tagline: 'Classic B2B Navy & Electric Blue',
    swatch: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
    ring: 'from-blue-600 to-sky-400',
  },
  {
    id: 'static-emerald',
    name: 'Emerald Forest',
    tag: 'STATIC',
    tagline: 'Calm Forest Green & Mint surface',
    swatch: 'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
    ring: 'from-emerald-600 to-teal-400',
  },
];

const PIPELINE_MINI_STAGES = [
  { label: 'Qualified', prob: '25%', width: 'w-1/4', color: 'bg-sky-500' },
  { label: 'Discovery', prob: '45%', width: 'w-2/5', color: 'bg-blue-500' },
  { label: 'Proposal', prob: '65%', width: 'w-3/5', color: 'bg-indigo-500' },
  { label: 'Negotiation', prob: '85%', width: 'w-4/5', color: 'bg-violet-500' },
  { label: 'Won', prob: '100%', width: 'w-full', color: 'bg-emerald-500' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, tenant, updateProfile } = useAuthStore();

  // Workspace telemetry & editable form state
  const [usage, setUsage] = useState({
    activeSeats: 1,
    totalSeats: 1,
    seatLimit: 12,
  });
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [auditCount, setAuditCount] = useState(0);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(tenant?.companyName || '');
  const [logoUrlInput, setLogoUrlInput] = useState(tenant?.logoUrl || '');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState(tenant?.city || '');
  const [gstinInput, setGstinInput] = useState(tenant?.gstin || '');
  const [stateInput, setStateInput] = useState(tenant?.state || 'Delhi (07)');
  const [phoneInput, setPhoneInput] = useState(tenant?.phone || '');
  const [emailInput, setEmailInput] = useState(tenant?.email || '');
  const [addressInput, setAddressInput] = useState(tenant?.address || '');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [previewInvoice, setPreviewInvoice] =
    useState<SubscriptionInvoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Synced Theme State
  const [isDark, setIsDark] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorThemeId>('static-blue');
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'overview' | 'modules' | 'security' | 'billing'
  >('overview');

  const canManageWorkspace =
    user?.role === 'owner' || user?.role === 'admin' || !user?.role;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode =
      localStorage.getItem(MODE_STORAGE_KEY) ||
      localStorage.getItem('leadsetu_theme');
    const savedColor =
      (localStorage.getItem(COLOR_STORAGE_KEY) as ColorThemeId | null) ||
      'static-blue';
    setIsDark(savedMode === 'dark');
    setColorTheme(savedColor);

    const onSync = (e: Event) => {
      const custom = e as CustomEvent<{
        isDark?: boolean;
        colorTheme?: ColorThemeId;
      }>;
      if (typeof custom.detail?.isDark === 'boolean') {
        setIsDark(custom.detail.isDark);
      }
      if (custom.detail?.colorTheme) {
        setColorTheme(custom.detail.colorTheme);
      }
    };
    window.addEventListener(THEME_EVENT, onSync);
    return () => window.removeEventListener(THEME_EVENT, onSync);
  }, []);

  const applyThemeFromStudio = (
    nextDark: boolean,
    nextColor: ColorThemeId,
  ) => {
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
      // Ignore storage errors
    }
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, {
        detail: { isDark: nextDark, colorTheme: nextColor },
      }),
    );
    const presetName =
      THEME_PRESETS.find((t) => t.id === nextColor)?.name || 'Workspace';
    showToast(
      `Applied ${presetName} (${nextDark ? 'Dark Mode' : 'Light Mode'}).`,
    );
  };

  const loadWorkspaceData = useCallback(async () => {
    setIsLoadingMeta(true);
    try {
      const [tenantRes, auditRes] = await Promise.all([
        fetchCurrentTenantApi().catch(() => null),
        fetchAuditLogsApi({ limit: 5 }).catch(() => null),
      ]);

      if (tenantRes) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          updateProfile({ user: currentUser, tenant: tenantRes.tenant });
        }
        setUsage(tenantRes.usage);
        setNameInput(tenantRes.tenant.companyName || '');
        setLogoUrlInput(tenantRes.tenant.logoUrl || '');
        setCityInput(tenantRes.tenant.city || '');
        setGstinInput(tenantRes.tenant.gstin || '');
        setStateInput(tenantRes.tenant.state || 'Delhi (07)');
        setPhoneInput(tenantRes.tenant.phone || '');
        setEmailInput(tenantRes.tenant.email || '');
        setAddressInput(tenantRes.tenant.address || '');
      }

      if (auditRes) {
        setSecurity(auditRes.security);
        setAuditCount(auditRes.stats?.total || 0);
      }
    } finally {
      setIsLoadingMeta(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleLogoPick = async (file?: File | null) => {
    if (!file) return;
    setLogoError(null);
    try {
      const prepared = await prepareOrganizationLogoDataUrl(file);
      setLogoUrlInput(prepared);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Unable to load logo.');
    }
  };

  const handleSaveWorkspace = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setError(null);
    try {
      const res = await updateCurrentTenantApi({
        companyName: nameInput.trim(),
        logoUrl: logoUrlInput,
        city: cityInput.trim() || '',
        gstin: gstinInput.trim().toUpperCase(),
        state: stateInput.trim(),
        phone: phoneInput.trim(),
        email: emailInput.trim().toLowerCase(),
        address: addressInput.trim(),
      });
      if (user) {
        updateProfile({ user, tenant: res.tenant });
      }
      setUsage(res.usage);
      setNameInput(res.tenant.companyName || '');
      setLogoUrlInput(res.tenant.logoUrl || '');
      setIsEditingProfile(false);
      showToast('Organization profile & GST identity saved cleanly.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleShield = async (
    key: 'maskPhoneForAgents' | 'blockAgentExport',
    nextVal: boolean,
  ) => {
    setTogglingKey(key);
    setError(null);
    try {
      const updated = await updateSecuritySettingsApi({ [key]: nextVal });
      setSecurity(updated);
      if (user && tenant) {
        updateProfile({
          user,
          tenant: {
            ...tenant,
            maskPhoneForAgents: updated.maskPhoneForAgents,
            blockAgentExport: updated.blockAgentExport,
          },
        });
      }
      showToast(
        key === 'maskPhoneForAgents'
          ? `Agent Phone Masking ${nextVal ? 'Enabled' : 'Disabled'}.`
          : `Bulk CSV Export Protection ${nextVal ? 'Enabled' : 'Disabled'}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingKey(null);
    }
  };

  const copyAccountId = () => {
    const code = tenant?.accountId || tenant?.id?.slice(-6) || 'LEADSETU';
    navigator.clipboard.writeText(code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1600);
  };

  const seatPct = Math.min(
    100,
    Math.round((usage.activeSeats / Math.max(1, usage.seatLimit)) * 100),
  );

  const maskEnabled =
    security?.maskPhoneForAgents ?? Boolean(tenant?.maskPhoneForAgents);
  const exportBlocked =
    security?.blockAgentExport ?? (tenant?.blockAgentExport ?? true);

  const auditShieldEnabled = isFeatureEnabled(tenant, 'auditShield');
  const apiWebhooksEnabled = isFeatureEnabled(tenant, 'apiWebhooks');
  const documentVaultEnabled = isFeatureEnabled(tenant, 'documentVault');
  const aiScoringEnabled = isFeatureEnabled(tenant, 'aiScoring');
  const customRbacEnabled = isFeatureEnabled(tenant, 'customRbac');
  const companyDisplay = (tenant?.companyName || '').trim();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/team"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue transition-colors inline-flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-brand-blue" /> Manage Team
          </Link>
          <Link
            href="/settings/audit"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue transition-colors inline-flex items-center gap-1.5"
          >
            <FileClock className="w-3.5 h-3.5 text-emerald-500" /> Audit Trail
          </Link>
        </div>
      </div>

      {toast && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/60 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* ─── STUNNING WORKSPACE IDENTITY & TELEMETRY HERO ───────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
        style={{
          background:
            'linear-gradient(135deg, #091224 0%, #16294F 48%, #2457BA 100%)',
        }}
      >
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-white shadow-lg ring-2 ring-white/25 overflow-hidden"
                style={{
                  background: tenant?.logoUrl
                    ? '#ffffff'
                    : 'linear-gradient(135deg, #3978EA 0%, #06B6D4 100%)',
                }}
              >
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={companyDisplay || 'Organization Logo'}
                    className="w-full h-full object-cover"
                  />
                ) : companyDisplay ? (
                  companyDisplay[0].toUpperCase()
                ) : (
                  <Building2 className="w-8 h-8 sm:w-9 sm:h-9 text-white/95" />
                )}
              </div>
              <span
                title="Workspace Active"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0F1E3B] flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                <Sparkles className="w-3 h-3 text-sky-300" />
                Workspace Command Center &amp; Organization Hub
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
                  {companyDisplay || 'Leadsetu Workspace'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-[11px] font-extrabold text-emerald-200 capitalize">
                  {tenant?.plan || 'Growth'} Plan ·{' '}
                  {tenant?.status === 'active' ? 'Active' : '14-Day Trial'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200/90">
                <span>
                  {companyDisplay ? 'Owner:' : 'Admin:'}{' '}
                  <strong className="text-white">{user?.name || 'Admin'}</strong>{' '}
                  <span className="text-slate-300">({user?.email})</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-300" />
                  Hub: <strong className="text-white">{tenant?.city || 'Not set'}</strong>
                </span>
                {tenant?.accountId && (
                  <button
                    type="button"
                    onClick={copyAccountId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold text-sky-200 transition-colors"
                    title="Copy Workspace Account ID"
                  >
                    Acct #{tenant.accountId}
                    {copiedId ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 bg-emerald-500/20 px-3.5 py-2 rounded-xl border border-emerald-400/35 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              DPDP Act 2023 Compliant
            </span>
            {canManageWorkspace && (
              <button
                type="button"
                onClick={() => setIsEditingProfile((v) => !v)}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-sky-50 text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {isEditingProfile ? 'Cancel Edit' : 'Edit Org Profile'}
              </button>
            )}
          </div>
        </div>

        {/* 4-Tile Live Telemetry Strip Inside Hero */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('modules')}
            className="text-left rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/10 px-4 py-3 transition"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200/80">
              Active Team Seats
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-white">
                {isLoadingMeta ? '—' : `${usage.activeSeats} / ${usage.seatLimit}`}
              </span>
              <span className="text-[11px] font-bold text-emerald-300">
                {seatPct}% used
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('security')}
            className="text-left rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/10 px-4 py-3 transition"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200/80">
              Data-Leak Phone Shield
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-extrabold text-white">
                {maskEnabled ? 'Protected' : 'Standard'}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  maskEnabled
                    ? 'bg-emerald-400/25 text-emerald-200'
                    : 'bg-amber-400/25 text-amber-200'
                }`}
              >
                {maskEnabled ? 'MASKED' : 'VISIBLE'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('security')}
            className="text-left rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/10 px-4 py-3 transition"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200/80">
              Immutable Audit Events
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-white">
                {isLoadingMeta ? '—' : auditCount}
              </span>
              <span className="text-[11px] font-semibold text-sky-200">
                Verified Logs
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('overview')}
            className="text-left rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/10 px-4 py-3 transition"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200/80">
              GSTIN &amp; B2B Channels
            </div>
            <div className="flex items-baseline justify-between mt-1 gap-2">
              <span className="text-sm sm:text-base font-extrabold font-mono text-white truncate">
                {tenant?.gstin ? tenant.gstin : 'Setup GSTIN'}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-400/25 text-sky-200 shrink-0">
                5 Sync Ready
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ─── CLEAN ORGANIZED SETTINGS CATEGORY TABS ──────────────────────── */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-1.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {
              id: 'overview' as const,
              label: '1. Organization & Control Directory',
              badge: '8 Hubs',
              icon: Building2,
            },
            {
              id: 'modules' as const,
              label: '2. Business Model & Sidebar Modules',
              badge: 'Terminology',
              icon: SlidersHorizontal,
            },
            {
              id: 'security' as const,
              label: '3. Security, 2FA & Anti-Leak Shield',
              badge: maskEnabled ? 'Masked' : 'DPDP 2023',
              icon: ShieldCheck,
            },
            {
              id: 'billing' as const,
              label: '4. SetuAI Quota & GST Billing Invoices',
              badge: `${tenant?.plan || 'Growth'} Plan`,
              icon: CreditCard,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href="/settings/integrations"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold transition"
        >
          <PlugZap className="w-3.5 h-3.5" />
          <span>Open Integrations Hub</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ─── TAB 1: ORGANIZATION PROFILE, APPEARANCE & 8-MODULE DIRECTORY ─── */}
      {activeSettingsTab === 'overview' && (
        <div className="space-y-6">
      {/* ─── INTERACTIVE STUDIO ROW: ORG PROFILE + APPEARANCE & SECURITY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT (7 cols): Organization Identity & GST Billing Profile */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-light dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-brand-navy">
                  Organization &amp; GST Billing Identity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used across GST Tax Invoices, PDF Quotations, and Public Buyer Links
                </p>
              </div>
            </div>

            {canManageWorkspace && !isEditingProfile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/70 dark:hover:bg-white/[0.12] text-xs font-bold text-brand-navy dark:text-slate-200 transition-colors"
              >
                Edit Details
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveWorkspace} className="space-y-4">
              {/* Optional Organization Logo Upload */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrlInput ? (
                      <img
                        src={logoUrlInput}
                        alt="Organization Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-brand-navy dark:text-slate-100">
                      Organization Logo{' '}
                      <span className="font-normal text-slate-400">(Optional)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      PNG, JPG, WEBP or SVG · Shown on workspace header, sidebar &amp; invites
                    </div>
                    {logoError && (
                      <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                        {logoError}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-blue text-xs font-bold text-brand-navy dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors">
                    <ImagePlus className="w-3.5 h-3.5 text-brand-blue" />
                    <span>{logoUrlInput ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => void handleLogoPick(e.target.files?.[0])}
                    />
                  </label>
                  {logoUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrlInput('');
                        setLogoError(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Company / Organization Name{' '}
                    <span className="font-normal normal-case text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Anujali Technologies Pvt. Ltd. (Optional)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Operating City / Hub
                  </label>
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="e.g. New Delhi / Noida / Gurugram"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Company GSTIN (15-Char)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstinInput}
                    onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                    placeholder="07AABCA9012H1Z8"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-bold text-brand-navy uppercase focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Place of Supply / State
                  </label>
                  <input
                    type="text"
                    value={stateInput}
                    onChange={(e) => setStateInput(e.target.value)}
                    placeholder="Delhi (07) or Uttar Pradesh (09)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Business Support Phone
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98112 45678"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono text-brand-navy focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Billing / Accounts Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="accounts@company.in"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Registered Office / Plant Address
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Plot 42, Okhla Industrial Area Phase-II, New Delhi - 110020"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary-brand inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Organization Profile
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registered Organization
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  {tenant?.logoUrl && (
                    <img
                      src={tenant.logoUrl}
                      alt={companyDisplay || 'Organization Logo'}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                    />
                  )}
                  <span className="text-sm font-extrabold text-brand-navy block truncate">
                    {companyDisplay || 'Not set (Optional)'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                  {companyDisplay
                    ? `slug: ${tenant?.slug || 'workspace'}`
                    : 'Click Edit Details to set company name & logo'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  GSTIN &amp; Billing State
                </span>
                <span className="text-sm font-mono font-extrabold text-brand-blue mt-1 block">
                  {tenant?.gstin || 'Not configured yet'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {tenant?.state || 'Delhi (07)'} · Hub: {tenant?.city || 'Not set'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Support Phone &amp; Email
                </span>
                <span className="font-bold text-brand-navy mt-1 inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {tenant?.phone || user?.phone || 'Add support phone'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  {tenant?.email || user?.email}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registered Address
                </span>
                <span className="font-semibold text-brand-navy mt-1 block line-clamp-2">
                  {tenant?.address ||
                    `${tenant?.city || 'New Delhi'}, India — Click Edit Details to add full GST address`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT (5 cols): Live Theme Studio & Anti-Data-Leak Shield */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          {/* Theme Studio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-brand-navy">
                    Appearance &amp; Theme Studio
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live motion &amp; static B2B workspace themes
                  </p>
                </div>
              </div>

              <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => applyThemeFromStudio(false, colorTheme)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    !isDark
                      ? 'bg-white text-brand-navy shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3 h-3" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => applyThemeFromStudio(true, colorTheme)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    isDark
                      ? 'bg-brand-blue text-white shadow-xs'
                      : 'text-slate-500 hover:text-brand-navy'
                  }`}
                >
                  <Moon className="w-3 h-3" /> Dark
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => {
                const selected = colorTheme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyThemeFromStudio(isDark, preset.id)}
                    className={`text-left p-2.5 rounded-2xl border transition-all relative overflow-hidden ${
                      selected
                        ? 'border-brand-blue bg-brand-light/70 dark:bg-brand-blue/15 ring-1 ring-brand-blue/40'
                        : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-brand-blue/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-6 h-6 rounded-lg shadow-sm ring-2 ring-white dark:ring-slate-900 ${
                          preset.tag === 'LIVE' ? 'animate-pulse' : ''
                        }`}
                        style={{ background: preset.swatch }}
                      />
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          preset.tag === 'LIVE'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        {preset.tag}
                      </span>
                    </div>
                    <div className="text-[11px] font-extrabold text-brand-navy truncate">
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anti-Data-Leak Quick Switches */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> Quick Anti-Data-Leak Shield
              </span>
              {auditShieldEnabled ? (
                <Link
                  href="/settings/audit"
                  className="text-[11px] font-bold text-brand-blue hover:underline"
                >
                  Full Audit Logs →
                </Link>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
                  Module Disabled
                </span>
              )}
            </div>

            {!auditShieldEnabled ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-rose-500/20 text-[11px] text-slate-500 dark:text-slate-400">
                DPDP Anti-Leak Audit Shield controls are currently turned off for this workspace.
              </div>
            ) : (
              <>
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Mask Client Phones for Agents
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Shows +91 98*** **678 to non-admin reps
                </div>
              </div>
              <button
                type="button"
                disabled={togglingKey === 'maskPhoneForAgents'}
                onClick={() =>
                  handleToggleShield('maskPhoneForAgents', !maskEnabled)
                }
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
                  maskEnabled
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {togglingKey === 'maskPhoneForAgents'
                  ? '...'
                  : maskEnabled
                    ? 'ON'
                    : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                  Block Agent CSV Bulk Export
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Prevents unauthorized lead list downloads
                </div>
              </div>
              <button
                type="button"
                disabled={togglingKey === 'blockAgentExport'}
                onClick={() =>
                  handleToggleShield('blockAgentExport', !exportBlocked)
                }
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
                  exportBlocked
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {togglingKey === 'blockAgentExport'
                  ? '...'
                  : exportBlocked
                    ? 'LOCKED'
                    : 'OPEN'}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── SYMMETRIC WORKSPACE MODULES GRID ───────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configure Modules, Team &amp; Compliance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quickly jump into any specialized workspace configuration hub below
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            8 Enterprise Control Areas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Team & Role Permissions */}
          <Link
            href="/settings/team"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-blue/60 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-sky-300 border border-blue-200/70 dark:border-blue-500/30">
                  {usage.activeSeats} / {usage.seatLimit} Seats Active
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-brand-blue transition-colors flex items-center justify-between">
                  <span>Team &amp; Role Permissions</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Invite sales reps, configure Admin / Manager / Agent roles, set
                  monthly revenue targets, and assign regional sales territories.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/10">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Seat Utilization</span>
                <span>{seatPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                  style={{ width: `${Math.max(8, seatPct)}%` }}
                />
              </div>
            </div>
          </Link>

          {/* 2. Security, Masking & Audit Logs */}
          <Link
            href={auditShieldEnabled ? '/settings/audit' : '#'}
            aria-disabled={!auditShieldEnabled}
            onClick={(e) => {
              if (!auditShieldEnabled) e.preventDefault();
            }}
            className={`group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm transition-all flex flex-col justify-between gap-4 ${
              auditShieldEnabled
                ? 'hover:shadow-xl hover:border-emerald-500/50'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <FileClock className="w-5 h-5" />
                </div>
                {auditShieldEnabled ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/30">
                    {auditCount} Immutable Events
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-300">
                    <Lock className="w-3 h-3" /> Module Disabled
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Security, Masking &amp; Audit Logs</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Inspect actor-tagged timeline logs across Leads, GST Invoices,
                  Tickets, and Documents with Anti-Data-Leak enforcement.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                Phone Mask: {maskEnabled ? 'ON' : 'OFF'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                Export Lock: {exportBlocked ? 'ON' : 'OFF'}
              </span>
            </div>
          </Link>

          {/* 3. WhatsApp & Marketplace Integrations */}
          <Link
            href={apiWebhooksEnabled ? '/settings/integrations' : '#'}
            aria-disabled={!apiWebhooksEnabled}
            onClick={(e) => {
              if (!apiWebhooksEnabled) e.preventDefault();
            }}
            className={`group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm transition-all flex flex-col justify-between gap-4 ${
              apiWebhooksEnabled
                ? 'hover:shadow-xl hover:border-cyan-500/50'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                  <PlugZap className="w-5 h-5" />
                </div>
                {apiWebhooksEnabled ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/70 dark:border-cyan-500/30">
                    5 Connectors Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-300">
                    <Lock className="w-3 h-3" /> Module Disabled
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                  <span>WhatsApp &amp; Lead Webhooks</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Manage live inbound webhook keys, test capture payloads, and
                  connect WhatsApp Cloud API, IndiaMART, Justdial &amp; Meta Ads.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              {['WhatsApp', 'IndiaMART', 'Meta Ads', 'Razorpay'].map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"
                >
                  <Globe className="w-2.5 h-2.5 text-cyan-500" />
                  {c}
                </span>
              ))}
            </div>
          </Link>

          {/* 4. Sales Pipelines & Custom Stages */}
          <Link
            href="/settings/pipelines"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-violet-500/50 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                  <Kanban className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-500/30">
                  5 Probability Stages
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex items-center justify-between">
                  <span>Sales Pipelines &amp; Stages</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  View Kanban deal stage progression, weighted forecast rules
                  (25% to 100%), and quote-to-won handoff checkpoints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100 dark:border-white/10">
              {PIPELINE_MINI_STAGES.map((st) => (
                <div key={st.label} className="space-y-1">
                  <div className={`h-1.5 rounded-full ${st.color}`} />
                  <div className="text-[9px] font-bold text-slate-400 text-center">
                    {st.prob}
                  </div>
                </div>
              ))}
            </div>
          </Link>

          {/* 4B. Custom Fields Builder */}
          <Link
            href="/settings/custom-fields"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-blue/50 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 dark:bg-sky-950/60 text-brand-blue dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/30">
                  Leads · Contacts · Deals
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-brand-blue transition-colors flex items-center justify-between">
                  <span>Custom Fields Builder</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Add industry-specific fields (MOQ, Credit Days, Plant Location,
                  Drug License No.) rendered dynamically across CRM forms &amp; views.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                Text &amp; Number
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                Dropdown &amp; Date
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                Checkbox
              </span>
            </div>
          </Link>

          {/* 5. Subscription, GST Billing & Plan */}
          <Link
            href="/settings/billing"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/30 capitalize">
                  {tenant?.plan || 'Growth'} · ₹2,399/mo
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                  <span>Subscription &amp; GST Billing</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Manage your Growth plan entitlements, download 18% Input Tax
                  Credit eligible GST subscription invoices, and add seats.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                18% GST ITC Eligible
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {aiScoringEnabled ? 'SetuAI Included' : 'SetuAI Paused'}
              </span>
              {customRbacEnabled && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-brand-blue dark:text-sky-300">
                  Custom RBAC
                </span>
              )}
            </div>
          </Link>

          {/* 6. Document Center & Company KYC */}
          <Link
            href={documentVaultEnabled ? '/documents' : '#'}
            aria-disabled={!documentVaultEnabled}
            onClick={(e) => {
              if (!documentVaultEnabled) e.preventDefault();
            }}
            className={`group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm transition-all flex flex-col justify-between gap-4 ${
              documentVaultEnabled
                ? 'hover:shadow-xl hover:border-sky-500/50'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <FolderOpen className="w-5 h-5" />
                </div>
                {documentVaultEnabled ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/30">
                    Company KYC Vault
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-300">
                    <Lock className="w-3 h-3" /> Module Disabled
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                  <span>Document Center &amp; KYC</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Centralize GST registration certificates, MSME Udyam, product
                  brochures, signed buyer MSAs, and 1-click WhatsApp sharing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              {['GST Cert', 'Brochures', 'Contracts', 'Buyer KYC'].map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                >
                  {d}
                </span>
              ))}
            </div>
          </Link>

          {/* 7. Smart Lead Routing (Round-Robin & Territory) */}
          <Link
            href="/settings/routing"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <GitBranch className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/30">
                  Auto-Assignment Engine
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Smart Lead Routing</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Route inbound IndiaMART, Justdial &amp; Website leads automatically via
                  Round-Robin, Territory match, or Load-Balanced daily caps.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              {['Round-Robin', 'Territory Match', 'Daily Caps', 'Simulator'].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>

          {/* 8. 2-Way Email CRM & Templates */}
          <Link
            href="/settings/email"
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-sky-500/50 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/30">
                  SMTP / IMAP Sync
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-brand-navy group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                  <span>2-Way Email CRM &amp; Templates</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Connect Gmail, Zoho Mail, Outlook, or custom SMTP/IMAP, customize Proforma
                  &amp; Udhaar templates, and track buyer email opens &amp; replies.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] font-bold">
              {['Gmail / Zoho', 'Open Pixel', 'IMAP Replies', 'Templates'].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        </div>
      </div>
        </div>
      )}

      {/* ─── TAB 2: MULTI-SEGMENT BUSINESS MODE & SIDEBAR MODULES ────────── */}
      {activeSettingsTab === 'modules' && (
        <div className="space-y-5">
          <BusinessModeCard onUpdated={loadWorkspaceData} />
        </div>
      )}

      {/* ─── TAB 3: AUTHENTICATOR APP 2FA & ANTI-LEAK SECURITY ───────────── */}
      {activeSettingsTab === 'security' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-brand-navy">
                    DPDP Act 2023 Anti-Data-Leak Shield &amp; Audit Controls
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Protect your B2B buyer phone numbers and prevent unauthorized bulk CSV exports by sales reps.
                  </p>
                </div>
              </div>
              <Link
                href="/settings/audit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition"
              >
                <FileClock className="w-3.5 h-3.5" />
                View Full Immutable Audit Trail ({auditCount})
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-amber-500 shrink-0" />
                    Mask Client Phones for Non-Admin Agents
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Displays +91 98*** **678 in Leads &amp; Contacts while still allowing 1-click CRM calling and WhatsApp replies.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={togglingKey === 'maskPhoneForAgents'}
                  onClick={() =>
                    handleToggleShield('maskPhoneForAgents', !maskEnabled)
                  }
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                    maskEnabled
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {togglingKey === 'maskPhoneForAgents'
                    ? '...'
                    : maskEnabled
                    ? 'ENABLED'
                    : 'DISABLED'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-brand-blue shrink-0" />
                    Block Agent CSV Bulk Export
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Restricts CSV/Excel database exports strictly to Workspace Owners and Admins.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={togglingKey === 'blockAgentExport'}
                  onClick={() =>
                    handleToggleShield('blockAgentExport', !exportBlocked)
                  }
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                    exportBlocked
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {togglingKey === 'blockAgentExport'
                    ? '...'
                    : exportBlocked
                    ? 'LOCKED'
                    : 'OPEN'}
                </button>
              </div>
            </div>
          </div>

          <TwoFactorSecurityCard />
        </div>
      )}

      {/* ─── TAB 4: AI GATEWAY TELEMETRY & GST SUBSCRIPTION INVOICES ────── */}
      {activeSettingsTab === 'billing' && (
        <div className="space-y-6">
          <AiUsageTelemetryCard />

          {/* ─── BILLING SECTION: ATTACHED SUBSCRIPTION PLAN INVOICES (PDF) ─── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-navy">
                Active Plan &amp; Attached Subscription Invoices (PDF)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each Leadsetu plan subscribed by your organization is attached as
                a GST Tax Invoice PDF with Leadsetu&apos;s New Delhi address &amp;
                appreciation note.
              </p>
            </div>
          </div>

          <Link
            href="/settings/billing"
            className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Manage / Upgrade Plan
          </Link>
        </div>

        {(() => {
          const attachedInvoices = [
            ...(tenant?.subscriptionInvoices || []),
          ].reverse();
          if (attachedInvoices.length === 0) {
            return (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <p>
                  Loading your active {tenant?.plan || 'Growth'} plan GST invoice...
                </p>
              </div>
            );
          }
          return (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {attachedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-brand-blue">
                        {inv.invoiceNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                        {inv.planName} ({inv.billingCycle})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 uppercase">
                        {inv.status === 'paid' ? 'Paid · GST ITC' : 'Trial Receipt'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Validity:{' '}
                        <strong className="text-brand-navy">
                          {inv.periodStart} → {inv.periodEnd}
                        </strong>
                      </span>
                      <span>
                        Supplier: <strong>{inv.sellerCompany}</strong> (
                        {inv.sellerAddress})
                      </span>
                    </div>

                    <div className="text-[11px] text-brand-blue dark:text-sky-300 inline-flex items-center gap-1.5 font-medium">
                      <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{inv.greetingNote}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="text-right mr-1">
                      <div className="text-sm font-extrabold text-brand-navy">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Incl. 18% GST
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-brand-blue text-xs font-bold text-brand-navy dark:text-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-blue" /> View Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        downloadSubscriptionInvoicePdf(inv, user?.name)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
          </div>
        </div>
      )}

      {previewInvoice && (
        <SubscriptionInvoiceModal
          invoice={previewInvoice}
          ownerName={user?.name}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
}

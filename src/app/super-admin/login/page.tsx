'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { loginApi } from '@/lib/auth';
import {
  bootstrapSuperAdminApi,
  fetchSuperAdminBootstrapStatusApi,
} from '@/lib/super-admin-api';
import { useAuthStore } from '@/store/auth.store';
import { useAuthUxStore } from '@/store/auth-ux.store';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, setAuth } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [bootstrapStatus, setBootstrapStatus] = useState<{
    initialized: boolean;
    hasEnvSetupKey: boolean;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Bootstrap form state
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [founderPassword, setFounderPassword] = useState('');
  const [founderPhone, setFounderPhone] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [showSetupKey, setShowSetupKey] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role === 'super_admin') {
      router.replace('/super-admin');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await fetchSuperAdminBootstrapStatusApi();
        if (!active) return;
        setBootstrapStatus(status);
        if (!status.initialized) {
          setMode('bootstrap');
        }
      } catch {
        if (!active) return;
        setBootstrapStatus({ initialized: true, hasEnvSetupKey: false });
      } finally {
        if (active) setStatusLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await loginApi({ email: email.trim(), password });
      if (res.user.role !== 'super_admin') {
        setError(
          'Access denied: This account does not carry Leadsetu HQ Super Admin clearance. Use /login for organization workspaces.'
        );
        setSubmitting(false);
        return;
      }
      setAuth({
        user: res.user,
        tenant: res.tenant ?? null,
        accessToken: res.accessToken,
      });
      useAuthUxStore.getState().triggerWelcomeAnimation({
        userName: res.user.name,
        companyName: 'Leadsetu HQ',
        roleLabel: 'Super Admin',
      });
      router.replace('/super-admin');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Invalid Super Admin credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await bootstrapSuperAdminApi({
        name: founderName.trim(),
        email: founderEmail.trim(),
        password: founderPassword,
        phone: founderPhone.trim() || undefined,
        setupKey: setupKey.trim(),
      });

      if (res?.accessToken && res?.user) {
        setAuth({
          user: res.user,
          tenant: res.tenant ?? null,
          accessToken: res.accessToken,
        });
        useAuthUxStore.getState().triggerWelcomeAnimation({
          userName: res.user.name,
          companyName: 'Leadsetu HQ',
          roleLabel: 'Super Admin',
          isNewWorkspace: true,
        });
        setSuccessMsg('Authority Vault initialized. Entering Command Center...');
        router.replace('/super-admin');
        return;
      }

      setBootstrapStatus({ initialized: true, hasEnvSetupKey: false });
      setEmail(founderEmail.trim());
      setMode('login');
      setSuccessMsg(
        'Initial Super Admin created. Sign in below with your new credentials.'
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ||
        'Vault initialization failed. Verify your Setup Key and input.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient Grid & Radial Backlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(6,182,212,0.16),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.16),transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur transition hover:border-cyan-500/40 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Leadsetu
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-medium text-cyan-300">
            <Lock className="h-3 w-3" />
            HQ Command Vault · Zero-Trust Guard
          </span>
        </div>
      </header>

      {/* Main Vault Card */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/75 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl lg:grid-cols-12">
          {/* Left Security Briefing Column */}
          <div className="flex flex-col justify-between border-b border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/40 p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Leadsetu Logo"
                  className="h-10 w-10 rounded-xl border border-cyan-500/30 object-cover shadow-lg shadow-cyan-500/10"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Leadsetu Platform HQ
                  </p>
                  <h1 className="text-lg font-bold text-white">
                    Super Admin Command Vault
                  </h1>
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate-300">
                Central governance console for multi-tenant RBAC, global
                feature kill-switches, DPDP security compliance, SaaS plan
                entitlements, and immutable audit telemetry.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  {
                    icon: Shield,
                    title: 'Live Database Authority Check',
                    desc: 'Every HQ API call verifies live super_admin status directly against Leadsetu Authority Store.',
                  },
                  {
                    icon: KeyRound,
                    title: 'Time-Logged Support Impersonation',
                    desc: 'Audit-stamped workspace inspection tokens with one-click Vault return.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Global Kill-Switches & Entitlements',
                    desc: 'Instant platform-wide circuit breakers for AI, WhatsApp, and IndiaMART.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-3.5"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                CLI Bootstrap Alternative
              </div>
              <p className="mt-1 leading-relaxed">
                Seed headless via{' '}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
                  npx ts-node src/modules/super-admin/bootstrap-super-admin.ts
                </code>{' '}
                with{' '}
                <code className="rounded bg-slate-800 px-1 text-slate-200">
                  SUPER_ADMIN_EMAIL
                </code>{' '}
                and{' '}
                <code className="rounded bg-slate-800 px-1 text-slate-200">
                  SUPER_ADMIN_PASSWORD
                </code>
                .
              </p>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-7">
            {/* Mode Switcher */}
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                  {statusLoading
                    ? 'Checking vault status...'
                    : bootstrapStatus?.initialized
                      ? 'Vault Initialized · Active'
                      : 'First-Time Vault Setup Available'}
                </span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {mode === 'bootstrap'
                    ? 'Initialize Authority Vault'
                    : 'HQ Operator Sign-In'}
                </h2>
              </div>

              {!statusLoading && bootstrapStatus && !bootstrapStatus.initialized && (
                <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('bootstrap');
                      setError(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      mode === 'bootstrap'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Setup Vault
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      mode === 'login'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'bootstrap' && !bootstrapStatus?.initialized ? (
              <form onSubmit={handleBootstrap} className="space-y-4">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                  No Super Admin exists yet. Enter the one-time{' '}
                  <strong>Setup Key</strong> printed in the{' '}
                  <code className="rounded bg-slate-900/80 px-1 py-0.5 text-amber-300">
                    leadsetu-api
                  </code>{' '}
                  startup console (or your{' '}
                  <code className="rounded bg-slate-900/80 px-1 py-0.5 text-amber-300">
                    SUPER_ADMIN_SETUP_KEY
                  </code>{' '}
                  env var) to mint the Founder Root Authority.
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Founder Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      placeholder="e.g. Anuj Yadav"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={founderPhone}
                      onChange={(e) => setFounderPhone(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    HQ Operator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={founderEmail}
                    onChange={(e) => setFounderEmail(e.target.value)}
                    placeholder="founder@leadsetu.in"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Master Vault Password (min 10 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={10}
                      value={founderPassword}
                      onChange={(e) => setFounderPassword(e.target.value)}
                      placeholder="Enter strong master passphrase"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    One-Time Server Setup Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSetupKey ? 'text' : 'password'}
                      required
                      value={setupKey}
                      onChange={(e) => setSetupKey(e.target.value)}
                      placeholder="Paste setup key from API console"
                      className="w-full rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3.5 py-2.5 pr-10 font-mono text-sm text-cyan-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Toggle setup key visibility"
                    >
                      {showSetupKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-60"
                >
                  <Shield className="h-4 w-4" />
                  {submitting
                    ? 'Minting Root Authority...'
                    : 'Initialize Authority Vault & Enter HQ'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Super Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hq-operator@leadsetu.in"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Vault Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your HQ password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" />
                  {submitting
                    ? 'Verifying HQ Clearance...'
                    : 'Unlock Super Admin Vault'}
                </button>
              </form>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
              <span>Standard organization admin or agent?</span>
              <Link
                href="/login"
                className="font-medium text-cyan-400 hover:text-cyan-300"
              >
                Go to Workspace Login →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

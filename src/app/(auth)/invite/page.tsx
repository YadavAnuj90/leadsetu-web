'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UserCheck,
  Hash,
  Building2,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { acceptInviteApi, getInviteInfoApi } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api-client';
import { USER_FEATURE_CATALOG } from '@/lib/feature-access';
import { useAuthStore } from '@/store/auth.store';
import type { InviteInfoResponse } from '@/types/contracts';

function InviteAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const token = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [inviteInfo, setInviteInfo] = useState<InviteInfoResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [mode, setMode] = useState<'login' | 'set_password'>('login');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInfoError('Invite link is missing a verification token.');
      setLoadingInfo(false);
      return;
    }

    setLoadingInfo(true);
    setInfoError(null);
    getInviteInfoApi(token)
      .then((info) => {
        setInviteInfo(info);
        if (info.email) setEmail(info.email);
      })
      .catch((err) => {
        setInfoError(getErrorMessage(err));
      })
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const roleLabel =
    inviteInfo?.role === 'manager'
      ? 'Sales Manager'
      : inviteInfo?.role === 'agent'
        ? 'Sales User'
        : inviteInfo?.role === 'support'
          ? 'Support Engineer'
          : inviteInfo?.role || 'Team Member';

  const assignedFeatures = inviteInfo
    ? USER_FEATURE_CATALOG.filter((item) => inviteInfo.featureAccess?.[item.key] !== false)
    : [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (mode === 'set_password') {
      if (password.length < 8) {
        setSubmitError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setSubmitError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await acceptInviteApi({
        token,
        email: email.trim(),
        ...(mode === 'set_password'
          ? { newPassword: password, mode: 'set_password' }
          : { password, mode: 'login' }),
      });

      setAuth({
        user: res.user,
        tenant: res.tenant,
        accessToken: res.accessToken,
      });

      router.replace(res.user.role === 'support' ? '/tickets' : '/dashboard');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background:
              'radial-gradient(circle at 14% 20%, #D6EDFF 0%, transparent 45%), radial-gradient(circle at 82% 16%, #DDFBF4 0%, transparent 48%), linear-gradient(125deg, #F3F9FF 0%, #E7F9F5 48%, #E4F1FF 100%)',
          }}
        />
        <div
          className="pointer-events-none hidden dark:block absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 20%, rgba(0, 87, 255, 0.25) 0%, transparent 50%), radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.14) 0%, transparent 48%), linear-gradient(145deg, #070D19 0%, #0D172B 55%, #091322 100%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingInfo ? (
            <div className="max-w-lg mx-auto rounded-3xl bg-white/90 dark:bg-[#0F172A]/95 border border-slate-200 dark:border-slate-800 p-10 text-center shadow-xl space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0057FF] mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-white">
                Verifying your workspace invite link...
              </div>
            </div>
          ) : infoError || !inviteInfo ? (
            <div className="max-w-lg mx-auto rounded-3xl bg-white/90 dark:bg-[#0F172A]/95 border border-rose-200 dark:border-rose-500/30 p-8 text-center shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Invite Link Unavailable
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {infoError || 'This invite link is invalid or expired.'}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0057FF] text-white text-xs font-bold shadow"
              >
                Go to Standard Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Invited Profile & Assigned Features */}
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/85 dark:bg-slate-900/85 border border-[#0057FF]/20 text-slate-900 dark:text-sky-300 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#0057FF] dark:text-sky-400" />
                  <span>Workspace Invitation · {roleLabel}</span>
                </div>

                <div className="flex items-center gap-3.5">
                  {inviteInfo.logoUrl && (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                      <img
                        src={inviteInfo.logoUrl}
                        alt={inviteInfo.companyName || 'Organization Logo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                    Welcome, {inviteInfo.name}!
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  You have been invited by{' '}
                  <strong>
                    {inviteInfo.invitedByDisplay ||
                      inviteInfo.companyName ||
                      inviteInfo.workspaceName}
                  </strong>{' '}
                  to join as a <strong>{roleLabel}</strong>. Sign in with your email &amp; password below to open your workspace.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Workspace Account ID
                    </div>
                    <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-1">
                      #{inviteInfo.accountId}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Your 10-Digit User ID
                    </div>
                    <div className="text-lg font-mono font-extrabold text-[#0057FF] dark:text-sky-400 mt-1">
                      #{inviteInfo.userCode}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Assigned CRM Features ({assignedFeatures.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedFeatures.length === 0 ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Personal Dashboard &amp; Profile
                      </span>
                    ) : (
                      assignedFeatures.map((feat) => (
                        <span
                          key={feat.key}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                        >
                          <CheckCircle2 className="w-3 h-3" /> {feat.label}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Sign In / Password Activation Form */}
              <div className="lg:col-span-6">
                <div className="w-full max-w-md mx-auto lg:ml-auto rounded-[28px] bg-white/90 dark:bg-[#0F172A]/95 border border-white dark:border-slate-800 shadow-2xl p-7 sm:p-9 space-y-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                      Access Your Workspace
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sign in with your invited email and password, or set your own password first.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setSubmitError(null);
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        mode === 'login'
                          ? 'bg-white dark:bg-[#1B2B4B] text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Sign In with Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('set_password');
                        setSubmitError(null);
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        mode === 'set_password'
                          ? 'bg-white dark:bg-[#1B2B4B] text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Set New Password
                    </button>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-1">
                        Invited Work Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.in"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-1">
                        {mode === 'set_password' ? 'Create Password (min 8 chars)' : 'Password'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            mode === 'set_password'
                              ? 'Choose a secure password'
                              : 'Enter password sent by admin'
                          }
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'set_password' && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-full font-extrabold text-sm text-white bg-[#0057FF] hover:bg-blue-700 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SIGNING IN...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {mode === 'set_password'
                              ? 'ACTIVATE & OPEN WORKSPACE'
                              : 'SIGN IN TO WORKSPACE'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Account verified under {inviteInfo.workspaceName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] dark:bg-[#070D19]">
          <Loader2 className="w-7 h-7 animate-spin text-[#0057FF]" />
        </div>
      }
    >
      <InviteAcceptanceContent />
    </Suspense>
  );
}

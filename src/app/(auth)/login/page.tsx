'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
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
  Award,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/hooks/useAuth';
import type { TwoFactorChallengeResponse } from '@/types/contracts';

export default function LoginPage() {
  const {
    login,
    verifyTwoFactorLogin,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccessBanner, setResetSuccessBanner] = useState(false);
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallengeResponse | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'success') {
        setResetSuccessBanner(true);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    try {
      const res = await login({ email, password });
      if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
        setTwoFactorChallenge(res);
        setOtpCode('');
      }
    } catch {
      // Error is handled by useAuth state
    }
  };

  const handleVerifyTwoFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge) return;
    clearError();
    setLocalError(null);
    try {
      await verifyTwoFactorLogin({
        challengeToken: twoFactorChallenge.challengeToken,
        code: otpCode.trim(),
      });
    } catch {
      // Error handled by useAuth state
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Matching Prismatic Fluted Light Surface */}
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, #D6EDFF 0%, transparent 45%), radial-gradient(circle at 82% 14%, #DDFBF4 0%, transparent 48%), radial-gradient(circle at 22% 86%, #FFDAD6 0%, transparent 50%), radial-gradient(circle at 88% 82%, #D4EBFF 0%, transparent 52%), linear-gradient(125deg, #F3F9FF 0%, #E7F9F5 46%, #FFF1ED 78%, #E4F1FF 100%)',
          }}
        />
        <div
          className="pointer-events-none hidden dark:block absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 20%, rgba(0, 87, 255, 0.25) 0%, transparent 50%), radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.14) 0%, transparent 48%), linear-gradient(145deg, #070D19 0%, #0D172B 55%, #091322 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.48) 0px, rgba(255,255,255,0.08) 34px, rgba(15,23,42,0.025) 68px)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Brand Showcase Card */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-[#0057FF]/20 text-slate-900 dark:text-sky-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#0057FF] dark:text-sky-400" />
                <span>LeadSetu OS · Live Revenue &amp; Support Sync</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.06] text-[#0057FF] dark:text-white">
                Step into your
                <br />
                AI Revenue
                <br />
                Command Desk.
              </h1>

              <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg">
                Your IndiaMART inquiries, Hinglish WhatsApp Cloud chats, GSTIN credit checks, 18%
                GST invoices, and Support Engineer tickets — synchronized in real time.
              </p>

              <div className="space-y-3 pt-1 max-w-lg">
                {[
                  'Hinglish Voice-Note → Quote AI & 1–100 SetuAI Lead Scoring',
                  'Mod-36 GSTIN Credit Guard, 1-Click GST Invoices & UPI QR Links',
                  'Role-Scoped Panels (Sales, Manager, Support Engineer) + DPDP Shield',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/80 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-4 max-w-lg">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-white dark:border-slate-700 shadow-lg flex flex-col items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-[#0057FF]" />
                  <span className="text-[9px] font-black text-slate-900 dark:text-white">4.9 ★</span>
                </div>
                <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed">
                  &ldquo;Leadsetu cut our WhatsApp lead response time from 4 hours to 20 seconds and
                  boosted conversions by 42%.&rdquo; —{' '}
                  <strong className="not-italic text-slate-950 dark:text-white">
                    Director of Sales · Industrial Electricals Manufacturing
                  </strong>
                </p>
              </div>
            </div>

            {/* Right Frosted Glass Login Form */}
            <div className="lg:col-span-6">
              <div className="w-full max-w-md mx-auto lg:ml-auto rounded-[32px] bg-white/85 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-white dark:border-slate-800 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.18)] p-7 sm:p-10">
                <div className="mb-7 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Sign in to Leadsetu
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    New to Leadsetu CRM?{' '}
                    <Link
                      href="/signup"
                      className="font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
                    >
                      Start your 14-day free trial
                    </Link>
                  </p>
                </div>

                {resetSuccessBanner && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Password updated successfully. Sign in with your new password.</span>
                  </div>
                )}

                {displayError && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                  </div>
                )}

                {twoFactorChallenge ? (
                  <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-sky-950/40 border border-blue-200 dark:border-sky-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#0057FF] dark:text-sky-300">
                        <KeyRound className="w-4 h-4" />
                        <span>2-Step Authenticator Verification Required</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {twoFactorChallenge.message} Account:{' '}
                        <span className="font-mono font-bold">
                          {twoFactorChallenge.maskedEmail}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        6-Digit Authenticator Code or 8-Char Backup Code
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 482910 or A3F9-C12B"
                        className="w-full px-5 py-3 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono text-base tracking-[0.25em] font-bold text-slate-900 dark:text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otpCode.trim().length < 6}
                      className="w-full py-3.5 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#0057FF] hover:bg-[#0045CC] shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>VERIFYING CODE...</span>
                        </>
                      ) : (
                        <>
                          <span>VERIFY &amp; OPEN DASHBOARD</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorChallenge(null);
                        setOtpCode('');
                        clearError();
                        setLocalError(null);
                      }}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Use a different account</span>
                    </button>
                  </form>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                          Work Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.in"
                            className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5 px-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Password
                          </label>
                          <Link
                            href="/forgot-password"
                            className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-11 pr-11 py-3 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 mt-2 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>SIGNING IN...</span>
                          </>
                        ) : (
                          <>
                            <span>SIGN IN TO DASHBOARD</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-4">
                      <GoogleSignInButton
                        mode="signin"
                        onGoogleLogin={loginWithGoogle}
                        onTwoFactorChallenge={(challenge) => {
                          setTwoFactorChallenge(challenge);
                          setOtpCode('');
                        }}
                        onError={(msg) => setLocalError(msg)}
                      />
                    </div>
                  </>
                )}

                <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 flex flex-col items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Don&apos;t have an account?</span>
                    <Link
                      href="/register"
                      className="font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
                    >
                      Create Free Workspace →
                    </Link>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Protected by 256-Bit SSL &amp; DPDP Act 2023 Compliance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

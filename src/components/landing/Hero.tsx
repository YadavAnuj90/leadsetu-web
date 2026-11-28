'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Award,
  ArrowDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Hero() {
  const { register, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleQuickTrialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!agreed) {
      setLocalError('Please accept the Terms of Service & Privacy Policy to continue.');
      return;
    }

    const derivedCompany =
      companyName.trim() ||
      (name.trim() ? `${name.trim().split(' ')[0]}'s Workspace` : 'Leadsetu B2B Workspace');

    const formattedPhone = phone.trim()
      ? phone.trim().startsWith('+')
        ? phone.trim()
        : `+91 ${phone.trim()}`
      : undefined;

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: formattedPhone,
        companyName: derivedCompany,
        city: 'New Delhi',
      });
    } catch {
      // Handled inside useAuth state
    }
  };

  const displayError = localError || error;

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-24 border-b border-slate-200/70 dark:border-slate-800/80 transition-colors duration-300">
      {/* ─── Prismatic Fluted Light Surface (Matching Screenshot #2) ─────── */}
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, #D6EDFF 0%, transparent 45%), radial-gradient(circle at 82% 14%, #DDFBF4 0%, transparent 48%), radial-gradient(circle at 22% 86%, #FFDAD6 0%, transparent 50%), radial-gradient(circle at 88% 82%, #D4EBFF 0%, transparent 52%), linear-gradient(125deg, #F3F9FF 0%, #E7F9F5 46%, #FFF1ED 78%, #E4F1FF 100%)',
        }}
      />
      {/* Dark Mode Adaptive Aurora Surface */}
      <div
        className="pointer-events-none hidden dark:block absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(0, 87, 255, 0.28) 0%, transparent 50%), radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.16) 0%, transparent 48%), radial-gradient(circle at 30% 90%, rgba(228, 37, 39, 0.12) 0%, transparent 45%), linear-gradient(145deg, #070D19 0%, #0D172B 55%, #091322 100%)',
        }}
      />
      {/* Subtle Vertical Fluted Glass Ribbons Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-65 dark:opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.48) 0px, rgba(255,255,255,0.08) 34px, rgba(15,23,42,0.025) 68px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ─── LEFT COLUMN: Massive Editorial Copy + Award Seal ─────── */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[#0057FF]/20 text-slate-800 dark:text-sky-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#0057FF] dark:text-sky-400" />
              <span>India-First B2B Revenue OS · Sales, GST &amp; Support</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-[68px] font-black tracking-[-0.03em] leading-[1.03] text-[#0057FF] dark:text-white">
              India&apos;s smartest
              <br />
              AI CRM for
              <br />
              <span className="text-[#0057FF] dark:bg-gradient-to-r dark:from-sky-400 dark:to-blue-400 dark:bg-clip-text dark:text-transparent">
                faster growth.
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg md:text-[19px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              Where Hinglish AI speed meets B2B execution. Powered by{' '}
              <span className="font-semibold text-slate-950 dark:text-white">
                SetuAI, Official WhatsApp Cloud &amp; GSTIN Guard
              </span>
              , LeadSetu unifies your sales team, 18% GST billing, and support engineers in one
              effortless OS — zero tool chaos.
            </p>

            {/* Quick Navigation Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#orbit-360"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white/85 dark:bg-slate-900/85 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700 hover:border-[#0057FF] shadow-sm transition-all"
              >
                <span>Explore 360° Ecosystem</span>
                <ArrowDown className="w-3.5 h-3.5 text-[#0057FF]" />
              </a>
              <a
                href="#team-views"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#17243A] text-white hover:bg-[#0B1320] shadow-sm transition-all"
              >
                <span>Department Views Carousel</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </a>
            </div>

            {/* Circular Analyst Recognition Seal (Matching Gartner circle in Screenshot #2) */}
            <div className="pt-4 flex items-center gap-4 max-w-lg">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border border-white/90 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center flex-shrink-0 px-2 text-center">
                <Award className="w-5 h-5 text-[#0057FF] mb-0.5" />
                <span className="text-[11px] font-black tracking-tight text-slate-950 dark:text-white leading-tight">
                  2026 Leader
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  India B2B CRM
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  #1 Rated AI CRM for WhatsApp Cloud, IndiaMART &amp; Rule-46 18% GST Billing
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Trusted by 500+ scaling B2B &amp; SME teams across India.
                </div>
                <a
                  href="#features"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-sky-400 hover:text-[#0057FF] hover:underline"
                >
                  Explore all 14 modules &gt;&gt;
                </a>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Frosted Inline Free-Trial Signup Card ────── */}
          <div className="lg:col-span-5">
            <div className="rounded-[32px] bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl border border-white/90 dark:border-slate-800 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.18)] p-6 sm:p-8 max-w-md mx-auto lg:ml-auto">
              <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  Get started with your
                  <br />
                  flexible free trial
                </h2>
              </div>

              {displayError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleQuickTrialSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-5 py-3 rounded-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full px-5 py-3 rounded-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company / Workspace Name (Optional)"
                    className="w-full px-5 py-3 rounded-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (Min 6 chars)"
                    className="w-full pl-5 pr-11 py-3 rounded-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Split +91 Phone Input Pill */}
                <div className="flex items-center rounded-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 focus-within:border-[#0057FF] focus-within:ring-2 focus-within:ring-[#0057FF]/15 overflow-hidden transition-all">
                  <span className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                    className="flex-1 px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Region Notice */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                  It looks like you&apos;re in{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">INDIA</span> (GST
                  &amp; INR Ready) based on your IP.
                </p>

                {/* Terms Agreement */}
                <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0057FF] focus:ring-[#0057FF]"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/pricing#faq" className="underline font-semibold text-slate-800 dark:text-white">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/pricing#faq" className="underline font-semibold text-slate-800 dark:text-white">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-1 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>CREATING WORKSPACE...</span>
                    </>
                  ) : (
                    <span>GET STARTED</span>
                  )}
                </button>
              </form>

              {/* Social / Existing Login Row */}
              <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <span>or sign in using</span>
                <Link
                  href="/login"
                  title="Sign in with existing Leadsetu account"
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-slate-800 dark:text-white shadow-sm hover:border-[#0057FF] transition-colors"
                >
                  G
                </Link>
                <Link
                  href="/login"
                  title="Sign in with LinkedIn / Corporate ID"
                  className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
                >
                  in
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link href="/login" className="font-bold text-[#0057FF] dark:text-sky-400 hover:underline">
                  Sign In
                </Link>
              </div>

              <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No card required
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0057FF]" /> DPDP 2023 Compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

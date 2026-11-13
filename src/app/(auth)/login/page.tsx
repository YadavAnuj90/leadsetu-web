'use client';

import { useState, FormEvent } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
    } catch {
      // Error is handled by useAuth state
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFF]">
      {/* Left Brand & Showcase Panel */}
      <div
        className="hidden lg:flex lg:col-span-5 xl:col-span-6 p-12 flex-col justify-between relative overflow-hidden bg-grid-dark text-white"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(57, 120, 234, 0.35), transparent), linear-gradient(155deg, #0B1320 0%, #17243A 60%, #0E1B2E 100%)',
        }}
      >
        {/* Top Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 z-10">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-white/20 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Leadsetu Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Lead<span style={{ color: '#68A0FF' }}>setu</span>
            </span>
            <span className="block text-[10px] text-slate-400 -mt-0.5">
              Bridge Every Lead to Revenue
            </span>
          </div>
        </Link>

        {/* Center Value Prop */}
        <div className="my-auto max-w-lg z-10 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{
              background: 'rgba(57, 120, 234, 0.2)',
              borderColor: 'rgba(104, 160, 255, 0.35)',
              color: '#93C5FD',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Gemini AI + WhatsApp Cloud CRM
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Welcome back to your{' '}
            <span className="text-gradient-brand">AI Revenue Command Center</span>
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
            Your leads from WhatsApp, IndiaMART, and Meta Ads are scored and waiting. Sign in to
            pick up right where your team left off.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Real-time AI lead scoring (1–100) in Hinglish & English',
              'Instant WhatsApp Business replies & GST proforma quotes',
              'Visual Kanban pipeline built for high-velocity SMEs',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Testimonial Card */}
        <div className="z-10 rounded-2xl p-5 border border-white/10 bg-white/[0.04] backdrop-blur-md">
          <p className="text-xs text-slate-200 italic leading-relaxed mb-3">
            &ldquo;Leadsetu cut our WhatsApp lead response time from 4 hours to 20 seconds and grew
            our quarterly conversions by 42%.&rdquo;
          </p>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white">Rajesh Sharma</span>
              <span className="text-slate-400"> · MD, RS Electricals (Karol Bagh)</span>
            </div>
            <span className="text-amber-400 font-bold">★★★★★</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Leadsetu Logo"
                className="w-8 h-8 rounded-lg object-cover shadow-sm"
              />
              <span className="font-extrabold text-xl" style={{ color: '#17243A' }}>
                Lead<span style={{ color: '#3978EA' }}>setu</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Don&apos;t have a workspace yet?{' '}
              <Link
                href="/register"
                className="font-semibold text-brand-blue hover:underline"
              >
                Start your 14-day free trial
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs sm:text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold text-brand-blue hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-brand w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in to workspace...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Protected by 256-Bit SSL &amp; DPDP Act 2023 Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
}

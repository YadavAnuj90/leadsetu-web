'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Mail,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useAuth } from '@/hooks/useAuth';
import { prepareOrganizationLogoDataUrl } from '@/lib/logo-upload';

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [city, setCity] = useState('New Delhi');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogoPick = async (file?: File | null) => {
    if (!file) return;
    setLogoError(null);
    try {
      const prepared = await prepareOrganizationLogoDataUrl(file);
      setLogoUrl(prepared);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Unable to load logo.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const formattedPhone = phone.trim()
      ? phone.trim().startsWith('+')
        ? phone.trim()
        : `+91 ${phone.trim()}`
      : undefined;

    try {
      await register({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        logoUrl: logoUrl || undefined,
        city,
        email: email.trim(),
        phone: formattedPhone,
        password,
      });
    } catch {
      // Error is handled in useAuth state
    }
  };

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
            {/* Left Trial Value Prop Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>14-Day Free Growth Plan Trial</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.06] text-[#0057FF] dark:text-white">
                Launch your
                <br />
                360° AI workspace
                <br />
                in 60 seconds.
              </h1>

              <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                Join 500+ Delhi-NCR and Pan-India B2B businesses closing 3.2x faster across WhatsApp
                Cloud, IndiaMART, Meta Ads, and 18% GST billing.
              </p>

              <div className="space-y-3 pt-1">
                {[
                  {
                    title: 'All 14 Growth Modules Unlocked for 14 Days',
                    desc: 'Includes SetuAI lead scoring, CPQ quotes, SLA desk & Subscription GST PDF.',
                  },
                  {
                    title: '5-Digit Account ID & Role Permissions',
                    desc: 'Onboard managers and sales agents with instant WhatsApp credential links.',
                  },
                  {
                    title: 'No Credit Card or Auto-Debit Mandate Required',
                    desc: 'Try completely risk-free — keep your CRM data forever.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/90 dark:border-slate-800 shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Frosted Signup Card */}
            <div className="lg:col-span-7">
              <div className="w-full max-w-xl mx-auto lg:ml-auto rounded-[32px] bg-white/85 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-white dark:border-slate-800 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.18)] p-7 sm:p-10">
                <div className="mb-7 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Create your free workspace
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    Already have a Leadsetu account?{' '}
                    <Link
                      href="/login"
                      className="font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        Your Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Rajesh Sharma"
                          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        Company / Organization Name <span className="font-normal normal-case text-slate-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. RS Electricals Pvt. Ltd."
                          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Organization Logo Upload */}
                  <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Organization Logo Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImagePlus className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Organization Logo <span className="font-normal text-slate-400">(Optional)</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          PNG, JPG, WEBP or SVG · You can also set or update this later in Settings
                        </div>
                        {logoError && (
                          <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                            {logoError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0057FF] text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5">
                        <ImagePlus className="w-3.5 h-3.5 text-[#0057FF]" />
                        <span>{logoUrl ? 'Change' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => void handleLogoPick(e.target.files?.[0])}
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            setLogoError(null);
                          }}
                          className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rajesh@rselectricals.in"
                          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        WhatsApp Mobile (+91) *
                      </label>
                      <div className="flex items-center rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-[#0057FF] focus-within:ring-2 focus-within:ring-[#0057FF]/15 overflow-hidden">
                        <span className="px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="98112 34567"
                          className="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        Primary City / Hub
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15"
                        >
                          <option value="New Delhi">New Delhi</option>
                          <option value="Noida / Greater Noida">Noida / Greater Noida</option>
                          <option value="Gurugram">Gurugram</option>
                          <option value="Faridabad / Ghaziabad">Faridabad / Ghaziabad</option>
                          <option value="Mumbai / Pune">Mumbai / Pune</option>
                          <option value="Bengaluru / Other">Bengaluru / Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                        Password (Min 6 chars) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create strong password"
                          className="w-full pl-11 pr-10 py-2.5 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 px-2">
                    Region: <strong className="text-slate-800 dark:text-slate-200">INDIA (INR &amp; 18% GST)</strong> · An official GST Subscription Tax Invoice will be attached to your workspace billing profile automatically.
                  </p>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>LAUNCHING WORKSPACE...</span>
                        </>
                      ) : (
                        <>
                          <span>GET STARTED — 14-DAY FREE TRIAL</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Instant 5-Digit Account ID · Free Onboarding &amp; Excel Migration</span>
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

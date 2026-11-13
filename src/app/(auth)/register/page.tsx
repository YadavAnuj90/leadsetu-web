'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Mail,
  Phone,
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register({
        name,
        companyName,
        city,
        email,
        phone,
        password,
      });
    } catch {
      // Error is handled in useAuth state
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFF]">
      {/* Left Brand & Trial Perks Panel */}
      <div
        className="hidden lg:flex lg:col-span-5 xl:col-span-5 p-12 flex-col justify-between relative overflow-hidden bg-grid-dark text-white"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(57, 120, 234, 0.35), transparent), linear-gradient(155deg, #0B1320 0%, #17243A 60%, #0E1B2E 100%)',
        }}
      >
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

        <div className="my-auto max-w-md z-10 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{
              background: 'rgba(52, 211, 153, 0.15)',
              borderColor: 'rgba(52, 211, 153, 0.35)',
              color: '#34D399',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" /> 14-Day Free Growth Trial
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Launch your AI sales workspace in{' '}
            <span className="text-gradient-brand">under 60 seconds</span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Join 500+ Delhi-NCR businesses closing 3.2x more deals across WhatsApp, IndiaMART, and
            Meta Lead Ads.
          </p>

          <div className="space-y-3.5 pt-2">
            {[
              {
                title: 'Full Growth Plan Unlocked for 14 Days',
                desc: 'Unlimited Gemini AI lead scoring & custom pipelines',
              },
              {
                title: 'Official WhatsApp Cloud Integration',
                desc: 'Connect your business number in 1 click',
              },
              {
                title: 'No Credit Card or UPI Mandate Needed',
                desc: 'Zero risk — upgrade only when your team loves it',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
          <span>Trusted by 500+ Indian SMEs</span>
          <span className="text-emerald-400 font-semibold">4.9 / 5 ★ Rating</span>
        </div>
      </div>

      {/* Right Signup Form Panel */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80">
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

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">
              Create your free workspace
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Already have a Leadsetu account?{' '}
              <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs sm:text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Company / Business Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="RS Traders Pvt. Ltd."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@rstraders.in"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  WhatsApp Mobile (+91) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98112 34567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Primary City / Hub
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password (Min 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create strong password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-brand w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating your AI workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Launch My Free 14-Day Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              By creating an account, you agree to Leadsetu&apos;s Terms &amp; DPDP Privacy Policy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

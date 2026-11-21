'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { forgotPasswordApi } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [devPreviewUrl, setDevPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi(email.trim());
      setSubmitted(true);
      setConfirmationMsg(res.message);
      setDevPreviewUrl(res.devPreviewUrl || null);
    } catch (err) {
      setError(getErrorMessage(err));
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

        <div className="relative max-w-xl mx-auto px-4 sm:px-6">
          <div className="rounded-[32px] bg-white/85 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-white dark:border-slate-800 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.18)] p-7 sm:p-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#0057FF] dark:hover:text-sky-400 mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Account Recovery</span>
            </div>

            {!submitted ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
                    <KeyRound className="w-6 h-6 text-[#0057FF] dark:text-sky-400" />
                    <span>Forgot your password?</span>
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    Enter your registered work email address. We&apos;ll send you a secure one-time link (valid for 30 minutes) to set a new password.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#0057FF] hover:bg-[#0046D5] shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>SENDING RESET LINK...</span>
                      </>
                    ) : (
                      <>
                        <span>SEND RESET LINK</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-emerald-950 dark:text-emerald-200">
                      Check your inbox
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      {confirmationMsg}
                    </p>
                  </div>
                </div>

                {devPreviewUrl && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Local Email Preview Mode (no external SMTP/Resend key configured):
                    </p>
                    <Link
                      href={devPreviewUrl.replace(/^https?:\/\/[^/]+/, '')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                    >
                      <span>Open Password Reset Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setDevPreviewUrl(null);
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#0057FF] hover:underline"
                  >
                    Try a different email
                  </button>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>One-time SHA-256 token · Active sessions revoke automatically on reset</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

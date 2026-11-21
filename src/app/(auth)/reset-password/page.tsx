'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  Mail,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { resetPasswordApi, verifyResetTokenApi } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api-client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('Password reset link is missing a verification token.');
      setVerifying(false);
      return;
    }

    setVerifying(true);
    setTokenError(null);
    verifyResetTokenApi(token)
      .then((info) => {
        setMaskedEmail(info.maskedEmail);
        setWorkspaceName(info.workspaceName);
      })
      .catch((err) => {
        setTokenError(getErrorMessage(err));
      })
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (newPassword.length < 8) {
      setSubmitError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordApi({ token, newPassword });
      setResetDone(true);
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 1500);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
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

            {verifying ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <Loader2 className="w-7 h-7 animate-spin text-[#0057FF]" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Verifying your password reset link...
                </p>
              </div>
            ) : tokenError ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h1 className="text-base font-black text-rose-900 dark:text-rose-200">
                      Reset Link Invalid or Expired
                    </h1>
                    <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                      {tokenError}
                    </p>
                  </div>
                </div>

                <Link
                  href="/forgot-password"
                  className="w-full py-3.5 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#0057FF] hover:bg-[#0046D5] shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>REQUEST A NEW RESET LINK</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : resetDone ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-950 dark:text-white">
                    Password Updated!
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    Redirecting you to Sign In with your new password...
                  </p>
                </div>
                <Link
                  href="/login?reset=success"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E42527] hover:bg-[#C81E1E] text-white text-sm font-extrabold"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Set a new password
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {workspaceName && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-[#0057FF]" />
                        {workspaceName}
                      </span>
                    )}
                    {maskedEmail && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        {maskedEmail}
                      </span>
                    )}
                  </div>
                </div>

                {submitError && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                      New Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter at least 8 characters"
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

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 pl-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/15 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 mt-2 rounded-full font-extrabold text-sm tracking-wide text-white bg-[#E42527] hover:bg-[#C81E1E] shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>UPDATING PASSWORD...</span>
                      </>
                    ) : (
                      <>
                        <span>UPDATE PASSWORD</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Protected by 256-Bit SSL &amp; Session Revocation</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-7 h-7 animate-spin text-[#0057FF]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

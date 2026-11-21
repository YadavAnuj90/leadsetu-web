'use client';

import { useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuthUxStore } from '@/store/auth-ux.store';

export default function AuthUxOverlays() {
  const {
    logoutPrompt,
    isLoggingOut,
    welcome,
    closeLogoutConfirm,
    executeLogoutConfirm,
    dismissWelcomeAnimation,
  } = useAuthUxStore();

  useEffect(() => {
    if (!logoutPrompt?.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLogoutConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [logoutPrompt?.open, closeLogoutConfirm]);

  const firstName =
    (welcome?.userName || 'Partner').trim().split(/\s+/)[0] || 'Partner';

  return (
    <>
      <style jsx global>{`
        @keyframes leadsetuPopIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes leadsetuWelcomeBar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        @keyframes leadsetuPulseRing {
          0% {
            transform: scale(0.85);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.22);
            opacity: 0;
          }
          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }
      `}</style>

      {/* ─── Logout Confirmation Popup ─────────────────────────────────── */}
      {logoutPrompt?.open && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLogoutConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'leadsetuPopIn 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/90 dark:border-slate-700/80 shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/12 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      id="logout-confirm-title"
                      className="text-base font-extrabold text-slate-900 dark:text-white"
                    >
                      Logout of Leadsetu?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Confirm whether you want to end this session.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={closeLogoutConfirm}
                  aria-label="Close"
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(logoutPrompt.userName || logoutPrompt.email) && (
                <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {logoutPrompt.userName || 'Signed-in User'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {logoutPrompt.email}
                    {logoutPrompt.scopeLabel ? ` · ${logoutPrompt.scopeLabel}` : ''}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={closeLogoutConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  No, Stay Logged In
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => void executeLogoutConfirm()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white shadow-md shadow-rose-600/20 inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Yes, Logout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Welcome Back / Onboarding Animation Toast Card ─────────────── */}
      {welcome && (
        <div
          key={welcome.key}
          onClick={dismissWelcomeAnimation}
          className="fixed inset-0 z-[110] pointer-events-none flex items-center justify-center p-4"
        >
          <div
            style={{ animation: 'leadsetuPopIn 260ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            className="pointer-events-auto relative w-full max-w-sm rounded-3xl p-6 bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-2xl border border-[#0057FF]/25 dark:border-sky-400/25 shadow-[0_24px_70px_-12px_rgba(0,87,255,0.28)] overflow-hidden"
          >
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#0057FF]/15 blur-2xl"
            />
            <div className="relative flex items-center gap-4">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <span
                  style={{ animation: 'leadsetuPulseRing 1.3s ease-out infinite' }}
                  className="absolute inset-0 rounded-2xl bg-emerald-400/40"
                />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0057FF] to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
                  <Sparkles className="w-3 h-3" />
                  {welcome.isNewWorkspace
                    ? 'Workspace Ready'
                    : 'Authenticated Session'}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white truncate mt-0.5">
                  {welcome.isNewWorkspace
                    ? `Welcome to Leadsetu, ${firstName}!`
                    : `Welcome back, ${firstName}!`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 inline-flex items-center gap-1 max-w-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    {welcome.companyName
                      ? `${welcome.companyName}${welcome.roleLabel ? ` · ${welcome.roleLabel}` : ''}`
                      : welcome.roleLabel || 'Entering your Leadsetu workspace'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ animation: 'leadsetuWelcomeBar 1650ms linear forwards' }}
                className="h-full rounded-full bg-gradient-to-r from-[#0057FF] via-sky-400 to-emerald-400"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

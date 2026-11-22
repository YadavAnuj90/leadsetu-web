'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Loader2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Download,
  ShieldAlert,
} from 'lucide-react';
import {
  disableTwoFactorApi,
  enableTwoFactorApi,
  getTwoFactorStatusApi,
  setupTwoFactorApi,
} from '@/lib/auth';
import { getErrorMessage } from '@/lib/api-client';
import type { TwoFactorSetupResponse } from '@/types/contracts';

export function TwoFactorSecurityCard() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableMode, setDisableMode] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await getTwoFactorStatusApi();
      setEnabled(Boolean(res.enabled));
      setBackupCodesRemaining(Number(res.backupCodesRemaining || 0));
    } catch {
      // Ignore silent failure on initial mount
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleStartSetup = async () => {
    setBusy(true);
    setNotice(null);
    setBackupCodes(null);
    try {
      const data = await setupTwoFactorApi();
      setSetupData(data);
      setVerifyCode('');
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async () => {
    if (verifyCode.trim().length < 6) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await enableTwoFactorApi(verifyCode.trim());
      setEnabled(Boolean(res.enabled));
      setBackupCodes(res.backupCodes);
      setBackupCodesRemaining(res.backupCodes.length);
      setSetupData(null);
      setVerifyCode('');
      setNotice({
        type: 'success',
        text: 'Authenticator App 2FA is now active! Save your 8 backup codes safely.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await disableTwoFactorApi({
        code: disableCode.trim() || undefined,
        currentPassword: disablePassword.trim() || undefined,
      });
      setEnabled(false);
      setBackupCodesRemaining(0);
      setDisableMode(false);
      setDisableCode('');
      setDisablePassword('');
      setBackupCodes(null);
      setNotice({
        type: 'success',
        text: 'Two-factor authentication has been turned off for your account.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleCopySecret = async () => {
    if (!setupData?.secret) return;
    await navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 1800);
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes) return;
    const content = [
      'Leadsetu CRM — 2FA Backup Recovery Codes',
      `Generated: ${new Date().toISOString()}`,
      'Each code can be used once if you lose access to your Authenticator App:',
      '',
      ...backupCodes,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadsetu-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card-surface p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Authenticator App 2FA (TOTP)
            {!loading && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {enabled ? 'Enabled' : 'Not Configured'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Protect CRM sign-ins with Google Authenticator, Microsoft Authenticator, or Authy 6-digit TOTP codes.
          </p>
        </div>

        {!loading && !enabled && !setupData && (
          <button
            type="button"
            disabled={busy}
            onClick={handleStartSetup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
            <span>Set Up 2FA</span>
          </button>
        )}

        {!loading && enabled && !disableMode && (
          <button
            type="button"
            onClick={() => {
              setDisableMode(true);
              setNotice(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Disable 2FA</span>
          </button>
        )}
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Checking 2FA security status...</span>
        </div>
      ) : null}

      {/* Enabled summary */}
      {!loading && enabled && !disableMode && (
        <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold">
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>2-Step Verification active on every sign-in</span>
          </div>
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {backupCodesRemaining} backup codes remaining
          </span>
        </div>
      )}

      {/* Freshly generated Backup Codes */}
      {backupCodes && backupCodes.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                Save Your 8 One-Time Backup Recovery Codes
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Shown only once. Use these if you ever lose your phone or authenticator app.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackupCodes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backupCodes.map((code) => (
              <div
                key={code}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 font-mono text-xs font-bold text-center text-slate-800 dark:text-slate-100 select-all"
              >
                {code}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Wizard */}
      {setupData && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
              <img
                src={setupData.qrDataUrl}
                alt="Authenticator QR Code"
                className="w-36 h-36 rounded-lg"
              />
            </div>
            <div className="flex-1 space-y-2.5 text-xs">
              <p className="font-bold text-brand-navy">
                1. Scan this QR code in Google Authenticator / Microsoft Authenticator / Authy
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Or enter this Base32 setup key manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100 break-all">
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 shrink-0"
                  title="Copy Base32 key"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-bold text-brand-navy pt-1">
                2. Enter the 6-digit code shown in your app to activate 2FA:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-36 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold tracking-widest text-center text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <button
                  type="button"
                  disabled={busy || verifyCode.trim().length < 6}
                  onClick={handleEnable}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Verify &amp; Enable 2FA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSetupData(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable Confirmation */}
      {disableMode && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/30 space-y-3 text-xs">
          <p className="font-bold text-rose-800 dark:text-rose-200">
            Confirm Identity to Disable 2FA (Enter 6-digit TOTP or Current Password)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="6-digit TOTP or backup code"
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-950 font-mono text-xs text-brand-navy"
            />
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Or account password"
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-950 text-xs text-brand-navy"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || (!disableCode.trim() && !disablePassword.trim())}
              onClick={handleDisable}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Turn Off 2FA</span>
            </button>
            <button
              type="button"
              onClick={() => setDisableMode(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { getGoogleConfigApi } from '@/lib/auth';
import type { LoginResult, TwoFactorChallengeResponse } from '@/types/contracts';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  companyName?: string;
  onGoogleLogin: (payload: {
    idToken: string;
    companyName?: string;
  }) => Promise<LoginResult>;
  onTwoFactorChallenge?: (challenge: TwoFactorChallengeResponse) => void;
  onError?: (message: string) => void;
}

export function GoogleSignInButton({
  mode = 'signin',
  companyName,
  onGoogleLogin,
  onTwoFactorChallenge,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [checkedConfig, setCheckedConfig] = useState(false);
  const [busy, setBusy] = useState(false);

  const callbackRef = useRef({
    companyName,
    onGoogleLogin,
    onTwoFactorChallenge,
    onError,
  });
  callbackRef.current = {
    companyName,
    onGoogleLogin,
    onTwoFactorChallenge,
    onError,
  };

  useEffect(() => {
    let active = true;
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
    if (envClientId) {
      setClientId(envClientId);
      setCheckedConfig(true);
      return;
    }

    getGoogleConfigApi()
      .then((cfg) => {
        if (!active) return;
        if (cfg.enabled && cfg.clientId) {
          setClientId(cfg.clientId);
        }
      })
      .catch(() => {
        // Silently treat as unconfigured when offline
      })
      .finally(() => {
        if (active) setCheckedConfig(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    const initGsi = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
      containerRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) {
            callbackRef.current.onError?.('Google did not return an ID credential.');
            return;
          }
          setBusy(true);
          try {
            const res = await callbackRef.current.onGoogleLogin({
              idToken: response.credential,
              companyName: callbackRef.current.companyName?.trim() || undefined,
            });
            if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
              callbackRef.current.onTwoFactorChallenge?.(res);
            }
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : 'Google authentication failed.';
            callbackRef.current.onError?.(msg);
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: mode === 'signup' ? 'signup_with' : 'continue_with',
        width: Math.min(360, containerRef.current.offsetWidth || 320),
      });
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', initGsi);
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', initGsi);
      };
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', initGsi);
    };
  }, [clientId, mode]);

  if (!checkedConfig) return null;

  return (
    <div className="space-y-2">
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        <span className="shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          or {mode === 'signup' ? 'quick launch' : 'single sign-on'}
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
      </div>

      {clientId ? (
        <div className="flex flex-col items-center">
          <div
            ref={containerRef}
            className={`w-full flex justify-center min-h-[42px] ${
              busy ? 'opacity-60 pointer-events-none' : ''
            }`}
          />
          {busy && (
            <p className="text-[11px] text-[#0057FF] font-semibold mt-1">
              Verifying Google Workspace account...
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            callbackRef.current.onError?.(
              'Google OAuth SSO requires GOOGLE_CLIENT_ID on the API server (and optional NEXT_PUBLIC_GOOGLE_CLIENT_ID in web env). Configure it in backend .env to enable 1-click Google Sign-In.',
            )
          }
          className="w-full py-2.5 px-4 rounded-full border border-slate-300/90 dark:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  );
}

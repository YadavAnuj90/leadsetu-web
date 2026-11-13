'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

const THEME_STORAGE_KEY = 'leadsetu-theme';
const THEME_EVENT = 'leadsetu-theme-change';

function applyDomTheme(dark: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const initialDark = saved === 'dark';
    applyDomTheme(initialDark);
    setIsDark(initialDark);

    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{ isDark: boolean }>;
      if (typeof custom.detail?.isDark === 'boolean') {
        setIsDark(custom.detail.isDark);
      }
    };

    window.addEventListener(THEME_EVENT, handleSync);
    return () => window.removeEventListener(THEME_EVENT, handleSync);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    applyDomTheme(nextDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, { detail: { isDark: nextDark } }),
    );
  }, [isDark]);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 ${className}`}
      >
        <Moon className="w-3.5 h-3.5 text-brand-blue" />
        <span>Dark Mode</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
        isDark
          ? 'border-amber-400/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
          : 'border-slate-200 bg-slate-100/90 text-brand-navy hover:border-brand-blue hover:text-brand-blue'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-brand-blue" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}

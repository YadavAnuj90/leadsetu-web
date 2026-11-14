'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sun, Moon, Palette, Check, Sparkles, ChevronDown } from 'lucide-react';

export type ColorThemeId = 'aurora-live' | 'static-blue' | 'static-emerald';

const MODE_STORAGE_KEY = 'leadsetu-theme';
const COLOR_STORAGE_KEY = 'leadsetu-color-theme';
const THEME_EVENT = 'leadsetu-theme-change';

const THEME_OPTIONS: {
  id: ColorThemeId;
  name: string;
  badge: 'LIVE' | 'STATIC';
  desc: string;
  swatchStyle: string;
}[] = [
  {
    id: 'aurora-live',
    name: 'Aurora Live',
    badge: 'LIVE',
    desc: 'Animated ambient Indigo-Cyan motion gradient',
    swatchStyle:
      'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #06B6D4 100%)',
  },
  {
    id: 'static-blue',
    name: 'Royal Sapphire',
    badge: 'STATIC',
    desc: 'Crisp classic Leadsetu Navy & Blue palette',
    swatchStyle: '#3978EA',
  },
  {
    id: 'static-emerald',
    name: 'Emerald Forest',
    badge: 'STATIC',
    desc: 'Calm static Forest Green & Mint workspace',
    swatchStyle: '#059669',
  },
];

function applyDomTheme(dark: boolean, colorTheme: ColorThemeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
  root.setAttribute('data-color-theme', colorTheme);
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [colorTheme, setColorTheme] = useState<ColorThemeId>('static-blue');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedMode =
      localStorage.getItem(MODE_STORAGE_KEY) ||
      localStorage.getItem('leadsetu_theme');
    const savedColor =
      (localStorage.getItem(COLOR_STORAGE_KEY) as ColorThemeId | null) ||
      'static-blue';
    const validColor: ColorThemeId = THEME_OPTIONS.some(
      (t) => t.id === savedColor,
    )
      ? (savedColor as ColorThemeId)
      : 'static-blue';

    const initialDark = savedMode === 'dark';
    applyDomTheme(initialDark, validColor);
    setIsDark(initialDark);
    setColorTheme(validColor);

    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<{
        isDark?: boolean;
        colorTheme?: ColorThemeId;
      }>;
      if (typeof custom.detail?.isDark === 'boolean') {
        setIsDark(custom.detail.isDark);
      }
      if (custom.detail?.colorTheme) {
        setColorTheme(custom.detail.colorTheme);
      }
    };

    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener(THEME_EVENT, handleSync);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener(THEME_EVENT, handleSync);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  const broadcastUpdate = useCallback(
    (nextDark: boolean, nextColor: ColorThemeId) => {
      applyDomTheme(nextDark, nextColor);
      try {
        localStorage.setItem(MODE_STORAGE_KEY, nextDark ? 'dark' : 'light');
        localStorage.setItem('leadsetu_theme', nextDark ? 'dark' : 'light');
        localStorage.setItem(COLOR_STORAGE_KEY, nextColor);
      } catch {
        // Ignore storage restrictions
      }
      window.dispatchEvent(
        new CustomEvent(THEME_EVENT, {
          detail: { isDark: nextDark, colorTheme: nextColor },
        }),
      );
    },
    [],
  );

  const toggleDarkMode = useCallback(() => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    broadcastUpdate(nextDark, colorTheme);
  }, [isDark, colorTheme, broadcastUpdate]);

  const selectColorTheme = useCallback(
    (nextColor: ColorThemeId) => {
      setColorTheme(nextColor);
      broadcastUpdate(isDark, nextColor);
      setOpen(false);
    },
    [isDark, broadcastUpdate],
  );

  const activePreset =
    THEME_OPTIONS.find((t) => t.id === colorTheme) || THEME_OPTIONS[1];

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 ${className}`}
      >
        <Palette className="w-3.5 h-3.5 text-brand-blue" />
        <span>Theme</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1.5 ${className}`}
    >
      {/* 3-Theme Style Selector Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        title="Choose Live or Static Colour Theme"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1829] text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue transition-all cursor-pointer select-none shadow-sm"
      >
        <span
          className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-800 shrink-0"
          style={{ background: activePreset.swatchStyle }}
        />
        <span className="hidden sm:inline">{activePreset.name}</span>
        {activePreset.badge === 'LIVE' && (
          <span className="px-1.5 py-0.5 rounded bg-brand-blue/15 text-brand-blue text-[9px] font-extrabold">
            LIVE
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Quick Light / Dark Toggle */}
      <button
        type="button"
        onClick={toggleDarkMode}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
          isDark
            ? 'border-amber-400/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            : 'border-slate-200 bg-slate-100/90 text-brand-navy hover:border-brand-blue hover:text-brand-blue'
        }`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-brand-blue" />
        )}
      </button>

      {/* Theme Picker Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#0F1829] border border-slate-200 dark:border-slate-700 shadow-2xl p-3.5 space-y-3 z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-navy dark:text-white">
              <Palette className="w-3.5 h-3.5 text-brand-blue" />
              <span>Workspace Theme (3 Presets)</span>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => {
                  setIsDark(false);
                  broadcastUpdate(false, colorTheme);
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition ${
                  !isDark
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDark(true);
                  broadcastUpdate(true, colorTheme);
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition ${
                  isDark
                    ? 'bg-slate-900 text-amber-300 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {THEME_OPTIONS.map((opt) => {
              const selected = colorTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectColorTheme(opt.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    selected
                      ? 'border-brand-blue bg-brand-light/70 dark:bg-brand-blue/15'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm ${
                        opt.badge === 'LIVE' ? 'animate-pulse' : ''
                      }`}
                      style={{ background: opt.swatchStyle }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                          {opt.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            opt.badge === 'LIVE'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {opt.badge === 'LIVE' && (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-brand-blue shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

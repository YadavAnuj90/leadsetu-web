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

export default function ThemeToggle({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener(THEME_EVENT, handleSync);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener(THEME_EVENT, handleSync);
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
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
        className={`h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-white/[0.04] ${className}`}
      >
        <Palette className="w-3.5 h-3.5 text-brand-blue" />
        <span className="hidden xl:inline">Theme</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
    >
      {/* Unified Appearance Capsule: Preset Picker + Light/Dark Switch */}
      <div className="h-9 inline-flex items-center p-0.5 rounded-xl border border-slate-200/85 dark:border-white/[0.09] bg-slate-100/85 dark:bg-white/[0.04] shadow-xs">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          aria-haspopup="menu"
          title={`Theme: ${activePreset.name} — Click to switch workspace palette`}
          className={`h-8 inline-flex items-center whitespace-nowrap rounded-[10px] text-xs font-semibold text-brand-navy dark:text-slate-100 hover:bg-white/90 dark:hover:bg-white/[0.08] transition-all cursor-pointer select-none ${
            compact ? 'gap-1.5 px-2' : 'gap-2 px-2.5'
          } ${open ? 'bg-white dark:bg-white/[0.09] shadow-xs' : ''}`}
        >
          <span
            className="w-3 h-3 rounded-full ring-2 ring-white/90 dark:ring-slate-800 shrink-0 shadow-xs"
            style={{ background: activePreset.swatchStyle }}
          />
          {!compact && (
            <span className="hidden xl:inline tracking-tight">
              {activePreset.name}
            </span>
          )}
          {!compact && activePreset.badge === 'LIVE' && (
            <span className="hidden 2xl:inline px-1.5 py-0.5 rounded-md bg-brand-blue/15 text-brand-blue dark:text-sky-300 text-[9px] font-extrabold leading-none">
              LIVE
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
              open ? 'rotate-180 text-brand-blue dark:text-sky-300' : ''
            }`}
          />
        </button>

        <div className="h-4 w-px bg-slate-200/90 dark:bg-white/10 mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-[10px] transition-all cursor-pointer select-none ${
            isDark
              ? 'text-amber-300 hover:bg-amber-500/15'
              : 'text-slate-600 hover:bg-white/90 hover:text-brand-blue'
          }`}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-brand-blue" />
          )}
        </button>
      </div>

      {/* Theme Picker Popover (anchored directly beneath the ThemeToggle trigger) */}
      {open && (
        <div
          role="menu"
          className="fixed inset-x-3 top-[4.25rem] sm:inset-x-auto sm:absolute sm:top-full sm:right-0 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 sm:mt-2.5 w-auto sm:w-80 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/95 dark:border-white/[0.12] shadow-[0_24px_60px_-14px_rgba(2,6,23,0.45)] p-3.5 space-y-3 z-[90]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.07] pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-navy dark:text-white">
              <Palette className="w-3.5 h-3.5 text-brand-blue dark:text-sky-400" />
              <span>Workspace Theme</span>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200/90 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => {
                  setIsDark(false);
                  broadcastUpdate(false, colorTheme);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition ${
                  !isDark
                    ? 'bg-sky-50 text-brand-blue ring-1 ring-brand-blue/25 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
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
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition ${
                  isDark
                    ? 'bg-[#16233B] text-amber-300 ring-1 ring-white/10 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
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
                      ? 'border-brand-blue/60 bg-blue-50/75 dark:bg-brand-blue/15 dark:border-sky-400/40 shadow-xs'
                      : 'border-slate-200/75 dark:border-white/[0.07] hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl shrink-0 ring-2 ring-white/80 dark:ring-slate-800 shadow-sm ${
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
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'
                          }`}
                        >
                          {opt.badge === 'LIVE' && (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-brand-blue dark:text-sky-400 shrink-0" />
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

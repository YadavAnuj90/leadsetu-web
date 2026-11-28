'use client';

import React from 'react';

interface PhonePreviewFrameProps {
  children: React.ReactNode;
  variant?: 'mobile' | 'desktop';
}

export default function PhonePreviewFrame({
  children,
  variant = 'mobile',
}: PhonePreviewFrameProps) {
  if (variant === 'desktop') {
    return (
      <div
        className="light-preview-canvas w-full rounded-2xl border border-slate-300/90 dark:border-white/15 shadow-xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Minimal Browser Chrome */}
        <div className="h-8 px-3 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="px-3 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[10px] font-mono text-[#64748B] truncate max-w-[200px]">
            leadsetu.app/f/live-preview
          </div>
          <div className="w-8" />
        </div>
        <div
          className="h-[520px] overflow-y-auto"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="light-preview-canvas w-[320px] h-[640px] mx-auto rounded-[2.5rem] border-[10px] border-slate-900 dark:border-slate-700 shadow-2xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Top Speaker Notch Bar */}
      <div
        className="h-6 w-full flex items-center justify-center shrink-0 relative z-10"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="w-24 h-4 rounded-b-xl bg-slate-900 flex items-center justify-center gap-1.5">
          <span className="w-8 h-1 rounded-full bg-slate-700" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* Scrollable Inner Mobile Screen */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {children}
      </div>

      {/* Bottom Home Indicator */}
      <div
        className="h-4 w-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="w-24 h-1 rounded-full bg-[#E2E8F0]" />
      </div>
    </div>
  );
}

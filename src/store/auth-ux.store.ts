'use client';

import { create } from 'zustand';

export interface LogoutConfirmConfig {
  userName?: string;
  email?: string;
  scopeLabel?: string;
  onConfirm: () => Promise<void> | void;
}

export interface WelcomeToastConfig {
  userName: string;
  companyName?: string;
  roleLabel?: string;
  isNewWorkspace?: boolean;
}

interface AuthUxState {
  logoutPrompt: (LogoutConfirmConfig & { open: boolean }) | null;
  isLoggingOut: boolean;
  welcome: (WelcomeToastConfig & { key: number }) | null;
  requestLogoutConfirm: (cfg: LogoutConfirmConfig) => void;
  closeLogoutConfirm: () => void;
  executeLogoutConfirm: () => Promise<void>;
  triggerWelcomeAnimation: (cfg: WelcomeToastConfig) => void;
  dismissWelcomeAnimation: () => void;
}

let welcomeTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuthUxStore = create<AuthUxState>((set, get) => ({
  logoutPrompt: null,
  isLoggingOut: false,
  welcome: null,

  requestLogoutConfirm: (cfg) =>
    set({
      logoutPrompt: { ...cfg, open: true },
      isLoggingOut: false,
    }),

  closeLogoutConfirm: () => {
    if (get().isLoggingOut) return;
    set({ logoutPrompt: null });
  },

  executeLogoutConfirm: async () => {
    const prompt = get().logoutPrompt;
    if (!prompt || get().isLoggingOut) return;
    set({ isLoggingOut: true });
    try {
      await prompt.onConfirm();
    } finally {
      set({ logoutPrompt: null, isLoggingOut: false });
    }
  },

  triggerWelcomeAnimation: (cfg) => {
    if (welcomeTimer) {
      clearTimeout(welcomeTimer);
      welcomeTimer = null;
    }
    const key = Date.now();
    set({ welcome: { ...cfg, key } });
    welcomeTimer = setTimeout(() => {
      if (get().welcome?.key === key) {
        set({ welcome: null });
      }
      welcomeTimer = null;
    }, 1750);
  },

  dismissWelcomeAnimation: () => {
    if (welcomeTimer) {
      clearTimeout(welcomeTimer);
      welcomeTimer = null;
    }
    set({ welcome: null });
  },
}));

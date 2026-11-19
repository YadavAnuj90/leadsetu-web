'use client';

import { create } from 'zustand';
import { fetchWhatsAppTemplatesApi } from '@/lib/inbox-api';
import type {
  LinkedCrmEntityType,
  WhatsAppTemplate,
} from '@/types/contracts';

export interface WhatsAppQuickSendTarget {
  phone?: string;
  contactName: string;
  company?: string;
  city?: string;
  estimatedValue?: number;
  entityType?: LinkedCrmEntityType;
  entityId?: string;
  entityLabel?: string;
}

interface WhatsAppUiState {
  templates: WhatsAppTemplate[];
  templatesLoaded: boolean;
  templatesLoading: boolean;
  quickSendTarget: WhatsAppQuickSendTarget | null;
  templateManagerOpen: boolean;

  loadTemplates: (force?: boolean) => Promise<void>;
  setTemplates: (templates: WhatsAppTemplate[]) => void;
  openQuickSend: (target: WhatsAppQuickSendTarget) => void;
  closeQuickSend: () => void;
  openTemplateManager: () => void;
  closeTemplateManager: () => void;
}

export const useWhatsAppUiStore = create<WhatsAppUiState>((set, get) => ({
  templates: [],
  templatesLoaded: false,
  templatesLoading: false,
  quickSendTarget: null,
  templateManagerOpen: false,

  loadTemplates: async (force = false) => {
    if (get().templatesLoading) return;
    if (get().templatesLoaded && !force) return;
    set({ templatesLoading: true });
    try {
      const res = await fetchWhatsAppTemplatesApi();
      set({
        templates: res.data || [],
        templatesLoaded: true,
        templatesLoading: false,
      });
    } catch {
      set({ templatesLoading: false });
    }
  },

  setTemplates: (templates) => set({ templates, templatesLoaded: true }),
  openQuickSend: (target) => set({ quickSendTarget: target }),
  closeQuickSend: () => set({ quickSendTarget: null }),
  openTemplateManager: () => set({ templateManagerOpen: true }),
  closeTemplateManager: () => set({ templateManagerOpen: false }),
}));

'use client';

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchMetaApprovedTemplatesApi,
  fetchWhatsAppCloudConfigApi,
  fetchAiAgentConfigApi,
  generateInboxAiAssistApi,
  linkConversationEntityApi,
  markConversationReadApi,
  sendInboxMessageApi,
  simulateInboundMessageApi,
  toggleConversationAutopilotApi,
} from '@/lib/inbox-api';
import type {
  AiSalesAgentPolicy,
  ChatAttachment,
  Conversation,
  LinkedCrmEntityType,
  MetaApprovedTemplate,
  WhatsAppCloudConfig,
} from '@/types/contracts';

export function useInbox(initialThreadId?: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialThreadId || null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waCloudConfig, setWaCloudConfig] = useState<WhatsAppCloudConfig | null>(
    null,
  );
  const [metaTemplates, setMetaTemplates] = useState<MetaApprovedTemplate[]>([]);
  const [aiAgentPolicy, setAiAgentPolicy] = useState<AiSalesAgentPolicy | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const fetchConversations = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const { data } = await apiClient.get<{ data: Conversation[] }>('/inbox', {
          params: { status: statusFilter, search },
        });
        const list = data.data || [];
        setConversations(list);
        if (initialThreadId && list.some((c) => c.id === initialThreadId)) {
          setActiveId(initialThreadId);
        } else if (list.length > 0 && !activeId) {
          setActiveId(list[0].id);
        }
      } catch (err) {
        if (!silent) setError(getErrorMessage(err));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [statusFilter, search, activeId, initialThreadId],
  );

  useEffect(() => {
    void fetchConversations(false);
  }, [fetchConversations]);

  useEffect(() => {
    let active = true;
    fetchWhatsAppCloudConfigApi()
      .then((cfg) => {
        if (!active) return;
        setWaCloudConfig(cfg);
        if (cfg.configured && cfg.wabaId) {
          fetchMetaApprovedTemplatesApi()
            .then((tplRes) => {
              if (active) setMetaTemplates(tplRes.data || []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    fetchAiAgentConfigApi()
      .then((policy) => {
        if (active) setAiAgentPolicy(policy);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Real-time Socket.IO WebSocket push for instant WhatsApp replies & blue ticks
  useEffect(() => {
    if (!accessToken || typeof window === 'undefined') return;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
    const socketOrigin = apiBase.replace(/\/v1\/?$/, '');
    const socket = io(`${socketOrigin}/inbox`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsLiveConnected(true);
    });

    socket.on('disconnect', () => {
      setIsLiveConnected(false);
    });

    socket.on(
      'inbox:conversation_updated',
      (payload: {
        eventType?: string;
        conversation?: Conversation;
      }) => {
        const updated = payload?.conversation;
        if (!updated?.id) return;
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === updated.id);
          if (!exists) {
            return [updated, ...prev];
          }
          const next = prev.map((c) => (c.id === updated.id ? updated : c));
          if (
            payload.eventType === 'message.inbound' ||
            payload.eventType === 'message.outbound'
          ) {
            const others = next.filter((c) => c.id !== updated.id);
            return [updated, ...others];
          }
          return next;
        });
      },
    );

    return () => {
      socket.disconnect();
      setIsLiveConnected(false);
    };
  }, [accessToken]);

  // Fallback silent poll every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      void fetchConversations(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  useEffect(() => {
    if (
      initialThreadId &&
      conversations.some((c) => c.id === initialThreadId)
    ) {
      setActiveId(initialThreadId);
    }
  }, [initialThreadId, conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0] || null;

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      const target = conversations.find((c) => c.id === id);
      if (target && (target.unreadCount || 0) > 0) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
        );
        void markConversationReadApi(id).catch(() => {});
      }
    },
    [conversations],
  );

  const sendMessage = useCallback(
    async (
      content: string,
      opts?: {
        isAiDrafted?: boolean;
        templateId?: string;
        via?: 'inbox' | 'wa_me';
        logToTimeline?: boolean;
        sendMode?: 'text' | 'meta_template';
        metaTemplate?: {
          name: string;
          languageCode?: string;
          bodyParams?: string[];
        };
        attachment?: ChatAttachment;
      },
    ) => {
      if (!activeConversation) return;
      setIsSending(true);
      try {
        const updated = await sendInboxMessageApi(activeConversation.id, {
          content,
          isAiDrafted: opts?.isAiDrafted,
          templateId: opts?.templateId,
          via: opts?.via,
          logToTimeline: opts?.logToTimeline,
          sendMode: opts?.sendMode,
          metaTemplate: opts?.metaTemplate,
          attachment: opts?.attachment,
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation],
  );

  const toggleStatus = useCallback(
    async (id: string, nextStatus: 'open' | 'resolved') => {
      const { data } = await apiClient.patch<Conversation>(`/inbox/${id}`, {
        status: nextStatus,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === data.id ? data : c)),
      );
    },
    [],
  );

  const linkEntity = useCallback(
    async (
      id: string,
      linkedEntityType: LinkedCrmEntityType,
      linkedEntityId?: string,
    ) => {
      const updated = await linkConversationEntityApi(id, {
        linkedEntityType,
        linkedEntityId,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
    [],
  );

  const generateAiAssist = useCallback(
    async (
      id: string,
      opts?: {
        mode?: 'both' | 'reply' | 'summary';
        language?: 'hinglish' | 'english' | 'hindi';
        tone?: 'helpful' | 'closing' | 'followup';
        customInstruction?: string;
      },
    ) => {
      setIsGeneratingAi(true);
      setError(null);
      try {
        const res = await generateInboxAiAssistApi(id, opts);
        if (res?.conversation) {
          setConversations((prev) =>
            prev.map((c) => (c.id === res.conversation.id ? res.conversation : c)),
          );
        }
        return res;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setIsGeneratingAi(false);
      }
    },
    [],
  );

  const toggleAutopilot = useCallback(
    async (id: string, paused: boolean) => {
      const updated = await toggleConversationAutopilotApi(id, paused);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      return updated;
    },
    [],
  );

  const simulateInbound = useCallback(
    async (id: string, message: string) => {
      const updated = await simulateInboundMessageApi(id, message);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      return updated;
    },
    [],
  );

  const upsertAndSelectConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      if (exists) {
        return prev.map((c) => (c.id === conv.id ? conv : c));
      }
      return [conv, ...prev];
    });
    setActiveId(conv.id);
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    setActiveId: selectConversation,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    isLoading,
    isSending,
    isGeneratingAi,
    isLiveConnected,
    error,
    waCloudConfig,
    metaTemplates,
    aiAgentPolicy,
    setAiAgentPolicy,
    sendMessage,
    generateAiAssist,
    toggleStatus,
    toggleAutopilot,
    simulateInbound,
    linkEntity,
    upsertAndSelectConversation,
    refetch: () => fetchConversations(false),
  };
}

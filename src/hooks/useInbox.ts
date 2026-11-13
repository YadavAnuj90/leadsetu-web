'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { Conversation } from '@/types/contracts';

export function useInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ data: Conversation[] }>('/inbox', {
        params: { status: statusFilter, search },
      });
      const list = data.data || [];
      setConversations(list);
      if (list.length > 0 && !activeId) {
        setActiveId(list[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, activeId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0] || null;

  const sendMessage = useCallback(
    async (content: string, isAiDrafted = false) => {
      if (!activeConversation) return;
      setIsSending(true);
      try {
        const { data } = await apiClient.post<Conversation>(
          `/inbox/${activeConversation.id}/messages`,
          { content, isAiDrafted }
        );
        setConversations((prev) =>
          prev.map((c) => (c.id === data.id ? data : c))
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation]
  );

  const toggleStatus = useCallback(
    async (id: string, nextStatus: 'open' | 'resolved') => {
      const { data } = await apiClient.patch<Conversation>(`/inbox/${id}`, {
        status: nextStatus,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === data.id ? data : c))
      );
    },
    []
  );

  const seedInbox = useCallback(async () => {
    setIsSending(true);
    try {
      const { data } = await apiClient.post<{ data: Conversation[] }>(
        '/inbox/seed'
      );
      await fetchConversations();
      if (data.data?.[0]) {
        setActiveId(data.data[0].id);
      }
    } finally {
      setIsSending(false);
    }
  }, [fetchConversations]);

  return {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    isLoading,
    isSending,
    error,
    sendMessage,
    toggleStatus,
    seedInbox,
  };
}

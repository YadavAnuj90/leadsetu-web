'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type {
  CreateDealPayload,
  Deal,
  DealAiAnalysisResponse,
  DealStage,
  DealsStats,
} from '@/types/contracts';

const defaultStats: DealsStats = {
  totalDeals: 0,
  openCount: 0,
  wonCount: 0,
  openPipelineValue: 0,
  weightedForecast: 0,
  wonRevenue: 0,
};

export function useDeals(initialSearch = '') {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealsStats>(defaultStats);
  const [search, setSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [analyzingDealId, setAnalyzingDealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ data: Deal[]; stats: DealsStats }>(
        '/deals',
        { params: { search } }
      );
      setDeals(data.data || []);
      setStats(data.stats || defaultStats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const createDeal = useCallback(
    async (payload: CreateDealPayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const { data } = await apiClient.post<Deal>('/deals', payload);
        await fetchDeals();
        return data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchDeals]
  );

  const updateDeal = useCallback(
    async (id: string, payload: Partial<CreateDealPayload>) => {
      setIsMutating(true);
      setError(null);
      try {
        const { data } = await apiClient.patch<Deal>(`/deals/${id}`, payload);
        setDeals((prev) => prev.map((d) => (d.id === id ? data : d)));
        await fetchDeals();
        return data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchDeals]
  );

  const moveStage = useCallback(
    async (id: string, stage: DealStage) => {
      return updateDeal(id, { stage });
    },
    [updateDeal]
  );

  const deleteDeal = useCallback(
    async (id: string) => {
      setIsMutating(true);
      try {
        await apiClient.delete(`/deals/${id}`);
        setDeals((prev) => prev.filter((d) => d.id !== id));
        await fetchDeals();
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsMutating(false);
      }
    },
    [fetchDeals]
  );

  const analyzeDealAi = useCallback(
    async (id: string) => {
      setAnalyzingDealId(id);
      setError(null);
      try {
        const { data } = await apiClient.post<DealAiAnalysisResponse>(
          `/deals/${id}/ai-analyze`
        );
        if (data?.deal) {
          setDeals((prev) =>
            prev.map((d) => (d.id === id ? data.deal : d))
          );
        }
        return data;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setAnalyzingDealId(null);
      }
    },
    []
  );

  return {
    deals,
    stats,
    search,
    setSearch,
    isLoading,
    isMutating,
    analyzingDealId,
    error,
    fetchDeals,
    createDeal,
    updateDeal,
    moveStage,
    deleteDeal,
    analyzeDealAi,
  };
}

export async function analyzeDealAiApi(
  id: string
): Promise<DealAiAnalysisResponse> {
  const { data } = await apiClient.post<DealAiAnalysisResponse>(
    `/deals/${id}/ai-analyze`
  );
  return data;
}

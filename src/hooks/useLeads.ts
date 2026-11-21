'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type {
  CreateLeadPayload,
  Lead,
  LeadActivity,
  LeadAiAnalysisResponse,
  LeadsListResponse,
  LeadsStats,
} from '@/types/contracts';

export interface LeadsFilter {
  search?: string;
  status?: string;
  source?: string;
  aiLabel?: string;
  sortBy?: 'aiScore' | 'createdAt' | 'estimatedValue';
}

const defaultStats: LeadsStats = {
  total: 0,
  hotCount: 0,
  qualifiedCount: 0,
  convertedCount: 0,
  totalPipelineValue: 0,
  avgAiScore: 0,
};

export function useLeads(initialFilters?: LeadsFilter) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsStats>(defaultStats);
  const [filters, setFilters] = useState<LeadsFilter>(
    initialFilters || {
      search: '',
      status: 'all',
      source: 'all',
      aiLabel: 'all',
      sortBy: 'aiScore',
    }
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(
    async (overrideFilters?: LeadsFilter) => {
      setIsLoading(true);
      setError(null);
      try {
        const active = overrideFilters || filters;
        const { data } = await apiClient.get<LeadsListResponse>('/leads', {
          params: active,
        });
        setLeads(data.data || []);
        setStats(data.stats || defaultStats);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = useCallback(
    async (payload: CreateLeadPayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const { data } = await apiClient.post<Lead>('/leads', payload);
        await fetchLeads();
        return data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchLeads]
  );

  const updateLead = useCallback(
    async (id: string, payload: Partial<CreateLeadPayload>) => {
      setIsMutating(true);
      setError(null);
      try {
        const { data } = await apiClient.patch<Lead>(`/leads/${id}`, payload);
        setLeads((prev) => prev.map((l) => (l.id === id ? data : l)));
        await fetchLeads();
        return data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchLeads]
  );

  const deleteLead = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        await apiClient.delete(`/leads/${id}`);
        setLeads((prev) => prev.filter((l) => l.id !== id));
        await fetchLeads();
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchLeads]
  );

  const analyzeLeadAi = useCallback(
    async (id: string) => {
      setAnalyzingLeadId(id);
      setError(null);
      try {
        const { data } = await apiClient.post<LeadAiAnalysisResponse>(
          `/leads/${id}/ai-analyze`
        );
        if (data?.lead) {
          setLeads((prev) =>
            prev.map((l) => (l.id === id ? data.lead : l))
          );
        }
        await fetchLeads();
        return data;
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setAnalyzingLeadId(null);
      }
    },
    [fetchLeads]
  );

  return {
    leads,
    stats,
    filters,
    setFilters,
    isLoading,
    isMutating,
    analyzingLeadId,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    analyzeLeadAi,
  };
}

export async function fetchSingleLead(id: string): Promise<Lead> {
  const { data } = await apiClient.get<Lead>(`/leads/${id}`);
  return data;
}

export async function analyzeLeadAiApi(
  id: string
): Promise<LeadAiAnalysisResponse> {
  const { data } = await apiClient.post<LeadAiAnalysisResponse>(
    `/leads/${id}/ai-analyze`
  );
  return data;
}

export async function addLeadActivityApi(
  id: string,
  payload: { type?: LeadActivity['type']; description: string }
): Promise<Lead> {
  const { data } = await apiClient.post<Lead>(
    `/leads/${id}/activities`,
    payload
  );
  return data;
}

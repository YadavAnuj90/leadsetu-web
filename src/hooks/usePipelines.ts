'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getErrorMessage } from '@/lib/api-client';
import {
  applyModePresetPipelineApi,
  createPipelineApi,
  deletePipelineApi,
  fetchPipelinesApi,
  setDefaultPipelineApi,
  updatePipelineApi,
} from '@/lib/pipelines-api';
import type {
  CreatePipelinePayload,
  Pipeline,
  PipelineStage,
  UpdatePipelinePayload,
  WorkspaceBusinessMode,
} from '@/types/contracts';

export const FALLBACK_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'qualified', name: 'Qualified Inquiry', probability: 25, color: '#3978EA', category: 'open' },
  { id: 'discovery', name: 'Discovery & Sample', probability: 45, color: '#8B5CF6', category: 'open' },
  { id: 'proposal', name: 'GST Proposal Sent', probability: 65, color: '#F59E0B', category: 'open' },
  { id: 'negotiation', name: 'Commercial Negotiation', probability: 85, color: '#EC4899', category: 'open' },
  { id: 'won', name: 'Closed Won', probability: 100, color: '#10B981', category: 'won' },
  { id: 'lost', name: 'Closed Lost', probability: 0, color: '#64748B', category: 'lost' },
];

export function usePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [defaultPipelineId, setDefaultPipelineId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchPipelinesApi();
      setPipelines(res.data || []);
      setDefaultPipelineId(res.defaultPipelineId || res.data?.[0]?.id || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPipelines();
  }, [fetchPipelines]);

  const defaultPipeline = useMemo(
    () =>
      pipelines.find((p) => p.id === defaultPipelineId) ||
      pipelines.find((p) => p.isDefault) ||
      pipelines[0] ||
      null,
    [pipelines, defaultPipelineId],
  );

  const createPipeline = useCallback(
    async (payload: CreatePipelinePayload) => {
      setIsSaving(true);
      setError(null);
      try {
        const created = await createPipelineApi(payload);
        await fetchPipelines();
        return created;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPipelines],
  );

  const updatePipeline = useCallback(
    async (id: string, payload: UpdatePipelinePayload) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await updatePipelineApi(id, payload);
        await fetchPipelines();
        return updated;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPipelines],
  );

  const setDefaultPipeline = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await setDefaultPipelineApi(id);
        await fetchPipelines();
        return updated;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPipelines],
  );

  const deletePipeline = useCallback(
    async (id: string, reassignToPipelineId?: string) => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await deletePipelineApi(id, reassignToPipelineId);
        await fetchPipelines();
        return res;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPipelines],
  );

  const applyModePreset = useCallback(
    async (businessMode?: WorkspaceBusinessMode) => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await applyModePresetPipelineApi(businessMode);
        await fetchPipelines();
        return res;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPipelines],
  );

  return {
    pipelines,
    defaultPipeline,
    defaultPipelineId,
    isLoading,
    isSaving,
    error,
    fetchPipelines,
    createPipeline,
    updatePipeline,
    setDefaultPipeline,
    deletePipeline,
    applyModePreset,
  };
}

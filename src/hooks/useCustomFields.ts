'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api-client';
import {
  applyCustomFieldPresetApi,
  createCustomFieldApi,
  deleteCustomFieldApi,
  fetchCustomFieldsApi,
  reorderCustomFieldsApi,
  updateCustomFieldApi,
} from '@/lib/custom-fields-api';
import type {
  CreateCustomFieldPayload,
  CustomFieldDef,
  CustomFieldEntity,
  UpdateCustomFieldPayload,
} from '@/types/contracts';

export function useCustomFields(
  entity?: CustomFieldEntity,
  includeInactive = false,
) {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCustomFieldsApi(entity, includeInactive);
      setFields(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [entity, includeInactive]);

  useEffect(() => {
    void fetchFields();
  }, [fetchFields]);

  const createField = useCallback(
    async (payload: CreateCustomFieldPayload) => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await createCustomFieldApi(payload);
        await fetchFields();
        return res;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchFields],
  );

  const applyPreset = useCallback(
    async (
      preset:
        | 'manufacturing_b2b'
        | 'pharma_medical'
        | 'wholesale_distribution'
        | 'real_estate',
    ) => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await applyCustomFieldPresetApi(preset);
        await fetchFields();
        return res;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchFields],
  );

  const updateField = useCallback(
    async (id: string, payload: UpdateCustomFieldPayload) => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await updateCustomFieldApi(id, payload);
        await fetchFields();
        return res;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchFields],
  );

  const reorderFields = useCallback(
    async (targetEntity: CustomFieldEntity, orderedIds: string[]) => {
      setIsSaving(true);
      setError(null);
      try {
        await reorderCustomFieldsApi(targetEntity, orderedIds);
        await fetchFields();
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchFields],
  );

  const deleteField = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setError(null);
      try {
        await deleteCustomFieldApi(id);
        await fetchFields();
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchFields],
  );

  return {
    fields,
    isLoading,
    isSaving,
    error,
    fetchFields,
    createField,
    applyPreset,
    updateField,
    reorderFields,
    deleteField,
  };
}

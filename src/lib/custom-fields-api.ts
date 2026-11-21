import { apiClient } from './api-client';
import type {
  CreateCustomFieldPayload,
  CustomFieldDef,
  CustomFieldEntity,
  UpdateCustomFieldPayload,
} from '@/types/contracts';

export async function fetchCustomFieldsApi(
  entity?: CustomFieldEntity,
  includeInactive = false,
): Promise<{ data: CustomFieldDef[] }> {
  const { data } = await apiClient.get<{ data: CustomFieldDef[] }>(
    '/custom-fields',
    {
      params: {
        ...(entity ? { entity } : {}),
        ...(includeInactive ? { includeInactive: true } : {}),
      },
    },
  );
  return data;
}

export async function createCustomFieldApi(
  payload: CreateCustomFieldPayload,
): Promise<CustomFieldDef> {
  const { data } = await apiClient.post<CustomFieldDef>(
    '/custom-fields',
    payload,
  );
  return data;
}

export async function applyCustomFieldPresetApi(
  preset:
    | 'manufacturing_b2b'
    | 'pharma_medical'
    | 'wholesale_distribution'
    | 'real_estate',
): Promise<{
  createdCount: number;
  skippedCount: number;
  data: CustomFieldDef[];
}> {
  const { data } = await apiClient.post<{
    createdCount: number;
    skippedCount: number;
    data: CustomFieldDef[];
  }>('/custom-fields/preset', { preset });
  return data;
}

export async function updateCustomFieldApi(
  id: string,
  payload: UpdateCustomFieldPayload,
): Promise<CustomFieldDef> {
  const { data } = await apiClient.patch<CustomFieldDef>(
    `/custom-fields/${id}`,
    payload,
  );
  return data;
}

export async function reorderCustomFieldsApi(
  entity: CustomFieldEntity,
  orderedIds: string[],
): Promise<{ data: CustomFieldDef[] }> {
  const { data } = await apiClient.patch<{ data: CustomFieldDef[] }>(
    '/custom-fields/reorder',
    { entity, orderedIds },
  );
  return data;
}

export async function deleteCustomFieldApi(
  id: string,
): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete<{ deleted: boolean; id: string }>(
    `/custom-fields/${id}`,
  );
  return data;
}

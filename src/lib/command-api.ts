import { apiClient } from '@/lib/api-client';
import type {
  GlobalSearchResponse,
  NotificationsResponse,
} from '@/types/contracts';

export async function globalSearchApi(q?: string): Promise<GlobalSearchResponse> {
  const { data } = await apiClient.get<GlobalSearchResponse>(
    '/analytics/search',
    { params: q?.trim() ? { q: q.trim() } : {} },
  );
  return data;
}

export async function fetchNotificationsApi(): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<NotificationsResponse>(
    '/analytics/notifications',
  );
  return data;
}

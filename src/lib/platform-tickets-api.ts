import { apiClient } from '@/lib/api-client';
import type {
  PlatformTicketCategory,
  PlatformTicketItem,
  PlatformTicketPriority,
  PlatformTicketStatus,
  PlatformTicketsTenantResponse,
  SuperAdminPlatformTicketItem,
  SuperAdminPlatformTicketsResponse,
} from '@/types/contracts';

// ─── Workspace Admin API ─────────────────────────────────────────────────────

export async function fetchMyPlatformTicketsApi(params?: {
  status?: string;
  search?: string;
}): Promise<PlatformTicketsTenantResponse> {
  const { data } = await apiClient.get<PlatformTicketsTenantResponse>(
    '/platform-tickets',
    { params },
  );
  return data;
}

export async function createPlatformTicketApi(payload: {
  subject: string;
  category: PlatformTicketCategory;
  priority: PlatformTicketPriority;
  description: string;
  pageUrl?: string;
}): Promise<PlatformTicketItem> {
  const routeUrl =
    payload.pageUrl ??
    (typeof window !== 'undefined' ? window.location.pathname : '');
  const { data } = await apiClient.post<PlatformTicketItem>(
    '/platform-tickets',
    {
      ...payload,
      pageUrl: routeUrl,
    },
  );
  return data;
}

export async function replyPlatformTicketApi(
  id: string,
  payload: { message: string },
): Promise<PlatformTicketItem> {
  const { data } = await apiClient.post<PlatformTicketItem>(
    `/platform-tickets/${id}/reply`,
    payload,
  );
  return data;
}

export async function reopenPlatformTicketApi(
  id: string,
): Promise<PlatformTicketItem> {
  const { data } = await apiClient.patch<PlatformTicketItem>(
    `/platform-tickets/${id}/reopen`,
  );
  return data;
}

// ─── Super Admin HQ API ──────────────────────────────────────────────────────

export async function fetchHqPlatformTicketsApi(params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<SuperAdminPlatformTicketsResponse> {
  const { data } = await apiClient.get<SuperAdminPlatformTicketsResponse>(
    '/platform-tickets/hq',
    { params },
  );
  return data;
}

export async function updateHqPlatformTicketApi(
  id: string,
  payload: {
    status?: PlatformTicketStatus;
    priority?: PlatformTicketPriority;
    resolutionSummary?: string;
    replyMessage?: string;
  },
): Promise<SuperAdminPlatformTicketItem> {
  const { data } = await apiClient.patch<SuperAdminPlatformTicketItem>(
    `/platform-tickets/hq/${id}`,
    payload,
  );
  return data;
}

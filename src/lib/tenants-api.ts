import { apiClient } from '@/lib/api-client';
import type {
  SubscriptionInvoice,
  SubscriptionPlanSpec,
  TenantInfo,
} from '@/types/contracts';

export interface TenantWorkspaceResponse {
  tenant: TenantInfo;
  usage: {
    activeSeats: number;
    totalSeats: number;
    seatLimit: number;
  };
}

export interface BillingSummaryResponse extends TenantWorkspaceResponse {
  seller: {
    sellerCompany: string;
    sellerGstin: string;
    sellerAddress: string;
    sellerEmail: string;
  };
  plans: SubscriptionPlanSpec[];
  invoices: SubscriptionInvoice[];
  latestInvoice?: SubscriptionInvoice;
}

export interface UpdateTenantProfilePayload {
  name?: string;
  companyName?: string;
  logoUrl?: string;
  city?: string;
  gstin?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface SubscribePlanPayload {
  plan: 'starter' | 'growth' | 'enterprise';
  billingCycle?: 'monthly' | 'annual';
  paymentMode?: string;
  paymentReference?: string;
  greetingNote?: string;
}

export async function fetchCurrentTenantApi(): Promise<TenantWorkspaceResponse> {
  const { data } = await apiClient.get<TenantWorkspaceResponse>('/tenants/me');
  return data;
}

export async function updateCurrentTenantApi(
  payload: UpdateTenantProfilePayload,
): Promise<TenantWorkspaceResponse> {
  const { data } = await apiClient.patch<TenantWorkspaceResponse>(
    '/tenants/me',
    payload,
  );
  return data;
}

export async function fetchBillingSummaryApi(): Promise<BillingSummaryResponse> {
  const { data } = await apiClient.get<BillingSummaryResponse>(
    '/tenants/me/billing',
  );
  return data;
}

export async function subscribePlanApi(
  payload: SubscribePlanPayload,
): Promise<BillingSummaryResponse> {
  const { data } = await apiClient.post<BillingSummaryResponse>(
    '/tenants/me/billing/subscribe',
    payload,
  );
  return data;
}

export interface WorkspaceTopupRequestItem {
  id: string;
  resource: 'ai' | 'whatsapp';
  quantity: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedByUserId: string;
  requestedByName: string;
  requestedByEmail: string;
  createdAt: string;
  resolvedAt: string;
  resolvedByEmail: string;
  resolutionNote: string;
  grantedQuantity: number;
}

export async function fetchTopupRequestsApi(): Promise<{
  data: WorkspaceTopupRequestItem[];
}> {
  const { data } = await apiClient.get<{ data: WorkspaceTopupRequestItem[] }>(
    '/tenants/me/topup-requests',
  );
  return data;
}

export async function createTopupRequestApi(payload: {
  resource: 'ai' | 'whatsapp';
  quantity: number;
  note?: string;
}): Promise<{
  created: WorkspaceTopupRequestItem;
  data: WorkspaceTopupRequestItem[];
}> {
  const { data } = await apiClient.post('/tenants/me/topup-requests', payload);
  return data;
}

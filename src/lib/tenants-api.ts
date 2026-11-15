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

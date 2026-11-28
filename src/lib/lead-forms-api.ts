import { apiClient } from '@/lib/api-client';
import type { LeadFormConfig } from '@/lib/lead-forms-mock';

export interface PublicFormLoadResponse {
  form: LeadFormConfig;
  publicContext: {
    bookingSlug: string;
    whatsappNumber: string;
  };
}

export interface RequestPublicOtpResponse {
  sent: boolean;
  maskedPhone: string;
  demoOtpHint?: string;
}

export interface VerifyPublicOtpResponse {
  verified: boolean;
  otpToken: string;
}

export interface SubmitPublicFormResponse {
  ok: boolean;
  ignored?: boolean;
  outcome?: 'created' | 'merged';
  leadId?: string;
  bookingSlug?: string;
  whatsappNumber?: string;
  brochureUrl?: string;
}

export interface LeadFormSubmissionItem {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  city: string;
  answers: Record<string, string>;
  otpVerified: boolean;
  outcome: 'created' | 'merged';
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
  createdAt: string;
  leadStatus: string;
  aiScore: number;
  aiLabel: 'Hot' | 'Warm' | 'Cold';
  dealId: string;
  dealTitle: string;
  dealStage: string;
  dealValueInr: number;
}

export interface LeadFormSubmissionsResponse {
  form: {
    id: string;
    slug: string;
    title: string;
    brandColor: string;
  };
  summary: {
    totalCount: number;
    otpVerifiedCount: number;
    qualifiedCount: number;
    topUtmSources: Array<{ source: string; count: number }>;
  };
  submissions: LeadFormSubmissionItem[];
}

export async function fetchLeadFormsApi(): Promise<LeadFormConfig[]> {
  const { data } = await apiClient.get<LeadFormConfig[]>('/lead-forms');
  return data;
}

export async function fetchLeadFormBySlugApi(
  idOrSlug: string,
): Promise<LeadFormConfig> {
  const { data } = await apiClient.get<LeadFormConfig>(
    `/lead-forms/${encodeURIComponent(idOrSlug)}`,
  );
  return data;
}

export async function createLeadFormApi(
  payload: Partial<LeadFormConfig>,
): Promise<LeadFormConfig> {
  const { data } = await apiClient.post<LeadFormConfig>('/lead-forms', payload);
  return data;
}

export async function updateLeadFormApi(
  idOrSlug: string,
  payload: Partial<LeadFormConfig>,
): Promise<LeadFormConfig> {
  const { data } = await apiClient.patch<LeadFormConfig>(
    `/lead-forms/${encodeURIComponent(idOrSlug)}`,
    payload,
  );
  return data;
}

export async function duplicateLeadFormApi(
  idOrSlug: string,
): Promise<LeadFormConfig> {
  const { data } = await apiClient.post<LeadFormConfig>(
    `/lead-forms/${encodeURIComponent(idOrSlug)}/duplicate`,
  );
  return data;
}

export async function deleteLeadFormApi(
  idOrSlug: string,
): Promise<{ deleted: boolean; id: string; slug: string }> {
  const { data } = await apiClient.delete<{
    deleted: boolean;
    id: string;
    slug: string;
  }>(`/lead-forms/${encodeURIComponent(idOrSlug)}`);
  return data;
}

export async function fetchLeadFormSubmissionsApi(
  idOrSlug: string,
): Promise<LeadFormSubmissionsResponse> {
  const { data } = await apiClient.get<LeadFormSubmissionsResponse>(
    `/lead-forms/${encodeURIComponent(idOrSlug)}/submissions`,
  );
  return data;
}

// ─── Public Endpoints (no auth required) ─────────────────────────────────────

export async function fetchPublicLeadFormApi(
  slug: string,
  trackView = true,
): Promise<PublicFormLoadResponse> {
  const { data } = await apiClient.get<PublicFormLoadResponse>(
    `/public/forms/${encodeURIComponent(slug)}`,
    { params: trackView ? undefined : { track: '0' } },
  );
  return data;
}

export async function trackPublicFormStartApi(
  slug: string,
): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post<{ ok: boolean }>(
    `/public/forms/${encodeURIComponent(slug)}/start`,
  );
  return data;
}

export async function requestPublicFormOtpApi(
  slug: string,
  payload: { phone: string; name?: string },
): Promise<RequestPublicOtpResponse> {
  const { data } = await apiClient.post<RequestPublicOtpResponse>(
    `/public/forms/${encodeURIComponent(slug)}/otp`,
    payload,
  );
  return data;
}

export async function verifyPublicFormOtpApi(
  slug: string,
  payload: { phone: string; code: string },
): Promise<VerifyPublicOtpResponse> {
  const { data } = await apiClient.post<VerifyPublicOtpResponse>(
    `/public/forms/${encodeURIComponent(slug)}/verify-otp`,
    payload,
  );
  return data;
}

export async function submitPublicLeadFormApi(
  slug: string,
  payload: {
    answers: Record<string, string>;
    otpCode?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    _hp?: string;
  },
): Promise<SubmitPublicFormResponse> {
  const { data } = await apiClient.post<SubmitPublicFormResponse>(
    `/public/forms/${encodeURIComponent(slug)}/submit`,
    payload,
  );
  return data;
}

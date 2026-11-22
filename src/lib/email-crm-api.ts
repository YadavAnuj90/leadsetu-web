import { apiClient } from './api-client';
import type {
  EmailAccountInfo,
  EmailCrmConfigResponse,
  EmailMessageItem,
  EmailProviderPreset,
  EmailTemplateCategory,
  EmailTemplateItem,
} from '@/types/contracts';

export async function fetchEmailCrmConfigApi(): Promise<EmailCrmConfigResponse> {
  const { data } = await apiClient.get<EmailCrmConfigResponse>('/email-crm/config');
  return data;
}

export async function saveEmailAccountApi(payload: {
  providerPreset: EmailProviderPreset;
  emailAddress: string;
  displayName?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  username?: string;
  appPassword?: string;
  signatureHtml?: string;
  isActive?: boolean;
}): Promise<EmailAccountInfo> {
  const { data } = await apiClient.put<EmailAccountInfo>('/email-crm/account', payload);
  return data;
}

export async function testEmailConnectionApi(): Promise<{
  smtpOk: boolean;
  smtpError: string;
  imapOk: boolean;
  imapError: string;
  emailAddress: string;
}> {
  const { data } = await apiClient.post<{
    smtpOk: boolean;
    smtpError: string;
    imapOk: boolean;
    imapError: string;
    emailAddress: string;
  }>('/email-crm/account/test');
  return data;
}

export async function syncInboundEmailsApi(): Promise<{
  importedCount: number;
  lastSyncedAt: string;
  data: EmailMessageItem[];
}> {
  const { data } = await apiClient.post<{
    importedCount: number;
    lastSyncedAt: string;
    data: EmailMessageItem[];
  }>('/email-crm/sync');
  return data;
}

export async function createEmailTemplateApi(payload: {
  name: string;
  category?: EmailTemplateCategory;
  subject: string;
  bodyHtml: string;
}): Promise<EmailTemplateItem> {
  const { data } = await apiClient.post<EmailTemplateItem>('/email-crm/templates', payload);
  return data;
}

export async function updateEmailTemplateApi(
  id: string,
  payload: Partial<{
    name: string;
    category: EmailTemplateCategory;
    subject: string;
    bodyHtml: string;
  }>,
): Promise<EmailTemplateItem> {
  const { data } = await apiClient.patch<EmailTemplateItem>(`/email-crm/templates/${id}`, payload);
  return data;
}

export async function deleteEmailTemplateApi(id: string): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete<{ deleted: boolean }>(`/email-crm/templates/${id}`);
  return data;
}

export async function fetchEntityEmailsApi(params: {
  entityType?: 'lead' | 'contact' | 'deal';
  entityId?: string;
  limit?: number;
}): Promise<{ data: EmailMessageItem[] }> {
  const { data } = await apiClient.get<{ data: EmailMessageItem[] }>('/email-crm/messages', {
    params,
  });
  return data;
}

export async function sendTrackedEmailApi(payload: {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  entityType?: 'lead' | 'contact' | 'deal' | '';
  entityId?: string;
  entityLabel?: string;
  templateId?: string;
}): Promise<EmailMessageItem> {
  const { data } = await apiClient.post<EmailMessageItem>('/email-crm/send', payload);
  return data;
}

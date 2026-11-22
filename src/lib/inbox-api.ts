import { apiClient } from './api-client';
import type {
  AiSalesAgentPolicy,
  ChatAttachment,
  Conversation,
  InboxCrmEntitiesResponse,
  LinkedCrmEntityType,
  MetaApprovedTemplate,
  WhatsAppCloudConfig,
  WhatsAppCloudTestResponse,
  WhatsAppTemplate,
  WhatsAppTemplateCategory,
  WhatsAppTemplateLanguage,
  WhatsAppVariableMeta,
} from '@/types/contracts';

export async function fetchWhatsAppCloudConfigApi(): Promise<WhatsAppCloudConfig> {
  const { data } = await apiClient.get<WhatsAppCloudConfig>(
    '/inbox/whatsapp-config',
  );
  return data;
}

export async function saveWhatsAppCloudConfigApi(payload: {
  enabled?: boolean;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  appSecret?: string;
  verifyToken?: string;
  clearAccessToken?: boolean;
  clearAppSecret?: boolean;
}): Promise<WhatsAppCloudConfig> {
  const { data } = await apiClient.patch<WhatsAppCloudConfig>(
    '/inbox/whatsapp-config',
    payload,
  );
  return data;
}

export async function testWhatsAppCloudConfigApi(payload?: {
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
}): Promise<WhatsAppCloudTestResponse> {
  const { data } = await apiClient.post<WhatsAppCloudTestResponse>(
    '/inbox/whatsapp-config/test',
    payload || {},
  );
  return data;
}

export async function connectCompanyWhatsAppNumberApi(payload: {
  phoneNumber: string;
  businessDisplayName?: string;
}): Promise<WhatsAppCloudConfig> {
  const { data } = await apiClient.post<WhatsAppCloudConfig>(
    '/inbox/whatsapp-config/connect-number',
    payload,
  );
  return data;
}

export async function completeEmbeddedSignupApi(payload: {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
  redirectUri?: string;
}): Promise<WhatsAppCloudConfig> {
  const { data } = await apiClient.post<WhatsAppCloudConfig>(
    '/inbox/whatsapp-config/embedded-signup',
    payload,
  );
  return data;
}

export async function activateLeadsetuManagedWhatsAppApi(): Promise<WhatsAppCloudConfig> {
  const { data } = await apiClient.post<WhatsAppCloudConfig>(
    '/inbox/whatsapp-config/use-managed',
  );
  return data;
}

export async function disconnectWhatsAppApi(): Promise<WhatsAppCloudConfig> {
  const { data } = await apiClient.post<WhatsAppCloudConfig>(
    '/inbox/whatsapp-config/disconnect',
  );
  return data;
}

export async function fetchMetaApprovedTemplatesApi(): Promise<{
  configured: boolean;
  error?: string;
  data: MetaApprovedTemplate[];
}> {
  const { data } = await apiClient.get<{
    configured: boolean;
    error?: string;
    data: MetaApprovedTemplate[];
  }>('/inbox/meta-templates');
  return data;
}

export async function fetchWhatsAppTemplatesApi(params?: {
  category?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<{
  data: WhatsAppTemplate[];
  supportedVariables: WhatsAppVariableMeta[];
}> {
  const { data } = await apiClient.get<{
    data: WhatsAppTemplate[];
    supportedVariables: WhatsAppVariableMeta[];
  }>('/inbox/templates', {
    params: {
      ...(params?.category ? { category: params.category } : {}),
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.activeOnly !== undefined
        ? { activeOnly: String(params.activeOnly) }
        : {}),
    },
  });
  return data;
}

export async function createWhatsAppTemplateApi(payload: {
  name: string;
  category?: WhatsAppTemplateCategory;
  language?: WhatsAppTemplateLanguage;
  body: string;
  isActive?: boolean;
}): Promise<WhatsAppTemplate> {
  const { data } = await apiClient.post<WhatsAppTemplate>('/inbox/templates', payload);
  return data;
}

export async function updateWhatsAppTemplateApi(
  id: string,
  payload: {
    name?: string;
    category?: WhatsAppTemplateCategory;
    language?: WhatsAppTemplateLanguage;
    body?: string;
    isActive?: boolean;
  },
): Promise<WhatsAppTemplate> {
  const { data } = await apiClient.patch<WhatsAppTemplate>(
    `/inbox/templates/${id}`,
    payload,
  );
  return data;
}

export async function deleteWhatsAppTemplateApi(
  id: string,
): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete<{ deleted: boolean; id: string }>(
    `/inbox/templates/${id}`,
  );
  return data;
}

export async function fetchInboxCrmEntitiesApi(
  search?: string,
): Promise<InboxCrmEntitiesResponse> {
  const { data } = await apiClient.get<InboxCrmEntitiesResponse>(
    '/inbox/crm-entities',
    {
      params: search?.trim() ? { search: search.trim() } : undefined,
    },
  );
  return data;
}

export async function startOrGetConversationApi(payload: {
  linkedEntityType?: LinkedCrmEntityType;
  linkedEntityId?: string;
  contactName?: string;
  company?: string;
  phone?: string;
  city?: string;
  estimatedValue?: number;
  channel?: 'whatsapp' | 'indiamart' | 'email';
  initialMessage?: string;
  templateId?: string;
  via?: 'inbox' | 'wa_me';
  isAiDrafted?: boolean;
  logToTimeline?: boolean;
  sendMode?: 'text' | 'meta_template';
  metaTemplate?: {
    name: string;
    languageCode?: string;
    bodyParams?: string[];
  };
  attachment?: ChatAttachment;
}): Promise<{
  conversation: Conversation;
  created: boolean;
  timelineLogged: boolean;
}> {
  const { data } = await apiClient.post<{
    conversation: Conversation;
    created: boolean;
    timelineLogged: boolean;
  }>('/inbox/conversations', payload);
  return data;
}

export async function linkConversationEntityApi(
  conversationId: string,
  payload: {
    linkedEntityType: LinkedCrmEntityType;
    linkedEntityId?: string;
  },
): Promise<Conversation> {
  const { data } = await apiClient.patch<Conversation>(
    `/inbox/${conversationId}/link`,
    payload,
  );
  return data;
}

export async function sendInboxMessageApi(
  conversationId: string,
  payload: {
    content?: string;
    isAiDrafted?: boolean;
    templateId?: string;
    via?: 'inbox' | 'wa_me';
    logToTimeline?: boolean;
    sendMode?: 'text' | 'meta_template';
    metaTemplate?: {
      name: string;
      languageCode?: string;
      bodyParams?: string[];
    };
    attachment?: ChatAttachment;
  },
): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>(
    `/inbox/${conversationId}/messages`,
    payload,
  );
  return data;
}

export async function markConversationReadApi(
  conversationId: string,
): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>(
    `/inbox/${conversationId}/read`,
  );
  return data;
}

export async function generateInboxAiAssistApi(
  conversationId: string,
  payload?: {
    mode?: 'both' | 'reply' | 'summary';
    language?: 'hinglish' | 'english' | 'hindi';
    tone?: 'helpful' | 'closing' | 'followup';
    customInstruction?: string;
  },
): Promise<{
  conversation: Conversation;
  aiSummary: string;
  aiSuggestedReply: string;
  provider: string;
  model: string;
}> {
  const { data } = await apiClient.post(
    `/inbox/${conversationId}/ai-assist`,
    payload || { mode: 'both', language: 'hinglish' },
  );
  return data;
}

export async function fetchAiAgentConfigApi(): Promise<AiSalesAgentPolicy> {
  const { data } = await apiClient.get<AiSalesAgentPolicy>('/inbox/ai-agent/config');
  return data;
}

export async function updateAiAgentConfigApi(
  payload: Partial<AiSalesAgentPolicy>,
): Promise<AiSalesAgentPolicy> {
  const { data } = await apiClient.patch<AiSalesAgentPolicy>(
    '/inbox/ai-agent/config',
    payload,
  );
  return data;
}

export async function toggleConversationAutopilotApi(
  conversationId: string,
  paused: boolean,
): Promise<Conversation> {
  const { data } = await apiClient.patch<Conversation>(
    `/inbox/${conversationId}/ai-autopilot`,
    { paused },
  );
  return data;
}

export async function simulateInboundMessageApi(
  conversationId: string,
  message: string,
): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>(
    `/inbox/${conversationId}/simulate-inbound`,
    { message },
  );
  return data;
}

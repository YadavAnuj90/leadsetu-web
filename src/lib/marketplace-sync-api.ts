import { apiClient } from './api-client';

export interface IndiaMartPullConfigDto {
  enabled: boolean;
  hasCrmKey: boolean;
  glusrCrmKeyMask: string;
  registeredMobile: string;
  pollIntervalMinutes: number;
  autoWhatsAppSpeedToLead: boolean;
  greetingTemplate: string;
  slaThresholdMinutes: number;
  lastSyncedAt: string;
  lastSyncStatus: string;
  lastSyncSummary: string;
}

export interface MarketplaceSlaBreachedLead {
  id: string;
  name: string;
  phone: string;
  city: string;
  source: string;
  ageMinutes: number;
  ownerName: string;
}

export interface MarketplaceSyncSampleLead {
  leadId: string;
  name: string;
  phone: string;
  city: string;
  product: string;
  outcome: 'created' | 'deduplicated';
  assignedRepName: string;
  whatsAppSent: boolean;
  speedToLeadSeconds: number;
}

export interface MarketplaceSyncLogDto {
  id: string;
  channel:
    | 'indiamart_pull'
    | 'justdial_feed'
    | 'tradeindia_feed'
    | 'meta_lead_ads'
    | 'booking_widget'
    | 'sandbox_sim';
  mode: 'live_api' | 'sandbox';
  fetchedCount: number;
  createdCount: number;
  deduplicatedCount: number;
  skippedCount: number;
  whatsAppDispatchedCount: number;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage: string;
  sampleLeads: MarketplaceSyncSampleLead[];
  syncedAt: string;
}

export interface MarketplaceSyncOverviewResponse {
  config: IndiaMartPullConfigDto;
  slaMetrics: {
    totalMarketplaceLeads: number;
    autoWelcomedCount: number;
    contactedUnder10sCount: number;
    under10sPct: number;
    avgSpeedToLeadSeconds: number;
    slaBreachedCount: number;
    slaBreachedLeads: MarketplaceSlaBreachedLead[];
  };
  recentLogs: MarketplaceSyncLogDto[];
}

export async function fetchMarketplaceSyncOverviewApi(): Promise<MarketplaceSyncOverviewResponse> {
  const { data } = await apiClient.get<MarketplaceSyncOverviewResponse>(
    '/marketplace-sync',
  );
  return data;
}

export async function updateIndiaMartConfigApi(payload: {
  enabled?: boolean;
  glusrCrmKey?: string;
  registeredMobile?: string;
  pollIntervalMinutes?: number;
  autoWhatsAppSpeedToLead?: boolean;
  greetingTemplate?: string;
  slaThresholdMinutes?: number;
}): Promise<MarketplaceSyncOverviewResponse> {
  const { data } = await apiClient.patch<MarketplaceSyncOverviewResponse>(
    '/marketplace-sync/config',
    payload,
  );
  return data;
}

export async function pullIndiaMartNowApi(payload?: {
  simulateIfNoKey?: boolean;
  sampleCount?: number;
}): Promise<{
  logId: string;
  channel: string;
  mode: 'live_api' | 'sandbox';
  fetchedCount: number;
  createdCount: number;
  deduplicatedCount: number;
  skippedCount: number;
  whatsAppDispatchedCount: number;
  durationMs: number;
  summaryText: string;
  sampleLeads: MarketplaceSyncSampleLead[];
  syncedAt: string;
}> {
  const { data } = await apiClient.post('/marketplace-sync/pull', payload || {});
  return data;
}

export async function rescueSlaLeadApi(leadId: string): Promise<{
  leadId: string;
  name: string;
  whatsAppSent: boolean;
  speedToLeadSeconds: number;
}> {
  const { data } = await apiClient.post(`/marketplace-sync/nudge/${leadId}`);
  return data;
}

export interface BookingAppointmentDto {
  id: string;
  bookingRef: string;
  slug: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCompany: string;
  topic: string;
  dateYmd: string;
  slotLabel: string;
  slotStartIso: string;
  slotEndIso: string;
  assignedRepName: string;
  meetingType: 'video_call' | 'phone_call' | 'in_person';
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  confirmationSent: boolean;
  reminder1HrSent: boolean;
  noShowNudgeSent: boolean;
  leadId: string;
}

export interface LeadConnectorsOverviewResponse {
  webhookKey: string;
  endpoints: {
    metaLeadAdsWebhookPath: string;
    justdialWebhookPath: string;
    tradeindiaWebhookPath: string;
    bookingPublicPath: string;
  };
  metaLeadAds: {
    enabled: boolean;
    verifyToken: string;
    hasAppSecret: boolean;
    appSecretMask: string;
    hasPageAccessToken: boolean;
    pageAccessTokenMask: string;
    pageId: string;
    pageName: string;
    formId: string;
    autoWhatsAppWelcome: boolean;
    lastReceivedAt: string;
    lastLeadSummary: string;
  };
  justdialWebhook: {
    enabled: boolean;
    secretToken: string;
    categoryFilter: string;
    autoWhatsAppWelcome: boolean;
    lastReceivedAt: string;
    lastLeadSummary: string;
  };
  tradeindiaWebhook: {
    enabled: boolean;
    secretToken: string;
    apiUserId: string;
    profileId: string;
    hasApiKey: boolean;
    apiKeyMask: string;
    autoWhatsAppWelcome: boolean;
    lastReceivedAt: string;
    lastLeadSummary: string;
  };
  bookingScheduler: {
    enabled: boolean;
    slug: string;
    title: string;
    subtitle: string;
    durationMinutes: number;
    bufferMinutes: number;
    workingDays: number[];
    startHour: string;
    endHour: string;
    meetingType: 'video_call' | 'phone_call' | 'in_person';
    confirmationWhatsappEnabled: boolean;
    reminder1HrEnabled: boolean;
    totalBookingsCount: number;
  };
  recentBookings: BookingAppointmentDto[];
}

export async function fetchLeadConnectorsApi(): Promise<LeadConnectorsOverviewResponse> {
  const { data } = await apiClient.get<LeadConnectorsOverviewResponse>(
    '/marketplace-sync/connectors',
  );
  return data;
}

export async function updateLeadConnectorsApi(payload: {
  metaLeadAds?: Partial<{
    enabled: boolean;
    verifyToken: string;
    appSecret: string;
    pageAccessToken: string;
    pageId: string;
    pageName: string;
    formId: string;
    autoWhatsAppWelcome: boolean;
    clearAppSecret: boolean;
    clearPageAccessToken: boolean;
  }>;
  justdialWebhook?: Partial<{
    enabled: boolean;
    secretToken: string;
    categoryFilter: string;
    autoWhatsAppWelcome: boolean;
  }>;
  tradeindiaWebhook?: Partial<{
    enabled: boolean;
    secretToken: string;
    apiUserId: string;
    profileId: string;
    apiKey: string;
    autoWhatsAppWelcome: boolean;
    clearApiKey: boolean;
  }>;
  bookingScheduler?: Partial<{
    enabled: boolean;
    slug: string;
    title: string;
    subtitle: string;
    durationMinutes: number;
    bufferMinutes: number;
    workingDays: number[];
    startHour: string;
    endHour: string;
    meetingType: 'video_call' | 'phone_call' | 'in_person';
    confirmationWhatsappEnabled: boolean;
    reminder1HrEnabled: boolean;
  }>;
}): Promise<LeadConnectorsOverviewResponse> {
  const { data } = await apiClient.patch<LeadConnectorsOverviewResponse>(
    '/marketplace-sync/connectors',
    payload,
  );
  return data;
}

export async function simulateConnectorWebhookApi(payload: {
  channel: 'meta_lead_ads' | 'justdial_feed' | 'tradeindia_feed';
  name?: string;
  phone?: string;
  city?: string;
  product?: string;
}): Promise<{
  createdCount: number;
  deduplicatedCount: number;
  whatsAppDispatchedCount: number;
  summaryText: string;
}> {
  const { data } = await apiClient.post(
    '/marketplace-sync/connectors/simulate',
    payload,
  );
  return data;
}

export async function updateBookingStatusApi(
  bookingId: string,
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show',
  sendRecoveryWhatsApp = true,
): Promise<{
  id: string;
  bookingRef: string;
  status: string;
  nudgeSent: boolean;
}> {
  const { data } = await apiClient.patch(
    `/marketplace-sync/bookings/${bookingId}/status`,
    { status, sendRecoveryWhatsApp },
  );
  return data;
}

export interface PublicBookingSlotDto {
  time24: string;
  label: string;
  slotStartIso: string;
  slotEndIso: string;
  available: boolean;
}

export interface PublicSchedulerInfoResponse {
  slug: string;
  companyName: string;
  logoUrl: string;
  city: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  meetingType: 'video_call' | 'phone_call' | 'in_person';
  workingDays: number[];
  startHour: string;
  endHour: string;
  dateYmd: string;
  slots: PublicBookingSlotDto[];
}

export async function fetchPublicBookingSlotsApi(
  slug: string,
  dateYmd?: string,
): Promise<PublicSchedulerInfoResponse> {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1'
  ).replace(/\/+$/, '');
  const url = `${base}/public/booking/${encodeURIComponent(slug)}${
    dateYmd ? `?date=${encodeURIComponent(dateYmd)}` : ''
  }`;
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Booking calendar unavailable.');
  }
  return json as PublicSchedulerInfoResponse;
}

export async function createPublicBookingApi(
  slug: string,
  payload: {
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    guestCompany?: string;
    topic?: string;
    dateYmd: string;
    slotTime24: string;
  },
): Promise<{
  id: string;
  bookingRef: string;
  companyName: string;
  assignedRepName: string;
  dateYmd: string;
  slotLabel: string;
  slotStartIso: string;
  slotEndIso: string;
  durationMinutes: number;
  meetingType: string;
  confirmationSent: boolean;
  icsContent: string;
}> {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1'
  ).replace(/\/+$/, '');
  const res = await fetch(`${base}/public/booking/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Failed to schedule appointment.');
  }
  return json;
}

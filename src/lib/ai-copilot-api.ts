import { apiClient } from './api-client';

export interface AiCopilotHealthResponse {
  connected: boolean;
  aiUrl: string;
  details?: {
    status: string;
    service: string;
    providers?: string[];
    liveLlmConfigured?: boolean;
    pillars?: string[];
  };
}

export interface AiGatewayEnvelope<T = Record<string, unknown>> {
  requestId: string;
  task: string;
  result: string;
  structured?: T;
  sources?: Array<{ entityType: string; entityId: string; excerpt: string }>;
  model: string;
  provider?: string;
  tokensUsed: number;
  durationMs: number;
}

export interface CreditRiskAiResult {
  riskScore: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction:
    | 'approve_dispatch'
    | 'request_partial_advance'
    | 'hold_dispatch'
    | 'escalate_owner_recovery';
  utilizationPct: number;
  projectedExposureInr: number;
  extractedPromise: {
    hasPromise: boolean;
    promisedAmountInr: number | null;
    promisedTimeline: string | null;
  };
  reasons: string[];
  summary: string;
}

export async function checkAiCopilotHealthApi(): Promise<AiCopilotHealthResponse> {
  const { data } = await apiClient.get<AiCopilotHealthResponse>(
    '/ai-copilot/health',
  );
  return data;
}

export async function scoreAiCreditRiskApi(payload: {
  dealerName: string;
  gstin?: string;
  creditLimitInr: number;
  outstandingInr: number;
  overdueInr: number;
  maxOverdueDays: number;
  bouncedCheques?: number;
  orderValueInr?: number;
  recentPromiseText?: string;
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<CreditRiskAiResult> | null;
}> {
  const { data } = await apiClient.post<{
    source: string;
    response: AiGatewayEnvelope<CreditRiskAiResult> | null;
  }>('/ai-copilot/credit-risk', payload);
  return data;
}

export async function draftAiUdhaarReminderApi(payload: {
  dealerName: string;
  contactPerson?: string;
  invoiceNumber?: string;
  overdueInr: number;
  overdueDays: number;
  tone?: 'gentle' | 'firm' | 'overdue_alert' | 'final_warning';
  language?: 'hinglish' | 'english' | 'hindi';
  paymentLink?: string;
  companyName?: string;
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<{
    tone: string;
    language: string;
    requiresApproval: boolean;
    approvalReason: string;
  }> | null;
}> {
  const { data } = await apiClient.post('/ai-copilot/udhaar-reminder', payload);
  return data;
}

// ── Pillar 2: Hinglish Voice-to-CRM & Call Audit ──────

export interface VoiceToCrmAiResult {
  languageDetected: 'hinglish' | 'hindi' | 'english';
  summary: string;
  sentiment: 'positive' | 'neutral' | 'cautious' | 'negative';
  leadUpdate: {
    buyerName?: string;
    city?: string;
    productInterest?: string[];
    moqUnits?: number | null;
    quotedValueInr?: number | null;
    gstIncluded?: boolean;
    paymentTerms?: string | null;
  };
  nextTask: {
    title: string;
    dueHint: string;
    priority: 'high' | 'medium' | 'low';
  };
  objections: string[];
  commitments: string[];
}

export interface CallAuditAiResult {
  auditScore: number;
  verdict: 'EXCELLENT' | 'GOOD' | 'NEEDS_COACHING' | 'COMPLIANCE_FLAG';
  checklist: {
    requirementQualified: boolean;
    pricingAndGstAnchored: boolean;
    creditTermsClarified: boolean;
    objectionAddressed: boolean;
    nextStepLocked: boolean;
  };
  strengths: string[];
  missedChecks: string[];
  complianceFlags: string[];
  coachingTip: string;
}

export async function extractAiVoiceToCrmApi(payload: {
  transcript: string;
  repName?: string;
  leadOrDealerName?: string;
  cityHint?: string;
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<VoiceToCrmAiResult> | null;
}> {
  const { data } = await apiClient.post('/ai-copilot/voice-crm', {
    ...payload,
    mode: 'extract',
  });
  return data;
}

export async function auditAiCallApi(payload: {
  transcript: string;
  repName?: string;
  leadOrDealerName?: string;
  callDurationSec?: number;
  dealStage?: string;
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<CallAuditAiResult> | null;
}> {
  const { data } = await apiClient.post('/ai-copilot/voice-crm', {
    ...payload,
    mode: 'audit',
  });
  return data;
}

// ── Pillar 3: WhatsApp Dealer RFQ Parser & Field Beat Planner ──

export interface DealerRfqItem {
  itemText: string;
  quantity: number;
  unit: string;
}

export interface DealerRfqAiResult {
  isRfq: boolean;
  urgency: 'urgent' | 'normal' | 'exploratory';
  gstInvoiceRequested: boolean;
  deliveryCity: string | null;
  lineItems: DealerRfqItem[];
  suggestedHinglishReply: string;
  suggestedEnglishReply: string;
  missingDetails: string[];
}

export interface BeatStopInput {
  id: string;
  dealerName: string;
  areaCluster: string;
  overdueInr?: number;
  overdueDays?: number;
  openDealValueInr?: number;
  daysSinceLastVisit?: number;
  urgentIssue?: boolean;
}

export interface BeatPlanAiResult {
  dateLabel: string;
  totalStops: number;
  totalRecoverableInr: number;
  totalPipelineInr: number;
  orderedStops: Array<
    BeatStopInput & {
      priorityScore: number;
      visitObjective: string;
      sequence: number;
    }
  >;
  routeSummary: string;
}

export async function parseAiDealerRfqApi(payload: {
  message: string;
  dealerName?: string;
  dealerCity?: string;
  companyName?: string;
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<DealerRfqAiResult> | null;
}> {
  const { data } = await apiClient.post('/ai-copilot/dealer-desk', {
    ...payload,
    mode: 'rfq',
  });
  return data;
}

export async function buildAiBeatPlanApi(payload: {
  dateLabel?: string;
  stops: BeatStopInput[];
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<BeatPlanAiResult> | null;
}> {
  const { data } = await apiClient.post('/ai-copilot/dealer-desk', {
    ...payload,
    mode: 'beat_plan',
  });
  return data;
}

// ── Tenant-Scoped RAG Copilot & Token Usage Telemetry ──────

export interface AiUsageRecord {
  tenantId: string;
  userId: string;
  task: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimateUsd: number;
  createdAt: string;
}

export interface AiTenantUsageResponse {
  tenantId: string;
  dayKey?: string;
  monthKey?: string;
  dailyTokensUsed: number;
  dailyTokenLimit: number;
  monthlyTokensUsed: number;
  monthlyTokenLimit: number;
  dailyCalls: number;
  monthlyCalls: number;
  estimatedCostUsd: number;
  recentRecords: AiUsageRecord[];
  workspaceAiBalance?: {
    maxMonthlyAiCalls: number;
    aiCallsUsed: number;
    aiBalanceRemaining: number;
    addonAiCalls: number;
    aiEnabled: boolean;
  };
}

export async function askAiCopilotChatApi(payload: {
  question: string;
  records?: unknown[];
}): Promise<{
  source: string;
  response: AiGatewayEnvelope<Record<string, unknown>> | null;
}> {
  const { data } = await apiClient.post('/ai-copilot/chat', payload);
  return data;
}

export async function fetchAiTenantUsageApi(): Promise<AiTenantUsageResponse> {
  const { data } = await apiClient.get<AiTenantUsageResponse>(
    '/ai-copilot/usage',
  );
  return data;
}

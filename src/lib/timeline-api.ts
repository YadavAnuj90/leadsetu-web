import { apiClient } from '@/lib/api-client';

export type TimelineEntityType = 'lead' | 'contact' | 'deal';

export type TimelineEventCategory =
  | 'whatsapp'
  | 'calls'
  | 'invoices'
  | 'tasks'
  | 'tickets'
  | 'deals'
  | 'notes';

export interface Timeline360Event {
  id: string;
  category: TimelineEventCategory;
  sourceModule:
    | 'lead'
    | 'contact'
    | 'deal'
    | 'inbox'
    | 'calls'
    | 'invoices'
    | 'tasks'
    | 'tickets';
  title: string;
  description: string;
  actorName: string;
  badgeText?: string;
  amountInr?: number;
  linkHref?: string;
  occurredAt: string;
}

export interface Customer360TimelineResponse {
  entityType: TimelineEntityType;
  entityId: string;
  customer: {
    name: string;
    company: string;
    phone: string;
    normalizedPhone: string;
    email: string;
    city: string;
  };
  linkedEntities: {
    leads: Array<{ id: string; name: string; status: string; source: string }>;
    contacts: Array<{ id: string; name: string; company: string; type: string }>;
    deals: Array<{ id: string; title: string; stage: string; value: number }>;
  };
  summary: {
    totalEvents: number;
    whatsappCount: number;
    callsCount: number;
    invoicesCount: number;
    tasksCount: number;
    ticketsCount: number;
    notesCount: number;
    totalInvoicedInr: number;
    totalPaidInr: number;
  };
  events: Timeline360Event[];
}

export async function fetchCustomer360TimelineApi(
  entityType: TimelineEntityType,
  entityId: string,
  category?: string,
): Promise<Customer360TimelineResponse> {
  const { data } = await apiClient.get<Customer360TimelineResponse>(
    `/timeline/${entityType}/${encodeURIComponent(entityId)}`,
    {
      params: category && category !== 'all' ? { category } : undefined,
    },
  );
  return data;
}

export async function addCustomer360TimelineNoteApi(
  entityType: TimelineEntityType,
  entityId: string,
  payload: { type?: 'note' | 'call' | 'whatsapp'; description: string },
): Promise<Customer360TimelineResponse> {
  const { data } = await apiClient.post<Customer360TimelineResponse>(
    `/timeline/${entityType}/${encodeURIComponent(entityId)}/note`,
    payload,
  );
  return data;
}

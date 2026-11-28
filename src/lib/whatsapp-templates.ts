export interface WhatsAppVariableMeta {
  key: string;
  token: string;
  label: string;
  example: string;
}

export const WHATSAPP_VARIABLE_LIST: WhatsAppVariableMeta[] = [
  { key: 'buyer_name', token: '{{buyer_name}}', label: 'Buyer Name', example: 'Rajesh Sharma' },
  { key: 'company', token: '{{company}}', label: 'Company Name', example: 'Apex Steel Pvt Ltd' },
  { key: 'deal_value', token: '{{deal_value}}', label: 'Deal / Est. Value', example: '₹2,50,000' },
  { key: 'city', token: '{{city}}', label: 'City', example: 'Mumbai' },
  { key: 'phone', token: '{{phone}}', label: 'Phone Number', example: '+91 98112 45678' },
  { key: 'agent_name', token: '{{agent_name}}', label: 'Your Name (Agent)', example: 'Anuj' },
  { key: 'quote_link', token: '{{quote_link}}', label: 'Quotation Link', example: 'https://leadsetu.in/quote/demo' },
  { key: 'call_link', token: '{{call_link}}', label: 'Click-to-Call Link', example: 'https://leadsetu.in/call/demo' },
];

export interface WhatsAppVariableContext {
  buyerName?: string;
  company?: string;
  dealValue?: number | string;
  city?: string;
  phone?: string;
  agentName?: string;
  quoteLink?: string;
  callLink?: string;
}

export function extractTemplateVariables(body: string): string[] {
  const seen = new Set<string>();
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body || '')) !== null) {
    seen.add(match[1].toLowerCase());
  }
  return Array.from(seen);
}

export function formatDealValueForTemplate(dealValue?: number | string): string {
  if (typeof dealValue === 'string') {
    const trimmed = dealValue.trim();
    if (!trimmed) return '';
    const num = Number(trimmed.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(num) && num > 0 && !trimmed.includes('₹')) {
      return `₹${Math.round(num).toLocaleString('en-IN')}`;
    }
    return trimmed;
  }
  if (typeof dealValue === 'number' && Number.isFinite(dealValue) && dealValue > 0) {
    return `₹${Math.round(dealValue).toLocaleString('en-IN')}`;
  }
  return '';
}

export function renderWhatsAppTemplate(
  body: string,
  ctx: WhatsAppVariableContext,
): string {
  const values: Record<string, string> = {
    buyer_name: String(ctx.buyerName || '').trim(),
    company: String(ctx.company || '').trim(),
    deal_value: formatDealValueForTemplate(ctx.dealValue),
    city: String(ctx.city || '').trim(),
    phone: String(ctx.phone || '').trim(),
    agent_name: String(ctx.agentName || '').trim(),
    quote_link: String(ctx.quoteLink || '').trim(),
    call_link: String(ctx.callLink || '').trim(),
  };

  return String(body || '').replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (full, key: string) => {
      const replacement = values[key.toLowerCase()];
      return replacement || full;
    },
  );
}

export function buildWhatsAppMeUrl(phone?: string, message?: string): string | null {
  const raw = String(phone || '').trim();
  if (!raw || raw.includes('*')) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const normalized =
    digits.length === 10
      ? `91${digits}`
      : digits.startsWith('0') && digits.length === 11
        ? `91${digits.slice(1)}`
        : digits;
  const base = `https://wa.me/${normalized}`;
  const cleanMsg = String(message || '').trim();
  return cleanMsg ? `${base}?text=${encodeURIComponent(cleanMsg)}` : base;
}

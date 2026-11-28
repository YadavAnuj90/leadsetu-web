import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'DPDP & Statutory Compliance | Leadsetu CRM',
  description:
    'How Leadsetu aligns with India DPDP Act 2023, GST Rule-46 invoicing, Meta WhatsApp Cloud opt-in standards, and webhook verification.',
};

export default function CompliancePage() {
  return (
    <LegalDocumentLayout
      activeHref="/compliance"
      badge="Statutory & Regulatory"
      title="DPDP Act 2023 & GST Compliance"
      subtitle="Built from the ground up for Indian B2B regulatory standards — spanning data privacy, Rule-46 GST invoicing, and Meta Business messaging compliance."
      sections={[
        {
          id: 'dpdp',
          title: 'Digital Personal Data Protection (DPDP) Act, 2023',
          body: [
            'Leadsetu implements purpose limitation, strict tenant isolation at the database layer, opt-out honoring, and auditable access logs aligned with India’s DPDP Act, 2023.',
          ],
          bullets: [
            'Consent & OTP Verification: Public Instant Forms support 4-digit WhatsApp OTP verification prior to CRM ingestion.',
            'Automated Opt-Out Enforcement: Buyer STOP / DND signals prevent future automated WhatsApp broadcasts or bot flows.',
            'Anti-Leak Phone Masking: Workspace Admins can restrict non-admin reps to masked phone digits (+91 ******1234).',
          ],
        },
        {
          id: 'gst-rule-46',
          title: 'CGST Rule-46 Invoicing & GSTR-1 Readiness',
          body: [
            'All Tax Invoices and Proforma Quotations calculate intra-state CGST + SGST vs. inter-state IGST automatically based on Place of Supply state codes, validate 15-digit buyer GSTINs, track HSN/SAC summaries, and export CA-ready GSTR-1 / Tally CSV ledgers.',
          ],
        },
        {
          id: 'webhooks',
          title: 'Meta Cloud, Razorpay & Webhook Compliance',
          body: [
            'Inbound webhooks enforce cryptographic payload verification — X-Hub-Signature-256 for Meta Cloud, X-Razorpay-Signature HMAC-SHA256 for payment auto-reconciliation, and HTTPS-only signed secrets for Universal Webhooks.',
          ],
        },
      ]}
    />
  );
}

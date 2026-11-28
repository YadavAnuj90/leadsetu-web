import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Leadsetu CRM',
  description:
    'Privacy Policy and DPDP Act 2023 data processing practices for Leadsetu Technologies (Anujali Technologies Pvt. Ltd.).',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      activeHref="/privacy-policy"
      badge="Legal & Privacy"
      title="Privacy Policy"
      subtitle="How Leadsetu Technologies (Anujali Technologies Pvt. Ltd.) collects, processes, protects, and retains business and customer data under India's Digital Personal Data Protection (DPDP) Act, 2023."
      sections={[
        {
          id: 'scope',
          title: 'Scope & Data Fiduciary Role',
          body: [
            'This Privacy Policy applies to all users, tenant workspaces, websites, APIs, and integrated messaging workflows operated under Leadsetu CRM ("Platform") by Anujali Technologies Pvt. Ltd., Noida, Uttar Pradesh, India.',
            'For CRM leads, contacts, invoices, and WhatsApp conversations uploaded or captured into a customer workspace, the subscribing business acts as the Data Fiduciary and Leadsetu acts strictly as a Data Processor following customer instructions.',
          ],
        },
        {
          id: 'data-collected',
          title: 'Information We Collect',
          body: [
            'We collect only information necessary to authenticate accounts, deliver WhatsApp & CRM automation, generate GST-compliant billing documents, and maintain security logs.',
          ],
          bullets: [
            'Workspace & Account Identity: Name, work email, +91 mobile number, company GSTIN, and billing address.',
            'CRM & Lead Records: Buyer inquiries, phone numbers, UTM campaign tags, quotation/invoice records, and SLA tickets submitted or synced by authorized workspace users.',
            'Integration Credentials: Encrypted tokens for Meta WhatsApp Cloud API, Meta Lead Ads, IndiaMART, Razorpay, and SMTP servers.',
            'Technical & Security Logs: IP addresses, session timestamps, and audit event records for fraud prevention and compliance.',
          ],
        },
        {
          id: 'usage',
          title: 'How We Use Information',
          body: [
            'Leadsetu never sells, rents, or shares your CRM contacts or buyer phone numbers with third-party data brokers or competing advertisers.',
          ],
          bullets: [
            'Delivering opted-in WhatsApp Cloud notifications, interactive bot flows, and appointment confirmations.',
            'Computing AI intent scores, smart Hinglish/English draft replies, and automated lead routing inside your isolated tenant.',
            'Processing Razorpay SaaS billing, generating SAC 998314 GST invoices, and verifying payment webhooks.',
          ],
        },
        {
          id: 'data-rights',
          title: 'Data Deletion, Opt-Out & DPDP Rights',
          body: [
            'Buyers can opt out of WhatsApp communications at any time by replying STOP, DND, or UNSUBSCRIBE, which immediately blocks automated outbound campaigns and bot replies.',
            'Workspace owners may export CRM records, request permanent workspace/data deletion, or contact our Grievance Officer regarding DPDP Act 2023 access/correction requests.',
          ],
          bullets: [
            'Grievance Officer Email: hello@leadsetu.in (Response SLA: within 48 business hours).',
            'Data Retention: Active workspace records persist while the subscription is active and are purged/anonymized within 30 days of verified deletion request unless statutory tax retention applies.',
          ],
        },
      ]}
    />
  );
}

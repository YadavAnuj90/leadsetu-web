import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Service Level Agreement (SLA) | Leadsetu CRM',
  description:
    'Platform availability commitments, scheduled maintenance windows, and priority workspace support SLAs for Leadsetu CRM.',
};

export default function SlaPolicyPage() {
  return (
    <LegalDocumentLayout
      activeHref="/sla"
      badge="Reliability & Support"
      title="Service Level Agreement (SLA)"
      subtitle="Our operational uptime standards, real-time webhook health monitoring, and HQ escalation commitments for paying Leadsetu workspaces."
      sections={[
        {
          id: 'uptime-target',
          title: '99.9% Monthly Availability Target',
          body: [
            'Leadsetu targets 99.9% monthly uptime across core REST APIs, real-time Inbox WebSockets, public booking pages (/book/[slug]), and public instant forms (/f/[slug]), continuously monitored via /v1/health database & memory probes.',
          ],
        },
        {
          id: 'support-response',
          title: 'Workspace Support & HQ Ticket Response SLAs',
          body: [
            'Every workspace includes direct access to HQ Support (/support-hq) inside the dashboard navbar as well as priority support escalation for billing or webhook outages.',
          ],
          bullets: [
            'Critical Outage / Payment Webhook Issue: First response within 2 business hours.',
            'High-Priority Workflow / WhatsApp Onboarding Help: First response within 6 business hours (09:30–19:30 IST).',
            'General Questions & Feature Requests: Within 24 business hours.',
          ],
        },
        {
          id: 'maintenance',
          title: 'Planned Maintenance & External APIs',
          body: [
            'Zero-downtime rolling updates are scheduled during low-traffic IST overnight windows. Availability commitments exclude upstream outages at third-party infrastructure providers (Meta Cloud Graph API, Razorpay, or IndiaMART servers).',
          ],
        },
      ]}
    />
  );
}

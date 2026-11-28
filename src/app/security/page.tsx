import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Security & Encryption | Leadsetu CRM',
  description:
    'Enterprise security architecture, AES-256-GCM credential encryption, RBAC, phone masking, and immutable audit trails in Leadsetu.',
};

export default function SecurityPolicyPage() {
  return (
    <LegalDocumentLayout
      activeHref="/security"
      badge="Security Architecture"
      title="Data Security & Access Governance"
      subtitle="Defense-in-depth infrastructure protecting workspace credentials, buyer PII, payment webhooks, and financial documents."
      sections={[
        {
          id: 'encryption',
          title: 'Transport & Credential Vault Encryption',
          body: [
            'All client-to-API and webhook communications run over TLS 1.2+/HTTPS. Sensitive integration secrets (Meta Page/Cloud tokens, Razorpay keys, SMTP passwords, IndiaMART CRM keys) are encrypted at rest before storage.',
          ],
        },
        {
          id: 'rbac',
          title: '5-Tier Role-Based Access Control (RBAC)',
          body: [
            'Every user is scoped strictly to their tenant workspace with granular permissions across Owner, Admin, Manager, Sales Agent, and Support Engineer roles.',
          ],
          bullets: [
            'Owner & Admin-only controls for billing, team removal, security toggles, and Meta/Razorpay configuration.',
            'Per-user feature toggles and owner-scoped Lead/Deal visibility to prevent cross-rep poaching.',
          ],
        },
        {
          id: 'phone-masking',
          title: 'Anti-Data-Leak Phone Masking',
          body: [
            'Admins can enable per-member phone masking inside Team Settings so sales reps work leads, inbox chats, and quotes without viewing or exporting raw buyer mobile numbers.',
          ],
        },
        {
          id: 'audit-trail',
          title: 'Immutable Security & Action Audit Trail',
          body: [
            'Sensitive operations — role changes, password resets, credit-hold overrides, Razorpay reconciliations, bot flow updates, and webhook secret rotations — are logged with actor identity, entity ID, and UTC timestamp in Settings → Audit.',
          ],
        },
      ]}
    />
  );
}

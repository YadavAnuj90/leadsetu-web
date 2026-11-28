import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | Leadsetu CRM',
  description:
    'Authorized Terms of Service governing Leadsetu CRM SaaS subscriptions, WhatsApp Cloud API usage, and GST billing.',
};

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout
      activeHref="/terms"
      badge="Legal Agreement"
      title="Terms of Service"
      subtitle="Governing terms for businesses and authorized representatives using Leadsetu CRM, WhatsApp Cloud integrations, and billing automation provided by Anujali Technologies Pvt. Ltd."
      sections={[
        {
          id: 'eligibility',
          title: 'Account Authorization & Workspace Access',
          body: [
            'By registering a Leadsetu workspace, you represent that you are authorized to act on behalf of your business entity and agree to maintain accurate GSTIN, company, and billing records.',
            'Each tenant organization is responsible for user roles (Owner, Admin, Manager, Sales, Support), API keys, and webhook secrets configured inside its workspace.',
          ],
        },
        {
          id: 'whatsapp-acceptable-use',
          title: 'WhatsApp Cloud & Anti-Spam Compliance',
          body: [
            'All outbound WhatsApp Business API templates, broadcasts, and automated bot workflows must comply strictly with Meta WhatsApp Business Messaging Policies and applicable Indian telecom / TRAI guidelines.',
          ],
          bullets: [
            'Subscribers must obtain verifiable buyer opt-in prior to sending promotional templates.',
            'Leadsetu strictly enforces STOP / DND opt-out keywords; bypassing opt-out controls is prohibited and may result in immediate workspace suspension.',
            'Harassment, fraudulent invoicing, phishing payment links, or unauthorized data scraping are strictly forbidden.',
          ],
        },
        {
          id: 'billing-taxes',
          title: 'Subscriptions, GST & Usage Quotas',
          body: [
            'Paid plans (Starter, Growth, Enterprise) and add-on packs are billed in INR plus applicable 18% GST under SAC 998314. Tax invoices and credit notes are issued directly inside Workspace Settings → Billing.',
          ],
          bullets: [
            'Meta WhatsApp conversation fees or Razorpay transaction fees charged by respective providers remain governed by your direct provider agreement where applicable.',
            'Overdue invoices beyond grace windows may temporarily restrict automated outbound dispatches until settled.',
          ],
        },
        {
          id: 'governing-law',
          title: 'Limitation of Liability & Governing Law',
          body: [
            'These Terms are governed by the laws of India. Any disputes arising out of or relating to the Platform shall be subject to the exclusive jurisdiction of courts in Gautam Buddha Nagar (Noida), Uttar Pradesh / New Delhi, India.',
          ],
        },
      ]}
    />
  );
}

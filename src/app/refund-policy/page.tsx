import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Leadsetu CRM',
  description:
    'Transparent SaaS subscription cancellation, 14-day trial terms, and GST Credit Note refund policy for Leadsetu CRM.',
};

export default function RefundPolicyPage() {
  return (
    <LegalDocumentLayout
      activeHref="/refund-policy"
      badge="Billing & Refunds"
      title="Refund & Cancellation Policy"
      subtitle="Clear subscription cancellation, 14-day trial, and GST-compliant refund procedures for Leadsetu CRM plans and wallet top-ups."
      sections={[
        {
          id: 'trial-cancellation',
          title: '14-Day Free Trial & 1-Click Cancellation',
          body: [
            'New workspaces start with a 14-day evaluation trial without mandatory upfront credit card lock-in. Subscriptions can be cancelled directly anytime from Settings → Billing with zero cancellation penalty.',
            'When auto-renewal is cancelled before the next billing cycle date, you retain full access until the end of your already paid billing period.',
          ],
        },
        {
          id: 'refund-eligibility',
          title: 'Subscription Refund Eligibility',
          body: [
            'If a workspace experiences verified duplicate charges, erroneous auto-renewal within 7 days of charge, or unresolved platform downtime violating our SLA, a full or pro-rata refund request may be submitted directly from Settings → Billing.',
          ],
          bullets: [
            'Duplicate Billing / Technical Overcharge: 100% refund issued to original Razorpay payment method.',
            'Annual Plan Early Cancellation: Requests raised within 7 calendar days of initial purchase are eligible for full refund less consumed third-party gateway fees.',
            'Consumed Usage Packs (WhatsApp Call Wallet / Meta Conversation Credits): Non-refundable once consumed, unless caused by a verified platform fault.',
          ],
        },
        {
          id: 'processing-gst',
          title: 'Settlement Timeline & GST Credit Notes',
          body: [
            'Approved refunds are processed within 5–7 business days back to the original UPI, Card, or NetBanking instrument via Razorpay, accompanied by an automated GST Credit Note adjusting IGST/CGST/SGST liabilities accurately.',
          ],
        },
      ]}
    />
  );
}

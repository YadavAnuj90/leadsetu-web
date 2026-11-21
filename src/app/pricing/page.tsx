import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Pricing from '@/components/landing/Pricing';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Pricing & Plans | Leadsetu CRM',
  description:
    'Transparent INR SaaS plans for Indian B2B sales teams. Compare Starter, Growth, and Enterprise features, AI & WhatsApp quotas, 18% GST ITC invoices, and FAQs.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen font-sans antialiased bg-white dark:bg-[#070D19]">
      <Navbar />
      <Pricing />
      <CTABanner />
      <Footer />
    </main>
  );
}

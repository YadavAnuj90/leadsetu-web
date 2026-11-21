import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen font-sans antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTABanner />
      <Footer />
    </main>
  );
}

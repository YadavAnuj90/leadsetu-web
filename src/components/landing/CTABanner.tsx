import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, PhoneCall } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="relative overflow-hidden py-14 md:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-[#070D19] transition-colors duration-200">
      {/* Subtle dark bottom bridge in dark mode so the transition into the footer is seamless */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden dark:block absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #091224 100%)',
        }}
      />

      <div
        className="max-w-7xl mx-auto rounded-[2rem] relative overflow-hidden px-6 py-14 sm:px-12 sm:py-16 text-center shadow-2xl shadow-[#0057FF]/10 border border-white/15 bg-grid-dark"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(57, 120, 234, 0.32), transparent), linear-gradient(155deg, #0A1324 0%, #152544 58%, #0C182E 100%)',
        }}
      >
        {/* Ambient Glows */}
        <div
          className="pointer-events-none absolute -top-24 left-1/3 w-96 h-96 rounded-full opacity-25 blur-3xl"
          style={{ background: '#3978EA' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: '#38BDF8' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 border bg-[#0057FF]/20 border-sky-400/35 text-sky-300">
            <Sparkles className="w-3.5 h-3.5" /> Launch Your Revenue OS in 10 Minutes
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-5 tracking-tight leading-tight">
            Capture Leads. Close on WhatsApp.{' '}
            <span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
              Collect GST Paid Automatically.
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg mb-9 max-w-2xl mx-auto leading-relaxed">
            Go live with OTP Instant Forms, Multi-Step WhatsApp Bot Flows, Meta CAPI attribution,
            and 18% GST billing with Razorpay &amp; UPI auto-reconciliation — free for 14 days.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-extrabold text-white text-sm sm:text-base bg-gradient-to-r from-[#0057FF] to-[#2563EB] hover:from-[#0046D5] hover:to-[#1D4ED8] shadow-lg shadow-[#0057FF]/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/company/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-white text-sm sm:text-base border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] transition-all"
            >
              <PhoneCall className="w-4 h-4 text-sky-300" />
              <span>Book Live Walkthrough</span>
            </Link>
          </div>

          <div className="mt-8 pt-7 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14-day full-feature trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> WhatsApp Cloud &amp; UPI QR ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cancel anytime in 1 click
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

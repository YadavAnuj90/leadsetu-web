import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, PhoneCall } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-7xl mx-auto rounded-[2rem] relative overflow-hidden px-6 py-16 sm:px-12 sm:py-20 text-center shadow-navy-xl border border-white/10 bg-grid-dark"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(57, 120, 234, 0.35), transparent), linear-gradient(155deg, #0B1320 0%, #17243A 60%, #0E1B2E 100%)',
        }}
      >
        {/* Ambient Glows */}
        <div
          className="pointer-events-none absolute -top-24 left-1/3 w-96 h-96 rounded-full opacity-25 blur-3xl"
          style={{ background: '#3978EA' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: '#68A0FF' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border"
            style={{
              background: 'rgba(57, 120, 234, 0.2)',
              borderColor: 'rgba(104, 160, 255, 0.35)',
              color: '#93C5FD',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Start Closing More Deals Today
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            Ready to Bridge Every Lead{' '}
            <span className="text-gradient-brand">to Revenue?</span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 500+ fast-growing Delhi-NCR businesses. Launch your AI-powered WhatsApp &amp;
            sales pipeline in under 15 minutes — completely free for 14 days.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary-brand group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base border border-white/20 bg-white/5 hover:bg-white/10 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-brand-sky" />
              <span>Schedule Live 1-on-1 Demo</span>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free 14-day trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free white-glove onboarding
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

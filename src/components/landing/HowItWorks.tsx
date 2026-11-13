import Link from 'next/link';
import {
  Share2,
  BrainCircuit,
  Rocket,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    badge: 'Takes 5 Minutes',
    title: 'Connect Your Lead Channels',
    description:
      'Link your WhatsApp Business number, IndiaMART, Meta Ads, and website forms with one click. Every inquiry flows into one clean workspace.',
    icon: Share2,
    preview: {
      label: 'Auto-Captured Sources',
      items: ['WhatsApp Business (+91)', 'IndiaMART & Justdial', 'Facebook & Instagram Ads'],
    },
  },
  {
    step: '02',
    badge: 'Instant AI Action',
    title: 'Gemini AI Replies & Scores 1–100',
    description:
      'Within 15 seconds, our AI greets the buyer on WhatsApp, asks qualifying questions in Hinglish or English, and assigns a priority score.',
    icon: BrainCircuit,
    preview: {
      label: 'Live AI Intelligence',
      items: ['Score 92/100 · Hot Buyer', 'Budget & Quantity Extracted', 'Assigned to Senior Closer'],
    },
  },
  {
    step: '03',
    badge: '3.2x More Conversions',
    title: 'Nurture, Quote & Close Deals',
    description:
      'Automated follow-up nudges, instant GST proforma quotes, and Razorpay links help your team close deals before competitors even call back.',
    icon: Rocket,
    preview: {
      label: 'Revenue Outcome',
      items: ['1-Click GST Quotation PDF', 'Automated Follow-up Cadence', 'Real-Time Collection Tracking'],
    },
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 relative overflow-hidden bg-dots-light bg-[#F8FAFF] dark:bg-[#0B1320] transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border bg-brand-light dark:bg-brand-blue/15 text-brand-blue dark:text-brand-sky border-brand-blue/25">
            <Clock className="w-3.5 h-3.5" /> Fast 15-Minute Onboarding
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 tracking-tight text-brand-navy dark:text-white">
            From first inquiry to payment —{' '}
            <span className="text-gradient-navy">on autopilot</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            No IT team or complex coding required. Set up your entire sales engine during a single
            chai break.
          </p>
        </div>

        {/* 3-Step Cards with Connecting Line */}
        <div className="relative">
          {/* Desktop Connector Line */}
          <div
            className="hidden lg:block absolute top-24 left-[16%] right-[16%] h-0.5"
            style={{
              background:
                'linear-gradient(90deg, rgba(57,120,234,0.15) 0%, rgba(57,120,234,0.6) 50%, rgba(57,120,234,0.15) 100%)',
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative bg-white dark:bg-[#0F172A] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-brand-lg hover:border-brand-blue/50 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Step Icon & Badge */}
                    <div className="flex items-center justify-between mb-7">
                      <div className="relative">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #17243A 0%, #243B61 100%)',
                          }}
                        >
                          <Icon className="w-7 h-7 text-brand-sky" />
                        </div>
                        <span
                          className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow ring-4 ring-white dark:ring-slate-900"
                          style={{ background: '#3978EA' }}
                        >
                          {s.step}
                        </span>
                      </div>

                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-light dark:bg-brand-blue/20 text-brand-blue dark:text-brand-sky">
                        {s.badge}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-xl mb-3 tracking-tight text-brand-navy dark:text-white">
                      {s.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      {s.description}
                    </p>
                  </div>

                  {/* Mini Visual Checklist Box */}
                  <div className="rounded-2xl p-4 border border-slate-100 dark:border-slate-800 bg-[#F8FAFF] dark:bg-[#0B1320]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      {s.preview.label}
                    </div>
                    <div className="space-y-2">
                      {s.preview.items.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-xs font-semibold text-brand-navy dark:text-slate-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Before vs After Comparison Strip */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Way */}
          <div className="rounded-3xl p-7 border border-rose-200/70 dark:border-rose-900/50 bg-white/90 dark:bg-[#0F172A]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-4">
              <XCircle className="w-4 h-4" /> Without Leadsetu (The Old Way)
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Leads scattered across Excel sheets, IndiaMART emails &amp; personal phones</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>4+ hour response delay — hot buyers already buy from a competitor</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Zero visibility into whether sales reps actually followed up</span>
              </li>
            </ul>
          </div>

          {/* Leadsetu Way */}
          <div
            className="rounded-3xl p-7 border border-brand-blue/30 text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, #17243A 0%, #1E3358 100%)' }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
              style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}
            >
              <CheckCircle2 className="w-4 h-4" /> With Leadsetu AI CRM
            </div>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>100% leads auto-captured &amp; scored by Gemini AI in real time</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Instant 15-second WhatsApp reply with catalogue &amp; GST quotation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Complete pipeline &amp; revenue forecast on your phone and laptop</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14">
          <Link
            href="/register"
            className="btn-primary-brand inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:-translate-y-0.5"
          >
            <span>Start Your Free 14-Day Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

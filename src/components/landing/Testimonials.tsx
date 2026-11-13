import { Star, Quote, CheckCircle2, TrendingUp, Building2 } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajesh Sharma',
    role: 'Managing Director, RS Electricals',
    location: 'Karol Bagh, New Delhi',
    industry: 'B2B Wholesale & Distribution',
    impact: '+42% Revenue in 90 Days',
    avatar: 'RS',
    avatarColor: '#3978EA',
    quote:
      'Leadsetu ne hamara IndiaMART aur WhatsApp lead response time 4 ghante se 30 seconds kar diya. Clients get instant GST quotations on WhatsApp, and our monthly conversions jumped 42% in one quarter.',
    rating: 5,
  },
  {
    name: 'Priya Mehta',
    role: 'Founder, PM Luxury Realty',
    location: 'Sector 62, Noida',
    industry: 'Real Estate & Commercial',
    impact: '3.4x More Site Visits',
    avatar: 'PM',
    avatarColor: '#8B5CF6',
    quote:
      'We used to juggle Excel sheets, Meta Lead Ads, and 8 brokers on personal WhatsApp. Leadsetu replaced all of them. The Gemini AI lead score accurately flags which property buyers have ready budgets.',
    rating: 5,
  },
  {
    name: 'Amit Gupta',
    role: 'CEO, ScaleUp Digital & Exports',
    location: 'Cyber City, Gurugram',
    industry: 'B2B Services & Exports',
    impact: '12+ Hours Saved Weekly',
    avatar: 'AG',
    avatarColor: '#0D9488',
    quote:
      'Managing 18 sales reps across Gurugram and Okhla used to be chaos. Now every lead is auto-assigned by territory, and the CEO dashboard shows exact ROI per ad rupee spent. Best software investment we made.',
    rating: 5,
  },
];

const sectors = [
  'Manufacturing & Industrial (Okhla, Bawana, Faridabad)',
  'Real Estate & Interiors (Noida, Gurugram, Dwarka)',
  'Wholesale & Trading (Karol Bagh, Chandni Chowk)',
  'Healthcare, Clinics & EdTech',
  'Solar, EV & Infrastructure Agencies',
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 md:py-32 relative overflow-hidden bg-[#F8FAFF] dark:bg-[#0B1320] transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border bg-brand-light dark:bg-brand-blue/15 text-brand-blue dark:text-brand-sky border-brand-blue/25">
            <Star className="w-3.5 h-3.5 fill-brand-blue text-brand-blue" /> Customer Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-brand-navy dark:text-white">
            Trusted by 500+ leaders across{' '}
            <span className="text-gradient-navy">Delhi-NCR &amp; India</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
            See how high-growth Indian founders and sales directors transformed their revenue
            pipelines with Leadsetu.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group bg-white dark:bg-[#0F172A] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-brand-lg hover:border-brand-blue/50 transition-all duration-300 flex flex-col justify-between relative"
            >
              <div>
                {/* Top Row: Stars + Impact Metric Pill */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
                  >
                    <TrendingUp className="w-3 h-3" /> {t.impact}
                  </span>
                </div>

                {/* Quote Text */}
                <div className="relative mb-7">
                  <Quote className="w-8 h-8 text-brand-light dark:text-slate-800 absolute -top-2 -left-1 -z-0 opacity-80" />
                  <p className="relative z-10 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author Footer */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm shadow-sm"
                    style={{ background: t.avatarColor }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-brand-navy dark:text-white">
                        {t.name}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.role}</div>
                    <div className="text-[11px] text-slate-400">{t.location}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Industry Pills Bar */}
        <div className="mt-14 pt-10 border-t border-slate-200/70 dark:border-slate-800 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            <Building2 className="w-3.5 h-3.5 text-brand-blue" /> Built for High-Growth Indian Industries
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {sectors.map((sector) => (
              <span
                key={sector}
                className="text-xs font-semibold px-4 py-2 rounded-full bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';
import CompanySubnav from '@/components/company/CompanySubnav';

export default function ContactOfficesPage() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Enterprise Demo & Migration');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <main className="min-h-screen font-sans antialiased bg-white dark:bg-[#070D19]">
      <Navbar />

      {/* ─── Hero Header ──────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden border-b border-slate-200/70 dark:border-slate-800">
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[440px] dark:opacity-35"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 87, 255, 0.14) 0%, transparent 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <CompanySubnav />

          <div className="block">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-blue-50/90 dark:bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-300 border-[#0057FF]/25">
              <MapPin className="w-3.5 h-3.5" /> Contact &amp; Corporate Offices
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-3xl mx-auto">
            Talk directly with our{' '}
            <span className="bg-gradient-to-r from-[#0057FF] to-[#2563EB] dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              Delhi-NCR team.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you need an enterprise rollout across 50+ reps, Tally/ERP integration, or a
            live WhatsApp Cloud walkthrough, our specialists reply within 2 business hours.
          </p>
        </div>
      </section>

      {/* ─── Offices & Direct Inquiry Grid ────────────────────────────── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Office & SLA Cards */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-3xl p-7 bg-[#FAFCFF] dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
                <MapPin className="w-4 h-4" /> Noida Headquarters
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Product, AI &amp; Engineering Hub
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tower B, 7th Floor, Sector 62, Noida Electronic City, Uttar Pradesh – 201309, India
              </p>
            </div>

            <div className="rounded-3xl p-7 bg-[#FAFCFF] dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
                <Building2 className="w-4 h-4" /> New Delhi Desk
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Executive, Sales &amp; GST Advisory Desk
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Connaught Place, New Delhi – 110001, India · Anujali Technologies Pvt. Ltd.
              </p>
            </div>

            <div className="rounded-3xl p-7 bg-[#0D1628] text-white border border-white/10 shadow-xl space-y-3.5 text-xs">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
                Direct Channels
              </div>
              <a
                href="tel:+918851520832"
                className="flex items-center gap-2.5 text-sm font-bold text-white hover:text-sky-300 transition-colors"
              >
                <Phone className="w-4 h-4 text-sky-400" />
                <span>+91 8851520832 (Mon–Sat, 9 AM – 8 PM IST)</span>
              </a>
              <a
                href="mailto:hello@leadsetu.in"
                className="flex items-center gap-2.5 text-sm font-bold text-white hover:text-sky-300 transition-colors"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span>hello@leadsetu.in</span>
              </a>
              <a
                href="mailto:billing@leadsetu.in"
                className="flex items-center gap-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>billing@leadsetu.in (GST &amp; Procurement)</span>
              </a>
              <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-emerald-300 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Average enterprise response time: under 2 business hours</span>
              </div>
            </div>
          </div>

          {/* Right Contact Inquiry Card */}
          <div className="lg:col-span-7 rounded-[32px] p-7 sm:p-9 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-lg">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-1">
                <MessageSquare className="w-3.5 h-3.5" /> Send a Message
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Request an Executive Walkthrough
              </h2>
            </div>

            {submitted ? (
              <div className="rounded-2xl p-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Thank you! Your inquiry is logged with Leadsetu Delhi-NCR HQ.</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Our team will reach out shortly, or call +91 8851520832 for immediate onboarding help.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-extrabold underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rajesh Sharma"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="RS Electricals Pvt. Ltd."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.in"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-[#0057FF]"
                  >
                    <option>Enterprise Demo &amp; Migration</option>
                    <option>WhatsApp Cloud &amp; IndiaMART Setup</option>
                    <option>Custom ERP / Tally Integration</option>
                    <option>Partnership &amp; Channel Program</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    How can we help?
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your team size, current workflow, or questions..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0057FF] to-[#2563EB] hover:from-[#0046D5] hover:to-[#1D4ED8] text-white font-extrabold text-sm shadow-lg shadow-[#0057FF]/25 inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message to Leadsetu HQ</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <CTABanner />
      <Footer />
    </main>
  );
}

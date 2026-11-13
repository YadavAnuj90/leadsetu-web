'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function BillingSettingsPage() {
  const router = useRouter();
  const { tenant } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue mb-1">
              <Sparkles className="w-3.5 h-3.5" /> 14-Day Free Trial Active
            </div>
            <h1 className="text-2xl font-extrabold text-brand-navy capitalize">
              {tenant?.plan || 'Growth'} Plan Subscription
            </h1>
            <p className="text-xs text-slate-500">
              ₹2,399 / month (Annual billing · 18% GST Input Tax Credit eligible)
            </p>
          </div>
          <CreditCard className="w-8 h-8 text-brand-blue" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {[
            'Up to 12 Team Members Included',
            'Unlimited Gemini AI Lead Scoring',
            'Official WhatsApp Cloud API Sync',
          ].map((item) => (
            <div
              key={item}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 font-semibold text-brand-navy"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

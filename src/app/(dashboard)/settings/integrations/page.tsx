'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, PlugZap, CheckCircle2 } from 'lucide-react';

const connectors = [
  { name: 'WhatsApp Business Cloud API', status: 'Connected', desc: 'Official Meta API · Auto-Replies Active' },
  { name: 'IndiaMART Lead Manager', status: 'Connected', desc: 'Real-time B2B buyer webhook sync' },
  { name: 'Meta Lead Ads (FB & Instagram)', status: 'Connected', desc: 'Instant ad form lead capture' },
  { name: 'Razorpay Payment Links', status: 'Ready', desc: 'Send 1-click UPI & card links in chat' },
  { name: 'Tally Prime GST Sync', status: 'Ready', desc: 'Export GST tax invoices automatically' },
];

export default function IntegrationsSettingsPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">
          Connected Integrations
        </h1>
        <p className="text-xs text-slate-500">
          Manage your native Indian SME lead channels and billing connectors.
        </p>
      </div>

      <div className="space-y-3">
        {connectors.map((c) => (
          <div
            key={c.name}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-blue flex items-center justify-center">
                <PlugZap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-brand-navy">{c.name}</div>
                <div className="text-xs text-slate-500">{c.desc}</div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import InstantFormRenderer from '@/components/lead-forms/InstantFormRenderer';
import { fetchPublicLeadFormApi } from '@/lib/lead-forms-api';
import { getMockFormBySlug, type LeadFormConfig } from '@/lib/lead-forms-mock';

function PublicInstantFormInner() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = String(params?.slug || 'industrial-stabilizer-quote');
  const isEmbed = searchParams?.get('embed') === '1';

  const [form, setForm] = useState<LeadFormConfig>(() => getMockFormBySlug(slug));
  const [publicContext, setPublicContext] = useState<{
    bookingSlug?: string;
    whatsappNumber?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicLeadFormApi(slug, true)
      .then((res) => {
        if (!active) return;
        if (res?.form) {
          setForm(res.form);
        }
        if (res?.publicContext) {
          setPublicContext(res.publicContext);
        }
      })
      .catch(() => {
        // Fallback cleanly to local template when API unavailable
        if (active) setForm(getMockFormBySlug(slug));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (isEmbed) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-2">
        <div
          className="w-full max-w-md rounded-3xl shadow-xl border border-slate-200/80 p-6"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading Form...</span>
            </div>
          ) : (
            <InstantFormRenderer
              form={form}
              mode="public"
              publicContext={publicContext}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center px-4 py-8 sm:py-12"
      style={{ backgroundColor: '#F8FAFF', color: '#0F172A' }}
    >
      {/* Subtle Brand Ambient Blobs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: form.brandColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: form.brandColor }}
      />

      {/* Centered Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading Instant Form...</span>
          </div>
        ) : (
          <InstantFormRenderer
            form={form}
            mode="public"
            publicContext={publicContext}
          />
        )}
      </div>

      {/* Trust & Leadsetu Attribution Footer */}
      <div className="relative z-10 mt-5 text-center space-y-1.5">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Your details are shared only with{' '}
            <strong className="text-slate-700">{form.companyName}</strong>
          </span>
        </p>
        <div className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Instant Forms by Leadsetu AI CRM</span>
        </div>
      </div>
    </div>
  );
}

export default function PublicInstantFormPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-500"
          style={{ backgroundColor: '#F8FAFF' }}
        >
          Loading Instant Form...
        </div>
      }
    >
      <PublicInstantFormInner />
    </Suspense>
  );
}

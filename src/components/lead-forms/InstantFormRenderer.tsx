'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Download,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  requestPublicFormOtpApi,
  submitPublicLeadFormApi,
  trackPublicFormStartApi,
  verifyPublicFormOtpApi,
} from '@/lib/lead-forms-api';
import { getErrorMessage } from '@/lib/api-client';
import type { LeadFormConfig } from '@/lib/lead-forms-mock';

interface InstantFormRendererProps {
  form: LeadFormConfig;
  mode: 'preview' | 'public';
  activeStep?: number;
  onStepChange?: (stepIndex: number) => void;
  publicContext?: {
    bookingSlug?: string;
    whatsappNumber?: string;
  };
}

export default function InstantFormRenderer({
  form,
  mode,
  activeStep,
  onStepChange,
  publicContext,
}: InstantFormRendererProps) {
  const [internalStep, setInternalStep] = useState(0);
  const [chipValues, setChipValues] = useState<Record<string, string>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    bookingSlug?: string;
    whatsappNumber?: string;
    brochureUrl?: string;
  } | null>(null);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const startedSentRef = useRef(false);
  const otpRequestedRef = useRef(false);

  const stepsCount = Math.max(1, form.steps.length);
  const otpStepIndex = form.requireWhatsappOtp ? stepsCount + 1 : -1;
  const thankYouIndex = form.requireWhatsappOtp ? stepsCount + 2 : stepsCount + 1;
  const totalScreens = thankYouIndex + 1;

  const currentStep = Math.min(
    totalScreens - 1,
    Math.max(0, activeStep !== undefined ? activeStep : internalStep),
  );

  // Build collected answers map (combining chip defaults/selections & text/select inputs)
  const buildAllAnswers = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const step of form.steps) {
      for (const field of step.fields) {
        if (field.type === 'chips') {
          out[field.key] = chipValues[field.key] || field.options?.[0] || '';
        } else if (field.type === 'select') {
          out[field.key] = textValues[field.key] ?? field.options?.[0] ?? '';
        } else {
          out[field.key] = (textValues[field.key] || '').trim();
        }
      }
    }
    return out;
  };

  const getPhoneValue = (): string => {
    for (const step of form.steps) {
      for (const field of step.fields) {
        if (field.type === 'phone' || field.key.toLowerCase().includes('phone')) {
          const val = (textValues[field.key] || '').trim();
          if (val) return val;
        }
      }
    }
    return (textValues.phone || textValues.mobile || '').trim();
  };

  const getNameValue = (): string => {
    return (
      textValues.full_name ||
      textValues.name ||
      Object.entries(textValues).find(([k]) => k.toLowerCase().includes('name'))?.[1] ||
      ''
    ).trim();
  };

  const goTo = (next: number) => {
    setStepError(null);
    const clamped = Math.min(totalScreens - 1, Math.max(0, next));
    if (activeStep === undefined) {
      setInternalStep(clamped);
    }
    onStepChange?.(clamped);
  };

  const triggerOtpSend = async () => {
    if (mode !== 'public') return;
    const phone = getPhoneValue();
    if (phone.replace(/\D/g, '').length < 10) return;

    setOtpLoading(true);
    setStepError(null);
    try {
      const res = await requestPublicFormOtpApi(form.slug, {
        phone,
        name: getNameValue() || undefined,
      });
      if (res.demoOtpHint) {
        setOtpHint(res.demoOtpHint);
        setOtpDigits(res.demoOtpHint.split('').slice(0, 4));
      } else {
        setOtpHint(null);
      }
    } catch (err) {
      setStepError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    if (
      mode === 'public' &&
      form.requireWhatsappOtp &&
      currentStep === otpStepIndex &&
      !otpRequestedRef.current
    ) {
      otpRequestedRef.current = true;
      void triggerOtpSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, otpStepIndex, mode, form.requireWhatsappOtp]);

  const progressPct = useMemo(() => {
    if (totalScreens <= 1) return 100;
    return Math.round(((currentStep + 1) / totalScreens) * 100);
  }, [currentStep, totalScreens]);

  const phonePreview = useMemo(() => {
    const raw = getPhoneValue() || '98112 45678';
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `+91 ${digits.slice(0, 2)}XXXXXX${digits.slice(-2)}`;
    }
    return '+91 98XXXXXX10';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textValues]);

  const isCompact = mode === 'preview';

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 3) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const validateCurrentStep = (stepNum: number): string | null => {
    if (mode !== 'public') return null;
    const stepDef = form.steps[stepNum - 1];
    if (!stepDef) return null;

    for (const field of stepDef.fields) {
      if (field.type === 'chips') continue;
      if (field.type === 'select') continue;
      const val = (textValues[field.key] || '').trim();
      if (field.required && !val) {
        return `Please enter "${field.label}" to continue.`;
      }
      if (field.type === 'phone' && val) {
        const digits = val.replace(/\D/g, '');
        if (digits.length < 10) {
          return 'Please enter a valid 10-digit WhatsApp mobile number.';
        }
      }
      if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        return 'Please enter a valid email address.';
      }
    }
    return null;
  };

  const readUtmAndSubmit = async (enteredOtp?: string) => {
    if (mode !== 'public') {
      goTo(thankYouIndex);
      return;
    }

    setSubmitting(true);
    setStepError(null);
    try {
      const search =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null;
      const res = await submitPublicLeadFormApi(form.slug, {
        answers: buildAllAnswers(),
        ...(enteredOtp ? { otpCode: enteredOtp } : {}),
        utmSource: search?.get('utm_source') || undefined,
        utmMedium: search?.get('utm_medium') || undefined,
        utmCampaign: search?.get('utm_campaign') || undefined,
        referrer:
          typeof document !== 'undefined' ? document.referrer : undefined,
        _hp: honeypot || undefined,
      });
      setSubmittedResult({
        bookingSlug: res.bookingSlug,
        whatsappNumber: res.whatsappNumber,
        brochureUrl: res.brochureUrl,
      });
      goTo(thankYouIndex);
    } catch (err) {
      setStepError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartClick = () => {
    if (mode === 'public' && !startedSentRef.current) {
      startedSentRef.current = true;
      void trackPublicFormStartApi(form.slug).catch(() => {});
    }
    goTo(1);
  };

  const handleContinueStep = async () => {
    const err = validateCurrentStep(currentStep);
    if (err) {
      setStepError(err);
      return;
    }
    if (currentStep === stepsCount && !form.requireWhatsappOtp) {
      await readUtmAndSubmit();
      return;
    }
    goTo(currentStep + 1);
  };

  const handleVerifyAndSubmitOtp = async () => {
    const entered = otpDigits.join('').trim();
    if (mode !== 'public') {
      goTo(thankYouIndex);
      return;
    }
    if (entered.length < 4) {
      setStepError('Please enter the 4-digit WhatsApp verification code.');
      return;
    }
    setSubmitting(true);
    setStepError(null);
    try {
      await verifyPublicFormOtpApi(form.slug, {
        phone: getPhoneValue(),
        code: entered,
      });
      await readUtmAndSubmit(entered);
    } catch (err) {
      setStepError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  // Resolved Thank-You links
  const resolvedBookingSlug =
    submittedResult?.bookingSlug || publicContext?.bookingSlug || 'book-demo';
  const rawWaNumber =
    submittedResult?.whatsappNumber ||
    publicContext?.whatsappNumber ||
    '919811245678';
  const waDigits = rawWaNumber.replace(/\D/g, '');
  const waLinkDigits =
    waDigits.length === 10 ? `91${waDigits}` : waDigits || '919811245678';
  const waPreText = encodeURIComponent(
    `Hi ${form.companyName}, I just submitted "${form.title}" (${getNameValue() || 'Buyer'}). Please share quotation details.`,
  );
  const waUrl = `https://wa.me/${waLinkDigits}?text=${waPreText}`;
  const brochureHref =
    submittedResult?.brochureUrl ||
    form.thankYou.brochureUrl ||
    'https://leadsetu.app';

  return (
    <div
      className={`light-preview-canvas flex flex-col justify-between h-full ${
        isCompact ? 'p-4' : 'p-0'
      }`}
      style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
    >
      {/* Hidden Spam Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
      />

      {/* Top Progress Header */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B]">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: form.brandColor }}
            />
            <span>
              {currentStep === 0
                ? 'Overview'
                : currentStep === thankYouIndex
                  ? 'Completed'
                  : currentStep === otpStepIndex
                    ? 'WhatsApp Verification'
                    : `Step ${currentStep} of ${stepsCount}`}
            </span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              backgroundColor: form.brandColor,
            }}
          />
        </div>
      </div>

      {/* Inline Validation / Server Error */}
      {stepError && (
        <div className="mb-3 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-bold flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Main Screen Area */}
      <div className="flex-1 flex flex-col justify-between min-h-0">
        {/* Screen 0: Intro Card */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
                  style={{ backgroundColor: form.brandColor }}
                >
                  {(form.logoText || 'LS').slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#0F172A] truncate">
                    {form.companyName || 'Leadsetu Partner'}
                  </p>
                  <p className="text-[10.5px] font-semibold text-[#64748B]">
                    Verified Business Inquiry
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-[10px] font-extrabold shrink-0">
                <Zap className="w-3 h-3" />
                &lt;10s reply
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <h2
                className={`${
                  isCompact ? 'text-base' : 'text-xl sm:text-2xl'
                } font-extrabold text-[#0F172A] leading-snug tracking-tight`}
              >
                {form.headline || 'Get Your Instant Quotation'}
              </h2>
              <p className="text-xs text-[#475569] leading-relaxed">
                {form.subheadline ||
                  'Answer 2 quick steps to receive customized factory pricing on WhatsApp.'}
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              {(form.trustBullets || []).filter(Boolean).map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: form.brandColor }}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <span className="text-xs font-semibold text-[#334155] leading-snug">
                    {bullet}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStartClick}
              className="w-full h-11 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition cursor-pointer"
              style={{ backgroundColor: form.brandColor }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Screens 1..N: Dynamic Step Fields */}
        {currentStep >= 1 && currentStep <= stepsCount && (
          <div className="flex flex-col justify-between h-full space-y-4">
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A]">
                  {form.steps[currentStep - 1]?.title || `Step ${currentStep}`}
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Tap or type below — takes under 20 seconds
                </p>
              </div>

              <div className="space-y-3">
                {(form.steps[currentStep - 1]?.fields || []).map((field) => {
                  const selectedChip =
                    chipValues[field.key] || field.options?.[0] || '';
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-[#334155]">
                        {field.label}
                        {field.required && (
                          <span className="text-rose-500 ml-0.5">*</span>
                        )}
                      </label>

                      {field.type === 'chips' && (
                        <div className="flex flex-wrap gap-1.5">
                          {(field.options || ['Option A', 'Option B']).map(
                            (opt) => {
                              const active = selectedChip === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setChipValues((prev) => ({
                                      ...prev,
                                      [field.key]: opt,
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                                    active
                                      ? 'text-white border-transparent shadow-xs'
                                      : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:border-slate-300'
                                  }`}
                                  style={
                                    active
                                      ? { backgroundColor: form.brandColor }
                                      : undefined
                                  }
                                >
                                  {opt}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}

                      {field.type === 'select' && (
                        <select
                          value={textValues[field.key] ?? field.options?.[0] ?? ''}
                          onChange={(e) =>
                            setTextValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        >
                          {(field.options || ['Default Option']).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === 'phone' && (
                        <div className="flex items-center h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/25">
                          <span className="px-3 h-full flex items-center bg-[#F1F5F9] border-r border-[#E2E8F0] text-xs font-extrabold text-[#334155] shrink-0">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={textValues[field.key] ?? ''}
                            onChange={(e) =>
                              setTextValues((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder || '98112 45678'}
                            className="w-full h-full px-3 bg-transparent text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                      )}

                      {(field.type === 'text' || field.type === 'email') && (
                        <input
                          type={field.type === 'email' ? 'email' : 'text'}
                          value={textValues[field.key] ?? ''}
                          onChange={(e) =>
                            setTextValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          placeholder={
                            field.placeholder || `Enter ${field.label.toLowerCase()}`
                          }
                          className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => goTo(currentStep - 1)}
                className="h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[#475569] font-bold text-xs inline-flex items-center gap-1 hover:bg-[#F8FAFC] transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleContinueStep()}
                className="flex-1 h-10 rounded-xl text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 transition cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: form.brandColor }}
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {currentStep === stepsCount && !form.requireWhatsappOtp
                    ? submitting
                      ? 'Submitting...'
                      : 'Submit Inquiry'
                    : 'Continue'}
                </span>
                {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Screen N+1: WhatsApp OTP Verification */}
        {form.requireWhatsappOtp && currentStep === otpStepIndex && (
          <div className="flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4 pt-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-emerald-600 flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  Verify Your WhatsApp Number
                </h3>
                <p className="text-xs text-[#64748B] max-w-[260px] mx-auto leading-relaxed">
                  We sent a 4-digit verification code on WhatsApp to{' '}
                  <span className="font-mono font-bold text-[#1E293B]">
                    {phonePreview}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    aria-label={`OTP digit ${idx + 1}`}
                    className="w-11 h-12 rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] text-center text-lg font-extrabold text-[#0F172A] focus:outline-none focus:border-emerald-500"
                  />
                ))}
              </div>

              {otpHint && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10.5px] font-bold text-amber-800">
                  Sandbox OTP Code: <span className="font-mono">{otpHint}</span>
                </div>
              )}

              <p className="text-[11px] font-semibold text-slate-400">
                Didn&apos;t get it?{' '}
                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={() => void triggerOtpSend()}
                  className="text-emerald-600 font-bold underline cursor-pointer disabled:opacity-50"
                >
                  {otpLoading ? 'Sending...' : 'Resend WhatsApp Code'}
                </button>
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] text-[10.5px] font-semibold text-[#475569]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Anti-Spam WhatsApp OTP Gate Active</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => goTo(currentStep - 1)}
                className="h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[#475569] font-bold text-xs inline-flex items-center gap-1 hover:bg-[#F8FAFC] transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleVerifyAndSubmitOtp()}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{submitting ? 'Verifying...' : 'Verify & Get Quote'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Final Screen: Actionable Thank-You Screen */}
        {currentStep === thankYouIndex && (
          <div className="space-y-4 pt-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-emerald-600 flex items-center justify-center mx-auto shadow-xs transition-transform scale-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A]">
                {form.thankYou.title || 'Thank You — Request Confirmed!'}
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed max-w-xs mx-auto">
                {form.thankYou.message}
              </p>
            </div>

            <div className="space-y-2 pt-1 text-left">
              {form.thankYou.bookingCta && (
                <a
                  href={`/book/${encodeURIComponent(resolvedBookingSlug)}`}
                  target={mode === 'preview' ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] hover:border-blue-300 bg-[#F8FAFC] flex items-center justify-between gap-2.5 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: form.brandColor }}
                    >
                      <CalendarClock className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#0F172A] truncate">
                        Book a 15-Min Call / Demo
                      </div>
                      <div className="text-[10.5px] text-[#64748B] truncate">
                        Pick your preferred IST slot now
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </a>
              )}

              {form.thankYou.whatsappCta && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] flex items-center justify-between gap-2.5 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#064E3B] truncate">
                        Chat on WhatsApp Now
                      </div>
                      <div className="text-[10.5px] text-[#047857] truncate">
                        Instant reply with specialist rep
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </a>
              )}

              {form.thankYou.brochureCta && (
                <a
                  href={brochureHref}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] hover:border-slate-300 bg-[#FFFFFF] flex items-center justify-between gap-2.5 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#0F172A] truncate">
                        Download Catalog &amp; Price List
                      </div>
                      <div className="text-[10.5px] text-[#64748B] truncate">
                        PDF Datasheet &amp; HSN Details
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </a>
              )}
            </div>

            {mode === 'preview' && (
              <button
                type="button"
                onClick={() => goTo(0)}
                className="text-[11px] font-bold text-slate-400 hover:text-[#475569] underline pt-1 cursor-pointer"
              >
                Restart Preview Flow
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400">
        <Sparkles className="w-3 h-3 text-blue-500" />
        <span>Powered by Leadsetu AI CRM</span>
      </div>
    </div>
  );
}

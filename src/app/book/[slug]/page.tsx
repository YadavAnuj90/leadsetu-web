'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  PhoneCall,
  Video,
} from 'lucide-react';
import {
  createPublicBookingApi,
  fetchPublicBookingSlotsApi,
  type PublicSchedulerInfoResponse,
} from '@/lib/marketplace-sync-api';

function buildUpcomingDates(daysCount = 10): Array<{ ymd: string; label: string; dow: number }> {
  const out: Array<{ ymd: string; label: string; dow: number }> = [];
  const now = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    const ist = new Date(d.getTime() + 5.5 * 3600_000);
    const ymd = ist.toISOString().slice(0, 10);
    const dow = ist.getUTCDay();
    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : ist.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
            });
    out.push({ ymd, label, dow });
  }
  return out;
}

function PublicBookingInner() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = String(params?.slug || '');
  const isEmbed = searchParams?.get('embed') === '1';

  const dates = useMemo(() => buildUpcomingDates(10), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.ymd || '');
  const [info, setInfo] = useState<PublicSchedulerInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTime24, setSelectedTime24] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmed, setConfirmed] = useState<{
    bookingRef: string;
    companyName: string;
    assignedRepName: string;
    dateYmd: string;
    slotLabel: string;
    durationMinutes: number;
    confirmationSent: boolean;
    icsContent: string;
  } | null>(null);

  const loadSlots = useCallback(
    async (dateYmd: string) => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPublicBookingSlotsApi(slug, dateYmd);
        setInfo(res);
        setSelectedTime24('');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load booking slots.',
        );
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    void loadSlots(selectedDate);
  }, [loadSlots, selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime24) {
      setError('Please pick a free time slot first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createPublicBookingApi(slug, {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        guestCompany: guestCompany.trim() || undefined,
        topic: topic.trim() || undefined,
        dateYmd: selectedDate,
        slotTime24: selectedTime24,
      });
      setConfirmed(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to confirm booking.',
      );
      await loadSlots(selectedDate);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadIcs = () => {
    if (!confirmed?.icsContent) return;
    const blob = new Blob([confirmed.icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${confirmed.bookingRef}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ModeIcon =
    info?.meetingType === 'phone_call'
      ? PhoneCall
      : info?.meetingType === 'in_person'
        ? MapPin
        : Video;

  const modeLabel =
    info?.meetingType === 'phone_call'
      ? 'Phone Consultation'
      : info?.meetingType === 'in_person'
        ? `In-Person Meeting (${info?.city || 'India'})`
        : 'Video Product Demo';

  return (
    <div
      className={
        isEmbed
          ? 'p-2 sm:p-4 bg-transparent'
          : 'min-h-screen bg-slate-50 dark:bg-[#070E1B] py-8 px-4 flex items-center justify-center'
      }
    >
      <div className="w-full max-w-3xl bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
        {confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-brand-navy dark:text-white">
              Appointment Confirmed · {confirmed.bookingRef}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Your {confirmed.durationMinutes}-minute session with{' '}
              <strong>{confirmed.companyName}</strong> ({confirmed.assignedRepName}) is scheduled for{' '}
              <strong>
                {confirmed.dateYmd} at {confirmed.slotLabel} IST
              </strong>
              .
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              {confirmed.confirmationSent
                ? 'WhatsApp Confirmation Sent + 1-Hr Reminder Scheduled'
                : 'Booking Logged in CRM + 1-Hr Reminder Scheduled'}
            </div>
            <div className="pt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={downloadIcs}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-extrabold"
              >
                <Download className="w-4 h-4" /> Add to Calendar (.ics)
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmed(null);
                  void loadSlots(selectedDate);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Left Branding & Summary */}
            <div className="md:col-span-5 bg-slate-50 dark:bg-[#111D33] p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 space-y-4">
              {info?.logoUrl ? (
                <img
                  src={info.logoUrl}
                  alt={info.companyName}
                  className="h-10 w-auto object-contain rounded-lg"
                />
              ) : null}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
                  {info?.companyName || 'Leadsetu Booking'}
                </div>
                <h1 className="text-lg font-black text-brand-navy dark:text-white mt-1">
                  {info?.title || 'Book a Product Demo & Consultation'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {info?.subtitle || 'Select a convenient date and IST slot below.'}
                </p>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>{info?.durationMinutes || 30} Minutes · IST (Asia/Kolkata)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ModeIcon className="w-4 h-4 text-brand-blue" />
                  <span>{modeLabel}</span>
                </div>
              </div>
            </div>

            {/* Right Picker & Form */}
            <div className="md:col-span-7 p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-200">
                  {error}
                </div>
              )}

              <div>
                <div className="text-xs font-extrabold text-brand-navy dark:text-white mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-blue" /> Select Date
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {dates.map((d) => {
                    const isWorking = !info || info.workingDays.includes(d.dow);
                    const active = selectedDate === d.ymd;
                    return (
                      <button
                        key={d.ymd}
                        type="button"
                        disabled={!isWorking}
                        onClick={() => setSelectedDate(d.ymd)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition ${
                          active
                            ? 'bg-brand-navy text-white border-brand-navy'
                            : 'bg-slate-50 dark:bg-[#111D33] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-brand-navy dark:text-white mb-2">
                  Available Time Slots (IST)
                </div>
                {loading ? (
                  <div className="py-4 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking live availability...
                  </div>
                ) : !info || info.slots.filter((s) => s.available).length === 0 ? (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-white/15 text-xs text-slate-400">
                    No open slots left for {selectedDate}. Try the next working day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                    {info.slots
                      .filter((s) => s.available)
                      .map((s) => (
                        <button
                          key={s.time24}
                          type="button"
                          onClick={() => setSelectedTime24(s.time24)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-extrabold border transition ${
                            selectedTime24 === s.time24
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-[#111D33] border-slate-200 dark:border-white/15 text-brand-navy dark:text-slate-200 hover:border-brand-blue'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <form onSubmit={(e) => void handleBook(e)} className="space-y-2.5 text-xs pt-2 border-t border-slate-100 dark:border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-brand-navy dark:text-white"
                  />
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="WhatsApp Number (+91...) *"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-brand-navy dark:text-white"
                  />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Work Email (Optional)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-brand-navy dark:text-white"
                  />
                  <input
                    type="text"
                    value={guestCompany}
                    onChange={(e) => setGuestCompany(e.target.value)}
                    placeholder="Company / Business Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-brand-navy dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What would you like to discuss / quote for?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-brand-navy dark:text-white"
                />
                <button
                  type="submit"
                  disabled={submitting || !selectedTime24}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Appointment &amp; Get WhatsApp Reminder</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading booking calendar...
        </div>
      }
    >
      <PublicBookingInner />
    </Suspense>
  );
}

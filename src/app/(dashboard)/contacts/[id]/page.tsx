'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Contact } from '@/types/contracts';

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setIsLoading(true);
    apiClient
      .get<Contact>(`/contacts/${params.id}`)
      .then((res) => setContact(res.data))
      .catch(() => setContact(null))
      .finally(() => setIsLoading(false));
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
        <h2 className="text-lg font-extrabold text-brand-navy">
          Contact not found
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          This contact record may have been removed or the ID is invalid.
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
          </button>
          <Link
            href="/contacts"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50"
          >
            All Contacts
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl text-white"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
              }}
            >
              {contact.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-navy">
                {contact.name}
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-blue" />
                {contact.designation ? `${contact.designation} at ` : ''}
                {contact.company || 'Individual Account'}
              </p>
            </div>
          </div>

          {contact.phone && (
            <a
              href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold"
            >
              <MessageSquare className="w-4 h-4" /> Message on WhatsApp
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              Account Type
            </div>
            <div className="text-base font-extrabold text-brand-navy capitalize mt-0.5">
              {contact.type || 'Customer'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              Lifetime Value (INR)
            </div>
            <div className="text-base font-extrabold text-emerald-600 mt-0.5">
              ₹{(contact.lifetimeValue || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              GSTIN Number
            </div>
            <div className="text-sm font-mono font-bold text-brand-navy mt-1">
              {contact.gstin || 'Unregistered / B2C'}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 text-sm text-slate-600 pt-2 border-t border-slate-100">
          {contact.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-blue" /> {contact.phone}
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-blue" /> {contact.email}
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-brand-blue" /> {contact.city || 'Delhi-NCR'}
          </div>
        </div>
      </div>
    </div>
  );
}

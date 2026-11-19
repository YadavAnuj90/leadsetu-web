'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Building2,
  Users,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  Trash2,
  ArrowUpRight,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { verifyContactGstinApi, updateContactCreditApi } from '@/lib/invoices-api';
import CallMobileButton from '@/components/calling/CallMobileButton';
import WhatsAppActionButton from '@/components/inbox/WhatsAppActionButton';
import type { Contact } from '@/types/contracts';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    prospects: 0,
    totalLtv: 0,
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [gstin, setGstin] = useState('');
  const [type, setType] = useState<'customer' | 'prospect' | 'partner' | 'vendor'>('customer');
  const [lifetimeValue, setLifetimeValue] = useState('');
  const [creditLimitInr, setCreditLimitInr] = useState('500000');
  const [creditTermDays, setCreditTermDays] = useState('30');
  const [contactNotice, setContactNotice] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<{
        data: Contact[];
        stats: typeof stats;
      }>('/contacts', {
        params: { search, type: typeFilter },
      });
      setContacts(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch {
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsMutating(true);
    try {
      await apiClient.post('/contacts', {
        name,
        company,
        designation,
        phone,
        email,
        city,
        gstin,
        type,
        lifetimeValue: Number(lifetimeValue) || 0,
        creditLimitInr: Number(creditLimitInr) || 0,
        creditTermDays: Number(creditTermDays) || 15,
        tags: gstin ? ['GST Registered', 'B2B'] : ['B2B'],
      });
      setModalOpen(false);
      setName('');
      setCompany('');
      setDesignation('');
      setPhone('');
      setEmail('');
      setGstin('');
      setLifetimeValue('');
      await fetchContacts();
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiClient.delete(`/contacts/${id}`);
    await fetchContacts();
  };

  const handleToggleCreditHold = async (c: Contact) => {
    try {
      await updateContactCreditApi(c.id, {
        creditHold: !c.creditHold,
        creditHoldReason: !c.creditHold ? 'Placed on hold from B2B Directory' : '',
      });
      setContactNotice(
        `${c.company || c.name} is now ${!c.creditHold ? 'ON CREDIT HOLD' : 'RELEASED from Credit Hold'}.`,
      );
      await fetchContacts();
    } catch (err) {
      setContactNotice(getErrorMessage(err));
    }
  };

  const handleVerifyGstin = async (c: Contact) => {
    try {
      const res = await verifyContactGstinApi(c.id, c.gstin);
      setContactNotice(`${c.company || c.name}: ${res.validation?.reason || 'GSTIN checked'}`);
      await fetchContacts();
    } catch (err) {
      setContactNotice(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Building2 className="w-3.5 h-3.5" /> B2B Accounts &amp; GST Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Contacts &amp; Companies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage verified B2B decision-makers, GSTIN records, and customer lifetime value.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {contactNotice && (
        <div className="rounded-xl px-4 py-3 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
          <span>{contactNotice}</span>
          <button type="button" onClick={() => setContactNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Contacts',
            value: stats.total.toLocaleString('en-IN'),
            sub: 'Across all Delhi-NCR hubs',
            icon: Users,
            color: '#3978EA',
          },
          {
            label: 'Active Customers',
            value: stats.customers.toLocaleString('en-IN'),
            sub: 'Paying B2B accounts',
            icon: Building2,
            color: '#10B981',
          },
          {
            label: 'Active Prospects',
            value: stats.prospects.toLocaleString('en-IN'),
            sub: 'In sales evaluation',
            icon: FileCheck,
            color: '#F59E0B',
          },
          {
            label: 'Total Account LTV',
            value: `₹${stats.totalLtv.toLocaleString('en-IN')}`,
            sub: 'Cumulative account value',
            icon: IndianRupee,
            color: '#8B5CF6',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">
                  {kpi.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}15`, color: kpi.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-brand-navy">
                {kpi.value}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-1">
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'customer', 'prospect', 'partner', 'vendor'] as const).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-brand-navy text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t === 'all' ? 'All Accounts' : `${t}s`}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, GSTIN, city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4">
          <p className="text-base font-extrabold text-brand-navy">
            No contacts found in your directory
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contacts.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-blue/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm"
                        style={{
                          background:
                            'linear-gradient(135deg, #17243A 0%, #3978EA 100%)',
                        }}
                      >
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/contacts/${c.id}`}
                          className="font-extrabold text-sm text-brand-navy hover:text-brand-blue inline-flex items-center gap-1"
                        >
                          <span>{c.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="text-xs text-slate-500">
                          {c.designation ? `${c.designation} · ` : ''}
                          {c.company || 'Individual'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-brand-light text-brand-blue">
                      {c.type}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Lifetime Value
                        </span>
                        <span className="font-extrabold text-brand-navy">
                          ₹{(c.lifetimeValue || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {c.gstin && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            GSTIN {c.gstinStatus === 'verified_active' ? '✓' : ''}
                          </span>
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              c.gstinStatus === 'verified_active'
                                ? 'text-emerald-700'
                                : c.gstinStatus === 'checksum_failed' || c.gstinStatus === 'invalid_format'
                                  ? 'text-rose-600'
                                  : 'text-slate-700'
                            }`}
                          >
                            {c.gstin}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600 font-semibold">
                        Limit:{' '}
                        <strong className="text-brand-navy">
                          {c.creditLimitInr ? `₹${c.creditLimitInr.toLocaleString('en-IN')}` : 'Uncapped'}
                        </strong>{' '}
                        · Net {c.creditTermDays ?? 15}d
                      </span>
                      {(c.openReceivableInr || 0) > 0 && (
                        <span className="font-bold text-amber-700">
                          Udhaar: ₹{(c.openReceivableInr || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {c.creditHold && (
                      <div className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[10px] uppercase tracking-wider">
                        Credit Hold Active {c.creditHoldReason ? `· ${c.creditHoldReason}` : ''}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-brand-blue" /> {c.phone}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-brand-blue" /> {c.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-blue" /> {c.city}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/contacts/${c.id}`}
                    className="text-xs font-bold text-brand-blue hover:underline"
                  >
                    View 360° Profile →
                  </Link>
                  <div className="flex items-center gap-1.5">
                    {c.gstin && (
                      <button
                        type="button"
                        onClick={() => handleVerifyGstin(c)}
                        className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
                        title="Verify GSTIN Mod-36 Checksum"
                      >
                        Verify GSTIN
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleCreditHold(c)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                        c.creditHold
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {c.creditHold ? 'Release Hold' : 'Hold Credit'}
                    </button>
                    {c.phone && (
                      <>
                        <CallMobileButton
                          phone={c.phone}
                          contactName={c.name}
                          company={c.company}
                          entityType="contact"
                          entityId={c.id}
                          variant="icon"
                        />
                        <WhatsAppActionButton
                          phone={c.phone}
                          contactName={c.name}
                          company={c.company}
                          city={c.city}
                          estimatedValue={c.lifetimeValue}
                          entityType="contact"
                          entityId={c.id}
                          variant="icon"
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">Add B2B Contact</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="RS Electricals Pvt. Ltd."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Managing Director"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="prospect">Prospect</option>
                    <option value="partner">Channel Partner</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    WhatsApp Phone (+91)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98112 45678"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@company.in"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    GSTIN (15-Digit)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="07AABCR1234F1Z5"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Est. LTV (₹)
                  </label>
                  <input
                    type="number"
                    value={lifetimeValue}
                    onChange={(e) => setLifetimeValue(e.target.value)}
                    placeholder="500000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={creditLimitInr}
                    onChange={(e) => setCreditLimitInr(e.target.value)}
                    placeholder="500000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Credit Terms (Net Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={creditTermDays}
                    onChange={(e) => setCreditTermDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

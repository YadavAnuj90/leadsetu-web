'use client';

import { useState, useEffect, useCallback, FormEvent, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ScrollText,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  ExternalLink,
  ArrowRightLeft,
  ShieldCheck,
  Search,
  Database,
  Trash2,
  Eye,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  X,
  Printer,
  Percent,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  fetchInvoices,
  createInvoice,
  deleteInvoice,
  convertQuoteToInvoiceApi,
} from '@/lib/invoices-api';
import { fetchProductsApi } from '@/lib/products-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type { Invoice, Contact, Product } from '@/types/contracts';

const PLACE_OF_SUPPLY_OPTIONS = [
  '09 - Uttar Pradesh',
  '07 - Delhi',
  '06 - Haryana',
  '08 - Rajasthan',
  '27 - Maharashtra',
  '29 - Karnataka',
  '24 - Gujarat',
  '33 - Tamil Nadu',
];

const APPROVAL_BADGE: Record<
  'pending' | 'approved' | 'changes_requested',
  { label: string; className: string }
> = {
  approved: {
    label: 'Buyer Approved',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  changes_requested: {
    label: 'Revision Requested',
    className: 'bg-amber-50 text-amber-800 border border-amber-200',
  },
  pending: {
    label: 'Awaiting Buyer Approval',
    className: 'bg-blue-50 text-brand-blue border border-blue-200',
  },
};

export default function QuotationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useAuthStore();

  const [quotations, setQuotations] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<
    'all' | 'pending' | 'approved' | 'changes_requested' | 'converted'
  >('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Create Quotation Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('09 - Uttar Pradesh');
  const [gstRate, setGstRate] = useState<number>(18);

  // Discount Calculator: Flat (₹) vs Percentage (%)
  const [discountMode, setDiscountMode] = useState<'flat' | 'percent'>('percent');
  const [discountInput, setDiscountInput] = useState<string>('5');

  const [validityDays, setValidityDays] = useState<number>(15);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(
    'Proforma Quotation & B2B Commercial Proposal valid for 15 days. 50% advance with Purchase Order, balance 50% prior to dispatch from Noida Electronic City.',
  );
  const [items, setItems] = useState<
    { description: string; hsnSac: string; quantity: number; unitPrice: number }[]
  >([
    {
      description: 'Enterprise B2B Supply / Annual AMC Proposal Package',
      hsnSac: '998314',
      quantity: 1,
      unitPrice: 185000,
    },
  ]);
  const [linkedDealId, setLinkedDealId] = useState('');
  const [linkedLeadId, setLinkedLeadId] = useState('');

  // PDF Proposal Preview Modal
  const [selectedQuote, setSelectedQuote] = useState<Invoice | null>(null);
  const [copiedPublicId, setCopiedPublicId] = useState<string | null>(null);

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchInvoices({
        search: search.trim() || undefined,
        docType: 'proforma_quote',
      });
      setQuotations(res.data || []);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  useEffect(() => {
    fetchProductsApi()
      .then((res) => setCatalogProducts(res.data || []))
      .catch(() => {});
    apiClient
      .get<{ data: Contact[] }>('/contacts')
      .then((res) => setContacts(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Support pre-filling from Lead or Deal pages
  useEffect(() => {
    const prefillClient = searchParams.get('client');
    const prefillAmount = searchParams.get('amount');
    const prefillPhone = searchParams.get('phone');
    const prefillContact = searchParams.get('contact');
    const prefillTitle = searchParams.get('title');
    const prefillDealId = searchParams.get('dealId');
    const prefillLeadId = searchParams.get('leadId');
    const prefillEmail = searchParams.get('email');
    const prefillCity = searchParams.get('city');

    if (prefillClient) {
      setClientName(prefillClient);
      if (prefillDealId) setLinkedDealId(prefillDealId);
      if (prefillLeadId) setLinkedLeadId(prefillLeadId);
      if (prefillContact) setContactPerson(prefillContact);
      if (prefillPhone) setPhone(prefillPhone);
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillCity) {
        const c = prefillCity.toLowerCase();
        if (c.includes('delhi')) setPlaceOfSupply('07 - Delhi');
        else if (c.includes('gurgaon') || c.includes('gurugram') || c.includes('faridabad'))
          setPlaceOfSupply('06 - Haryana');
        else if (c.includes('mumbai') || c.includes('pune'))
          setPlaceOfSupply('27 - Maharashtra');
        else if (c.includes('bengaluru') || c.includes('bangalore'))
          setPlaceOfSupply('29 - Karnataka');
        else setPlaceOfSupply('09 - Uttar Pradesh');
      }
      if (prefillAmount || prefillTitle) {
        setItems([
          {
            description: prefillTitle || `Commercial Proposal for ${prefillClient}`,
            hsnSac: '998314',
            quantity: 1,
            unitPrice: Number(prefillAmount) || 185000,
          },
        ]);
      }
      setCreateOpen(true);
    }
  }, [searchParams]);

  // Live Discount & GST Calculation Preview
  const subTotalPreview = items.reduce(
    (sum, item) =>
      sum +
      Math.max(1, Number(item.quantity) || 1) *
        Math.max(0, Number(item.unitPrice) || 0),
    0,
  );
  const rawDiscVal = Math.max(0, Number(discountInput) || 0);
  const computedDiscountRupees =
    discountMode === 'percent'
      ? Math.min(
          subTotalPreview,
          Math.round((subTotalPreview * Math.min(100, rawDiscVal)) / 100),
        )
      : Math.min(subTotalPreview, Math.round(rawDiscVal));
  const effectiveDiscountPct =
    subTotalPreview > 0
      ? Math.round((computedDiscountRupees / subTotalPreview) * 1000) / 10
      : 0;
  const taxablePreview = Math.max(0, subTotalPreview - computedDiscountRupees);
  const gstPreview = Math.round((taxablePreview * gstRate) / 100);
  const isIntraStateUp = placeOfSupply.startsWith('09');
  const grandTotalPreview = taxablePreview + gstPreview;

  // Quotation KPI Stats
  const kpis = useMemo(() => {
    const active = quotations.filter((q) => q.status !== 'cancelled');
    const totalQuoted = active.reduce((s, q) => s + (Number(q.grandTotal) || 0), 0);
    const totalDiscountGiven = active.reduce((s, q) => s + (Number(q.discount) || 0), 0);
    const totalGstCalculated = active.reduce((s, q) => s + (Number(q.gstAmount) || 0), 0);
    const approved = active.filter((q) => q.quoteApprovalStatus === 'approved');
    const converted = active.filter((q) => Boolean(q.convertedToInvoiceId));
    const conversionPct =
      active.length > 0 ? Math.round((converted.length / active.length) * 100) : 0;

    return {
      totalCount: active.length,
      totalQuoted,
      totalDiscountGiven,
      totalGstCalculated,
      approvedCount: approved.length,
      approvedValue: approved.reduce((s, q) => s + (Number(q.grandTotal) || 0), 0),
      convertedCount: converted.length,
      conversionPct,
    };
  }, [quotations]);

  const visibleQuotations = useMemo(() => {
    if (approvalFilter === 'all') return quotations;
    if (approvalFilter === 'converted') {
      return quotations.filter((q) => Boolean(q.convertedToInvoiceId));
    }
    return quotations.filter(
      (q) => (q.quoteApprovalStatus || 'pending') === approvalFilter,
    );
  }, [quotations, approvalFilter]);

  const handleSelectContact = (contactId: string) => {
    const found = contacts.find((c) => c.id === contactId);
    if (!found) return;
    setClientName(found.company || found.name);
    setContactPerson(found.name);
    setPhone(found.phone || '');
    setEmail(found.email || '');
    setGstin(found.gstin || '');
    if (found.gstin?.startsWith('07')) setPlaceOfSupply('07 - Delhi');
    else if (found.gstin?.startsWith('06')) setPlaceOfSupply('06 - Haryana');
    else if (found.gstin?.startsWith('09')) setPlaceOfSupply('09 - Uttar Pradesh');
  };

  const handleValidityPreset = (days: number) => {
    setValidityDays(days);
    const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    setDueDate(nextDate);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { description: '', hsnSac: '998314', quantity: 1, unitPrice: 35000 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemRow = (
    index: number,
    field: 'description' | 'hsnSac' | 'quantity' | 'unitPrice',
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  };

  const handlePickCatalogProduct = (rowIdx: number, productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;
    handleUpdateItemRow(rowIdx, 'description', `${prod.name} (${prod.sku})`);
    handleUpdateItemRow(rowIdx, 'hsnSac', prod.hsnSac);
    handleUpdateItemRow(rowIdx, 'unitPrice', prod.unitPrice);
    if ([0, 5, 12, 18, 28].includes(prod.gstRate)) {
      setGstRate(prod.gstRate);
    }
  };

  const handleCreateQuotation = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const created = await createInvoice({
        docType: 'proforma_quote',
        clientName: clientName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim().toUpperCase(),
        placeOfSupply,
        taxType: isIntraStateUp ? 'cgst_sgst' : 'igst',
        gstRate,
        discount: computedDiscountRupees,
        dueDate,
        notes,
        status: 'sent',
        linkedDealId: linkedDealId || undefined,
        linkedLeadId: linkedLeadId || undefined,
        items: items.map((i) => ({
          description: i.description.trim() || 'B2B Proposal Item / Service',
          hsnSac: i.hsnSac.trim() || '998314',
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
        })),
      });
      setCreateOpen(false);
      await loadQuotations();
      setSelectedQuote(created);
      setToastMsg(
        `Created Quotation & PDF Proposal ${created.invoiceNumber} for ${created.clientName}!`,
      );
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSeedSampleQuotes = async () => {
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const samples = [
        {
          clientName: 'Apex Auto Components Ltd.',
          contactPerson: 'Vikramjit Singh',
          phone: '+91 99104 88712',
          email: 'vikram@apexauto.in',
          gstin: '06AABCA9012H1Z8',
          placeOfSupply: '06 - Haryana',
          taxType: 'igst' as const,
          gstRate: 18,
          discount: 25000,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
          notes:
            'B2B Proposal valid for 15 days. Includes special 4% corporate discount. 50% advance with PO to release dispatch from Noida Sector 62.',
          items: [
            {
              description: 'Annual Enterprise AMC + IoT Energy Telemetry Sensors',
              hsnSac: '998313',
              quantity: 4,
              unitPrice: 155000,
            },
          ],
        },
        {
          clientName: 'Shree Ganesh Cold Storage & Logistics',
          contactPerson: 'Ankit Aggarwal',
          phone: '+91 98107 33421',
          email: 'ankit@ganeshcoldstorage.in',
          gstin: '09AABCS4412M1Z4',
          placeOfSupply: '09 - Uttar Pradesh',
          taxType: 'cgst_sgst' as const,
          gstRate: 18,
          discount: 18000,
          dueDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          notes:
            'Intra-state Uttar Pradesh supply (9% CGST + 9% SGST). Includes 5-year warranty & Noida on-site commissioning.',
          items: [
            {
              description: '200 KVA Three-Phase Oil Cooled Servo Voltage Stabilizer',
              hsnSac: '850440',
              quantity: 1,
              unitPrice: 320000,
            },
            {
              description: 'Automatic Phase Sequence Corrector & APFC Panel',
              hsnSac: '853710',
              quantity: 1,
              unitPrice: 85000,
            },
          ],
        },
      ];
      for (const s of samples) {
        await createInvoice({
          ...s,
          docType: 'proforma_quote',
          status: 'sent',
        });
      }
      await loadQuotations();
      setToastMsg('Seeded 2 sample Delhi-NCR B2B Quotations with discounts & GST!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleConvertToInvoice = async (quote: Invoice) => {
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const res = await convertQuoteToInvoiceApi(quote.id);
      await loadQuotations();
      setSelectedQuote(res.quote);
      setToastMsg(
        res.alreadyConverted
          ? `Quotation ${quote.invoiceNumber} is already linked to GST Tax Invoice ${res.invoice.invoiceNumber}.`
          : `Converted Quotation ${quote.invoiceNumber} into GST Tax Invoice ${res.invoice.invoiceNumber}!`,
      );
      setTimeout(() => setToastMsg(null), 4500);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsMutating(true);
    try {
      await deleteInvoice(id);
      if (selectedQuote?.id === id) setSelectedQuote(null);
      await loadQuotations();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleCopyPublicLink = async (quote: Invoice) => {
    if (!quote.publicToken || typeof window === 'undefined') return;
    const url = `${window.location.origin}/quote/${quote.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPublicId(quote.id);
      setToastMsg(`Copied public buyer approval link for ${quote.invoiceNumber}.`);
      setTimeout(() => setCopiedPublicId(null), 2000);
      setTimeout(() => setToastMsg(null), 3200);
    } catch {
      setErrorMsg('Clipboard copy failed.');
    }
  };

  const handleShareProposalWhatsApp = (quote: Invoice) => {
    const digits = (quote.phone || '').replace(/\D/g, '');
    const waPhone =
      digits.length === 10 ? `91${digits}` : digits.length >= 11 ? digits : '';
    const publicUrl =
      quote.publicToken && typeof window !== 'undefined'
        ? `${window.location.origin}/quote/${quote.publicToken}`
        : '';
    const discountLine =
      quote.discount > 0
        ? `\n• Special Discount: - ₹${quote.discount.toLocaleString('en-IN')}`
        : '';
    const text = encodeURIComponent(
      `Namaste ${quote.contactPerson || quote.clientName},\n\nPlease find your B2B Commercial Quotation *${quote.invoiceNumber}* from *${tenant?.name || 'Leadsetu Technologies'}*.\n\n• Sub-Total: ₹${quote.subTotal.toLocaleString('en-IN')}${discountLine}\n• Taxable Value: ₹${quote.taxableAmount.toLocaleString('en-IN')}\n• GST (${quote.gstRate}%): ₹${quote.gstAmount.toLocaleString('en-IN')}\n• *Net Proposal Total: ₹${quote.grandTotal.toLocaleString('en-IN')}*\n• Valid Till: ${quote.dueDate || '15 Days'}${
        publicUrl ? `\n\nReview & Approve Quotation Online:\n${publicUrl}` : ''
      }`,
    );
    const base = waPhone ? `https://wa.me/${waPhone}` : 'https://wa.me/';
    window.open(`${base}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <ScrollText className="w-3.5 h-3.5" /> B2B Quotations, PDF Proposals &amp; 1-Click Invoice Conversion
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Quotations &amp; PDF Proposals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create HSN-compliant quotations, apply % or ₹ discounts, calculate CGST/SGST &amp; IGST, export PDF proposals, and convert approved quotes into GST Tax Invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            <FileText className="w-4 h-4 text-brand-blue" />
            View GST Tax Invoices
          </Link>

          <button
            type="button"
            onClick={handleSeedSampleQuotes}
            disabled={isMutating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            ) : (
              <Database className="w-4 h-4 text-brand-blue" />
            )}
            Seed Sample Quotes
          </button>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Quotation / PDF Proposal
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quotation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Quoted Pipeline</span>
            <IndianRupee className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            ₹{kpis.totalQuoted.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across <span className="font-bold text-slate-700">{kpis.totalCount}</span> active quotations
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Buyer Approved Quotes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ₹{kpis.approvedValue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-emerald-700">{kpis.approvedCount}</span> approved via Buyer Portal
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Converted → Invoices</span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-2">
            {kpis.convertedCount} ({kpis.conversionPct}%)
          </div>
          <p className="text-xs text-slate-500 mt-1">
            1-click converted into GST Tax Invoices
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Discounts &amp; GST Computed</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            ₹{kpis.totalGstCalculated.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Discounts offered:{' '}
            <span className="font-bold text-emerald-700">
              ₹{kpis.totalDiscountGiven.toLocaleString('en-IN')}
            </span>
          </p>
        </div>
      </div>

      {/* Search & Status Filter Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Quotation # (QTN-2026), buyer company, 15-digit GSTIN, or state..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all' as const, label: 'All Quotes' },
            { id: 'pending' as const, label: 'Awaiting Approval' },
            { id: 'approved' as const, label: 'Buyer Approved' },
            { id: 'changes_requested' as const, label: 'Revision Requested' },
            { id: 'converted' as const, label: 'Converted to Invoice' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setApprovalFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                approvalFilter === tab.id
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
            <p className="text-xs font-semibold">
              Loading B2B Quotations &amp; PDF Proposals...
            </p>
          </div>
        ) : visibleQuotations.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center mx-auto">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-navy">
                No Quotations Found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Create a customized B2B quotation with discounts &amp; GST calculations, or seed sample Delhi-NCR proposals.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSeedSampleQuotes}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Seed Sample Quotations
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
              >
                + Create Quotation
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Quotation #</th>
                  <th className="py-3.5 px-4">Buyer &amp; GSTIN</th>
                  <th className="py-3.5 px-4">Sub-Total &amp; Discount</th>
                  <th className="py-3.5 px-4">GST Calculation</th>
                  <th className="py-3.5 px-4">Proposal Total</th>
                  <th className="py-3.5 px-4">Approval &amp; Conversion</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleQuotations.map((q) => {
                  const approvalState = q.quoteApprovalStatus || 'pending';
                  const badge = APPROVAL_BADGE[approvalState] || APPROVAL_BADGE.pending;
                  const discPct =
                    q.subTotal > 0 ? Math.round((q.discount / q.subTotal) * 100) : 0;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => setSelectedQuote(q)}
                          className="font-mono font-bold text-brand-blue hover:underline text-xs text-left"
                        >
                          {q.invoiceNumber}
                        </button>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Valid till {q.dueDate || '15 Days'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-brand-navy">{q.clientName}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {q.gstin ? `GSTIN: ${q.gstin}` : 'Unregistered Buyer'} ·{' '}
                          {q.placeOfSupply}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="font-semibold text-slate-700">
                          Sub: ₹{q.subTotal.toLocaleString('en-IN')}
                        </div>
                        {q.discount > 0 ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-0.5">
                            <span>- ₹{q.discount.toLocaleString('en-IN')}</span>
                            <span>({discPct}% off)</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">No discount</div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="font-bold text-slate-800">
                          ₹{q.gstAmount.toLocaleString('en-IN')} ({q.gstRate}%)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {q.taxType === 'cgst_sgst'
                            ? `CGST ₹${q.cgstAmount.toLocaleString('en-IN')} + SGST ₹${q.sgstAmount.toLocaleString('en-IN')}`
                            : `IGST ₹${q.igstAmount.toLocaleString('en-IN')} (Inter-State)`}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-extrabold text-brand-navy">
                          ₹{q.grandTotal.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Taxable: ₹{q.taxableAmount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.className}`}
                          >
                            {approvalState === 'approved' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {badge.label}
                          </span>

                          {q.convertedToInvoiceId && (
                            <Link
                              href="/invoices"
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                            >
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              Converted to GST Invoice →
                            </Link>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQuote(q)}
                            title="View / Export PDF Proposal"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-brand-light text-brand-blue text-[11px] font-bold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>PDF Proposal</span>
                          </button>

                          {q.publicToken && (
                            <a
                              href={`/quote/${q.publicToken}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Open Public Shareable Buyer Quote Portal"
                              className="p-2 rounded-lg border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleShareProposalWhatsApp(q)}
                            title="Share Quotation on WhatsApp"
                            className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {!q.convertedToInvoiceId ? (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => handleConvertToInvoice(q)}
                              title="1-Click Convert Quotation into GST Tax Invoice"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Convert → Invoice</span>
                            </button>
                          ) : (
                            <Link
                              href="/invoices"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Invoiced</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            title="Delete Quotation"
                            className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CREATE QUOTATION & PDF PROPOSAL MODAL ───────────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ScrollText className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="text-base font-extrabold">
                    Create B2B Quotation &amp; PDF Proposal
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Configure HSN items, % or ₹ discounts, automatic CGST/SGST or IGST, and shareable buyer approval link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateQuotation}
              className="p-6 space-y-5 max-h-[82vh] overflow-y-auto"
            >
              {/* Quick Auto-fill from B2B Contacts + Validity Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quick Auto-Fill Buyer from B2B GST Directory
                  </label>
                  <select
                    onChange={(e) => handleSelectContact(e.target.value)}
                    defaultValue=""
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  >
                    <option value="">-- Select a saved B2B Contact --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company || c.name} ({c.gstin || c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proposal Validity Period
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 15, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleValidityPreset(d)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          validityDays === d
                            ? 'bg-brand-navy text-white border-brand-navy'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Valid {d} Days
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buyer & Place of Supply Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buyer / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Apex Auto Components Ltd."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buyer 15-Digit GSTIN
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 06AABCA9012H1Z8"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Place of Supply (State Code)
                  </label>
                  <select
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-semibold"
                  >
                    {PLACE_OF_SUPPLY_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Vikramjit Singh"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Number (+91)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99104 88712"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valid Until Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
                    Quotation Line Items &amp; HSN/SAC
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
                    >
                      {catalogProducts.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              handlePickCatalogProduct(idx, e.target.value);
                              e.target.value = '';
                            }}
                            className="flex-1 px-2.5 py-1 rounded-lg border border-brand-blue/25 bg-white text-[11px] font-semibold text-brand-navy"
                          >
                            <option value="">
                              Pick SKU from HSN Catalog (auto-fills rate, HSN &amp; GST%)...
                            </option>
                            {catalogProducts.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                [{prod.sku}] {prod.name} · HSN {prod.hsnSac} · ₹
                                {prod.unitPrice.toLocaleString('en-IN')} ({prod.gstRate}% GST)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-5">
                          <input
                            type="text"
                            required
                            value={row.description}
                            onChange={(e) =>
                              handleUpdateItemRow(idx, 'description', e.target.value)
                            }
                            placeholder="Proposal item / service description"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="text"
                            value={row.hsnSac}
                            onChange={(e) =>
                              handleUpdateItemRow(idx, 'hsnSac', e.target.value)
                            }
                            placeholder="HSN/SAC"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) =>
                              handleUpdateItemRow(idx, 'quantity', Number(e.target.value))
                            }
                            placeholder="Qty"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            min={0}
                            value={row.unitPrice}
                            onChange={(e) =>
                              handleUpdateItemRow(idx, 'unitPrice', Number(e.target.value))
                            }
                            placeholder="Unit Price ₹"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={items.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Engine + GST Calculator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GST Slab (%)
                      </label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                      >
                        <option value={18}>18% Standard GST</option>
                        <option value={12}>12% GST</option>
                        <option value={5}>5% Essential GST</option>
                        <option value={28}>28% Industrial GST</option>
                        <option value={0}>0% Exempt / LUT</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Discount ({discountMode === 'percent' ? '%' : '₹'})
                        </label>
                        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountMode('percent');
                              setDiscountInput('5');
                            }}
                            className={`px-2 py-0.5 ${
                              discountMode === 'percent'
                                ? 'bg-brand-blue text-white'
                                : 'bg-white text-slate-600'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountMode('flat');
                              setDiscountInput(String(computedDiscountRupees));
                            }}
                            className={`px-2 py-0.5 ${
                              discountMode === 'flat'
                                ? 'bg-brand-blue text-white'
                                : 'bg-white text-slate-600'
                            }`}
                          >
                            ₹
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Quick % Discount Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Quick Discount:
                    </span>
                    {[0, 5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountMode('percent');
                          setDiscountInput(String(pct));
                        }}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        {pct === 0 ? 'No Discount' : `${pct}% Off`}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proposal Terms &amp; Delivery Schedule
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Live Quotation & GST Calculation Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Sub-Total ({items.length} item rows):</span>
                      <span>₹{subTotalPreview.toLocaleString('en-IN')}</span>
                    </div>
                    {computedDiscountRupees > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>
                          Special Discount ({effectiveDiscountPct}% savings):
                        </span>
                        <span>- ₹{computedDiscountRupees.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                      <span>Taxable Proposal Value:</span>
                      <span>₹{taxablePreview.toLocaleString('en-IN')}</span>
                    </div>
                    {isIntraStateUp ? (
                      <>
                        <div className="flex justify-between text-slate-400">
                          <span>CGST ({gstRate / 2}% Intra-State UP):</span>
                          <span>
                            ₹{Math.round(gstPreview / 2).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>SGST ({gstRate / 2}% Intra-State UP):</span>
                          <span>
                            ₹
                            {(
                              gstPreview - Math.round(gstPreview / 2)
                            ).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-400">
                        <span>IGST ({gstRate}% Inter-State):</span>
                        <span>₹{gstPreview.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Net Quotation Total
                    </span>
                    <span className="text-2xl font-extrabold text-white">
                      ₹{grandTotalPreview.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generate Quotation &amp; PDF Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE PDF PROPOSAL & QUOTATION MODAL ────────────────── */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Top Action Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-sky-400">
                  {selectedQuote.invoiceNumber}
                </span>
                <span className="text-xs text-slate-400">
                  · B2B PDF PROPOSAL &amp; PROFORMA QUOTATION
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!selectedQuote.convertedToInvoiceId ? (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleConvertToInvoice(selectedQuote)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-extrabold text-white disabled:opacity-60"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Convert → GST Tax Invoice
                  </button>
                ) : (
                  <Link
                    href="/invoices"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Converted (View Invoice)
                  </Link>
                )}

                {selectedQuote.publicToken && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyPublicLink(selectedQuote)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                    >
                      {copiedPublicId === selectedQuote.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Portal Link
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-300" /> Copy Buyer Approval Link
                        </>
                      )}
                    </button>
                    <a
                      href={`/quote/${selectedQuote.publicToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                      title="Open Public Buyer Approval Portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleShareProposalWhatsApp(selectedQuote)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Proposal
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-blue-600 text-xs font-bold text-white"
                >
                  <Printer className="w-3.5 h-3.5" /> Download / Print PDF
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Proposal Sheet */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800">
              {/* Executive Proposal Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-brand-blue">
                    <Sparkles className="w-3.5 h-3.5" /> Commercial Proposal &amp; Proforma Quotation
                  </div>
                  <h3 className="text-xl font-extrabold text-brand-navy mt-1">
                    {tenant?.name || 'Leadsetu Technologies Pvt. Ltd.'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Noida Electronic City, Sector 62, Noida, Uttar Pradesh – 201309
                  </p>
                  <p className="text-xs font-mono text-slate-600 mt-1">
                    Supplier GSTIN: <span className="font-bold">09AABCL2026F1Z9</span> · Phone: +91 8851520832
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase">
                    Quotation Reference
                  </div>
                  <div className="text-lg font-mono font-extrabold text-brand-navy">
                    {selectedQuote.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500">
                    Place of Supply:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedQuote.placeOfSupply}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Proposal Valid Till:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedQuote.dueDate || '15 Days'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prepared For Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Proposal Prepared For (Buyer)
                  </div>
                  <div className="text-base font-extrabold text-brand-navy mt-0.5">
                    {selectedQuote.clientName}
                  </div>
                  {selectedQuote.contactPerson && (
                    <div className="text-xs text-slate-600">
                      Attn: {selectedQuote.contactPerson}{' '}
                      {selectedQuote.phone ? `(${selectedQuote.phone})` : ''}
                    </div>
                  )}
                  <div className="text-xs font-mono text-slate-600 mt-1">
                    Buyer GSTIN:{' '}
                    <span className="font-bold">
                      {selectedQuote.gstin || 'Unregistered'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right flex flex-col justify-between">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                        APPROVAL_BADGE[selectedQuote.quoteApprovalStatus || 'pending']
                          ?.className
                      }`}
                    >
                      {
                        APPROVAL_BADGE[selectedQuote.quoteApprovalStatus || 'pending']
                          ?.label
                      }
                    </span>
                  </div>
                  {selectedQuote.approvedByName && (
                    <div className="text-[11px] text-emerald-700 font-semibold mt-2">
                      Approved by {selectedQuote.approvedByName}
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized HSN Proposal Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Proposed Item / Scope of Supply</th>
                      <th className="py-3 px-4">HSN/SAC</th>
                      <th className="py-3 px-4 text-right">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedQuote.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-brand-navy">
                          {item.description}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {item.hsnSac}
                        </td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-brand-navy">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commercial Terms & GST Calculation Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="text-xs text-slate-500 space-y-2">
                  <div className="font-bold text-slate-700 uppercase">
                    Commercial Terms &amp; Bank Details
                  </div>
                  <p className="whitespace-pre-line">{selectedQuote.notes}</p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600">
                    Bank: HDFC Bank, Noida Electronic City Branch
                    <br />
                    A/C: 50200088515208 · IFSC: HDFC0001245
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub-Total:</span>
                    <span>₹{selectedQuote.subTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedQuote.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount Savings:</span>
                      <span>
                        - ₹{selectedQuote.discount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Taxable Value:</span>
                    <span>
                      ₹{selectedQuote.taxableAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedQuote.taxType === 'cgst_sgst' ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST ({selectedQuote.gstRate / 2}%):</span>
                        <span>
                          ₹{selectedQuote.cgstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST ({selectedQuote.gstRate / 2}%):</span>
                        <span>
                          ₹{selectedQuote.sgstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST ({selectedQuote.gstRate}%):</span>
                      <span>
                        ₹{selectedQuote.igstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-slate-200 flex justify-between text-base font-extrabold text-brand-navy">
                    <span>Net Proposal Total (INR):</span>
                    <span>
                      ₹{selectedQuote.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

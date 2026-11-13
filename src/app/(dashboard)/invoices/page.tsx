'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Download,
  Search,
  Database,
  Trash2,
  Eye,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  X,
  Building2,
  Receipt,
  Sparkles,
  Printer,
} from 'lucide-react';
import {
  fetchInvoices,
  createInvoice,
  markInvoicePaid,
  deleteInvoice,
  seedInvoices,
} from '@/lib/invoices-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  Invoice,
  InvoiceStats,
  InvoiceDocType,
  InvoiceStatus,
  Contact,
} from '@/types/contracts';

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

const STATUS_BADGE: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  sent: {
    label: 'Sent / Awaiting Payment',
    className: 'bg-blue-50 text-brand-blue border border-blue-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-400 border border-slate-200',
  },
};

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useAuthStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalInvoiced: 0,
    paidRevenue: 0,
    pendingAmount: 0,
    totalGstCollected: 0,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [docType, setDocType] = useState<InvoiceDocType>('tax_invoice');
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('09 - Uttar Pradesh');
  const [gstRate, setGstRate] = useState<number>(18);
  const [discount, setDiscount] = useState<string>('0');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(
    'Goods/Services supplied from Noida Electronic City, Uttar Pradesh. 100% GST compliant tax invoice.',
  );
  const [items, setItems] = useState<
    { description: string; hsnSac: string; quantity: number; unitPrice: number }[]
  >([
    {
      description: 'Enterprise B2B Supply / Annual Service Package',
      hsnSac: '998314',
      quantity: 1,
      unitPrice: 150000,
    },
  ]);

  // Preview / Print Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchInvoices({
        search: search.trim() || undefined,
        status: statusFilter,
        docType: docTypeFilter,
      });
      setInvoices(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, docTypeFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Load saved B2B contacts for quick auto-fill in Create Modal
  useEffect(() => {
    apiClient
      .get<{ data: Contact[] }>('/contacts')
      .then((res) => setContacts(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Support pre-filling from query params (e.g. from a Deal or Lead page)
  useEffect(() => {
    const prefillClient = searchParams.get('client');
    const prefillAmount = searchParams.get('amount');
    const prefillPhone = searchParams.get('phone');
    const prefillContact = searchParams.get('contact');
    const prefillTitle = searchParams.get('title');

    if (prefillClient) {
      setClientName(prefillClient);
      if (prefillContact) setContactPerson(prefillContact);
      if (prefillPhone) setPhone(prefillPhone);
      if (prefillAmount || prefillTitle) {
        setItems([
          {
            description: prefillTitle || `B2B Supply for ${prefillClient}`,
            hsnSac: '998314',
            quantity: 1,
            unitPrice: Number(prefillAmount) || 150000,
          },
        ]);
      }
      setCreateOpen(true);
    }
  }, [searchParams]);

  // Live preview calculation inside Create Modal
  const subTotalPreview = items.reduce(
    (sum, item) =>
      sum + Math.max(1, Number(item.quantity) || 1) * Math.max(0, Number(item.unitPrice) || 0),
    0,
  );
  const discountNum = Math.min(subTotalPreview, Math.max(0, Number(discount) || 0));
  const taxablePreview = Math.max(0, subTotalPreview - discountNum);
  const gstPreview = Math.round((taxablePreview * gstRate) / 100);
  const isIntraStateUp = placeOfSupply.startsWith('09');
  const grandTotalPreview = taxablePreview + gstPreview;

  const handleSelectContact = (contactId: string) => {
    const found = contacts.find((c) => c.id === contactId);
    if (!found) return;
    setClientName(found.company || found.name);
    setContactPerson(found.name);
    setPhone(found.phone || '');
    setEmail(found.email || '');
    setGstin(found.gstin || '');
    if (found.gstin?.startsWith('07')) {
      setPlaceOfSupply('07 - Delhi');
    } else if (found.gstin?.startsWith('06')) {
      setPlaceOfSupply('06 - Haryana');
    } else if (found.gstin?.startsWith('09')) {
      setPlaceOfSupply('09 - Uttar Pradesh');
    }
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { description: '', hsnSac: '998314', quantity: 1, unitPrice: 25000 },
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
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const created = await createInvoice({
        docType,
        clientName: clientName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim().toUpperCase(),
        placeOfSupply,
        taxType: isIntraStateUp ? 'cgst_sgst' : 'igst',
        gstRate,
        discount: discountNum,
        dueDate,
        notes,
        status: 'sent',
        items: items.map((i) => ({
          description: i.description.trim() || 'B2B Supply / Service',
          hsnSac: i.hsnSac.trim() || '998314',
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
        })),
      });
      setCreateOpen(false);
      await loadInvoices();
      setSelectedInvoice(created);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSeed = async () => {
    setIsMutating(true);
    try {
      await seedInvoices();
      await loadInvoices();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    setIsMutating(true);
    try {
      const updated = await markInvoicePaid(inv.id, 'razorpay');
      if (selectedInvoice?.id === inv.id) {
        setSelectedInvoice(updated);
      }
      await loadInvoices();
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
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(null);
      }
      await loadInvoices();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleCopyPaymentLink = (inv: Invoice) => {
    const link = inv.paymentLink || `https://rzp.io/i/leadsetu-${inv.invoiceNumber.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const cleanPhone = (inv.phone || '918851520832').replace(/\D/g, '');
    const docLabel =
      inv.docType === 'proforma_quote' ? 'Proforma Quotation' : 'GST Tax Invoice';
    const text = encodeURIComponent(
      `Namaste ${inv.contactPerson || inv.clientName},\n\nHere is your ${docLabel} *${inv.invoiceNumber}* from *${tenant?.name || 'Leadsetu Technologies'}* (Noida Electronic City).\n\n• Taxable Amount: ₹${inv.taxableAmount.toLocaleString('en-IN')}\n• GST (${inv.gstRate}%): ₹${inv.gstAmount.toLocaleString('en-IN')}\n• *Grand Total: ₹${inv.grandTotal.toLocaleString('en-IN')}*\n• Due Date: ${inv.dueDate || 'Immediate'}\n\nPay securely via Razorpay / UPI:\n${inv.paymentLink || 'https://rzp.io/i/leadsetu'}`,
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Receipt className="w-3.5 h-3.5" /> 18% CGST / SGST &amp; IGST Billing Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            GST Tax Invoices &amp; Proforma Quotes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create HSN-compliant B2B tax invoices from Noida Electronic City, track 18% GST liability, and collect via Razorpay on WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeed}
            disabled={isMutating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            ) : (
              <Database className="w-4 h-4 text-brand-blue" />
            )}
            Seed Sample Invoices
          </button>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create GST Invoice / Quote
          </button>
        </div>
      </div>

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

      {/* Live MongoDB KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Billed (Incl. GST)</span>
            <IndianRupee className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            ₹{stats.totalInvoiced.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across <span className="font-bold text-slate-700">{stats.totalCount}</span> GST documents
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Paid &amp; Realized</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ₹{stats.paidRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-emerald-700">{stats.paidCount}</span> invoices settled
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Pending Receivables</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            ₹{stats.pendingAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-amber-700">{stats.pendingCount}</span> open ·{' '}
            <span className="font-bold text-rose-600">{stats.overdueCount}</span> overdue
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total GST Output Tax</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-2">
            ₹{stats.totalGstCollected.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            CGST + SGST (UP) &amp; IGST (Inter-state)
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice # (INV-2026), client name, 15-digit GSTIN, or state..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-brand-blue"
          >
            <option value="all">All Document Types</option>
            <option value="tax_invoice">Tax Invoices (INV)</option>
            <option value="proforma_quote">Proforma Quotes (QTN)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-brand-blue"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent / Awaiting</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
            <p className="text-xs font-semibold">
              Loading GST Invoices &amp; Proforma Quotations from MongoDB...
            </p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-navy">
                No GST Invoices or Quotations Found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Create your first 18% GST-compliant invoice or seed 4 realistic Delhi-NCR B2B sample invoices.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSeed}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Seed 4 Sample GST Invoices
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
              >
                + Create Invoice
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Document #</th>
                  <th className="py-3.5 px-4">Client &amp; Buyer GSTIN</th>
                  <th className="py-3.5 px-4">Place of Supply</th>
                  <th className="py-3.5 px-4">Taxable Value</th>
                  <th className="py-3.5 px-4">GST Breakup</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.map((inv) => {
                  const badge = STATUS_BADGE[inv.status] || STATUS_BADGE.sent;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="font-mono font-bold text-brand-blue hover:underline text-xs text-left"
                        >
                          {inv.invoiceNumber}
                        </button>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {inv.docType === 'proforma_quote'
                            ? 'Proforma Quote'
                            : 'Tax Invoice'}{' '}
                          · Due {inv.dueDate || 'Immediate'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-brand-navy">
                          {inv.clientName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {inv.gstin
                            ? `GSTIN: ${inv.gstin}`
                            : 'Unregistered / B2C'}{' '}
                          {inv.contactPerson ? `· ${inv.contactPerson}` : ''}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                        {inv.placeOfSupply}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {inv.taxType === 'cgst_sgst'
                            ? 'Intra-State (CGST+SGST)'
                            : 'Inter-State (IGST)'}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700">
                        ₹{inv.taxableAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div className="font-bold text-slate-800">
                          ₹{inv.gstAmount.toLocaleString('en-IN')} ({inv.gstRate}%)
                        </div>
                        {inv.taxType === 'cgst_sgst' ? (
                          <div className="text-[11px] text-slate-400">
                            CGST: ₹{inv.cgstAmount.toLocaleString('en-IN')} + SGST: ₹
                            {inv.sgstAmount.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">
                            IGST: ₹{inv.igstAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-extrabold text-brand-navy">
                        ₹{inv.grandTotal.toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.className}`}
                        >
                          {inv.status === 'paid' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : inv.status === 'overdue' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            title="View / Print GST Invoice"
                            className="p-2 rounded-lg border border-slate-200 hover:bg-brand-light text-brand-blue transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(inv)}
                            title="Share Invoice + Razorpay Link on WhatsApp"
                            className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {inv.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv)}
                              title="Mark as Paid"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            title="Delete Invoice"
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

      {/* ─── CREATE GST INVOICE / PROFORMA MODAL ───────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-brand-blue" />
                <div>
                  <h2 className="text-base font-extrabold">
                    Create GST Tax Invoice / Proforma Quotation
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Auto-calculates HSN line items, 9% CGST + 9% SGST (Uttar Pradesh) or 18% IGST (Inter-state)
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

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Top Row: Document Type + Quick Auto-fill from B2B Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDocType('tax_invoice')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        docType === 'tax_invoice'
                          ? 'bg-brand-navy text-white border-brand-navy'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      GST Tax Invoice (INV)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType('proforma_quote')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        docType === 'proforma_quote'
                          ? 'bg-brand-navy text-white border-brand-navy'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Proforma Quote (QTN)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quick Auto-Fill from B2B GST Directory (Optional)
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
              </div>

              {/* Client & GST Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. RS Electricals Pvt. Ltd."
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
                    placeholder="e.g. 07AABCR1234F1Z5"
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
                    placeholder="e.g. Rajesh Sharma"
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
                    placeholder="+91 98112 45678"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Due Date
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
                    HSN / SAC Line Items
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
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          required
                          value={row.description}
                          onChange={(e) =>
                            handleUpdateItemRow(idx, 'description', e.target.value)
                          }
                          placeholder="Item / Service description"
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
                  ))}
                </div>
              </div>

              {/* Tax Configuration & Live Calculation Box */}
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
                        <option value={28}>28% Luxury/Industrial GST</option>
                        <option value={0}>0% Exempt / LUT Export</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Terms &amp; Dispatch Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Live GST Summary Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Sub-Total:</span>
                      <span>₹{subTotalPreview.toLocaleString('en-IN')}</span>
                    </div>
                    {discountNum > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span>- ₹{discountNum.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span>Taxable Value:</span>
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
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                      Grand Total (INR)
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
                  Generate &amp; Save to MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE GST TAX INVOICE PREVIEW MODAL ──────────── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Top Action Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-brand-blue">
                  {selectedInvoice.invoiceNumber}
                </span>
                <span className="text-xs text-slate-400">
                  ·{' '}
                  {selectedInvoice.docType === 'proforma_quote'
                    ? 'PROFORMA QUOTATION'
                    : 'TAX INVOICE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPaymentLink(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                >
                  {copiedId === selectedInvoice.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Razorpay Link
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Payment Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Share on WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-blue-600 text-xs font-bold text-white"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800">
              {/* Seller & Buyer Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-brand-blue">
                    {selectedInvoice.docType === 'proforma_quote'
                      ? 'Original Proforma Quotation'
                      : 'Tax Invoice (Rule 46 CGST Rules)'}
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
                    Invoice Number
                  </div>
                  <div className="text-lg font-mono font-extrabold text-brand-navy">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500">
                    Place of Supply:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedInvoice.placeOfSupply}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Due Date:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedInvoice.dueDate || 'Immediate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Billed To (Buyer)
                  </div>
                  <div className="text-base font-extrabold text-brand-navy mt-0.5">
                    {selectedInvoice.clientName}
                  </div>
                  {selectedInvoice.contactPerson && (
                    <div className="text-xs text-slate-600">
                      Attn: {selectedInvoice.contactPerson}{' '}
                      {selectedInvoice.phone ? `(${selectedInvoice.phone})` : ''}
                    </div>
                  )}
                  <div className="text-xs font-mono text-slate-600 mt-1">
                    Buyer GSTIN:{' '}
                    <span className="font-bold">
                      {selectedInvoice.gstin || 'Unregistered'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right flex flex-col justify-between">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                        STATUS_BADGE[selectedInvoice.status]?.className
                      }`}
                    >
                      {STATUS_BADGE[selectedInvoice.status]?.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Payment Link:{' '}
                    <span className="font-mono text-brand-blue">
                      {selectedInvoice.paymentLink}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized HSN Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4">HSN/SAC</th>
                      <th className="py-3 px-4 text-right">Qty</th>
                      <th className="py-3 px-4 text-right">Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.items.map((item, idx) => (
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

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="text-xs text-slate-500 space-y-2">
                  <div className="font-bold text-slate-700 uppercase">
                    Terms &amp; Bank Details
                  </div>
                  <p>{selectedInvoice.notes}</p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600">
                    Bank: HDFC Bank, Noida Electronic City Branch
                    <br />
                    A/C: 50200088515208 · IFSC: HDFC0001245
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub-Total:</span>
                    <span>₹{selectedInvoice.subTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>
                        - ₹{selectedInvoice.discount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Taxable Value:</span>
                    <span>
                      ₹{selectedInvoice.taxableAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedInvoice.taxType === 'cgst_sgst' ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST ({selectedInvoice.gstRate / 2}%):</span>
                        <span>
                          ₹{selectedInvoice.cgstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST ({selectedInvoice.gstRate / 2}%):</span>
                        <span>
                          ₹{selectedInvoice.sgstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST ({selectedInvoice.gstRate}%):</span>
                      <span>
                        ₹{selectedInvoice.igstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-slate-200 flex justify-between text-base font-extrabold text-brand-navy">
                    <span>Grand Total (INR):</span>
                    <span>
                      ₹{selectedInvoice.grandTotal.toLocaleString('en-IN')}
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

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
  Package,
  BellRing,
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
  Building2,
  Receipt,
  Sparkles,
  Printer,
  Wallet,
  Banknote,
  Landmark,
} from 'lucide-react';
import {
  fetchInvoices,
  createInvoice,
  markInvoicePaid,
  recordInvoicePaymentApi,
  deleteInvoicePaymentApi,
  deleteInvoice,
  seedInvoices,
  exportGstr1CsvApi,
  convertQuoteToInvoiceApi,
} from '@/lib/invoices-api';
import { fetchProductsApi } from '@/lib/products-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  Invoice,
  InvoiceStats,
  InvoiceDocType,
  InvoiceStatus,
  InvoicePaymentMode,
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
    label: 'Paid in Full',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  partial: {
    label: 'Partially Paid',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
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

function getInvoiceSettlement(inv: Invoice) {
  const grandTotal = Math.max(0, Number(inv.grandTotal) || 0);
  const amountPaid =
    inv.amountPaid !== undefined
      ? Math.max(0, Number(inv.amountPaid) || 0)
      : inv.status === 'paid'
        ? grandTotal
        : 0;
  const tdsDeducted = Math.max(0, Number(inv.tdsDeducted) || 0);
  const totalSettled =
    inv.totalSettled !== undefined
      ? Math.max(0, Number(inv.totalSettled) || 0)
      : amountPaid + tdsDeducted;
  const balanceDue =
    inv.balanceDue !== undefined
      ? Math.max(0, Number(inv.balanceDue) || 0)
      : Math.max(0, grandTotal - totalSettled);
  const progressPct =
    grandTotal > 0 ? Math.min(100, Math.round((totalSettled / grandTotal) * 100)) : 0;
  return { grandTotal, amountPaid, tdsDeducted, totalSettled, balanceDue, progressPct };
}

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
  const [catalogProducts, setCatalogProducts] = useState<
    import('@/types/contracts').Product[]
  >([]);
  const [agingFilter, setAgingFilter] = useState<
    'all' | 'current' | '1_15_days' | '16_30_days' | '30_plus_days'
  >('all');
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);
  const [copiedPublicId, setCopiedPublicId] = useState<string | null>(null);
  const [linkedDealId, setLinkedDealId] = useState('');
  const [linkedLeadId, setLinkedLeadId] = useState('');

  useEffect(() => {
    fetchProductsApi()
      .then((res) => setCatalogProducts(res.data || []))
      .catch(() => {});
  }, []);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Record Payment / TDS Modal State
  const [paymentModalInv, setPaymentModalInv] = useState<Invoice | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [tdsInput, setTdsInput] = useState<string>('0');
  const [payModeInput, setPayModeInput] = useState<InvoicePaymentMode>('NEFT');
  const [utrInput, setUtrInput] = useState<string>('');
  const [payDateInput, setPayDateInput] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [payNoteInput, setPayNoteInput] = useState<string>('');

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
    const prefillDocType = searchParams.get('docType');
    const prefillDealId = searchParams.get('dealId');
    const prefillLeadId = searchParams.get('leadId');
    const prefillEmail = searchParams.get('email');
    const prefillCity = searchParams.get('city');

    if (prefillClient) {
      setClientName(prefillClient);
      if (prefillDocType === 'proforma_quote' || prefillDocType === 'tax_invoice') {
        setDocType(prefillDocType);
      }
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
        else if (c.includes('mumbai') || c.includes('pune') || c.includes('thane'))
          setPlaceOfSupply('27 - Maharashtra');
        else if (c.includes('bengaluru') || c.includes('bangalore'))
          setPlaceOfSupply('29 - Karnataka');
        else if (c.includes('jaipur')) setPlaceOfSupply('08 - Rajasthan');
        else if (c.includes('ahmedabad') || c.includes('surat'))
          setPlaceOfSupply('24 - Gujarat');
        else if (c.includes('chennai')) setPlaceOfSupply('33 - Tamil Nadu');
        else setPlaceOfSupply('09 - Uttar Pradesh');
      }
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
        linkedDealId: linkedDealId || undefined,
        linkedLeadId: linkedLeadId || undefined,
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

  const openPaymentModal = (inv: Invoice) => {
    const settlement = getInvoiceSettlement(inv);
    setPaymentModalInv(inv);
    setPayAmountInput(String(settlement.balanceDue));
    setTdsInput('0');
    setPayModeInput('NEFT');
    setUtrInput('');
    setPayDateInput(new Date().toISOString().slice(0, 10));
    setPayNoteInput(
      settlement.totalSettled > 0 ? 'Balance Dispatch Settlement' : '30% Advance / Milestone',
    );
  };

  const applyMilestonePreset = (inv: Invoice, pct: number, tdsPct = 0) => {
    const settlement = getInvoiceSettlement(inv);
    const grossTarget =
      pct >= 100
        ? settlement.balanceDue
        : Math.min(
            settlement.balanceDue,
            Math.round((inv.grandTotal * pct) / 100),
          );
    const tdsBase =
      pct >= 100
        ? Math.round((inv.taxableAmount * tdsPct) / 100)
        : Math.round((inv.taxableAmount * (pct / 100) * tdsPct) / 100);
    const safeTds = Math.min(grossTarget, Math.max(0, tdsBase));
    const netCash = Math.max(0, grossTarget - safeTds);
    setPayAmountInput(String(netCash));
    setTdsInput(String(safeTds));
    setPayNoteInput(
      pct >= 100
        ? tdsPct > 0
          ? `Full Settlement minus ${tdsPct}% TDS`
          : 'Full Settlement'
        : `${pct}% Milestone${tdsPct > 0 ? ` minus ${tdsPct}% TDS` : ''}`,
    );
  };

  const applyTdsDeductionHelper = (inv: Invoice, tdsPct: number) => {
    const settlement = getInvoiceSettlement(inv);
    const currentCash = Math.max(0, Number(payAmountInput) || 0);
    const currentTds = Math.max(0, Number(tdsInput) || 0);
    const currentGross = Math.min(settlement.balanceDue, currentCash + currentTds || settlement.balanceDue);
    const suggestedTds =
      tdsPct <= 0
        ? 0
        : Math.min(
            currentGross,
            Math.round((inv.taxableAmount * tdsPct) / 100),
          );
    setTdsInput(String(suggestedTds));
    setPayAmountInput(String(Math.max(0, currentGross - suggestedTds)));
  };

  const handleRecordPaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentModalInv) return;
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const updated = await recordInvoicePaymentApi(paymentModalInv.id, {
        amountPaid: Math.max(0, Number(payAmountInput) || 0),
        tdsDeducted: Math.max(0, Number(tdsInput) || 0),
        paymentMode: payModeInput,
        utrOrChequeNo: utrInput.trim(),
        paymentDate: payDateInput,
        note: payNoteInput.trim(),
      });
      setPaymentModalInv(updated);
      if (selectedInvoice?.id === updated.id) {
        setSelectedInvoice(updated);
      }
      await loadInvoices();
      const s = getInvoiceSettlement(updated);
      setReminderToast(
        s.balanceDue <= 0
          ? `${updated.invoiceNumber} is now PAID IN FULL (including ₹${s.tdsDeducted.toLocaleString('en-IN')} TDS credit)!`
          : `Recorded payment on ${updated.invoiceNumber}. Remaining Balance Due: ₹${s.balanceDue.toLocaleString('en-IN')}.`,
      );
      setTimeout(() => setReminderToast(null), 4000);
      if (s.balanceDue <= 0) {
        setPaymentModalInv(null);
      } else {
        setPayAmountInput(String(s.balanceDue));
        setTdsInput('0');
        setUtrInput('');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleReversePayment = async (inv: Invoice, paymentId: string) => {
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const updated = await deleteInvoicePaymentApi(inv.id, paymentId);
      if (paymentModalInv?.id === inv.id) setPaymentModalInv(updated);
      if (selectedInvoice?.id === inv.id) setSelectedInvoice(updated);
      await loadInvoices();
      setReminderToast(`Reversed payment ledger entry on ${updated.invoiceNumber}.`);
      setTimeout(() => setReminderToast(null), 3500);
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
    const waPhone = resolveWhatsAppPhone(inv.phone);
    const docLabel =
      inv.docType === 'proforma_quote' ? 'Proforma Quotation' : 'GST Tax Invoice';
    const publicUrl =
      inv.publicToken && typeof window !== 'undefined'
        ? `${window.location.origin}/quote/${inv.publicToken}`
        : '';
    const portalSection = publicUrl
      ? `\n\nView & Approve Online:\n${publicUrl}`
      : '';
    const text = encodeURIComponent(
      `Namaste ${inv.contactPerson || inv.clientName},\n\nHere is your ${docLabel} *${inv.invoiceNumber}* from *${tenant?.name || 'Leadsetu Technologies'}* (Noida Electronic City).\n\n• Taxable Amount: ₹${inv.taxableAmount.toLocaleString('en-IN')}\n• GST (${inv.gstRate}%): ₹${inv.gstAmount.toLocaleString('en-IN')}\n• *Grand Total: ₹${inv.grandTotal.toLocaleString('en-IN')}*\n• Due Date: ${inv.dueDate || 'Immediate'}${portalSection}\n\nPay securely via Razorpay / UPI:\n${inv.paymentLink || 'https://rzp.io/i/leadsetu'}`,
    );
    const base = waPhone ? `https://wa.me/${waPhone}` : 'https://wa.me/';
    window.open(`${base}?text=${text}`, '_blank');
  };

  const handleCopyPublicLink = async (inv: Invoice) => {
    if (!inv.publicToken || typeof window === 'undefined') return;
    const url = `${window.location.origin}/quote/${inv.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPublicId(inv.id);
      setReminderToast(`Copied public buyer link for ${inv.invoiceNumber}.`);
      setTimeout(() => setCopiedPublicId(null), 2000);
      setTimeout(() => setReminderToast(null), 3200);
    } catch {
      setErrorMsg('Clipboard copy failed.');
    }
  };

  const handleConvertToInvoice = async (inv: Invoice) => {
    setIsMutating(true);
    setErrorMsg(null);
    try {
      const res = await convertQuoteToInvoiceApi(inv.id);
      await loadInvoices();
      setSelectedInvoice(res.invoice);
      setReminderToast(
        res.alreadyConverted
          ? `Opened existing Tax Invoice ${res.invoice.invoiceNumber} linked to ${inv.invoiceNumber}.`
          : `Converted Proforma Quote ${inv.invoiceNumber} into GST Tax Invoice ${res.invoice.invoiceNumber}!`,
      );
      setTimeout(() => setReminderToast(null), 4000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const resolveWhatsAppPhone = (raw?: string): string => {
    if (!raw || raw.includes('*')) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.length >= 11) return digits;
    return '';
  };

  const buildOverdueReminderText = (inv: Invoice): string => {
    const recipient = inv.contactPerson || inv.clientName;
    const sender = tenant?.name || 'Leadsetu Technologies';
    const docLabel =
      inv.docType === 'proforma_quote' ? 'Proforma Quote' : 'GST Tax Invoice';
    const overdueDays = inv.daysOverdue ?? 0;
    const dueSummary =
      overdueDays > 0
        ? `is pending for *${overdueDays} day(s)* past its due date (${inv.dueDate || 'Immediate'}).`
        : `is scheduled for payment by *${inv.dueDate || 'Immediate'}*.`;

    const itemsList = (inv.items || []).slice(0, 2);
    const itemsSummary =
      itemsList.length > 0
        ? itemsList
            .map((i) => `${i.description} (x${i.quantity})`)
            .join(', ') +
          (inv.items.length > 2 ? ` + ${inv.items.length - 2} more` : '')
        : 'B2B Goods / Services';

    const payUrl =
      inv.paymentLink ||
      `https://rzp.io/i/leadsetu-${inv.invoiceNumber.toLowerCase()}`;

    const taxSummary =
      inv.taxType === 'cgst_sgst'
        ? `CGST+SGST (${inv.gstRate}%): ₹${inv.gstAmount.toLocaleString('en-IN')}`
        : `IGST (${inv.gstRate}%): ₹${inv.gstAmount.toLocaleString('en-IN')}`;
    const settlement = getInvoiceSettlement(inv);
    const settlementLines =
      settlement.totalSettled > 0
        ? [
            `• Grand Total: ₹${settlement.grandTotal.toLocaleString('en-IN')}`,
            `• Received + TDS So Far: ₹${settlement.totalSettled.toLocaleString('en-IN')}`,
            `• *Remaining Balance Due: ₹${settlement.balanceDue.toLocaleString('en-IN')}*`,
          ]
        : [
            `• *Total Payable: ₹${settlement.balanceDue.toLocaleString('en-IN')}*`,
          ];

    return [
      `Namaste ${recipient} Ji,`,
      ``,
      `Gentle payment reminder from *${sender}* regarding ${docLabel} *${inv.invoiceNumber}*, which ${dueSummary}`,
      ``,
      `*Invoice Summary:*`,
      `• Items: ${itemsSummary}`,
      `• Taxable Value: ₹${inv.taxableAmount.toLocaleString('en-IN')}`,
      `• ${taxSummary}`,
      ...settlementLines,
      ``,
      `*Pay Instantly via UPI / Razorpay:*`,
      `${payUrl}`,
      ``,
      `Kindly share a screenshot / UTR once settled. Thank you for your continued business!`,
    ].join('\n');
  };

  const handleSendUdhaarReminder = (inv: Invoice) => {
    const waPhone = resolveWhatsAppPhone(inv.phone);
    const message = buildOverdueReminderText(inv);
    const base = waPhone ? `https://wa.me/${waPhone}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(message)}`, '_blank');
    setReminderToast(
      `Opened pre-formatted WhatsApp reminder for ${inv.invoiceNumber} (${inv.clientName}).`,
    );
    setTimeout(() => setReminderToast(null), 3500);
  };

  const handleCopyReminderText = async (inv: Invoice) => {
    const message = buildOverdueReminderText(inv);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedReminderId(inv.id);
      setTimeout(() => setCopiedReminderId(null), 2000);
    } catch {
      setErrorMsg('Unable to copy reminder text to clipboard.');
    }
  };

  const handleExportGstr1 = async () => {
    setIsExportingCsv(true);
    setErrorMsg(null);
    try {
      const res = await exportGstr1CsvApi();
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        res.filename ||
        `Leadsetu-GSTR1-Tally-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsExportingCsv(false);
    }
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

  const visibleInvoices =
    agingFilter === 'all'
      ? invoices
      : invoices.filter((inv) => inv.agingBucket === agingFilter);

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
            onClick={handleExportGstr1}
            disabled={isExportingCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-all"
          >
            {isExportingCsv ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            ) : (
              <Download className="w-4 h-4 text-emerald-700" />
            )}
            Export CA GSTR-1 / Tally CSV
          </button>

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

      {reminderToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {reminderToast}
          </span>
          <button
            type="button"
            onClick={() => setReminderToast(null)}
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
            <span>Collected + TDS Credit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ₹{stats.paidRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-emerald-700">{stats.paidCount}</span> settled
            {(stats.totalTdsDeducted ?? 0) > 0
              ? ` · TDS ₹${(stats.totalTdsDeducted ?? 0).toLocaleString('en-IN')}`
              : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Balance Due (AR)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            ₹{stats.pendingAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-bold text-sky-700">{stats.partialCount ?? 0}</span> partial ·{' '}
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

      {/* Udhaar / GST Credit Aging Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
              Udhaar / Credit Aging Tracker (Remaining Balance Due)
            </h2>
            <span className="text-[11px] text-slate-400">
              Calculated strictly on unpaid balances after advance &amp; TDS deductions
            </span>
          </div>
          {agingFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setAgingFilter('all')}
              className="text-[11px] font-bold text-brand-blue hover:underline"
            >
              Show All Invoices
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              key: 'current' as const,
              label: 'Current / Not Due',
              amount: stats.aging?.currentAmount ?? 0,
              tone: 'border-emerald-200 bg-emerald-50/60 text-emerald-800',
              activeTone: 'ring-2 ring-emerald-500 border-emerald-400',
            },
            {
              key: '1_15_days' as const,
              label: '1–15 Days Overdue',
              amount: stats.aging?.bucket1to15 ?? 0,
              tone: 'border-amber-200 bg-amber-50/70 text-amber-800',
              activeTone: 'ring-2 ring-amber-500 border-amber-400',
            },
            {
              key: '16_30_days' as const,
              label: '16–30 Days Overdue',
              amount: stats.aging?.bucket16to30 ?? 0,
              tone: 'border-orange-200 bg-orange-50/70 text-orange-800',
              activeTone: 'ring-2 ring-orange-500 border-orange-400',
            },
            {
              key: '30_plus_days' as const,
              label: '30+ Days Critical',
              amount: stats.aging?.bucket30Plus ?? 0,
              tone: 'border-rose-200 bg-rose-50/80 text-rose-800',
              activeTone: 'ring-2 ring-rose-500 border-rose-400',
            },
          ].map((bucket) => {
            const isActive = agingFilter === bucket.key;
            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() =>
                  setAgingFilter(isActive ? 'all' : bucket.key)
                }
                className={`text-left rounded-xl p-3 border transition-all ${bucket.tone} ${
                  isActive ? bucket.activeTone : 'hover:opacity-90'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                  {bucket.label}
                </div>
                <div className="text-lg font-extrabold mt-1">
                  ₹{bucket.amount.toLocaleString('en-IN')}
                </div>
              </button>
            );
          })}
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
            <option value="partial">Partially Paid (Advance / TDS)</option>
            <option value="paid">Paid in Full</option>
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
                {visibleInvoices.map((inv) => {
                  const badge = STATUS_BADGE[inv.status] || STATUS_BADGE.sent;
                  const daysOverdue = inv.daysOverdue ?? 0;
                  const settlement = getInvoiceSettlement(inv);
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
                        {inv.docType === 'proforma_quote' && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.quoteApprovalStatus === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.quoteApprovalStatus === 'changes_requested'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {inv.quoteApprovalStatus === 'approved'
                                ? 'Buyer Approved'
                                : inv.quoteApprovalStatus === 'changes_requested'
                                  ? 'Revision Requested'
                                  : 'Awaiting Approval'}
                            </span>
                            {inv.convertedToInvoiceId && (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Converted
                              </span>
                            )}
                          </div>
                        )}
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

                      <td className="py-4 px-4">
                        <div className="font-extrabold text-brand-navy">
                          ₹{settlement.grandTotal.toLocaleString('en-IN')}
                        </div>
                        {settlement.totalSettled > 0 && settlement.balanceDue > 0 ? (
                          <div className="mt-1.5 space-y-1 min-w-[160px]">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[10px] font-bold text-sky-800">
                              <span>
                                ₹{settlement.totalSettled.toLocaleString('en-IN')} / ₹
                                {settlement.grandTotal.toLocaleString('en-IN')}
                              </span>
                              <span className="text-sky-600">({settlement.progressPct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full transition-all"
                                style={{ width: `${settlement.progressPct}%` }}
                              />
                            </div>
                            <div className="text-[10px] font-bold text-amber-700">
                              Bal Due: ₹{settlement.balanceDue.toLocaleString('en-IN')}
                              {settlement.tdsDeducted > 0 && (
                                <span className="text-slate-500 font-semibold">
                                  {' '}
                                  · TDS ₹{settlement.tdsDeducted.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : settlement.balanceDue > 0 ? (
                          <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                            Due: ₹{settlement.balanceDue.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          settlement.tdsDeducted > 0 && (
                            <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                              Paid ₹{settlement.amountPaid.toLocaleString('en-IN')} + TDS ₹
                              {settlement.tdsDeducted.toLocaleString('en-IN')}
                            </div>
                          )
                        )}
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
                        {inv.status !== 'paid' && daysOverdue > 0 && (
                          <div className="text-[10px] font-extrabold text-rose-600 mt-1">
                            {daysOverdue}d overdue
                          </div>
                        )}
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

                          {inv.publicToken && (
                            <a
                              href={`/quote/${inv.publicToken}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Open Public Shareable Quote Portal"
                              className="p-2 rounded-lg border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {inv.docType === 'proforma_quote' &&
                            !inv.convertedToInvoiceId && (
                              <button
                                type="button"
                                disabled={isMutating}
                                onClick={() => handleConvertToInvoice(inv)}
                                title="1-Click Convert Proforma Quote to GST Tax Invoice"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>To Invoice</span>
                              </button>
                            )}

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
                              onClick={() => handleSendUdhaarReminder(inv)}
                              title="1-Click WhatsApp Overdue Reminder (Invoice Summary + UPI Link)"
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                                inv.status === 'overdue' || (inv.daysOverdue ?? 0) > 0
                                  ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                  : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800'
                              }`}
                            >
                              <BellRing className="w-3 h-3" />
                              <span>
                                {inv.status === 'overdue' || (inv.daysOverdue ?? 0) > 0
                                  ? 'Overdue Remind'
                                  : 'Remind'}
                              </span>
                            </button>
                          )}

                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(inv)}
                              title="Record Partial / Advance Payment & TDS (AR Ledger)"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-blue hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
                            >
                              <Wallet className="w-3 h-3" />
                              <span>Pay / TDS</span>
                            </button>
                          )}

                          {inv.status === 'paid' && (inv.payments?.length ?? 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(inv)}
                              title="View Accounts Receivable Payment & TDS Ledger"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors"
                            >
                              <Landmark className="w-3 h-3" />
                              <span>Ledger</span>
                            </button>
                          )}

                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv)}
                              title="Settle Full Remaining Balance as Paid"
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

              <div className="flex flex-wrap items-center gap-2">
                {selectedInvoice.docType === 'proforma_quote' &&
                  !selectedInvoice.convertedToInvoiceId && (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => handleConvertToInvoice(selectedInvoice)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-extrabold text-white disabled:opacity-60"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Convert → Tax Invoice
                    </button>
                  )}

                {selectedInvoice.publicToken && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyPublicLink(selectedInvoice)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                    >
                      {copiedPublicId === selectedInvoice.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Quote Link
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-300" /> Copy Public Quote Link
                        </>
                      )}
                    </button>
                    <a
                      href={`/quote/${selectedInvoice.publicToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                      title="Open Buyer Quote Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}

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

                {selectedInvoice.status !== 'paid' &&
                  selectedInvoice.status !== 'cancelled' && (
                    <>
                      <button
                        type="button"
                        onClick={() => openPaymentModal(selectedInvoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-extrabold text-slate-950"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Record Payment / TDS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendUdhaarReminder(selectedInvoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-xs font-extrabold text-slate-950"
                      >
                        <BellRing className="w-3.5 h-3.5" /> 1-Click Overdue Reminder
                      </button>
                    </>
                  )}

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

              {/* Pre-Formatted WhatsApp Overdue Reminder Box */}
              {selectedInvoice.status !== 'paid' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-xs font-extrabold text-amber-900">
                      <BellRing className="w-4 h-4 text-amber-600" />
                      <span>
                        Pre-Formatted Polite Payment Reminder (Invoice Summary + UPI Link)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyReminderText(selectedInvoice)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                      >
                        {copiedReminderId === selectedInvoice.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copied Message
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Reminder Text
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendUdhaarReminder(selectedInvoice)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold text-white"
                      >
                        <MessageSquare className="w-3 h-3" /> Send via WhatsApp
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-700 bg-white/90 rounded-xl p-3 border border-amber-200/70 leading-relaxed">
                    {buildOverdueReminderText(selectedInvoice)}
                  </pre>
                </div>
              )}

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
                  {(() => {
                    const s = getInvoiceSettlement(selectedInvoice);
                    return (
                      <>
                        {s.amountPaid > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Amount Received:</span>
                            <span>- ₹{s.amountPaid.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {s.tdsDeducted > 0 && (
                          <div className="flex justify-between text-indigo-700 font-semibold">
                            <span>TDS Deducted (u/s 194C/J):</span>
                            <span>- ₹{s.tdsDeducted.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold">
                          <span
                            className={
                              s.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }
                          >
                            Balance Due (INR):
                          </span>
                          <span
                            className={
                              s.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }
                          >
                            ₹{s.balanceDue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {(selectedInvoice.payments?.length ?? 0) > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-navy inline-flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-brand-blue" /> Accounts Receivable Ledger (Payments &amp; TDS Tranches)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {selectedInvoice.payments?.length} entry(s)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3">UTR / Cheque #</th>
                          <th className="py-2 px-3 text-right">Amount Paid</th>
                          <th className="py-2 px-3 text-right">TDS</th>
                          <th className="py-2 px-3 text-right">Settled</th>
                          <th className="py-2 px-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.payments?.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono text-slate-600">{p.paymentDate}</td>
                            <td className="py-2 px-3 font-bold text-slate-700">{p.paymentMode}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {p.utrOrChequeNo || '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              ₹{p.amountPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-indigo-700">
                              ₹{p.tdsDeducted.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right font-extrabold text-brand-navy">
                              ₹{p.totalSettled.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{p.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── RECORD PAYMENT / TDS (ACCOUNTS RECEIVABLE LEDGER) MODAL ─── */}
      {paymentModalInv && (() => {
        const s = getInvoiceSettlement(paymentModalInv);
        const draftCash = Math.max(0, Math.round(Number(payAmountInput) || 0));
        const draftTds = Math.max(0, Math.round(Number(tdsInput) || 0));
        const draftEntryTotal = draftCash + draftTds;
        const projectedBalance = s.balanceDue - draftEntryTotal;
        const isOverpay = draftEntryTotal > s.balanceDue;
        const isZero = draftEntryTotal <= 0;
        const projectedPct =
          s.grandTotal > 0
            ? Math.min(
                100,
                Math.round(((s.totalSettled + Math.max(0, draftEntryTotal)) / s.grandTotal) * 100),
              )
            : 0;

        return (
          <div className="fixed inset-0 z-[60] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
              <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-5 h-5 text-sky-400" />
                  <div>
                    <h2 className="text-base font-extrabold">
                      Record Payment / TDS · {paymentModalInv.invoiceNumber}
                    </h2>
                    <p className="text-[11px] text-slate-300">
                      {paymentModalInv.clientName} · Partial Advances, Milestone Receipts &amp; u/s 194C/194J TDS
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentModalInv(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
                {/* Live AR Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Grand Total
                    </div>
                    <div className="text-sm font-extrabold text-brand-navy mt-0.5">
                      ₹{s.grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Cash Received
                    </div>
                    <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                      ₹{s.amountPaid.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <div className="text-[10px] font-bold uppercase text-indigo-700">
                      TDS Deducted
                    </div>
                    <div className="text-sm font-extrabold text-indigo-700 mt-0.5">
                      ₹{s.tdsDeducted.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                    <div className="text-[10px] font-bold uppercase text-amber-800">
                      Balance Due
                    </div>
                    <div className="text-sm font-extrabold text-amber-800 mt-0.5">
                      ₹{s.balanceDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {s.balanceDue > 0 && (
                  <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                    {/* Milestone & TDS Quick Presets */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                          Quick Indian B2B Milestone Presets
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyMilestonePreset(paymentModalInv, 30, 0)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-[11px] font-bold text-slate-700"
                          >
                            30% Advance
                          </button>
                          <button
                            type="button"
                            onClick={() => applyMilestonePreset(paymentModalInv, 50, 0)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-[11px] font-bold text-slate-700"
                          >
                            50% Dispatch
                          </button>
                          <button
                            type="button"
                            onClick={() => applyMilestonePreset(paymentModalInv, 100, 0)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800"
                          >
                            Full Balance
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70">
                        <span className="text-[11px] font-bold text-indigo-700">
                          Apply TDS Deduction (on Taxable ₹
                          {paymentModalInv.taxableAmount.toLocaleString('en-IN')}):
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[0, 2, 10].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => applyTdsDeductionHelper(paymentModalInv, pct)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-[11px] font-bold text-indigo-800"
                            >
                              {pct === 0
                                ? 'No TDS (0%)'
                                : `-${pct}% TDS (${pct === 2 ? '194C' : '194J'})`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Amount Paid / Received (₹) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={payAmountInput}
                          onChange={(e) => setPayAmountInput(e.target.value)}
                          placeholder="e.g. 150000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-brand-navy"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          TDS Deducted by Buyer (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={tdsInput}
                          onChange={(e) => setTdsInput(e.target.value)}
                          placeholder="0"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-indigo-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Payment Mode *
                        </label>
                        <select
                          value={payModeInput}
                          onChange={(e) =>
                            setPayModeInput(e.target.value as InvoicePaymentMode)
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white"
                        >
                          <option value="NEFT">NEFT (Bank Transfer)</option>
                          <option value="RTGS">RTGS (High-Value RTGS)</option>
                          <option value="UPI">UPI / Corporate QR</option>
                          <option value="Cheque">Cheque / Demand Draft</option>
                          <option value="Razorpay">Razorpay Payment Link</option>
                          <option value="Cash">Cash Receipt</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          UTR Number / Cheque No.
                        </label>
                        <input
                          type="text"
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value)}
                          placeholder={
                            payModeInput === 'Cheque'
                              ? 'e.g. CHQ #458912 (HDFC)'
                              : 'e.g. UTR431988120945'
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={payDateInput}
                          onChange={(e) => setPayDateInput(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Milestone / Ledger Remark
                        </label>
                        <input
                          type="text"
                          value={payNoteInput}
                          onChange={(e) => setPayNoteInput(e.target.value)}
                          placeholder="e.g. 30% Advance, Balance on Delivery"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Live Balance Due Projection Box */}
                    <div
                      className={`rounded-2xl p-4 border space-y-2 ${
                        isOverpay
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className={isOverpay ? 'text-rose-700' : 'text-slate-300'}>
                          This Entry Settled (₹{draftCash.toLocaleString('en-IN')} Paid + ₹
                          {draftTds.toLocaleString('en-IN')} TDS):
                        </span>
                        <span className="font-extrabold">
                          ₹{draftEntryTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${projectedPct}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <span>
                          {isOverpay
                            ? 'Entry exceeds remaining Balance Due!'
                            : projectedBalance <= 0
                              ? 'Will mark invoice PAID IN FULL'
                              : `Projected Settlement: ${projectedPct}%`}
                        </span>
                        <span className="text-sm font-extrabold">
                          Live Balance Due After Entry: ₹
                          {Math.max(0, projectedBalance).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setPaymentModalInv(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isMutating || isOverpay || isZero}
                        className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                      >
                        {isMutating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Banknote className="w-4 h-4" />
                        )}
                        Save Payment to AR Ledger
                      </button>
                    </div>
                  </form>
                )}

                {/* Existing AR Payment Ledger History */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-navy inline-flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-brand-blue" /> Recorded Receipts &amp; TDS History
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {paymentModalInv.payments?.length ?? 0} tranche(s)
                    </span>
                  </div>

                  {(paymentModalInv.payments?.length ?? 0) === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400">
                      No partial receipts or TDS entries recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {paymentModalInv.payments?.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50"
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-brand-navy">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                                {p.paymentMode}
                              </span>
                              <span>{p.paymentDate}</span>
                              {p.utrOrChequeNo && (
                                <span className="font-mono text-[11px] text-slate-500">
                                  · {p.utrOrChequeNo}
                                </span>
                              )}
                            </div>
                            {p.note && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{p.note}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-extrabold text-emerald-700">
                                + ₹{p.amountPaid.toLocaleString('en-IN')}
                              </div>
                              {p.tdsDeducted > 0 && (
                                <div className="text-[10px] font-bold text-indigo-700">
                                  + ₹{p.tdsDeducted.toLocaleString('en-IN')} TDS
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => handleReversePayment(paymentModalInv, p.id)}
                              title="Reverse / Remove this ledger entry"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

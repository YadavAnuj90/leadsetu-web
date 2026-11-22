'use client';

import { useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ScrollText,
  LifeBuoy,
  QrCode,
  ExternalLink,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Wallet,
  CreditCard,
  Copy,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  createPortalTicketApi,
  fetchPublicBuyerPortalApi,
  replyPortalTicketApi,
  respondToPortalQuoteApi,
  submitPortalPaymentIntentApi,
} from '@/lib/portal-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  BuyerPortalData,
  PortalInvoiceItem,
  PortalPaymentIntentResponse,
  PortalQuotationItem,
} from '@/types/contracts';

type PortalTab = 'quotations' | 'invoices' | 'tickets';

export default function BuyerMagicPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || '';

  const [data, setData] = useState<BuyerPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('quotations');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Quote approval/revision state
  const [quoteActionId, setQuoteActionId] = useState<string | null>(null);
  const [quoteBuyerName, setQuoteBuyerName] = useState('');
  const [quoteRemark, setQuoteRemark] = useState('');

  // UPI / Payment Intent modal
  const [payInvoice, setPayInvoice] = useState<PortalInvoiceItem | null>(null);
  const [payMode, setPayMode] = useState<'UPI' | 'NEFT' | 'RTGS' | 'Razorpay'>('UPI');
  const [payAmount, setPayAmount] = useState('');
  const [payUtr, setPayUtr] = useState('');
  const [payPromisedDate, setPayPromisedDate] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payBusy, setPayBusy] = useState(false);
  const [payIntentRes, setPayIntentRes] = useState<PortalPaymentIntentResponse | null>(
    null,
  );
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Support ticket state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<
    'dispatch_delay' | 'warranty' | 'gst_correction' | 'installation' | 'amc_service' | 'general'
  >('dispatch_delay');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(
    'medium',
  );
  const [ticketInvoiceNo, setTicketInvoiceNo] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketBusy, setTicketBusy] = useState(false);
  const [replyTextByTicket, setReplyTextByTicket] = useState<Record<string, string>>({});
  const [replyBusyId, setReplyBusyId] = useState<string | null>(null);

  const loadPortal = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPublicBuyerPortalApi(token);
      setData(res);
      setQuoteBuyerName(res.buyer.name || res.buyer.company);
      if (res.focusDocId) {
        setExpandedDocId(res.focusDocId);
        const isInv = res.invoices.some((i) => i.id === res.focusDocId);
        setActiveTab(isInv ? 'invoices' : 'quotations');
      } else if (res.quotations.length === 0 && res.invoices.length > 0) {
        setActiveTab('invoices');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadPortal();
  }, [loadPortal]);

  const creditUtilPct = useMemo(() => {
    if (!data || !data.buyer.creditLimitInr) return 0;
    return Math.min(
      100,
      Math.round((data.buyer.openBalanceInr / data.buyer.creditLimitInr) * 100),
    );
  }, [data]);

  const handleQuoteDecision = async (
    quote: PortalQuotationItem,
    decision: 'approved' | 'changes_requested',
  ) => {
    setQuoteActionId(quote.id);
    setNotice(null);
    try {
      const updated = await respondToPortalQuoteApi(token, quote.id, {
        decision,
        buyerName: quoteBuyerName.trim() || data?.buyer.name,
        remark: quoteRemark.trim() || undefined,
      });
      setData(updated);
      setQuoteRemark('');
      setNotice({
        type: 'success',
        text:
          decision === 'approved'
            ? `Quotation ${quote.invoiceNumber} approved! Your supplier's CRM Deal & billing team have been updated automatically.`
            : `Revision note submitted for ${quote.invoiceNumber}.`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setQuoteActionId(null);
    }
  };

  const openPaymentModal = async (inv: PortalInvoiceItem) => {
    setPayInvoice(inv);
    setPayMode('UPI');
    setPayAmount(String(inv.balanceDue || inv.grandTotal));
    setPayUtr('');
    setPayPromisedDate(inv.promisedPaymentDate || '');
    setPayNote('');
    setPayIntentRes(null);
    setPayBusy(true);
    try {
      const res = await submitPortalPaymentIntentApi(token, inv.id, {
        paymentMode: 'UPI',
        amountInr: inv.balanceDue || inv.grandTotal,
        buyerName: data?.buyer.name,
      });
      setPayIntentRes(res);
    } catch {
      // Allow manual submit if QR preview fails
    } finally {
      setPayBusy(false);
    }
  };

  const handleSubmitPaymentNotification = async (e: FormEvent) => {
    e.preventDefault();
    if (!payInvoice) return;
    setPayBusy(true);
    setNotice(null);
    try {
      const res = await submitPortalPaymentIntentApi(token, payInvoice.id, {
        paymentMode: payMode,
        amountInr: Number(payAmount) || payInvoice.balanceDue || payInvoice.grandTotal,
        utrOrReference: payUtr.trim() || undefined,
        promisedDate: payPromisedDate.trim() || undefined,
        buyerName: data?.buyer.name,
        note: payNote.trim() || undefined,
      });
      setPayIntentRes(res);
      setData(res.portal);
      setNotice({
        type: 'success',
        text: res.message,
      });
      if (payUtr.trim() || payPromisedDate.trim()) {
        setPayInvoice(null);
      }
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setPayBusy(false);
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setTicketBusy(true);
    setNotice(null);
    try {
      const updated = await createPortalTicketApi(token, {
        subject: ticketSubject.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        linkedInvoiceNumber: ticketInvoiceNo.trim() || undefined,
        message: ticketMessage.trim(),
        buyerName: data?.buyer.name,
      });
      setData(updated);
      setTicketSubject('');
      setTicketInvoiceNo('');
      setTicketMessage('');
      setShowTicketForm(false);
      setNotice({
        type: 'success',
        text: 'Support ticket created! Our dispatch & support desk has received your request.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setTicketBusy(false);
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    const msg = replyTextByTicket[ticketId]?.trim();
    if (!msg) return;
    setReplyBusyId(ticketId);
    try {
      const updated = await replyPortalTicketApi(token, ticketId, {
        message: msg,
        buyerName: data?.buyer.name,
      });
      setData(updated);
      setReplyTextByTicket((prev) => ({ ...prev, [ticketId]: '' }));
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setReplyBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#0057FF]" />
        <p className="text-sm font-semibold">Loading your B2B Buyer Portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-lg font-extrabold text-slate-900">Portal Link Unavailable</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'This buyer portal link is invalid, disabled, or expired.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col">
      {/* Top Seller Branded Header */}
      <header className="bg-[#0B172B] text-white border-b border-white/10 print:bg-white print:text-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {data.seller.logoUrl ? (
              <img
                src={data.seller.logoUrl}
                alt={data.seller.companyName}
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 border border-white/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#0057FF] text-white flex items-center justify-center font-extrabold text-lg shadow-lg shadow-blue-600/30">
                {data.seller.companyName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {data.seller.companyName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" /> Verified B2B Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {data.seller.city}
                {data.seller.gstin ? ` · Seller GSTIN: ${data.seller.gstin}` : ''}
                {data.seller.phone ? ` · ${data.seller.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Buyer Account + Credit Hold Alert */}
        {data.buyer.creditHold && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Account On Credit Hold — Dispatch Paused</p>
                <p className="mt-0.5 text-rose-700">
                  {data.buyer.creditHoldReason ||
                    'Clear overdue GST invoice balance via UPI or submit NEFT UTR below to unblock pending orders.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Clear Overdue Dues
            </button>
          </div>
        )}

        {notice && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Buyer Profile & Live Udhaar KPI Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Prepared For B2B Account
              </span>
              {data.buyer.gstin && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                  GSTIN: {data.buyer.gstin}
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0057FF]" />
              {data.buyer.company || data.buyer.name}
            </h2>
            <p className="text-xs text-slate-600">
              Attn: <strong>{data.buyer.name}</strong> · {data.buyer.city}
              {data.buyer.creditTermDays ? ` · Terms: Net ${data.buyer.creditTermDays} Days` : ''}
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                <span>Total Billed</span>
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                ₹{data.buyer.totalInvoicedInr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Paid: ₹{data.buyer.totalPaidInr.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                <span>Open Udhaar</span>
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-amber-700 mt-1">
                ₹{data.buyer.openBalanceInr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-semibold mt-0.5 text-rose-600">
                {data.buyer.overdueBalanceInr > 0
                  ? `Overdue: ₹${data.buyer.overdueBalanceInr.toLocaleString('en-IN')}`
                  : 'Zero overdue dues'}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                <span>Credit Limit</span>
                <CreditCard className="w-3.5 h-3.5 text-[#0057FF]" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-[#0057FF] mt-1">
                {data.buyer.creditLimitInr > 0
                  ? `₹${data.buyer.creditLimitInr.toLocaleString('en-IN')}`
                  : 'Prepaid / COD'}
              </p>
              {data.buyer.creditLimitInr > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        creditUtilPct > 85 ? 'bg-rose-500' : 'bg-[#0057FF]'
                      }`}
                      style={{ width: `${creditUtilPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Avail: ₹{data.buyer.availableCreditInr.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('quotations')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all ${
                activeTab === 'quotations'
                  ? 'bg-[#0057FF] text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Proforma Quotations ({data.quotations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all ${
                activeTab === 'invoices'
                  ? 'bg-[#0057FF] text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>GST Invoices &amp; Payments ({data.invoices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all ${
                activeTab === 'tickets'
                  ? 'bg-[#0057FF] text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Support &amp; Dispatch Tickets ({data.tickets.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: QUOTATIONS */}
        {activeTab === 'quotations' && (
          <section className="space-y-4">
            {data.quotations.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-xs text-slate-500">
                No Proforma Quotations shared with this account yet.
              </div>
            ) : (
              data.quotations.map((q) => {
                const isExpanded = expandedDocId === q.id || data.quotations.length === 1;
                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
                      q.id === data.focusDocId
                        ? 'border-[#0057FF] ring-2 ring-[#0057FF]/15'
                        : 'border-slate-200/80'
                    }`}
                  >
                    <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-slate-900">
                            {q.invoiceNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              q.quoteApprovalStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : q.quoteApprovalStatus === 'changes_requested'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {q.quoteApprovalStatus === 'approved'
                              ? 'Approved by Buyer'
                              : q.quoteApprovalStatus === 'changes_requested'
                                ? 'Revision Requested'
                                : 'Awaiting Your Approval'}
                          </span>
                          {q.convertedToInvoiceId && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Converted to GST Tax Invoice
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Issued {new Date(q.createdAt).toLocaleDateString('en-IN')} · Valid Till:{' '}
                          {q.dueDate || '15 Days'} · GST ({q.gstRate}%): ₹
                          {q.gstAmount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Total Quote (Incl. GST)
                          </p>
                          <p className="text-lg font-extrabold text-slate-900">
                            ₹{q.grandTotal.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedDocId(isExpanded ? null : q.id)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                                <th className="py-2 pr-3">Item Description</th>
                                <th className="py-2 px-3">HSN/SAC</th>
                                <th className="py-2 px-3 text-right">Qty</th>
                                <th className="py-2 px-3 text-right">Rate (₹)</th>
                                <th className="py-2 pl-3 text-right">Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {q.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-2.5 pr-3 font-semibold text-slate-800">
                                    {item.description}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-500">
                                    {item.hsnSac || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 pl-3 text-right font-bold">
                                    ₹{Number(item.amount).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-wrap justify-between items-end gap-4 bg-slate-50 rounded-2xl p-4 text-xs">
                          <div className="space-y-1 text-slate-600 max-w-md">
                            <p className="font-bold text-slate-800">Tax &amp; Supply Details</p>
                            <p>Place of Supply: {q.placeOfSupply}</p>
                            {q.taxType === 'cgst_sgst' ? (
                              <p>
                                CGST ({q.gstRate / 2}%): ₹{q.cgstAmount.toLocaleString('en-IN')} · SGST (
                                {q.gstRate / 2}%): ₹{q.sgstAmount.toLocaleString('en-IN')}
                              </p>
                            ) : (
                              <p>
                                IGST ({q.gstRate}%): ₹{q.igstAmount.toLocaleString('en-IN')}
                              </p>
                            )}
                            {q.notes && <p className="italic text-slate-500 whitespace-pre-line">{q.notes}</p>}
                          </div>

                          <div className="text-right space-y-1">
                            <p className="text-slate-500">
                              Taxable Value: ₹{q.taxableAmount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-slate-500">
                              Total GST: ₹{q.gstAmount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-base font-extrabold text-slate-900">
                              Grand Total: ₹{q.grandTotal.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        {q.quoteApprovalStatus !== 'approved' && (
                          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 space-y-3 print:hidden">
                            <p className="text-xs font-extrabold text-slate-900">
                              1-Click Buyer Approval or Revision Request
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                value={quoteBuyerName}
                                onChange={(e) => setQuoteBuyerName(e.target.value)}
                                placeholder="Your Name & Designation"
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                              />
                              <input
                                type="text"
                                value={quoteRemark}
                                onChange={(e) => setQuoteRemark(e.target.value)}
                                placeholder="Optional PO # or requested discount/delivery feedback"
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <button
                                type="button"
                                disabled={quoteActionId === q.id}
                                onClick={() => handleQuoteDecision(q, 'approved')}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 disabled:opacity-60"
                              >
                                {quoteActionId === q.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Approve Quotation Now</span>
                              </button>

                              <button
                                type="button"
                                disabled={quoteActionId === q.id}
                                onClick={() => handleQuoteDecision(q, 'changes_requested')}
                                className="px-4 py-2.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold inline-flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Request Price / Quantity Revision</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* TAB 2: GST TAX INVOICES */}
        {activeTab === 'invoices' && (
          <section className="space-y-4">
            {data.invoices.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-xs text-slate-500">
                No GST Tax Invoices issued to this account yet.
              </div>
            ) : (
              data.invoices.map((inv) => {
                const isExpanded = expandedDocId === inv.id;
                return (
                  <div
                    key={inv.id}
                    className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
                      inv.id === data.focusDocId
                        ? 'border-[#0057FF] ring-2 ring-[#0057FF]/15'
                        : 'border-slate-200/80'
                    }`}
                  >
                    <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inv.status === 'overdue'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                          {inv.daysOverdue > 0 && inv.balanceDue > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                              {inv.daysOverdue}d Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Due: {inv.dueDate || 'On Receipt'} · Paid: ₹
                          {(inv.amountPaid + inv.tdsDeducted).toLocaleString('en-IN')} ·{' '}
                          <strong className="text-slate-800">
                            Balance Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 print:hidden">
                        {inv.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => void openPaymentModal(inv)}
                            className="px-3.5 py-2 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pay via UPI / Submit UTR</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedDocId(isExpanded ? null : inv.id)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4 text-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                                <th className="py-2 pr-3">Description</th>
                                <th className="py-2 px-3">HSN</th>
                                <th className="py-2 px-3 text-right">Qty</th>
                                <th className="py-2 pl-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {inv.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 pr-3 font-semibold">{item.description}</td>
                                  <td className="py-2 px-3 font-mono text-slate-500">{item.hsnSac}</td>
                                  <td className="py-2 px-3 text-right">{item.quantity}</td>
                                  <td className="py-2 pl-3 text-right font-bold">
                                    ₹{Number(item.amount).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {inv.payments.length > 0 && (
                          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                            <p className="font-extrabold text-emerald-900">Recorded Receipts</p>
                            {inv.payments.map((p) => (
                              <div key={p.id} className="flex justify-between text-emerald-800">
                                <span>
                                  {p.paymentMode} {p.utrOrChequeNo ? `(${p.utrOrChequeNo})` : ''} ·{' '}
                                  {p.paymentDate}
                                </span>
                                <span className="font-bold">
                                  ₹{Number(p.totalSettled || p.amountPaid).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* TAB 3: SUPPORT & DISPATCH TICKETS */}
        {activeTab === 'tickets' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Track dispatch LR updates, GST invoice corrections, warranty service, or AMC visits.
              </p>
              <button
                type="button"
                onClick={() => setShowTicketForm((v) => !v)}
                className="px-4 py-2 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>{showTicketForm ? 'Cancel' : 'Raise New Request'}</span>
              </button>
            </div>

            {showTicketForm && (
              <form
                onSubmit={handleCreateTicket}
                className="bg-white rounded-3xl p-5 border border-[#0057FF]/30 shadow-sm space-y-3 text-xs"
              >
                <p className="font-extrabold text-sm text-slate-900">
                  Submit Support / Dispatch Request
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={ticketCategory}
                    onChange={(e) =>
                      setTicketCategory(e.target.value as typeof ticketCategory)
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="dispatch_delay">Dispatch / LR Tracking</option>
                    <option value="gst_correction">GST / E-Invoice Correction</option>
                    <option value="warranty">Warranty / Replacement</option>
                    <option value="installation">Installation / Commissioning</option>
                    <option value="amc_service">AMC Service Visit</option>
                    <option value="general">General Inquiry</option>
                  </select>

                  <select
                    value={ticketPriority}
                    onChange={(e) =>
                      setTicketPriority(e.target.value as typeof ticketPriority)
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="low">Low Priority (72h SLA)</option>
                    <option value="medium">Medium Priority (48h SLA)</option>
                    <option value="high">High Priority (24h SLA)</option>
                    <option value="urgent">Urgent Plant Stoppage (4h SLA)</option>
                  </select>

                  <input
                    type="text"
                    value={ticketInvoiceNo}
                    onChange={(e) => setTicketInvoiceNo(e.target.value)}
                    placeholder="Related Invoice / Quote # (Optional)"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Subject (e.g. Need E-Way Bill / LR copy for Friday dispatch)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <textarea
                  rows={3}
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your request cleanly..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <button
                  type="submit"
                  disabled={ticketBusy}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  {ticketBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Ticket</span>
                </button>
              </form>
            )}

            {data.tickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-xs text-slate-500">
                No open support or dispatch tickets for this account.
              </div>
            ) : (
              data.tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-[#0057FF]">
                        {t.ticketNumber}
                      </span>
                      <span className="font-extrabold text-slate-900">{t.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold uppercase text-[10px]">
                        {t.status.replace('_', ' ')}
                      </span>
                      {t.slaDueAt && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" /> SLA: {t.slaDueAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {t.comments.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {t.comments.map((c) => (
                        <div
                          key={c.id}
                          className={`p-2.5 rounded-xl ${
                            c.authorRole === 'customer'
                              ? 'bg-blue-50/70 border border-blue-100'
                              : 'bg-slate-50 border border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                            <span>{c.authorName}</span>
                            <span>{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-slate-800">{c.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {t.status !== 'closed' && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={replyTextByTicket[t.id] || ''}
                        onChange={(e) =>
                          setReplyTextByTicket((prev) => ({
                            ...prev,
                            [t.id]: e.target.value,
                          }))
                        }
                        placeholder="Write a reply update..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                      <button
                        type="button"
                        disabled={replyBusyId === t.id || !replyTextByTicket[t.id]?.trim()}
                        onClick={() => void handleTicketReply(t.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {replyBusyId === t.id ? 'Sending...' : 'Reply'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* Payment Intent Modal (Live UPI QR + NEFT Bank + UTR / PTP Submit) */}
      {payInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pay Invoice {payInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Balance Due: ₹{payInvoice.balanceDue.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayInvoice(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payIntentRes?.upiQrDataUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-xs">
                <img
                  src={payIntentRes.upiQrDataUrl}
                  alt="UPI Payment QR"
                  className="w-32 h-32 rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <p className="font-extrabold text-slate-900">Scan with GPay / PhonePe / Paytm</p>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-white border border-slate-200 font-mono text-[11px] font-bold">
                      {payIntentRes.upiId}
                    </code>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(payIntentRes.upiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 1800);
                      }}
                      className="p-1 rounded border border-slate-200 bg-white"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">{payIntentRes.bankAccountNote}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={payIntentRes.upiDeepLink}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0057FF] text-white font-bold text-[11px]"
                    >
                      Open UPI App <ExternalLink className="w-3 h-3" />
                    </a>
                    {payInvoice.paymentLink && (
                      <a
                        href={payInvoice.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[11px]"
                      >
                        Pay Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPaymentNotification} className="space-y-3 text-xs">
              <p className="font-extrabold text-slate-800">
                Notify Accounts Team (Submit UTR Reference or Expected Payment Date)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as typeof payMode)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT / IMPS</option>
                  <option value="RTGS">RTGS</option>
                  <option value="Razorpay">Razorpay Link</option>
                </select>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Amount ₹"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={payUtr}
                  onChange={(e) => setPayUtr(e.target.value)}
                  placeholder="Paid UTR / UPI Ref No."
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
                <input
                  type="date"
                  value={payPromisedDate}
                  onChange={(e) => setPayPromisedDate(e.target.value)}
                  title="Or Expected Payment Date"
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="Optional note (e.g. Paid after TDS deduction)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
              <button
                type="submit"
                disabled={payBusy}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold inline-flex items-center justify-center gap-1.5"
              >
                {payBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Submit Payment Update / Regenerate QR</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Viral Brand Loop Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0057FF]" />
            <span>
              Powered by <strong className="text-slate-900">Leadsetu AI CRM</strong> · Automated
              GST Quotations, Udhaar &amp; Dealer Portals
            </span>
          </div>
          <Link
            href="/register"
            className="font-extrabold text-[#0057FF] hover:underline inline-flex items-center gap-1"
          >
            Launch Your Free B2B Portal <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

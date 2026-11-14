'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  Loader2,
  Send,
  MessageSquare,
} from 'lucide-react';
import type { PublicQuoteView } from '@/types/contracts';
import {
  fetchPublicQuoteApi,
  respondToPublicQuoteApi,
} from '@/lib/invoices-api';

export default function PublicQuotePortalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || '';

  const [quote, setQuote] = useState<PublicQuoteView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const loadQuote = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPublicQuoteApi(token);
      setQuote(data);
      setBuyerName(data.contactPerson || data.clientName || '');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'This quotation link is invalid or no longer active.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const handleDecision = async (decision: 'approved' | 'changes_requested') => {
    if (!quote) return;
    setIsSubmitting(true);
    setError(null);
    setFeedbackBanner(null);
    try {
      const updated = await respondToPublicQuoteApi(token, {
        decision,
        buyerName: buyerName.trim() || quote.clientName,
        remark: remark.trim(),
      });
      setQuote(updated);
      setFeedbackBanner(
        decision === 'approved'
          ? 'Thank you! Quotation approved — our billing team can now convert this into your GST Tax Invoice.'
          : 'Revision feedback submitted! Your account manager has been notified.',
      );
      setRemark('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to submit your response.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          Loading GST Quotation / Invoice Portal...
        </p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-lg font-extrabold text-slate-900">
            Quotation Link Unavailable
          </h1>
          <p className="text-xs text-slate-500">
            {error || 'Please request an updated quotation link from the seller.'}
          </p>
        </div>
      </div>
    );
  }

  const approvalBadge =
    quote.quoteApprovalStatus === 'approved'
      ? {
          label: `Approved by ${quote.approvedByName || quote.clientName}`,
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      : quote.quoteApprovalStatus === 'changes_requested'
        ? {
            label: 'Revision Requested by Buyer',
            cls: 'bg-amber-50 text-amber-800 border-amber-200',
          }
        : {
            label: 'Awaiting Buyer Approval',
            cls: 'bg-blue-50 text-blue-700 border-blue-200',
          };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Branded Action Bar */}
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-sm">
              LS
            </div>
            <div>
              <div className="text-sm font-extrabold">{quote.sellerName}</div>
              <div className="text-[11px] text-slate-300">
                {quote.sellerCity} · Verified GST Document Portal
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            {quote.paymentLink && quote.status !== 'paid' && (
              <a
                href={quote.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Pay via UPI / Razorpay
              </a>
            )}
          </div>
        </div>

        {/* Main GST Document Sheet */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Seller & Doc Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-5 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {quote.docType === 'proforma_quote'
                    ? 'Proforma Quotation'
                    : 'GST Tax Invoice'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                {quote.sellerName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{quote.sellerCity}</p>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div className="font-mono text-xl font-extrabold text-slate-900">
                {quote.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500">
                Place of Supply:{' '}
                <strong className="text-slate-700">{quote.placeOfSupply}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Valid / Due By:{' '}
                <strong className="text-slate-700">
                  {quote.dueDate || 'Immediate'}
                </strong>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${approvalBadge.cls}`}
                >
                  {quote.quoteApprovalStatus === 'approved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {approvalBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Prepared For (Buyer)
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{quote.clientName}</span>
              </div>
              {quote.contactPerson && (
                <div className="text-xs text-slate-600 mt-0.5">
                  Attn: {quote.contactPerson}
                </div>
              )}
              <div className="text-xs font-mono text-slate-600 mt-1">
                Buyer GSTIN: <strong>{quote.gstin || 'Unregistered / B2C'}</strong>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Grand Total Payable
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ₹{quote.grandTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500">
                Incl. {quote.gstRate}%{' '}
                {quote.taxType === 'cgst_sgst' ? 'CGST + SGST' : 'IGST'}
              </div>
            </div>
          </div>

          {/* Itemized HSN/SAC Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">HSN / SAC</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Rate (₹)</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quote.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {item.hsnSac}
                    </td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes + GST Tax Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="text-xs text-slate-600 space-y-2">
              <div className="font-bold uppercase text-slate-700">
                Terms &amp; Remarks
              </div>
              <p className="whitespace-pre-line leading-relaxed">
                {quote.notes}
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]">
                Razorpay / UPI Payment Link:{' '}
                <a
                  href={quote.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  {quote.paymentLink}
                </a>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sub-Total:</span>
                <span>₹{quote.subTotal.toLocaleString('en-IN')}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- ₹{quote.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800">
                <span>Taxable Value:</span>
                <span>₹{quote.taxableAmount.toLocaleString('en-IN')}</span>
              </div>
              {quote.taxType === 'cgst_sgst' ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST ({quote.gstRate / 2}%):</span>
                    <span>₹{quote.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST ({quote.gstRate / 2}%):</span>
                    <span>₹{quote.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>IGST ({quote.gstRate}%):</span>
                  <span>₹{quote.igstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
                <span>Grand Total (INR):</span>
                <span>₹{quote.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Interactive Buyer Quote Approval Section */}
          <div className="pt-4 border-t border-slate-200 print:hidden">
            {feedbackBanner && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{feedbackBanner}</span>
              </div>
            )}

            {quote.quoteApprovalStatus === 'approved' ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-900">
                      Quotation Approved by {quote.approvedByName || quote.clientName}
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Confirmed on{' '}
                      {quote.approvedAt
                        ? new Date(quote.approvedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'today'}
                      . Ready for final GST Tax Invoice &amp; dispatch.
                    </p>
                  </div>
                </div>
                {quote.paymentLink && quote.status !== 'paid' && (
                  <a
                    href={quote.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Proceed to Pay
                  </a>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Buyer Confirmation &amp; PO Approval
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Review quantities, HSN codes, and GST breakdown above, then click{' '}
                    <strong>Approve Quote</strong> to authorize billing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Authorized Buyer Name *
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Optional PO # or Revision Note
                    </label>
                    <input
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="e.g. PO-4419 approved for immediate dispatch"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision('approved')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Approve Quote</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision('changes_requested')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold disabled:opacity-60"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                  >
                    <Send className="w-3.5 h-3.5" /> Print Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

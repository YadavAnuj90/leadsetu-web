'use client';

import {
  Building2,
  CheckCircle2,
  Download,
  HeartHandshake,
  MapPin,
  Printer,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { downloadSubscriptionInvoicePdf } from '@/lib/subscription-pdf';
import type { SubscriptionInvoice } from '@/types/contracts';

interface Props {
  invoice: SubscriptionInvoice;
  ownerName?: string;
  onClose: () => void;
}

export default function SubscriptionInvoiceModal({
  invoice,
  ownerName,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="bg-white dark:bg-[#0D1628] rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden my-6 print:shadow-none print:border-0 print:rounded-none print:my-0">
        {/* Top Modal Action Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Leadsetu Subscription GST Tax Invoice · {invoice.invoiceNumber}
              </h2>
              <p className="text-[11px] text-slate-300">
                Attached to Workspace Profile · SAC {invoice.sacCode} · 18% GST ITC Eligible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print A4
            </button>
            <button
              type="button"
              onClick={() => downloadSubscriptionInvoicePdf(invoice, ownerName)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF (.pdf)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto bg-white dark:bg-[#0D1628] text-slate-900 dark:text-slate-100 print:max-h-none print:overflow-visible print:bg-white print:text-slate-900">
          {/* Official Header with Leadsetu Brand & Address */}
          <div
            className="rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-start justify-between gap-4 border border-white/10"
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
            }}
          >
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                <Sparkles className="w-3 h-3 text-sky-300" />
                Official SaaS Tax Invoice
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">
                LEADSETU
              </h3>
              <p className="text-xs font-bold text-sky-100">
                {invoice.sellerCompany}
              </p>
              <p className="text-[11px] text-slate-200/95 inline-flex items-start gap-1 max-w-md">
                <MapPin className="w-3.5 h-3.5 text-sky-300 shrink-0 mt-0.5" />
                <span>{invoice.sellerAddress}</span>
              </p>
              <p className="text-[11px] font-mono text-sky-200">
                GSTIN: {invoice.sellerGstin} · SAC: {invoice.sacCode} · {invoice.sellerEmail}
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Invoice Number
              </div>
              <div className="text-lg font-mono font-extrabold text-white">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-200">
                Issued:{' '}
                {new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-[10px] font-extrabold text-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {invoice.status === 'paid' ? 'PAID IN FULL' : 'TRIAL ACTIVATED'}
              </span>
            </div>
          </div>

          {/* Supplier & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Billed To (Workspace Profile)
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {invoice.buyerCompany}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Admin:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {ownerName || 'Workspace Owner'}
                </strong>{' '}
                ({invoice.buyerEmail})
              </div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                Buyer GSTIN: {invoice.buyerGstin || 'Unregistered / Applied'}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                {invoice.buyerAddress} · Place of Supply:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {invoice.buyerState}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                Subscription &amp; Payment Metadata
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {invoice.planName} ({invoice.billingCycle.toUpperCase()})
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Period:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {invoice.periodStart}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 dark:text-white">
                  {invoice.periodEnd}
                </strong>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Payment Mode:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {invoice.paymentMode}
                </strong>
              </div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                Txn / Ref ID: {invoice.paymentReference}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 dark:bg-white/[0.08] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">SaaS Plan &amp; Entitlements</th>
                  <th className="py-3 px-3">SAC</th>
                  <th className="py-3 px-3">Seats</th>
                  <th className="py-3 px-3">Cycle</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                <tr>
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      Leadsetu Cloud CRM — {invoice.planName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                      AI Lead Scoring, Official WhatsApp Cloud Inbox, GST Quotations, AR Ledger &amp; SLA Support
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {invoice.sacCode}
                  </td>
                  <td className="py-4 px-3 font-bold text-slate-900 dark:text-white">
                    {invoice.seatsIncluded} Users
                  </td>
                  <td className="py-4 px-3 capitalize font-semibold text-slate-800 dark:text-slate-200">
                    {invoice.billingCycle}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                    ₹{invoice.baseAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* GST Totals Footer */}
            <div className="bg-slate-50 dark:bg-white/[0.04] border-t border-slate-200 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ Eligible for 18% GST Input Tax Credit (ITC)
                </div>
                <div>
                  Invoice permanently attached to {invoice.buyerCompany} workspace billing ledger.
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Taxable Value:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{invoice.baseAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {invoice.igstAmount > 0 ? (
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>IGST ({invoice.gstRate}%):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{invoice.igstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>CGST (9%):</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{invoice.cgstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>SGST (9%):</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{invoice.sgstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-white/20 text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Total Paid:</span>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    ₹{invoice.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warm Leadsetu Greeting & Appreciation Card */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-slate-900/90 border border-blue-200 dark:border-blue-500/35 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-sky-300">
              <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              A Warm Greeting &amp; Thank You for Choosing Leadsetu
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {invoice.greetingNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

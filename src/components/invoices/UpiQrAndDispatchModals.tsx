'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  QrCode,
  Send,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import {
  fetchInvoiceUpiQrApi,
  simulateInvoiceWebhookPaidApi,
  updateInvoiceDispatchApi,
  updateRecoveryConfigApi,
} from '@/lib/invoices-api';
import { getErrorMessage } from '@/lib/api-client';
import type { Invoice } from '@/types/contracts';

const COURIERS = [
  'Shiprocket',
  'Delhivery',
  'BlueDart',
  'DTDC',
  'Self-Dispatch',
] as const;

const DISPATCH_STAGES = [
  { id: 'packed', label: 'Packed & Ready' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
] as const;

export function InvoiceUpiQrModal({
  invoice,
  onClose,
  onUpdated,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onUpdated: (msg: string) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState('');
  const [merchantInput, setMerchantInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{
    upiId: string;
    merchantName: string;
    upiConfigured: boolean;
    upiPaymentUri: string;
    upiQrDataUrl: string;
    paymentLink: string;
    balanceDue: number;
    grandTotal: number;
  } | null>(null);

  const loadQr = async (invoiceId: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchInvoiceUpiQrApi(invoiceId);
      setQrData({
        upiId: res.upiId,
        merchantName: res.merchantName || '',
        upiConfigured: Boolean(res.upiConfigured),
        upiPaymentUri: res.upiPaymentUri,
        upiQrDataUrl: res.upiQrDataUrl,
        paymentLink: res.paymentLink,
        balanceDue: res.balanceDue,
        grandTotal: res.grandTotal,
      });
      setUpiInput(res.upiConfigured ? res.upiId : '');
      setMerchantInput(res.merchantName || '');
      setEditingUpi(!res.upiConfigured);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!invoice) return;
    void loadQr(invoice.id);
  }, [invoice]);

  if (!invoice) return null;

  const handleSaveUpiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVpa = upiInput.trim();
    if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(cleanVpa)) {
      setError('Enter a valid UPI ID (e.g. yourbusiness@okicici or yourstore@ybl).');
      return;
    }
    setSavingUpi(true);
    setError(null);
    try {
      await updateRecoveryConfigApi({
        upiId: cleanVpa,
        merchantName: merchantInput.trim() || undefined,
      });
      await loadQr(invoice.id);
      setEditingUpi(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingUpi(false);
    }
  };

  const handleSimulatePaid = async () => {
    setSimulating(true);
    setError(null);
    try {
      const res = await simulateInvoiceWebhookPaidApi(invoice.id);
      await onUpdated(
        `Webhook Reconciled ${res.invoiceNumber}: settled ₹${res.amountSettledInr.toLocaleString('en-IN')} (Txn ${res.paymentId}) → Status: ${res.status.toUpperCase()}${res.whatsappReceiptSent ? ' · WhatsApp Receipt Sent' : ''}.`,
      );
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                Instant UPI QR Checkout · {invoice.invoiceNumber}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {invoice.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-xs font-semibold text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Generating scannable UPI QR...
          </div>
        ) : qrData ? (
          <div className="space-y-4 text-xs">
            {(!qrData.upiConfigured || editingUpi) ? (
              <form
                onSubmit={(e) => void handleSaveUpiConfig(e)}
                className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-3"
              >
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold">
                      {qrData.upiConfigured
                        ? 'Update Workspace Business UPI ID'
                        : 'Configure Your Real Business UPI ID First'}
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      GPay, PhonePe &amp; Paytm show &ldquo;Invalid QR&rdquo; for unverified demo VPAs. Save your active Merchant UPI ID below to generate a live NPCI-compliant QR.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-brand-navy dark:text-slate-200 mb-1">
                    Active UPI ID (VPA) *
                  </label>
                  <input
                    type="text"
                    required
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    placeholder="e.g. yourbusiness@okicici or 9811000000@ybl"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-brand-navy dark:text-slate-200 mb-1">
                    Merchant / Payee Name (Bank KYC Name)
                  </label>
                  <input
                    type="text"
                    value={merchantInput}
                    onChange={(e) => setMerchantInput(e.target.value)}
                    placeholder="e.g. Apex Switches Pvt Ltd"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingUpi}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold disabled:opacity-50"
                  >
                    {savingUpi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save UPI &amp; Generate Scannable QR</span>
                  </button>
                  {qrData.upiConfigured && (
                    <button
                      type="button"
                      onClick={() => setEditingUpi(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 font-bold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 flex flex-col items-center text-center">
                  {qrData.upiQrDataUrl && (
                    <img
                      src={qrData.upiQrDataUrl}
                      alt={`UPI QR ${invoice.invoiceNumber}`}
                      className="w-48 h-48 rounded-xl border border-slate-200 bg-white p-1"
                    />
                  )}
                  <div className="text-base font-black text-brand-navy dark:text-white mt-3">
                    ₹{(qrData.balanceDue > 0 ? qrData.balanceDue : qrData.grandTotal).toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-500">
                      Merchant UPI: {qrData.upiId}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingUpi(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                    >
                      <Pencil className="w-3 h-3" /> Change
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Tip: For gallery scan above ₹2,000, use a Merchant UPI ID (GPay Business / PhonePe Business / Paytm for Business).
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/10">
                  <span className="font-mono text-[11px] truncate text-slate-600 dark:text-slate-300">
                    {qrData.upiPaymentUri}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(qrData.upiPaymentUri).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/15 font-bold shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
              </>
            )}

            {qrData.paymentLink ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/30">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">
                    Razorpay Checkout Link
                  </div>
                  <div className="font-mono text-[11px] truncate text-brand-navy dark:text-slate-200">
                    {qrData.paymentLink}
                  </div>
                </div>
                <a
                  href={qrData.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0"
                >
                  <ExternalLink className="w-3 h-3" /> Open Pay
                </a>
              </div>
            ) : null}

            {invoice.status !== 'paid' && invoice.docType === 'tax_invoice' && (
              <button
                type="button"
                disabled={simulating}
                onClick={() => void handleSimulatePaid()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold disabled:opacity-50"
              >
                {simulating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Simulate Razorpay/UPI Webhook Paid → Auto-Reconcile</span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InvoiceDispatchModal({
  invoice,
  onClose,
  onUpdated,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onUpdated: (msg: string) => Promise<void> | void;
}) {
  const [courier, setCourier] = useState<(typeof COURIERS)[number]>('Shiprocket');
  const [awbNumber, setAwbNumber] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<
    'pending' | 'packed' | 'in_transit' | 'out_for_delivery' | 'delivered'
  >('in_transit');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsAppAlert, setSendWhatsAppAlert] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoice) return;
    setCourier(
      (COURIERS.includes(invoice.dispatchCourier as (typeof COURIERS)[number])
        ? invoice.dispatchCourier
        : 'Shiprocket') as (typeof COURIERS)[number],
    );
    setAwbNumber(invoice.dispatchAwbNumber || '');
    setDispatchStatus(
      invoice.dispatchStatus && invoice.dispatchStatus !== 'pending'
        ? invoice.dispatchStatus
        : 'in_transit',
    );
    setTrackingUrl(invoice.dispatchTrackingUrl || '');
    setNotes(invoice.dispatchNotes || '');
    setError(null);
  }, [invoice]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await updateInvoiceDispatchApi(invoice.id, {
        courier,
        awbNumber: awbNumber.trim(),
        ...(trackingUrl.trim() ? { trackingUrl: trackingUrl.trim() } : {}),
        dispatchStatus,
        notes: notes.trim(),
        sendWhatsAppAlert,
      });
      await onUpdated(
        `Saved ${res.invoice.dispatchCourier} AWB ${res.invoice.dispatchAwbNumber} (${res.invoice.dispatchStatus?.toUpperCase()})${res.whatsappNotified ? ' & dispatched WhatsApp AWB Alert to buyer!' : '.'}`,
      );
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                Courier &amp; AWB Dispatch · {invoice.invoiceNumber}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {invoice.clientName} · {invoice.phone || 'No WhatsApp phone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-xs font-semibold text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Courier Partner
            </label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value as (typeof COURIERS)[number])}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white"
            >
              {COURIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Dispatch Stage
            </label>
            <select
              value={dispatchStatus}
              onChange={(e) =>
                setDispatchStatus(
                  e.target.value as
                    | 'pending'
                    | 'packed'
                    | 'in_transit'
                    | 'out_for_delivery'
                    | 'delivered',
                )
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white"
            >
              {DISPATCH_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              AWB / Waybill Number *
            </label>
            <input
              type="text"
              required
              value={awbNumber}
              onChange={(e) => setAwbNumber(e.target.value.toUpperCase())}
              placeholder="e.g. SR9981273645IN or DLV88291044"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] font-mono text-xs text-brand-navy dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Custom Tracking URL (Auto-built for {courier} if blank)
            </label>
            <input
              type="text"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder={`Auto: https://${courier.toLowerCase()}.com/...`}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] font-mono text-xs text-brand-navy dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Dispatch / Gate Pass Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched from Noida Sec-63 Warehouse"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs text-brand-navy dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsAppAlert}
              onChange={(e) => setSendWhatsAppAlert(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600"
            />
            <span className="font-bold text-emerald-800 dark:text-emerald-200">
              Send 1-Click WhatsApp AWB Tracking Alert to Buyer
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          {invoice.dispatchTrackingUrl && (
            <a
              href={invoice.dispatchTrackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-brand-blue mr-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Link
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-extrabold disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : sendWhatsAppAlert ? (
              <Send className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Save AWB &amp; Notify Buyer</span>
          </button>
        </div>
      </form>
    </div>
  );
}

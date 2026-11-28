'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Minus,
  Package,
  Plus,
  QrCode,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { fetchProductsApi } from '@/lib/products-api';
import {
  createWhatsappCartCheckoutApi,
  fetchInvoiceUpiQrApi,
  updateRecoveryConfigApi,
} from '@/lib/invoices-api';
import { getErrorMessage } from '@/lib/api-client';
import type { Conversation, Product } from '@/types/contracts';

interface CartLine {
  key: string;
  productId?: string;
  sku?: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
}

export interface PrefilledCartLineInput {
  productId?: string;
  sku?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
}

export default function WhatsAppCartBuilderModal({
  open,
  conversation,
  prefilledLines,
  prefilledCity,
  prefilledDocType,
  onClose,
  onSent,
}: {
  open: boolean;
  conversation: Conversation | null;
  prefilledLines?: PrefilledCartLineInput[] | null;
  prefilledCity?: string;
  prefilledDocType?: 'tax_invoice' | 'proforma_quote';
  onClose: () => void;
  onSent?: (summaryText: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [gstRate, setGstRate] = useState<number>(18);
  const [discount, setDiscount] = useState<string>('0');
  const [docType, setDocType] = useState<'tax_invoice' | 'proforma_quote'>('tax_invoice');
  const [placeOfSupply, setPlaceOfSupply] = useState('09 - Uttar Pradesh');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    invoiceId: string;
    invoiceNumber: string;
    grandTotal: number;
    upiPaymentUri: string;
    upiQrDataUrl: string;
    paymentLink: string;
    whatsappDispatched: boolean;
  } | null>(null);
  const [inlineUpiId, setInlineUpiId] = useState('');
  const [inlineMerchant, setInlineMerchant] = useState('');
  const [savingInlineUpi, setSavingInlineUpi] = useState(false);
  const [inlineUpiError, setInlineUpiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReceipt(null);
    setError(null);
    if (prefilledLines && prefilledLines.length > 0) {
      setCart(
        prefilledLines.map((l, idx) => ({
          key: l.productId || `rfq-${idx}-${Date.now()}`,
          productId: l.productId,
          sku: l.sku,
          description: l.description,
          hsnSac: l.hsnSac || '850440',
          quantity: Math.max(1, Number(l.quantity || 1)),
          unitPrice: Math.max(0, Number(l.unitPrice || 0)),
        })),
      );
    } else {
      setCart([]);
    }
    if (prefilledDocType) {
      setDocType(prefilledDocType);
    }
    if (prefilledCity?.trim()) {
      setPlaceOfSupply(prefilledCity.trim());
    }
    setLoadingProducts(true);
    fetchProductsApi()
      .then((res) => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [open, prefilledLines, prefilledCity, prefilledDocType]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [products, search]);

  const subTotal = useMemo(
    () => cart.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0),
    [cart],
  );
  const discountNum = Math.max(0, Number(discount) || 0);
  const taxableAmount = Math.max(0, subTotal - discountNum);
  const gstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  if (!open || !conversation) return null;

  const addProductToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          key: p.id,
          productId: p.id,
          sku: p.sku,
          description: p.name,
          hsnSac: p.hsnSac || '850440',
          quantity: 1,
          unitPrice: Number(p.unitPrice || 0),
        },
      ];
    });
  };

  const addCustomLine = () => {
    if (!customName.trim()) return;
    const price = Math.max(0, Number(customPrice) || 0);
    setCart((prev) => [
      ...prev,
      {
        key: `custom-${Date.now()}`,
        description: customName.trim(),
        hsnSac: '850440',
        quantity: 1,
        unitPrice: price,
      },
    ]);
    setCustomName('');
    setCustomPrice('');
  };

  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const handleCheckoutSend = async () => {
    if (cart.length === 0) {
      setError('Add at least one SKU or item to build a WhatsApp cart.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createWhatsappCartCheckoutApi({
        conversationId: conversation.id,
        clientName: conversation.company || conversation.contactName,
        phone: conversation.phone || '',
        placeOfSupply,
        gstRate,
        discount: discountNum,
        docType,
        items: cart.map((c) => ({
          ...(c.productId ? { productId: c.productId } : {}),
          ...(c.sku ? { sku: c.sku } : {}),
          description: c.description,
          hsnSac: c.hsnSac,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
        sendWhatsappNow: true,
      });

      setReceipt({
        invoiceId: res.invoice.id,
        invoiceNumber: res.invoice.invoiceNumber,
        grandTotal: res.invoice.grandTotal,
        upiPaymentUri: res.upiPaymentUri,
        upiQrDataUrl: res.upiQrDataUrl,
        paymentLink: res.paymentLink,
        whatsappDispatched: res.whatsappDispatched,
      });
      setInlineUpiError(null);
      onSent?.(
        `Sent WhatsApp Cart ${res.invoice.invoiceNumber} (₹${res.invoice.grandTotal.toLocaleString('en-IN')}) with scannable UPI QR & Payment Link.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveInlineUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) return;
    const cleanVpa = inlineUpiId.trim();
    if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(cleanVpa)) {
      setInlineUpiError('Enter a valid UPI VPA (e.g. yourbusiness@okicici or store@ybl).');
      return;
    }
    setSavingInlineUpi(true);
    setInlineUpiError(null);
    try {
      await updateRecoveryConfigApi({
        upiId: cleanVpa,
        merchantName: inlineMerchant.trim() || undefined,
      });
      const qr = await fetchInvoiceUpiQrApi(receipt.invoiceId);
      setReceipt((prev) =>
        prev
          ? {
              ...prev,
              upiPaymentUri: qr.upiPaymentUri,
              upiQrDataUrl: qr.upiQrDataUrl,
              paymentLink: qr.paymentLink || prev.paymentLink,
            }
          : prev,
      );
    } catch (err) {
      setInlineUpiError(getErrorMessage(err));
    } finally {
      setSavingInlineUpi(false);
    }
  };

  const copyVal = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white">
                WhatsApp Catalog Cart &amp; Instant UPI QR Checkout
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buyer: <strong>{conversation.contactName}</strong> (
                {conversation.phone || 'No phone'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/15 text-slate-500 hover:text-rose-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}

        {receipt ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white dark:bg-[#0D1628] rounded-2xl border border-emerald-200 dark:border-white/10">
              {receipt.upiQrDataUrl ? (
                <img
                  src={receipt.upiQrDataUrl}
                  alt={`UPI QR ${receipt.invoiceNumber}`}
                  className="w-44 h-44 rounded-xl border border-slate-200 bg-white p-1"
                />
              ) : (
                <form
                  onSubmit={(e) => void handleSaveInlineUpi(e)}
                  className="w-full p-2 text-left space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-7 h-7 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                        Business UPI VPA Not Set Yet
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Save once right here to generate scannable QR immediately:
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={inlineUpiId}
                    onChange={(e) => setInlineUpiId(e.target.value)}
                    placeholder="yourbusiness@okicici"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#081020] text-[11px] font-mono text-brand-navy dark:text-white"
                  />
                  <input
                    type="text"
                    value={inlineMerchant}
                    onChange={(e) => setInlineMerchant(e.target.value)}
                    placeholder="Merchant Name (optional)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#081020] text-[11px] text-brand-navy dark:text-white"
                  />
                  {inlineUpiError && (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-300">
                      {inlineUpiError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={savingInlineUpi}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold disabled:opacity-50"
                  >
                    {savingInlineUpi && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Save UPI &amp; Generate QR Now</span>
                  </button>
                </form>
              )}
              <span className="mt-2 text-xs font-extrabold text-brand-navy dark:text-white">
                Pay ₹{receipt.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="md:col-span-7 space-y-3 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {receipt.invoiceNumber} Generated
                  {receipt.whatsappDispatched ? ' & Sent to WhatsApp Chat!' : ''}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {receipt.upiPaymentUri ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
                    <span className="font-mono text-[11px] truncate text-slate-700 dark:text-slate-200">
                      {receipt.upiPaymentUri}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyVal('upi', receipt.upiPaymentUri)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
                    >
                      {copiedKey === 'upi' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy UPI</span>
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10">
                  <span className="font-mono text-[11px] truncate text-brand-blue">
                    {receipt.paymentLink}
                  </span>
                  <a
                    href={receipt.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-brand-blue font-bold shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> Link
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-brand-navy text-white font-extrabold"
              >
                Done &amp; Return to Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Catalog SKU Picker */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search /products SKU, name, or category..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-xs text-brand-navy dark:text-white"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {loadingProducts ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
                    Loading SKU catalog...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/15 text-center text-xs text-slate-400">
                    No matching catalog products. Add a custom item below!
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#111D33] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-brand-navy dark:text-white truncate flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {p.sku} · ₹{Number(p.unitPrice || 0).toLocaleString('en-IN')} · HSN{' '}
                          {p.hsnSac || '850440'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addProductToCart(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-blue text-white font-bold shrink-0 hover:bg-blue-600"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Custom Item */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Or Add Quick Custom SKU
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Item / Course / Service Name"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
                  />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="₹ Rate"
                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addCustomLine}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Active Cart & Tax Totals */}
            <div className="lg:col-span-6 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold text-brand-navy dark:text-white">
                  <span>Active Cart ({cart.length} items)</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={docType}
                      onChange={(e) =>
                        setDocType(e.target.value as 'tax_invoice' | 'proforma_quote')
                      }
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-[11px]"
                    >
                      <option value="tax_invoice">Tax Invoice / Bill</option>
                      <option value="proforma_quote">Proforma Quote</option>
                    </select>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-[11px]"
                    >
                      <option value={18}>18% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={0}>0% (No GST)</option>
                    </select>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/15 rounded-xl">
                    Tap &ldquo;+ Add&rdquo; on products to build buyer cart.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.key}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-brand-navy dark:text-white truncate">
                            {item.description}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity} ={' '}
                            <strong>
                              ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQty(item.key, -1)}
                            className="p-1 rounded-lg border border-slate-200 dark:border-white/15"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.key, 1)}
                            className="p-1 rounded-lg border border-slate-200 dark:border-white/15"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((prev) => prev.filter((l) => l.key !== item.key))
                            }
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Place of Supply
                    </label>
                    <input
                      type="text"
                      value={placeOfSupply}
                      onChange={(e) => setPlaceOfSupply(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>
                    Taxable: ₹{taxableAmount.toLocaleString('en-IN')} · GST ({gstRate}%): ₹
                    {gstAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-base font-black text-brand-navy dark:text-white">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={submitting || cart.length === 0}
                  onClick={() => void handleCheckoutSend()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Create Invoice &amp; Send Scannable UPI QR on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

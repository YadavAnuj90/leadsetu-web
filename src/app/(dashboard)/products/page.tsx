'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Database,
  Check,
  Copy,
  Edit3,
  Trash2,
  X,
  FileText,
  Boxes,
  Tag,
  IndianRupee,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type {
  CreateProductPayload,
  Product,
  ProductStats,
  ProductUnit,
} from '@/types/contracts';
import {
  createProductApi,
  deleteProductApi,
  fetchProductsApi,
  seedProductsApi,
  updateProductApi,
} from '@/lib/products-api';

const UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'pcs', label: 'Pcs (Units)' },
  { value: 'box', label: 'Box / Carton' },
  { value: 'set', label: 'Set / Kit' },
  { value: 'kg', label: 'Kg' },
  { value: 'mtr', label: 'Meters' },
  { value: 'service', label: 'Service (SAC)' },
  { value: 'license', label: 'Annual License' },
];

const GST_SLABS = [0, 5, 12, 18, 28];

const formatInr = (value: number) =>
  `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const EMPTY_FORM: CreateProductPayload = {
  sku: '',
  name: '',
  category: 'Industrial Goods',
  hsnSac: '850440',
  unit: 'pcs',
  unitPrice: 0,
  gstRate: 18,
  moq: 1,
  description: '',
  inStock: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalSkus: 0,
    inStockCount: 0,
    categoriesCount: 0,
    avgUnitValue: 0,
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGst, setSelectedGst] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductPayload>(EMPTY_FORM);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchProductsApi({
        search: search.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        gstRate: selectedGst !== 'all' ? selectedGst : undefined,
      });
      setProducts(res.data || []);
      setCategories(res.categories || []);
      setStats(
        res.stats || {
          totalSkus: 0,
          inStockCount: 0,
          categoriesCount: 0,
          avgUnitValue: 0,
        },
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load product catalog.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedGst]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Product) => {
    setEditingProduct(item);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      hsnSac: item.hsnSac,
      unit: item.unit,
      unitPrice: item.unitPrice,
      gstRate: item.gstRate,
      moq: item.moq,
      description: item.description,
      inStock: item.inStock,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsMutating(true);
    setError(null);
    try {
      if (editingProduct) {
        await updateProductApi(editingProduct.id, form);
        showToast(`Updated SKU "${form.name}".`);
      } else {
        await createProductApi(form);
        showToast(`Added SKU "${form.name}" to catalog.`);
      }
      setIsModalOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (item: Product) => {
    setIsMutating(true);
    try {
      await deleteProductApi(item.id);
      showToast(`Removed SKU ${item.sku}.`);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove SKU.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSeed = async () => {
    setIsMutating(true);
    try {
      const res = await seedProductsApi();
      showToast(`Loaded ${res.count} B2B HSN/SAC SKUs into your catalog.`);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed catalog.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCopyPitch = async (item: Product) => {
    const gstPrice = Math.round(item.unitPrice * (1 + item.gstRate / 100));
    const text = `*${item.name}* (SKU: ${item.sku})\nHSN/SAC: ${item.hsnSac} | GST: ${item.gstRate}%\nRate: ${formatInr(item.unitPrice)} / ${item.unit} (+GST = ${formatInr(gstPrice)})\nMOQ: ${item.moq} ${item.unit}\n${item.description || 'Ready for GST billing & dispatch from Delhi-NCR.'}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      showToast('Copy failed — check browser clipboard permissions.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-blue text-xs font-semibold border border-brand-blue/20 mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>HSN/SAC Master Catalog &amp; GST Slab Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Product &amp; HSN Price Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralize SKUs, HSN/SAC codes, GST slabs, and MOQs — pick items straight inside GST Invoices &amp; WhatsApp quotes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.totalSkus === 0 && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={isMutating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Load 5 Sample HSN SKUs</span>
            </button>
          )}

          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-brand-navy hover:bg-slate-50 transition-all"
          >
            <FileText className="w-4 h-4 text-brand-blue" />
            <span>Create GST Invoice</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add SKU / Service</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toast && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Active SKUs</span>
            <Boxes className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.totalSkus}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Synced with GST billing</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ready Stock SKUs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.inStockCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Available for immediate quote</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Categories</span>
            <Tag className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy mt-2">
            {stats.categoriesCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Goods + SAC Services</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Avg Unit Rate</span>
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy mt-2">
            {formatInr(stats.avgUnitValue)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Excl. GST base rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, product name, or HSN/SAC code..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium text-brand-navy"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedGst}
            onChange={(e) => setSelectedGst(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium text-brand-navy"
          >
            <option value="all">All GST Slabs</option>
            {GST_SLABS.map((g) => (
              <option key={g} value={String(g)}>
                {g}% GST
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
            <span className="text-xs font-medium">Loading HSN/SAC catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-brand-navy">No SKUs found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add your B2B products or SAC services once, and auto-populate HSN codes and GST slabs in every invoice &amp; quote.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSeed}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-light text-brand-blue border border-brand-blue/25 hover:bg-brand-blue hover:text-white transition"
              >
                Load 5 Sample HSN SKUs
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-semibold text-white"
              >
                Add First SKU
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">SKU &amp; Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">HSN / SAC</th>
                  <th className="py-3.5 px-4">Base Rate</th>
                  <th className="py-3.5 px-4">GST Slab</th>
                  <th className="py-3.5 px-4">MOQ / Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {products.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 mb-1">
                        {item.sku}
                      </span>
                      <p className="font-bold text-brand-navy">{item.name}</p>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                        {item.hsnSac}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-brand-navy">
                        {formatInr(item.unitPrice)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        per {item.unit}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        {item.gstRate}% GST
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-brand-navy">
                        MOQ {item.moq} {item.unit}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-bold mt-0.5 ${
                          item.inStock ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {item.inStock ? 'In Stock' : 'Made to Order'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyPitch(item)}
                          title="Copy WhatsApp Quote Pitch"
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-blue hover:border-brand-blue/40 transition"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit SKU"
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-navy hover:bg-slate-100 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="Delete SKU"
                          className="p-2 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                {editingProduct ? 'Edit Catalog SKU' : 'Add Product / Service SKU'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    SKU Code (auto if blank)
                  </label>
                  <input
                    type="text"
                    value={form.sku || ''}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="IND-STAB-150"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Product / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="3-Phase Servo Voltage Stabilizer (150 KVA)"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    HSN / SAC *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.hsnSac || ''}
                    onChange={(e) => setForm({ ...form, hsnSac: e.target.value })}
                    placeholder="850440"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Base Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm({ ...form, unitPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    GST Slab %
                  </label>
                  <select
                    value={form.gstRate ?? 18}
                    onChange={(e) =>
                      setForm({ ...form, gstRate: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    {GST_SLABS.map((g) => (
                      <option key={g} value={g}>
                        {g}% GST
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Unit
                  </label>
                  <select
                    value={form.unit ?? 'pcs'}
                    onChange={(e) =>
                      setForm({ ...form, unit: e.target.value as ProductUnit })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category || ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Power Equipment / AMC Services"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Min Order Qty (MOQ)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.moq ?? 1}
                    onChange={(e) =>
                      setForm({ ...form, moq: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Quote Description / Specs
                </label>
                <textarea
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="BIS certified, oil-cooled copper winding with 24-month warranty..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-navy cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inStock ?? true}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>Currently in ready stock for immediate dispatch</span>
              </label>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5"
                >
                  {isMutating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Save Changes' : 'Add to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Code2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import {
  exportGstr1CsvApi,
  exportTallyXmlApi,
  fetchGstr1ComplianceApi,
  updateSellerGstProfileApi,
} from '@/lib/invoices-api';
import { getErrorMessage } from '@/lib/api-client';
import type { Gstr1ComplianceOverviewResponse } from '@/types/contracts';

const formatInr = (val: number) =>
  `₹${(Number(val) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const STATE_OPTIONS = [
  '09 - Uttar Pradesh',
  '07 - Delhi',
  '06 - Haryana',
  '08 - Rajasthan',
  '27 - Maharashtra',
  '24 - Gujarat',
  '29 - Karnataka',
  '33 - Tamil Nadu',
  '36 - Telangana',
  '19 - West Bengal',
  '03 - Punjab',
  '23 - Madhya Pradesh',
];

export default function GstrTallyCompliancePanel() {
  const [month, setMonth] = useState<string>('all');
  const [data, setData] = useState<Gstr1ComplianceOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<'audit' | 'b2b' | 'b2c' | 'hsn' | 'inspect'>(
    'audit',
  );
  const [inspectMode, setInspectMode] = useState<'json' | 'xml'>('json');
  const [xmlPreview, setXmlPreview] = useState<string>('');
  const [includeMasters, setIncludeMasters] = useState<boolean>(true);

  // Seller GST Profile modal
  const [editSellerOpen, setEditSellerOpen] = useState(false);
  const [sellerCompany, setSellerCompany] = useState('');
  const [sellerGstin, setSellerGstin] = useState('');
  const [sellerState, setSellerState] = useState('09 - Uttar Pradesh');
  const [sellerAddress, setSellerAddress] = useState('');
  const [savingSeller, setSavingSeller] = useState(false);

  const loadCompliance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGstr1ComplianceApi(month);
      setData(res);
      setSellerCompany(res.seller.companyName || '');
      setSellerGstin(res.seller.gstin || '');
      setSellerState(res.seller.state || '09 - Uttar Pradesh');
      setSellerAddress(res.seller.address || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadCompliance();
  }, [loadCompliance]);

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async (section: 'all' | 'b2b' | 'b2c' | 'hsn') => {
    setBusyAction(`csv-${section}`);
    setError(null);
    setNotice(null);
    try {
      const res = await exportGstr1CsvApi({
        ...(month !== 'all' ? { month } : {}),
        section,
      });
      downloadFile(res.filename, res.csv, 'text/csv;charset=utf-8;');
      setNotice(
        `Downloaded ${res.filename} (${res.rowCount} rows for ${data?.period.label || month}).`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadPortalJson = () => {
    if (!data) return;
    const gstinTag = data.seller.gstin || 'UNREGISTERED';
    const filename = `GSTR1_${gstinTag}_${data.period.filingPeriodCode}.json`;
    downloadFile(
      filename,
      JSON.stringify(data.portalJson, null, 2),
      'application/json;charset=utf-8;',
    );
    setNotice(
      `Downloaded official GST Portal GSTR-1 JSON (${filename}) covering B2B, B2CS & HSN Table 12.`,
    );
  };

  const handleDownloadTallyXml = async (previewOnly = false) => {
    setBusyAction(previewOnly ? 'xml-preview' : 'xml-download');
    setError(null);
    setNotice(null);
    try {
      const res = await exportTallyXmlApi({
        ...(month !== 'all' ? { month } : {}),
        includeMasters,
      });
      setXmlPreview(res.xml);
      if (previewOnly) {
        setInspectMode('xml');
        setSubTab('inspect');
      } else {
        downloadFile(res.filename, res.xml, 'application/xml;charset=utf-8;');
        setNotice(
          `Downloaded ${res.filename} with ${res.ledgerMasterCount ?? 0} Ledger Masters + ${res.voucherCount} Sales/Receipt Vouchers. Import in TallyPrime → Gateway → Import → Transactions.`,
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveSellerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSeller(true);
    setError(null);
    setNotice(null);
    try {
      const res = await updateSellerGstProfileApi({
        companyName: sellerCompany.trim(),
        gstin: sellerGstin.trim().toUpperCase(),
        state: sellerState.trim(),
        address: sellerAddress.trim(),
      });
      setData(res);
      setEditSellerOpen(false);
      setNotice('Seller GSTIN & billing state updated across GSTR-1 & Tally exports.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingSeller(false);
    }
  };

  const s = data?.summary;
  const seller = data?.seller;

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-full mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TallyPrime XML &amp; CA GSTR-1 / E-Way Compliance Workbench</span>
            </div>
            <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">
              Month-End GST Filing, E-Way Bill Checks &amp; Direct Tally Voucher Bridge
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Zero manual re-entry for your CA: validate GSTIN &amp; Place-of-Supply mismatches, export official GST Portal JSON + HSN summary CSV, and download TallyPrime Ledger Masters &amp; Vouchers XML.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              type="month"
              value={month === 'all' ? '' : month}
              onChange={(e) => setMonth(e.target.value || 'all')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white"
              title="Filter by Return Month (YYYY-MM)"
            />
            {month !== 'all' && (
              <button
                type="button"
                onClick={() => setMonth('all')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-navy"
              >
                All Periods
              </button>
            )}
            <button
              type="button"
              onClick={() => void loadCompliance()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Seller GSTIN Status Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-brand-navy dark:text-white">
                  {seller?.companyName || 'Your Company'}
                </span>
                {seller?.isSellerGstinValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> GSTIN: {seller.gstin}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                    <AlertTriangle className="w-3 h-3" /> Seller GSTIN Missing / Incomplete
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Registered State: <strong>{seller?.state || 'Not Set'}</strong> (Code{' '}
                {seller?.stateCode || '—'}) · Return Period:{' '}
                <strong>{data?.period.label || 'All Periods'}</strong> (FP:{' '}
                <code className="font-mono">{data?.period.filingPeriodCode || '—'}</code>)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditSellerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue shrink-0"
          >
            <Pencil className="w-3.5 h-3.5 text-brand-blue" />
            <span>Edit Seller GSTIN Profile</span>
          </button>
        </div>

        {/* Inline Seller Profile Form */}
        {editSellerOpen && (
          <form
            onSubmit={handleSaveSellerProfile}
            className="p-4 rounded-2xl border border-brand-blue/30 bg-blue-50/40 dark:bg-[#111D33] space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy dark:text-white">
                Workspace Seller GSTIN &amp; Legal Billing Details
              </h4>
              <button
                type="button"
                onClick={() => setEditSellerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={sellerCompany}
                onChange={(e) => setSellerCompany(e.target.value)}
                placeholder="Legal Company Name"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
              />
              <input
                type="text"
                value={sellerGstin}
                onChange={(e) => setSellerGstin(e.target.value.toUpperCase())}
                placeholder="15-char GSTIN (e.g. 09AAACA1234A1Z5)"
                maxLength={15}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono uppercase text-brand-navy dark:text-white"
              />
              <select
                value={sellerState}
                onChange={(e) => setSellerState(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
              >
                {STATE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={savingSeller}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-extrabold hover:bg-blue-600 disabled:opacity-50"
              >
                {savingSeller ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save GSTIN Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Export Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPortalJson}
              disabled={!data}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs disabled:opacity-50"
            >
              <FileJson className="w-4 h-4" />
              <span>Download GST Portal GSTR-1 JSON</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadTallyXml(false)}
              disabled={busyAction !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs disabled:opacity-50"
            >
              {busyAction === 'xml-download' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export TallyPrime XML (Masters + Vouchers)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMasters}
                onChange={(e) => setIncludeMasters(e.target.checked)}
                className="rounded border-slate-300 text-brand-blue"
              />
              <span>Include Party Ledgers</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['b2b', 'B2B CSV'],
                ['b2c', 'B2C CSV'],
                ['hsn', 'HSN Table 12 CSV'],
                ['all', 'Full Audit CSV'],
              ] as const
            ).map(([sec, lbl]) => (
              <button
                key={sec}
                type="button"
                disabled={busyAction !== null}
                onClick={() => void handleExportCsv(sec)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] hover:border-brand-blue text-[11px] font-bold text-brand-navy dark:text-white disabled:opacity-50"
              >
                {busyAction === `csv-${sec}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* CA KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D1628] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            B2B Registered Supplies
          </div>
          <div className="text-xl font-extrabold text-brand-navy dark:text-white mt-1.5">
            {formatInr((s?.b2bTaxable || 0) + (s?.b2bTax || 0))}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {s?.b2bCount ?? 0} GSTIN invoices · Tax {formatInr(s?.b2bTax || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1628] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            B2C / Unregistered Supplies
          </div>
          <div className="text-xl font-extrabold text-brand-navy dark:text-white mt-1.5">
            {formatInr((s?.b2cTaxable || 0) + (s?.b2cTax || 0))}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {s?.b2cCount ?? 0} retail/consumer bills · Tax {formatInr(s?.b2cTax || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1628] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            E-Way Bill Threshold (₹50K+)
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            <span>{s?.ewayRequiredCount ?? 0} Invoices</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {s?.hsnCount ?? 0} unique HSN/SAC buckets tracked
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1628] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            GSTR-1 Filing Readiness
          </div>
          <div
            className={`text-xl font-extrabold mt-1.5 ${
              (s?.complianceScorePct ?? 100) >= 85
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {s?.complianceScorePct ?? 100}% Ready
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {s?.issuesCount ?? 0} errors/warnings · {s?.proformaExcludedCount ?? 0} quotes excluded
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['audit', `Compliance & E-Way Audit (${data?.complianceIssues.length ?? 0})`],
                ['b2b', `GSTR-1 B2B (${data?.b2bInvoices.length ?? 0})`],
                ['b2c', `GSTR-1 B2CS/B2CL (${data?.b2cSummary.length ?? 0})`],
                ['hsn', `HSN Table 12 (${data?.hsnSummary.length ?? 0})`],
                ['inspect', 'JSON / Tally XML Inspector'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSubTab(id);
                  if (id === 'inspect' && inspectMode === 'xml' && !xmlPreview) {
                    void handleDownloadTallyXml(true);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  subTab === id
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#111D33] text-slate-600 dark:text-slate-300 hover:text-brand-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {subTab === 'inspect' && (
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#111D33]">
              <button
                type="button"
                onClick={() => setInspectMode('json')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                  inspectMode === 'json'
                    ? 'bg-white dark:bg-[#0D1628] text-brand-navy dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                GST Portal JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectMode('xml');
                  if (!xmlPreview) void handleDownloadTallyXml(true);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                  inspectMode === 'xml'
                    ? 'bg-white dark:bg-[#0D1628] text-brand-navy dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                TallyPrime XML
              </button>
            </div>
          )}
        </div>

        {/* 1. Compliance & E-Way Audit */}
        {subTab === 'audit' && (
          <div className="space-y-2.5">
            {(data?.complianceIssues || []).length === 0 ? (
              <div className="p-8 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 text-center text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                All Tax Invoices passed GSTIN, Place-of-Supply, and CGST/IGST checks for{' '}
                {data?.period.label}.
              </div>
            ) : (
              (data?.complianceIssues || []).map((issue, idx) => (
                <div
                  key={`${issue.code}-${issue.invoiceId || idx}`}
                  className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    issue.severity === 'error'
                      ? 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                      : issue.severity === 'warning'
                        ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                        : 'bg-sky-50/70 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {issue.severity === 'error' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-extrabold text-brand-navy dark:text-white">
                        {issue.message}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {issue.recommendation}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shrink-0">
                    {issue.code}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. GSTR-1 B2B Register */}
        {subTab === 'b2b' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111D33] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Buyer &amp; GSTIN</th>
                  <th className="py-2.5 px-4">Place of Supply</th>
                  <th className="py-2.5 px-4">Rate</th>
                  <th className="py-2.5 px-4">Taxable Value</th>
                  <th className="py-2.5 px-4">CGST + SGST / IGST</th>
                  <th className="py-2.5 px-4 text-right">Invoice Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {(data?.b2bInvoices || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No B2B GSTIN invoices in this filing period.
                    </td>
                  </tr>
                ) : (
                  (data?.b2bInvoices || []).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-[#111D33]/50">
                      <td className="py-3 px-4 font-bold text-brand-navy dark:text-white">
                        {row.invoiceNumber}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {row.date}
                          {row.ewayRequired && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                              E-Way
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-brand-navy dark:text-white">
                          {row.clientName}
                        </div>
                        <div className="font-mono text-[11px] text-brand-blue">
                          {row.gstin}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {row.placeOfSupply}
                      </td>
                      <td className="py-3 px-4 font-bold">{row.gstRate}%</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatInr(row.taxableAmount)}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        {row.taxType === 'igst'
                          ? `IGST ${formatInr(row.igstAmount)}`
                          : `CGST ${formatInr(row.cgstAmount)} + SGST ${formatInr(row.sgstAmount)}`}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-brand-navy dark:text-white">
                        {formatInr(row.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. GSTR-1 B2CS / B2CL Summary */}
        {subTab === 'b2c' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111D33] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-4">Table</th>
                  <th className="py-2.5 px-4">Place of Supply</th>
                  <th className="py-2.5 px-4">GST Rate</th>
                  <th className="py-2.5 px-4">Bills</th>
                  <th className="py-2.5 px-4">Taxable Value</th>
                  <th className="py-2.5 px-4">CGST / SGST / IGST</th>
                  <th className="py-2.5 px-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {(data?.b2cSummary || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No unregistered / B2C Tax Invoices in this filing period.
                    </td>
                  </tr>
                ) : (
                  (data?.b2cSummary || []).map((row, idx) => (
                    <tr
                      key={`${row.bucket}-${row.placeOfSupply}-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#111D33]/50"
                    >
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                          {row.bucket}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-navy dark:text-white">
                        {row.placeOfSupply}
                      </td>
                      <td className="py-3 px-4 font-bold">{row.gstRate}%</td>
                      <td className="py-3 px-4">{row.invoiceCount}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatInr(row.taxableAmount)}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {row.taxType === 'igst'
                          ? `IGST ${formatInr(row.igstAmount)}`
                          : `CGST ${formatInr(row.cgstAmount)} + SGST ${formatInr(row.sgstAmount)}`}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-brand-navy dark:text-white">
                        {formatInr(row.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. HSN Table 12 Summary */}
        {subTab === 'hsn' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111D33] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-4">HSN / SAC Code</th>
                  <th className="py-2.5 px-4">Sample Item Description</th>
                  <th className="py-2.5 px-4">Rate</th>
                  <th className="py-2.5 px-4">Total Qty</th>
                  <th className="py-2.5 px-4">Taxable Value</th>
                  <th className="py-2.5 px-4">IGST / CGST / SGST</th>
                  <th className="py-2.5 px-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {(data?.hsnSummary || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No HSN/SAC line items recorded in this filing period.
                    </td>
                  </tr>
                ) : (
                  (data?.hsnSummary || []).map((row) => (
                    <tr
                      key={`${row.hsnSac}-${row.gstRate}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#111D33]/50"
                    >
                      <td className="py-3 px-4 font-mono font-extrabold text-brand-blue">
                        {row.hsnSac}
                      </td>
                      <td className="py-3 px-4 max-w-[260px] truncate text-slate-600 dark:text-slate-300">
                        {row.descriptions.join(', ') || 'Goods / Services'}
                      </td>
                      <td className="py-3 px-4 font-bold">{row.gstRate}%</td>
                      <td className="py-3 px-4 font-semibold">{row.totalQuantity}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatInr(row.taxableAmount)}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        IGST {formatInr(row.igstAmount)} · CGST {formatInr(row.cgstAmount)} · SGST{' '}
                        {formatInr(row.sgstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-brand-navy dark:text-white">
                        {formatInr(row.totalValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Portal JSON / Tally XML Live Inspector */}
        {subTab === 'inspect' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Code2 className="w-3.5 h-3.5 text-brand-blue" />
                {inspectMode === 'json'
                  ? `Official GST Portal GSTR-1 JSON (${data?.period.filingPeriodCode || '—'})`
                  : 'TallyPrime <ENVELOPE> XML (Party Ledger Masters + Sales/Receipt Vouchers)'}
              </span>
              {inspectMode === 'xml' && (
                <button
                  type="button"
                  onClick={() => void handleDownloadTallyXml(true)}
                  className="text-brand-blue font-bold hover:underline inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Regenerate XML Preview
                </button>
              )}
            </div>
            <pre className="max-h-[420px] overflow-auto p-4 rounded-2xl bg-slate-950 text-sky-200 font-mono text-[11px] leading-relaxed">
              {inspectMode === 'json'
                ? JSON.stringify(data?.portalJson || {}, null, 2)
                : xmlPreview || 'Loading TallyPrime XML preview...'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

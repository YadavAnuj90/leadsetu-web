'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  IndianRupee,
  BellRing,
  Download,
  Landmark,
  Sliders,
  Loader2,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Edit3,
  Send,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  checkAiCopilotHealthApi,
  scoreAiCreditRiskApi,
  draftAiUdhaarReminderApi,
  type CreditRiskAiResult,
} from '@/lib/ai-copilot-api';
import {
  fetchRecoveryOverviewApi,
  updateRecoveryConfigApi,
  sendRecoveryChaserApi,
  runBatchChasersApi,
  recordInvoicePtpApi,
  exportTallyXmlApi,
  previewBankReconApi,
  applyBankReconMatchesApi,
  verifyContactGstinApi,
  updateContactCreditApi,
} from '@/lib/invoices-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { isFeatureEnabled } from '@/lib/feature-access';
import type {
  BankStatementPreviewMatch,
  CreditRecoveryOverviewResponse,
  CreditRiskLedgerRow,
  Invoice,
} from '@/types/contracts';

interface CreditRecoveryPanelProps {
  onOpenPaymentModal?: (inv: Invoice) => void;
  onRefreshParent?: () => void;
}

const SAMPLE_BANK_CSV = `${new Date().toISOString().slice(0, 10)}, NEFT CR-HDFC-BANSAL STEEL & INFRA PROJECTS-INV-2026-1004, HDFCR92026111500412, 448400
${new Date().toISOString().slice(0, 10)}, RTGS CR-RS ELECTRICALS & SWITCHGEAR-INV-2026-1002 BAL, ICICR52026111500877, 362800
${new Date().toISOString().slice(0, 10)}, UPI/432098761234/APEX AUTO ADVANCE, UPI432098761234, 150000`;

function formatInr(n: number) {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

export default function CreditRecoveryPanel({
  onOpenPaymentModal,
  onRefreshParent,
}: CreditRecoveryPanelProps) {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const creditAiEnabled =
    isFeatureEnabled(tenant, 'aiScoring', user) &&
    isFeatureEnabled(tenant, 'aiCreditRisk', user);
  const [data, setData] = useState<CreditRecoveryOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Last chaser preview toast
  const [chaserPreview, setChaserPreview] = useState<{
    invoiceNumber: string;
    message: string;
    upiLink: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Credit Limit Edit Modal
  const [editingBuyer, setEditingBuyer] = useState<CreditRiskLedgerRow | null>(null);
  const [creditLimitInput, setCreditLimitInput] = useState('500000');
  const [creditTermInput, setCreditTermInput] = useState('30');
  const [creditHoldInput, setCreditHoldInput] = useState(false);
  const [creditHoldReasonInput, setCreditHoldReasonInput] = useState('');

  // Promise-to-Pay Modal
  const [ptpInvoice, setPtpInvoice] = useState<Invoice | null>(null);
  const [ptpDate, setPtpDate] = useState('');
  const [ptpAmount, setPtpAmount] = useState('');
  const [ptpNote, setPtpNote] = useState('');

  // Recovery Policy Settings Modal
  const [configOpen, setConfigOpen] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [autoHoldDays, setAutoHoldDays] = useState('30');
  const [autoChasersEnabled, setAutoChasersEnabled] = useState(true);
  const [bankNote, setBankNote] = useState('');

  // Bank Statement Auto-Reconciler Modal
  const [reconOpen, setReconOpen] = useState(false);
  const [bankCsvText, setBankCsvText] = useState(SAMPLE_BANK_CSV);
  const [reconResults, setReconResults] = useState<BankStatementPreviewMatch[] | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Record<string, boolean>>({});

  // Pillar 1 AI Copilot State (leadsetu-ai)
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [chaserLang, setChaserLang] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [aiBuyerTarget, setAiBuyerTarget] = useState<CreditRiskLedgerRow | null>(null);
  const [aiPromiseText, setAiPromiseText] = useState('');
  const [aiNewOrderValue, setAiNewOrderValue] = useState('50000');
  const [aiRiskLoading, setAiRiskLoading] = useState(false);
  const [aiRiskResult, setAiRiskResult] = useState<{
    source: string;
    model?: string;
    data: CreditRiskAiResult;
  } | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRecoveryOverviewApi();
      setData(res);
      setUpiId(res.recoveryConfig.upiId);
      setMerchantName(res.recoveryConfig.merchantName);
      setAutoHoldDays(String(res.recoveryConfig.autoHoldAfterDays));
      setAutoChasersEnabled(res.recoveryConfig.autoChasersEnabled);
      setBankNote(res.recoveryConfig.bankAccountNote);
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    checkAiCopilotHealthApi()
      .then((res) => setAiOnline(Boolean(res.connected)))
      .catch(() => setAiOnline(false));
  }, [loadOverview]);

  const runBuyerAiRisk = async (
    row: CreditRiskLedgerRow,
    promiseOverride?: string,
    orderOverride?: string,
  ) => {
    setAiBuyerTarget(row);
    setAiRiskLoading(true);
    try {
      const res = await scoreAiCreditRiskApi({
        dealerName: row.buyerName,
        gstin: row.gstin || undefined,
        creditLimitInr: row.creditLimitInr || 0,
        outstandingInr: row.openBalanceInr || 0,
        overdueInr: row.overdueBalanceInr || 0,
        maxOverdueDays: row.maxOverdueDays || 0,
        orderValueInr: Number(orderOverride ?? aiNewOrderValue) || 0,
        recentPromiseText: (promiseOverride ?? aiPromiseText).trim() || undefined,
      });
      if (res.response?.structured) {
        setAiRiskResult({
          source: res.source,
          model: res.response.model,
          data: res.response.structured,
        });
      } else {
        setBanner({
          type: 'err',
          text: 'leadsetu-ai service (port 3002) is offline. Start leadsetu-ai for live Pillar 1 AI risk scoring.',
        });
        setAiRiskResult(null);
      }
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setAiRiskLoading(false);
    }
  };

  const handleAiDraftPreview = async (inv: Invoice) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await draftAiUdhaarReminderApi({
        dealerName: inv.clientName,
        contactPerson: inv.contactPerson,
        invoiceNumber: inv.invoiceNumber,
        overdueInr: Number(inv.balanceDue ?? inv.grandTotal) || 0,
        overdueDays: Number(inv.daysOverdue || 1),
        language: chaserLang,
        paymentLink: inv.paymentLink || undefined,
        companyName: data?.recoveryConfig.merchantName || undefined,
      });
      if (res.response?.result) {
        setChaserPreview({
          invoiceNumber: `${inv.invoiceNumber} (${chaserLang.toUpperCase()} AI Draft)`,
          message: res.response.result,
          upiLink: inv.paymentLink || '',
        });
      } else {
        setBanner({
          type: 'err',
          text: 'leadsetu-ai service (port 3002) is offline. Start leadsetu-ai or use WhatsApp + UPI.',
        });
      }
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDownloadTallyXml = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await exportTallyXmlApi();
      const blob = new Blob([res.xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setBanner({
        type: 'ok',
        text: `Downloaded TallyPrime XML (${res.voucherCount} Sales + Receipt vouchers). Import via Gateway of Tally → Import Data → Vouchers.`,
      });
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleRunBatchChasers = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await runBatchChasersApi();
      setBanner({
        type: 'ok',
        text: `Dispatched ${res.sentCount} Hinglish WhatsApp + UPI chasers${
          res.autoHoldCount > 0
            ? ` and auto-placed ${res.autoHoldCount} defaulter account(s) on Credit Hold.`
            : '.'
        }`,
      });
      await loadOverview();
      onRefreshParent?.();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleSendSingleChaser = async (inv: Invoice, tone?: 'polite' | 'firm' | 'urgent' | 'final_hold') => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await sendRecoveryChaserApi(inv.id, {
        tone,
        language: chaserLang,
      });
      setChaserPreview({
        invoiceNumber: inv.invoiceNumber,
        message: res.chaserMessage,
        upiLink: res.upiLink,
      });
      setBanner({
        type: 'ok',
        text: `WhatsApp + UPI recovery chaser dispatched for ${inv.invoiceNumber} (${formatInr(inv.balanceDue ?? inv.grandTotal)}).`,
      });
      await loadOverview();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const openCreditModal = (row: CreditRiskLedgerRow) => {
    setEditingBuyer(row);
    setCreditLimitInput(String(row.creditLimitInr || 0));
    setCreditTermInput(String(row.creditTermDays || 15));
    setCreditHoldInput(row.creditHold);
    setCreditHoldReasonInput(row.creditHoldReason || '');
  };

  const handleSaveCreditPolicy = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBuyer?.contactId) {
      setBanner({
        type: 'err',
        text: 'Create this buyer under Contacts & Companies first to enforce per-party credit limits.',
      });
      return;
    }
    setBusy(true);
    try {
      await updateContactCreditApi(editingBuyer.contactId, {
        creditLimitInr: Math.max(0, Number(creditLimitInput) || 0),
        creditTermDays: Math.max(0, Number(creditTermInput) || 15),
        creditHold: creditHoldInput,
        creditHoldReason: creditHoldReasonInput.trim(),
      });
      setEditingBuyer(null);
      setBanner({
        type: 'ok',
        text: `Updated credit limit & guardrail for ${editingBuyer.buyerName}.`,
      });
      await loadOverview();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyGstin = async (row: CreditRiskLedgerRow) => {
    if (!row.contactId) return;
    setBusy(true);
    try {
      const res = await verifyContactGstinApi(row.contactId, row.gstin);
      setBanner({
        type: res.validation?.valid ? 'ok' : 'err',
        text: `${row.buyerName}: ${res.validation?.reason || 'GSTIN checked.'}`,
      });
      await loadOverview();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const openPtpModal = (inv: Invoice) => {
    setPtpInvoice(inv);
    setPtpDate(
      inv.promisedPaymentDate ||
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    );
    setPtpAmount(String(inv.promisedAmount || inv.balanceDue || inv.grandTotal));
    setPtpNote(inv.ptpNote || '');
  };

  const handleSavePtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!ptpInvoice || !ptpDate) return;
    setBusy(true);
    try {
      await recordInvoicePtpApi(ptpInvoice.id, {
        promisedPaymentDate: ptpDate,
        promisedAmount: Number(ptpAmount) || 0,
        ptpNote: ptpNote.trim(),
      });
      setPtpInvoice(null);
      setBanner({
        type: 'ok',
        text: `Promise-to-Pay saved for ${ptpInvoice.invoiceNumber} (due ${ptpDate}).`,
      });
      await loadOverview();
      onRefreshParent?.();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateRecoveryConfigApi({
        upiId,
        merchantName,
        autoHoldAfterDays: Number(autoHoldDays) || 30,
        autoChasersEnabled,
        bankAccountNote: bankNote,
      });
      setConfigOpen(false);
      setBanner({ type: 'ok', text: 'Updated Udhaar Recovery & UPI Policy.' });
      await loadOverview();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handlePreviewRecon = async () => {
    const lines = bankCsvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const entries = lines.map((line, i) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        id: `bnk-${i + 1}`,
        date: parts[0] || new Date().toISOString().slice(0, 10),
        narration: parts[1] || line,
        utrOrRef: parts[2] || `UTR-${i + 1}`,
        creditAmount: Number(String(parts[3] || '0').replace(/[^0-9.]/g, '')) || 0,
      };
    });
    setBusy(true);
    try {
      const res = await previewBankReconApi(entries);
      setReconResults(res.results);
      const nextSel: Record<string, boolean> = {};
      for (const r of res.results) {
        if (r.confidence !== 'unmatched' && r.matchedInvoiceId) {
          nextSel[r.entryId] = true;
        }
      }
      setSelectedEntryIds(nextSel);
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleApplyRecon = async () => {
    if (!reconResults) return;
    const toApply = reconResults
      .filter((r) => selectedEntryIds[r.entryId] && r.matchedInvoiceId)
      .map((r) => ({
        invoiceId: r.matchedInvoiceId,
        amountPaid: Math.min(r.creditAmount, r.openBalanceDue),
        tdsDeducted: r.suggestedTds || 0,
        utrOrChequeNo: r.utrOrRef,
        paymentDate: r.date,
        paymentMode: r.paymentMode,
        note: `Bank Recon Auto-Matched (${r.narration.slice(0, 60)})`,
      }));
    if (toApply.length === 0) return;

    setBusy(true);
    try {
      const res = await applyBankReconMatchesApi(toApply);
      setReconOpen(false);
      setReconResults(null);
      setBanner({
        type: 'ok',
        text: `Settled ${res.settledCount} invoice(s) directly from bank credits!`,
      });
      await loadOverview();
      onRefreshParent?.();
    } catch (err) {
      setBanner({ type: 'err', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
        <span className="text-sm font-semibold">Loading Credit Control &amp; Udhaar Command Center...</span>
      </div>
    );
  }

  const kpis = data?.kpis;
  const ledger = data?.creditRiskLedger || [];
  const overdueQueue = data?.overdueQueue || [];
  const promisesQueue = data?.promisesQueue || [];

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy rounded-2xl p-5 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Indian B2B Credit Guardrails &amp; Udhaar Engine
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold">
            Receivables Recovery, Credit-Hold &amp; TallyPrime Bridge
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
            <span>
              UPI ID: <span className="font-mono text-white">{data?.recoveryConfig.upiId}</span> · Auto-Hold after{' '}
              <span className="font-semibold text-amber-300">{data?.recoveryConfig.autoHoldAfterDays} overdue days</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                aiOnline
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-white/10 text-slate-300 border border-white/15'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {aiOnline ? 'Pillar 1 AI Connected (3002)' : 'Local Recovery Rules'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleDownloadTallyXml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>TallyPrime XML</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setReconOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
          >
            <Landmark className="w-3.5 h-3.5 text-sky-300" />
            <span>Bank Statement Recon</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfigOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-200" />
            <span>UPI &amp; Policy</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleRunBatchChasers}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
            <span>Run Auto-Chasers</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-xl px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 border ${
            banner.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {chaserPreview && (
        <div className="bg-emerald-950 text-emerald-50 rounded-2xl p-4 border border-emerald-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              WhatsApp + UPI Recovery Dispatched · {chaserPreview.invoiceNumber}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyText('chaser-msg', chaserPreview.message)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700"
              >
                {copiedKey === 'chaser-msg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Message</span>
              </button>
              <button type="button" onClick={() => setChaserPreview(null)}>
                <X className="w-4 h-4 text-emerald-300" />
              </button>
            </div>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans bg-black/25 rounded-xl p-3 text-emerald-100">
            {chaserPreview.message}
          </pre>
        </div>
      )}

      {/* 4 Recovery KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open Market Udhaar</p>
          <p className="text-2xl font-extrabold text-brand-navy mt-1">
            {formatInr(kpis?.totalOpenUdhaar || 0)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {kpis?.recoveryRatePct ?? 100}% lifetime collection rate
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Overdue Receivables</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {formatInr(kpis?.overdueUdhaar || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{kpis?.overdueCount || 0} overdue tax invoices</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Broken Promises (PTP)</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {kpis?.brokenPromisesCount || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {kpis?.activePromisesCount || 0} active buyer commitments
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blocked / Credit Hold</p>
          <p className="text-2xl font-extrabold text-brand-navy mt-1">
            {kpis?.blockedAccountsCount || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">New quotes/dispatches guarded</p>
        </div>
      </div>

      {/* Buyer Credit Risk & GSTIN Guardrail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-brand-navy">
              Buyer Credit Limits, Utilization &amp; GSTIN Verification
            </h3>
            <p className="text-xs text-slate-500">
              Invoices &amp; conversions automatically check Credit Limits, Credit Hold, and overdue threshold.
            </p>
          </div>
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Buyer &amp; GSTIN</th>
                <th className="py-3 px-4">Credit Policy</th>
                <th className="py-3 px-4">Open / Overdue</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No buyer accounts yet. Load sample contacts/invoices to test credit controls.
                  </td>
                </tr>
              ) : (
                ledger.map((row, idx) => (
                  <tr key={`${row.contactId || row.buyerName}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-navy">{row.buyerName}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono">{row.gstin || 'No GSTIN'}</span>
                        {row.gstin && (
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              row.gstinStatus === 'verified_active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : row.gstinStatus === 'checksum_failed' || row.gstinStatus === 'invalid_format'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.gstinStatus === 'verified_active'
                              ? 'GSTIN Verified'
                              : row.gstinStatus === 'checksum_failed'
                                ? 'Bad Checksum'
                                : row.gstinStatus === 'invalid_format'
                                  ? 'Invalid Format'
                                  : 'Unverified'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {row.creditLimitInr > 0 ? formatInr(row.creditLimitInr) : 'Uncapped'}
                      </div>
                      <div className="text-[11px] text-slate-500">Net {row.creditTermDays} Days</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-navy">{formatInr(row.openBalanceInr)}</div>
                      {row.overdueBalanceInr > 0 && (
                        <div className="text-[11px] font-semibold text-rose-600">
                          {formatInr(row.overdueBalanceInr)} overdue ({row.maxOverdueDays}d)
                        </div>
                      )}
                      {row.creditLimitInr > 0 && (
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              row.utilizationPct >= 100
                                ? 'bg-rose-500'
                                : row.utilizationPct >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, row.utilizationPct)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          row.riskLevel === 'hold'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : row.riskLevel === 'critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : row.riskLevel === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {row.creditHold
                          ? 'CREDIT HOLD'
                          : row.riskLevel === 'critical'
                            ? 'LIMIT / DAYS BREACHED'
                            : row.riskLevel === 'warning'
                              ? 'WATCHLIST'
                              : 'HEALTHY'}
                      </span>
                      {row.creditHoldReason && (
                        <p className="text-[11px] text-rose-600 mt-1 max-w-[200px] truncate" title={row.creditHoldReason}>
                          {row.creditHoldReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {creditAiEnabled && (
                          <button
                            type="button"
                            onClick={() => runBuyerAiRisk(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                            title="Run Pillar 1 AI Credit Risk & Promise Analyzer"
                          >
                            <Sparkles className="w-3 h-3" /> AI Risk
                          </button>
                        )}
                        {row.contactId && row.gstin && (
                          <button
                            type="button"
                            onClick={() => handleVerifyGstin(row)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Verify 15-digit GSTIN Mod-36 checksum"
                          >
                            Verify GSTIN
                          </button>
                        )}
                        {row.contactId && (
                          <button
                            type="button"
                            onClick={() => openCreditModal(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Credit / Hold
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Recovery Queue & Promises-to-Pay */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-brand-navy">
                Overdue Udhaar Recovery Queue ({overdueQueue.length})
              </h3>
              <p className="text-xs text-slate-500">
                Trigger instant AI-crafted WhatsApp + NPCI UPI chasers or log buyer Promise-to-Pay dates.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['hinglish', 'hindi', 'english'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setChaserLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                    chaserLang === lang
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'text-slate-600 hover:text-brand-navy'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All tax invoices are within credit terms — zero overdue Udhaar right now!
              </div>
            ) : (
              overdueQueue.map((inv) => (
                <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-navy">{inv.invoiceNumber}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {inv.daysOverdue || 1}d Overdue
                      </span>
                      {inv.chaserStage && inv.chaserStage !== 'none' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          Chased ×{inv.chaserCount || 1} ({inv.chaserStage.replace(/_/g, ' ')})
                        </span>
                      )}
                      {inv.isPtpBroken && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          PTP Broken ({inv.promisedPaymentDate})
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1">{inv.clientName}</p>
                    <p className="text-xs text-slate-500">
                      Balance Due: <span className="font-bold text-rose-600">{formatInr(inv.balanceDue ?? inv.grandTotal)}</span>
                      {inv.dueDate ? ` · Due ${inv.dueDate}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPtpModal(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-amber-600" /> Log PTP
                    </button>
                    {onOpenPaymentModal && (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                      >
                        <IndianRupee className="w-3.5 h-3.5" /> Settle
                      </button>
                    )}
                    {creditAiEnabled && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAiDraftPreview(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                        title="Preview Pillar 1 AI Reminder in selected language"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Draft
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSendSingleChaser(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="w-3.5 h-3.5" /> WhatsApp + UPI
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Promises-to-Pay Tracker */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-bold text-brand-navy">
              Promise-to-Pay (PTP) Watchlist
            </h3>
            <p className="text-xs text-slate-500">Track buyer payment commitments &amp; missed dates.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {promisesQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No promises logged yet. Click &ldquo;Log PTP&rdquo; when a buyer commits a NEFT/UPI date.
              </div>
            ) : (
              promisesQueue.map((p) => (
                <div key={p.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-navy">{p.invoiceNumber}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        p.isPtpBroken ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {p.isPtpBroken ? 'Broken PTP' : 'Committed'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{p.clientName}</p>
                  <p className="text-xs text-slate-600">
                    {formatInr(p.promisedAmount || p.balanceDue || 0)} by{' '}
                    <span className="font-semibold">{p.promisedPaymentDate}</span>
                  </p>
                  {p.ptpNote && <p className="text-[11px] text-slate-500 italic">&ldquo;{p.ptpNote}&rdquo;</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Credit Limit / Hold Modal */}
      {editingBuyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCreditPolicy}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-brand-navy">
                Credit Controls · {editingBuyer.buyerName}
              </h3>
              <button type="button" onClick={() => setEditingBuyer(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={creditLimitInput}
                  onChange={(e) => setCreditLimitInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Credit Terms (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={creditTermInput}
                  onChange={(e) => setCreditTermInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 cursor-pointer">
              <input
                type="checkbox"
                checked={creditHoldInput}
                onChange={(e) => setCreditHoldInput(e.target.checked)}
                className="w-4 h-4 accent-rose-600"
              />
              <div>
                <span className="text-xs font-bold text-rose-800 block">Place Account on CREDIT HOLD</span>
                <span className="text-[11px] text-rose-600">
                  Blocks agents from generating invoices or converting quotes without Admin override.
                </span>
              </div>
            </label>
            {creditHoldInput && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hold Reason</label>
                <input
                  type="text"
                  value={creditHoldReasonInput}
                  onChange={(e) => setCreditHoldReasonInput(e.target.value)}
                  placeholder="e.g., Invoice overdue > 30 days / PDC bounced"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBuyer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Save Credit Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Promise-to-Pay Modal */}
      {ptpInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePtp}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-brand-navy">
                Log Promise-to-Pay · {ptpInvoice.invoiceNumber}
              </h3>
              <button type="button" onClick={() => setPtpInvoice(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Committed Date</label>
                <input
                  type="date"
                  required
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Promised Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Commitment Remark</label>
              <input
                type="text"
                value={ptpNote}
                onChange={(e) => setPtpNote(e.target.value)}
                placeholder="e.g., Accounts head confirmed NEFT by Friday 4 PM"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPtpInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Save Commitment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recovery Policy Config Modal */}
      {configOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-brand-navy">
                Udhaar Recovery, UPI &amp; Auto-Hold Policy
              </h3>
              <button type="button" onClick={() => setConfigOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Merchant UPI ID (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Auto-Hold After Overdue Days</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={autoHoldDays}
                  onChange={(e) => setAutoHoldDays(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Merchant Display Name</label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">NEFT / RTGS Bank Account Instructions</label>
              <input
                type="text"
                value={bankNote}
                onChange={(e) => setBankNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={autoChasersEnabled}
                onChange={(e) => setAutoChasersEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              Enable batch escalation &amp; automated Credit Hold enforcement
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfigOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Save Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank Statement Auto-Reconciler Modal */}
      {reconOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-brand-navy">
                  Bank Statement Auto-Reconciler (NEFT / RTGS / UPI)
                </h3>
                <p className="text-xs text-slate-500">
                  Paste CSV rows (`Date, Narration, UTR, Credit INR`) to auto-match open GST invoices &amp; detect 2%/10% TDS.
                </p>
              </div>
              <button type="button" onClick={() => setReconOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <textarea
              rows={4}
              value={bankCsvText}
              onChange={(e) => setBankCsvText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setBankCsvText(SAMPLE_BANK_CSV)}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                Reset Sample HDFC/ICICI Credits
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handlePreviewRecon}
                className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Match Against Open Invoices</span>
              </button>
            </div>

            {reconResults && (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="space-y-2">
                  {reconResults.map((r) => (
                    <label
                      key={r.entryId}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                        r.confidence === 'high'
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : r.confidence === 'medium'
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!r.matchedInvoiceId}
                        checked={Boolean(selectedEntryIds[r.entryId])}
                        onChange={(e) =>
                          setSelectedEntryIds((prev) => ({
                            ...prev,
                            [r.entryId]: e.target.checked,
                          }))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-brand-navy">
                            {formatInr(r.creditAmount)} · {r.paymentMode} ({r.utrOrRef})
                          </span>
                          <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-white border">
                            {r.confidence} match
                          </span>
                        </div>
                        <p className="text-slate-600 truncate mt-0.5">{r.narration}</p>
                        {r.matchedInvoiceId ? (
                          <p className="text-emerald-800 font-semibold mt-1">
                            → {r.matchedInvoiceNumber} ({r.matchedClientName}) · Open {formatInr(r.openBalanceDue)}
                            {r.suggestedTds > 0 ? ` · Auto TDS ${formatInr(r.suggestedTds)}` : ''} ({r.matchReasons.join(', ')})
                          </p>
                        ) : (
                          <p className="text-slate-400 mt-1">No matching open invoice found.</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReconOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={busy || !Object.values(selectedEntryIds).some(Boolean)}
                    onClick={handleApplyRecon}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Post Selected Settlements to Ledger</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Pillar 1 AI Credit Risk & Hinglish Vaada Analyzer Modal */}
      {aiBuyerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Pillar 1 AI · Credit &amp; Vaada Control
                </div>
                <h3 className="text-base font-extrabold text-brand-navy mt-1.5">
                  {aiBuyerTarget.buyerName}
                </h3>
                <p className="text-xs text-slate-500">
                  Limit {formatInr(aiBuyerTarget.creditLimitInr)} · Open{' '}
                  {formatInr(aiBuyerTarget.openBalanceInr)} · Overdue{' '}
                  {formatInr(aiBuyerTarget.overdueBalanceInr)} ({aiBuyerTarget.maxOverdueDays}d)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiBuyerTarget(null);
                  setAiRiskResult(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Proposed New Dispatch Value (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={aiNewOrderValue}
                  onChange={(e) => setAiNewOrderValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-brand-navy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Dealer&apos;s Recent WhatsApp / Call Vaada
                </label>
                <input
                  type="text"
                  value={aiPromiseText}
                  onChange={(e) => setAiPromiseText(e.target.value)}
                  placeholder="e.g. Bhai Monday tak 50k NEFT kar dunga"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-brand-navy"
                />
              </div>
            </div>

            {aiRiskLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                <span>Analyzing dealer credit ledger via leadsetu-ai...</span>
              </div>
            ) : aiRiskResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-400">AI Risk Score</div>
                    <div className="text-xl font-black text-brand-navy">
                      {aiRiskResult.data.riskScore}/100
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Risk Tier</div>
                    <div
                      className={`text-sm font-black mt-1 ${
                        aiRiskResult.data.riskTier === 'CRITICAL' ||
                        aiRiskResult.data.riskTier === 'HIGH'
                          ? 'text-rose-600'
                          : aiRiskResult.data.riskTier === 'MEDIUM'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }`}
                    >
                      {aiRiskResult.data.riskTier}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Dispatch Decision</div>
                    <div className="text-xs font-extrabold text-brand-blue mt-1 capitalize">
                      {aiRiskResult.data.recommendedAction.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-indigo-900">AI Assessment: </span>
                  {aiRiskResult.data.summary}
                </div>

                {aiRiskResult.data.extractedPromise?.hasPromise && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Extracted Vaada:</strong>{' '}
                      {aiRiskResult.data.extractedPromise.promisedAmountInr
                        ? formatInr(aiRiskResult.data.extractedPromise.promisedAmountInr)
                        : 'Partial/Full payment'}{' '}
                      {aiRiskResult.data.extractedPromise.promisedTimeline
                        ? `on ${aiRiskResult.data.extractedPromise.promisedTimeline}`
                        : ''}
                    </span>
                  </div>
                )}

                {aiRiskResult.data.reasons.length > 0 && (
                  <ul className="space-y-1 text-xs text-slate-600 list-disc pl-5">
                    {aiRiskResult.data.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAiBuyerTarget(null);
                  setAiRiskResult(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600"
              >
                Close
              </button>
              <button
                type="button"
                disabled={aiRiskLoading}
                onClick={() => runBuyerAiRisk(aiBuyerTarget)}
                className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-Score with Order &amp; Vaada</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

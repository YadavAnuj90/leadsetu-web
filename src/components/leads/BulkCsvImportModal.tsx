'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Columns,
  Download,
  FileSpreadsheet,
  GitMerge,
  Loader2,
  Route,
  SkipForward,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type {
  BulkImportLeadsResponse,
  CreateLeadPayload,
  CustomFieldDef,
  LeadSource,
  LeadStatus,
} from '@/types/contracts';
import { bulkImportLeadsApi } from '@/lib/leads-capture-api';
import { fetchCustomFieldsApi } from '@/lib/custom-fields-api';

interface BulkCsvImportModalProps {
  onClose: () => void;
  onImported: () => Promise<void> | void;
}

type TargetFieldKey =
  | 'ignore'
  | 'name'
  | 'company'
  | 'phone'
  | 'email'
  | 'city'
  | 'source'
  | 'status'
  | 'accountKind'
  | 'estimatedValue'
  | 'tags'
  | 'notes'
  | `cf:${string}`;

interface ParsedSheetData {
  fileName: string;
  headers: string[];
  rows: string[][];
}

interface EvaluatedImportRow {
  rowIndex: number;
  payload: CreateLeadPayload;
  errors: string[];
  warnings: string[];
  inFileDuplicate: boolean;
}

const STANDARD_FIELDS: Array<{
  key: Exclude<TargetFieldKey, 'ignore' | `cf:${string}`>;
  label: string;
  required?: boolean;
  aliases: string[];
}> = [
  {
    key: 'name',
    label: 'Full Name *',
    required: true,
    aliases: ['name', 'fullname', 'buyername', 'contactname', 'leadname', 'customer'],
  },
  {
    key: 'company',
    label: 'Company / Business',
    aliases: ['company', 'org', 'organization', 'firm', 'business', 'enterprise'],
  },
  {
    key: 'phone',
    label: 'Phone / WhatsApp',
    aliases: ['phone', 'mobile', 'whatsapp', 'tel', 'contactno', 'phonenumber', 'mob'],
  },
  {
    key: 'email',
    label: 'Email Address',
    aliases: ['email', 'mail', 'emailaddress'],
  },
  {
    key: 'city',
    label: 'City / Location',
    aliases: ['city', 'location', 'town', 'state', 'region', 'hub'],
  },
  {
    key: 'source',
    label: 'Lead Source',
    aliases: ['source', 'channel', 'origin', 'campaignsource', 'utmsource'],
  },
  {
    key: 'status',
    label: 'Pipeline Stage',
    aliases: ['status', 'stage', 'leadstage'],
  },
  {
    key: 'accountKind',
    label: 'Account Kind (B2B/B2C)',
    aliases: ['accountkind', 'kind', 'segment', 'customertype'],
  },
  {
    key: 'estimatedValue',
    label: 'Estimated Value (₹)',
    aliases: ['estimatedvalue', 'value', 'budget', 'dealvalue', 'amount', 'price'],
  },
  {
    key: 'tags',
    label: 'Tags (comma-separated)',
    aliases: ['tags', 'tag', 'labels', 'category'],
  },
  {
    key: 'notes',
    label: 'Notes / Requirement',
    aliases: ['note', 'notes', 'remark', 'remarks', 'query', 'message', 'requirement'],
  },
];

const CSV_HEADER_TEMPLATE =
  'Name,Company,Phone,Email,City,Source,EstimatedValue,Tags,Notes\nRajesh Sharma,RS Electricals Pvt Ltd,+91 9811245678,rajesh@rselectricals.in,Noida,indiamart,450000,"Bulk Order,GST",Need 500 switchgear units urgently\n';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseRawCsv(csvText: string): ParsedSheetData | null {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]).map((h, i) => h || `Column ${i + 1}`);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => !c.trim())) continue;
    rows.push(headers.map((_, idx) => String(cols[idx] ?? '').trim()));
  }
  if (rows.length === 0) return null;
  return { fileName: 'Pasted CSV Data', headers, rows };
}

function normalizeSource(raw?: string): LeadSource {
  const v = (raw || '').trim().toLowerCase();
  if (
    v === 'whatsapp' ||
    v === 'indiamart' ||
    v === 'justdial' ||
    v === 'tradeindia' ||
    v === 'meta_ads' ||
    v === 'meta_lead_ads' ||
    v === 'google_ads' ||
    v === 'website' ||
    v === 'referral' ||
    v === 'manual'
  ) {
    return v;
  }
  if (v.includes('india')) return 'indiamart';
  if (v.includes('trade')) return 'tradeindia';
  if (v.includes('just')) return 'justdial';
  if (v.includes('meta') || v.includes('fb') || v.includes('insta')) return 'meta_ads';
  if (v.includes('google')) return 'google_ads';
  if (v.includes('whats')) return 'whatsapp';
  if (v.includes('web')) return 'website';
  if (v.includes('ref')) return 'referral';
  return 'manual';
}

function normalizeStatus(raw?: string): LeadStatus | undefined {
  const v = (raw || '').trim().toLowerCase();
  if (
    v === 'new' ||
    v === 'contacted' ||
    v === 'qualified' ||
    v === 'proposal' ||
    v === 'converted' ||
    v === 'lost'
  ) {
    return v;
  }
  return undefined;
}

function last10Digits(raw?: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function autoGuessMapping(
  headers: string[],
  customFields: CustomFieldDef[],
): Record<number, TargetFieldKey> {
  const map: Record<number, TargetFieldKey> = {};
  const usedTargets = new Set<string>();

  headers.forEach((rawHeader, colIdx) => {
    const norm = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!norm) {
      map[colIdx] = 'ignore';
      return;
    }

    // 1. Exact or alias standard field match
    for (const sf of STANDARD_FIELDS) {
      if (usedTargets.has(sf.key)) continue;
      if (sf.aliases.some((alias) => norm === alias || norm.includes(alias))) {
        map[colIdx] = sf.key;
        usedTargets.add(sf.key);
        return;
      }
    }

    // 2. Match tenant custom field by key or label
    for (const cf of customFields) {
      const targetKey = `cf:${cf.key}` as TargetFieldKey;
      if (usedTargets.has(targetKey)) continue;
      const cfKeyNorm = cf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cfLabelNorm = cf.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        norm === cfKeyNorm ||
        norm === cfLabelNorm ||
        (cfLabelNorm.length >= 3 && norm.includes(cfLabelNorm))
      ) {
        map[colIdx] = targetKey;
        usedTargets.add(targetKey);
        return;
      }
    }

    map[colIdx] = 'ignore';
  });

  return map;
}

export default function BulkCsvImportModal({
  onClose,
  onImported,
}: BulkCsvImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvText, setCsvText] = useState('');
  const [sheet, setSheet] = useState<ParsedSheetData | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [columnMap, setColumnMap] = useState<Record<number, TargetFieldKey>>({});
  const [duplicateMode, setDuplicateMode] = useState<'update' | 'skip'>('update');
  const [autoRoute, setAutoRoute] = useState<boolean>(true);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'issues' | 'valid'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportLeadsResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetchCustomFieldsApi('lead')
      .then((res) => {
        if (!active) return;
        const activeFields = (res.data || []).filter((f) => f.isActive);
        setCustomFields(activeFields);
      })
      .catch(() => {
        // Non-blocking if custom fields fail to load
      });
    return () => {
      active = false;
    };
  }, []);

  const applyParsedSheet = (parsed: ParsedSheetData) => {
    setSheet(parsed);
    setColumnMap(autoGuessMapping(parsed.headers, customFields));
    setResult(null);
    setError(null);
    setStep(2);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    setResult(null);
    setError(null);
    const parsed = parseRawCsv(text);
    if (parsed) {
      setSheet(parsed);
      setColumnMap(autoGuessMapping(parsed.headers, customFields));
    } else {
      setSheet(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setError('The uploaded Excel workbook has no readable sheets.');
          return;
        }
        const rawMatrix = XLSX.utils.sheet_to_json<
          Array<string | number | boolean | null>
        >(workbook.Sheets[firstSheetName], { header: 1, defval: '' });

        const nonEmptyRows = rawMatrix.filter(
          (row) => Array.isArray(row) && row.some((c) => String(c ?? '').trim() !== ''),
        );
        if (nonEmptyRows.length < 2) {
          setError('Excel sheet must contain a header row and at least 1 data row.');
          return;
        }
        const headers = nonEmptyRows[0].map((h, i) =>
          String(h ?? '').trim() || `Column ${i + 1}`,
        );
        const rows = nonEmptyRows.slice(1).map((r) =>
          headers.map((_, idx) => String(r[idx] ?? '').trim()),
        );
        applyParsedSheet({ fileName: file.name, headers, rows });
      } else {
        const text = await file.text();
        setCsvText(text);
        const parsed = parseRawCsv(text);
        if (!parsed) {
          setError('CSV file must include a header row and at least 1 lead row.');
          return;
        }
        applyParsedSheet({ ...parsed, fileName: file.name });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to parse spreadsheet file.',
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_HEADER_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadsetu-leads-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isNameMapped = useMemo(
    () => Object.values(columnMap).includes('name'),
    [columnMap],
  );

  const evaluatedRows = useMemo<EvaluatedImportRow[]>(() => {
    if (!sheet) return [];
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    return sheet.rows.slice(0, 500).map((cols, idx) => {
      const payload: CreateLeadPayload = {
        name: '',
        city: '',
        source: 'manual',
        estimatedValue: 0,
      };
      const cfValues: Record<string, unknown> = {};

      cols.forEach((rawCell, colIdx) => {
        const target = columnMap[colIdx];
        const val = String(rawCell ?? '').trim();
        if (!target || target === 'ignore' || !val) return;

        if (target.startsWith('cf:')) {
          const cfKey = target.slice(3);
          cfValues[cfKey] = val;
          return;
        }

        switch (target) {
          case 'name':
            payload.name = val;
            break;
          case 'company':
            payload.company = val;
            break;
          case 'phone':
            payload.phone = val;
            break;
          case 'email':
            payload.email = val.toLowerCase();
            break;
          case 'city':
            payload.city = val;
            break;
          case 'source':
            payload.source = normalizeSource(val);
            break;
          case 'status': {
            const st = normalizeStatus(val);
            if (st) payload.status = st;
            break;
          }
          case 'accountKind': {
            const lower = val.toLowerCase();
            payload.accountKind =
              lower.includes('b2c') || lower.includes('cons') || lower.includes('ind')
                ? 'consumer'
                : 'business';
            break;
          }
          case 'estimatedValue':
            payload.estimatedValue =
              Number(val.replace(/[^\d.]/g, '')) || 0;
            break;
          case 'tags':
            payload.tags = val
              .split(/[;|,]/)
              .map((t) => t.trim())
              .filter(Boolean);
            break;
          case 'notes':
            payload.notes = val;
            break;
          default:
            break;
        }
      });

      if (Object.keys(cfValues).length > 0) {
        payload.customFields = cfValues;
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!payload.name.trim()) {
        errors.push('Missing Full Name');
      }

      const rawPhone = String(payload.phone || '').trim();
      const tenDigits = last10Digits(rawPhone);
      if (rawPhone && !tenDigits) {
        warnings.push('Phone < 10 digits');
      }
      if (!rawPhone && !payload.email) {
        warnings.push('No phone or email');
      }
      if (
        payload.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
      ) {
        warnings.push('Invalid email format');
      }

      let inFileDuplicate = false;
      if (tenDigits && seenPhones.has(tenDigits)) {
        inFileDuplicate = true;
      }
      if (payload.email && seenEmails.has(payload.email)) {
        inFileDuplicate = true;
      }
      if (tenDigits) seenPhones.add(tenDigits);
      if (payload.email) seenEmails.add(payload.email);

      return {
        rowIndex: idx + 1,
        payload,
        errors,
        warnings,
        inFileDuplicate,
      };
    });
  }, [columnMap, sheet]);

  const statsSummary = useMemo(() => {
    const valid = evaluatedRows.filter((r) => r.errors.length === 0).length;
    const errorCount = evaluatedRows.filter((r) => r.errors.length > 0).length;
    const warningCount = evaluatedRows.filter((r) => r.warnings.length > 0).length;
    const inFileDupCount = evaluatedRows.filter((r) => r.inFileDuplicate).length;
    return {
      total: evaluatedRows.length,
      valid,
      errorCount,
      warningCount,
      inFileDupCount,
    };
  }, [evaluatedRows]);

  const filteredPreviewRows = useMemo(() => {
    if (previewFilter === 'issues') {
      return evaluatedRows.filter(
        (r) => r.errors.length > 0 || r.warnings.length > 0 || r.inFileDuplicate,
      );
    }
    if (previewFilter === 'valid') {
      return evaluatedRows.filter((r) => r.errors.length === 0);
    }
    return evaluatedRows;
  }, [evaluatedRows, previewFilter]);

  const handleImport = async () => {
    const validPayloads = evaluatedRows
      .filter((r) => r.errors.length === 0)
      .map((r) => r.payload);

    if (validPayloads.length === 0) {
      setError('No valid rows with a mapped Name are ready to import.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await bulkImportLeadsApi(validPayloads, {
        duplicateMode,
        autoRoute,
      });
      setResult(res);
      await onImported();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import leads.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-light text-brand-blue dark:bg-blue-500/15">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-slate-100">
                CSV &amp; Excel Lead Import Wizard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload `.csv` or `.xlsx`, map columns &amp; custom fields, validate rows, and choose duplicate or routing rules.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-2.5 bg-slate-50/80 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs font-bold">
          {[
            { num: 1 as const, label: '1. Upload CSV / Excel' },
            { num: 2 as const, label: '2. Map Columns' },
            { num: 3 as const, label: '3. Validate & Import' },
          ].map((item) => {
            const active = step === item.num;
            const completed = step > item.num;
            const clickable = item.num === 1 || (sheet !== null && (item.num === 2 || isNameMapped));
            return (
              <button
                key={item.num}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && setStep(item.num)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  active
                    ? 'bg-brand-blue text-white shadow-xs'
                    : completed
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'text-slate-400 disabled:cursor-not-allowed'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {sheet && (
            <span className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
              {sheet.fileName} · {sheet.rows.length} row{sheet.rows.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Import complete: {result.importedCount} created ·{' '}
                    {result.duplicateUpdatedCount} duplicates updated ·{' '}
                    {result.skippedCount} skipped
                    {typeof result.routedCount === 'number' && result.routedCount > 0
                      ? ` · ${result.routedCount} auto-routed`
                      : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="underline font-extrabold"
                >
                  Done &amp; Close
                </button>
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 max-h-24 overflow-y-auto border-t border-emerald-200/70 pt-2 space-y-0.5">
                  {result.errors.slice(0, 15).map((e, i) => (
                    <div key={i}>
                      Row #{e.rowNumber} ({e.name || 'Unnamed'}): {e.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Upload CSV / Excel */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-5">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-brand-navy dark:text-slate-100">
                    Upload `.CSV`, `.XLSX`, or `.XLS` file (up to 500 rows)
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Works with IndiaMART exports, Meta Lead Ads sheets, Justdial CSVs, or custom Excel files.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold cursor-pointer hover:brightness-110 transition shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File (.csv / .xlsx)</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={(e) => void handleFileUpload(e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Sample CSV</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Or paste CSV text directly
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Name,Company,Phone,Email,City,Source,EstimatedValue,Notes&#10;Rajesh Sharma,RS Electricals,+91 9811245678,rajesh@rs.in,Noida,indiamart,450000,Switchgear quote"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Map Columns */}
          {step === 2 && sheet && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-navy dark:text-slate-100">
                  <Columns className="w-4 h-4 text-brand-blue" />
                  <span>
                    Map {sheet.headers.length} spreadsheet columns to CRM &amp; custom fields
                  </span>
                </div>
                {!isNameMapped && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Map at least &quot;Full Name *&quot; to continue
                  </span>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2.5 px-4">Spreadsheet Header</th>
                      <th className="py-2.5 px-4">Sample Value (Row 1)</th>
                      <th className="py-2.5 px-4">LeadSetu Target Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sheet.headers.map((header, idx) => {
                      const sample = sheet.rows[0]?.[idx] || '—';
                      const mapped = columnMap[idx] || 'ignore';
                      return (
                        <tr
                          key={`${header}-${idx}`}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2.5 px-4 font-bold text-brand-navy dark:text-slate-100">
                            {header}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                            {sample}
                          </td>
                          <td className="py-2.5 px-4">
                            <select
                              value={mapped}
                              onChange={(e) =>
                                setColumnMap((prev) => ({
                                  ...prev,
                                  [idx]: e.target.value as TargetFieldKey,
                                }))
                              }
                              className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-blue dark:bg-slate-900 dark:text-slate-100 ${
                                mapped === 'ignore'
                                  ? 'border-slate-200 text-slate-400 dark:border-slate-700'
                                  : mapped === 'name'
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : 'border-brand-blue/30 bg-blue-50/40 text-brand-navy dark:border-blue-500/40 dark:bg-blue-500/10'
                              }`}
                            >
                              <option value="ignore">— Skip / Ignore Column —</option>
                              <optgroup label="Standard Lead Fields">
                                {STANDARD_FIELDS.map((sf) => (
                                  <option key={sf.key} value={sf.key}>
                                    {sf.label}
                                  </option>
                                ))}
                              </optgroup>
                              {customFields.length > 0 && (
                                <optgroup label="Tenant Custom Fields">
                                  {customFields.map((cf) => (
                                    <option key={cf.key} value={`cf:${cf.key}`}>
                                      Custom: {cf.label} ({cf.type})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Validation Preview, Duplicate Policy & Routing */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Validation Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Total Parsed</div>
                  <div className="text-lg font-extrabold text-brand-navy dark:text-white">
                    {statsSummary.total}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10 p-3">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Ready to Import
                  </div>
                  <div className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200">
                    {statsSummary.valid}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10 p-3">
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    Warnings / Errors
                  </div>
                  <div className="text-lg font-extrabold text-amber-800 dark:text-amber-200">
                    {statsSummary.errorCount + statsSummary.warningCount}
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-500/10 p-3">
                  <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    In-File Duplicates
                  </div>
                  <div className="text-lg font-extrabold text-indigo-800 dark:text-indigo-200">
                    {statsSummary.inFileDupCount}
                  </div>
                </div>
              </div>

              {/* Options: Duplicate Policy + Auto-Routing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2">
                  <div className="text-xs font-bold text-brand-navy dark:text-slate-100">
                    When matching existing CRM phone (+91) or email:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateMode('update')}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                        duplicateMode === 'update'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue dark:bg-blue-500/15'
                          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <GitMerge className="h-3.5 w-3.5 shrink-0" />
                      <div>
                        <div>Update &amp; Merge</div>
                        <div className="text-[10px] font-normal opacity-75">
                          Append timeline note
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateMode('skip')}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                        duplicateMode === 'skip'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue dark:bg-blue-500/15'
                          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <SkipForward className="h-3.5 w-3.5 shrink-0" />
                      <div>
                        <div>Skip Duplicates</div>
                        <div className="text-[10px] font-normal opacity-75">
                          Keep existing untouched
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <label className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Route className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-navy dark:text-slate-100">
                        Auto-route imported leads to active reps
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Uses Lead Routing rules &amp; automatically skips Away / On-Break reps.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRoute}
                    onChange={(e) => setAutoRoute(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand-blue shrink-0"
                  />
                </label>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-navy dark:text-slate-100">
                    Validation Preview ({filteredPreviewRows.length} rows)
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    {(['all', 'issues', 'valid'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPreviewFilter(f)}
                        className={`px-2.5 py-1 rounded-lg capitalize ${
                          previewFilter === f
                            ? 'bg-brand-navy text-white dark:bg-brand-blue'
                            : 'text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                        }`}
                      >
                        {f === 'issues' ? 'Warnings / Errors' : f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase text-slate-500 font-bold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Source</th>
                        <th className="py-2 px-3">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPreviewRows.slice(0, 40).map((row) => (
                        <tr key={row.rowIndex}>
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {row.rowIndex}
                          </td>
                          <td className="py-2 px-3 font-bold text-brand-navy dark:text-slate-100">
                            {row.payload.name || (
                              <span className="text-rose-600 italic">Missing</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                            {row.payload.phone || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {row.payload.email || '—'}
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-brand-blue">
                            {row.payload.source}
                          </td>
                          <td className="py-2 px-3">
                            {row.errors.length > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                                Will Skip: {row.errors.join(', ')}
                              </span>
                            ) : row.warnings.length > 0 || row.inFileDuplicate ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                {[
                                  ...row.warnings,
                                  ...(row.inFileDuplicate ? ['In-file dup'] : []),
                                ].join(' · ')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-slate-900/70">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50"
            >
              Close
            </button>

            {step === 1 && (
              <button
                type="button"
                disabled={!sheet}
                onClick={() => sheet && setStep(2)}
                className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              >
                <span>Next: Map Columns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={!isNameMapped}
                onClick={() => setStep(3)}
                className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              >
                <span>Next: Preview &amp; Validate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isSubmitting || statsSummary.valid === 0}
                onClick={() => void handleImport()}
                className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Import &amp; AI-Score {statsSummary.valid} Valid Leads</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

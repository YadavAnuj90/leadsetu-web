'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type {
  BulkImportLeadsResponse,
  CreateLeadPayload,
  LeadSource,
} from '@/types/contracts';
import { bulkImportLeadsApi } from '@/lib/leads-capture-api';

interface BulkCsvImportModalProps {
  onClose: () => void;
  onImported: () => Promise<void> | void;
}

const SAMPLE_CSV = `Name,Company,Phone,Email,City,Source,EstimatedValue,Notes
Rajesh Aggarwal,VardhmanPackaging Pvt Ltd,+91 98114 22310,rajesh@vardhmanpack.in,Noida,indiamart,185000,Requires 5000 corrugated boxes monthly
Meenakshi Verma,Kaveri Precision Tools,9871190432,meenakshi@kaveritools.com,Gurgaon,website,340000,CNC spares annual rate contract inquiry
Harpreet Singh,Doaba Agro Cold Chain,+91 98180 55411,harpreet@doabacold.in,Delhi,referral,420000,Cold storage stabilizer 150 KVA requirement`;

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

function normalizeSource(raw?: string): LeadSource {
  const v = (raw || '').trim().toLowerCase();
  if (
    v === 'whatsapp' ||
    v === 'indiamart' ||
    v === 'justdial' ||
    v === 'meta_ads' ||
    v === 'google_ads' ||
    v === 'website' ||
    v === 'referral' ||
    v === 'manual'
  ) {
    return v;
  }
  if (v.includes('india')) return 'indiamart';
  if (v.includes('just')) return 'justdial';
  if (v.includes('meta') || v.includes('fb') || v.includes('insta')) return 'meta_ads';
  if (v.includes('google')) return 'google_ads';
  if (v.includes('whats')) return 'whatsapp';
  if (v.includes('web')) return 'website';
  if (v.includes('ref')) return 'referral';
  return 'manual';
}

function parseCsvText(csvText: string): CreateLeadPayload[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, ''),
  );

  const findIdx = (candidates: string[]) =>
    headers.findIndex((h) => candidates.some((c) => h.includes(c)));

  const nameIdx = findIdx(['name', 'fullname', 'contact', 'lead']);
  const companyIdx = findIdx(['company', 'org', 'firm', 'business']);
  const phoneIdx = findIdx(['phone', 'mobile', 'whatsapp', 'tel']);
  const emailIdx = findIdx(['email', 'mail']);
  const cityIdx = findIdx(['city', 'location', 'state']);
  const sourceIdx = findIdx(['source', 'channel']);
  const valIdx = findIdx(['estimatedvalue', 'value', 'budget', 'deal', 'amount']);
  const notesIdx = findIdx(['note', 'remark', 'query', 'message']);

  const rows: CreateLeadPayload[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const name = (nameIdx >= 0 ? cols[nameIdx] : cols[0])?.trim() || '';
    if (!name) continue;

    const rawVal = valIdx >= 0 ? cols[valIdx] : '';
    const numericVal = Number(String(rawVal || '0').replace(/[^\d.]/g, '')) || 0;

    rows.push({
      name,
      company: companyIdx >= 0 ? cols[companyIdx] || '' : '',
      phone: phoneIdx >= 0 ? cols[phoneIdx] || '' : '',
      email: emailIdx >= 0 ? cols[emailIdx] || '' : '',
      city: (cityIdx >= 0 ? cols[cityIdx] : '') || 'Delhi-NCR',
      source: normalizeSource(sourceIdx >= 0 ? cols[sourceIdx] : 'manual'),
      estimatedValue: numericVal,
      notes: notesIdx >= 0 ? cols[notesIdx] || '' : '',
    });
  }
  return rows;
}

export default function BulkCsvImportModal({
  onClose,
  onImported,
}: BulkCsvImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<CreateLeadPayload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportLeadsResponse | null>(null);

  const handleTextChange = (text: string) => {
    setCsvText(text);
    setResult(null);
    setError(null);
    setParsedRows(parseCsvText(text));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadsetu-sample-leads.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      setError('Upload a CSV file or paste valid CSV rows with a Name header first.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await bulkImportLeadsApi(parsedRows);
      setResult(res);
      await onImported();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import CSV leads.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-light text-brand-blue">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                CSV Bulk Lead Importer &amp; +91 Deduplication
              </h2>
              <p className="text-xs text-slate-500">
                Normalizes +91 numbers, merges repeat phones/emails, and AI-scores new leads automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-light text-brand-blue border border-brand-blue/25 text-xs font-bold cursor-pointer hover:bg-brand-blue hover:text-white transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose .CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTextChange(SAMPLE_CSV)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-brand-navy hover:bg-slate-50"
              >
                Load Sample Preview
              </button>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste CSV text here (Name,Company,Phone,Email,City,Source,EstimatedValue,Notes)..."
            className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Import complete: {result.importedCount} new leads AI-scored ·{' '}
                  {result.duplicateUpdatedCount} duplicates merged ·{' '}
                  {result.skippedCount} skipped
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="underline text-emerald-900"
              >
                Done
              </button>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-brand-navy">
                <span>Previewing {parsedRows.length} parsed rows (showing up to 25)</span>
                <span className="text-[11px] font-medium text-slate-500">
                  +91 normalization runs on import
                </span>
              </div>
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Company</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">City</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Est. Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 25).map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-bold text-brand-navy">
                          {r.name}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {r.company || '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {r.phone || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.city}</td>
                        <td className="py-2 px-3 uppercase text-[10px] font-bold text-brand-blue">
                          {r.source}
                        </td>
                        <td className="py-2 px-3 font-semibold text-brand-navy">
                          ₹{Math.round(r.estimatedValue || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2.5 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isSubmitting || parsedRows.length === 0}
            onClick={handleImport}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Import &amp; AI-Score {parsedRows.length} Leads</span>
          </button>
        </div>
      </div>
    </div>
  );
}

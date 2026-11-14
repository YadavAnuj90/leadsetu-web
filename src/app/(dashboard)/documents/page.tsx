'use client';

import {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  ArrowLeft,
  Plus,
  Upload,
  FileText,
  ShieldCheck,
  Building2,
  BookOpen,
  FileSignature,
  Users,
  Search,
  Database,
  Download,
  Eye,
  ExternalLink,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import {
  fetchDocumentsApi,
  fetchDocumentByIdApi,
  createDocumentApi,
  updateDocumentApi,
  deleteDocumentApi,
  seedDocumentsApi,
} from '@/lib/documents-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  CrmDocument,
  DocumentCategory,
  DocumentStats,
  Contact,
} from '@/types/contracts';

const CATEGORY_META: Record<
  DocumentCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    cardTone: string;
    icon: typeof ShieldCheck;
  }
> = {
  gst_certificate: {
    label: 'GST & Statutory Certificates',
    shortLabel: 'GST Certs',
    description: 'Form GST REG-06, PAN, MSME Udyam & Tax Registrations',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cardTone: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
    icon: ShieldCheck,
  },
  company_profile: {
    label: 'Company Profiles',
    shortLabel: 'Company Profiles',
    description: 'Corporate Decks, Bank Mandates & Cancelled Cheques',
    badgeClass: 'bg-blue-50 text-brand-blue border border-blue-200',
    cardTone: 'border-blue-200 bg-blue-50/60 text-brand-navy',
    icon: Building2,
  },
  brochure: {
    label: 'Product Brochures',
    shortLabel: 'Brochures',
    description: 'Datasheets, Catalogues, Price Lists & Spec Sheets',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    cardTone: 'border-indigo-200 bg-indigo-50/60 text-indigo-900',
    icon: BookOpen,
  },
  contract: {
    label: 'Contracts & NDAs',
    shortLabel: 'Contracts',
    description: 'Master Supply Agreements, AMCs, SLAs & Signed NDAs',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    cardTone: 'border-amber-200 bg-amber-50/60 text-amber-900',
    icon: FileSignature,
  },
  customer_document: {
    label: 'Customer Documents',
    shortLabel: 'Customer Docs',
    description: 'Buyer POs, Buyer GSTIN Copies & Signed KYC Packets',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
    cardTone: 'border-purple-200 bg-purple-50/60 text-purple-900',
    icon: Users,
  },
};

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return 'External Link';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExpiryStatus(expiryDate?: string) {
  if (!expiryDate) return null;
  const expMs = new Date(expiryDate).getTime();
  if (!Number.isFinite(expMs)) return null;
  const daysLeft = Math.ceil((expMs - Date.now()) / 86400000);
  if (daysLeft < 0) {
    return {
      label: `Expired ${Math.abs(daysLeft)}d ago`,
      tone: 'bg-rose-50 text-rose-700 border border-rose-200',
    };
  }
  if (daysLeft <= 30) {
    return {
      label: `Expires in ${daysLeft}d`,
      tone: 'bg-amber-50 text-amber-800 border border-amber-200',
    };
  }
  return {
    label: `Valid till ${expiryDate}`,
    tone: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
}

export default function DocumentCenterPage() {
  const router = useRouter();
  const { tenant } = useAuthStore();

  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    totalCount: 0,
    gstCount: 0,
    profileCount: 0,
    brochureCount: 0,
    contractCount: 0,
    customerCount: 0,
    expiringSoonCount: 0,
    totalStorageBytes: 0,
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DocumentCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Contacts for linking customer documents / contracts
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Upload Modal State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('gst_certificate');
  const [documentNumber, setDocumentNumber] = useState('');
  const [linkedCustomerName, setLinkedCustomerName] = useState('');
  const [linkedContactId, setLinkedContactId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('application/pdf');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [fileDataUrl, setFileDataUrl] = useState('');

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<CrmDocument | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchDocumentsApi({
        search: search.trim() || undefined,
        category: categoryFilter,
      });
      setDocuments(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    apiClient
      .get<{ data: Contact[] }>('/contacts')
      .then((res) => setContacts(res.data?.data || []))
      .catch(() => {});
  }, []);

  const resetUploadForm = (presetCategory: DocumentCategory = 'gst_certificate') => {
    setTitle('');
    setCategory(presetCategory);
    setDocumentNumber('');
    setLinkedCustomerName('');
    setLinkedContactId('');
    setIssueDate(new Date().toISOString().slice(0, 10));
    setExpiryDate('');
    setTagsInput('');
    setDescription('');
    setExternalUrl('');
    setFileName('');
    setMimeType('application/pdf');
    setFileSizeBytes(0);
    setFileDataUrl('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5 MB limit. Please upload a smaller file or attach a cloud Drive/URL link.');
      return;
    }
    setErrorMsg(null);
    setFileName(file.name);
    setMimeType(file.type || 'application/octet-stream');
    setFileSizeBytes(file.size);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectContact = (contactId: string) => {
    setLinkedContactId(contactId);
    const found = contacts.find((c) => c.id === contactId);
    if (!found) return;
    setLinkedCustomerName(found.company || found.name);
    if (found.gstin && !documentNumber) {
      setDocumentNumber(found.gstin);
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!fileDataUrl && !externalUrl.trim()) {
      setErrorMsg('Please attach a file (up to 5 MB) or paste an external document link.');
      return;
    }
    setIsMutating(true);
    setErrorMsg(null);
    try {
      await createDocumentApi({
        title: title.trim(),
        category,
        description: description.trim(),
        documentNumber: documentNumber.trim(),
        linkedCustomerName: linkedCustomerName.trim(),
        linkedContactId: linkedContactId || undefined,
        issueDate,
        expiryDate: expiryDate || undefined,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        fileName: fileName || undefined,
        mimeType,
        fileSizeBytes,
        fileDataUrl: fileDataUrl || undefined,
        externalUrl: externalUrl.trim() || undefined,
        isVerified: true,
      });
      setUploadOpen(false);
      resetUploadForm();
      await loadDocuments();
      setToastMsg('Document saved securely to Leadsetu Document Center!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSeedSamples = async () => {
    setIsMutating(true);
    setErrorMsg(null);
    try {
      await seedDocumentsApi();
      await loadDocuments();
      setToastMsg('Seeded 5 B2B documents across all 5 Document Center vaults!');
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handlePreview = async (doc: CrmDocument) => {
    setPreviewDoc(doc);
    if (!doc.fileDataUrl && doc.hasFileData) {
      setIsLoadingPreview(true);
      try {
        const full = await fetchDocumentByIdApi(doc.id);
        setPreviewDoc(full);
      } catch (err) {
        setErrorMsg(getErrorMessage(err));
      } finally {
        setIsLoadingPreview(false);
      }
    }
  };

  const handleDownload = async (doc: CrmDocument) => {
    try {
      let full = doc;
      if (!full.fileDataUrl && full.hasFileData) {
        full = await fetchDocumentByIdApi(doc.id);
      }
      if (full.fileDataUrl) {
        const a = document.createElement('a');
        a.href = full.fileDataUrl;
        a.download = full.fileName || `${full.docCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      if (full.externalUrl) {
        window.open(full.externalUrl, '_blank', 'noreferrer');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const handleToggleVerified = async (doc: CrmDocument) => {
    setIsMutating(true);
    try {
      const updated = await updateDocumentApi(doc.id, {
        isVerified: !doc.isVerified,
      });
      if (previewDoc?.id === doc.id) {
        setPreviewDoc({ ...previewDoc, isVerified: updated.isVerified });
      }
      await loadDocuments();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsMutating(true);
    try {
      await deleteDocumentApi(id);
      if (previewDoc?.id === id) setPreviewDoc(null);
      await loadDocuments();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleShareWhatsApp = (doc: CrmDocument) => {
    const meta = CATEGORY_META[doc.category];
    const refPart = doc.documentNumber ? `\n• Ref / ID: ${doc.documentNumber}` : '';
    const linkPart = doc.externalUrl ? `\n• Document Link: ${doc.externalUrl}` : '';
    const msg = encodeURIComponent(
      `Namaste,\n\nSharing *${doc.title}* (${meta.shortLabel}) from *${tenant?.name || 'Leadsetu Technologies'}*.${refPart}\n• Doc Code: ${doc.docCode}${linkPart}\n\nPlease let us know if you need any further onboarding documents.`,
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCopyRef = async (doc: CrmDocument) => {
    const val = doc.documentNumber || doc.externalUrl || doc.docCode;
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setErrorMsg('Clipboard copy failed.');
    }
  };

  const folderCards = useMemo(
    () => [
      { key: 'gst_certificate' as const, count: stats.gstCount },
      { key: 'company_profile' as const, count: stats.profileCount },
      { key: 'brochure' as const, count: stats.brochureCount },
      { key: 'contract' as const, count: stats.contractCount },
      { key: 'customer_document' as const, count: stats.customerCount },
    ],
    [stats],
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <FolderOpen className="w-3.5 h-3.5" /> Central B2B Compliance &amp; Collateral Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Document Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Store &amp; share GST certificates, company profiles, product brochures, contracts &amp; buyer KYC documents in one organized repository.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedSamples}
            disabled={isMutating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            ) : (
              <Database className="w-4 h-4 text-brand-blue" />
            )}
            Seed 5 B2B Docs
          </button>

          <button
            type="button"
            onClick={() => {
              resetUploadForm(categoryFilter === 'all' ? 'gst_certificate' : categoryFilter);
              setUploadOpen(true);
            }}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5 Category Vault Folder Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {folderCards.map((item) => {
          const meta = CATEGORY_META[item.key];
          const Icon = meta.icon;
          const isActive = categoryFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setCategoryFilter(isActive ? 'all' : item.key)}
              className={`text-left rounded-2xl p-4 border transition-all ${meta.cardTone} ${
                isActive
                  ? 'ring-2 ring-brand-blue shadow-md'
                  : 'hover:shadow-sm opacity-95'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/90 border border-white flex items-center justify-center shadow-xs">
                  <Icon className="w-4 h-4 text-brand-blue" />
                </div>
                <span className="text-xl font-extrabold">{item.count}</span>
              </div>
              <div className="text-xs font-extrabold mt-3">{meta.shortLabel}</div>
              <div className="text-[11px] opacity-75 mt-0.5 line-clamp-2">
                {meta.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Vault Status & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document title, DOC #, GSTIN / PO #, customer name, or tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {categoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
            >
              Show All ({stats.totalCount})
            </button>
          )}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-600">
            Storage Used:{' '}
            <span className="font-extrabold text-brand-navy">
              {formatFileSize(stats.totalStorageBytes)}
            </span>
          </div>
          {stats.expiringSoonCount > 0 && (
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 font-bold text-amber-800 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {stats.expiringSoonCount} Renewal/Expiry Soon
            </div>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <p className="text-xs font-semibold">Loading Document Center vault...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 py-16 px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand-blue flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-extrabold text-brand-navy">
              Your Document Center is Empty
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload your company GST registration, corporate profile, product brochures, signed contracts, or buyer POs — or seed 5 realistic B2B files.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSeedSamples}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Seed 5 B2B Sample Docs
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              + Upload First Document
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const meta = CATEGORY_META[doc.category] || CATEGORY_META.customer_document;
            const Icon = meta.icon;
            const expiryBadge = getExpiryStatus(doc.expiryDate);

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.badgeClass}`}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.shortLabel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {doc.docCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleVerified(doc)}
                        title={
                          doc.isVerified
                            ? 'Verified Document (Click to unmark)'
                            : 'Click to mark as Verified'
                        }
                        className={`p-1 rounded-full transition-colors ${
                          doc.isVerified
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-slate-300 bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="text-left text-sm font-extrabold text-brand-navy hover:text-brand-blue transition-colors line-clamp-2"
                    >
                      {doc.title}
                    </button>
                    {doc.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {doc.documentNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyRef(doc)}
                        title="Click to copy reference ID"
                        className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <span>{doc.documentNumber}</span>
                        {copiedId === doc.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    )}

                    {doc.linkedCustomerName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                        <Building2 className="w-3 h-3" />
                        {doc.linkedCustomerName}
                      </span>
                    )}

                    {expiryBadge && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${expiryBadge.tone}`}
                      >
                        <Clock className="w-3 h-3" />
                        {expiryBadge.label}
                      </span>
                    )}
                  </div>

                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-50 border border-slate-200/70 text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    <span className="font-semibold text-slate-600">
                      {doc.hasFileData ? formatFileSize(doc.fileSizeBytes) : 'Cloud Link'}
                    </span>{' '}
                    · {doc.issueDate || doc.createdAt.slice(0, 10)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      title="Preview Document"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-brand-light text-brand-blue text-[11px] font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      title="Download File / Open Link"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(doc)}
                      title="Share Details on WhatsApp"
                      className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete Document"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── UPLOAD DOCUMENT MODAL ──────────────────────────────────── */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="text-base font-extrabold">
                    Upload to Document Center
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Store GST certificates, company profiles, brochures, contracts, or buyer KYC documents (up to 5 MB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            >
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document Vault Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_META) as DocumentCategory[]).map((catKey) => {
                    const meta = CATEGORY_META[catKey];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all ${
                          category === catKey
                            ? 'bg-brand-navy text-white border-brand-navy'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{meta.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Picker + Optional External Link */}
              <div className="rounded-2xl border-2 border-dashed border-brand-blue/30 bg-brand-light/40 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-brand-navy">
                      Attach File (PDF, PNG, JPG, HTML, DOCX · Max 5 MB)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {fileName
                        ? `Selected: ${fileName} (${formatFileSize(fileSizeBytes)})`
                        : 'No file selected yet'}
                    </div>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{fileName ? 'Change File' : 'Browse File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.html,.txt,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-brand-blue/15">
                  <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="Or paste Google Drive / OneDrive / Cloud PDF link (https://...)"
                    className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Form GST REG-06 Certificate / Master AMC Contract"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference / GSTIN / Contract #
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 09AABCL2026F1Z9 or MSA-2026-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link to B2B Customer (Optional)
                  </label>
                  <select
                    value={linkedContactId}
                    onChange={(e) => handleSelectContact(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="">-- Internal / General Company Doc --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name (Custom / Override)
                  </label>
                  <input
                    type="text"
                    value={linkedCustomerName}
                    onChange={(e) => setLinkedCustomerName(e.target.value)}
                    placeholder="e.g. RS Electricals Pvt. Ltd."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. GSTIN, KYC, Signed NDA"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry / Renewal Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary for sales team & compliance..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Document to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DOCUMENT PREVIEW MODAL ─────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-sky-400 font-bold">
                  {previewDoc.docCode} · {CATEGORY_META[previewDoc.category]?.shortLabel}
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {previewDoc.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-blue-600 text-xs font-bold text-white"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Reference ID
                  </div>
                  <div className="font-mono font-bold text-brand-navy mt-0.5 truncate">
                    {previewDoc.documentNumber || '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Linked Account
                  </div>
                  <div className="font-bold text-brand-navy mt-0.5 truncate">
                    {previewDoc.linkedCustomerName || 'Internal Vault'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Issue Date
                  </div>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    {previewDoc.issueDate || '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    File Size
                  </div>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    {previewDoc.hasFileData
                      ? formatFileSize(previewDoc.fileSizeBytes)
                      : 'External Link'}
                  </div>
                </div>
              </div>

              {isLoadingPreview ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                  <span className="text-xs font-semibold">Loading document preview...</span>
                </div>
              ) : previewDoc.fileDataUrl ? (
                previewDoc.mimeType.startsWith('image/') ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex justify-center">
                    <img
                      src={previewDoc.fileDataUrl}
                      alt={previewDoc.title}
                      className="max-h-[460px] rounded-xl object-contain"
                    />
                  </div>
                ) : previewDoc.mimeType === 'application/pdf' ||
                  previewDoc.mimeType === 'text/html' ||
                  previewDoc.fileDataUrl.startsWith('data:text/html') ? (
                  <iframe
                    src={previewDoc.fileDataUrl}
                    title={previewDoc.title}
                    className="w-full h-[460px] rounded-2xl border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3">
                    <FileText className="w-10 h-10 text-brand-blue mx-auto" />
                    <div className="text-xs font-bold text-brand-navy">
                      {previewDoc.fileName} ({formatFileSize(previewDoc.fileSizeBytes)})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(previewDoc)}
                      className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                    >
                      <Download className="w-3.5 h-3.5" /> Download to Open File
                    </button>
                  </div>
                )
              ) : previewDoc.externalUrl ? (
                <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3">
                  <Link2 className="w-9 h-9 text-brand-blue mx-auto" />
                  <div className="text-xs text-slate-600 break-all max-w-lg mx-auto">
                    {previewDoc.externalUrl}
                  </div>
                  <a
                    href={previewDoc.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Cloud Document
                  </a>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                  No previewable attachment attached to this record.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  LifeBuoy,
  Plus,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Clock,
  X,
  MessageSquare,
  UserCheck,
  MapPin,
  Package,
  FileText,
  Star,
  Send,
  Lock,
  LayoutList,
  Kanban,
  Printer,
  Wrench,
  Eye,
} from 'lucide-react';
import {
  fetchTicketsApi,
  fetchTicketByIdApi,
  fetchTicketAssigneesApi,
  createTicketApi,
  updateTicketApi,
  addTicketCommentApi,
  deleteTicketApi,
} from '@/lib/tickets-api';
import { fetchInvoices } from '@/lib/invoices-api';
import { fetchProductsApi } from '@/lib/products-api';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  Ticket,
  TicketAssignee,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  Contact,
  Invoice,
  Product,
} from '@/types/contracts';

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'bg-blue-50 text-brand-blue border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting_client: 'bg-purple-50 text-purple-700 border-purple-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_client: 'Waiting Client',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-blue-50 text-brand-blue border-blue-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  dispatch_delay: 'Dispatch & E-Way Bill',
  warranty: 'Warranty Claim',
  gst_correction: 'GST Billing Fix',
  installation: 'Site Installation',
  amc_service: 'AMC Service Visit',
  general: 'General Support',
};

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, tenant } = useAuthStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    openCount: 0,
    inProgressCount: 0,
    waitingClientCount: 0,
    urgentCount: 0,
    resolvedCount: 0,
    slaBreachedCount: 0,
    avgCsat: 0,
  });

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Reference data for auto-fill
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [assignees, setAssignees] = useState<TicketAssignee[]>([]);

  // Create Ticket Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('dispatch_delay');
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [customerName, setCustomerName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [linkedContactId, setLinkedContactId] = useState('');
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState('');
  const [productSerialOrSku, setProductSerialOrSku] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [assignedToPhone, setAssignedToPhone] = useState('');
  const [slaDueAt, setSlaDueAt] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState('');

  // Selected Ticket Detail Workbench Drawer/Modal State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [commentRole, setCommentRole] = useState<'agent' | 'engineer' | 'customer'>(
    user?.role === 'support' ? 'engineer' : 'agent',
  );
  const [resolutionDraft, setResolutionDraft] = useState('');
  const [assigneeUserIdDraft, setAssigneeUserIdDraft] = useState('');
  const [assigneeDraft, setAssigneeDraft] = useState('');
  const [assigneePhoneDraft, setAssigneePhoneDraft] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTicketsApi({
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        slaBreached: slaBreachedOnly ? 'true' : undefined,
        assignedOnly: assignedOnly ? 'true' : undefined,
        search: search.trim() || undefined,
      });
      setTickets(res.data || []);
      setStats({
        total: res.stats?.total ?? 0,
        openCount: res.stats?.openCount ?? 0,
        inProgressCount: res.stats?.inProgressCount ?? 0,
        waitingClientCount: res.stats?.waitingClientCount ?? 0,
        urgentCount: res.stats?.urgentCount ?? 0,
        resolvedCount: res.stats?.resolvedCount ?? 0,
        slaBreachedCount: res.stats?.slaBreachedCount ?? 0,
        avgCsat: res.stats?.avgCsat ?? 4.8,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, slaBreachedOnly, assignedOnly, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Load contacts, invoices, products & team assignees for smart pickers
  useEffect(() => {
    apiClient
      .get<{ data: Contact[] }>('/contacts')
      .then((res) => setContacts(res.data?.data || []))
      .catch(() => {});
    fetchInvoices()
      .then((res) => setInvoicesList(res.data || []))
      .catch(() => {});
    fetchProductsApi()
      .then((res) => setProductsList(res.data || []))
      .catch(() => {});
    fetchTicketAssigneesApi()
      .then((rows) => setAssignees(rows))
      .catch(() => {});
  }, []);

  // Open specific ticket if `?ticketId=...` is in URL
  useEffect(() => {
    const ticketIdParam = searchParams.get('ticketId');
    if (ticketIdParam) {
      fetchTicketByIdApi(ticketIdParam)
        .then((tk) => openTicketDetail(tk))
        .catch(() => {});
    }
  }, [searchParams]);

  const openTicketDetail = (tk: Ticket) => {
    setSelectedTicket(tk);
    setResolutionDraft(tk.resolutionSummary || '');
    setAssigneeUserIdDraft(tk.assignedToUserId || '');
    setAssigneeDraft(tk.assignedToName || '');
    setAssigneePhoneDraft(tk.assignedToPhone || '');
    setCommentRole(user?.role === 'support' ? 'engineer' : 'agent');
    setCommentText('');
    setCommentInternal(false);
  };

  const handleSelectContact = (contactId: string) => {
    setLinkedContactId(contactId);
    const found = contacts.find((c) => c.id === contactId);
    if (!found) return;
    setCompany(found.company || found.name);
    setCustomerName(found.name);
    setPhone(found.phone || '');
    setEmail(found.email || '');
    if (found.city && !siteAddress) {
      setSiteAddress(found.city);
    }
  };

  const handlePriorityChange = (nextPriority: TicketPriority) => {
    setPriority(nextPriority);
    const days =
      nextPriority === 'urgent'
        ? 0
        : nextPriority === 'high'
          ? 1
          : nextPriority === 'medium'
            ? 2
            : 3;
    setSlaDueAt(new Date(Date.now() + days * 86400000).toISOString().slice(0, 10));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const created = await createTicketApi({
        subject: subject.trim(),
        category,
        priority,
        customerName: customerName.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        siteAddress: siteAddress.trim(),
        linkedContactId: linkedContactId || undefined,
        linkedInvoiceNumber: linkedInvoiceNumber.trim(),
        productSerialOrSku: productSerialOrSku.trim(),
        assignedToUserId: assignedToUserId || undefined,
        assignedToName: assignedToName.trim(),
        assignedToPhone: assignedToPhone.trim(),
        slaDueAt,
        notes: notes.trim(),
      });
      setModalOpen(false);
      setSubject('');
      setCustomerName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setSiteAddress('');
      setLinkedContactId('');
      setLinkedInvoiceNumber('');
      setProductSerialOrSku('');
      setAssignedToUserId('');
      setNotes('');
      await loadTickets();
      openTicketDetail(created);
      setToastMsg(`Created SLA Ticket ${created.ticketNumber} and assigned to ${created.assignedToName || 'Support Desk'}!`);
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      const updated = await updateTicketApi(id, { status });
      if (selectedTicket?.id === id) {
        openTicketDetail(updated);
      }
      await loadTickets();
      setToastMsg(`Updated ticket ${updated.ticketNumber} status to ${STATUS_LABELS[status]}.`);
      setTimeout(() => setToastMsg(null), 2800);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaveTicketMeta = async () => {
    if (!selectedTicket) return;
    setIsSaving(true);
    try {
      const updated = await updateTicketApi(selectedTicket.id, {
        assignedToUserId: assigneeUserIdDraft || '',
        assignedToName: assigneeDraft.trim(),
        assignedToPhone: assigneePhoneDraft.trim(),
        resolutionSummary: resolutionDraft.trim(),
      });
      openTicketDetail(updated);
      await loadTickets();
      setToastMsg(`Saved engineer assignment & resolution summary for ${updated.ticketNumber}!`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetCsat = async (rating: number) => {
    if (!selectedTicket) return;
    try {
      const updated = await updateTicketApi(selectedTicket.id, {
        csatRating: rating,
      });
      openTicketDetail(updated);
      await loadTickets();
      setToastMsg(`Recorded ${rating}/5 ★ Buyer CSAT rating for ${updated.ticketNumber}!`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handlePostComment = async (nextStatus?: TicketStatus) => {
    if (!selectedTicket || !commentText.trim()) return;
    setIsPostingComment(true);
    try {
      const updated = await addTicketCommentApi(selectedTicket.id, {
        message: commentText.trim(),
        isInternal: commentInternal,
        authorRole: commentRole,
        authorName:
          commentRole === 'engineer'
            ? selectedTicket.assignedToName || 'Field Engineer'
            : commentRole === 'customer'
              ? selectedTicket.customerName || selectedTicket.company || 'Buyer'
              : user?.name || 'Support Desk',
        nextStatus,
        resolutionSummary:
          nextStatus === 'resolved' && resolutionDraft.trim()
            ? resolutionDraft.trim()
            : undefined,
      });
      openTicketDetail(updated);
      await loadTickets();
      setToastMsg(
        nextStatus === 'resolved'
          ? `Posted reply and marked ${updated.ticketNumber} as RESOLVED!`
          : `Added ${commentInternal ? 'internal note' : 'timeline reply'} to ${updated.ticketNumber}.`,
      );
      setTimeout(() => setToastMsg(null), 3200);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTicketApi(id);
      if (selectedTicket?.id === id) setSelectedTicket(null);
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleWhatsAppBuyerUpdate = (t: Ticket) => {
    const digits = (t.phone || '').replace(/\D/g, '');
    const waPhone =
      digits.length === 10 ? `91${digits}` : digits.length >= 11 ? digits : '';
    const msg = encodeURIComponent(
      `Namaste ${t.customerName || t.company || 'Sir/Madam'},\n\nSupport update from *${tenant?.companyName?.trim() || 'Leadsetu Service Desk'}* regarding Ticket *${t.ticketNumber}*:\n\n• Subject: ${t.subject}\n• Current Status: *${STATUS_LABELS[t.status].toUpperCase()}*\n• Assigned Engineer: ${t.assignedToName || 'Support Team'}${t.assignedToPhone ? ` (${t.assignedToPhone})` : ''}\n• Target SLA: ${t.slaDueAt || 'Priority'}${
        t.resolutionSummary ? `\n• Resolution Note: ${t.resolutionSummary}` : ''
      }\n\nReply here if you need any immediate assistance.`,
    );
    const base = waPhone ? `https://wa.me/${waPhone}` : 'https://wa.me/';
    window.open(`${base}?text=${msg}`, '_blank');
  };

  const handleWhatsAppEngineerJobSheet = (t: Ticket) => {
    const digits = (t.assignedToPhone || '').replace(/\D/g, '');
    const waPhone =
      digits.length === 10 ? `91${digits}` : digits.length >= 11 ? digits : '';
    const msg = encodeURIComponent(
      `*FIELD SERVICE JOB SHEET — ${t.ticketNumber}*\nPriority: *${t.priority.toUpperCase()}* · SLA Due: ${t.slaDueAt}\n\n• Client: *${t.company || t.customerName}*\n• Contact: ${t.customerName} (${t.phone || 'N/A'})\n• Site Address: ${t.siteAddress || 'Refer to Invoice'}\n• Asset / SKU: ${t.productSerialOrSku || 'Standard Supply'}\n• Invoice Ref: ${t.linkedInvoiceNumber || 'N/A'}\n• Issue: ${t.subject}\n• Notes: ${t.notes || 'Please inspect and share signed job sheet.'}`,
    );
    const base = waPhone ? `https://wa.me/${waPhone}` : 'https://wa.me/';
    window.open(`${base}?text=${msg}`, '_blank');
  };

  const boardColumns: { status: TicketStatus; title: string; tone: string }[] =
    useMemo(
      () => [
        { status: 'open', title: 'Open Queue', tone: 'border-t-4 border-t-brand-blue' },
        { status: 'in_progress', title: 'In Progress / Field', tone: 'border-t-4 border-t-amber-500' },
        { status: 'waiting_client', title: 'Waiting Client', tone: 'border-t-4 border-t-purple-500' },
        { status: 'resolved', title: 'Resolved', tone: 'border-t-4 border-t-emerald-500' },
        { status: 'closed', title: 'Closed', tone: 'border-t-4 border-t-slate-400' },
      ],
      [],
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            <LifeBuoy className="w-3.5 h-3.5" /> Post-Sales Service Desk, AMC &amp; Dispatch SLA
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            SLA Support &amp; Field Service Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage dispatch E-Way bill delays, warranty repairs, site installations, GST billing corrections, field engineer job sheets, and SLA timers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'board'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> SLA Board
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> New SLA Ticket
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

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6-Card KPI & SLA Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Open Queue
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-1">
            {stats.openCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Of {stats.total} total tickets
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            In Progress (Field)
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {stats.inProgressCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.waitingClientCount} waiting client
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            High / Urgent SLA
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {stats.urgentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Same-day / 24h target
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSlaBreachedOnly((v) => !v)}
          className={`text-left rounded-2xl p-4 border transition-all shadow-sm ${
            slaBreachedOnly
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500'
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center justify-between">
            <span>SLA Breached</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {stats.slaBreachedCount}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">
            {slaBreachedOnly ? 'Showing breached only' : 'Click to filter'}
          </div>
        </button>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Resolved &amp; Closed
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {stats.resolvedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Verified sign-off
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Buyer CSAT Score
          </div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1 inline-flex items-center gap-1">
            <span>{stats.avgCsat}</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Out of 5.0 stars
          </div>
        </div>
      </div>

      {/* Category Pills + Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all', label: 'All Categories' },
            { key: 'dispatch_delay', label: 'Dispatch & E-Way Bill' },
            { key: 'warranty', label: 'Warranty Claims' },
            { key: 'gst_correction', label: 'GST Billing Fix' },
            { key: 'installation', label: 'Site Installation' },
            { key: 'amc_service', label: 'AMC Service' },
            { key: 'general', label: 'General Support' },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat.key
                  ? 'bg-brand-navy dark:bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.12]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ticket # (TKT-2026), buyer company, invoice #, SKU/serial, engineer, or site address..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-brand-navy focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_client">Waiting Client</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-brand-navy focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              type="button"
              onClick={() => setAssignedOnly((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                assignedOnly
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-400'
              }`}
            >
              Assigned to Me
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: List View vs Kanban SLA Board View */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-14 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
          <span>Loading SLA support &amp; field service tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="text-base font-extrabold text-brand-navy">
            No SLA Tickets Match Your Filter
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create a dispatch, warranty, GST billing, or AMC field service ticket to start tracking SLAs.
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              + Create SLA Ticket
            </button>
          </div>
        </div>
      ) : viewMode === 'board' ? (
        /* ─── 5-COLUMN KANBAN SLA BOARD VIEW ──────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {boardColumns.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3.5 flex flex-col gap-3 ${col.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
                    {col.title}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[220px]">
                  {colTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => openTicketDetail(t)}
                      className="cursor-pointer rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.07] hover:shadow-md transition-all p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-extrabold text-brand-blue">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${PRIORITY_STYLE[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <div className="text-xs font-extrabold text-brand-navy line-clamp-2">
                        {t.subject}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate">
                        {t.company || t.customerName || 'B2B Buyer'}
                      </div>

                      {t.assignedToName && (
                        <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md truncate">
                          Eng: {t.assignedToName}
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                        {t.isSlaBreached ? (
                          <span className="font-extrabold text-rose-600 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SLA Breached
                          </span>
                        ) : (
                          <span className="text-slate-400">Due {t.slaDueAt}</span>
                        )}
                        <span className="font-bold text-slate-500">
                          {t.comments?.length || 0} msg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── DETAILED LIST VIEW ──────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-white/10">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openTicketDetail(t)}
                    className="font-mono text-xs font-extrabold text-brand-blue hover:underline"
                  >
                    {t.ticketNumber}
                  </button>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${PRIORITY_STYLE[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                    {CATEGORY_LABELS[t.category] || t.category}
                  </span>
                  {t.isSlaBreached ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-3 h-3" /> SLA Breached (Due {t.slaDueAt})
                    </span>
                  ) : (
                    t.slaDueAt && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Clock className="w-3 h-3" /> SLA Due {t.slaDueAt}
                      </span>
                    )
                  )}
                  {(t.csatRating ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      ★ {t.csatRating}/5 CSAT
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openTicketDetail(t)}
                  className="text-left text-sm sm:text-base font-extrabold text-brand-navy hover:text-brand-blue transition-colors block"
                >
                  {t.subject}
                </button>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    Buyer:{' '}
                    <strong className="text-brand-navy">
                      {t.company || t.customerName || 'Walk-in B2B'}
                    </strong>
                    {t.customerName && t.company ? ` (${t.customerName})` : ''}
                  </span>
                  {t.phone && <span className="font-mono">{t.phone}</span>}
                  {t.linkedInvoiceNumber && (
                    <Link
                      href="/invoices"
                      className="font-mono font-bold text-brand-blue hover:underline"
                    >
                      Doc #{t.linkedInvoiceNumber}
                    </Link>
                  )}
                  {t.productSerialOrSku && (
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                      <Package className="w-3 h-3 text-slate-400" />
                      {t.productSerialOrSku}
                    </span>
                  )}
                  {t.assignedToName && (
                    <span className="inline-flex items-center gap-1 text-indigo-700 font-bold">
                      <UserCheck className="w-3.5 h-3.5" />
                      {t.assignedToName}
                    </span>
                  )}
                </div>

                {t.siteAddress && (
                  <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{t.siteAddress}</span>
                  </div>
                )}

                {t.resolutionSummary && (
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-3 py-1.5">
                    ✓ Resolution: {t.resolutionSummary}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openTicketDetail(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-brand-light dark:hover:bg-white/10 text-brand-blue text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Workbench ({t.comments?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppBuyerUpdate(t)}
                  title="Send WhatsApp Status Update to Buyer"
                  className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <select
                  value={t.status}
                  onChange={(e) =>
                    handleStatusChange(t.id, e.target.value as TicketStatus)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${STATUS_STYLE[t.status]}`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_client">Waiting Client</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  title="Delete ticket"
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE SLA TICKET MODAL ───────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8"
          >
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="text-base font-extrabold">
                    Create SLA Support &amp; Field Service Ticket
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Link B2B buyer, GST invoice, product serial/SKU, and assign field engineer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Quick Auto-fill from B2B Contacts */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Auto-Fill Buyer from B2B Contacts
                  </label>
                  <select
                    value={linkedContactId}
                    onChange={(e) => handleSelectContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-brand-navy"
                  >
                    <option value="">-- Select Saved B2B Contact --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company || c.name} ({c.city || c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Link GST Invoice / Quotation (Optional)
                  </label>
                  <select
                    value={linkedInvoiceNumber}
                    onChange={(e) => setLinkedInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-brand-navy"
                  >
                    <option value="">-- Select Invoice / Quote # --</option>
                    {invoicesList.map((inv) => (
                      <option key={inv.id} value={inv.invoiceNumber}>
                        {inv.invoiceNumber} · {inv.clientName} (₹
                        {inv.grandTotal.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ticket Subject / Issue Summary *
                </label>
                <input
                  required
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 150 KVA Servo Stabilizer Site Commissioning / Transporter E-Way Bill Part-B"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-brand-navy"
                  >
                    <option value="dispatch_delay">Dispatch &amp; E-Way Bill</option>
                    <option value="warranty">Warranty Claim</option>
                    <option value="gst_correction">GST Billing Fix</option>
                    <option value="installation">Site Installation</option>
                    <option value="amc_service">AMC Service Visit</option>
                    <option value="general">General Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority (Auto-sets SLA)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      handlePriorityChange(e.target.value as TicketPriority)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-brand-navy"
                  >
                    <option value="urgent">Urgent (Same Day SLA)</option>
                    <option value="high">High (24h SLA)</option>
                    <option value="medium">Medium (48h SLA)</option>
                    <option value="low">Low (72h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SLA Target Date
                  </label>
                  <input
                    type="date"
                    value={slaDueAt}
                    onChange={(e) => setSlaDueAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-brand-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buyer Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="RS Electricals Pvt. Ltd."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98112 45678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product SKU / Serial Number
                  </label>
                  <input
                    type="text"
                    list="ticket-sku-list"
                    value={productSerialOrSku}
                    onChange={(e) => setProductSerialOrSku(e.target.value)}
                    placeholder="e.g. IND-STAB-150 · SN#260489"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                  />
                  <datalist id="ticket-sku-list">
                    {productsList.map((p) => (
                      <option key={p.id} value={`${p.sku} · ${p.name}`} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Site / Delivery Address
                  </label>
                  <input
                    type="text"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="Plot 42, Okhla Phase-II, New Delhi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                  />
                </div>
              </div>

              {/* Assign Field Engineer / Support Desk */}
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-indigo-950">
                    Assign Support Engineer / Service Owner
                  </label>
                </div>
                {assignees.length > 0 && (
                  <select
                    value={assignedToUserId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setAssignedToUserId(uid);
                      const picked = assignees.find((a) => a.id === uid);
                      if (picked) {
                        setAssignedToName(picked.name);
                        setAssignedToPhone(picked.phone || '');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-brand-navy"
                  >
                    <option value="">-- Open Support Queue (Unassigned) or Pick Team Member --</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.role === 'support' ? '🔧 [Support Engineer] ' : `[${a.role.toUpperCase()}] `}
                        {a.name}
                        {a.territory ? ` · ${a.territory}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    placeholder="Engineer / Rep Name"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs text-brand-navy"
                  />
                  <input
                    type="text"
                    value={assignedToPhone}
                    onChange={(e) => setAssignedToPhone(e.target.value)}
                    placeholder="Engineer WhatsApp (+91)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs text-brand-navy font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Diagnostic / Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Context for warehouse, GST accounts, or field engineer..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {isSaving ? 'Creating...' : 'Create & Assign Ticket'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ─── TICKET DETAIL & RESOLUTION WORKBENCH MODAL ────────────── */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
          >
            {/* Top Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-sky-400">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${PRIORITY_STYLE[selectedTicket.priority]}`}
                  >
                    {selectedTicket.priority}
                  </span>
                  <span className="text-xs text-slate-300">
                    · {CATEGORY_LABELS[selectedTicket.category]}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                  {selectedTicket.subject}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleWhatsAppBuyerUpdate(selectedTicket)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Buyer
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppEngineerJobSheet(selectedTicket)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white"
                >
                  <Wrench className="w-3.5 h-3.5" /> Dispatch Engineer
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Job Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* 1-Click Status Pipeline Bar */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  SLA Lifecycle Stage:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      'open',
                      'in_progress',
                      'waiting_client',
                      'resolved',
                      'closed',
                    ] as TicketStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedTicket.status === st
                          ? 'bg-brand-navy text-white border-brand-navy shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two-Column Details: Buyer & Asset Info + Engineer & Resolution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">
                    Buyer, Asset &amp; Site Information
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">Company:</span>
                      <span className="font-bold text-brand-navy">
                        {selectedTicket.company || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Person:</span>
                      <span className="font-bold text-brand-navy">
                        {selectedTicket.customerName || '—'}{' '}
                        {selectedTicket.phone ? `(${selectedTicket.phone})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Linked Invoice #:</span>
                      <span className="font-mono font-bold text-brand-blue">
                        {selectedTicket.linkedInvoiceNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Product / Serial:</span>
                      <span className="font-semibold text-slate-700">
                        {selectedTicket.productSerialOrSku || '—'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Site Address:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedTicket.siteAddress || 'Noida / Delhi-NCR'}
                    </span>
                  </div>
                  {selectedTicket.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                      <span className="font-bold text-slate-700">Initial Note: </span>
                      {selectedTicket.notes}
                    </div>
                  )}
                </div>

                {/* Engineer Assignment, Resolution Summary & CSAT */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                      Engineer Assignment &amp; Resolution Sign-Off
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      SLA Due: {selectedTicket.slaDueAt}
                    </span>
                  </div>

                  {assignees.length > 0 && (
                    <select
                      value={assigneeUserIdDraft}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setAssigneeUserIdDraft(uid);
                        const picked = assignees.find((a) => a.id === uid);
                        if (picked) {
                          setAssigneeDraft(picked.name);
                          setAssigneePhoneDraft(picked.phone || '');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs font-bold text-brand-navy"
                    >
                      <option value="">-- Unassigned / External Field Engineer --</option>
                      {assignees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.role === 'support' ? '🔧 [Support Engineer] ' : `[${a.role.toUpperCase()}] `}
                          {a.name}
                          {a.territory ? ` · ${a.territory}` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={assigneeDraft}
                      onChange={(e) => setAssigneeDraft(e.target.value)}
                      placeholder="Assigned Engineer Name"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={assigneePhoneDraft}
                      onChange={(e) => setAssigneePhoneDraft(e.target.value)}
                      placeholder="Engineer Phone (+91)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={resolutionDraft}
                      onChange={(e) => setResolutionDraft(e.target.value)}
                      placeholder="Root cause, E-Way Bill Part-B #, spares replaced, or job sheet sign-off summary..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">
                        Buyer CSAT:
                      </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSetCsat(star)}
                          className={`px-2 py-0.5 rounded-md text-xs font-bold border transition-all ${
                            (selectedTicket.csatRating ?? 0) >= star
                              ? 'bg-amber-400 text-slate-950 border-amber-400'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          ★ {star}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveTicketMeta}
                      className="px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      {isSaving ? 'Saving...' : 'Save Assignment & Resolution'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Timeline & Comment Thread */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 dark:bg-white/[0.05] border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy">
                    Ticket Activity Timeline &amp; Engineer Updates ({selectedTicket.comments?.length || 0})
                  </span>
                </div>

                <div className="p-4 space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10">
                  {(selectedTicket.comments || []).length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No comments or engineer updates recorded yet.
                    </div>
                  ) : (
                    selectedTicket.comments?.map((c) => (
                      <div
                        key={c.id}
                        className={`pt-3 first:pt-0 text-xs ${
                          c.isInternal
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/80 dark:border-amber-700/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-brand-navy">
                              {c.authorName}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                              {c.authorRole}
                            </span>
                            {c.isInternal && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                                <Lock className="w-2.5 h-2.5" /> Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line">
                          {c.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Reply / Internal Note Composer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={commentRole}
                        onChange={(e) =>
                          setCommentRole(
                            e.target.value as 'agent' | 'engineer' | 'customer',
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
                      >
                        <option value="agent">Post as Support Desk</option>
                        <option value="engineer">Post as Field Engineer</option>
                        <option value="customer">Log Buyer Call / Reply</option>
                      </select>

                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commentInternal}
                          onChange={(e) => setCommentInternal(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>Internal Team Note Only</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a reply, E-Way bill update, or engineer inspection log..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPostingComment || !commentText.trim()}
                        onClick={() => handlePostComment()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Post Update
                      </button>
                      {selectedTicket.status !== 'resolved' && (
                        <button
                          type="button"
                          disabled={isPostingComment || !commentText.trim()}
                          onClick={() => handlePostComment('resolved')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Post &amp; Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import {
  fetchTicketsApi,
  createTicketApi,
  updateTicketApi,
  deleteTicketApi,
  seedTicketsApi,
} from '@/lib/tickets-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@/types/contracts';

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'bg-blue-50 text-brand-blue border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting_client: 'bg-purple-50 text-purple-700 border-purple-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
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
  general: 'General Support',
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    openCount: 0,
    urgentCount: 0,
    resolvedCount: 0,
    slaBreachedCount: 0,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('dispatch_delay');
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [customerName, setCustomerName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState('');
  const [slaDueAt, setSlaDueAt] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState('');

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTicketsApi({
        status: statusFilter,
        priority: priorityFilter,
        search: search.trim() || undefined,
      });
      setTickets(res.data || []);
      setStats(res.stats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setIsSaving(true);
    try {
      await createTicketApi({
        subject,
        category,
        priority,
        customerName,
        company,
        phone,
        linkedInvoiceNumber,
        slaDueAt,
        notes,
      });
      setModalOpen(false);
      setSubject('');
      setCustomerName('');
      setCompany('');
      setPhone('');
      setLinkedInvoiceNumber('');
      setNotes('');
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedTicketsApi();
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      await updateTicketApi(id, { status });
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTicketApi(id);
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <LifeBuoy className="w-3.5 h-3.5" /> Post-Sale Operations &amp; SLA
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Customer Support &amp; Dispatch SLA Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track dispatch delays, E-Way bill fixes, GST corrections, warranty
            claims, and site installations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.total === 0 && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-brand-navy hover:border-brand-blue transition-colors"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              )}
              Seed Sample Tickets
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> New SLA Ticket
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Open Tickets
          </div>
          <div className="text-2xl font-extrabold text-brand-navy mt-1.5">
            {stats.openCount}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            High / Urgent Queue
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1.5">
            {stats.urgentCount}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            SLA Breached
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1.5">
            {stats.slaBreachedCount}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Resolved Within SLA
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1.5">
            {stats.resolvedCount}
          </div>
        </div>
      </div>

      {/* Filters + Ticket List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket #, buyer, or invoice..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            <span>Loading SLA support tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
            <div className="text-sm font-extrabold text-brand-navy">
              All clear — no open tickets match your filter
            </div>
            <p className="text-xs text-slate-400">
              Create a dispatch/GST ticket or seed sample NCR tickets to test SLA
              tracking.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-brand-blue">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${PRIORITY_STYLE[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {CATEGORY_LABELS[t.category] || t.category}
                    </span>
                    {t.isSlaBreached && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        <AlertTriangle className="w-3 h-3" /> SLA Breached
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-brand-navy">
                    {t.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Client:{' '}
                      <strong className="text-brand-navy">
                        {t.company || t.customerName || 'Walk-in B2B'}
                      </strong>
                    </span>
                    {t.phone && <span className="font-mono">{t.phone}</span>}
                    {t.linkedInvoiceNumber && (
                      <span>Invoice: #{t.linkedInvoiceNumber}</span>
                    )}
                    {t.slaDueAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> SLA Due {t.slaDueAt}
                      </span>
                    )}
                  </div>

                  {t.notes && (
                    <p className="text-xs text-slate-400">{t.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
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
      </div>

      {/* Create Ticket Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-brand-navy">
                Create SLA Support Ticket
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Issue / Subject *
              </label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Transporter E-Way bill update for Noida dispatch"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                >
                  <option value="dispatch_delay">Dispatch &amp; E-Way Bill</option>
                  <option value="gst_correction">GST Billing Fix</option>
                  <option value="warranty">Warranty Claim</option>
                  <option value="installation">Site Installation</option>
                  <option value="general">General Support</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                >
                  <option value="urgent">Urgent (Same Day SLA)</option>
                  <option value="high">High (24h SLA)</option>
                  <option value="medium">Medium (48h SLA)</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="RS Electricals Pvt. Ltd."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Rajesh Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98112 45678"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Invoice #
                </label>
                <input
                  type="text"
                  value={linkedInvoiceNumber}
                  onChange={(e) => setLinkedInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-1002"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  SLA Due Date
                </label>
                <input
                  type="date"
                  value={slaDueAt}
                  onChange={(e) => setSlaDueAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context for warehouse, accounts, or engineer..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-brand-navy"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                {isSaving ? 'Creating...' : 'Create SLA Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

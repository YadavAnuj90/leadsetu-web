'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Phone,
  MessageSquare,
  Calendar,
  Trash2,
  Database,
  Loader2,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Task } from '@/types/contracts';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    highPriority: 0,
    completed: 0,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [category, setCategory] = useState<Task['category']>('whatsapp');
  const [dueDate, setDueDate] = useState('');
  const [relatedName, setRelatedName] = useState('');
  const [relatedCompany, setRelatedCompany] = useState('');
  const [relatedPhone, setRelatedPhone] = useState('');

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<{
        data: Task[];
        stats: typeof stats;
      }>('/tasks', { params: { status: statusFilter } });
      setTasks(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleDone = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    await apiClient.patch(`/tasks/${task.id}`, { status: nextStatus });
    await fetchTasks();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsMutating(true);
    try {
      await apiClient.post('/tasks', {
        title,
        description,
        priority,
        category,
        dueDate,
        relatedName,
        relatedCompany,
        relatedPhone,
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setRelatedName('');
      setRelatedCompany('');
      setRelatedPhone('');
      await fetchTasks();
    } finally {
      setIsMutating(false);
    }
  };

  const handleSeed = async () => {
    setIsMutating(true);
    try {
      await apiClient.post('/tasks/seed');
      await fetchTasks();
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Clock className="w-3.5 h-3.5" /> Daily Sales Execution
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Tasks &amp; Follow-up Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Never miss a buyer call, site visit, or GST quotation follow-up.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {stats.total === 0 && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={isMutating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Load 4 Sample Tasks</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, color: '#3978EA' },
          { label: 'Pending Action', value: stats.pending, color: '#F59E0B' },
          { label: 'High Priority Urgent', value: stats.highPriority, color: '#EF4444' },
          { label: 'Completed ✓', value: stats.completed, color: '#10B981' },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm"
          >
            <div className="text-xs font-semibold text-slate-500">{k.label}</div>
            <div
              className="text-2xl font-extrabold mt-1"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'pending', label: 'Pending' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'done', label: 'Completed ✓' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-brand-navy text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-14 border border-slate-200/80 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4">
          <p className="text-base font-extrabold text-brand-navy">
            No follow-up tasks scheduled yet
          </p>
          <button
            type="button"
            onClick={handleSeed}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            <Database className="w-4 h-4" /> Load 4 Sample Follow-up Tasks
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isDone = task.status === 'done';
            const cleanPhone = (task.relatedPhone || '').replace(/[^0-9]/g, '');
            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-slate-100 opacity-65'
                    : 'border-slate-200/90 shadow-sm hover:border-brand-blue/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleDone(task)}
                    className="mt-0.5 text-brand-blue hover:scale-110 transition-transform"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-brand-blue" />
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          isDone ? 'line-through text-slate-400' : 'text-brand-navy'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority === 'high' && (
                          <Flame className="w-3 h-3 inline mr-0.5" />
                        )}
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-light text-brand-blue">
                        {task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-2">
                      {task.relatedName && (
                        <span className="font-semibold text-slate-600">
                          Buyer: {task.relatedName}{' '}
                          {task.relatedCompany ? `(${task.relatedCompany})` : ''}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {cleanPhone && (
                    <>
                      <a
                        href={`https://wa.me/${
                          cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
                        }`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="WhatsApp Buyer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${task.relatedPhone}`}
                        className="p-2 rounded-xl bg-blue-50 text-brand-blue hover:bg-blue-100"
                        title="Call Buyer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await apiClient.delete(`/tasks/${task.id}`);
                      await fetchTasks();
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">Schedule Sales Follow-up</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Share GST quotation PDF with Rajesh ji"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="high">High Urgent</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Action Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Task['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">Phone Call</option>
                    <option value="quote">GST Quote</option>
                    <option value="meeting">Site Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={relatedName}
                    onChange={(e) => setRelatedName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    WhatsApp Phone (+91)
                  </label>
                  <input
                    type="tel"
                    value={relatedPhone}
                    onChange={(e) => setRelatedPhone(e.target.value)}
                    placeholder="+91 98112 45678"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context or agenda for this follow-up..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

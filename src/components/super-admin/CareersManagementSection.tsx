'use client';

import { useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/api-client';
import {
  createSuperAdminCareerJobApi,
  deleteSuperAdminCareerJobApi,
  downloadSuperAdminCareerResumeApi,
  fetchSuperAdminCareersApi,
  updateSuperAdminCareerApplicationApi,
  updateSuperAdminCareerJobApi,
  type CareerApplicationStage,
  type CareerJobStatus,
  type CareerTeamName,
  type SuperAdminCareerApplicationItem,
  type SuperAdminCareerJobItem,
  type SuperAdminCareersOverviewResponse,
} from '@/lib/super-admin-api';

const TEAMS: CareerTeamName[] = [
  'Engineering & AI',
  'Product & Design',
  'Growth & Success',
  'Operations & Trust',
];

const STAGES: Array<{
  value: CareerApplicationStage;
  label: string;
  badgeClass: string;
}> = [
  {
    value: 'new',
    label: 'New',
    badgeClass:
      'bg-blue-500/10 text-blue-700 dark:text-sky-300 border-blue-500/25',
  },
  {
    value: 'shortlisted',
    label: 'Shortlisted',
    badgeClass:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
  },
  {
    value: 'interview',
    label: 'Interview',
    badgeClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  {
    value: 'offer',
    label: 'Offer Sent',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
  {
    value: 'rejected',
    label: 'Archived',
    badgeClass:
      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-400/25',
  },
];

interface JobFormState {
  title: string;
  team: CareerTeamName;
  location: string;
  experience: string;
  employmentType: 'Full-Time' | 'Contract' | 'Internship';
  compensation: string;
  summary: string;
  responsibilitiesText: string;
  skillsText: string;
  status: CareerJobStatus;
  featured: boolean;
  sortOrder: number;
}

const EMPTY_JOB_FORM: JobFormState = {
  title: '',
  team: 'Engineering & AI',
  location: 'Hybrid · India',
  experience: '2–5 Years',
  employmentType: 'Full-Time',
  compensation: 'Competitive + ESOPs',
  summary: '',
  responsibilitiesText: '',
  skillsText: '',
  status: 'open',
  featured: false,
  sortOrder: 0,
};

export default function CareersManagementSection() {
  const [data, setData] = useState<SuperAdminCareersOverviewResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'jobs' | 'applications'>('jobs');

  // Filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | CareerJobStatus>(
    'all',
  );
  const [appFilterJobId, setAppFilterJobId] = useState<string>('all');
  const [appStageFilter, setAppStageFilter] = useState<
    'all' | CareerApplicationStage
  >('all');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_JOB_FORM);
  const [savingJob, setSavingJob] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loadCareers = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchSuperAdminCareersApi();
      setData(res);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const a of res.applications) {
          if (next[a.id] === undefined) next[a.id] = a.reviewerNotes || '';
        }
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return (data?.jobs || []).filter((j) => {
      if (jobStatusFilter !== 'all' && j.status !== jobStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.team.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [data?.jobs, jobSearch, jobStatusFilter]);

  const filteredApplications = useMemo(() => {
    return (data?.applications || []).filter((a) => {
      if (appFilterJobId !== 'all' && a.jobId !== appFilterJobId) {
        return false;
      }
      if (appStageFilter !== 'all' && a.stage !== appStageFilter) {
        return false;
      }
      return true;
    });
  }, [data?.applications, appFilterJobId, appStageFilter]);

  const openCreateModal = () => {
    setEditingJobId(null);
    setForm(EMPTY_JOB_FORM);
    setModalOpen(true);
  };

  const openEditModal = (job: SuperAdminCareerJobItem) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      team: job.team,
      location: job.location,
      experience: job.experience,
      employmentType: job.employmentType,
      compensation: job.compensation,
      summary: job.summary,
      responsibilitiesText: (job.responsibilities || []).join('\n'),
      skillsText: (job.skills || []).join(', '),
      status: job.status,
      featured: job.featured,
      sortOrder: job.sortOrder || 0,
    });
    setModalOpen(true);
  };

  const handleSaveJob = async (e: FormEvent) => {
    e.preventDefault();
    setSavingJob(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        team: form.team,
        location: form.location.trim(),
        experience: form.experience.trim(),
        employmentType: form.employmentType,
        compensation: form.compensation.trim(),
        summary: form.summary.trim(),
        responsibilities: form.responsibilitiesText
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        skills: form.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        status: form.status,
        featured: form.featured,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingJobId) {
        await updateSuperAdminCareerJobApi(editingJobId, payload);
        setToast(`Updated role "${payload.title}" on /company/careers`);
      } else {
        await createSuperAdminCareerJobApi(payload);
        setToast(`Published new role "${payload.title}" live on /company/careers`);
      }
      setModalOpen(false);
      await loadCareers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingJob(false);
    }
  };

  const handleStatusToggle = async (
    job: SuperAdminCareerJobItem,
    nextStatus: CareerJobStatus,
  ) => {
    setBusyId(job.id);
    try {
      await updateSuperAdminCareerJobApi(job.id, { status: nextStatus });
      setToast(`"${job.title}" marked ${nextStatus}.`);
      await loadCareers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteJob = async (job: SuperAdminCareerJobItem) => {
    if (!window.confirm(`Delete job "${job.title}" permanently?`)) return;
    setBusyId(job.id);
    try {
      await deleteSuperAdminCareerJobApi(job.id);
      setToast(`Deleted role "${job.title}".`);
      await loadCareers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateApplication = async (
    app: SuperAdminCareerApplicationItem,
    stage: CareerApplicationStage,
    reviewerNotes?: string,
  ) => {
    setBusyId(app.id);
    try {
      await updateSuperAdminCareerApplicationApi(app.id, {
        stage,
        reviewerNotes,
      });
      setToast(`Updated ${app.candidateName} → ${stage}`);
      await loadCareers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 rounded-3xl border border-slate-200/80 bg-white p-10 dark:border-slate-800 dark:bg-[#0D1628]">
        <Loader2 className="h-5 w-5 animate-spin text-[#0057FF]" />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
          Loading HQ Careers &amp; Hiring Desk...
        </span>
      </div>
    );
  }

  const stats = data?.stats || {
    totalJobs: 0,
    openJobs: 0,
    pausedJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    shortlistedApplications: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/85 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0D1628] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
            <Briefcase className="h-3.5 w-3.5" /> Public Careers &amp; Hiring Authority
          </div>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            Careers Portal &amp; Candidate Pipeline
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Jobs marked <strong>Open</strong> go live immediately on{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
              /company/careers
            </code>
            . Candidate PDF applications stream straight into this desk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/company/careers"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-[#0057FF] hover:text-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>View Live /company/careers</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0057FF] px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#0057FF]/25 hover:bg-[#0046D5]"
          >
            <Plus className="h-4 w-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Live Open Roles',
            value: stats.openJobs,
            sub: `${stats.totalJobs} total postings`,
            accent: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Paused / Closed',
            value: stats.pausedJobs + stats.closedJobs,
            sub: `${stats.pausedJobs} paused · ${stats.closedJobs} closed`,
            accent: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Total Applications',
            value: stats.totalApplications,
            sub: `${stats.newApplications} awaiting review`,
            accent: 'text-[#0057FF] dark:text-sky-400',
          },
          {
            label: 'Active Pipeline',
            value: stats.shortlistedApplications,
            sub: 'Shortlisted or interviewing',
            accent: 'text-violet-600 dark:text-violet-400',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0D1628]"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className={`mt-1 text-2xl font-black ${kpi.accent}`}>
              {kpi.value}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setSubTab('jobs')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
              subTab === 'jobs'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-[#0057FF] dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Job Postings ({stats.totalJobs})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('applications')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
              subTab === 'applications'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-[#0057FF] dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>
              Applications ({stats.totalApplications}
              {stats.newApplications > 0 ? ` · ${stats.newApplications} new` : ''})
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadCareers}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0D1628] dark:text-slate-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync</span>
        </button>
      </div>

      {/* ─── JOBS LIST VIEW ──────────────────────────────────────────── */}
      {subTab === 'jobs' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-[#0D1628]">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search title, team, skills, or location..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'open', 'paused', 'closed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setJobStatusFilter(st)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
                    jobStatusFilter === st
                      ? 'bg-[#0057FF] text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0D1628]">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No career postings match your filter.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0057FF] px-4 py-2 text-xs font-extrabold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Post First Opening
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D1628]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 uppercase ${
                            job.status === 'open'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : job.status === 'paused'
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                : 'border-slate-400/30 bg-slate-500/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {job.status}
                        </span>
                        {job.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[#0057FF] dark:text-sky-300">
                            <Sparkles className="h-3 w-3" /> Featured
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {job.team}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {job.compensation}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="max-w-3xl text-xs text-slate-500 dark:text-slate-400">
                        {job.summary}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAppFilterJobId(job.id);
                          setSubTab('applications');
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {job.applicationsCount} Applicants
                      </button>

                      {job.status === 'open' ? (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => handleStatusToggle(job, 'paused')}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                        >
                          <PauseCircle className="h-3.5 w-3.5" /> Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => handleStatusToggle(job, 'open')}
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                        >
                          <PlayCircle className="h-3.5 w-3.5" /> Publish Live
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(job)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#0057FF] dark:border-slate-700 dark:text-slate-200"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>

                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => handleDeleteJob(job)}
                        className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        title="Delete job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── APPLICATIONS LIST VIEW ───────────────────────────────────── */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-[#0D1628]">
            <select
              value={appFilterJobId}
              onChange={(e) => setAppFilterJobId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              {(data?.jobs || []).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAppStageFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  appStageFilter === 'all'
                    ? 'bg-[#0057FF] text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All Stages
              </button>
              {STAGES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setAppStageFilter(st.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                    appStageFilter === st.value
                      ? 'bg-[#0057FF] text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-[#0D1628] dark:text-slate-400">
              No candidate applications yet matching this filter. Applications submitted on{' '}
              <code>/company/careers</code> will appear here automatically.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => {
                const stageMeta =
                  STAGES.find((s) => s.value === app.stage) || STAGES[0];
                return (
                  <div
                    key={app.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0D1628]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 ${stageMeta.badgeClass}`}
                          >
                            {stageMeta.label}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[#0057FF] dark:bg-blue-950/60 dark:text-sky-300">
                            {app.jobTitle}
                          </span>
                          <span className="text-slate-400">
                            Notice: {app.noticePeriod}
                          </span>
                        </div>

                        <div className="text-base font-black text-slate-900 dark:text-white">
                          {app.candidateName}{' '}
                          <span className="text-xs font-semibold text-slate-500">
                            · {app.candidateEmail} · {app.candidatePhone}
                          </span>
                        </div>

                        {app.portfolioUrl && (
                          <a
                            href={app.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0057FF] hover:underline dark:text-sky-400"
                          >
                            <span>{app.portfolioUrl}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {app.coverNote && (
                          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                            &ldquo;{app.coverNote}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2.5 lg:w-72 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            downloadSuperAdminCareerResumeApi(
                              app.id,
                              app.resumeFileName,
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:border-[#0057FF] hover:text-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <FileText className="h-3.5 w-3.5 text-rose-500" />
                          <span className="truncate">{app.resumeFileName}</span>
                          <Download className="h-3.5 w-3.5 shrink-0" />
                        </button>

                        <select
                          value={app.stage}
                          disabled={busyId === app.id}
                          onChange={(e) =>
                            handleUpdateApplication(
                              app,
                              e.target.value as CareerApplicationStage,
                              noteDrafts[app.id],
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          {STAGES.map((st) => (
                            <option key={st.value} value={st.value}>
                              Stage: {st.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={noteDrafts[app.id] ?? app.reviewerNotes ?? ''}
                            onChange={(e) =>
                              setNoteDrafts((p) => ({
                                ...p,
                                [app.id]: e.target.value,
                              }))
                            }
                            placeholder="Interviewer notes..."
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() =>
                              handleUpdateApplication(
                                app,
                                app.stage,
                                noteDrafts[app.id] ?? '',
                              )
                            }
                            className="rounded-xl bg-[#0057FF] px-3 py-1.5 text-[11px] font-bold text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE / EDIT JOB MODAL ──────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-6 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0D1628]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingJobId
                    ? 'Edit Career Opening'
                    : 'Publish New Job on /company/careers'}
                </h3>
                <p className="text-xs text-slate-500">
                  Changes sync immediately to the live public careers portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-4 p-6 text-xs">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g. Staff AI Engineer (WhatsApp Agents)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Department / Team *
                  </label>
                  <select
                    value={form.team}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        team: e.target.value as CareerTeamName,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="Hybrid · India or Remote"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={form.experience}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, experience: e.target.value }))
                    }
                    placeholder="2–5 Years"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Compensation Range
                  </label>
                  <input
                    type="text"
                    value={form.compensation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, compensation: e.target.value }))
                    }
                    placeholder="₹15L – ₹25L + ESOPs"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Employment Type
                  </label>
                  <select
                    value={form.employmentType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        employmentType: e.target.value as
                          | 'Full-Time'
                          | 'Contract'
                          | 'Internship',
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Visibility Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as CareerJobStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="open">Open (Live on Platform)</option>
                    <option value="paused">Paused (Hidden)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Role Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.summary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, summary: e.target.value }))
                  }
                  placeholder="Describe mission and ownership for this position..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Responsibilities (One bullet per line)
                </label>
                <textarea
                  rows={3}
                  value={form.responsibilitiesText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      responsibilitiesText: e.target.value,
                    }))
                  }
                  placeholder={'Own core feature architecture\nShip weekly releases with design & backend'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Skills (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.skillsText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, skillsText: e.target.value }))
                    }
                    placeholder="TypeScript, Next.js, MongoDB"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0057FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 pt-5 font-bold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featured: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#0057FF]"
                  />
                  <span>Feature this opening at top of Careers page</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJob}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0057FF] px-5 py-2.5 font-extrabold text-white shadow-md shadow-[#0057FF]/20 hover:bg-[#0046D5] disabled:opacity-60"
                >
                  {savingJob && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingJobId ? 'Save Changes' : 'Publish Role Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  FormEvent,
  ChangeEvent,
  DragEvent,
} from 'react';
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  Cpu,
  FileText,
  HeartHandshake,
  Laptop,
  Loader2,
  MapPin,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';
import CompanySubnav from '@/components/company/CompanySubnav';
import { getErrorMessage } from '@/lib/api-client';
import {
  fetchPublicCareerJobsApi,
  submitCareerApplicationApi,
  type CareerTeam,
  type PublicCareerJob,
} from '@/lib/careers-api';

const TEAM_FILTERS: Array<'All' | CareerTeam> = [
  'All',
  'Engineering & AI',
  'Product & Design',
  'Growth & Success',
  'Operations & Trust',
];

const WHY_JOIN = [
  {
    icon: Rocket,
    title: 'Zero Bureaucracy. Ship Weekly.',
    desc: 'Work closely with Founder & CEO Anjali Yadav and engineering leads. Ideas go from whiteboard to live customer accounts in days, not quarters.',
  },
  {
    icon: Cpu,
    title: 'Hard AI & Real-Time Infra Problems',
    desc: 'Tackle Hinglish/English RAG grounding, multi-tenant DPDP security, WebRTC TURN optimization, and fintech-grade GST settlement ledgers.',
  },
  {
    icon: Laptop,
    title: 'Modern Equipment & AI Dev Budget',
    desc: 'Choose your workstation setup plus dedicated monthly credits for AI coding assistants, courses, and technical conferences.',
  },
  {
    icon: HeartHandshake,
    title: 'Competitive Pay, ESOPs & Health Cover',
    desc: 'Transparent salary bands, meaningful early-builder equity grants, and comprehensive medical insurance for you and your family.',
  },
  {
    icon: Users,
    title: 'Direct Impact on 4,500+ Businesses',
    desc: 'See Indian manufacturers, distributors, and service companies grow measurably using features your team shipped this week.',
  },
  {
    icon: ShieldCheck,
    title: 'Craft, Ownership & Calm Focus',
    desc: 'Deep-work mornings with minimal meetings, clear async specs, and respectful boundaries so great builders do their best work.',
  },
];

const LIFE_AT_LEADSETU = [
  {
    icon: Building2,
    tag: 'WORKSPACES',
    title: 'Hybrid & Remote Engineering Studio',
    desc: 'Collaborate across our India product hub and distributed engineering pods built for deep technical execution.',
  },
  {
    icon: Sparkles,
    tag: 'FRIDAY RITUAL',
    title: 'Ship & Demo Fridays',
    desc: 'Every Friday at 4 PM, engineers, designers, and onboarding leads demo live improvements to the whole company.',
  },
  {
    icon: Coffee,
    tag: 'HYBRID RHYTHM',
    title: '3-2 Hybrid Builder Week',
    desc: 'Three high-energy collaboration days for whiteboarding and customer calls, and two deep-focus remote days.',
  },
  {
    icon: Award,
    tag: 'GROWTH TRACK',
    title: 'Founder Office Hours & Mentorship',
    desc: 'Bi-weekly open architecture & product reviews with leadership, plus crisp quarterly career progression conversations.',
  },
];

const HIRING_STEPS = [
  {
    step: '01',
    title: 'Application & PDF Resume Review',
    detail:
      'Share your PDF resume & portfolio/GitHub. A real hiring manager reviews every profile within 48 hours.',
  },
  {
    step: '02',
    title: '30-Min Intro & Product Chat',
    detail:
      'An honest two-way conversation about your past work, role expectations, and what we are building.',
  },
  {
    step: '03',
    title: 'Practical Craft Deep-Dive',
    detail:
      'Real-world problem solving or system design grounded in Leadsetu’s actual stack — zero trick brainteasers.',
  },
  {
    step: '04',
    title: 'Founder Chat & Fast Offer',
    detail:
      'A conversation with leadership on mission alignment, followed by a clear compensation & ESOP offer within 24–48 hours.',
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read PDF file.'));
    reader.readAsDataURL(file);
  });
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<PublicCareerJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [selectedTeam, setSelectedTeam] = useState<'All' | CareerTeam>('All');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Application Modal State
  const [applyingJob, setApplyingJob] = useState<{
    id?: string;
    title: string;
    team: string;
    meta: string;
  } | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidatePortfolio, setCandidatePortfolio] = useState('');
  const [candidateNotice, setCandidateNotice] = useState('Immediate / 15 Days');
  const [candidateNote, setCandidateNote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [submittedConfirmation, setSubmittedConfirmation] = useState<{
    role: string;
    fileName: string;
    email: string;
  } | null>(null);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const res = await fetchPublicCareerJobsApi();
      const list = res.data || [];
      setJobs(list);
      setExpandedJobId((prev) => {
        if (prev && list.some((j) => j.id === prev)) return prev;
        return list[0]?.id || null;
      });
    } catch (err) {
      setJobsError(getErrorMessage(err));
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const visibleJobs = useMemo(
    () =>
      selectedTeam === 'All'
        ? jobs
        : jobs.filter((j) => j.team === selectedTeam),
    [jobs, selectedTeam],
  );

  const openModalForRole = (params: {
    id?: string;
    title: string;
    team: string;
    meta: string;
  }) => {
    setApplyingJob(params);
    setResumeError(null);
    setSubmitError(null);
  };

  const validateAndAttachPdf = (file: File | null | undefined) => {
    setResumeError(null);
    if (!file) return;
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setResumeFile(null);
      setResumeError('Only PDF resumes (.pdf) are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeFile(null);
      setResumeError('PDF size must be 5 MB or smaller.');
      return;
    }
    setResumeFile(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndAttachPdf(e.target.files?.[0]);
  };

  const handleDropPdf = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    validateAndAttachPdf(e.dataTransfer.files?.[0]);
  };

  const handleApplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    if (!resumeFile) {
      setResumeError('Please attach your resume as a PDF file (.pdf).');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const resumeBase64 = await readFileAsBase64(resumeFile);
      const res = await submitCareerApplicationApi({
        jobId: applyingJob.id,
        jobTitle: applyingJob.title,
        jobTeam: applyingJob.team,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidatePhone: candidatePhone.trim(),
        noticePeriod: candidateNotice,
        portfolioUrl: candidatePortfolio.trim(),
        coverNote: candidateNote.trim(),
        resumeFileName: resumeFile.name,
        resumeSizeBytes: resumeFile.size,
        resumeBase64,
      });

      setSubmittedConfirmation({
        role: res.jobTitle,
        fileName: res.resumeFileName,
        email: res.candidateEmail,
      });
      setApplyingJob(null);
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
      setCandidatePortfolio('');
      setCandidateNote('');
      setResumeFile(null);
      setResumeError(null);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen font-sans antialiased bg-white dark:bg-[#070D19]">
      <Navbar />

      {/* ─── 1. Hero Header ───────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden border-b border-slate-200/70 dark:border-slate-800">
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[460px] dark:opacity-35"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 87, 255, 0.14) 0%, rgba(56, 189, 248, 0.06) 45%, transparent 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <CompanySubnav />

          <div className="block">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-blue-50/90 dark:bg-[#0057FF]/15 text-[#0057FF] dark:text-sky-300 border-[#0057FF]/25">
              <Briefcase className="w-3.5 h-3.5" /> Careers · Hybrid &amp; Remote
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] max-w-4xl mx-auto">
            Do the defining work of your career building{' '}
            <span className="bg-gradient-to-r from-[#0057FF] to-[#2563EB] dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              India&apos;s AI B2B OS.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join Founder &amp; CEO Anjali Yadav and a focused team of engineers,
            designers, and growth builders transforming how 4,500+ businesses
            sell on WhatsApp &amp; GST.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#open-roles"
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#0057FF] to-[#2563EB] hover:from-[#0046D5] hover:to-[#1D4ED8] shadow-lg shadow-[#0057FF]/25 inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <span>
                Explore Open Roles{loadingJobs ? '' : ` (${jobs.length})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() =>
                openModalForRole({
                  title: 'General Talent Pool (PDF Resume)',
                  team: 'General',
                  meta: 'Hybrid / Remote · Full-Time',
                })
              }
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-slate-800 dark:text-white hover:border-[#0057FF] transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-[#0057FF] dark:text-sky-400" />
              <span>Upload PDF Resume</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. Why Join Us ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Why Join Leadsetu
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            High trust, steep learning curve, real ownership
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            We keep teams small and senior-minded so everyone has visibility
            from architecture to customer revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_JOIN.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-3xl p-7 bg-[#FAFCFF] dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. Life at Leadsetu ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-slate-50/75 dark:bg-[#091224] border-y border-slate-200/70 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-2">
                <Coffee className="w-3.5 h-3.5" /> Life at Leadsetu
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Inside our engineering &amp; product builder culture
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Built for deep technical focus, transparent feedback, collaborative
              sprint rooms, and weekly founder demos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LIFE_AT_LEADSETU.map(({ icon: Icon, tag, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-sky-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                      {tag}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Transparent 4-Step Hiring Process */}
          <div className="rounded-3xl p-7 sm:p-8 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
            <div className="mb-6">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400">
                Transparent Hiring Process
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                From PDF application to offer in under 10 days
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {HIRING_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
                >
                  <div className="text-xs font-black text-[#0057FF] dark:text-sky-400 tabular-nums">
                    STEP {s.step}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {s.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Live Dynamic Open Roles Directory ─────────────────────── */}
      <section id="open-roles" className="py-16 md:py-24 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0057FF] dark:text-sky-400 mb-1">
                <Briefcase className="w-3.5 h-3.5" /> Open Positions (
                {loadingJobs ? '...' : jobs.length})
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Explore current openings
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800">
              {TEAM_FILTERS.map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTeam === team
                      ? 'bg-[#0057FF] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {submittedConfirmation && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 px-5 py-4 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div>
                  Application &amp; PDF resume (
                  <strong>{submittedConfirmation.fileName}</strong>) submitted
                  for <strong>{submittedConfirmation.role}</strong>!
                </div>
                <div className="text-xs font-medium mt-0.5 opacity-90">
                  Confirmation will be sent to {submittedConfirmation.email}.
                  Our hiring team reviews every resume within 48 hours.
                </div>
              </div>
            </div>
          )}

          {jobsError && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-5 py-4 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
              <span>{jobsError}</span>
              <button
                type="button"
                onClick={loadJobs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {loadingJobs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3"
                >
                  <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-6 w-80 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              ))}
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="rounded-3xl p-10 text-center bg-slate-50/70 dark:bg-[#0D1628] border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {jobs.length === 0
                  ? 'No active role postings right now — send your PDF resume below to join our priority talent pool.'
                  : `No active openings currently listed under "${selectedTeam}".`}
              </p>
              {jobs.length > 0 && selectedTeam !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedTeam('All')}
                  className="px-4 py-2 rounded-xl bg-[#0057FF] text-white text-xs font-extrabold"
                >
                  View All Teams ({jobs.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className="rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 hover:border-[#0057FF]/45 shadow-sm transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-2.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          {job.featured && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              <Sparkles className="w-3 h-3" /> Priority Hiring
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#0057FF]/20 text-[#0057FF] dark:text-sky-300">
                            {job.team}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" /> {job.experience} ·{' '}
                            {job.employmentType}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {job.compensation}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          {job.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {job.summary}
                        </p>

                        {job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {job.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            openModalForRole({
                              id: job.id,
                              title: job.title,
                              team: job.team,
                              meta: `${job.location} · ${job.compensation}`,
                            })
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[#0057FF] hover:bg-[#0046D5] text-white text-xs font-extrabold shadow-md shadow-[#0057FF]/20 transition-all hover:-translate-y-0.5"
                        >
                          <span>Apply with PDF</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {job.responsibilities.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedJobId(isExpanded ? null : job.id)
                            }
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-[#0057FF] dark:text-slate-400 dark:hover:text-sky-400"
                          >
                            <span>
                              {isExpanded
                                ? 'Hide Details'
                                : 'View Responsibilities'}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && job.responsibilities.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          What You&apos;ll Own
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          {job.responsibilities.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Speculative / General Talent Card */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-[#091224] via-[#102145] to-[#0D182F] text-white border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                Don&apos;t see your exact role?
              </div>
              <h3 className="text-lg sm:text-xl font-black">
                Pitch us how you can accelerate Leadsetu
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Strong engineers, AI researchers, and GTM builders are always
                welcome. Drop your PDF resume directly to our talent pool.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openModalForRole({
                  title: 'General Talent Pool (PDF Resume)',
                  team: 'General',
                  meta: 'Hybrid / Remote · Full-Time',
                })
              }
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-slate-950 hover:bg-sky-50 text-xs font-extrabold shadow-lg transition-colors"
            >
              <Upload className="w-4 h-4 text-[#0057FF]" />
              <span>Send PDF Resume</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Application Modal with Live Backend Submission ───────────── */}
      {applyingJob && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setApplyingJob(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-6"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Apply: {applyingJob.title}
                </h3>
                <p className="text-[11px] text-slate-500">{applyingJob.meta}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4 text-xs">
              {submitError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Priya Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Notice Period
                  </label>
                  <select
                    value={candidateNotice}
                    onChange={(e) => setCandidateNotice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-[#0057FF]"
                  >
                    <option>Immediate / 15 Days</option>
                    <option>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days (Negotiable)</option>
                  </select>
                </div>
              </div>

              {/* PDF Resume Upload Dropzone */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Resume (PDF Only, Max 5 MB) *
                </label>

                {resumeFile ? (
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {resumeFile.name}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          PDF verified · {formatFileSize(resumeFile.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="Remove PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDropPdf}
                    className={`flex flex-col items-center justify-center gap-1.5 p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                      isDraggingFile
                        ? 'border-[#0057FF] bg-blue-50/70 dark:bg-[#0057FF]/10'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 hover:border-[#0057FF]'
                    }`}
                  >
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-[#0057FF]/10 text-[#0057FF] dark:text-sky-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      Click to upload PDF or drag &amp; drop
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Accepted format: <span className="font-semibold">.pdf</span>{' '}
                      (up to 5 MB)
                    </div>
                  </label>
                )}

                {resumeError && (
                  <p className="mt-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {resumeError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  LinkedIn / GitHub / Portfolio URL (Optional)
                </label>
                <input
                  type="url"
                  value={candidatePortfolio}
                  onChange={(e) => setCandidatePortfolio(e.target.value)}
                  placeholder="https://github.com/... or https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Highlight a project or win (Optional)
                </label>
                <textarea
                  rows={2}
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  placeholder="One production system, design launch, or revenue win you are proud of..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#0057FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D5] font-extrabold text-white shadow-md shadow-[#0057FF]/20 disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CTABanner />
      <Footer />
    </main>
  );
}

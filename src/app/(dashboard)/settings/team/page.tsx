'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  Copy,
  Check,
  Loader2,
  X,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  Hash,
  Target,
  IndianRupee,
  MessageSquare,
  Building2,
  MapPin,
  Mail,
  Phone,
  EyeOff,
  FileClock,
} from 'lucide-react';
import {
  fetchTeam,
  addTeamMember,
  updateTeamMember,
  setTeamMemberStatus,
  resetTeamMemberPassword,
  removeTeamMember,
} from '@/lib/team-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
  AssignableTeamRole,
  MemberCredentials,
  TeamAccountInfo,
  TeamMember,
  TeamRole,
  TeamStats,
  TeamViewer,
} from '@/types/contracts';

const ROLE_STYLE: Record<TeamRole, string> = {
  owner: 'bg-brand-navy text-white',
  admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  manager: 'bg-blue-50 text-brand-blue border border-blue-200',
  agent: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const ROLE_HELP: Record<AssignableTeamRole, string> = {
  admin: 'Full access incl. team management (owner only can grant)',
  manager: 'Manages pipeline, reports & assigned reps',
  agent: 'Works own leads, deals, tasks & inbox',
};

const INDIAN_MOBILE = /^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;

function formatINR(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={`Copy ${label || value}`}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded-md text-slate-400 hover:text-brand-blue hover:bg-brand-light transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function TeamSettingsPage() {
  const router = useRouter();
  const { user, tenant, updateProfile } = useAuthStore();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [account, setAccount] = useState<TeamAccountInfo | null>(null);
  const [viewer, setViewer] = useState<TeamViewer | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add member modal
  const [addOpen, setAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRole, setFRole] = useState<AssignableTeamRole>('agent');
  const [fTerritory, setFTerritory] = useState('');
  const [fTarget, setFTarget] = useState('');
  const [fPassword, setFPassword] = useState('');

  // Edit member modal
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [eRole, setERole] = useState<AssignableTeamRole>('agent');
  const [eTerritory, setETerritory] = useState('');
  const [eTarget, setETarget] = useState('');
  const [ePhone, setEPhone] = useState('');

  // Credentials modal (after add / reset)
  const [credentials, setCredentials] = useState<
    (MemberCredentials & { name: string; phone: string; isReset: boolean }) | null
  >(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadTeam = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchTeam({
        search: search.trim() || undefined,
        role: roleFilter,
        status: statusFilter,
      });
      setMembers(res.data || []);
      setAccount(res.account);
      setViewer(res.viewer);
      setStats(res.stats);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(loadTeam, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [loadTeam]);

  // Sync newly issued IDs into the persisted auth store (for accounts created before Module 10).
  useEffect(() => {
    if (!user || !viewer || !account) return;
    const me = members.find((m) => m.id === viewer.id);
    const needsUser = me?.userCode && user.userCode !== me.userCode;
    const needsTenant = tenant && account.accountId && tenant.accountId !== account.accountId;
    if (needsUser || needsTenant) {
      updateProfile({
        user: { ...user, userCode: me?.userCode || user.userCode },
        tenant: tenant ? { ...tenant, accountId: account.accountId } : tenant,
      });
    }
  }, [members, viewer, account, user, tenant, updateProfile]);

  const canManageRow = (m: TeamMember) =>
    !!viewer?.canManageTeam &&
    m.id !== viewer.id &&
    m.role !== 'owner' &&
    (m.role !== 'admin' || viewer.canManageAdmins);

  const resetAddForm = () => {
    setFName('');
    setFEmail('');
    setFPhone('');
    setFRole('agent');
    setFTerritory('');
    setFTarget('');
    setFPassword('');
    setFormError(null);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!INDIAN_MOBILE.test(fPhone.trim())) {
      setFormError('Enter a valid 10-digit Indian mobile number (e.g. 98765 43210).');
      return;
    }
    if (fPassword && fPassword.length < 8) {
      setFormError('Initial password must be at least 8 characters, or leave it blank to auto-generate.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await addTeamMember({
        name: fName.trim(),
        email: fEmail.trim(),
        phone: fPhone.trim(),
        role: fRole,
        territory: fTerritory.trim() || undefined,
        monthlyTarget: fTarget ? Number(fTarget) : undefined,
        password: fPassword || undefined,
      });
      setAddOpen(false);
      setCredentials({
        ...res.credentials,
        name: res.member.name,
        phone: res.member.phone,
        isReset: false,
      });
      resetAddForm();
      await loadTeam();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setERole(m.role === 'owner' ? 'admin' : m.role);
    setETerritory(m.territory);
    setETarget(m.monthlyTarget ? String(m.monthlyTarget) : '');
    setEPhone(m.phone);
    setFormError(null);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    if (ePhone && !INDIAN_MOBILE.test(ePhone.trim())) {
      setFormError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setIsSaving(true);
    try {
      const isSelf = editing.id === viewer?.id;
      await updateTeamMember(editing.id, {
        phone: ePhone.trim() || undefined,
        territory: eTerritory.trim(),
        ...(isSelf || editing.role === 'owner' ? {} : { role: eRole }),
        ...(viewer?.canManageTeam ? { monthlyTarget: Number(eTarget) || 0 } : {}),
      });
      setEditing(null);
      showToast(`${editing.name}'s profile updated.`);
      await loadTeam();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (m: TeamMember) => {
    if (m.isActive && !window.confirm(`Deactivate ${m.name}? They will not be able to sign in.`)) return;
    setBusyId(m.id);
    try {
      await setTeamMemberStatus(m.id, !m.isActive);
      showToast(`${m.name} ${m.isActive ? 'deactivated' : 'reactivated'}.`);
      await loadTeam();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleMemberMask = async (m: TeamMember) => {
    setBusyId(m.id);
    try {
      const nextMask = !m.maskPhones;
      await updateTeamMember(m.id, { maskPhones: nextMask });
      showToast(
        `Client phone masking ${nextMask ? 'enabled' : 'disabled'} for ${m.name}.`,
      );
      await loadTeam();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (m: TeamMember) => {
    if (!window.confirm(`Generate a new temporary password for ${m.name}? Their current password will stop working.`)) return;
    setBusyId(m.id);
    try {
      const res = await resetTeamMemberPassword(m.id);
      setCredentials({ ...res.credentials, name: m.name, phone: m.phone, isReset: true });
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (m: TeamMember) => {
    if (
      !window.confirm(
        `Remove ${m.name} (User ID ${m.userCode}) permanently?\n\nTheir leads, deals, tasks and contacts will be re-assigned to the workspace owner. Tip: "Deactivate" keeps their history instead.`,
      )
    )
      return;
    setBusyId(m.id);
    try {
      const res = await removeTeamMember(m.id);
      const moved = Object.values(res.reassigned || {}).reduce((s, n) => s + n, 0);
      showToast(
        `${m.name} removed.${moved ? ` ${moved} record(s) re-assigned to ${res.reassignedTo?.name || 'the owner'}.` : ''}`,
      );
      await loadTeam();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const credentialsText = credentials
    ? `Leadsetu CRM login for ${credentials.name}\n` +
      `Workspace Account ID: ${credentials.accountId}\n` +
      `Your User ID: ${credentials.userCode}\n` +
      `Login Email: ${credentials.loginEmail}\n` +
      (credentials.temporaryPassword ? `Temporary Password: ${credentials.temporaryPassword}\n` : '') +
      `Sign in: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\n` +
      `Please change your password after first sign-in.`
    : '';

  const assignableRoles: AssignableTeamRole[] = viewer?.canManageAdmins
    ? ['agent', 'manager', 'admin']
    : ['agent', 'manager'];

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Role-Based Access Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Team &amp; User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add sales reps by email &amp; phone. Every member gets a unique 10-digit User ID under your 5-digit Account ID.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <Link
            href="/settings/audit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-brand-navy hover:border-brand-blue transition-colors"
          >
            <FileClock className="w-4 h-4 text-brand-blue" /> Security &amp; Audit Logs
          </Link>
          {viewer?.canManageTeam && (
            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setAddOpen(true);
              }}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Add Team Member
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> {toastMsg}
          </span>
          <button type="button" onClick={() => setToastMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      )}

      {/* Account ID + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-brand-navy text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-brand-blue/20" />
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-200 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Workspace Account ID
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-4xl font-extrabold font-mono tracking-[0.25em]">
              {account?.accountId || '•••••'}
            </span>
            {account?.accountId && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(account.accountId);
                  showToast(`Account ID ${account.accountId} copied.`);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                title="Copy Account ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="mt-3 text-xs text-slate-300 space-y-0.5">
            <div className="font-bold text-white">{account?.name || tenant?.name}</div>
            <div className="capitalize">
              {account?.plan} plan · {account?.status} · {account?.city}
            </div>
            {viewer && (
              <div className="pt-2 text-blue-200">
                Your User ID:{' '}
                <span className="font-mono font-bold text-white">
                  {members.find((m) => m.id === viewer.id)?.userCode || user?.userCode || '—'}
                </span>{' '}
                · <span className="capitalize">{viewer.role}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Members</span>
              <Users className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-2xl font-extrabold text-brand-navy mt-2">{stats?.totalMembers ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-emerald-600">{stats?.activeMembers ?? 0}</span> active ·{' '}
              <span className="font-bold text-slate-500">{stats?.inactiveMembers ?? 0}</span> inactive
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Roles</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5 font-semibold">
              <div>Admins: {stats?.admins ?? 0}</div>
              <div>Managers: {stats?.managers ?? 0}</div>
              <div>Agents: {stats?.agents ?? 0}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Team Target</span>
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-brand-navy mt-2">{formatINR(stats?.totalMonthlyTarget || 0)}</div>
            <p className="text-xs text-slate-500 mt-1">Monthly, all reps</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Won Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-600 mt-2">{formatINR(stats?.totalWonRevenue || 0)}</div>
            <p className="text-xs text-slate-500 mt-1">Closed-won deals by owner</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, 10-digit User ID or territory..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-blue"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="agent">Agent</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && members.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
            <p className="text-xs font-semibold">Loading team members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No members match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-4">User ID</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Territory</th>
                  <th className="py-3.5 px-4">Target Progress</th>
                  <th className="py-3.5 px-4">Pipeline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {members.map((m) => {
                  const manageable = canManageRow(m);
                  const isSelf = m.id === viewer?.id;
                  const pct = m.performance.targetAchievedPct;
                  return (
                    <tr key={m.id} className={`hover:bg-slate-50/70 ${!m.isActive ? 'opacity-60' : ''}`}>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-light text-brand-blue font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                            {m.name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-brand-navy flex items-center gap-1.5">
                              {m.name}
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-light text-brand-blue">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {m.email}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {m.phone || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {m.userCode || '—'}
                          {m.userCode && <CopyButton value={m.userCode} label="User ID" />}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${ROLE_STYLE[m.role]}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {m.territory ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {m.territory}
                          </span>
                        ) : (
                          <span className="text-slate-300">Not set</span>
                        )}
                      </td>
                      <td className="py-4 px-4 min-w-[150px]">
                        {m.monthlyTarget > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span className="text-slate-600">{formatINR(m.performance.wonRevenue)}</span>
                              <span className={pct >= 100 ? 'text-emerald-600' : 'text-slate-400'}>{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-blue'}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400">of {formatINR(m.monthlyTarget)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">No target</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div>
                          <span className="font-bold text-brand-navy">{m.performance.leadsCount}</span> leads ·{' '}
                          <span className="font-bold text-rose-600">{m.performance.hotLeads}</span> hot
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatINR(m.performance.openPipeline)} open · {m.performance.wonDeals} won
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            m.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {m.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {busyId === m.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                          ) : (
                            <>
                              {(manageable || isSelf) && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(m)}
                                  title="Edit"
                                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-brand-blue hover:bg-brand-light"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {manageable && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMemberMask(m)}
                                    title={m.maskPhones ? 'Unmask client phones for this member' : 'Mask client phones for this member'}
                                    className={`p-2 rounded-lg border transition-colors ${
                                      m.maskPhones
                                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                                        : 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                    }`}
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResetPassword(m)}
                                    title="Reset password"
                                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(m)}
                                    title={m.isActive ? 'Deactivate' : 'Reactivate'}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                  >
                                    {m.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemove(m)}
                                    title="Remove"
                                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {!manageable && !isSelf && <span className="text-[11px] text-slate-300">—</span>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD MEMBER MODAL ─── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-brand-blue" />
                <div>
                  <h2 className="text-base font-extrabold">Add Team Member</h2>
                  <p className="text-[11px] text-slate-300">
                    Joins Account ID <span className="font-mono font-bold">{account?.accountId}</span> with a new 10-digit User ID
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setAddOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Rohit Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email * (login)</label>
                  <input
                    required
                    type="email"
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    placeholder="rohit@company.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {assignableRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFRole(r)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        fRole === r ? 'border-brand-blue bg-brand-light' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-extrabold capitalize text-brand-navy">{r}</div>
                      <div className="text-[10px] text-slate-500 leading-snug mt-0.5">{ROLE_HELP[r]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Territory</label>
                  <input
                    value={fTerritory}
                    onChange={(e) => setFTerritory(e.target.value)}
                    placeholder="Noida Sector 62"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={fTarget}
                    onChange={(e) => setFTarget(e.target.value)}
                    placeholder="500000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password (optional)</label>
                <input
                  type="text"
                  value={fPassword}
                  onChange={(e) => setFPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate a secure temporary password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-brand inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Member &amp; Generate User ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT MEMBER MODAL ─── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold">Edit {editing.name}</h2>
                <p className="text-[11px] text-slate-300 font-mono">User ID {editing.userCode}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{formError}</div>
              )}
              {editing.id !== viewer?.id && editing.role !== 'owner' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={eRole}
                    onChange={(e) => setERole(e.target.value as AssignableTeamRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold capitalize"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp</label>
                <input
                  type="tel"
                  value={ePhone}
                  onChange={(e) => setEPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Territory</label>
                <input
                  value={eTerritory}
                  onChange={(e) => setETerritory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              {viewer?.canManageTeam && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={eTarget}
                    onChange={(e) => setETarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-brand inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREDENTIALS MODAL (shown once) ─── */}
      {credentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Check className="w-5 h-5" />
                {credentials.isReset ? 'Password Reset' : `${credentials.name} Added`}
              </h2>
              <p className="text-[11px] text-emerald-100">Share these login details with the member.</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Workspace Account ID', value: credentials.accountId },
                { label: 'User ID', value: credentials.userCode },
                { label: 'Login Email', value: credentials.loginEmail },
                ...(credentials.temporaryPassword
                  ? [{ label: 'Temporary Password', value: credentials.temporaryPassword }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</div>
                    <div className="font-mono text-sm font-bold text-brand-navy">{row.value}</div>
                  </div>
                  <CopyButton value={row.value} label={row.label} />
                </div>
              ))}

              {credentials.temporaryPassword ? (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  This temporary password is shown <strong>only once</strong> and stored encrypted. If it is lost, use
                  “Reset password” to issue a new one.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">The member signs in with the password you set.</p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(credentialsText);
                    showToast('Login details copied.');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="w-4 h-4" /> Copy All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const digits = credentials.phone.replace(/\D/g, '');
                    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(credentialsText)}`, '_blank');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                >
                  <MessageSquare className="w-4 h-4" /> Send on WhatsApp
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCredentials(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Lock,
  Save,
  Loader2,
  Check,
  Globe,
  KeyRound,
} from 'lucide-react';
import { updatePlatformPoliciesApi } from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  GlobalKillSwitches,
  GlobalSecurityPolicies,
  PlanEntitlementSpec,
  PlatformConfigData,
  PlatformFeatureKey,
  PlatformFeatureSpec,
} from '@/types/contracts';

const KILL_SWITCH_META: Array<{
  key: keyof GlobalKillSwitches;
  label: string;
  desc: string;
}> = [
  {
    key: 'geminiAiEnabled',
    label: 'Gemini AI Scoring & Smart Replies',
    desc: 'Controls AI scoring & Hinglish drafting across all tenants',
  },
  {
    key: 'whatsappCloudEnabled',
    label: 'WhatsApp Cloud API Dispatch',
    desc: 'Master switch for outbound Meta template blasts & inbox sends',
  },
  {
    key: 'webhooksEnabled',
    label: 'Inbound Lead Webhooks (IndiaMART/Meta)',
    desc: 'Controls real-time external CRM webhook ingestion',
  },
  {
    key: 'bulkExportsEnabled',
    label: 'Platform Bulk CSV Exports',
    desc: 'Emergency DLP switch to pause CSV/GSTR downloads platform-wide',
  },
  {
    key: 'impersonationEnabled',
    label: 'Support Impersonation Authority',
    desc: 'Allows logged, time-boxed Super Admin workspace support sessions',
  },
];

export default function PoliciesMatrixSection({
  initialConfig,
  featureCatalog,
  onSaved,
}: {
  initialConfig: PlatformConfigData;
  featureCatalog: PlatformFeatureSpec[];
  onSaved: (next: PlatformConfigData) => void;
}) {
  const [config, setConfig] = useState<PlatformConfigData>(initialConfig);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toggleKillSwitch = (key: keyof GlobalKillSwitches) => {
    setConfig((prev) => ({
      ...prev,
      globalKillSwitches: {
        ...prev.globalKillSwitches,
        [key]: !prev.globalKillSwitches[key],
      },
    }));
  };

  const updateSecurity = <K extends keyof GlobalSecurityPolicies>(
    key: K,
    val: GlobalSecurityPolicies[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      securityPolicies: {
        ...prev.securityPolicies,
        [key]: val,
      },
    }));
  };

  const togglePlanFeature = (
    plan: 'starter' | 'growth' | 'enterprise',
    feat: PlatformFeatureKey
  ) => {
    setConfig((prev) => ({
      ...prev,
      planMatrix: {
        ...prev.planMatrix,
        [plan]: {
          ...prev.planMatrix[plan],
          features: {
            ...prev.planMatrix[plan].features,
            [feat]: !prev.planMatrix[plan].features[feat],
          },
        },
      },
    }));
  };

  const updatePlanField = (
    plan: 'starter' | 'growth' | 'enterprise',
    field: keyof Pick<
      PlanEntitlementSpec,
      'monthlyPrice' | 'seatLimit' | 'maxMonthlyAiCalls' | 'maxMonthlyWhatsapp'
    >,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      planMatrix: {
        ...prev.planMatrix,
        [plan]: {
          ...prev.planMatrix[plan],
          [field]: Math.max(0, value),
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await updatePlatformPoliciesApi({
        maintenanceMode: config.maintenanceMode,
        maintenanceBanner: config.maintenanceBanner,
        allowNewSignups: config.allowNewSignups,
        defaultTrialDays: config.defaultTrialDays,
        globalKillSwitches: config.globalKillSwitches,
        securityPolicies: config.securityPolicies,
        planMatrix: config.planMatrix,
        reason: reason.trim() || 'Platform policy matrix updated from HQ Console',
      });
      setConfig(res.config);
      onSaved(res.config);
      setReason('');
      setToast('Global policies, kill-switches & plan matrix enforced across Leadsetu Cloud.');
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* Emergency Global Kill-Switches */}
      <div className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Master Platform Kill-Switches
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant circuit breakers affecting all customer workspaces in real time.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            Immediate Effect
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {KILL_SWITCH_META.map((item) => {
            const active = config.globalKillSwitches[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleKillSwitch(item.key)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                  active
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/70'
                    : 'bg-rose-50/80 dark:bg-rose-950/35 border-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {item.desc}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {active ? 'ON' : 'KILLED'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Maintenance & Security Hardening Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Maintenance Mode &amp; Signup Gate
          </h3>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                Platform Maintenance Mode
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Blocks non-Super-Admin logins &amp; displays maintenance notice.
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.maintenanceMode}
              onChange={(e) =>
                setConfig((p) => ({ ...p, maintenanceMode: e.target.checked }))
              }
              className="w-4 h-4 accent-[#E42527]"
            />
          </label>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Maintenance Banner Message
            </label>
            <input
              type="text"
              value={config.maintenanceBanner}
              onChange={(e) =>
                setConfig((p) => ({ ...p, maintenanceBanner: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Public Signups
                </div>
                <div className="text-[10px] text-slate-500">Allow new trials</div>
              </div>
              <input
                type="checkbox"
                checked={config.allowNewSignups}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, allowNewSignups: e.target.checked }))
                }
                className="w-4 h-4 accent-[#0057FF]"
              />
            </label>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Default Trial Days
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={config.defaultTrialDays}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    defaultTrialDays: Number(e.target.value) || 14,
                  }))
                }
                className="w-full mt-1 bg-transparent font-extrabold text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0057FF]" />
            DPDP &amp; Global Security Hardening
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Min Password
              </label>
              <input
                type="number"
                min={6}
                max={32}
                value={config.securityPolicies.minPasswordLength}
                onChange={(e) =>
                  updateSecurity('minPasswordLength', Number(e.target.value) || 8)
                }
                className="w-full mt-1 bg-transparent font-extrabold text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Impersonate Max (m)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={config.securityPolicies.impersonationMaxMinutes}
                onChange={(e) =>
                  updateSecurity('impersonationMaxMinutes', Number(e.target.value) || 30)
                }
                className="w-full mt-1 bg-transparent font-extrabold text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                DPDP Log Days
              </label>
              <input
                type="number"
                min={30}
                max={3650}
                value={config.securityPolicies.dpdpRetentionDays}
                onChange={(e) =>
                  updateSecurity('dpdpRetentionDays', Number(e.target.value) || 365)
                }
                className="w-full mt-1 bg-transparent font-extrabold text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-[#0057FF]" />
                Auto-Lock Tenant on Suspicious Burst Activity
              </span>
              <input
                type="checkbox"
                checked={config.securityPolicies.lockTenantOnSuspiciousActivity}
                onChange={(e) =>
                  updateSecurity('lockTenantOnSuspiciousActivity', e.target.checked)
                }
                className="w-4 h-4 accent-[#0057FF]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Require Governance Audit Reason on Sensitive Edits
              </span>
              <input
                type="checkbox"
                checked={config.securityPolicies.requireReasonForGovernance}
                onChange={(e) =>
                  updateSecurity('requireReasonForGovernance', e.target.checked)
                }
                className="w-4 h-4 accent-[#0057FF]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Plan Entitlement & RBAC Feature Matrix */}
      <div className="rounded-2xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0057FF]" />
            Subscription Plan Entitlement &amp; Quota Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure the default features &amp; limits inherited by Starter, Growth, and Enterprise tenants.
          </p>
        </div>

        {/* Plan Quotas & Pricing Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['starter', 'growth', 'enterprise'] as const).map((planKey) => {
            const spec = config.planMatrix[planKey];
            return (
              <div
                key={planKey}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">
                    {spec.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0057FF] dark:text-sky-400">
                    {planKey}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Price (₹/mo)</label>
                    <input
                      type="number"
                      value={spec.monthlyPrice}
                      onChange={(e) =>
                        updatePlanField(planKey, 'monthlyPrice', Number(e.target.value))
                      }
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Max Seats</label>
                    <input
                      type="number"
                      value={spec.seatLimit}
                      onChange={(e) =>
                        updatePlanField(planKey, 'seatLimit', Number(e.target.value))
                      }
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">AI Calls/mo</label>
                    <input
                      type="number"
                      value={spec.maxMonthlyAiCalls}
                      onChange={(e) =>
                        updatePlanField(planKey, 'maxMonthlyAiCalls', Number(e.target.value))
                      }
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">WhatsApp/mo</label>
                    <input
                      type="number"
                      value={spec.maxMonthlyWhatsapp}
                      onChange={(e) =>
                        updatePlanField(planKey, 'maxMonthlyWhatsapp', Number(e.target.value))
                      }
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Entitlement Grid */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Module / Capability</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Starter</th>
                <th className="py-3 px-4 text-center">Growth</th>
                <th className="py-3 px-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {featureCatalog.map((feat) => (
                <tr key={feat.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{feat.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {feat.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {feat.category}
                    </span>
                  </td>
                  {(['starter', 'growth', 'enterprise'] as const).map((planKey) => {
                    const enabled = Boolean(config.planMatrix[planKey]?.features?.[feat.key]);
                    return (
                      <td key={planKey} className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => togglePlanFeature(planKey, feat.key)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                            enabled
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {enabled ? <Check className="w-4 h-4" /> : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save Bar with Optional Governance Reason */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Audit log note (e.g., Adjusted Growth plan AI quota for Q4)... "
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-600/25 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Enforce Global Policy Changes</span>
          </button>
        </div>
      </div>

      {config.updatedByEmail && (
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          Last policy update signed by: <strong className="text-slate-600 dark:text-slate-300">{config.updatedByEmail}</strong>
        </div>
      )}
    </div>
  );
}

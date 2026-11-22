'use client';

import { useEffect, useState, FormEvent } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Percent,
  Plus,
  Save,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  fetchCommissionPolicyApi,
  updateCommissionPolicyApi,
  type CommissionSlabItem,
  type TenantCommissionPolicy,
} from '@/lib/team-api';
import { getErrorMessage } from '@/lib/api-client';

interface CommissionSlabsCardProps {
  canEdit: boolean;
}

export function CommissionSlabsCard({ canEdit }: CommissionSlabsCardProps) {
  const [policy, setPolicy] = useState<TenantCommissionPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    fetchCommissionPolicyApi()
      .then((res) => {
        if (active) setPolicy(res);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateCommissionPolicyApi(policy);
      setPolicy(updated);
      setNotice({
        type: 'success',
        text: 'Workspace commission slabs & quota accelerator bonus saved.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const updateSlab = (
    index: number,
    patch: Partial<CommissionSlabItem>,
  ) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      slabs: policy.slabs.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  const addSlab = () => {
    if (!policy) return;
    const lastMax = policy.slabs[policy.slabs.length - 1]?.maxRevenueInr || 1500000;
    setPolicy({
      ...policy,
      slabs: [
        ...policy.slabs,
        {
          minRevenueInr: lastMax,
          maxRevenueInr: null,
          ratePct: 5,
          label: 'Custom Super Slab',
        },
      ],
    });
  };

  const removeSlab = (index: number) => {
    if (!policy || policy.slabs.length <= 1) return;
    setPolicy({
      ...policy,
      slabs: policy.slabs.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading workspace commission slab engine...</span>
      </div>
    );
  }

  if (!policy) return null;

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-brand-navy flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Sales Commission Slabs &amp; 100% Quota Bonus</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define progressive payout slabs visible live on every rep&apos;s Profile, Dashboard &amp; Analytics Leaderboard.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={policy.enabled}
            onChange={(e) => setPolicy({ ...policy, enabled: e.target.checked })}
            className="rounded border-slate-300"
          />
          <span>Enable Commission Engine</span>
        </label>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Eligible Revenue Basis
          </label>
          <select
            disabled={!canEdit}
            value={policy.basis}
            onChange={(e) =>
              setPolicy({
                ...policy,
                basis: e.target.value as TenantCommissionPolicy['basis'],
              })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-brand-navy font-semibold"
          >
            <option value="max_won_or_paid">Max of Won Deals or Paid GST Invoices</option>
            <option value="won_deals">Closed-Won Deals Only</option>
            <option value="paid_invoices">Collected / Paid GST Invoices Only</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>100% Quota Achiever Bonus Rate (%)</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="25"
            disabled={!canEdit}
            value={policy.quotaBonusPct}
            onChange={(e) =>
              setPolicy({ ...policy, quotaBonusPct: Number(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-brand-navy font-mono font-bold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Progressive Revenue Tiers
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={addSlab}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
            >
              <Plus className="w-3 h-3" /> Add Slab
            </button>
          )}
        </div>

        <div className="space-y-2">
          {policy.slabs.map((slab, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
            >
              <input
                type="text"
                disabled={!canEdit}
                value={slab.label}
                onChange={(e) => updateSlab(idx, { label: e.target.value })}
                placeholder="Slab Name"
                className="sm:col-span-4 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
              />
              <input
                type="number"
                min="0"
                disabled={!canEdit}
                value={slab.minRevenueInr}
                onChange={(e) =>
                  updateSlab(idx, { minRevenueInr: Number(e.target.value) || 0 })
                }
                placeholder="Min ₹"
                className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
              />
              <input
                type="number"
                min="0"
                disabled={!canEdit}
                value={slab.maxRevenueInr ?? ''}
                onChange={(e) =>
                  updateSlab(idx, {
                    maxRevenueInr: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Max ₹ (Blank = ∞)"
                className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
              />
              <div className="sm:col-span-2 flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  disabled={!canEdit}
                  value={slab.ratePct}
                  onChange={(e) =>
                    updateSlab(idx, { ratePct: Number(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-700"
                />
                <span className="font-bold text-slate-400">%</span>
                {canEdit && policy.slabs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlab(idx)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-extrabold disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Commission Slabs</span>
          </button>
        </div>
      )}
    </form>
  );
}

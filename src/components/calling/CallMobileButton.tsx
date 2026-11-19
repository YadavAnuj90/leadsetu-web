'use client';

import { useState } from 'react';
import { Phone, Smartphone } from 'lucide-react';
import { useCallUiStore } from '@/store/call-ui.store';

interface CallMobileButtonProps {
  phone?: string;
  contactName: string;
  company?: string;
  entityType: 'lead' | 'deal' | 'contact';
  entityId: string;
  entityLabel?: string;
  variant?: 'button' | 'icon';
  className?: string;
}

export function formatTelDialUri(rawPhone?: string): string {
  const trimmed = String(rawPhone || '').trim();
  if (!trimmed || trimmed.includes('*')) return '';
  if (trimmed.startsWith('+')) {
    const plusDigits = `+${trimmed.slice(1).replace(/\D/g, '')}`;
    return plusDigits.length > 4 ? `tel:${plusDigits}` : '';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `tel:+91${digits}`;
  }
  return `tel:${digits}`;
}

export default function CallMobileButton({
  phone,
  contactName,
  company,
  entityType,
  entityId,
  entityLabel,
  variant = 'button',
  className,
}: CallMobileButtonProps) {
  const startSimCall = useCallUiStore((s) => s.startSimCall);
  const [shieldHint, setShieldHint] = useState(false);

  const isMasked = Boolean(phone && phone.includes('*'));
  const telUri = formatTelDialUri(phone);

  if (!phone) return null;

  const handleDialSim = () => {
    if (isMasked || !telUri) {
      setShieldHint(true);
      setTimeout(() => setShieldHint(false), 2400);
      return;
    }

    startSimCall({
      contactName: contactName || 'Contact',
      contactPhone: phone,
      company: company || '',
      linkedEntityType: entityType,
      linkedEntityId: entityId,
      linkedEntityLabel:
        entityLabel || (company ? `${contactName} (${company})` : contactName),
    });

    // Launch OS / Phone Link / Mobile SIM dialer safely
    const anchor = document.createElement('a');
    anchor.href = telUri;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleDialSim}
        title={
          isMasked
            ? 'Mobile number masked by workspace shield'
            : `Call Mobile via SIM (${phone})`
        }
        className={
          className ||
          `p-2 rounded-lg transition-colors ${
            isMasked
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-50 text-brand-blue hover:bg-blue-100'
          }`
        }
      >
        <Phone className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleDialSim}
        title={
          isMasked
            ? 'Mobile number masked by workspace shield'
            : `Call ${phone} via Mobile SIM (tel:)`
        }
        className={
          className ||
          `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
            isMasked
              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'border-brand-blue/30 bg-blue-50 text-brand-blue hover:bg-brand-blue hover:text-white'
          }`
        }
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Call Mobile</span>
      </button>
      {shieldHint && (
        <span className="text-[10px] font-semibold text-amber-600 mt-1">
          Phone masked by workspace shield
        </span>
      )}
    </div>
  );
}

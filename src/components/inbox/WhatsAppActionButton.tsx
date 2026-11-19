'use client';

import { MessageSquare } from 'lucide-react';
import { useWhatsAppUiStore } from '@/store/whatsapp-ui.store';
import type { LinkedCrmEntityType } from '@/types/contracts';

interface WhatsAppActionButtonProps {
  phone?: string;
  contactName: string;
  company?: string;
  city?: string;
  estimatedValue?: number;
  entityType: LinkedCrmEntityType;
  entityId: string;
  entityLabel?: string;
  variant?: 'button' | 'icon';
  label?: string;
  className?: string;
}

export default function WhatsAppActionButton({
  phone,
  contactName,
  company,
  city,
  estimatedValue,
  entityType,
  entityId,
  entityLabel,
  variant = 'button',
  label = 'WhatsApp',
  className,
}: WhatsAppActionButtonProps) {
  const openQuickSend = useWhatsAppUiStore((s) => s.openQuickSend);

  const handleClick = () => {
    openQuickSend({
      phone,
      contactName,
      company,
      city,
      estimatedValue,
      entityType,
      entityId,
      entityLabel,
    });
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="WhatsApp Templates & Inbox"
        className={
          className ||
          'p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors'
        }
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm'
      }
    >
      <MessageSquare className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

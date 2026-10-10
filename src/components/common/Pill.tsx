import React from 'react';
import { StatusVariant, LeadLabel } from '../../types';

interface PillProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
  tooltip?: string;
}

export function StatusPill({
  children,
  variant = 'gray',
  dot = true,
  className = '',
  tooltip,
}: PillProps) {
  let styleClasses = '';
  let dotBg = '';

  switch (variant) {
    case 'green':
      styleClasses = 'bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]/60';
      dotBg = 'bg-[#027A48]';
      break;
    case 'amber':
      styleClasses = 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]/60';
      dotBg = 'bg-[#B54708]';
      break;
    case 'red':
      styleClasses = 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]/60';
      dotBg = 'bg-[#B42318]';
      break;
    case 'purple':
      styleClasses = 'bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE]/60';
      dotBg = 'bg-[#5925DC]';
      break;
    case 'blue':
      styleClasses = 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]/60';
      dotBg = 'bg-[#175CD3]';
      break;
    case 'unknown':
      styleClasses = 'pill-unknown border border-[#E5E7EB] text-[#344054]';
      dotBg = 'bg-[#667085]';
      break;
    case 'gray':
    default:
      styleClasses = 'bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]';
      dotBg = 'bg-[#475467]';
      break;
  }

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[12px] font-medium tracking-tight whitespace-nowrap tabular-nums select-none ${styleClasses} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotBg}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

interface LeadPillProps {
  label: LeadLabel;
  className?: string;
}

export function LeadPill({ label, className = '' }: LeadPillProps) {
  // Lead labels use outline pills (1px border, NO fill) so they never look like pipeline status
  let borderClass = 'border-[#D1D5DB] text-[#4B5563]';
  if (label === 'HOT') {
    borderClass = 'border-[#DC2626] text-[#DC2626] font-semibold';
  } else if (label === 'WARM' || label === 'WARM_REFERRAL') {
    borderClass = 'border-[#EA580C] text-[#EA580C] font-semibold';
  } else if (label === 'COOL') {
    borderClass = 'border-[#2563EB] text-[#2563EB] font-medium';
  } else if (label === 'NURTURE') {
    borderClass = 'border-[#7C3AED] text-[#7C3AED] font-medium';
  } else if (label === 'REJECTED') {
    borderClass = 'border-[#9CA3AF] text-[#9CA3AF] line-through font-normal';
  }

  return (
    <span
      className={`inline-flex items-center justify-center h-[20px] px-1.5 rounded-full text-[11px] uppercase tracking-wider border bg-transparent whitespace-nowrap select-none ${borderClass} ${className}`}
    >
      {label}
    </span>
  );
}

export function ActorAvatar({
  actor,
  size = 24,
  name,
}: {
  actor: 'irfan' | 'candra' | 'worker-pc' | 'angga' | 'system' | 'prospect';
  size?: number;
  name?: string;
}) {
  const getActorMeta = () => {
    switch (actor) {
      case 'irfan':
        return { bg: 'bg-[#111827]', text: 'text-white', label: 'I' };
      case 'candra':
        return { bg: 'bg-[#2563EB]', text: 'text-white', label: 'C' };
      case 'worker-pc':
        return { bg: 'bg-[#7A5AF8]', text: 'text-white', label: 'PC' };
      case 'angga':
        return { bg: 'bg-[#0E9384]', text: 'text-white', label: 'A' };
      case 'prospect':
        return { bg: 'bg-[#F79009]', text: 'text-white', label: 'P' };
      case 'system':
      default:
        return { bg: 'bg-[#9CA3AF]', text: 'text-white', label: 'SYS' };
    }
  };

  const meta = getActorMeta();

  return (
    <div
      title={name || actor}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 select-none ${meta.bg} ${meta.text} ${
        size <= 24 ? 'text-[10px]' : size <= 32 ? 'text-[12px]' : 'text-[14px]'
      }`}
    >
      {meta.label}
    </div>
  );
}

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: 'BAJO' | 'MEDIO' | 'ALTO' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showIcon = true }) => {
  const norm = level.toUpperCase();

  let bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let Icon = ShieldCheck;
  let text = 'RIESGO BAJO';

  if (norm === 'MEDIO') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
    text = 'RIESGO MEDIO';
  } else if (norm === 'ALTO') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = AlertOctagon;
    text = 'RIESGO ALTO';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium transition-all ${bg} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{text}</span>
    </span>
  );
};

import React from 'react';
import { ObjectStatus } from '../../types/energy';
import { getStatusColorClasses, getStatusLabel } from '../../utils/formatters';

interface StatusBadgeProps {
  status: ObjectStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  pulse = true,
}) => {
  const colors = getStatusColorClasses(status);
  const label = getStatusLabel(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium gap-1.5',
    md: 'px-2.5 py-1 text-xs font-semibold gap-2',
    lg: 'px-3.5 py-1.5 text-sm font-semibold gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} backdrop-blur-sm transition-all`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {pulse && status === 'outage' && (
            <span className={`absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75 animate-ping`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};

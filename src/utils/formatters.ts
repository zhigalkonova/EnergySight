import { EventSeverity, EventType, ObjectStatus } from '../types/energy';

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'только что';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} дн назад`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};

export const getStatusLabel = (status: ObjectStatus): string => {
  switch (status) {
    case 'normal':
      return 'В норме';
    case 'maintenance':
      return 'Плановые работы';
    case 'outage':
      return 'Авария / Отключение';
    default:
      return status;
  }
};

export const getStatusColorClasses = (status: ObjectStatus) => {
  switch (status) {
    case 'normal':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        badge: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300',
        hex: '#10B981',
      };
    case 'maintenance':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        dot: 'bg-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        badge: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
        hex: '#F59E0B',
      };
    case 'outage':
      return {
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
        dot: 'bg-rose-500',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse',
        badge: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
        hex: '#EF4444',
      };
  }
};

export const getEventTypeInfo = (type: EventType): { label: string; severity: EventSeverity; badgeClass: string } => {
  switch (type) {
    case 'accident':
      return {
        label: 'Аварийное отключение',
        severity: 'critical',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    case 'repair':
      return {
        label: 'Плановый ремонт / ТО',
        severity: 'warning',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    case 'restoration':
      return {
        label: 'Ввод в работу / Восстановление',
        severity: 'success',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    case 'inspection':
      return {
        label: 'Осмотр и диагностика',
        severity: 'info',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    case 'relay_protection':
      return {
        label: 'Сигнализация / РЗА',
        severity: 'warning',
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    default:
      return {
        label: type,
        severity: 'info',
        badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      };
  }
};

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, AlertOctagon } from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { formatRelativeTime } from '../../utils/formatters';

export const NotificationToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useEnergy();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        const getToastStyles = () => {
          switch (toast.type) {
            case 'critical':
              return {
                bg: 'bg-rose-950/90 border-rose-500/60 text-rose-100 shadow-[0_0_25px_rgba(239,68,68,0.35)]',
                icon: <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 animate-bounce" />,
              };
            case 'warning':
              return {
                bg: 'bg-amber-950/90 border-amber-500/60 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
                icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
              };
            case 'success':
              return {
                bg: 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
              };
            default:
              return {
                bg: 'bg-slate-900/90 border-cyan-500/50 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.25)]',
                icon: <Info className="h-5 w-5 text-cyan-400 shrink-0" />,
              };
          }
        };

        const styles = getToastStyles();

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${styles.bg}`}
          >
            {styles.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold tracking-wide">{toast.title}</h4>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {formatRelativeTime(toast.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

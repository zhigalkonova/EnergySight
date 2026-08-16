import React, { useState, useEffect } from 'react';
import {
  Zap,
  Radio,
  AlertTriangle,
  RotateCcw,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';

export const Header: React.FC = () => {
  const {
    stats,
    simulateEmergencyOutage,
    simulateRestoration,
    resetAllData,
  } = useEnergy();

  const [timeStr, setTimeStr] = useState('');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Live Kostanay Clock (UTC+5)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Qyzylorda', // Kostanay UTC+5
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const formatted = new Intl.DateTimeFormat('ru-RU', options).format(now);
      const dateFormatted = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Asia/Qyzylorda',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);
      setTimeStr(`${formatted} • ${dateFormatted}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasOutage = stats.outageCount > 0;

  return (
    <>
      <header className="h-16 border-b border-grid-border bg-grid-darker/90 backdrop-blur-xl px-6 flex items-center justify-between z-30 sticky top-0">
        {/* Left Side: System Status Ticker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  hasOutage ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  hasOutage ? 'bg-rose-500 shadow-[0_0_10px_#EF4444]' : 'bg-emerald-500 shadow-[0_0_10px_#10B981]'
                }`}
              />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                  {hasOutage ? 'ДИСПЕТЧЕРСКАЯ ТРЕВОГА' : 'ЭНЕРГОСИСТЕМА В НОРМЕ'}
                </span>
                {hasOutage ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse">
                    {stats.outageCount} АВАРИЯ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    100% ДОСТУПНОСТЬ
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                P_сум: <strong className="text-cyan-300 font-bold">{stats.totalLoadMW} МВт</strong> • f: <strong className="text-slate-200">50.01 Гц</strong>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Костанай (UTC+5):</span>
              <span className="text-slate-100 font-semibold">{timeStr}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Demo Action Buttons & DB settings */}
        <div className="flex items-center gap-2.5">
          {/* Quick Demo Controls */}
          <div className="flex items-center gap-2 bg-slate-900/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={simulateEmergencyOutage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all hover:scale-105 active:scale-95"
              title="Смоделировать аварийное отключение на одной из подстанций Костаная"
            >
              <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">Симуляция</span> Аварии
            </button>

            {hasOutage && (
              <button
                onClick={() => simulateRestoration()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all hover:scale-105 active:scale-95"
                title="Восстановить нормальную схему питания сети"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Ликвидировать</span> инцидент
              </button>
            )}

            <button
              onClick={resetAllData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Сбросить все данные к исходному демо-состоянию"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Supabase connection button */}
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
            title="Настройка подключения к Supabase"
          >
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">Supabase</span>
          </button>
        </div>
      </header>

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </>
  );
};

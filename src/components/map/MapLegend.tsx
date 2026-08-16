import React from 'react';
import { Layers, Zap, Eye, Check } from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { ObjectStatus } from '../../types/energy';

interface MapLegendProps {
  showLines: boolean;
  setShowLines: (v: boolean) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showLines,
  setShowLines,
  showLabels,
  setShowLabels,
}) => {
  const { statusFilter, setStatusFilter, stats } = useEnergy();

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-xs select-none">
      {/* Status Filter Card */}
      <div className="p-3.5 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Статусы энергообъектов
          </span>
          <span className="font-mono text-slate-300">г. Костанай</span>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span>Все объекты</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">{stats.totalObjects}</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'normal' ? 'all' : 'normal')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              statusFilter === 'normal'
                ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/40'
                : 'text-slate-400 hover:bg-emerald-950/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              <span>В норме</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-400">{stats.normalCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'maintenance' ? 'all' : 'maintenance')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              statusFilter === 'maintenance'
                ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-slate-400 hover:bg-amber-950/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
              <span>Плановые работы</span>
            </div>
            <span className="font-mono text-[11px] text-amber-400">{stats.maintenanceCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'outage' ? 'all' : 'outage')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              statusFilter === 'outage'
                ? 'bg-rose-950/80 text-rose-300 font-semibold border border-rose-500/40'
                : 'text-slate-400 hover:bg-rose-950/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_#EF4444]" />
              </span>
              <span>Аварии / Отключения</span>
            </div>
            <span className="font-mono text-[11px] text-rose-400 font-bold">{stats.outageCount}</span>
          </button>
        </div>

        {/* Toggles */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowLines(!showLines)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
              showLines
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>ЛЭП сети</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
              showLabels
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Подписи</span>
          </button>
        </div>
      </div>
    </div>
  );
};

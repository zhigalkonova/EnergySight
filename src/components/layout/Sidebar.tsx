import React from 'react';
import {
  Map,
  Layers,
  Zap,
  FileText,
  BarChart3,
  Activity,
  AlertOctagon,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { ActiveTab } from '../../types/energy';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, stats, selectedObject } = useEnergy();

  const navigationItems: {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'map',
      label: 'Карта сети',
      description: 'ГИС-схема подстанций и ЛЭП',
      icon: <Map className="h-5 w-5" />,
      badge: stats.outageCount > 0 ? stats.outageCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
    },
    {
      id: 'registry',
      label: 'Реестр объектов',
      description: 'Таблица оборудования сети',
      icon: <Layers className="h-5 w-5" />,
      badge: stats.totalObjects,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'detail',
      label: 'Карточка объекта',
      description: selectedObject ? selectedObject.code : 'Паспорт оборудования',
      icon: <Zap className="h-5 w-5" />,
      badge: selectedObject?.status === 'outage' ? 1 : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'events',
      label: 'Журнал событий',
      description: 'Лента оперативных записей',
      icon: <FileText className="h-5 w-5" />,
      badge: 18,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'dashboard',
      label: 'Дашборд',
      description: 'Аналитика и надежность сети',
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-grid-darker border-r border-grid-border flex flex-col justify-between shrink-0 select-none z-20 h-screen sticky top-0">
      {/* Brand Logo & Title */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-grid-border bg-grid-darkest/40">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] text-slate-950">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white font-mono">
                ENERGY<span className="text-cyan-400">SIGHT</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                SCADA
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Костанайская Энергосеть
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Диспетчерские экраны
          </div>
          {navigationItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                        : 'bg-slate-900/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium tracking-tight truncate flex items-center gap-1.5">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Network Overview Card in Sidebar Bottom */}
      <div className="p-3 border-t border-grid-border bg-grid-darkest/40">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              Подстанции:
            </span>
            <span className="font-mono font-bold text-slate-200">
              {stats.totalObjects} ед.
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-400">Норма: {stats.normalCount}</span>
              <span className="text-amber-400">Ремонт: {stats.maintenanceCount}</span>
              <span className="text-rose-400">Авария: {stats.outageCount}</span>
            </div>
            {/* Mini Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-800 flex overflow-hidden">
              <div
                style={{ width: `${(stats.normalCount / stats.totalObjects) * 100}%` }}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{ width: `${(stats.maintenanceCount / stats.totalObjects) * 100}%` }}
                className="bg-amber-500 h-full"
              />
              <div
                style={{ width: `${(stats.outageCount / stats.totalObjects) * 100}%` }}
                className="bg-rose-500 h-full animate-pulse"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Нагрузка сети:</span>
            <span className="text-cyan-300 font-bold">{stats.avgLoadPercentage}%</span>
          </div>
        </div>

        <div className="mt-2 text-center text-[10px] text-slate-300">
          EnergySight v1.0.0 • Костанай
        </div>
      </div>
    </aside>
  );
};

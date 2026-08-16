import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Clock,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useEnergy } from '../../context/EnergyContext';
import { StatusBadge } from '../registry/StatusBadge';

export const DashboardView: React.FC = () => {
  const { objects, events, stats, setSelectedObjectId, setActiveTab } = useEnergy();

  // 1. Incidents by Month (Recharts Bar/Area)
  const monthlyIncidentsData = useMemo(() => {
    return [
      { month: 'Март', accidents: 4, maintenance: 6, total: 10 },
      { month: 'Апрель', accidents: 3, maintenance: 8, total: 11 },
      { month: 'Май', accidents: 5, maintenance: 12, total: 17 },
      { month: 'Июнь', accidents: 2, maintenance: 9, total: 11 },
      { month: 'Июль', accidents: 6, maintenance: 14, total: 20 },
      { month: 'Август (тек.)', accidents: stats.outageCount + 3, maintenance: stats.maintenanceCount + 5, total: stats.outageCount + stats.maintenanceCount + 8 },
    ];
  }, [stats]);

  // 2. Top 5 Problematic Objects by Incident Count
  const topProblemObjects = useMemo(() => {
    const counts: Record<string, { count: number; name: string; type: string; id: string; lastOutage: string }> = {};

    // Initialize with objects
    objects.forEach(obj => {
      counts[obj.id] = {
        count: 0,
        name: obj.name,
        type: obj.type,
        id: obj.id,
        lastOutage: obj.lastMaintenanceDate,
      };
    });

    // Count events of type accident & repair
    events.forEach(evt => {
      if (counts[evt.objectId]) {
        if (evt.type === 'accident') {
          counts[evt.objectId].count += 2; // heavier weight for accidents
        } else if (evt.type === 'repair') {
          counts[evt.objectId].count += 1;
        }
      }
    });

    // Always give extra score if currently in outage
    objects.forEach(obj => {
      if (obj.status === 'outage' && counts[obj.id]) {
        counts[obj.id].count += 3;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [objects, events]);

  // 3. Status Distribution (Pie Chart)
  const statusPieData = useMemo(() => {
    return [
      { name: 'В норме', value: stats.normalCount, color: '#10B981' },
      { name: 'Плановые работы', value: stats.maintenanceCount, color: '#F59E0B' },
      { name: 'Аварии / Отключения', value: stats.outageCount, color: '#EF4444' },
    ];
  }, [stats]);

  // 4. Daily Network Load Profile (MW)
  const networkLoadProfile = useMemo(() => {
    const times = ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'];
    const totalMW = stats.totalLoadMW;
    return [
      { time: '02:00', loadMW: +(totalMW * 0.62).toFixed(1), capacityMW: stats.totalCapacityMVA },
      { time: '06:00', loadMW: +(totalMW * 0.74).toFixed(1), capacityMW: stats.totalCapacityMVA },
      { time: '10:00', loadMW: +(totalMW * 0.95).toFixed(1), capacityMW: stats.totalCapacityMVA },
      { time: '14:00', loadMW: +(totalMW * 0.88).toFixed(1), capacityMW: stats.totalCapacityMVA },
      { time: '18:00', loadMW: +(totalMW * 0.98).toFixed(1), capacityMW: stats.totalCapacityMVA },
      { time: '22:00', loadMW: +(totalMW * 0.82).toFixed(1), capacityMW: stats.totalCapacityMVA },
    ];
  }, [stats]);

  const handleOpenObject = (objectId: string) => {
    setSelectedObjectId(objectId);
    setActiveTab('detail');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="h-7 w-7 text-cyan-400" />
              Аналитический дашборд энергосистемы
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              SCADA Аналитика
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Комплексные метрики надежности, динамика технологических нарушений и баланс мощности
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span>Период: <strong>Последние 6 месяцев (2026)</strong></span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Objects */}
        <div className="p-5 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-xl space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Всего энергообъектов
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {stats.totalObjects}
            </span>
            <span className="text-xs text-slate-400 font-mono">узлов</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{stats.normalCount} в штатном режиме</span>
          </div>
        </div>

        {/* Card 2: Emergency incidents */}
        <div className="p-5 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-xl space-y-3 relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Аварии за месяц
            </span>
            <div className={`p-2.5 rounded-xl ${stats.outageCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${stats.outageCount > 0 ? 'text-rose-400' : 'text-white'}`}>
              {stats.outageCount + 3}
            </span>
            <span className="text-xs text-slate-400 font-mono">инцидентов</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-rose-400 font-mono">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>-28% по сравнению с июлем</span>
          </div>
        </div>

        {/* Card 3: Avg Response Time */}
        <div className="p-5 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Среднее время реагирования
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-300">
              {stats.avgResponseMinutes}
            </span>
            <span className="text-xs text-slate-400 font-mono">минут</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Норматив ОДС &lt; 35 мин</span>
          </div>
        </div>

        {/* Card 4: SAIDI / SAIFI Reliability */}
        <div className="p-5 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-xl space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Индекс надежности SAIDI
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-purple-300">
              {stats.saidiHours}
            </span>
            <span className="text-xs text-slate-400 font-mono">ч/год (SAIFI: {stats.saifiCount})</span>
          </div>
          <div className="text-xs text-cyan-400 font-medium">
            Высокий класс устойчивости сети
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incidents by Month Chart (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Динамика инцидентов и плановых работ по месяцам
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Соотношение аварийных отключений и планово-предупредительных ремонтов
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncidentsData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="accidents" name="Аварийные отключения" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenance" name="Плановые ремонты" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Percent className="h-4 w-4 text-cyan-400" />
              Текущий статус сети
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Распределение объектов по оперативным состояниям
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs font-mono border-t border-slate-800 pt-3">
            {statusPieData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <strong className="text-white">
                  {item.value} ({Math.round((item.value / stats.totalObjects) * 100)}%)
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top 5 Problematic Objects & Daily Grid Load Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Problematic Objects (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              Топ-5 проблемных узлов (по числу инцидентов)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Рейтинг дефектности</span>
          </div>

          <div className="space-y-2.5">
            {topProblemObjects.map((item, idx) => {
              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenObject(item.id)}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors block truncate text-xs">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 block truncate">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-400 block">
                        {item.count} наруш.
                      </span>
                      <span className="text-[10px] text-slate-500 block">Индекс риска</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24h Network Load Profile (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Суточный баланс мощности энергосистемы
            </h3>
            <span className="text-xs text-cyan-400 font-mono font-bold">
              Пик: {(stats.totalLoadMW * 1.05).toFixed(1)} МВт
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={networkLoadProfile} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="loadMW"
                  name="Фактическая нагрузка (МВт)"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06B6D4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

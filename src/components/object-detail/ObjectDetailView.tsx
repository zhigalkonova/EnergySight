import React, { useState, useMemo } from 'react';
import {
  Zap,
  Activity,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  PlusCircle,
  TrendingUp,
  Gauge,
  Thermometer,
  Radio,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useEnergy } from '../../context/EnergyContext';
import { StatusBadge } from '../registry/StatusBadge';
import { AddEventModal } from './AddEventModal';
import { formatDateTime, formatRelativeTime, getEventTypeInfo } from '../../utils/formatters';

export const ObjectDetailView: React.FC = () => {
  const {
    objects,
    selectedObjectId,
    setSelectedObjectId,
    selectedObject,
    events,
    setActiveTab,
  } = useEnergy();

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // If no object selected, default to the first one
  const currentObject = selectedObject || objects[0];

  // Events filtered specifically for this object
  const objectEvents = useMemo(() => {
    if (!currentObject) return [];
    return events.filter(e => e.objectId === currentObject.id);
  }, [events, currentObject]);

  // Generate 24h simulated load profile for this substation
  const hourlyLoadData = useMemo(() => {
    if (!currentObject) return [];
    const hours = [
      '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
      '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
    ];
    const baseMW = (currentObject.installedCapacityMVA || 10) * 0.5;
    return hours.map((hour, idx) => {
      let multiplier = 0.55;
      if (idx >= 4 && idx <= 6) multiplier = 0.82;
      if (idx >= 9 && idx <= 11) multiplier = 0.92;
      if (idx <= 2) multiplier = 0.38;

      const val = currentObject.status === 'outage' && idx >= 9 
        ? +(baseMW * 0.15).toFixed(1) 
        : +(baseMW * multiplier * (0.95 + Math.random() * 0.1)).toFixed(1);

      return {
        time: hour,
        powerMW: val,
        voltageKV: currentObject.voltageClassKV,
      };
    });
  }, [currentObject]);

  if (!currentObject) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Zap className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Список энергообъектов пуст</h2>
        <p className="text-sm text-slate-400">
          Все объекты были удалены. Перейдите на карту сети, чтобы добавить новые подстанции.
        </p>
        <button
          onClick={() => setActiveTab('map')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all inline-flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          <span>Перейти на карту сети</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Substation Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              currentObject.status === 'outage'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : currentObject.status === 'maintenance'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
            }`}
          >
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {currentObject.name}
              </h1>
              <StatusBadge status={currentObject.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>{currentObject.code}</span>
              <span>•</span>
              <span>{currentObject.district}</span>
              <span>•</span>
              <span>{currentObject.address}</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Substation Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Substation Switcher Dropdown */}
          <div className="relative">
            <select
              value={currentObject.id}
              onChange={e => setSelectedObjectId(e.target.value)}
              className="py-2.5 pl-3 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none appearance-none"
            >
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} ({obj.status === 'outage' ? '🔴 Авария' : obj.status === 'maintenance' ? '🟡 Ремонт' : '🟢 Норма'})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setActiveTab('map')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span>На карте</span>
          </button>

          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-sans"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Зафиксировать событие</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Column Technical Specs & Right Column Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technical Passport Card */}
        <div className="lg:col-span-1 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-grid-border pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Паспорт оборудования
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              {currentObject.voltageClassKV} кВ
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Тип объекта:</span>
              <span className="font-semibold text-slate-200">{currentObject.type}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Установленная мощность:</span>
              <span className="font-mono font-bold text-cyan-300">
                {currentObject.installedCapacityMVA} МВА
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Количество силовых трансф.:</span>
              <span className="font-mono font-semibold text-slate-200">
                {currentObject.transformersCount} ед.
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Количество фидеров:</span>
              <span className="font-mono font-semibold text-slate-200">
                {currentObject.feedersCount} линий
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Категория потребителей:</span>
              <span className="font-medium text-slate-200">{currentObject.consumerType}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Год ввода в эксплуатацию:</span>
              <span className="font-mono text-slate-200">{currentObject.installationYear} г.</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Дата последнего ТО:</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {currentObject.lastMaintenanceDate || '—'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Ответственный инженер:</span>
              <span className="font-semibold text-slate-200">{currentObject.chiefEngineer}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Телефон связи ОДС:</span>
              <span className="font-mono text-slate-300">{currentObject.phone}</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Meters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Telemetry Gauge Cards */}
          <div className="rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-grid-border pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Телеметрия в реальном времени (SCADA Онлайн)
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ОБНОВЛЯЕТСЯ</span>
              </div>
            </div>

            {/* 4 Sensor Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Активная мощн. P</span>
                <span className="text-lg font-black font-mono text-cyan-300">
                  {currentObject.telemetry?.activePowerMW || 0}
                </span>
                <span className="text-[10px] text-slate-500 block">МВт</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Напряжение U</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {currentObject.telemetry?.voltageKV || 0}
                </span>
                <span className="text-[10px] text-slate-500 block">кВ (фазное)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Температура масла</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  {currentObject.telemetry?.transformerTempC || 0}°C
                </span>
                <span className="text-[10px] text-slate-500 block">Т-1 (макс. 70°C)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Частота f</span>
                <span className="text-lg font-black font-mono text-purple-300">
                  {currentObject.telemetry?.frequencyHz || 50.00}
                </span>
                <span className="text-[10px] text-slate-500 block">Гц (50.00 ± 0.05)</span>
              </div>
            </div>

            {/* Load Capacity Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <span>Загрузка мощности подстанции:</span>
                <strong className="text-cyan-300">
                  {currentObject.telemetry?.activePowerMW || 0} МВт / {currentObject.installedCapacityMVA || 0} МВА ({currentObject.loadPercentage || 0}%)
                </strong>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${Math.min(100, currentObject.loadPercentage || 0)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    (currentObject.loadPercentage || 0) > 85
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_#EF4444]'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_#06B6D4]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Load Curve Chart */}
          <div className="rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Суточный график активной мощности (24 часа)
              </h3>
              <span className="text-xs font-mono text-slate-400">МВт / Время</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyLoadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
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
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="powerMW"
                    name="Мощность (МВт)"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#powerGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* History of Events for this Object */}
      <div className="rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-grid-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              История оперативных событий и переключений по объекту
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Всего записей: <strong className="text-white">{objectEvents.length}</strong>
          </span>
        </div>

        {objectEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            По данному энергообъекту нет зафиксированных инцидентов.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-grid-border text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Время</th>
                  <th className="py-2.5 px-3">Тип</th>
                  <th className="py-2.5 px-3">Заголовок и описание</th>
                  <th className="py-2.5 px-3">Диспетчер</th>
                  <th className="py-2.5 px-3">Смена статуса</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {objectEvents.map(evt => {
                  const typeInfo = getEventTypeInfo(evt.type);
                  return (
                    <tr key={evt.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {formatDateTime(evt.timestamp)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${typeInfo.badgeClass}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{evt.title}</div>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{evt.description}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                        {evt.dispatcherName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        {evt.newStatus ? (
                          <span className="text-cyan-400">→ {evt.newStatus}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        targetObject={currentObject}
      />
    </div>
  );
};

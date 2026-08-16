import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  PlusCircle,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { EventType, GridEvent } from '../../types/energy';
import { AddEventModal } from '../object-detail/AddEventModal';
import { exportEventsToCsv } from '../../utils/exportToCsv';
import { formatDateTime, formatRelativeTime, getEventTypeInfo } from '../../utils/formatters';

export const EventLogView: React.FC = () => {
  const {
    events,
    objects,
    setSelectedObjectId,
    setActiveTab,
  } = useEnergy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedObjectId, setSelectedObjFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Target object for new event modal
  const targetObject = objects[0];

  // Filtering
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.objectName.toLowerCase().includes(q) ||
          e.dispatcherName.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter(e => e.type === selectedType);
    }

    // Object filter
    if (selectedObjectId !== 'all') {
      result = result.filter(e => e.objectId === selectedObjectId);
    }

    // Date range filter
    if (timeRange !== 'all') {
      const now = new Date().getTime();
      result = result.filter(e => {
        const eventTime = new Date(e.timestamp).getTime();
        const diffHours = (now - eventTime) / (1000 * 3600);
        if (timeRange === 'today') return diffHours <= 24;
        if (timeRange === 'week') return diffHours <= 24 * 7;
        if (timeRange === 'month') return diffHours <= 24 * 30;
        return true;
      });
    }

    return result;
  }, [events, searchQuery, selectedType, selectedObjectId, timeRange]);

  const handleExportCsv = () => {
    exportEventsToCsv(filteredEvents, `energysight_journal_${new Date().toISOString().slice(0, 10)}.csv`);
  };

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
              <FileText className="h-7 w-7 text-cyan-400" />
              Журнал диспетчерских событий
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
              {filteredEvents.length} записей
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Хронологическая лента оперативных переключений, аварийных отключений и регламентных работ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            title="Выгрузить отфильтрованные события в формате Excel CSV"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Экспорт в CSV</span>
          </button>

          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all font-sans"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Добавить запись</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по тексту, диспетчеру, причине..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Все типы событий</option>
              <option value="accident">🔴 Аварийные отключения</option>
              <option value="repair">🟡 Плановые ремонты / ТО</option>
              <option value="restoration">🟢 Вводы в работу / Восстановления</option>
              <option value="inspection">🔵 Осмотры и диагностика</option>
              <option value="relay_protection">🟣 Срабатывания РЗА</option>
            </select>
          </div>

          {/* Object Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedObjectId}
              onChange={e => setSelectedObjFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">По всей энергосистеме</option>
              {objects.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="lg:col-span-2">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
            >
              <option value="all">За всё время</option>
              <option value="today">За 24 часа</option>
              <option value="week">За 7 дней</option>
              <option value="month">За 30 дней</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Chronological Feed */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-grid-darker/50 border border-grid-border text-slate-500">
            События по заданным критериям не найдены.
          </div>
        ) : (
          filteredEvents.map(evt => {
            const typeInfo = getEventTypeInfo(evt.type);

            return (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-lg group"
              >
                {/* Left Side: Icon & Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      evt.type === 'accident'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                        : evt.type === 'repair'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : evt.type === 'restoration'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    {evt.type === 'accident' ? (
                      <AlertOctagon className="h-5 w-5" />
                    ) : evt.type === 'repair' ? (
                      <Wrench className="h-5 w-5" />
                    ) : evt.type === 'restoration' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${typeInfo.badgeClass}`}
                      >
                        {typeInfo.label}
                      </span>
                      <button
                        onClick={() => handleOpenObject(evt.objectId)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
                      >
                        <span>{evt.objectName}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {evt.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Фиксация: <strong className="text-slate-200">{evt.dispatcherName}</strong></span>
                      {evt.newStatus && (
                        <span>
                          Статус: <strong className="text-cyan-300">→ {evt.newStatus}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Timestamp */}
                <div className="flex md:flex-col items-center md:items-end justify-between text-right font-mono text-xs text-slate-400 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatDateTime(evt.timestamp)}</span>
                  </div>
                  <span className="text-[11px] text-cyan-400 mt-1">
                    {formatRelativeTime(evt.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        targetObject={targetObject}
      />
    </div>
  );
};

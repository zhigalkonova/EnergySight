import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Zap,
  MapPin,
  Calendar,
  ChevronRight,
  PlusCircle,
  Activity,
  SlidersHorizontal,
  Download,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { EnergyObject, ObjectStatus } from '../../types/energy';
import { StatusBadge } from './StatusBadge';
import { AddEventModal } from '../object-detail/AddEventModal';
import { formatDate } from '../../utils/formatters';

type SortField = 'name' | 'type' | 'district' | 'status' | 'voltageClassKV' | 'loadPercentage' | 'lastMaintenanceDate';
type SortOrder = 'asc' | 'desc';

export const ObjectRegistry: React.FC = () => {
  const {
    objects,
    selectedObjectId,
    setSelectedObjectId,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    stats,
  } = useEnergy();

  const [sortField, setSortField] = useState<SortField>('loadPercentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [targetObjectForEvent, setTargetObjectForEvent] = useState<EnergyObject | null>(null);

  // Extract unique districts and types for dropdowns
  const districts = useMemo(() => {
    return Array.from(new Set(objects.map(o => o.district)));
  }, [objects]);

  const objectTypes = useMemo(() => {
    return Array.from(new Set(objects.map(o => o.type)));
  }, [objects]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedObjects = useMemo(() => {
    let result = [...objects];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        o =>
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q) ||
          o.chiefEngineer.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(o => o.type === typeFilter);
    }

    // District filter
    if (selectedDistrict !== 'all') {
      result = result.filter(o => o.district === selectedDistrict);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'lastMaintenanceDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [objects, searchQuery, statusFilter, typeFilter, selectedDistrict, sortField, sortOrder]);

  const handleRowClick = (objId: string) => {
    setSelectedObjectId(objId);
    setActiveTab('detail');
  };

  const handleOpenAddEvent = (obj: EnergyObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetObjectForEvent(obj);
    setIsAddEventModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Metric Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Layers className="h-7 w-7 text-cyan-400" />
              Реестр энергообъектов
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
              {filteredAndSortedObjects.length} из {objects.length}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Единая база данных подстанций, распределительных и трансформаторных пунктов г. Костанай
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">В норме:</span>
            <span className="text-emerald-400 font-bold">{stats.normalCount}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">В ремонте:</span>
            <span className="text-amber-400 font-bold">{stats.maintenanceCount}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Аварии:</span>
            <span className="text-rose-400 font-bold">{stats.outageCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию, коду, инженеру..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Все статусы ({objects.length})</option>
              <option value="normal">🟢 В норме ({stats.normalCount})</option>
              <option value="maintenance">🟡 Плановые работы ({stats.maintenanceCount})</option>
              <option value="outage">🔴 Аварии / Отключения ({stats.outageCount})</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Все типы оборудования</option>
              {objectTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Все районы</option>
              {districts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Objects Table */}
      <div className="rounded-2xl bg-grid-darker/90 backdrop-blur-xl border border-grid-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-grid-border bg-grid-panel/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-4 px-5 cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Объект / Код</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-cyan-400" /> : <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('type')}
                  className="py-4 px-4 cursor-pointer hover:text-cyan-300 transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Тип</span>
                    {sortField === 'type' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-cyan-400" /> : <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('district')}
                  className="py-4 px-4 cursor-pointer hover:text-cyan-300 transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Район расположения</span>
                    {sortField === 'district' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-cyan-400" /> : <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-4 px-4 cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Статус</span>
                    {sortField === 'status' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-cyan-400" /> : <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('loadPercentage')}
                  className="py-4 px-4 cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Загрузка / Мощность</span>
                    {sortField === 'loadPercentage' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-cyan-400" /> : <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('lastMaintenanceDate')}
                  className="py-4 px-4 cursor-pointer hover:text-cyan-300 transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Посл. ТО</span>
                    {sortField === 'lastMaintenanceDate' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-cyan-400" /> : <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                </th>

                <th className="py-4 px-5 text-right">Действия</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAndSortedObjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Объекты по заданным критериям фильтрации не найдены.
                  </td>
                </tr>
              ) : (
                filteredAndSortedObjects.map(obj => {
                  return (
                    <tr
                      key={obj.id}
                      onClick={() => handleRowClick(obj.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Name and Code */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              obj.status === 'outage'
                                ? 'bg-rose-500/20 text-rose-400'
                                : obj.status === 'maintenance'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-cyan-500/10 text-cyan-400'
                            }`}
                          >
                            <Zap className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors block">
                              {obj.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                              <span>{obj.code}</span>
                              <span>•</span>
                              <span>{obj.installedCapacityMVA} МВА</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="text-xs font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                          {obj.type}
                        </span>
                      </td>

                      {/* District */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          {obj.district}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={obj.status} size="sm" />
                      </td>

                      {/* Load % & Bar */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-cyan-300 font-bold">{obj.telemetry.activePowerMW} МВт</span>
                            <span className="text-slate-400">{obj.loadPercentage}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                            <div
                              style={{ width: `${obj.loadPercentage}%` }}
                              className={`h-full ${
                                obj.loadPercentage > 80
                                  ? 'bg-rose-500'
                                  : obj.loadPercentage > 65
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Last Maintenance */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {formatDate(obj.lastMaintenanceDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={e => handleOpenAddEvent(obj, e)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                            title="Зафиксировать событие"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRowClick(obj.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-400 transition-all"
                            title="Открыть паспорт объекта"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Event Modal */}
      {targetObjectForEvent && (
        <AddEventModal
          isOpen={isAddEventModalOpen}
          onClose={() => {
            setIsAddEventModalOpen(false);
            setTargetObjectForEvent(null);
          }}
          targetObject={targetObjectForEvent}
        />
      )}
    </div>
  );
};

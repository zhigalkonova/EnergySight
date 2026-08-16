import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Zap,
  Activity,
  AlertOctagon,
  ArrowUpRight,
  PlusCircle,
  Compass,
  Gauge,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  X,
  MapPin,
  Layers,
  Eye,
  Sun,
  Moon,
  Satellite,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { EnergyObject, PowerLine, LineStatus, ObjectStatus } from '../../types/energy';
import { StatusBadge } from '../registry/StatusBadge';
import { AddEventModal } from '../object-detail/AddEventModal';
import { AddSubstationModal } from './AddSubstationModal';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';

type TileStyle = 'light' | 'osm' | 'satellite' | 'dark';

// Center of Naurzum District
const MAP_CENTER: [number, number] = [51.5200, 64.7500];

// Recenter Map Helper
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [center, zoom, map]);
  return null;
};

// Create custom high-visibility SVG marker for objects
const createObjectIcon = (status: ObjectStatus, voltageKV: number, isSelected: boolean, isEndpoint?: boolean) => {
  let color = '#10B981'; // 🟢 норма
  let ringColor = 'rgba(16, 185, 129, 0.4)';
  let radarClass = 'scada-radar-normal';

  if (status === 'outage') {
    color = '#EF4444'; // 🔴 авария
    ringColor = 'rgba(239, 68, 68, 0.7)';
    radarClass = 'scada-radar-danger';
  } else if (status === 'maintenance') {
    color = '#F59E0B'; // 🟡 в ремонте
    ringColor = 'rgba(245, 158, 11, 0.6)';
    radarClass = 'scada-radar-warning';
  }

  const selectedPulse = isSelected
    ? `<div style="position: absolute; inset: -6px; border: 2.5px dashed #0284C7; border-radius: 9999px; animation: spin 8s linear infinite;"></div>`
    : '';

  const size = isEndpoint ? 30 : 40;
  const innerSize = isEndpoint ? 22 : 30;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div class="${radarClass}" style="position: absolute; width: ${size - 8}px; height: ${size - 8}px; border-radius: 9999px; background: ${ringColor}; pointer-events: none;"></div>
      ${selectedPulse}
      
      <div style="position: relative; z-index: 10; width: ${innerSize}px; height: ${innerSize}px; border-radius: 8px; background: #0F172A; border: 2px solid ${color}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        ${!isEndpoint ? `<span style="font-size: 7.5px; font-weight: 900; font-family: monospace; color: #FFFFFF; line-height: 1;">${voltageKV}</span>` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-substation-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export const NetworkMap: React.FC = () => {
  const {
    objects,
    powerLines,
    statusFilter,
    setStatusFilter,
    selectedObjectId,
    setSelectedObjectId,
    setActiveTab,
    events,
    stats,
  } = useEnergy();

  const [localLines, setLocalLines] = useState<PowerLine[]>(powerLines);
  const [showLines, setShowLines] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [tileStyle, setTileStyle] = useState<TileStyle>('light');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddSubstationModalOpen, setIsAddSubstationModalOpen] = useState(false);
  const [targetObjectForEvent, setTargetObjectForEvent] = useState<EnergyObject | null>(null);

  // Synchronize local lines with context lines
  useEffect(() => {
    setLocalLines(powerLines);
  }, [powerLines]);

  // Log data length as requested
  useEffect(() => {
    console.log('⚡ [EnergySight] Данные карты загружены:');
    console.log('⚡ objects.length =', objects.length, objects);
    console.log('⚡ lines.length =', localLines.length, localLines);
  }, [objects.length, localLines.length]);

  // Filter objects by status
  const filteredObjects = useMemo(() => {
    if (statusFilter !== 'all') {
      return objects.filter(o => o.status === statusFilter);
    }
    return objects;
  }, [objects, statusFilter]);

  const selectedObject = useMemo(() => {
    return objects.find(o => o.id === selectedObjectId);
  }, [objects, selectedObjectId]);

  const handleOpenAddEvent = (obj: EnergyObject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetObjectForEvent(obj);
    setIsAddEventModalOpen(true);
  };

  const handleNavigateToDetail = (objId: string) => {
    setSelectedObjectId(objId);
    setActiveTab('detail');
  };

  const getLatestEventForObject = (objectId: string) => {
    return events.find(e => e.objectId === objectId);
  };

  // Toggle line status: normal (зеленая) -> maintenance (желтая) -> outage (красная)
  const toggleLineStatus = (lineId: string, newStatus: LineStatus) => {
    setLocalLines(prev =>
      prev.map(line => (line.id === lineId ? { ...line, status: newStatus } : line))
    );
  };

  // Tile configuration
  const tileConfig = useMemo(() => {
    switch (tileStyle) {
      case 'light':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO Voyager</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        };
      case 'osm':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; <a href="https://www.esri.com/">Esri World Imagery</a>',
        };
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO Dark Matter</a>',
        };
    }
  }, [tileStyle]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-slate-900">
      {/* Top Floating Overlay: Controls & Legend */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-sm select-none">
        <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-3 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="h-4 w-4 text-cyan-400" />
                ТОО "Межрегионэнерготранзит"
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Наурзумские электрические сети</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
              {objects.length} узлов • {localLines.length} ЛЭП
            </span>
          </div>

          {/* Line Status Legend (Цветовая индикация состояния линий) */}
          <div className="space-y-1.5 text-[11px] font-mono border-b border-slate-700/80 pb-2.5 text-slate-300">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
              Состояние линий ЛЭП на карте:
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-center gap-1.5 p-1 rounded bg-slate-950 border border-emerald-500/30">
                <span className="h-2 w-3 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                <span className="text-[10px] text-emerald-300 font-bold">Целая</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded bg-slate-950 border border-amber-500/30">
                <span className="h-2 w-3 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
                <span className="text-[10px] text-amber-300 font-bold">Ремонт</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded bg-slate-950 border border-rose-500/30">
                <span className="h-2 w-3 rounded-full bg-rose-500 shadow-[0_0_6px_#EF4444]" />
                <span className="text-[10px] text-rose-300 font-bold">Авария</span>
              </div>
            </div>
          </div>

          {/* Map Base Layer Switcher */}
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Режим подложки карты:</span>
              <span className="text-cyan-400 font-semibold">
                {tileStyle === 'light' ? 'Светлая' : tileStyle === 'osm' ? 'OSM' : tileStyle === 'satellite' ? 'Спутник' : 'Темная'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setTileStyle('light')}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'light' ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="h-3 w-3" />
                <span>Светлая</span>
              </button>
              <button
                onClick={() => setTileStyle('osm')}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'osm' ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>OSM</span>
              </button>
              <button
                onClick={() => setTileStyle('satellite')}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'satellite' ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Satellite className="h-3 w-3" />
                <span>Спутник</span>
              </button>
              <button
                onClick={() => setTileStyle('dark')}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'dark' ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="h-3 w-3" />
                <span>Темная</span>
              </button>
            </div>
          </div>

          {/* Quick Filter by Object Status */}
          <div className="flex items-center justify-between gap-1.5 border-t border-slate-700/80 pt-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold border transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Все ({objects.length})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'normal' ? 'all' : 'normal')}
              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold border transition-colors ${
                statusFilter === 'normal' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Норма ({stats.normalCount})
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'outage' ? 'all' : 'outage')}
              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold border transition-colors ${
                statusFilter === 'outage' ? 'bg-rose-950 text-rose-300 border-rose-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Авария ({stats.outageCount})
            </button>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/80">
            <button
              onClick={() => setShowLines(!showLines)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                showLines ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>ЛЭП ({localLines.length})</span>
            </button>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                showLabels ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Подписи</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recenter Map Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => {
            const map = (window as any)._leaflet_map;
            if (map) map.setView(MAP_CENTER, 9);
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 shadow-xl transition-all flex items-center gap-2 text-xs font-bold"
          title="Сфокусировать на Наурзумском районе"
        >
          <Compass className="h-4 w-4 text-cyan-400" />
          <span>Наурзумский р-н</span>
        </button>
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        center={MAP_CENTER}
        zoom={9}
        zoomControl={false}
        className="w-full h-full"
      >
        <MapController center={MAP_CENTER} zoom={9} />

        {/* Selected Tile Layer */}
        <TileLayer
          key={tileStyle}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={19}
        />

        {/* Transmission Power Lines (ЛЭП): Цвет строго по состоянию (Зеленая - целая, Желтая - ремонт, Красная - авария) */}
        {showLines &&
          localLines.map(line => {
            const fromObj = objects.find(o => o.id === line.fromObjectId);
            const toObj = objects.find(o => o.id === line.toObjectId);

            if (!fromObj || !toObj) return null;

            // Resolve coordinates: use path if defined, else straight [from, to]
            let linePositions: [number, number][] = [];
            if (line.path && line.path.length > 0) {
              linePositions = line.path;
            } else if (line.coordinates && line.coordinates.length > 0) {
              linePositions = line.coordinates;
            } else {
              linePositions = [fromObj.coordinates, toObj.coordinates];
            }

            // ЦВЕТ КАЖДОЙ ЛИНИИ СТРОГО ПО ТРЕБОВАНИЮ:
            // 🟢 Зеленая (целая)
            // 🟡 Желтая (в ремонте)
            // 🔴 Красная (авария)
            let lineColor = '#10B981'; // 🟢 зеленая (целая / normal)
            let dashArray: string | undefined = undefined;

            if (line.status === 'outage') {
              lineColor = '#EF4444'; // 🔴 красная (авария)
              dashArray = '6, 8';
            } else if (line.status === 'maintenance') {
              lineColor = '#F59E0B'; // 🟡 желтая (в ремонте)
            } else {
              lineColor = '#10B981'; // 🟢 зеленая (целая)
            }

            // Толщина в зависимости от класса напряжения
            const weight = line.voltageKV >= 110 ? 4.5 : line.voltageKV >= 35 ? 3.5 : 2.5;

            // Voltage Badge color
            const voltageBadgeBg =
              line.voltageKV >= 110 ? 'bg-blue-600' : line.voltageKV >= 35 ? 'bg-purple-600' : 'bg-amber-600';

            return (
              <Polyline
                key={`line-${line.id}`}
                positions={linePositions}
                pathOptions={{
                  color: lineColor,
                  weight: weight,
                  opacity: 0.92,
                  dashArray: dashArray,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                {/* Tooltip с отображением класса напряжения 110, 35, 10 и статуса */}
                <Tooltip sticky className="dark-map-tooltip">
                  <div className="p-2.5 text-xs font-mono bg-slate-950 text-white rounded-xl border border-slate-700 shadow-2xl space-y-1.5 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                      <strong className="text-white text-[12px] font-bold">
                        {line.name}
                      </strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white font-mono ${voltageBadgeBg}`}>
                        {line.voltageKV} кВ
                      </span>
                    </div>

                    <div className="text-slate-300 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Марка провода:</span>
                        <strong className="text-cyan-300">{line.wireType || 'АС'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Протяжённость:</span>
                        <strong className="text-white">{line.lengthKm || '—'} км</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Поток мощности:</span>
                        <strong className="text-emerald-400">{line.powerFlowMW} МВт</strong>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Состояние:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            line.status === 'normal'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : line.status === 'maintenance'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              line.status === 'normal'
                                ? 'bg-emerald-400'
                                : line.status === 'maintenance'
                                ? 'bg-amber-400'
                                : 'bg-rose-400 animate-pulse'
                            }`}
                          />
                          {line.status === 'normal'
                            ? 'Целая (Норма)'
                            : line.status === 'maintenance'
                            ? 'В ремонте'
                            : 'Авария'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Tooltip>

                {/* Popup for Line Inspection & Status Switch */}
                <Popup className="custom-scada-popup">
                  <div className="p-3 space-y-2.5 bg-slate-900 text-white rounded-xl text-xs font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold block uppercase">
                          ЛЭП {line.voltageKV} кВ
                        </span>
                        <h4 className="text-sm font-bold text-white">{line.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${voltageBadgeBg}`}>
                        {line.voltageKV} кВ
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-300 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Провод:</span>
                        <strong className="text-white">{line.wireType || 'АС'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Длина:</span>
                        <strong className="text-white">{line.lengthKm || '—'} км</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Габариты:</span>
                        <strong className="text-white">{line.voltageClass || `${line.voltageKV} кВ`}</strong>
                      </div>
                    </div>

                    {/* Operational Status Switcher */}
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">
                        Оперативное состояние линии:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => toggleLineStatus(line.id, 'normal')}
                          className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all ${
                            line.status === 'normal'
                              ? 'bg-emerald-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟢 Целая
                        </button>
                        <button
                          onClick={() => toggleLineStatus(line.id, 'maintenance')}
                          className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all ${
                            line.status === 'maintenance'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟡 Ремонт
                        </button>
                        <button
                          onClick={() => toggleLineStatus(line.id, 'outage')}
                          className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all ${
                            line.status === 'outage'
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🔴 Авария
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* Substation Markers */}
        {filteredObjects.map(obj => {
          const isSelected = obj.id === selectedObjectId;
          const isEndpoint = obj.type === 'тупиковая точка';
          const latestEvent = getLatestEventForObject(obj.id);

          return (
            <Marker
              key={`obj-${obj.id}`}
              position={obj.coordinates}
              icon={createObjectIcon(obj.status, obj.voltageClassKV, isSelected, isEndpoint)}
              eventHandlers={{
                click: () => {
                  setSelectedObjectId(obj.id);
                },
              }}
            >
              {/* Marker Label */}
              {showLabels && (
                <Tooltip
                  direction="bottom"
                  offset={[0, 14]}
                  opacity={0.95}
                  permanent
                  className="bg-transparent border-0 shadow-none !p-0"
                >
                  <div className="px-2 py-0.5 rounded-md bg-slate-950/90 text-white border border-slate-700 text-[10.5px] font-bold font-mono tracking-tight whitespace-nowrap shadow-lg">
                    {obj.name}
                  </div>
                </Tooltip>
              )}

              {/* Marker Click Popup */}
              <Popup className="custom-scada-popup" minWidth={280} maxWidth={320}>
                <div className="p-4 space-y-3 bg-slate-900 text-white rounded-xl">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase">
                        {obj.code} • {obj.district}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight mt-0.5">
                        {obj.name}
                      </h4>
                    </div>
                    <StatusBadge status={obj.status} size="sm" />
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Мощность:</span>
                      <strong className="text-cyan-300">{obj.telemetry.activePowerMW} МВт</strong>
                      <span className="text-[10px] text-slate-500 block">из {obj.installedCapacityMVA} МВА</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Напряжение U:</span>
                      <strong className="text-emerald-400">{obj.telemetry.voltageKV} кВ</strong>
                      <span className="text-[10px] text-slate-500 block">f = {obj.telemetry.frequencyHz} Гц</span>
                    </div>
                  </div>

                  {/* Latest Event Note */}
                  {latestEvent && (
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-300">Последнее событие:</span>
                        <span>{formatRelativeTime(latestEvent.timestamp)}</span>
                      </div>
                      <p className="text-slate-300 line-clamp-1 italic">{latestEvent.title}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenAddEvent(obj)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>Событие</span>
                    </button>

                    <button
                      onClick={() => handleNavigateToDetail(obj.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all"
                    >
                      <span>Паспорт</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Slide-out Quick Details Drawer (Right Side) */}
      {selectedObject && (
        <div className="absolute top-4 right-4 bottom-4 z-[1000] w-80 lg:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden animate-fade-in text-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {selectedObject.code}
                </span>
                <StatusBadge status={selectedObject.status} size="sm" />
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {selectedObject.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedObject.district} • {selectedObject.address}</p>
            </div>
            <button
              onClick={() => setSelectedObjectId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Live Telemetry Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                  Телеметрия в реальном времени
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Активная мощность P:</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {selectedObject.telemetry?.activePowerMW || 0} МВт
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Реактивная мощн. Q:</span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedObject.telemetry?.reactivePowerMvar || 0} МВар
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Напряжение U:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {selectedObject.telemetry?.voltageKV || 0} кВ
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Частота сети:</span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedObject.telemetry?.frequencyHz || 50.00} Гц
                  </span>
                </div>
              </div>

              {/* Load Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Загрузка трансформаторов:</span>
                  <strong className="text-slate-200">{selectedObject.loadPercentage || 0}%</strong>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    style={{ width: `${selectedObject.loadPercentage || 0}%` }}
                    className={`h-full transition-all duration-500 ${
                      (selectedObject.loadPercentage || 0) > 85
                        ? 'bg-rose-500'
                        : (selectedObject.loadPercentage || 0) > 70
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Equipment Passport Snapshot */}
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Класс напряжения:</span>
                <span className="font-mono font-semibold text-white">{selectedObject.voltageClassKV} кВ</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Установл. мощность:</span>
                <span className="font-mono font-semibold text-cyan-300">{selectedObject.installedCapacityMVA} МВА</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Кол-во трансформаторов:</span>
                <span className="font-mono font-semibold text-white">{selectedObject.transformersCount} шт</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Год ввода в экспл.:</span>
                <span className="font-mono text-white">{selectedObject.installationYear} г.</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800 text-[11px]">
                <span className="text-slate-400">Посл. обслуживание:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {selectedObject.lastMaintenanceDate || '—'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 text-[11px]">
                <span className="text-slate-400">Ответственный инженер:</span>
                <span className="font-medium text-white">{selectedObject.chiefEngineer}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2.5">
            <button
              onClick={() => handleOpenAddEvent(selectedObject)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              <span>Зафиксировать</span>
            </button>

            <button
              onClick={() => handleNavigateToDetail(selectedObject.id)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all font-sans"
            >
              <span>Вся карточка</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Substation Modal */}
      <AddSubstationModal
        isOpen={isAddSubstationModalOpen}
        onClose={() => setIsAddSubstationModalOpen(false)}
      />

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

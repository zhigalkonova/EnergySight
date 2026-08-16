import React, { useState, useMemo } from 'react';
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
  Trash2,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { EnergyObject, ObjectStatus, PowerLine } from '../../types/energy';
import { StatusBadge } from '../registry/StatusBadge';
import { AddEventModal } from '../object-detail/AddEventModal';
import { AddSubstationModal } from './AddSubstationModal';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';

// Geographic Centers
const REGIONAL_CENTER: [number, number] = [52.6000, 63.8000]; // Full Kostanay Region
const NAURZUM_CENTER: [number, number] = [51.5200, 64.7500];  // Naurzum district
const KOSTANAY_CENTER: [number, number] = [53.2198, 63.6354]; // Kostanay city

type TileStyle = 'light' | 'osm' | 'satellite' | 'dark';

// Recenter Map Helper
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [center, zoom, map]);
  return null;
};

// Create high-contrast SVG DivIcon for light/satellite/dark maps
const createSubstationIcon = (status: ObjectStatus, voltageKV: number, isSelected: boolean) => {
  let statusColor = '#10B981'; // normal
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let radarClass = 'scada-radar-normal';

  if (status === 'outage') {
    statusColor = '#EF4444';
    glowColor = 'rgba(239, 68, 68, 0.7)';
    radarClass = 'scada-radar-danger';
  } else if (status === 'maintenance') {
    statusColor = '#F59E0B';
    glowColor = 'rgba(245, 158, 11, 0.6)';
    radarClass = 'scada-radar-warning';
  }

  const voltageColor = voltageKV >= 220 ? '#2563EB' : voltageKV >= 110 ? '#059669' : voltageKV >= 35 ? '#DC2626' : '#D97706';

  const selectedRing = isSelected
    ? `<div style="position: absolute; inset: -7px; border: 3px dashed #0284C7; border-radius: 9999px; animation: spin 8s linear infinite;"></div>`
    : '';

  const html = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <!-- Radar pulse -->
      <div class="${radarClass}" style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: ${glowColor}; pointer-events: none;"></div>
      ${selectedRing}
      
      <!-- Substation Node Container -->
      <div style="position: relative; z-index: 10; width: 34px; height: 34px; border-radius: 10px; background: #0F172A; border: 2.5px solid ${statusColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${voltageColor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span style="font-size: 8.5px; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: #FFFFFF; line-height: 1; margin-top: 1px;">
          ${voltageKV}
        </span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-substation-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
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
    clearAllObjects,
  } = useEnergy();

  const [showLines, setShowLines] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [tileStyle, setTileStyle] = useState<TileStyle>('light');
  const [activeDistrictView, setActiveDistrictView] = useState<string>('all');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddSubstationModalOpen, setIsAddSubstationModalOpen] = useState(false);
  const [targetObjectForEvent, setTargetObjectForEvent] = useState<EnergyObject | null>(null);
  
  // Default centered on whole Kostanay region
  const [mapCenter, setMapCenter] = useState<[number, number]>(REGIONAL_CENTER);
  const [mapZoom, setMapZoom] = useState(7);

  // Filter objects by status and selected district
  const filteredObjects = useMemo(() => {
    let list = objects;
    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }
    if (activeDistrictView !== 'all') {
      list = list.filter(o => o.district.toLowerCase().includes(activeDistrictView.toLowerCase()));
    }
    return list;
  }, [objects, statusFilter, activeDistrictView]);

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

  const handleDistrictChange = (districtKey: string) => {
    setActiveDistrictView(districtKey);
    switch (districtKey) {
      case 'наурзум':
        setMapCenter(NAURZUM_CENTER);
        setMapZoom(9);
        break;
      case 'костанай':
        setMapCenter(KOSTANAY_CENTER);
        setMapZoom(12);
        break;
      default:
        setMapCenter(REGIONAL_CENTER);
        setMapZoom(7);
        break;
    }
  };

  // Get tile URL and attribution based on tile style
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
        <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-3.5 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="h-4 w-4 text-cyan-400" />
                ТОО "Межрегионэнерготранзит"
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Карта электрических сетей (Костанай)</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
              {objects.length} ПС • {powerLines.length} ЛЭП
            </span>
          </div>

          {/* Action Buttons: Add Substation & Clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddSubstationModalOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all font-sans"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Добавить объект</span>
            </button>

            {objects.length > 0 && (
              <button
                onClick={clearAllObjects}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-medium transition-all"
                title="Стереть все объекты с карты"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Map Base Layer Switcher (Light / Satellite / Dark) */}
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
              <span>Режим подложки карты:</span>
              <span className="text-cyan-400 font-semibold">{tileStyle === 'light' ? 'Светлая (Voyager)' : tileStyle === 'osm' ? 'Стандарт OSM' : tileStyle === 'satellite' ? 'Спутник' : 'Темная SCADA'}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setTileStyle('light')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'light'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Светлая детальная карта с названиями всех поселков"
              >
                <Sun className="h-3 w-3" />
                <span>Светлая</span>
              </button>

              <button
                onClick={() => setTileStyle('osm')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'osm'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Карта OpenStreetMap"
              >
                <Layers className="h-3 w-3" />
                <span>OSM</span>
              </button>

              <button
                onClick={() => setTileStyle('satellite')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'satellite'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Спутниковая съемка местности"
              >
                <Satellite className="h-3 w-3" />
                <span>Спутник</span>
              </button>

              <button
                onClick={() => setTileStyle('dark')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  tileStyle === 'dark'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Темная тема диспетчера"
              >
                <Moon className="h-3 w-3" />
                <span>Темная</span>
              </button>
            </div>
          </div>

          {/* Quick Focus District Buttons */}
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
              Быстрый переход:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleDistrictChange('all')}
                className={`py-1 px-2 rounded-lg text-[10px] font-bold transition-all truncate border ${
                  activeDistrictView === 'all'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Вся область
              </button>

              <button
                onClick={() => handleDistrictChange('наурзум')}
                className={`py-1 px-2 rounded-lg text-[10px] font-bold transition-all truncate border ${
                  activeDistrictView === 'наурзум'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Наурзумский
              </button>

              <button
                onClick={() => handleDistrictChange('костанай')}
                className={`py-1 px-2 rounded-lg text-[10px] font-bold transition-all truncate border ${
                  activeDistrictView === 'костанай'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                г. Костанай
              </button>
            </div>
          </div>

          {/* Voltage Line Legend based on official schematic */}
          <div className="space-y-1 text-[11px] font-mono border-t border-slate-700/80 pt-2 text-slate-300">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
              Классы напряжения ЛЭП
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-full bg-blue-600 shadow-[0_0_6px_#2563EB]" />
                <span className="font-bold">ВЛ 220 кВ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-full bg-emerald-600 shadow-[0_0_6px_#059669]" />
                <span className="font-bold">ВЛ 110 кВ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-full bg-red-600 shadow-[0_0_6px_#DC2626]" />
                <span className="font-bold">ВЛ 35 кВ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-full bg-amber-500 shadow-[0_0_6px_#D97706]" />
                <span className="font-bold">ВЛ 10 кВ</span>
              </div>
            </div>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/80">
            <button
              onClick={() => setShowLines(!showLines)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                showLines
                  ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>ЛЭП ({powerLines.length})</span>
            </button>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                showLabels
                  ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Подписи</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recenter & Map Actions Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => handleDistrictChange('all')}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 shadow-xl transition-all flex items-center gap-2 text-xs font-bold"
          title="Сфокусировать на всей Костанайской области"
        >
          <Compass className="h-4 w-4 text-cyan-400" />
          <span>Вся область</span>
        </button>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Selected Tile Layer */}
        <TileLayer
          key={tileStyle}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={19}
        />

        {/* Transmission Power Lines (ЛЭП) */}
        {showLines &&
          powerLines.map(line => {
            let lineColor = '#059669'; // 110 kV (green)
            let weight = 3.5;
            let dashArray: string | undefined = undefined;

            if (line.voltageKV >= 220) {
              lineColor = '#2563EB'; // 220 kV (blue)
              weight = 4.5;
            } else if (line.voltageKV >= 110) {
              lineColor = '#059669'; // 110 kV (green)
              weight = 3.5;
            } else if (line.voltageKV >= 35) {
              lineColor = '#DC2626'; // 35 kV (red)
              weight = 3.0;
            } else {
              lineColor = '#D97706'; // 10 kV (amber)
              weight = 2.5;
            }

            if (line.status === 'disconnected') {
              dashArray = '6, 8';
              lineColor = '#DC2626';
            } else if (line.status === 'overloaded') {
              lineColor = '#D97706';
            }

            return (
              <Polyline
                key={line.id}
                positions={line.coordinates}
                pathOptions={{
                  color: lineColor,
                  weight: weight,
                  opacity: 0.92,
                  dashArray: dashArray,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Tooltip sticky className="dark-map-tooltip">
                  <div className="p-2 text-xs font-mono bg-slate-950 text-white rounded-lg border border-slate-700 shadow-xl">
                    <strong className="text-white block text-[13px] font-bold border-b border-slate-800 pb-1">{line.name}</strong>
                    <div className="text-slate-300 text-[11px] mt-1 space-y-0.5">
                      <div>Марка провода: <strong className="text-cyan-300 font-bold">{line.wireType || 'АС-95'}</strong> • Длина: <strong className="text-white">{line.lengthKm || '—'} км</strong></div>
                      <div>Класс напряжения: <strong>{line.voltageKV} кВ</strong> {line.voltageClass ? `(${line.voltageClass})` : ''}</div>
                      <div>Поток мощности: <strong className="text-emerald-400 font-bold">{line.powerFlowMW} МВт</strong> / {line.maxCapacityMW} МВт</div>
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* Substation Markers */}
        {filteredObjects.map(obj => {
          const isSelected = obj.id === selectedObjectId;
          const latestEvent = getLatestEventForObject(obj.id);

          return (
            <Marker
              key={obj.id}
              position={obj.coordinates}
              icon={createSubstationIcon(obj.status, obj.voltageClassKV, isSelected)}
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
                    {obj.name.replace(/ПС \d+\/?\d*\/??\d* кВ /i, '').replace(/"/g, '')}
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

      {/* Empty State Banner if no objects */}
      {objects.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[900]">
          <div className="pointer-events-auto p-6 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl text-center max-w-md mx-4 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Все объекты стёрты</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Карта очищена. Вы можете добавить новые подстанции и узлы вручную с точными координатами.
            </p>
            <button
              onClick={() => setIsAddSubstationModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Добавить энергообъект</span>
            </button>
          </div>
        </div>
      )}

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

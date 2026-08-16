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
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { SupabaseObject, SupabaseLine } from '../../types/energy';
import { getSupabaseClient } from '../../services/supabaseClient';
import { AddEventModal } from '../object-detail/AddEventModal';
import { AddSubstationModal } from './AddSubstationModal';

// Резервные данные из naurzum_district_insert.sql (если Supabase еще не настроен)
const DEFAULT_NAURZUM_OBJECTS: SupabaseObject[] = [
  { id: 1, name: 'Докучаевка (Караменды)', type: 'подстанция/узел', district: 'Наурзумский', latitude: 51.6458, longitude: 64.2197, status: 'норма' },
  { id: 2, name: 'Сосновка', type: 'узел', district: 'Наурзумский', latitude: 51.4577, longitude: 63.5091, status: 'норма' },
  { id: 3, name: 'Буревестник', type: 'узел', district: 'Наурзумский', latitude: 51.1853, longitude: 63.4208, status: 'норма' },
  { id: 4, name: 'Семилетка', type: 'узел', district: 'Наурзумский', latitude: 51.5929, longitude: 64.8440, status: 'норма' },
  { id: 5, name: 'Шолоксай', type: 'узел', district: 'Наурзумский', latitude: 51.8554, longitude: 64.8577, status: 'норма' },
  { id: 6, name: 'Ушакова', type: 'узел', district: 'Наурзумский', latitude: 51.4988, longitude: 65.5303, status: 'норма' },
  { id: 7, name: 'Панфилова', type: 'узел', district: 'Наурзумский', latitude: 51.4254, longitude: 65.4519, status: 'норма' },
  { id: 8, name: 'Кожа', type: 'узел', district: 'Наурзумский', latitude: 51.3348, longitude: 64.7655, status: 'норма' },
  { id: 9, name: 'Дамды', type: 'узел', district: 'Наурзумский', latitude: 51.2077, longitude: 65.0245, status: 'норма' },
  { id: 10, name: 'РП-10 кВ "п.Аксай"', type: 'РП', district: 'Наурзумский', latitude: 51.0708, longitude: 65.2997, status: 'норма' },
  { id: 11, name: 'ПС Кожахмет', type: 'ПС (демонтирована)', district: 'Наурзумский', latitude: 50.7972, longitude: 64.9317, status: 'демонтирован' },
  { id: 12, name: 'Кайга (конец ВЛ-10кВ)', type: 'тупиковая точка', district: 'Наурзумский', latitude: 50.8100, longitude: 64.8100, status: 'норма' },
  { id: 13, name: 'Ц.У. (конец ВЛ-10кВ)', type: 'тупиковая точка', district: 'Наурзумский', latitude: 50.7850, longitude: 64.8150, status: 'норма' },
];

const DEFAULT_NAURZUM_LINES: SupabaseLine[] = [
  { id: 1, from_object_id: 1, to_object_id: 4, wire_type: 'АС-95', length_km: 43.5, voltage_class: 'в габаритах 110 кВ', status: 'active' },
  { id: 2, from_object_id: 1, to_object_id: 4, wire_type: 'АС-50', length_km: 22.5, voltage_class: 'в режиме 10 кВ', line_name: 'Наурзум-Сарбулак', status: 'active' },
  { id: 3, from_object_id: 2, to_object_id: 1, wire_type: 'АС-95', length_km: 53.4, voltage_class: 'в габаритах 110 кВ', status: 'active' },
  { id: 4, from_object_id: 2, to_object_id: 3, wire_type: 'АС-95', length_km: 30.9, voltage_class: 'в габаритах 110 кВ', status: 'active' },
  { id: 5, from_object_id: 4, to_object_id: 5, wire_type: 'АС-50', length_km: 29.2, voltage_class: '35 кВ', status: 'active' },
  { id: 6, from_object_id: 4, to_object_id: 8, wire_type: 'АС-70', length_km: 34.2, voltage_class: '35 кВ', status: 'active' },
  { id: 7, from_object_id: 4, to_object_id: 6, wire_type: 'АС-95', length_km: 48.6, voltage_class: 'в габаритах 110 кВ', status: 'active' },
  { id: 8, from_object_id: 6, to_object_id: 7, wire_type: 'АС-70', length_km: 9.8, voltage_class: '35 кВ', status: 'active' },
  { id: 9, from_object_id: 7, to_object_id: 9, wire_type: 'АС-70', length_km: 31.3, voltage_class: '35 кВ', status: 'active' },
  { id: 10, from_object_id: 8, to_object_id: 9, wire_type: 'АС-70', length_km: 28.8, voltage_class: '35 кВ', status: 'active' },
  { id: 11, from_object_id: 9, to_object_id: 10, wire_type: 'АС-35', length_km: 24.5, voltage_class: 'в габаритах 35 кВ', status: 'active' },
  {
    id: 12,
    from_object_id: 9,
    to_object_id: 11,
    wire_type: 'АС-70',
    length_km: 46.1,
    voltage_class: 'в габаритах 35 кВ',
    status: 'demontirovana',
    path: [
      [51.2077, 65.0245],
      [51.0250, 64.9700],
      [50.7972, 64.9317],
    ],
  },
  { id: 13, from_object_id: 11, to_object_id: 12, wire_type: 'АС-35', length_km: 15.0, voltage_class: '10 кВ', line_name: 'Кожахмет-Кайга', status: 'active' },
  { id: 14, from_object_id: 11, to_object_id: 13, wire_type: 'АС-35', length_km: 15.0, voltage_class: '10 кВ', line_name: 'Кожахмет-Ц.У.', status: 'active' },
];

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
const createObjectIcon = (status: string | undefined, isSelected: boolean, isEndpoint?: boolean) => {
  const isOutage = status === 'авария' || status === 'outage';
  const isMaintenance = status === 'ремонт' || status === 'maintenance' || status === 'демонтирован';
  
  let color = isEndpoint ? '#38BDF8' : '#10B981'; // normal (green) or cyan for endpoints
  let ringColor = 'rgba(16, 185, 129, 0.4)';
  if (isOutage) {
    color = '#EF4444';
    ringColor = 'rgba(239, 68, 68, 0.7)';
  } else if (isMaintenance) {
    color = '#F59E0B';
    ringColor = 'rgba(245, 158, 11, 0.6)';
  }

  const selectedPulse = isSelected
    ? `<div style="position: absolute; inset: -6px; border: 2.5px dashed #0284C7; border-radius: 9999px; animation: spin 8s linear infinite;"></div>`
    : '';

  const size = isEndpoint ? 28 : 38;
  const innerSize = isEndpoint ? 20 : 28;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: ${size - 8}px; height: ${size - 8}px; border-radius: 9999px; background: ${ringColor}; pointer-events: none;"></div>
      ${selectedPulse}
      
      <div style="position: relative; z-index: 10; width: ${innerSize}px; height: ${innerSize}px; border-radius: 7px; background: #0F172A; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        <svg width="${innerSize * 0.5}" height="${innerSize * 0.5}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
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
  const [objects, setObjects] = useState<SupabaseObject[]>([]);
  const [lines, setLines] = useState<SupabaseLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [selectedObjId, setSelectedObjId] = useState<string | number | null>(null);

  const [showLines, setShowLines] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [tileStyle, setTileStyle] = useState<TileStyle>('light');
  const [isAddSubstationModalOpen, setIsAddSubstationModalOpen] = useState(false);

  // 1. Загрузка данных из Supabase
  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      let loadedObjects: SupabaseObject[] = [];
      let loadedLines: SupabaseLine[] = [];

      if (supabase) {
        const { data: objectsData, error: objError } = await supabase
          .from('objects')
          .select('*');

        const { data: linesData, error: lineError } = await supabase
          .from('lines')
          .select('*');

        if (objError) {
          console.warn('Supabase objects query error:', objError.message);
        } else if (objectsData && objectsData.length > 0) {
          loadedObjects = objectsData as SupabaseObject[];
          setIsSupabaseLive(true);
        }

        if (lineError) {
          console.warn('Supabase lines query error:', lineError.message);
        } else if (linesData && linesData.length > 0) {
          loadedLines = linesData as SupabaseLine[];
        }
      }

      // Fallback на локальный набор (naurzum_district_insert.sql) если Supabase пуст или не подключен
      if (loadedObjects.length === 0) {
        loadedObjects = DEFAULT_NAURZUM_OBJECTS;
        loadedLines = DEFAULT_NAURZUM_LINES;
        setIsSupabaseLive(false);
      }

      setObjects(loadedObjects);
      setLines(loadedLines);

      // 5. Вывод в консоль objects.length и lines.length после загрузки
      console.log('⚡ [EnergySight] Данные успешно загружены:');
      console.log('⚡ objects.length =', loadedObjects.length, loadedObjects);
      console.log('⚡ lines.length =', loadedLines.length, loadedLines);
    } catch (err) {
      console.error('Ошибка при загрузке данных из Supabase:', err);
      setObjects(DEFAULT_NAURZUM_OBJECTS);
      setLines(DEFAULT_NAURZUM_LINES);
      console.log('⚡ Fallback objects.length =', DEFAULT_NAURZUM_OBJECTS.length);
      console.log('⚡ Fallback lines.length =', DEFAULT_NAURZUM_LINES.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const selectedObject = useMemo(() => {
    return objects.find(o => o.id === selectedObjId);
  }, [objects, selectedObjId]);

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
        <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-3.5 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="h-4 w-4 text-cyan-400" />
                ТОО "Межрегионэнерготранзит"
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Database className="h-3 w-3 text-cyan-400" />
                {isSupabaseLive ? (
                  <span className="text-emerald-400 font-semibold">База данных Supabase (Live)</span>
                ) : (
                  <span>Наурзумский район</span>
                )}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
              {objects.length} узлов • {lines.length} ЛЭП
            </span>
          </div>

          {/* Map Base Layer Switcher */}
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
              <span>Режим карты:</span>
              <span className="text-cyan-400 font-semibold">
                {tileStyle === 'light' ? 'Светлая (Voyager)' : tileStyle === 'osm' ? 'OSM' : tileStyle === 'satellite' ? 'Спутник' : 'Темная'}
              </span>
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
                title="Спутниковая съемка"
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
                title="Темная SCADA"
              >
                <Moon className="h-3 w-3" />
                <span>Темная</span>
              </button>
            </div>
          </div>

          {/* Action Button: Refresh / Add */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/80">
            <button
              onClick={loadDataFromSupabase}
              disabled={isLoading}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Обновить из базы</span>
            </button>

            <button
              onClick={() => setShowLines(!showLines)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                showLines ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Переключить видимость линий"
            >
              ЛЭП ({lines.length})
            </button>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                showLabels ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Переключить подписи"
            >
              Подписи
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

        {/* 3. Для каждой линии из lines: рисуем путь из path или прямую [from, to] */}
        {showLines &&
          lines.map(line => {
            const fromObj = objects.find(o => o.id === line.from_object_id);
            const toObj = objects.find(o => o.id === line.to_object_id);

            // Если оба объекта найдены в objects
            if (!fromObj || !toObj) return null;

            // Разрешение координат линии: если есть path — используем его, иначе прямая [from, to]
            let linePositions: [number, number][] = [];
            if (line.path) {
              if (Array.isArray(line.path) && line.path.length > 0) {
                linePositions = line.path;
              } else if (typeof line.path === 'string') {
                try {
                  linePositions = JSON.parse(line.path);
                } catch {
                  linePositions = [
                    [fromObj.latitude, fromObj.longitude],
                    [toObj.latitude, toObj.longitude],
                  ];
                }
              }
            }
            if (linePositions.length === 0) {
              linePositions = [
                [fromObj.latitude, fromObj.longitude],
                [toObj.latitude, toObj.longitude],
              ];
            }

            // Цветовая индикация по классу напряжения
            let lineColor = '#059669'; // 110 кВ (зеленый)
            let weight = 3.5;
            let dashArray: string | undefined = undefined;

            if (line.voltage_class?.includes('110') || line.wire_type === 'АС-95') {
              lineColor = '#059669'; // 110 кВ
              weight = 3.5;
            } else if (line.voltage_class?.includes('10')) {
              lineColor = '#D97706'; // 10 кВ
              weight = 2.5;
            } else if (line.voltage_class?.includes('35') || line.wire_type === 'АС-70' || line.wire_type === 'АС-35') {
              lineColor = '#DC2626'; // 35 кВ
              weight = 3.0;
            }

            if (line.status === 'demontirovana' || line.status === 'disconnected') {
              dashArray = '6, 8';
              lineColor = '#94A3B8'; // пунктирная для демонтированной/отключенной
            }

            return (
              <Polyline
                key={`line-${line.id}-${line.from_object_id}-${line.to_object_id}`}
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
                <Tooltip sticky className="dark-map-tooltip">
                  <div className="p-2 text-xs font-mono bg-slate-950 text-white rounded-lg border border-slate-700 shadow-xl">
                    <strong className="text-white block text-[13px] font-bold border-b border-slate-800 pb-1">
                      {line.line_name || `ВЛ «${fromObj.name} — ${toObj.name}»`}
                    </strong>
                    <div className="text-slate-300 text-[11px] mt-1 space-y-0.5">
                      <div>Марка провода: <strong className="text-cyan-300 font-bold">{line.wire_type || 'АС'}</strong> • Длина: <strong className="text-white">{line.length_km || '—'} км</strong></div>
                      <div>Класс: <strong>{line.voltage_class || '35 кВ'}</strong></div>
                      <div>Статус: <span className={line.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}>{line.status || 'active'}</span></div>
                      {line.path && <div className="text-amber-400 text-[10px]">Трасса с изломом (промежуточные точки)</div>}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* 2. Для каждого объекта из objects ставим маркер Leaflet: position={[obj.latitude, obj.longitude]} */}
        {objects.map(obj => {
          const isSelected = obj.id === selectedObjId;
          const isEndpoint = obj.type === 'тупиковая точка';

          return (
            <Marker
              key={`obj-${obj.id}`}
              position={[obj.latitude, obj.longitude]}
              icon={createObjectIcon(obj.status, isSelected, isEndpoint)}
              eventHandlers={{
                click: () => {
                  setSelectedObjId(obj.id);
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
              <Popup className="custom-scada-popup" minWidth={260} maxWidth={300}>
                <div className="p-4 space-y-2.5 bg-slate-900 text-white rounded-xl">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase">
                      ID: {obj.id} • {obj.district || 'Наурзумский'}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight mt-0.5">
                      {obj.name}
                    </h4>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Тип:</span>
                      <strong className="text-white">{obj.type || 'узел'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Широта (Lat):</span>
                      <strong className="text-cyan-300">{obj.latitude}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Долгота (Lng):</span>
                      <strong className="text-cyan-300">{obj.longitude}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Статус:</span>
                      <strong className={obj.status === 'демонтирован' ? 'text-slate-400' : 'text-emerald-400'}>
                        {obj.status || 'норма'}
                      </strong>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Quick Drawer if an object is selected */}
      {selectedObject && (
        <div className="absolute top-4 right-4 bottom-4 z-[1000] w-80 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden animate-fade-in text-white">
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                ID #{selectedObject.id}
              </span>
              <h3 className="text-base font-bold text-white leading-tight mt-1">
                {selectedObject.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedObject.district} • {selectedObject.type}</p>
            </div>
            <button
              onClick={() => setSelectedObjId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Точные координаты из базы (без округлений)
              </span>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Широта (Latitude):</span>
                <span className="text-cyan-300 font-bold">{selectedObject.latitude}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Долгота (Longitude):</span>
                <span className="text-cyan-300 font-bold">{selectedObject.longitude}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Тип объекта:</span>
                <span className="text-white">{selectedObject.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Оперативный статус:</span>
                <span className="text-emerald-400">{selectedObject.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Район:</span>
                <span className="text-white">{selectedObject.district}</span>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <button
              onClick={() => setSelectedObjId(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Закрыть панель
            </button>
          </div>
        </div>
      )}

      {/* Add Substation Modal */}
      <AddSubstationModal
        isOpen={isAddSubstationModalOpen}
        onClose={() => setIsAddSubstationModalOpen(false)}
      />
    </div>
  );
};

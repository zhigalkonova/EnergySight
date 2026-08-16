import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { ActiveTab, EnergyObject, EventType, GridEvent, ObjectStatus, PowerLine } from '../types/energy';
import { INITIAL_POWER_LINES } from '../services/mockData';
import {
  loadInitialObjects,
  saveObjectsToStorage,
  loadInitialEvents,
  saveEventsToStorage,
  resetLocalStorageData,
  clearAllDataFromStorage,
} from '../services/supabaseClient';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
}

interface EnergyContextType {
  objects: EnergyObject[];
  events: GridEvent[];
  powerLines: PowerLine[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  selectedObject: EnergyObject | undefined;
  
  // Filtering & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'all' | ObjectStatus;
  setStatusFilter: (s: 'all' | ObjectStatus) => void;
  typeFilter: 'all' | string;
  setTypeFilter: (t: 'all' | string) => void;
  
  // Actions
  addNewObject: (obj: EnergyObject) => void;
  addEvent: (params: {
    objectId: string;
    type: EventType;
    title?: string;
    description: string;
    dispatcherName: string;
    newStatus?: ObjectStatus;
  }) => void;
  updateObjectStatus: (objectId: string, newStatus: ObjectStatus, reason?: string) => void;
  simulateEmergencyOutage: () => void;
  simulateRestoration: (objectId?: string) => void;
  clearAllObjects: () => void;
  resetAllData: () => void;
  
  // Notifications
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  
  // KPI Stats
  stats: {
    totalObjects: number;
    normalCount: number;
    maintenanceCount: number;
    outageCount: number;
    totalLoadMW: number;
    totalCapacityMVA: number;
    avgLoadPercentage: number;
    avgResponseMinutes: number;
    saidiHours: number;
    saifiCount: number;
  };
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export const EnergyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [objects, setObjects] = useState<EnergyObject[]>(() => loadInitialObjects());
  const [events, setEvents] = useState<GridEvent[]>(() => loadInitialEvents());
  const [powerLines, setPowerLines] = useState<PowerLine[]>(INITIAL_POWER_LINES);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ObjectStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Sync with localStorage
  useEffect(() => {
    saveObjectsToStorage(objects);
  }, [objects]);

  useEffect(() => {
    saveEventsToStorage(events);
  }, [events]);

  // Subtle live telemetry pulse for active objects
  useEffect(() => {
    if (objects.length === 0) return;
    const interval = setInterval(() => {
      setObjects(prev =>
        prev.map(obj => {
          if (obj.status === 'outage') return obj;
          const fluctuation = (Math.random() - 0.5) * 0.4;
          const newMW = Math.max(0.1, +(obj.telemetry.activePowerMW + fluctuation).toFixed(1));
          const newHz = +(49.98 + Math.random() * 0.04).toFixed(2);
          return {
            ...obj,
            telemetry: {
              ...obj.telemetry,
              activePowerMW: newMW,
              frequencyHz: newHz,
              updatedAt: new Date().toISOString(),
            },
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [objects.length]);

  const addToast = (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: new Date().toISOString(),
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 7000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const selectedObject = useMemo(() => {
    return objects.find(o => o.id === selectedObjectId);
  }, [objects, selectedObjectId]);

  const addNewObject = (newObj: EnergyObject) => {
    setObjects(prev => [newObj, ...prev]);
    setSelectedObjectId(newObj.id);
    addToast({
      title: 'Объект добавлен',
      message: `${newObj.name} успешно добавлен на карту сети.`,
      type: 'success',
    });
  };

  const clearAllObjects = () => {
    setObjects([]);
    setPowerLines([]);
    setEvents([]);
    setSelectedObjectId(null);
    clearAllDataFromStorage();
    addToast({
      title: 'Карта очищена',
      message: 'Все подстанции, линии и события удалены. Карта готова для новых данных.',
      type: 'info',
    });
  };

  const addEvent = ({
    objectId,
    type,
    title,
    description,
    dispatcherName,
    newStatus,
  }: {
    objectId: string;
    type: EventType;
    title?: string;
    description: string;
    dispatcherName: string;
    newStatus?: ObjectStatus;
  }) => {
    const targetObj = objects.find(o => o.id === objectId);
    if (!targetObj) return;

    let derivedStatus: ObjectStatus = targetObj.status;
    let severity: 'critical' | 'warning' | 'info' | 'success' = 'info';
    let defaultTitle = title;

    if (type === 'accident') {
      derivedStatus = newStatus || 'outage';
      severity = 'critical';
      if (!defaultTitle) defaultTitle = `Аварийное отключение: ${targetObj.name}`;
    } else if (type === 'repair') {
      derivedStatus = newStatus || 'maintenance';
      severity = 'warning';
      if (!defaultTitle) defaultTitle = `Вывод в плановый ремонт: ${targetObj.name}`;
    } else if (type === 'restoration') {
      derivedStatus = newStatus || 'normal';
      severity = 'success';
      if (!defaultTitle) defaultTitle = `Ввод в работу: ${targetObj.name}`;
    } else if (type === 'relay_protection') {
      severity = 'warning';
      if (!defaultTitle) defaultTitle = `Срабатывание РЗА: ${targetObj.name}`;
    } else {
      severity = 'info';
      if (!defaultTitle) defaultTitle = `Плановый осмотр: ${targetObj.name}`;
    }

    const previousStatus = targetObj.status;
    const finalNewStatus = newStatus !== undefined ? newStatus : derivedStatus;

    const newEvent: GridEvent = {
      id: 'evt-' + Date.now(),
      objectId: targetObj.id,
      objectName: targetObj.name,
      timestamp: new Date().toISOString(),
      type,
      title: defaultTitle,
      description,
      dispatcherName: dispatcherName || 'Диспетчер ОДС',
      severity,
      previousStatus,
      newStatus: finalNewStatus,
      acknowledged: false,
    };

    setObjects(prev =>
      prev.map(obj => {
        if (obj.id === objectId) {
          const isOutage = finalNewStatus === 'outage';
          return {
            ...obj,
            status: finalNewStatus,
            currentLoadMVA: isOutage ? +(obj.installedCapacityMVA * 0.15).toFixed(1) : +(obj.installedCapacityMVA * 0.65).toFixed(1),
            loadPercentage: isOutage ? 15 : 65,
            telemetryStatus: isOutage ? 'offline' : finalNewStatus === 'maintenance' ? 'warning' : 'online',
            telemetry: {
              ...obj.telemetry,
              activePowerMW: isOutage ? +(obj.telemetry.activePowerMW * 0.2).toFixed(1) : +(obj.installedCapacityMVA * 0.6).toFixed(1),
              voltageKV: isOutage ? +(obj.voltageClassKV * 0.92).toFixed(1) : obj.voltageClassKV,
              updatedAt: new Date().toISOString(),
            },
          };
        }
        return obj;
      })
    );

    setEvents(prev => [newEvent, ...prev]);

    addToast({
      title: defaultTitle,
      message: `${targetObj.name}: ${description.substring(0, 90)}`,
      type: severity,
    });
  };

  const updateObjectStatus = (objectId: string, newStatus: ObjectStatus, reason?: string) => {
    let eventType: EventType = 'inspection';
    if (newStatus === 'outage') eventType = 'accident';
    else if (newStatus === 'maintenance') eventType = 'repair';
    else if (newStatus === 'normal') eventType = 'restoration';

    addEvent({
      objectId,
      type: eventType,
      newStatus,
      description: reason || `Смена оперативного статуса на "${newStatus}"`,
      dispatcherName: 'Старший диспетчер ОДС',
    });
  };

  const simulateEmergencyOutage = () => {
    if (objects.length === 0) {
      addToast({
        title: 'Нет объектов',
        message: 'На карте нет энергообъектов для симуляции.',
        type: 'warning',
      });
      return;
    }
    const normalObjects = objects.filter(o => o.status === 'normal');
    const target = normalObjects.length > 0 ? normalObjects[Math.floor(Math.random() * normalObjects.length)] : objects[0];
    
    addEvent({
      objectId: target.id,
      type: 'accident',
      title: `ТРЕВОГА: Аварийное отключение на ${target.name}`,
      description: `Сработала максимальная токовая защита. Нагрузка сброшена.`,
      dispatcherName: 'Автоматика SCADA / Диспетчер ОДС',
      newStatus: 'outage',
    });

    setSelectedObjectId(target.id);
  };

  const simulateRestoration = (objectId?: string) => {
    const target = objectId ? objects.find(o => o.id === objectId) : objects.find(o => o.status === 'outage' || o.status === 'maintenance');
    if (!target) return;

    addEvent({
      objectId: target.id,
      type: 'restoration',
      title: `Ликвидация инцидента: ${target.name}`,
      description: `Успешный ввод в нормальную схему. Напряжение в норме.`,
      dispatcherName: 'Главный диспетчер ОДС',
      newStatus: 'normal',
    });
  };

  const resetAllData = () => {
    resetLocalStorageData();
    setObjects(loadInitialObjects());
    setEvents(loadInitialEvents());
    setPowerLines(INITIAL_POWER_LINES);
    addToast({
      title: 'Сброс выполнен',
      message: 'Данные сброшены.',
      type: 'info',
    });
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalObjects = objects.length;
    const normalCount = objects.filter(o => o.status === 'normal').length;
    const maintenanceCount = objects.filter(o => o.status === 'maintenance').length;
    const outageCount = objects.filter(o => o.status === 'outage').length;

    const totalLoadMW = +objects.reduce((acc, o) => acc + (o.telemetry?.activePowerMW || 0), 0).toFixed(1);
    const totalCapacityMVA = +objects.reduce((acc, o) => acc + (o.installedCapacityMVA || 0), 0).toFixed(1);
    const avgLoadPercentage = totalCapacityMVA > 0 ? +((totalLoadMW / totalCapacityMVA) * 100).toFixed(1) : 0;

    return {
      totalObjects,
      normalCount,
      maintenanceCount,
      outageCount,
      totalLoadMW,
      totalCapacityMVA,
      avgLoadPercentage,
      avgResponseMinutes: totalObjects > 0 ? 24 : 0,
      saidiHours: totalObjects > 0 ? 1.42 : 0,
      saifiCount: totalObjects > 0 ? 0.85 : 0,
    };
  }, [objects]);

  return (
    <EnergyContext.Provider
      value={{
        objects,
        events,
        powerLines,
        activeTab,
        setActiveTab,
        selectedObjectId,
        setSelectedObjectId,
        selectedObject,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        addNewObject,
        addEvent,
        updateObjectStatus,
        simulateEmergencyOutage,
        simulateRestoration,
        clearAllObjects,
        resetAllData,
        toasts,
        dismissToast,
        stats,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
};

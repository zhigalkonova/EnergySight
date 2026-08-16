export type ObjectStatus = 'normal' | 'maintenance' | 'outage';

export type ObjectType = 
  | 'ПС 220/110/10 кВ'
  | 'ПС 110/35/10 кВ'
  | 'ПС 110/10 кВ'
  | 'ПС 35/10 кВ'
  | 'РП 10 кВ'
  | 'ТП 10/0.4 кВ'
  | 'подстанция/узел'
  | 'узел'
  | 'РП'
  | 'ПС (демонтирована)';

export type EventType = 'accident' | 'repair' | 'restoration' | 'inspection' | 'relay_protection';

export type EventSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface TelemetryData {
  voltageKV: number;
  activePowerMW: number;
  reactivePowerMvar: number;
  frequencyHz: number;
  loadPercentage: number;
  transformerTempC: number;
  oilPressureBar: number;
  updatedAt: string;
}

export interface EnergyObject {
  id: string;
  name: string;
  code: string;
  type: ObjectType;
  status: ObjectStatus;
  district: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  installedCapacityMVA: number;
  currentLoadMVA: number;
  loadPercentage: number;
  voltageClassKV: number;
  transformersCount: number;
  installationYear: number;
  lastMaintenanceDate: string;
  chiefEngineer: string;
  phone: string;
  telemetryStatus: 'online' | 'warning' | 'offline';
  consumerType: 'Промышленные' | 'Городские / Бытовые' | 'Смешанные' | 'Инфраструктурные' | 'Сельскохозяйственные';
  feedersCount: number;
  telemetry: TelemetryData;
}

export interface GridEvent {
  id: string;
  objectId: string;
  objectName: string;
  timestamp: string;
  type: EventType;
  title: string;
  description: string;
  dispatcherName: string;
  severity: EventSeverity;
  previousStatus?: ObjectStatus;
  newStatus?: ObjectStatus;
  acknowledged: boolean;
}

export interface PowerLine {
  id: string;
  name: string;
  voltageKV: number;
  fromObjectId: string;
  toObjectId: string;
  coordinates: [number, number][];
  status: 'active' | 'overloaded' | 'disconnected';
  powerFlowMW: number;
  maxCapacityMW: number;
  wireType?: string;
  lengthKm?: number;
  voltageClass?: string;
}

export type ActiveTab = 'map' | 'registry' | 'detail' | 'events' | 'dashboard';

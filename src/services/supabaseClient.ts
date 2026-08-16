import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnergyObject, GridEvent } from '../types/energy';
import { INITIAL_OBJECTS, INITIAL_EVENTS } from './mockData';

// Config stored in localStorage for easy demo/configuration
const SUPABASE_CONFIG_KEY = 'energysight_supabase_config';
const OBJECTS_STORAGE_KEY = 'energysight_objects_v5';
const EVENTS_STORAGE_KEY = 'energysight_events_v5';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
    connected: false,
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anonKey);
    }
    return supabaseInstance;
  }
  return null;
};

// Local storage helpers with fallback to mock data
export const loadInitialObjects = (): EnergyObject[] => {
  const stored = localStorage.getItem(OBJECTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored objects, using defaults', e);
    }
  }
  return INITIAL_OBJECTS;
};

export const saveObjectsToStorage = (objects: EnergyObject[]) => {
  localStorage.setItem(OBJECTS_STORAGE_KEY, JSON.stringify(objects));
};

export const loadInitialEvents = (): GridEvent[] => {
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored events, using defaults', e);
    }
  }
  return INITIAL_EVENTS;
};

export const saveEventsToStorage = (events: GridEvent[]) => {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
};

export const resetLocalStorageData = () => {
  localStorage.setItem(OBJECTS_STORAGE_KEY, JSON.stringify(INITIAL_OBJECTS));
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
};

// Helper to clear all local data explicitly
export const clearAllDataFromStorage = () => {
  localStorage.setItem(OBJECTS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify([]));
};

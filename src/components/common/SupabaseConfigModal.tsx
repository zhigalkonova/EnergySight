import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { getStoredSupabaseConfig, saveSupabaseConfig, SupabaseConfig } from '../../services/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());
  const [saved, setSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig({
      ...config,
      connected: Boolean(config.url && config.anonKey),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const copySqlSchema = () => {
    const sql = `-- Supabase Schema for EnergySight
CREATE TABLE IF NOT EXISTS public.objects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'normal',
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    installed_capacity_mva DOUBLE PRECISION NOT NULL,
    voltage_class_kv INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    object_id TEXT NOT NULL REFERENCES public.objects(id),
    object_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    dispatcher_name TEXT NOT NULL,
    severity TEXT NOT NULL
);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Интеграция с базой данных Supabase"
      subtitle="Синхронизация таблиц objects и events с облачной СУБД PostgreSQL"
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-cyan-200/90 leading-relaxed">
            <strong>Офлайн-режим активен:</strong> Приложение полностью автономно работает из встроенного LocalStorage с 10 подстанциями Костаная и 18 событиями. Подключение к Supabase опционально для синхронизации с реальным облаком.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Supabase Project URL
          </label>
          <input
            type="url"
            placeholder="https://xyzcompany.supabase.co"
            value={config.url}
            onChange={e => setConfig({ ...config, url: e.target.value })}
            className="w-full rounded-xl bg-slate-900/80 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Supabase Anon / Public Key
          </label>
          <input
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={config.anonKey}
            onChange={e => setConfig({ ...config, anonKey: e.target.value })}
            className="w-full rounded-xl bg-slate-900/80 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
        </div>

        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">SQL-скрипт инициализации таблиц:</span>
            <button
              type="button"
              onClick={copySqlSchema}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
            >
              {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedSql ? 'Скопировано!' : 'Скопировать SQL'}
            </button>
          </div>
          <div className="text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400 overflow-x-auto">
            Таблицы: objects, events (файл supabase_schema.sql в корне)
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Закрыть
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all font-sans"
          >
            {saved ? <Check className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            {saved ? 'Сохранено!' : 'Сохранить параметры'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

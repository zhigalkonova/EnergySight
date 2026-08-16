-- ==============================================================================
-- EnergySight Database Schema for Supabase (PostgreSQL)
-- Система мониторинга и диспетчеризации электросетей ТОО "Межрегионэнерготранзит"
-- Наурзумский район и Костанайская область
-- ==============================================================================

-- 1. Таблица энергообъектов (objects)
CREATE TABLE IF NOT EXISTS public.objects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'maintenance', 'outage', 'demontirovan')),
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    installed_capacity_mva DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_load_mva DOUBLE PRECISION NOT NULL DEFAULT 0,
    load_percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
    voltage_class_kv INTEGER NOT NULL,
    transformers_count INTEGER NOT NULL DEFAULT 1,
    installation_year INTEGER NOT NULL,
    last_maintenance_date DATE,
    chief_engineer TEXT,
    phone TEXT,
    telemetry_status TEXT NOT NULL DEFAULT 'online' CHECK (telemetry_status IN ('online', 'warning', 'offline')),
    consumer_type TEXT NOT NULL,
    feeders_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Таблица линий электропередач (lines)
CREATE TABLE IF NOT EXISTS public.lines (
    id TEXT PRIMARY KEY,
    from_object_id TEXT REFERENCES public.objects(id) ON DELETE CASCADE,
    to_object_id TEXT REFERENCES public.objects(id) ON DELETE CASCADE,
    line_name TEXT NOT NULL,
    wire_type TEXT,            -- например 'АС-95', 'АС-70', 'АС-50'
    length_km NUMERIC,
    voltage_class_kv INTEGER NOT NULL,
    voltage_class_label TEXT,  -- например 'в габаритах 110 кВ', 'в режиме 10 кВ'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'overloaded', 'disconnected')),
    power_flow_mw NUMERIC DEFAULT 0,
    max_capacity_mw NUMERIC DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Таблица событий и инцидентов (events)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    object_id TEXT NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('accident', 'repair', 'restoration', 'inspection', 'relay_protection')),
    title TEXT NOT NULL,
    description TEXT,
    dispatcher_name TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
    previous_status TEXT,
    new_status TEXT,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS Политики
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on objects" ON public.objects FOR SELECT USING (true);
CREATE POLICY "Allow public write on objects" ON public.objects FOR ALL USING (true);

CREATE POLICY "Allow public read on lines" ON public.lines FOR SELECT USING (true);
CREATE POLICY "Allow public write on lines" ON public.lines FOR ALL USING (true);

CREATE POLICY "Allow public read on events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public write on events" ON public.events FOR ALL USING (true);

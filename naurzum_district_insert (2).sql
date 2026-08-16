-- ============================================================
-- EnergySight: объекты и линии Наурзумского района
-- ТОО "Межрегионэнерготранзит"
-- ============================================================
-- Координаты для Докучаевки, Кожа, Дамды подтверждены по открытым
-- источникам. Остальные — приблизительные (карта-схема не привязана
-- географически), точность ±15-30 км. Для продакшна рекомендуется
-- уточнить через 2ГИС/Google Maps.
-- ============================================================

-- Если таблицы line ещё нет — создаём (связь между двумя объектами)
CREATE TABLE IF NOT EXISTS lines (
    id SERIAL PRIMARY KEY,
    from_object_id INTEGER REFERENCES objects(id),
    to_object_id INTEGER REFERENCES objects(id),
    wire_type TEXT,           -- например 'АС-95'
    length_km NUMERIC,
    voltage_class TEXT,       -- например 'в габаритах 110 кВ', 'в режиме 10 кВ'
    status TEXT DEFAULT 'active',
    line_name TEXT,           -- например 'Наурзум-Сарбулак'
    path JSONB,                -- НОВОЕ: массив промежуточных точек [[lat,lon], [lat,lon], ...]
                                -- если NULL — рисуем просто прямую от from_object к to_object
    created_at TIMESTAMP DEFAULT now()
);

-- Если таблица lines уже существует без колонки path — добавь её отдельно:
-- ALTER TABLE lines ADD COLUMN IF NOT EXISTS path JSONB;

-- ============================================================
-- 1. ОБЪЕКТЫ (узлы сети)
-- ============================================================

INSERT INTO objects (name, type, district, latitude, longitude, status, last_maintenance)
VALUES
    ('Докучаевка (Караменды)', 'подстанция/узел', 'Наурзумский', 51.6458, 64.2197, 'норма', now() - interval '30 days'),
    ('Сосновка',               'узел',            'Наурзумский', 51.4577, 63.5091, 'норма', now() - interval '45 days'),
    ('Буревестник',            'узел',            'Наурзумский', 51.1853, 63.4208, 'норма', now() - interval '60 days'),
    ('Семилетка',              'узел',            'Наурзумский', 51.5929, 64.8440, 'норма', now() - interval '20 days'),
    ('Шолоксай',               'узел',            'Наурзумский', 51.8554, 64.8577, 'норма', now() - interval '15 days'),
    ('Ушакова',                'узел',            'Наурзумский', 51.4988, 65.5303, 'норма', now() - interval '50 days'),
    ('Панфилова',              'узел',            'Наурзумский', 51.4254, 65.4519, 'норма', now() - interval '25 days'),
    ('Кожа',                   'узел',            'Наурзумский', 51.3348, 64.7655, 'норма', now() - interval '10 days'),
    ('Дамды',                  'узел',            'Наурзумский', 51.2077, 65.0245, 'норма', now() - interval '5 days'),
    ('РП-10 кВ "п.Аксай"',     'РП',              'Наурзумский', 51.0708, 65.2997, 'норма', now() - interval '40 days'),
    ('ПС Кожахмет',            'ПС (демонтирована)', 'Наурзумский', 50.7972, 64.9317, 'демонтирован', NULL);

-- ============================================================
-- 2. ЛИНИИ (рёбра сети)
-- ============================================================
-- Используем подзапросы по имени объекта, чтобы не зависеть от
-- конкретных id (они присвоятся автоматически при INSERT выше)

INSERT INTO lines (from_object_id, to_object_id, wire_type, length_km, voltage_class, line_name, status)
VALUES
    (
        (SELECT id FROM objects WHERE name = 'Докучаевка (Караменды)'),
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        'АС-95', 43.5, 'в габаритах 110 кВ', NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Докучаевка (Караменды)'),
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        'АС-50', 22.5, 'в режиме 10 кВ', 'Наурзум-Сарбулак', 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Сосновка'),
        (SELECT id FROM objects WHERE name = 'Докучаевка (Караменды)'),
        'АС-95', 53.4, 'в габаритах 110 кВ', NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Сосновка'),
        (SELECT id FROM objects WHERE name = 'Буревестник'),
        'АС-95', 30.9, 'в габаритах 110 кВ', NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        (SELECT id FROM objects WHERE name = 'Шолоксай'),
        'АС-50', 29.2, NULL, NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        (SELECT id FROM objects WHERE name = 'Кожа'),
        'АС-70', 34.2, NULL, NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        (SELECT id FROM objects WHERE name = 'Ушакова'),
        'АС-95', 48.6, 'в габаритах 110 кВ', NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Ушакова'),
        (SELECT id FROM objects WHERE name = 'Панфилова'),
        'АС-70', 9.8, NULL, NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Панфилова'),
        (SELECT id FROM objects WHERE name = 'Дамды'),
        'АС-70', 31.3, NULL, NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Кожа'),
        (SELECT id FROM objects WHERE name = 'Дамды'),
        'АС-70', 28.8, NULL, NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Дамды'),
        (SELECT id FROM objects WHERE name = 'РП-10 кВ "п.Аксай"'),
        'АС-35', 24.5, 'в габаритах 35 кВ', NULL, 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'Дамды'),
        (SELECT id FROM objects WHERE name = 'ПС Кожахмет'),
        'АС-70', 46.1, 'в габаритах 35 кВ', NULL, 'demontirovana'
    );

-- ============================================================
-- 2а. ИЗЛОМ линии Дамды -> ПС Кожахмет (единственная линия района
--     с реальным поворотом на схеме, не прямая)
-- ============================================================
UPDATE lines
SET path = '[[51.2077, 65.0245], [51.0250, 64.9700], [50.7972, 64.9317]]'::jsonb
WHERE from_object_id = (SELECT id FROM objects WHERE name = 'Дамды')
  AND to_object_id   = (SELECT id FROM objects WHERE name = 'ПС Кожахмет');

-- ============================================================
-- 2б. Две тупиковые ВЛ-10кВ от ПС Кожахмет (длины на схеме не
--     указаны, поставлены символически на ~15 км на запад,
--     подкорректируй при наличии реальных данных)
-- ============================================================
INSERT INTO objects (name, type, district, latitude, longitude, status, last_maintenance)
VALUES
    ('Кайга (конец ВЛ-10кВ)',  'тупиковая точка', 'Наурзумский', 50.8100, 64.8100, 'норма', NULL),
    ('Ц.У. (конец ВЛ-10кВ)',   'тупиковая точка', 'Наурзумский', 50.7850, 64.8150, 'норма', NULL);

INSERT INTO lines (from_object_id, to_object_id, wire_type, length_km, voltage_class, line_name, status)
VALUES
    (
        (SELECT id FROM objects WHERE name = 'ПС Кожахмет'),
        (SELECT id FROM objects WHERE name = 'Кайга (конец ВЛ-10кВ)'),
        NULL, NULL, '10 кВ', 'Кожахмет-Кайга', 'active'
    ),
    (
        (SELECT id FROM objects WHERE name = 'ПС Кожахмет'),
        (SELECT id FROM objects WHERE name = 'Ц.У. (конец ВЛ-10кВ)'),
        NULL, NULL, '10 кВ', 'Кожахмет-Ц.У.', 'active'
    );

-- ============================================================
-- Готово. Проверить результат:
-- SELECT * FROM objects WHERE district = 'Наурзумский';
-- SELECT * FROM lines;
-- ============================================================

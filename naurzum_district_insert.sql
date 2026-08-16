-- ============================================================
-- EnergySight: объекты и линии Наурзумского района
-- ТОО "Межрегионэнерготранзит"
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
    line_name TEXT,           -- например 'Наурзум-Раздольное'
    path JSONB,                -- массив промежуточных точек [[lat,lon], [lat,lon], ...]
    created_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- 1. ОБЪЕКТЫ (узлы сети Наурзумского района)
-- ============================================================

INSERT INTO objects (name, type, district, latitude, longitude, status, last_maintenance)
VALUES
    ('Докучаевка (Караменды)', 'подстанция/узел', 'Наурзумский', 51.6458, 64.2197, 'норма', now() - interval '30 days'),
    ('Сосновка',               'узел',            'Наурзумский', 51.4577, 63.5091, 'норма', now() - interval '45 days'),
    ('Буревестник',            'узел',            'Наурзумский', 51.1853, 63.4208, 'норма', now() - interval '60 days'),
    ('Раздольное',             'узел',            'Наурзумский', 51.4850, 63.8800, 'норма', now() - interval '35 days'),
    ('Семилетка',              'узел',            'Наурзумский', 51.5929, 64.8440, 'норма', now() - interval '20 days'),
    ('Шолоксай',               'узел',            'Наурзумский', 51.8554, 64.8577, 'норма', now() - interval '15 days'),
    ('Ушакова',                'узел',            'Наурзумский', 51.4988, 65.5303, 'норма', now() - interval '50 days'),
    ('Панфилова',              'узел',            'Наурзумский', 51.4254, 65.4519, 'норма', now() - interval '25 days'),
    ('Кожа',                   'узел',            'Наурзумский', 51.3348, 64.7655, 'норма', now() - interval '10 days'),
    ('Дамды',                  'узел',            'Наурзумский', 51.2077, 65.0245, 'норма', now() - interval '5 days'),
    ('РП-10 кВ "п.Аксай"',     'РП',              'Наурзумский', 51.0708, 65.2997, 'норма', now() - interval '40 days'),
    ('ПС Кожахмет',            'ПС (демонтирована)', 'Наурзумский', 50.7972, 64.9317, 'демонтирован', NULL),
    ('Кайга (конец ВЛ-10кВ)',  'тупиковая точка', 'Наурзумский', 50.8100, 64.8100, 'норма', NULL),
    ('Ц.У. (конец ВЛ-10кВ)',   'тупиковая точка', 'Наурзумский', 50.7850, 64.8150, 'норма', NULL);

-- ============================================================
-- 2. ЛИНИИ (рёбра сети)
-- ============================================================

INSERT INTO lines (from_object_id, to_object_id, wire_type, length_km, voltage_class, line_name, status, path)
VALUES
    -- 1. Магистральная ВЛ-110 кВ Докучаевка — Семилетка (ЕДИНСТВЕННАЯ линия 110 кВ на этом участке)
    (
        (SELECT id FROM objects WHERE name = 'Докучаевка (Караменды)'),
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        'АС-95', 43.5, 'в габаритах 110 кВ', NULL, 'active',
        '[[51.6458, 64.2197], [51.6250, 64.5300], [51.5929, 64.8440]]'::jsonb
    ),
    -- 2. ВЛ-10 кВ Докучаевка — Раздольное
    (
        (SELECT id FROM objects WHERE name = 'Докучаевка (Караменды)'),
        (SELECT id FROM objects WHERE name = 'Раздольное'),
        'АС-50', 22.5, 'в режиме 10 кВ', 'Докучаевка-Раздольное', 'active',
        NULL
    ),
    -- 3. ВЛ-110 кВ Сосновка — Докучаевка
    (
        (SELECT id FROM objects WHERE name = 'Сосновка'),
        (SELECT id FROM objects WHERE name = 'Докучаевка (Караменды)'),
        'АС-95', 53.4, 'в габаритах 110 кВ', NULL, 'active',
        '[[51.4577, 63.5091], [51.5800, 63.8800], [51.6458, 64.2197]]'::jsonb
    ),
    -- 4. ВЛ-110 кВ Сосновка — Буревестник
    (
        (SELECT id FROM objects WHERE name = 'Сосновка'),
        (SELECT id FROM objects WHERE name = 'Буревестник'),
        'АС-95', 30.9, 'в габаритах 110 кВ', NULL, 'active',
        '[[51.4577, 63.5091], [51.3100, 63.4500], [51.1853, 63.4208]]'::jsonb
    ),
    -- 5. ВЛ-35 кВ Семилетка — Шолоксай
    (
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        (SELECT id FROM objects WHERE name = 'Шолоксай'),
        'АС-50', 29.2, NULL, NULL, 'active',
        NULL
    ),
    -- 6. ВЛ-35 кВ Семилетка — Кожа
    (
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        (SELECT id FROM objects WHERE name = 'Кожа'),
        'АС-70', 34.2, NULL, NULL, 'active',
        NULL
    ),
    -- 7. ВЛ-110 кВ Семилетка — Ушакова
    (
        (SELECT id FROM objects WHERE name = 'Семилетка'),
        (SELECT id FROM objects WHERE name = 'Ушакова'),
        'АС-95', 48.6, 'в габаритах 110 кВ', NULL, 'active',
        NULL
    ),
    -- 8. ВЛ-35 кВ Ушакова — Панфилова
    (
        (SELECT id FROM objects WHERE name = 'Ушакова'),
        (SELECT id FROM objects WHERE name = 'Панфилова'),
        'АС-70', 9.8, NULL, NULL, 'active',
        NULL
    ),
    -- 9. ВЛ-35 кВ Панфилова — Дамды
    (
        (SELECT id FROM objects WHERE name = 'Панфилова'),
        (SELECT id FROM objects WHERE name = 'Дамды'),
        'АС-70', 31.3, NULL, NULL, 'active',
        NULL
    ),
    -- 10. ВЛ-35 кВ Кожа — Дамды
    (
        (SELECT id FROM objects WHERE name = 'Кожа'),
        (SELECT id FROM objects WHERE name = 'Дамды'),
        'АС-70', 28.8, NULL, NULL, 'active',
        NULL
    ),
    -- 11. ВЛ-35 кВ Дамды — РП Аксай
    (
        (SELECT id FROM objects WHERE name = 'Дамды'),
        (SELECT id FROM objects WHERE name = 'РП-10 кВ "п.Аксай"'),
        'АС-35', 24.5, 'в габаритах 35 кВ', NULL, 'active',
        NULL
    ),
    -- 12. ВЛ-35 кВ Дамды — ПС Кожахмет (демонтирована, с изломом)
    (
        (SELECT id FROM objects WHERE name = 'Дамды'),
        (SELECT id FROM objects WHERE name = 'ПС Кожахмет'),
        'АС-70', 46.1, 'в габаритах 35 кВ', NULL, 'demontirovana',
        '[[51.2077, 65.0245], [51.0250, 64.9700], [50.7972, 64.9317]]'::jsonb
    ),
    -- 13. ВЛ-10 кВ Кожахмет — Кайга
    (
        (SELECT id FROM objects WHERE name = 'ПС Кожахмет'),
        (SELECT id FROM objects WHERE name = 'Кайга (конец ВЛ-10кВ)'),
        NULL, NULL, '10 кВ', 'Кожахмет-Кайга', 'active',
        NULL
    ),
    -- 14. ВЛ-10 кВ Кожахмет — Ц.У.
    (
        (SELECT id FROM objects WHERE name = 'ПС Кожахмет'),
        (SELECT id FROM objects WHERE name = 'Ц.У. (конец ВЛ-10кВ)'),
        NULL, NULL, '10 кВ', 'Кожахмет-Ц.У.', 'active',
        NULL
    );

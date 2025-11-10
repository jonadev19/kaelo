
-- Insert 50 stores
INSERT INTO public.stores (owner_id, name, location, description, address, phone, status, logo_url, business_hours, approved_at)
SELECT
    (SELECT id FROM public.users ORDER BY random() LIMIT 1),
    'Store ' || i,
    ST_SetSRID(ST_MakePoint(random() * 360 - 180, random() * 180 - 90), 4326),
    'Description for store ' || i,
    'Address ' || i,
    '111-222-33' || LPAD(i::text, 2, '0'),
    (array['pendiente_aprobacion', 'aprobado'])[floor(random() * 2) + 1]::store_status,
    'https://example.com/logo' || i || '.png',
    jsonb_build_object(
        'lunes', '9:00-18:00',
        'martes', '9:00-18:00',
        'miercoles', '9:00-18:00',
        'jueves', '9:00-18:00',
        'viernes', '9:00-20:00',
        'sabado', '10:00-14:00'
    ),
    CASE
        WHEN random() > 0.2 THEN NOW() - (random() * interval '60 days')
        ELSE NULL
    END
FROM generate_series(1, 50) AS i;

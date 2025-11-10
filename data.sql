
-- Insert 50 users
INSERT INTO public.users (id, email, password, full_name, role, avatar_url, phone, is_active, email_verified)
SELECT
    uuid_generate_v4(),
    'user' || i || '@example.com',
    'password_' || i,
    'User ' || i,
    CASE WHEN i % 10 = 0 THEN 'admin'::user_role ELSE 'ciclista'::user_role END,
    'https://example.com/avatar' || i || '.png',
    '123-456-78' || LPAD(i::text, 2, '0'),
    TRUE,
    TRUE
FROM generate_series(1, 50) AS i;

-- Insert 50 routes
INSERT INTO public.routes (id, creator_id, title, description, distance_km, difficulty, price, status)
SELECT
    uuid_generate_v4(),
    (SELECT id FROM public.users ORDER BY random() LIMIT 1),
    'Route ' || i,
    'Description for route ' || i,
    random() * 100,
    (array['facil', 'intermedia', 'dificil'])[floor(random() * 3) + 1]::route_difficulty,
    random() * 50,
    'publicada'::route_status
FROM generate_series(1, 50) AS i;

-- Insert 50 stores
INSERT INTO public.stores (id, owner_id, name, description, location, address, phone, status)
SELECT
    uuid_generate_v4(),
    (SELECT id FROM public.users ORDER BY random() LIMIT 1),
    'Store ' || i,
    'Description for store ' || i,
    ST_SetSRID(ST_MakePoint(random() * 180 - 90, random() * 360 - 180), 4326),
    'Address ' || i,
    '987-654-32' || LPAD(i::text, 2, '0'),
    'aprobado'::store_status
FROM generate_series(1, 50) AS i;

-- Insert 50 transactions
INSERT INTO public.transactions (id, user_id, transaction_type, amount, payment_status, route_id, order_id)
SELECT
    uuid_generate_v4(),
    (SELECT id FROM public.users ORDER BY random() LIMIT 1),
    'compra_ruta'::transaction_type,
    random() * 100,
    'completado'::payment_status,
    (SELECT id FROM public.routes ORDER BY random() LIMIT 1),
    NULL
FROM generate_series(1, 50) AS i;

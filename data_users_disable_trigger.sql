
-- Temporarily disable all triggers on the users table
ALTER TABLE public.users DISABLE TRIGGER ALL;

-- Insert 50 users
INSERT INTO public.users (id, email, full_name, role, avatar_url, phone, is_active, email_verified, last_login)
SELECT
    uuid_generate_v4(),
    'user' || i || '@example.com',
    'User ' || i,
    (array['ciclista', 'comerciante', 'creador_ruta', 'administrador'])[floor(random() * 4) + 1]::user_role,
    'https://example.com/avatar' || i || '.png',
    '555-555-55' || LPAD(i::text, 2, '0'),
    random() > 0.1,
    random() > 0.5,
    NOW() - (random() * interval '30 days')
FROM generate_series(1, 50) AS i;

-- Re-enable all triggers on the users table
ALTER TABLE public.users ENABLE TRIGGER ALL;

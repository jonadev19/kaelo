-- ============================================
-- Kaelo - Script de Datos de Prueba
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CONFIGURACIÓN
-- ============================================

-- Intentaremos usar el primer usuario que encontremos en la base de datos
-- Si no hay usuarios, el script fallará. Asegúrate de registrar al menos un usuario primero.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
        RAISE EXCEPTION 'No se encontraron usuarios en auth.users. Por favor regístrate en la app primero.';
    END IF;
END $$;

-- ============================================
-- 2. COMERCIOS (Businesses)
-- ============================================

INSERT INTO businesses (name, description, business_type, address, phone, email, website, location, business_hours, status, owner_id, slug) VALUES

-- Restaurantes
('La Casa del Cacao', 'Restaurante tradicional yucateco con cochinita pibil artesanal y bebidas de cacao.', 'restaurante', 'Calle 60 #501, Centro, Mérida', '+52 999 123 4567', 'contacto@casadelcacao.mx', 'https://casadelcacao.mx', ST_SetSRID(ST_MakePoint(-89.6225, 20.9741), 4326), '{"Lunes": "8:00 - 20:00", "Martes": "8:00 - 20:00", "Miércoles": "8:00 - 20:00", "Jueves": "8:00 - 20:00", "Viernes": "8:00 - 22:00", "Sábado": "9:00 - 22:00", "Domingo": "9:00 - 16:00"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'la-casa-del-cacao'),

('Los Almendros', 'Especialidad en comida yucateca desde 1962. Famosos por sus panuchos y tacos.', 'restaurante', 'Calle 50A #493, Centro, Mérida', '+52 999 987 6543', 'reservaciones@losalmendros.mx', NULL, ST_SetSRID(ST_MakePoint(-89.6180, 20.9750), 4326), '{"Lunes": "12:00 - 22:00", "Martes": "12:00 - 22:00", "Miércoles": "12:00 - 22:00", "Jueves": "12:00 - 22:00", "Viernes": "12:00 - 23:00", "Sábado": "12:00 - 23:00", "Domingo": "12:00 - 18:00"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'los-almendros'),

('El Cenote Azul', 'Restaurante junto al cenote con pescados frescos y mariscos.', 'restaurante', 'Carretera Mérida-Progreso Km 15', '+52 999 555 1234', NULL, NULL, ST_SetSRID(ST_MakePoint(-89.6500, 21.0500), 4326), '{"Lunes": "10:00 - 18:00", "Martes": "10:00 - 18:00", "Miércoles": "Cerrado", "Jueves": "10:00 - 18:00", "Viernes": "10:00 - 20:00", "Sábado": "9:00 - 20:00", "Domingo": "9:00 - 18:00"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'el-cenote-azul'),

-- Cafeterías
('Café Montejo', 'Café artesanal de Chiapas y Veracruz. Ambiente perfecto para ciclistas.', 'cafeteria', 'Paseo de Montejo #450, Mérida', '+52 999 222 3333', 'hola@cafemontejo.mx', 'https://cafemontejo.mx', ST_SetSRID(ST_MakePoint(-89.6150, 20.9850), 4326), '{"Lunes": "7:00 - 21:00", "Martes": "7:00 - 21:00", "Miércoles": "7:00 - 21:00", "Jueves": "7:00 - 21:00", "Viernes": "7:00 - 22:00", "Sábado": "8:00 - 22:00", "Domingo": "8:00 - 18:00"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'cafe-montejo'),

('Ki''Xocolatl', 'Chocolate artesanal maya. Bebidas frías y calientes perfectas post-ruta.', 'cafeteria', 'Calle 55 #512, Centro, Mérida', '+52 999 444 5555', 'ventas@kixocolatl.com', NULL, ST_SetSRID(ST_MakePoint(-89.6200, 20.9700), 4326), '{"Lunes": "9:00 - 20:00", "Martes": "9:00 - 20:00", "Miércoles": "9:00 - 20:00", "Jueves": "9:00 - 20:00", "Viernes": "9:00 - 21:00", "Sábado": "10:00 - 21:00", "Domingo": "10:00 - 18:00"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'kixocolatl'),

-- Talleres de bicicletas
('Bici Mérida Pro', 'Taller especializado en bicicletas de ruta y montaña. Reparaciones express.', 'taller_bicicletas', 'Av. Itzaes #315, Mérida', '+52 999 666 7777', 'taller@bicimerida.mx', 'https://bicimerida.mx', ST_SetSRID(ST_MakePoint(-89.6100, 20.9650), 4326), '{"Lunes": "9:00 - 18:00", "Martes": "9:00 - 18:00", "Miércoles": "9:00 - 18:00", "Jueves": "9:00 - 18:00", "Viernes": "9:00 - 18:00", "Sábado": "9:00 - 14:00", "Domingo": "Cerrado"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'bici-merida-pro'),

('Ciclos Yucatán', 'Venta y reparación de bicicletas. Repuestos originales.', 'taller_bicicletas', 'Calle 65 #480, Centro, Mérida', '+52 999 888 9999', NULL, NULL, ST_SetSRID(ST_MakePoint(-89.6250, 20.9720), 4326), '{"Lunes": "8:00 - 19:00", "Martes": "8:00 - 19:00", "Miércoles": "8:00 - 19:00", "Jueves": "8:00 - 19:00", "Viernes": "8:00 - 19:00", "Sábado": "8:00 - 15:00", "Domingo": "Cerrado"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'ciclos-yucatan'),

-- Hospedaje
('Hotel Hacienda VistaCenote', 'Hotel boutique con acceso exclusivo a cenote privado.', 'hospedaje', 'Carretera Cuzamá Km 8', '+52 999 111 2222', 'reservas@vistacentoe.com', 'https://vistacentoe.com', ST_SetSRID(ST_MakePoint(-89.4500, 20.7500), 4326), '{"Recepción": "24 horas"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'hotel-hacienda-vistacenote'),

-- Tiendas
('Deportes Maya', 'Todo para el ciclista: ropa, accesorios, nutrición deportiva.', 'tienda', 'Plaza Altabrisa Local 45, Mérida', '+52 999 333 4444', 'ventas@deportesmaya.mx', NULL, ST_SetSRID(ST_MakePoint(-89.5900, 20.9950), 4326), '{"Lunes": "10:00 - 21:00", "Martes": "10:00 - 21:00", "Miércoles": "10:00 - 21:00", "Jueves": "10:00 - 21:00", "Viernes": "10:00 - 21:00", "Sábado": "10:00 - 21:00", "Domingo": "11:00 - 20:00"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'deportes-maya'),

-- Tienda de conveniencia
('OXXO Progreso', 'Tienda de conveniencia 24 horas en la ruta a Progreso.', 'tienda_conveniencia', 'Carretera Mérida-Progreso Km 20', NULL, NULL, NULL, ST_SetSRID(ST_MakePoint(-89.6300, 21.1000), 4326), '{"Todos los días": "24 horas"}', 'activo', (SELECT id FROM auth.users LIMIT 1), 'oxxo-progreso');

-- ============================================
-- 3. PRODUCTOS DE COMERCIOS
-- ============================================

-- Productos de La Casa del Cacao
INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Cochinita Pibil', 'Plato tradicional con tortillas hechas a mano', 120.00, 'alimentos', true FROM businesses WHERE slug = 'la-casa-del-cacao';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Panuchos de Pollo', '3 panuchos con pollo deshebrado', 85.00, 'alimentos', true FROM businesses WHERE slug = 'la-casa-del-cacao';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Agua de Chaya', 'Bebida tradicional refrescante', 35.00, 'bebidas', true FROM businesses WHERE slug = 'la-casa-del-cacao';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Chocolate Caliente Maya', 'Con especias tradicionales', 45.00, 'bebidas', true FROM businesses WHERE slug = 'la-casa-del-cacao';

-- Productos de Café Montejo
INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Café Americano', 'Café de grano artesanal', 40.00, 'bebidas', true FROM businesses WHERE slug = 'cafe-montejo';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Smoothie de Frutas', 'Mango, piña y plátano', 55.00, 'bebidas', true FROM businesses WHERE slug = 'cafe-montejo';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Barra Energética', 'Ideal para ciclistas', 35.00, 'snacks', true FROM businesses WHERE slug = 'cafe-montejo';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Croissant de Almendra', 'Recién horneado', 45.00, 'alimentos', true FROM businesses WHERE slug = 'cafe-montejo';

-- Productos de Bici Mérida Pro
INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Reparación de Ponchaduras', 'Incluye parche y revisión', 80.00, 'servicios', true FROM businesses WHERE slug = 'bici-merida-pro';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Ajuste de Frenos', 'Ajuste completo y limpieza', 150.00, 'servicios', true FROM businesses WHERE slug = 'bici-merida-pro';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Cámara de Refacción', 'Medida estándar 26/27.5/29"', 120.00, 'refacciones', true FROM businesses WHERE slug = 'bici-merida-pro';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Botella de Agua 750ml', 'Con diseño Kaelo', 180.00, 'accesorios', true FROM businesses WHERE slug = 'bici-merida-pro';

-- Productos de Deportes Maya
INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Jersey Ciclismo Yucatán', 'Diseño exclusivo local', 890.00, 'accesorios', true FROM businesses WHERE slug = 'deportes-maya';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Casco de Ruta', 'Con ventilación premium', 1250.00, 'accesorios', true FROM businesses WHERE slug = 'deportes-maya';

INSERT INTO products (business_id, name, description, price, category, is_available) 
SELECT id, 'Gel Energético', 'Pack de 6 unidades', 180.00, 'snacks', true FROM businesses WHERE slug = 'deportes-maya';

-- ============================================
-- 4. RUTAS DE EJEMPLO
-- ============================================

INSERT INTO routes (
    name, 
    slug, 
    description, 
    difficulty, 
    terrain_type, 
    distance_km, 
    estimated_duration_min, 
    elevation_gain_m,
    route_path,
    start_point,
    end_point,
    price,
    is_free,
    municipality,
    status,
    creator_id
) VALUES (
    'Mérida - Progreso',
    'merida-progreso',
    'Ruta clásica de 36km desde Mérida hasta el malecón de Progreso. Ideal para principiantes con el camino completamente pavimentado. Disfruta de paradas en cenotes y restaurantes en el camino.',
    'facil',
    'asfalto',
    36.0,
    120,
    50,
    ST_SetSRID(ST_MakeLine(ARRAY[
        ST_MakePoint(-89.6225, 20.9741),
        ST_MakePoint(-89.6300, 21.0000),
        ST_MakePoint(-89.6350, 21.0500),
        ST_MakePoint(-89.6400, 21.1000),
        ST_MakePoint(-89.6500, 21.1500),
        ST_MakePoint(-89.6656, 21.2833)
    ]), 4326),
    ST_SetSRID(ST_MakePoint(-89.6225, 20.9741), 4326),
    ST_SetSRID(ST_MakePoint(-89.6656, 21.2833), 4326),
    0,
    true,
    'Progreso',
    'publicado',
    (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO routes (
    name, 
    slug, 
    description, 
    difficulty, 
    terrain_type, 
    distance_km, 
    estimated_duration_min, 
    elevation_gain_m,
    route_path,
    start_point,
    end_point,
    price,
    is_free,
    municipality,
    status,
    creator_id
) VALUES (
    'Ruta de los Cenotes',
    'ruta-cenotes',
    'Recorrido por los cenotes más impresionantes de Cuzamá. 45km de naturaleza pura con opciones para nadar en cada parada. Terreno mixto, se recomienda bici de montaña.',
    'moderada',
    'mixto',
    45.0,
    180,
    120,
    ST_SetSRID(ST_MakeLine(ARRAY[
        ST_MakePoint(-89.5925, 20.9673),
        ST_MakePoint(-89.5500, 20.9000),
        ST_MakePoint(-89.5000, 20.8500),
        ST_MakePoint(-89.4500, 20.8000),
        ST_MakePoint(-89.4000, 20.7500),
        ST_MakePoint(-89.3833, 20.7167)
    ]), 4326),
    ST_SetSRID(ST_MakePoint(-89.5925, 20.9673), 4326),
    ST_SetSRID(ST_MakePoint(-89.3833, 20.7167), 4326),
    150,
    false,
    'Cuzamá',
    'publicado',
    (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO routes (
    name, 
    slug, 
    description, 
    difficulty, 
    terrain_type, 
    distance_km, 
    estimated_duration_min, 
    elevation_gain_m,
    route_path,
    start_point,
    end_point,
    price,
    is_free,
    municipality,
    status,
    creator_id
) VALUES (
    'Izamal Mágico',
    'izamal-magico',
    'Ruta hacia la ciudad amarilla de Izamal. 72km de historia, arquitectura colonial y pirámides mayas. Ruta desafiante para ciclistas experimentados.',
    'dificil',
    'asfalto',
    72.0,
    300,
    200,
    ST_SetSRID(ST_MakeLine(ARRAY[
        ST_MakePoint(-89.6225, 20.9741),
        ST_MakePoint(-89.5500, 20.9500),
        ST_MakePoint(-89.4500, 20.9300),
        ST_MakePoint(-89.3500, 20.9200),
        ST_MakePoint(-89.2500, 20.9300),
        ST_MakePoint(-89.0167, 20.9333)
    ]), 4326),
    ST_SetSRID(ST_MakePoint(-89.6225, 20.9741), 4326),
    ST_SetSRID(ST_MakePoint(-89.0167, 20.9333), 4326),
    200,
    false,
    'Izamal',
    'publicado',
    (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO routes (
    name, 
    slug, 
    description, 
    difficulty, 
    terrain_type, 
    distance_km, 
    estimated_duration_min, 
    elevation_gain_m,
    route_path,
    start_point,
    end_point,
    price,
    is_free,
    municipality,
    status,
    creator_id
) VALUES (
    'Paseo Montejo Cultural',
    'paseo-montejo-cultural',
    'Recorrido por las mansiones históricas del Paseo Montejo. Ruta corta perfecta para familias y principiantes. Incluye paradas en museos y cafeterías.',
    'facil',
    'asfalto',
    12.0,
    45,
    20,
    ST_SetSRID(ST_MakeLine(ARRAY[
        ST_MakePoint(-89.6225, 20.9741),
        ST_MakePoint(-89.6200, 20.9800),
        ST_MakePoint(-89.6150, 20.9900),
        ST_MakePoint(-89.6100, 21.0000),
        ST_MakePoint(-89.6050, 21.0100)
    ]), 4326),
    ST_SetSRID(ST_MakePoint(-89.6225, 20.9741), 4326),
    ST_SetSRID(ST_MakePoint(-89.6050, 21.0100), 4326),
    0,
    true,
    'Mérida',
    'publicado',
    (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO routes (
    name, 
    slug, 
    description, 
    difficulty, 
    terrain_type, 
    distance_km, 
    estimated_duration_min, 
    elevation_gain_m,
    route_path,
    start_point,
    end_point,
    price,
    is_free,
    municipality,
    status,
    creator_id
) VALUES (
    'Uxmal Extremo',
    'uxmal-extremo',
    'Ruta épica de 80km hasta las ruinas de Uxmal. Solo para ciclistas experimentados. Incluye tramos de terracería y colinas.',
    'experto',
    'mixto',
    80.0,
    360,
    450,
    ST_SetSRID(ST_MakeLine(ARRAY[
        ST_MakePoint(-89.6225, 20.9741),
        ST_MakePoint(-89.6500, 20.9000),
        ST_MakePoint(-89.7000, 20.8000),
        ST_MakePoint(-89.7500, 20.7000),
        ST_MakePoint(-89.7700, 20.5000),
        ST_MakePoint(-89.7703, 20.3596)
    ]), 4326),
    ST_SetSRID(ST_MakePoint(-89.6225, 20.9741), 4326),
    ST_SetSRID(ST_MakePoint(-89.7703, 20.3596), 4326),
    350,
    false,
    'Santa Elena',
    'publicado',
    (SELECT id FROM auth.users LIMIT 1)
);

-- ============================================
-- 5. WAYPOINTS DE LAS RUTAS
-- ============================================

-- Waypoints para Mérida - Progreso
INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Parque de la Alemán',
    'Punto de inicio ideal para hidratarse',
    'inicio',
    1,
    ST_SetSRID(ST_MakePoint(-89.6225, 20.9741), 4326)
FROM routes r WHERE r.slug = 'merida-progreso';

INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Cenote Chelem',
    'Parada opcional para nadar',
    'cenote',
    2,
    ST_SetSRID(ST_MakePoint(-89.6400, 21.1000), 4326)
FROM routes r WHERE r.slug = 'merida-progreso';

INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Malecón de Progreso',
    'Llegada con vista al mar',
    'fin',
    3,
    ST_SetSRID(ST_MakePoint(-89.6656, 21.2833), 4326)
FROM routes r WHERE r.slug = 'merida-progreso';

-- Waypoints para Ruta de los Cenotes
INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Cenote Chelentún',
    'Primer cenote semi-abierto',
    'cenote',
    1,
    ST_SetSRID(ST_MakePoint(-89.5000, 20.8500), 4326)
FROM routes r WHERE r.slug = 'ruta-cenotes';

INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Cenote Chansinic''ché',
    'Cenote tipo caverna',
    'cenote',
    2,
    ST_SetSRID(ST_MakePoint(-89.4500, 20.8000), 4326)
FROM routes r WHERE r.slug = 'ruta-cenotes';

INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Cenote Bolonchojol',
    'El más profundo, ideal para clavados',
    'cenote',
    3,
    ST_SetSRID(ST_MakePoint(-89.4000, 20.7500), 4326)
FROM routes r WHERE r.slug = 'ruta-cenotes';

-- Waypoints para Izamal Mágico
INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Convento de San Antonio de Padua',
    'El atrio más grande de América',
    'mirador',
    1,
    ST_SetSRID(ST_MakePoint(-89.0167, 20.9333), 4326)
FROM routes r WHERE r.slug = 'izamal-magico';

INSERT INTO route_waypoints (route_id, name, description, waypoint_type, order_index, location)
SELECT 
    r.id,
    'Pirámide Kinich Kakmó',
    'Tercera pirámide más grande de México',
    'mirador',
    2,
    ST_SetSRID(ST_MakePoint(-89.0180, 20.9350), 4326)
FROM routes r WHERE r.slug = 'izamal-magico';

-- ============================================
-- 6. ACTUALIZAR RATINGS
-- ============================================

UPDATE businesses SET average_rating = 4.8, total_reviews = 127 WHERE slug = 'la-casa-del-cacao';
UPDATE businesses SET average_rating = 4.6, total_reviews = 89 WHERE slug = 'los-almendros';
UPDATE businesses SET average_rating = 4.9, total_reviews = 45 WHERE slug = 'cafe-montejo';
UPDATE businesses SET average_rating = 4.7, total_reviews = 34 WHERE slug = 'kixocolatl';
UPDATE businesses SET average_rating = 4.5, total_reviews = 67 WHERE slug = 'bici-merida-pro';
UPDATE businesses SET average_rating = 4.3, total_reviews = 23 WHERE slug = 'ciclos-yucatan';
UPDATE businesses SET average_rating = 4.9, total_reviews = 156 WHERE slug = 'hotel-hacienda-vistacenote';
UPDATE businesses SET average_rating = 4.4, total_reviews = 78 WHERE slug = 'deportes-maya';
UPDATE businesses SET average_rating = 3.8, total_reviews = 12 WHERE slug = 'el-cenote-azul';
UPDATE businesses SET average_rating = 4.0, total_reviews = 5 WHERE slug = 'oxxo-progreso';

UPDATE routes SET average_rating = 4.7, total_reviews = 89 WHERE slug = 'merida-progreso';
UPDATE routes SET average_rating = 4.9, total_reviews = 156 WHERE slug = 'ruta-cenotes';
UPDATE routes SET average_rating = 4.8, total_reviews = 67 WHERE slug = 'izamal-magico';
UPDATE routes SET average_rating = 4.5, total_reviews = 234 WHERE slug = 'paseo-montejo-cultural';
UPDATE routes SET average_rating = 4.6, total_reviews = 23 WHERE slug = 'uxmal-extremo';

-- ============================================
-- 7. RELACIONES RUTA-COMERCIO
-- ============================================

-- Comercios cercanos a rutas
INSERT INTO route_businesses (route_id, business_id, distance_from_route_m, order_index, notes)
SELECT 
    r.id, 
    b.id, 
    500, 
    1, 
    'Perfecto para desayunar antes de la ruta'
FROM routes r, businesses b 
WHERE r.slug = 'merida-progreso' AND b.slug = 'cafe-montejo';

INSERT INTO route_businesses (route_id, business_id, distance_from_route_m, order_index, notes)
SELECT 
    r.id, 
    b.id, 
    100, 
    2, 
    'Parada para hidratarse en el camino'
FROM routes r, businesses b 
WHERE r.slug = 'merida-progreso' AND b.slug = 'oxxo-progreso';

INSERT INTO route_businesses (route_id, business_id, distance_from_route_m, order_index, notes)
SELECT 
    r.id, 
    b.id, 
    200, 
    1, 
    'Taller de emergencia cerca del inicio'
FROM routes r, businesses b 
WHERE r.slug = 'ruta-cenotes' AND b.slug = 'bici-merida-pro';

INSERT INTO route_businesses (route_id, business_id, distance_from_route_m, order_index, notes)
SELECT 
    r.id, 
    b.id, 
    1500, 
    2, 
    'Hotel con cenote al final de la ruta'
FROM routes r, businesses b 
WHERE r.slug = 'ruta-cenotes' AND b.slug = 'hotel-hacienda-vistacenote';

INSERT INTO route_businesses (route_id, business_id, distance_from_route_m, order_index, notes)
SELECT 
    r.id, 
    b.id, 
    300, 
    1, 
    'Chocolate caliente para recuperar energía'
FROM routes r, businesses b 
WHERE r.slug = 'paseo-montejo-cultural' AND b.slug = 'kixocolatl';

INSERT INTO route_businesses (route_id, business_id, distance_from_route_m, order_index, notes)
SELECT 
    r.id, 
    b.id, 
    150, 
    2, 
    'Accesorios y nutrición deportiva'
FROM routes r, businesses b 
WHERE r.slug = 'uxmal-extremo' AND b.slug = 'deportes-maya';

-- ============================================
-- 8. COMPRAS DE RUTAS (Simuladas)
-- ============================================

-- Crear compras para rutas de pago
INSERT INTO route_purchases (route_id, buyer_id, amount_paid, creator_earnings, platform_fee, payment_status, purchased_at)
SELECT 
    r.id,
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    150.00,
    105.00,  -- 70% para creador
    45.00,   -- 30% plataforma
    'completado',
    NOW() - INTERVAL '7 days'
FROM routes r WHERE r.slug = 'ruta-cenotes';

INSERT INTO route_purchases (route_id, buyer_id, amount_paid, creator_earnings, platform_fee, payment_status, purchased_at)
SELECT 
    r.id,
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    200.00,
    140.00,
    60.00,
    'completado',
    NOW() - INTERVAL '3 days'
FROM routes r WHERE r.slug = 'izamal-magico';

INSERT INTO route_purchases (route_id, buyer_id, amount_paid, creator_earnings, platform_fee, payment_status, purchased_at)
SELECT 
    r.id,
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    350.00,
    245.00,
    105.00,
    'completado',
    NOW() - INTERVAL '1 day'
FROM routes r WHERE r.slug = 'uxmal-extremo';

-- ============================================
-- 9. ÓRDENES DE EJEMPLO
-- ============================================

-- Orden completada
INSERT INTO orders (
    customer_id, 
    business_id, 
    route_id, 
    order_number, 
    status, 
    subtotal, 
    platform_fee, 
    total, 
    estimated_pickup_time, 
    actual_pickup_time,
    notes, 
    payment_method, 
    payment_status
)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    r.id,
    'ORD-2025-000001',
    'entregado',
    165.00,
    16.50,
    181.50,
    NOW() - INTERVAL '5 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '8 hours 15 minutes',
    'Sin cebolla en los panuchos por favor',
    'tarjeta',
    'pagado'
FROM businesses b, routes r 
WHERE b.slug = 'la-casa-del-cacao' AND r.slug = 'merida-progreso';

-- Orden confirmada (próxima)
INSERT INTO orders (
    customer_id, 
    business_id, 
    route_id, 
    order_number, 
    status, 
    subtotal, 
    platform_fee, 
    total, 
    estimated_pickup_time, 
    notes, 
    payment_method, 
    payment_status
)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    r.id,
    'ORD-2025-000002',
    'confirmado',
    130.00,
    13.00,
    143.00,
    NOW() + INTERVAL '2 days' + INTERVAL '7 hours',
    'Llegaremos grupo de 4 ciclistas',
    'efectivo',
    'pendiente'
FROM businesses b, routes r 
WHERE b.slug = 'cafe-montejo' AND r.slug = 'paseo-montejo-cultural';

-- Orden pendiente
INSERT INTO orders (
    customer_id, 
    business_id, 
    order_number, 
    status, 
    subtotal, 
    platform_fee, 
    total, 
    estimated_pickup_time, 
    payment_method, 
    payment_status
)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    'ORD-2025-000003',
    'pendiente',
    430.00,
    43.00,
    473.00,
    NOW() + INTERVAL '1 week' + INTERVAL '9 hours',
    'tarjeta',
    'pendiente'
FROM businesses b 
WHERE b.slug = 'bici-merida-pro';

-- ============================================
-- 10. ITEMS DE ÓRDENES
-- ============================================

-- Items para orden 1 (La Casa del Cacao)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, notes)
SELECT 
    o.id,
    p.id,
    1,
    120.00,
    120.00,
    'Extra salsa de habanero'
FROM orders o, products p, businesses b
WHERE o.order_number = 'ORD-2025-000001' 
  AND p.name = 'Cochinita Pibil' 
  AND p.business_id = b.id 
  AND b.slug = 'la-casa-del-cacao';

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    1,
    45.00,
    45.00
FROM orders o, products p, businesses b
WHERE o.order_number = 'ORD-2025-000001' 
  AND p.name = 'Chocolate Caliente Maya' 
  AND p.business_id = b.id 
  AND b.slug = 'la-casa-del-cacao';

-- Items para orden 2 (Café Montejo)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    2,
    55.00,
    110.00
FROM orders o, products p, businesses b
WHERE o.order_number = 'ORD-2025-000002' 
  AND p.name = 'Smoothie de Frutas' 
  AND p.business_id = b.id 
  AND b.slug = 'cafe-montejo';

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    4,
    35.00,
    140.00
FROM orders o, products p, businesses b
WHERE o.order_number = 'ORD-2025-000002' 
  AND p.name = 'Barra Energética' 
  AND p.business_id = b.id 
  AND b.slug = 'cafe-montejo';

-- Items para orden 3 (Taller)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    1,
    150.00,
    150.00
FROM orders o, products p, businesses b
WHERE o.order_number = 'ORD-2025-000003' 
  AND p.name = 'Ajuste de Frenos' 
  AND p.business_id = b.id 
  AND b.slug = 'bici-merida-pro';

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    2,
    120.00,
    240.00
FROM orders o, products p, businesses b
WHERE o.order_number = 'ORD-2025-000003' 
  AND p.name = 'Cámara de Refacción' 
  AND p.business_id = b.id 
  AND b.slug = 'bici-merida-pro';

-- ============================================
-- 11. RESEÑAS DETALLADAS
-- ============================================

-- Reseñas de rutas
INSERT INTO reviews (user_id, route_id, rating, comment, review_type, status, photos)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    5,
    '¡Ruta increíble! El camino a Progreso es muy seguro y el malecón al final es la mejor recompensa. Paramos en el OXXO a mitad de camino para hidratarnos. 100% recomendada para principiantes.',
    'ruta',
    'aprobado',
    '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"]'
FROM routes r WHERE r.slug = 'merida-progreso';

INSERT INTO reviews (user_id, route_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    5,
    'Los cenotes son espectaculares. El terreno mixto es perfecto para MTB. Llevé mi GoPro y las tomas quedaron increíbles. El único reto es el calor, salgan temprano.',
    'ruta',
    'aprobado'
FROM routes r WHERE r.slug = 'ruta-cenotes';

INSERT INTO reviews (user_id, route_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    4,
    'Izamal es hermoso pero la ruta es larga. Recomiendo hacerla en dos días y hospedarse allá. El convento amarillo es impresionante.',
    'ruta',
    'aprobado'
FROM routes r WHERE r.slug = 'izamal-magico';

INSERT INTO reviews (user_id, route_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    5,
    'Perfecta para un domingo familiar. Las mansiones del Paseo Montejo son preciosas y hay muchos lugares para detenerse a comer o tomar café.',
    'ruta',
    'aprobado'
FROM routes r WHERE r.slug = 'paseo-montejo-cultural';

-- Reseñas de comercios
INSERT INTO reviews (user_id, business_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    5,
    'La cochinita está para morirse. Porciones generosas y el precio es muy accesible. El agua de chaya es refrescante perfecta después de una rodada.',
    'comercio',
    'aprobado'
FROM businesses b WHERE b.slug = 'la-casa-del-cacao';

INSERT INTO reviews (user_id, business_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    5,
    'El mejor café de Mérida, sin duda. Tienen estacionamiento para bicis y los smoothies son perfectos antes de una ruta. El staff es muy amable con ciclistas.',
    'comercio',
    'aprobado'
FROM businesses b WHERE b.slug = 'cafe-montejo';

INSERT INTO reviews (user_id, business_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    5,
    'Me salvaron cuando ponché a 30km de Mérida. Tienen servicio de emergencia y llegaron súper rápido. Precios justos y trabajo de calidad.',
    'comercio',
    'aprobado'
FROM businesses b WHERE b.slug = 'bici-merida-pro';

INSERT INTO reviews (user_id, business_id, rating, comment, review_type, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    b.id,
    4,
    'Buen chocolate, aunque un poco caro. El ambiente es muy agradable para descansar después de pedalear por el centro.',
    'comercio',
    'aprobado'
FROM businesses b WHERE b.slug = 'kixocolatl';

-- ============================================
-- 12. RUTAS GUARDADAS (FAVORITOS)
-- ============================================

INSERT INTO saved_routes (user_id, route_id)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id
FROM routes r WHERE r.slug IN ('ruta-cenotes', 'izamal-magico', 'uxmal-extremo');

-- ============================================
-- 13. COMPLETACIONES DE RUTAS
-- ============================================

-- Ruta completada
INSERT INTO route_completions (user_id, route_id, duration_min, started_at, completed_at, status, notes)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    135,
    NOW() - INTERVAL '10 days' + INTERVAL '6 hours',
    NOW() - INTERVAL '10 days' + INTERVAL '8 hours 15 minutes',
    'completado',
    'Excelente día, clima perfecto. Viento a favor en la ida.'
FROM routes r WHERE r.slug = 'merida-progreso';

INSERT INTO route_completions (user_id, route_id, duration_min, started_at, completed_at, status, notes)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    210,
    NOW() - INTERVAL '5 days' + INTERVAL '7 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '10 hours 30 minutes',
    'completado',
    'Nadamos en los 3 cenotes. Llevamos almuerzo preparado.'
FROM routes r WHERE r.slug = 'ruta-cenotes';

-- Ruta en progreso
INSERT INTO route_completions (user_id, route_id, started_at, status)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    NOW() - INTERVAL '2 hours',
    'en_progreso'
FROM routes r WHERE r.slug = 'paseo-montejo-cultural';

-- Ruta abandonada
INSERT INTO route_completions (user_id, route_id, duration_min, started_at, completed_at, status, notes)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    r.id,
    180,
    NOW() - INTERVAL '14 days' + INTERVAL '6 hours',
    NOW() - INTERVAL '14 days' + INTERVAL '9 hours',
    'abandonado',
    'Tuve que regresar por problema mecánico a los 40km. La ruta iba muy bien.'
FROM routes r WHERE r.slug = 'uxmal-extremo';

-- ============================================
-- 14. NOTIFICACIONES
-- ============================================

INSERT INTO notifications (user_id, title, body, notification_type, related_route_id, is_read, data)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    '¡Compra exitosa!',
    'Ya puedes acceder a la ruta "Ruta de los Cenotes". ¡Disfruta tu aventura!',
    'ruta_comprada',
    r.id,
    TRUE,
    '{"route_slug": "ruta-cenotes"}'
FROM routes r WHERE r.slug = 'ruta-cenotes';

INSERT INTO notifications (user_id, title, body, notification_type, related_order_id, is_read, data)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'Pedido confirmado',
    'Tu pedido #ORD-2025-000002 en Café Montejo ha sido confirmado. Te esperamos.',
    'orden_recibida',
    o.id,
    TRUE,
    '{"order_number": "ORD-2025-000002"}'
FROM orders o WHERE o.order_number = 'ORD-2025-000002';

INSERT INTO notifications (user_id, title, body, notification_type, related_business_id, is_read)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'Nueva reseña',
    'Alguien dejó una reseña de 5 estrellas en Café Montejo',
    'nueva_resena',
    b.id,
    FALSE
FROM businesses b WHERE b.slug = 'cafe-montejo';

INSERT INTO notifications (user_id, title, body, notification_type, is_read, data)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    'Pago recibido',
    'Has recibido $105.00 MXN por la venta de tu ruta. ¡Felicidades!',
    'pago_recibido',
    FALSE,
    '{"amount": 105.00, "currency": "MXN"}'
FROM routes LIMIT 1;

INSERT INTO notifications (user_id, title, body, notification_type, is_read, data)
SELECT 
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    '¡Bienvenido a Kaelo!',
    'Gracias por unirte. Explora las mejores rutas ciclistas de Yucatán.',
    'sistema',
    TRUE,
    '{"welcome": true}'
FROM routes LIMIT 1;

-- ============================================
-- 15. ACTUALIZAR PERFIL DEL USUARIO
-- ============================================

UPDATE profiles 
SET 
    full_name = COALESCE(full_name, 'Ciclista Kaelo'),
    bio = 'Amante del ciclismo en Yucatán. Explorando cenotes y rutas mayas.',
    phone = '+52 999 555 1234',
    is_creator = TRUE,
    is_business_owner = TRUE,
    wallet_balance = 350.00,
    total_routes_sold = 3,
    total_earnings = 490.00,
    creator_rating = 4.75,
    preferences = '{
        "notifications": true,
        "newsletter": true,
        "units": "metric",
        "language": "es",
        "difficulty_preference": "moderada"
    }'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- ============================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================

SELECT 'Resumen de datos insertados:' as info;

SELECT 'Comercios' as tabla, COUNT(*) as total FROM businesses
UNION ALL SELECT 'Productos', COUNT(*) FROM products
UNION ALL SELECT 'Rutas', COUNT(*) FROM routes
UNION ALL SELECT 'Waypoints', COUNT(*) FROM route_waypoints
UNION ALL SELECT 'Ruta-Comercio', COUNT(*) FROM route_businesses
UNION ALL SELECT 'Compras Rutas', COUNT(*) FROM route_purchases
UNION ALL SELECT 'Órdenes', COUNT(*) FROM orders
UNION ALL SELECT 'Items Orden', COUNT(*) FROM order_items
UNION ALL SELECT 'Reseñas', COUNT(*) FROM reviews
UNION ALL SELECT 'Rutas Guardadas', COUNT(*) FROM saved_routes
UNION ALL SELECT 'Completaciones', COUNT(*) FROM route_completions
UNION ALL SELECT 'Notificaciones', COUNT(*) FROM notifications;

SELECT '✅ Script ejecutado exitosamente!' as resultado;

-- =====================================================================
-- KAELO APP - BACKUP COMPLETO DEL SCHEMA DE PRODUCCION
-- =====================================================================
-- Fecha: 2026-01-28
-- Descripcion: Este archivo contiene el schema completo de la base de datos
--              de produccion de Kaelo App, incluyendo todas las tablas,
--              constraints, indices y configuraciones RLS.
-- =====================================================================

-- =====================================================================
-- EXTENSIONES
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS pg_graphql SCHEMA graphql;

-- =====================================================================
-- TABLAS
-- =====================================================================

-- Tabla: profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    bio text,
    wallet_balance numeric(10,2) DEFAULT 0.00,
    is_creator boolean DEFAULT false,
    is_business_owner boolean DEFAULT false,
    creator_rating numeric(3,2) DEFAULT 0.00,
    total_routes_sold integer DEFAULT 0,
    total_earnings numeric(12,2) DEFAULT 0.00,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: routes
CREATE TABLE public.routes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    creator_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    slug text NOT NULL,
    route_path geometry(LineString,4326),
    start_point geometry(Point,4326),
    end_point geometry(Point,4326),
    distance_km numeric(6,2) NOT NULL,
    elevation_gain_m integer DEFAULT 0,
    estimated_duration_min integer,
    difficulty text DEFAULT 'moderada'::text,
    terrain_type text DEFAULT 'asfalto'::text,
    status text DEFAULT 'borrador'::text,
    price numeric(8,2) DEFAULT 0.00,
    is_free boolean DEFAULT true,
    cover_image_url text,
    photos jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    municipality text,
    purchase_count integer DEFAULT 0,
    view_count integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone
);

-- Tabla: route_waypoints
CREATE TABLE public.route_waypoints (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    route_id uuid NOT NULL,
    location geometry(Point,4326) NOT NULL,
    name text NOT NULL,
    description text,
    waypoint_type text DEFAULT 'otro'::text,
    image_url text,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: businesses
CREATE TABLE public.businesses (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    location geometry(Point,4326) NOT NULL,
    address text NOT NULL,
    municipality text,
    phone text,
    email text,
    website text,
    whatsapp text,
    business_hours jsonb DEFAULT '{}'::jsonb,
    business_type text DEFAULT 'tienda'::text,
    cover_image_url text,
    logo_url text,
    photos jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'pendiente'::text,
    accepts_advance_orders boolean DEFAULT true,
    minimum_order_amount numeric(8,2) DEFAULT 0.00,
    advance_order_hours integer DEFAULT 2,
    average_rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    total_orders integer DEFAULT 0,
    commission_rate numeric(4,2) DEFAULT 10.00,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: route_businesses
CREATE TABLE public.route_businesses (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    route_id uuid NOT NULL,
    business_id uuid NOT NULL,
    distance_from_route_m integer,
    order_index integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: products
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(8,2) NOT NULL,
    category text DEFAULT 'otro'::text,
    image_url text,
    is_available boolean DEFAULT true,
    stock_quantity integer,
    is_cyclist_special boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: orders
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    customer_id uuid NOT NULL,
    business_id uuid NOT NULL,
    route_id uuid,
    order_number text NOT NULL,
    status text DEFAULT 'pendiente'::text,
    subtotal numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    estimated_pickup_time timestamp with time zone NOT NULL,
    actual_pickup_time timestamp with time zone,
    notes text,
    payment_method text DEFAULT 'efectivo'::text,
    payment_status text DEFAULT 'pendiente'::text,
    stripe_payment_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: order_items
CREATE TABLE public.order_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(8,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    notes text
);

-- Tabla: route_purchases
CREATE TABLE public.route_purchases (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    route_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    creator_earnings numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    payment_status text DEFAULT 'pendiente'::text,
    stripe_payment_id text,
    refund_requested_at timestamp with time zone,
    refund_reason text,
    refunded_at timestamp with time zone,
    purchased_at timestamp with time zone DEFAULT now()
);

-- Tabla: reviews
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    route_id uuid,
    business_id uuid,
    rating integer NOT NULL,
    comment text,
    photos jsonb DEFAULT '[]'::jsonb,
    review_type text NOT NULL,
    status text DEFAULT 'aprobado'::text,
    purchase_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: saved_routes
CREATE TABLE public.saved_routes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    route_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: route_completions
CREATE TABLE public.route_completions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    route_id uuid NOT NULL,
    recorded_path geometry(LineString,4326),
    duration_min integer,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    status text DEFAULT 'en_progreso'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: notifications
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    notification_type text NOT NULL,
    related_route_id uuid,
    related_order_id uuid,
    related_business_id uuid,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: business_coupons
CREATE TABLE public.business_coupons (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value numeric(8,2) NOT NULL,
    minimum_purchase numeric(8,2) DEFAULT 0,
    max_uses integer,
    current_uses integer DEFAULT 0,
    starts_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: unlocked_coupons
CREATE TABLE public.unlocked_coupons (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    coupon_id uuid NOT NULL,
    unlock_reason text NOT NULL,
    route_completion_id uuid,
    is_used boolean DEFAULT false,
    used_at timestamp with time zone,
    used_in_order_id uuid,
    unlocked_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- Tabla: sponsored_segments
CREATE TABLE public.sponsored_segments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL,
    route_id uuid NOT NULL,
    segment_start_index integer NOT NULL,
    segment_end_index integer NOT NULL,
    segment_path geometry(LineString,4326),
    coupon_id uuid,
    reward_message text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- =====================================================================
-- PRIMARY KEYS
-- =====================================================================

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.routes ADD CONSTRAINT routes_pkey PRIMARY KEY (id);
ALTER TABLE public.route_waypoints ADD CONSTRAINT route_waypoints_pkey PRIMARY KEY (id);
ALTER TABLE public.businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);
ALTER TABLE public.route_businesses ADD CONSTRAINT route_businesses_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE public.route_purchases ADD CONSTRAINT route_purchases_pkey PRIMARY KEY (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.saved_routes ADD CONSTRAINT saved_routes_pkey PRIMARY KEY (id);
ALTER TABLE public.route_completions ADD CONSTRAINT route_completions_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.business_coupons ADD CONSTRAINT business_coupons_pkey PRIMARY KEY (id);
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_pkey PRIMARY KEY (id);
ALTER TABLE public.sponsored_segments ADD CONSTRAINT sponsored_segments_pkey PRIMARY KEY (id);

-- =====================================================================
-- UNIQUE CONSTRAINTS
-- =====================================================================

ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE public.routes ADD CONSTRAINT routes_slug_key UNIQUE (slug);
ALTER TABLE public.businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);
ALTER TABLE public.route_businesses ADD CONSTRAINT route_businesses_route_id_business_id_key UNIQUE (route_id, business_id);
ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
ALTER TABLE public.route_purchases ADD CONSTRAINT route_purchases_route_id_buyer_id_key UNIQUE (route_id, buyer_id);
ALTER TABLE public.reviews ADD CONSTRAINT unique_user_route_review UNIQUE (user_id, route_id);
ALTER TABLE public.reviews ADD CONSTRAINT unique_user_business_review UNIQUE (user_id, business_id);
ALTER TABLE public.saved_routes ADD CONSTRAINT saved_routes_user_id_route_id_key UNIQUE (user_id, route_id);
ALTER TABLE public.sponsored_segments ADD CONSTRAINT sponsored_segments_business_id_route_id_key UNIQUE (business_id, route_id);
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_user_id_coupon_id_key UNIQUE (user_id, coupon_id);

-- =====================================================================
-- CHECK CONSTRAINTS
-- =====================================================================

ALTER TABLE public.routes ADD CONSTRAINT routes_difficulty_check CHECK ((difficulty = ANY (ARRAY['facil'::text, 'moderada'::text, 'dificil'::text, 'experto'::text])));
ALTER TABLE public.routes ADD CONSTRAINT routes_terrain_type_check CHECK ((terrain_type = ANY (ARRAY['asfalto'::text, 'terraceria'::text, 'mixto'::text])));
ALTER TABLE public.routes ADD CONSTRAINT routes_status_check CHECK ((status = ANY (ARRAY['borrador'::text, 'en_revision'::text, 'publicado'::text, 'rechazado'::text, 'archivado'::text])));
ALTER TABLE public.route_waypoints ADD CONSTRAINT route_waypoints_waypoint_type_check CHECK ((waypoint_type = ANY (ARRAY['inicio'::text, 'fin'::text, 'cenote'::text, 'zona_arqueologica'::text, 'mirador'::text, 'restaurante'::text, 'tienda'::text, 'taller_bicicletas'::text, 'descanso'::text, 'punto_agua'::text, 'peligro'::text, 'foto'::text, 'otro'::text])));
ALTER TABLE public.businesses ADD CONSTRAINT businesses_business_type_check CHECK ((business_type = ANY (ARRAY['restaurante'::text, 'cafeteria'::text, 'tienda'::text, 'taller_bicicletas'::text, 'hospedaje'::text, 'tienda_conveniencia'::text, 'mercado'::text, 'otro'::text])));
ALTER TABLE public.businesses ADD CONSTRAINT businesses_status_check CHECK ((status = ANY (ARRAY['pendiente'::text, 'activo'::text, 'pausado'::text, 'rechazado'::text])));
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK ((category = ANY (ARRAY['bebidas'::text, 'alimentos'::text, 'snacks'::text, 'reparaciones'::text, 'refacciones'::text, 'accesorios'::text, 'servicios'::text, 'otro'::text])));
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'preparando'::text, 'listo'::text, 'entregado'::text, 'cancelado'::text])));
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['tarjeta'::text, 'efectivo'::text, 'wallet'::text])));
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['pendiente'::text, 'pagado'::text, 'reembolsado'::text, 'fallido'::text])));
ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity_check CHECK ((quantity > 0));
ALTER TABLE public.route_purchases ADD CONSTRAINT route_purchases_payment_status_check CHECK ((payment_status = ANY (ARRAY['pendiente'::text, 'completado'::text, 'reembolsado'::text, 'fallido'::text])));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check CHECK ((review_type = ANY (ARRAY['ruta'::text, 'comercio'::text])));
ALTER TABLE public.reviews ADD CONSTRAINT reviews_status_check CHECK ((status = ANY (ARRAY['pendiente'::text, 'aprobado'::text, 'rechazado'::text])));
ALTER TABLE public.reviews ADD CONSTRAINT check_review_target CHECK ((((route_id IS NOT NULL) AND (business_id IS NULL)) OR ((route_id IS NULL) AND (business_id IS NOT NULL))));
ALTER TABLE public.route_completions ADD CONSTRAINT route_completions_status_check CHECK ((status = ANY (ARRAY['en_progreso'::text, 'completado'::text, 'abandonado'::text])));
ALTER TABLE public.notifications ADD CONSTRAINT notifications_notification_type_check CHECK ((notification_type = ANY (ARRAY['orden_recibida'::text, 'orden_lista'::text, 'ruta_comprada'::text, 'ruta_vendida'::text, 'nueva_resena'::text, 'pago_recibido'::text, 'comercio_aprobado'::text, 'ruta_aprobada'::text, 'sistema'::text])));
ALTER TABLE public.business_coupons ADD CONSTRAINT business_coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['porcentaje'::text, 'monto_fijo'::text])));
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_unlock_reason_check CHECK ((unlock_reason = ANY (ARRAY['ruta_completada'::text, 'segmento_completado'::text, 'primer_pedido'::text, 'referido'::text, 'promocion'::text])));

-- =====================================================================
-- FOREIGN KEYS
-- =====================================================================

ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.routes ADD CONSTRAINT routes_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.route_waypoints ADD CONSTRAINT route_waypoints_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.route_businesses ADD CONSTRAINT route_businesses_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.route_businesses ADD CONSTRAINT route_businesses_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD CONSTRAINT orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD CONSTRAINT orders_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE public.route_purchases ADD CONSTRAINT route_purchases_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.route_purchases ADD CONSTRAINT route_purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES route_purchases(id);
ALTER TABLE public.saved_routes ADD CONSTRAINT saved_routes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.saved_routes ADD CONSTRAINT saved_routes_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.route_completions ADD CONSTRAINT route_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.route_completions ADD CONSTRAINT route_completions_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_related_route_id_fkey FOREIGN KEY (related_route_id) REFERENCES routes(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_related_business_id_fkey FOREIGN KEY (related_business_id) REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE public.business_coupons ADD CONSTRAINT business_coupons_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES business_coupons(id) ON DELETE CASCADE;
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_route_completion_id_fkey FOREIGN KEY (route_completion_id) REFERENCES route_completions(id);
ALTER TABLE public.unlocked_coupons ADD CONSTRAINT unlocked_coupons_used_in_order_id_fkey FOREIGN KEY (used_in_order_id) REFERENCES orders(id);
ALTER TABLE public.sponsored_segments ADD CONSTRAINT sponsored_segments_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE public.sponsored_segments ADD CONSTRAINT sponsored_segments_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE public.sponsored_segments ADD CONSTRAINT sponsored_segments_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES business_coupons(id);

-- =====================================================================
-- INDICES BTREE
-- =====================================================================

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_is_creator ON public.profiles USING btree (is_creator) WHERE (is_creator = true);
CREATE INDEX idx_routes_creator ON public.routes USING btree (creator_id);
CREATE INDEX idx_routes_slug ON public.routes USING btree (slug);
CREATE INDEX idx_routes_status ON public.routes USING btree (status);
CREATE INDEX idx_routes_difficulty ON public.routes USING btree (difficulty);
CREATE INDEX idx_routes_municipality ON public.routes USING btree (municipality);
CREATE INDEX idx_routes_is_free ON public.routes USING btree (is_free);
CREATE INDEX idx_waypoints_route ON public.route_waypoints USING btree (route_id);
CREATE INDEX idx_waypoints_type ON public.route_waypoints USING btree (waypoint_type);
CREATE INDEX idx_businesses_owner ON public.businesses USING btree (owner_id);
CREATE INDEX idx_businesses_slug ON public.businesses USING btree (slug);
CREATE INDEX idx_businesses_status ON public.businesses USING btree (status);
CREATE INDEX idx_businesses_type ON public.businesses USING btree (business_type);
CREATE INDEX idx_route_businesses_route ON public.route_businesses USING btree (route_id);
CREATE INDEX idx_route_businesses_business ON public.route_businesses USING btree (business_id);
CREATE INDEX idx_products_business ON public.products USING btree (business_id);
CREATE INDEX idx_products_category ON public.products USING btree (category);
CREATE INDEX idx_products_available ON public.products USING btree (is_available);
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_business ON public.orders USING btree (business_id);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);
CREATE INDEX idx_orders_pickup_time ON public.orders USING btree (estimated_pickup_time);
CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);
CREATE INDEX idx_purchases_route ON public.route_purchases USING btree (route_id);
CREATE INDEX idx_purchases_buyer ON public.route_purchases USING btree (buyer_id);
CREATE INDEX idx_purchases_status ON public.route_purchases USING btree (payment_status);
CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);
CREATE INDEX idx_reviews_route ON public.reviews USING btree (route_id);
CREATE INDEX idx_reviews_business ON public.reviews USING btree (business_id);
CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);
CREATE INDEX idx_saved_routes_user ON public.saved_routes USING btree (user_id);
CREATE INDEX idx_completions_user ON public.route_completions USING btree (user_id);
CREATE INDEX idx_completions_route ON public.route_completions USING btree (route_id);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);
CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);
CREATE INDEX idx_coupons_business ON public.business_coupons USING btree (business_id);
CREATE INDEX idx_coupons_code ON public.business_coupons USING btree (code);
CREATE INDEX idx_unlocked_user ON public.unlocked_coupons USING btree (user_id);
CREATE INDEX idx_unlocked_unused ON public.unlocked_coupons USING btree (user_id, is_used) WHERE (is_used = false);
CREATE INDEX idx_sponsored_business ON public.sponsored_segments USING btree (business_id);
CREATE INDEX idx_sponsored_route ON public.sponsored_segments USING btree (route_id);

-- =====================================================================
-- INDICES GIST (ESPACIALES)
-- =====================================================================

CREATE INDEX idx_routes_route_path ON public.routes USING gist (route_path);
CREATE INDEX idx_routes_start_point ON public.routes USING gist (start_point);
CREATE INDEX idx_routes_end_point ON public.routes USING gist (end_point);
CREATE INDEX idx_waypoints_location ON public.route_waypoints USING gist (location);
CREATE INDEX idx_businesses_location ON public.businesses USING gist (location);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_segments ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- FIN DEL BACKUP
-- =====================================================================
-- NOTA: Este archivo representa el estado actual de la base de datos
--       de produccion al 2026-01-28. NO aplicar en produccion.
--       Este archivo es solo para referencia y respaldo.
-- =====================================================================

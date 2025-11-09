-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL,
  action character varying NOT NULL,
  entity_type character varying NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name character varying NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  subtotal numeric NOT NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL,
  status USER-DEFINED DEFAULT 'pendiente'::order_status,
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ready_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);
CREATE TABLE public.points_of_interest (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  location USER-DEFINED NOT NULL,
  poi_type character varying,
  image_url text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT points_of_interest_pkey PRIMARY KEY (id),
  CONSTRAINT points_of_interest_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  image_url text,
  category character varying,
  is_available boolean DEFAULT true,
  stock_quantity integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);
CREATE TABLE public.purchased_routes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  route_id uuid NOT NULL,
  purchase_price numeric NOT NULL,
  purchased_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchased_routes_pkey PRIMARY KEY (id),
  CONSTRAINT purchased_routes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT purchased_routes_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id)
);
CREATE TABLE public.route_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT route_images_pkey PRIMARY KEY (id),
  CONSTRAINT route_images_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id)
);
CREATE TABLE public.route_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT route_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT route_reviews_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id),
  CONSTRAINT route_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.routes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  creator_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  distance_km numeric NOT NULL CHECK (distance_km > 0::numeric),
  difficulty USER-DEFINED NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  status USER-DEFINED DEFAULT 'borrador'::route_status,
  route_geometry USER-DEFINED,
  gpx_file_url text,
  estimated_time_hours numeric,
  elevation_gain_m integer,
  total_sales integer DEFAULT 0,
  view_count integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT routes_pkey PRIMARY KEY (id),
  CONSTRAINT routes_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.store_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT store_reviews_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id),
  CONSTRAINT store_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  location USER-DEFINED NOT NULL,
  address text,
  phone character varying,
  status USER-DEFINED DEFAULT 'pendiente_aprobacion'::store_status,
  logo_url text,
  business_hours jsonb,
  total_orders integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  transaction_type USER-DEFINED NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  payment_status USER-DEFINED DEFAULT 'pendiente'::payment_status,
  route_id uuid,
  order_id uuid,
  payment_method character varying,
  payment_gateway_id character varying,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id),
  CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'ciclista'::user_role,
  avatar_url text,
  phone character varying,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
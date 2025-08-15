-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  id integer NOT NULL DEFAULT nextval('app_settings_id_seq'::regclass),
  key character varying NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.business_types (
  id integer NOT NULL DEFAULT nextval('business_types_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  icon character varying NOT NULL,
  color character varying NOT NULL,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  image_url character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.businesses (
  id integer NOT NULL DEFAULT nextval('businesses_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  business_type_id integer,
  category_id integer,
  cover_image character varying,
  logo character varying,
  rating numeric DEFAULT 0.0,
  review_count integer DEFAULT 0,
  delivery_time character varying DEFAULT '30-45 min'::character varying,
  delivery_fee integer DEFAULT 5000,
  address text NOT NULL,
  phone character varying,
  email character varying,
  opening_hours character varying,
  cuisine_type character varying,
  latitude numeric,
  longitude numeric,
  is_active boolean DEFAULT true,
  is_open boolean DEFAULT true,
  owner_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  delivery_slots jsonb DEFAULT '[]'::jsonb,
  delivery_zone_id integer,
  delivery_zones jsonb DEFAULT '[]'::jsonb,
  max_orders_per_slot integer DEFAULT 10,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_business_type_id_fkey FOREIGN KEY (business_type_id) REFERENCES public.business_types(id),
  CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.cart (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  business_id integer,
  business_name character varying,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_method character varying DEFAULT 'delivery'::character varying,
  delivery_address text,
  delivery_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_pkey PRIMARY KEY (id),
  CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cart_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cart_id uuid NOT NULL,
  menu_item_id integer,
  name character varying NOT NULL,
  price integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  image character varying,
  special_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  icon character varying NOT NULL,
  color character varying NOT NULL,
  link character varying NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  image character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.delivery_batch_orders (
  batch_id uuid NOT NULL,
  order_id uuid NOT NULL,
  CONSTRAINT delivery_batch_orders_pkey PRIMARY KEY (batch_id, order_id),
  CONSTRAINT delivery_batch_orders_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.delivery_batches(id),
  CONSTRAINT delivery_batch_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.delivery_batches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  driver_id uuid,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_batches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.delivery_offers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  driver_id uuid,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  offered_amount numeric NOT NULL,
  estimated_duration integer,
  estimated_distance numeric,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_offers_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_offers_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT delivery_offers_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.driver_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  driver_id uuid,
  document_type character varying NOT NULL,
  document_number character varying,
  file_url text NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  expiry_date date,
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT driver_documents_pkey PRIMARY KEY (id),
  CONSTRAINT driver_documents_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id)
);
CREATE TABLE public.driver_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_profile_id uuid,
  driver_id uuid,
  vehicle_type character varying,
  vehicle_plate character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT driver_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT driver_profiles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT driver_profiles_user_profile_id_fkey FOREIGN KEY (user_profile_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.drivers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  phone character varying NOT NULL,
  email character varying,
  business_id integer,
  is_active boolean DEFAULT true,
  current_location jsonb,
  rating numeric DEFAULT 0.0,
  total_deliveries integer DEFAULT 0,
  vehicle_type character varying,
  vehicle_plate character varying,
  total_earnings numeric DEFAULT 0.0,
  is_verified boolean DEFAULT false,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  driver_type character varying DEFAULT 'independent'::character varying,
  documents_count integer DEFAULT 0,
  active_sessions integer DEFAULT 0,
  last_active timestamp with time zone,
  user_id uuid,
  CONSTRAINT drivers_pkey PRIMARY KEY (id),
  CONSTRAINT drivers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.favorite_businesses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  business_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorite_businesses_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_businesses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT favorite_businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.favorite_menu_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  menu_item_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorite_menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_menu_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id),
  CONSTRAINT favorite_menu_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.menu_categories (
  id integer NOT NULL DEFAULT nextval('menu_categories_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  business_id integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_categories_pkey PRIMARY KEY (id),
  CONSTRAINT menu_categories_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.menu_items (
  id integer NOT NULL DEFAULT nextval('menu_items_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  price integer NOT NULL,
  image character varying,
  category_id integer,
  business_id integer,
  is_popular boolean DEFAULT false,
  is_available boolean DEFAULT true,
  allergens jsonb DEFAULT '[]'::jsonb,
  nutritional_info jsonb DEFAULT '{}'::jsonb,
  preparation_time integer,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id)
);
CREATE TABLE public.notification_types (
  id integer NOT NULL DEFAULT nextval('notification_types_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  icon character varying NOT NULL,
  color character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  priority character varying DEFAULT 'medium'::character varying,
  is_read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  status character varying NOT NULL,
  description text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_statuses (
  id integer NOT NULL DEFAULT nextval('order_statuses_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  label character varying NOT NULL,
  color character varying NOT NULL,
  icon character varying NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  business_id integer,
  business_name character varying NOT NULL,
  items jsonb NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  total integer NOT NULL,
  delivery_fee integer DEFAULT 0,
  tax integer DEFAULT 0,
  grand_total integer NOT NULL,
  delivery_method character varying DEFAULT 'delivery'::character varying,
  delivery_address text,
  delivery_instructions text,
  payment_method character varying DEFAULT 'cash'::character varying,
  payment_status character varying DEFAULT 'pending'::character varying,
  estimated_delivery timestamp with time zone,
  actual_delivery timestamp with time zone,
  driver_id uuid,
  driver_name character varying,
  driver_phone character varying,
  driver_location jsonb,
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_review text,
  pickup_coordinates jsonb,
  delivery_coordinates jsonb,
  estimated_pickup_time timestamp with time zone,
  estimated_delivery_time timestamp with time zone,
  actual_pickup_time timestamp with time zone,
  actual_delivery_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  preferred_delivery_time timestamp with time zone,
  delivery_type character varying DEFAULT 'asap'::character varying CHECK (delivery_type::text = ANY (ARRAY['asap'::character varying, 'scheduled'::character varying]::text[])),
  available_for_drivers boolean DEFAULT false,
  scheduled_delivery_window_start timestamp with time zone,
  scheduled_delivery_window_end timestamp with time zone,
  landmark character varying,
  order_number character varying,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.payment_methods (
  id integer NOT NULL DEFAULT nextval('payment_methods_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  icon character varying NOT NULL,
  description text,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  amount integer NOT NULL,
  method character varying NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  transaction_id character varying,
  gateway_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['partner'::character varying, 'driver'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'under_review'::character varying]::text[])),
  user_id uuid,
  user_name character varying NOT NULL,
  user_email character varying NOT NULL,
  user_phone character varying NOT NULL,
  business_name character varying,
  business_type character varying,
  business_address text,
  vehicle_type character varying,
  vehicle_plate character varying,
  documents jsonb DEFAULT '[]'::jsonb,
  notes text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  CONSTRAINT requests_pkey PRIMARY KEY (id),
  CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.reservation_statuses (
  id integer NOT NULL DEFAULT nextval('reservation_statuses_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  label character varying NOT NULL,
  color character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservation_statuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  business_id integer,
  business_name character varying NOT NULL,
  date date NOT NULL,
  time time without time zone NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  status character varying DEFAULT 'pending'::character varying,
  special_requests text,
  table_number integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  user_name character varying NOT NULL,
  business_id integer,
  order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  images jsonb DEFAULT '[]'::jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.user_addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  label character varying NOT NULL,
  street character varying NOT NULL,
  city character varying NOT NULL,
  state character varying NOT NULL,
  postal_code character varying,
  country character varying DEFAULT 'Guinée'::character varying,
  latitude numeric,
  longitude numeric,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_addresses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role_id integer DEFAULT 1,
  phone_number character varying,
  address text,
  profile_image character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bio text,
  website text,
  social_media text,
  date_of_birth date,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),
  city text,
  postal_code text,
  country text DEFAULT 'Guinée'::text,
  is_verified boolean DEFAULT false,
  is_manual_creation boolean DEFAULT false,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT user_profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id)
);
CREATE TABLE public.user_push_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  expo_push_token text NOT NULL UNIQUE,
  device_type character varying NOT NULL DEFAULT 'unknown'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT user_push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  id integer NOT NULL DEFAULT nextval('user_roles_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.work_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  driver_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  total_earnings numeric DEFAULT 0.0,
  total_deliveries integer DEFAULT 0,
  total_distance numeric DEFAULT 0.0,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT work_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT work_sessions_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id)
);
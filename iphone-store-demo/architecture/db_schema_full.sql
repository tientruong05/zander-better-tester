-- ============================================================
-- IPHONE STORE DEMO
-- CONSOLIDATED DATABASE SCHEMA (LATEST)
-- ============================================================
-- Consolidated, idempotent schema for the iPhone Store demo.
-- It contains every table, function and RLS policy used by the
-- application and by the automated-test tooling (orders.user_id,
-- owner RLS policies, and a fixed handle_new_user trigger).
--
-- Safe to run on:
--   1. A fresh Supabase project (recommended).
--   2. The existing project: it creates missing objects, adds
--      missing columns, replaces policies/functions, and removes
--      legacy events/kit-sales objects. It does not delete rows
--      from the current products/orders/users tables.
--
-- After running this script:
--   1. Create the public storage bucket named "product-images"
--      (Storage > Buckets > New bucket > Public).
--   2. Run architecture/seed_iphone.sql to load the iPhone catalog.
--   3. Optional: use POST /api/test/seed for deterministic test data.
--
-- NOTE: Comments are in English on purpose (see project rules).
-- ============================================================

-- ============================================================
-- SECTION 0: EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- Application users. Rows mirror auth.users.
-- Used by admins and by the automated tests (seeded accounts).
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extra columns for older installations that predate this file.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Product categories.
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- Products.
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_en TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Product gallery images.
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE
);

-- Orders.
-- Status lifecycle:
--   pending -> paid -> processing -> shipping -> completed
--   pending -> cancelled (auto after 3 days, or manually)
--   paid -> failed (delivery failed)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_link_url TEXT,
  payment_method VARCHAR DEFAULT 'bank_transfer',
  delivery_method VARCHAR DEFAULT 'shipping',
  collection_point_id UUID,
  language TEXT DEFAULT 'vi',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Extra columns for older installations.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_link_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR DEFAULT 'bank_transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR DEFAULT 'shipping';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS collection_point_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'vi';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Order line items.
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Payment attempts (PayOS or mock gateway).
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_link_id TEXT,
  checkout_url TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Raw webhook log (debugging).
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id),
  order_code BIGINT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pickup locations shown at checkout.
CREATE TABLE IF NOT EXISTS public.collection_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- The admin orders page joins collection_points using the named
-- relationship hint `collection_points!orders_collection_point_id_fkey`,
-- so this exact constraint name is required.
UPDATE public.orders o
SET collection_point_id = NULL
WHERE o.collection_point_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.collection_points cp WHERE cp.id = o.collection_point_id
  );

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_collection_point_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_collection_point_id_fkey
  FOREIGN KEY (collection_point_id) REFERENCES public.collection_points(id);

-- Guest product reviews.
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Visit counter (anonymous site analytics).
CREATE TABLE IF NOT EXISTS public.site_visits (
  id TEXT PRIMARY KEY DEFAULT 'main',
  total_visits BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin notification forwarding rules.
CREATE TABLE IF NOT EXISTS public.forward_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_email TEXT NOT NULL,
  forward_to_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SECTION 2: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_forward_email_source ON public.forward_email(source_email) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_forward_email_active ON public.forward_email(is_active);

-- ============================================================
-- SECTION 3: FUNCTIONS AND TRIGGERS
-- ============================================================

-- Keep orders.updated_at fresh on every update.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mirror new auth users into public.users.
-- IMPORTANT: the version previously committed to db_schema.sql passed
-- five values for four columns, which broke auth.admin.createUser().
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_admin, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    FALSE,
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for auth users created before the trigger was fixed.
INSERT INTO public.users (id, email, full_name, is_admin, is_active)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  FALSE,
  TRUE
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Atomic stock decrement (called by payment webhook / mock payment).
CREATE OR REPLACE FUNCTION public.decrease_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Atomic visit counter increment.
CREATE OR REPLACE FUNCTION public.increment_site_visits(count_to_add BIGINT DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
  new_total BIGINT;
BEGIN
  UPDATE public.site_visits
  SET total_visits = total_visits + count_to_add,
      updated_at = NOW()
  WHERE id = 'main'
  RETURNING total_visits INTO new_total;
  RETURN new_total;
END;
$$ LANGUAGE plpgsql;

-- forward_email.updated_at trigger.
CREATE OR REPLACE FUNCTION public.update_forward_email_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forward_email_update_timestamp ON public.forward_email;
CREATE TRIGGER forward_email_update_timestamp
  BEFORE UPDATE ON public.forward_email
  FOR EACH ROW EXECUTE FUNCTION public.update_forward_email_timestamp();

-- SECURITY DEFINER helper used inside RLS policies to avoid recursion.
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.get_is_admin CASCADE;

CREATE OR REPLACE FUNCTION public.get_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  is_admin_val BOOLEAN;
BEGIN
  SELECT is_admin INTO is_admin_val FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(is_admin_val, FALSE);
END;
$$;

-- ============================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================

-- ---- USERS ----
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View Users" ON public.users;
CREATE POLICY "View Users" ON public.users FOR SELECT
  USING (auth.uid() = id OR get_is_admin() = TRUE);
DROP POLICY IF EXISTS "Update Users" ON public.users;
CREATE POLICY "Update Users" ON public.users FOR UPDATE
  USING (get_is_admin() = TRUE);

-- ---- CATEGORIES ----
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View Categories" ON public.categories;
CREATE POLICY "View Categories" ON public.categories FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Manage Categories" ON public.categories;
CREATE POLICY "Manage Categories" ON public.categories FOR ALL
  USING (get_is_admin() = TRUE);

-- ---- PRODUCTS ----
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View Products" ON public.products;
CREATE POLICY "View Products" ON public.products FOR SELECT
  USING (is_active = TRUE OR get_is_admin() = TRUE);
DROP POLICY IF EXISTS "Manage Products" ON public.products;
CREATE POLICY "Manage Products" ON public.products FOR ALL
  USING (get_is_admin() = TRUE);

-- ---- PRODUCT IMAGES ----
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT
  USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL
  USING (get_is_admin() = TRUE);

-- ---- ORDERS ----
-- Customers can read their own orders; admins can read/update all.
-- Orders are created by server-side API routes with the service role
-- (service role bypasses RLS), so no public INSERT policy is needed.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view orders with order_code" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "System can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT
  USING (get_is_admin() = TRUE);
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE
  USING (get_is_admin() = TRUE);

-- ---- ORDER ITEMS ----
-- Items are created by server-side API routes with the service role.
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT
  USING (get_is_admin() = TRUE);
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- ---- PAYMENTS ----
-- Customers can read their own payments; admins can read all.
-- Writes are done by server-side API routes with the service role.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;
DROP POLICY IF EXISTS "System can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Admins can view payments" ON public.payments FOR SELECT
  USING (get_is_admin() = TRUE);
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id AND o.user_id = auth.uid()
    )
  );

-- ---- PAYMENT WEBHOOKS ----
-- Only service-role routes access this table; no anon policies.
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can manage webhooks" ON public.payment_webhooks;

-- ---- COLLECTION POINTS ----
ALTER TABLE public.collection_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.collection_points;
CREATE POLICY "Allow public read access" ON public.collection_points FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage collection points" ON public.collection_points;
CREATE POLICY "Admins can manage collection points" ON public.collection_points FOR ALL
  USING (get_is_admin() = TRUE);

-- ---- PRODUCT REVIEWS ----
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view reviews" ON public.product_reviews FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.product_reviews;
CREATE POLICY "Anyone can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.product_reviews;
CREATE POLICY "Admins can manage reviews" ON public.product_reviews FOR ALL
  USING (get_is_admin() = TRUE);

-- ---- SITE VISITS ----
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view site visits" ON public.site_visits;
CREATE POLICY "Public can view site visits" ON public.site_visits FOR SELECT USING (TRUE);

-- ---- FORWARD EMAIL ----
ALTER TABLE public.forward_email ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view forward emails" ON public.forward_email;
CREATE POLICY "Admins can view forward emails" ON public.forward_email FOR SELECT
  USING (get_is_admin() = TRUE);
DROP POLICY IF EXISTS "Admins can manage forward emails" ON public.forward_email;
CREATE POLICY "Admins can manage forward emails" ON public.forward_email FOR ALL
  USING (get_is_admin() = TRUE);

-- ============================================================
-- SECTION 5: STORAGE POLICIES (bucket: product-images)
-- ============================================================
-- Prerequisite: create a PUBLIC bucket named "product-images".

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE))
);

CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE))
);

CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE))
);

-- ============================================================
-- SECTION 6: DEFAULT / CONFIGURATION DATA (idempotent)
-- ============================================================

-- Pickup locations.
INSERT INTO public.collection_points (name, address)
SELECT 'iPhone Store Quận 1', '123 Demo Street, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
WHERE NOT EXISTS (SELECT 1 FROM public.collection_points WHERE name = 'iPhone Store Quận 1');

INSERT INTO public.collection_points (name, address)
SELECT 'iPhone Store Quận 3', '45 Demo Avenue, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh'
WHERE NOT EXISTS (SELECT 1 FROM public.collection_points WHERE name = 'iPhone Store Quận 3');

INSERT INTO public.collection_points (name, address)
SELECT 'iPhone Store Thủ Đức', '67 Demo Road, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh'
WHERE NOT EXISTS (SELECT 1 FROM public.collection_points WHERE name = 'iPhone Store Thủ Đức');

INSERT INTO public.collection_points (name, address)
SELECT 'iPhone Store Bình Thạnh', '89 Demo Lane, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh'
WHERE NOT EXISTS (SELECT 1 FROM public.collection_points WHERE name = 'iPhone Store Bình Thạnh');

-- Visit counter row.
INSERT INTO public.site_visits (id, total_visits)
VALUES ('main', 0)
ON CONFLICT (id) DO NOTHING;

-- Default forwarding rule (update the target Gmail in the admin UI).
INSERT INTO public.forward_email (source_email, forward_to_email, is_active)
SELECT 'no-reply@example.com', 'admin@example.com', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.forward_email
  WHERE source_email = 'no-reply@example.com'
    AND forward_to_email = 'admin@example.com'
);

-- ============================================================
-- SECTION 7: LEGACY CLEANUP (original project)
-- ============================================================
-- The demo store now uses products + categories only. These statements
-- are safe to re-run and remove objects from older installations.

ALTER TABLE public.products DROP COLUMN IF EXISTS event_id;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.kit_sales_offset;

-- Refresh PostgREST schema cache so new FKs/policies are visible immediately.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- SECTION 8: VERIFICATION (optional, read-only)
-- ============================================================

-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'orders' ORDER BY ordinal_position;
-- SELECT email, is_admin FROM public.users ORDER BY created_at;
-- SELECT name FROM public.collection_points ORDER BY name;

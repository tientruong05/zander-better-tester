-- ============================================================
-- IPHONE STORE DEMO — CATALOG SEED
-- ============================================================
-- WARNING: this script deletes all catalog + order data before
-- inserting the iPhone demo catalog. Auth users are preserved.
--
-- Run after architecture/db_schema_full.sql.
-- Categories: iPhone 13, 14, 15, 16, 17, 18.
-- Products: 4 models per series (24 products total).
--
-- Image: /iphone.svg (served from the public folder).
-- ============================================================

BEGIN;

TRUNCATE TABLE
  public.payment_webhooks,
  public.payments,
  public.order_items,
  public.orders,
  public.product_reviews,
  public.product_images,
  public.products,
  public.categories,
  public.collection_points
RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------
-- Pickup locations
-- ------------------------------------------------------------
INSERT INTO public.collection_points (name, address, is_active) VALUES
  ('iPhone Store Quận 1', '123 Demo Street, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', TRUE),
  ('iPhone Store Quận 3', '45 Demo Avenue, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh', TRUE),
  ('iPhone Store Thủ Đức', '67 Demo Road, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh', TRUE),
  ('iPhone Store Bình Thạnh', '89 Demo Lane, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh', TRUE);

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
INSERT INTO public.categories (name, name_en, slug, is_active, sort_order) VALUES
  ('iPhone 13', 'iPhone 13', 'iphone-13', TRUE, 1),
  ('iPhone 14', 'iPhone 14', 'iphone-14', TRUE, 2),
  ('iPhone 15', 'iPhone 15', 'iphone-15', TRUE, 3),
  ('iPhone 16', 'iPhone 16', 'iphone-16', TRUE, 4),
  ('iPhone 17', 'iPhone 17', 'iphone-17', TRUE, 5),
  ('iPhone 18', 'iPhone 18', 'iphone-18', TRUE, 6);

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
INSERT INTO public.products (
  category_id,
  name,
  name_en,
  slug,
  description,
  description_en,
  price,
  sale_price,
  stock,
  sku,
  is_active,
  image_url
)
SELECT
  c.id,
  v.name,
  v.name,
  v.slug,
  v.name || ' chính hãng, bảo hành 12 tháng. Dung lượng 128GB, nhiều màu sắc để lựa chọn.',
  v.name || ' — 128GB, official 12-month warranty.',
  v.price,
  v.sale_price,
  v.stock,
  v.sku,
  TRUE,
  '/iphone.svg'
FROM (VALUES
  ('iphone-13', 'iPhone 13',          'iphone-13',          'IPHONE-001', 14990000::numeric, NULL::numeric,    27),
  ('iphone-13', 'iPhone 13 mini',     'iphone-13-mini',     'IPHONE-002', 13990000::numeric, NULL::numeric,    34),
  ('iphone-13', 'iPhone 13 Pro',      'iphone-13-pro',      'IPHONE-003', 18990000::numeric, 18490000::numeric, 41),
  ('iphone-13', 'iPhone 13 Pro Max',  'iphone-13-pro-max',  'IPHONE-004', 21990000::numeric, NULL::numeric,    48),

  ('iphone-14', 'iPhone 14',          'iphone-14',          'IPHONE-005', 16990000::numeric, NULL::numeric,    25),
  ('iphone-14', 'iPhone 14 Plus',     'iphone-14-plus',     'IPHONE-006', 19990000::numeric, 19490000::numeric, 32),
  ('iphone-14', 'iPhone 14 Pro',      'iphone-14-pro',      'IPHONE-007', 22990000::numeric, NULL::numeric,    39),
  ('iphone-14', 'iPhone 14 Pro Max',  'iphone-14-pro-max',  'IPHONE-008', 25990000::numeric, NULL::numeric,    46),

  ('iphone-15', 'iPhone 15',          'iphone-15',          'IPHONE-009', 19990000::numeric, 19490000::numeric, 23),
  ('iphone-15', 'iPhone 15 Plus',     'iphone-15-plus',     'IPHONE-010', 22990000::numeric, NULL::numeric,    30),
  ('iphone-15', 'iPhone 15 Pro',      'iphone-15-pro',      'IPHONE-011', 26990000::numeric, NULL::numeric,    37),
  ('iphone-15', 'iPhone 15 Pro Max',  'iphone-15-pro-max',  'IPHONE-012', 29990000::numeric, 29490000::numeric, 44),

  ('iphone-16', 'iPhone 16',          'iphone-16',          'IPHONE-013', 22990000::numeric, NULL::numeric,    21),
  ('iphone-16', 'iPhone 16 Plus',     'iphone-16-plus',     'IPHONE-014', 25990000::numeric, NULL::numeric,    28),
  ('iphone-16', 'iPhone 16 Pro',      'iphone-16-pro',      'IPHONE-015', 29990000::numeric, 29490000::numeric, 35),
  ('iphone-16', 'iPhone 16 Pro Max',  'iphone-16-pro-max',  'IPHONE-016', 33990000::numeric, NULL::numeric,    42),

  ('iphone-17', 'iPhone 17',          'iphone-17',          'IPHONE-017', 25990000::numeric, NULL::numeric,    49),
  ('iphone-17', 'iPhone 17 Plus',     'iphone-17-plus',     'IPHONE-018', 28990000::numeric, 28490000::numeric, 26),
  ('iphone-17', 'iPhone 17 Pro',      'iphone-17-pro',      'IPHONE-019', 33990000::numeric, NULL::numeric,    33),
  ('iphone-17', 'iPhone 17 Pro Max',  'iphone-17-pro-max',  'IPHONE-020', 37990000::numeric, NULL::numeric,    40),

  ('iphone-18', 'iPhone 18',          'iphone-18',          'IPHONE-021', 28990000::numeric, 28490000::numeric, 47),
  ('iphone-18', 'iPhone 18 Plus',     'iphone-18-plus',     'IPHONE-022', 31990000::numeric, NULL::numeric,    24),
  ('iphone-18', 'iPhone 18 Pro',      'iphone-18-pro',      'IPHONE-023', 36990000::numeric, NULL::numeric,    31),
  ('iphone-18', 'iPhone 18 Pro Max',  'iphone-18-pro-max',  'IPHONE-024', 41990000::numeric, 41490000::numeric, 38)
) AS v(category_slug, name, slug, sku, price, sale_price, stock)
JOIN public.categories c ON c.slug = v.category_slug;

-- ------------------------------------------------------------
-- Primary image for every product
-- ------------------------------------------------------------
INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary)
SELECT id, '/iphone.svg', 0, TRUE
FROM public.products;

COMMIT;

-- Verify:
-- SELECT c.name AS category, COUNT(p.id) AS products
-- FROM public.categories c LEFT JOIN public.products p ON p.category_id = c.id
-- GROUP BY c.name ORDER BY c.sort_order;

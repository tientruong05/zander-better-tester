# TESTING.md — iPhone Store test environment guide

This document describes every test hook in the demo iPhone store so that
Playwright (UI), JMeter (API/load) or another AI agent can write tests
without reverse-engineering the code.

> This is a learning environment. Test hooks are disabled by default and
> must never be enabled on a public production deployment.

## 1. Quick start

```powershell
# from the repository root
cd iphone-store-demo
Copy-Item .env.example .env.local   # then fill in real values
npm install
npm run dev
# -> http://localhost:3000
```

Required one-time database setup:

1. Open the Supabase SQL Editor.
2. Run `architecture/db_schema_full.sql` (consolidated, idempotent schema).
3. Run `architecture/seed_iphone.sql` (iPhone 13–18 catalog).
4. Create a public Storage bucket named `product-images`.

Then enable test mode in `.env.local`:

```dotenv
PAYMENT_MODE=mock
ENABLE_TEST_API=true
NEXT_PUBLIC_URL=http://localhost:3000
```

Restart the dev server after changing environment variables.

## 2. Environment variables

Copy `.env.example` to `.env.local`. The sample file contains every variable
with placeholder/empty values.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (test APIs, seed/reset) |
| `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | Real PayOS credentials |
| `NEXT_PUBLIC_URL` | Public base URL used in links/emails |
| `SMTP_USER` / `SMTP_PASSWORD` | Nodemailer credentials |
| `ADMIN_EMAIL` | Admin notification inbox (default `admin@example.com`) |
| `CRON_SECRET` | Header secret for `/api/orders/cancel-expired-orders` |
| `PAYMENT_MODE` | `real` = PayOS; `mock` = local mock gateway (default `real`) |
| `MOCK_PAYMENT_DELAY_MS` | Simulated gateway delay, default `1000` (0–30000) |
| `ENABLE_TEST_API` | `true` enables `/api/test/*` (or use `NODE_ENV=test`) |
| `RATE_LIMIT_MAX` | Requests per IP per window; default `10`, `0` = disabled |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window, default `60000` |

Recommendations:

- Playwright suite: `RATE_LIMIT_MAX=1000` so UI tests are not throttled.
- JMeter rate-limit scenario: keep `RATE_LIMIT_MAX=10`.
- JMeter throughput scenario: raise the limit (e.g. `100000`) and restart.

## 3. Test accounts (created by seed)

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@test.local` | `Admin123!` | `public.users.is_admin = true` |
| Customer | `customer@test.local` | `Customer123!` | phone `0900000001` |

These accounts only exist after calling `POST /api/test/seed`.

## 4. iPhone catalog and seed data

### `architecture/seed_iphone.sql`

Destructive catalog seed (users are preserved). It truncates orders,
payments, reviews, images, products and categories, then inserts:

- 6 categories: **iPhone 13, iPhone 14, iPhone 15, iPhone 16, iPhone 17,
  iPhone 18** (slugs `iphone-13` … `iphone-18`).
- 24 products (4 per series): standard, mini (13 only) / Plus, Pro, Pro Max.
- 1 primary image per product: `/iphone.svg`.
- 4 generic pickup locations (`iPhone Store Quận 1`, `Quận 3`, `Thủ Đức`,
  `Bình Thạnh`).
- Prices from 13,990,000₫ to 41,990,000₫, deterministic `sale_price` on some
  models, stock 20–50.

Product slugs follow a predictable pattern:

```
iphone-13, iphone-13-mini, iphone-13-pro, iphone-13-pro-max
iphone-14, iphone-14-plus, iphone-14-pro, iphone-14-pro-max
...
iphone-18, iphone-18-plus, iphone-18-pro, iphone-18-pro-max
```

### `POST /api/test/seed`

Creates the **same iPhone catalog**, the two test accounts, one pickup point
and one order per status. `reset` defaults to `true`, so it wipes the
database first and is idempotent.

Body:

```json
{
  "includeOrders": true,
  "reset": true
}
```

Created orders (`order_code` = `9900000000001..9900000000007`):

| Order code | Status |
|---|---|
| `9900000000001` | `pending` |
| `9900000000002` | `paid` |
| `9900000000003` | `processing` |
| `9900000000004` | `shipping` |
| `9900000000005` | `completed` |
| `9900000000006` | `cancelled` |
| `9900000000007` | `failed` |

All seeded orders:
- belong to the customer account (`orders.user_id`),
- use phone `0900000001` (last 4 digits `0001` for `/track-order`),
- use payment method `bank_transfer`,
- contain two iPhone products (quantities 2 and 1),
- have a matching `payments` row.

The catalog has 24 products, which is exactly two product pages (page size 12).

> Running `/api/test/seed` (and `/api/test/reset`) wipes the iPhone catalog
> and recreates it. It never leaves the store empty.

## 5. Test APIs

All endpoints under `/api/test/*` return **404** unless
`ENABLE_TEST_API=true` or `NODE_ENV=test`.

### `POST /api/test/seed`

Returns generated IDs for tests:

```json
{
  "success": true,
  "accounts": {
    "admin": { "id": "uuid", "email": "admin@test.local", "is_admin": true },
    "customer": { "id": "uuid", "email": "customer@test.local", "is_admin": false }
  },
  "categories": [{ "id": "uuid", "slug": "iphone-13", "name": "iPhone 13" }],
  "products": [{ "id": "uuid", "slug": "iphone-13", "name": "iPhone 13", "price": 14990000, "sale_price": null, "stock": 27 }],
  "collectionPoint": { "id": "uuid", "name": "[TEST] Pickup Point", "address": "..." },
  "orders": [{ "id": "uuid", "order_code": 9900000000001, "status": "pending", "order_items": 2 }]
}
```

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/test/seed `
  -ContentType "application/json" -Body '{}'
```

### `POST /api/test/reset`

**Full wipe**: deletes orders, payments, order items, payment webhooks,
reviews, product images, products, categories, collection points and
forwarding rules, and **all users** (public + Supabase Auth).

Use `{ "keepUsers": true }` to preserve auth users.

Response:

```json
{
  "success": true,
  "keepUsers": false,
  "deleted": {
    "users": 2, "orders": 7, "order_items": 14, "payments": 7,
    "payment_webhooks": 0, "products": 24, "product_images": 24,
    "product_reviews": 0, "categories": 6,
    "collection_points": 1, "forward_email": 1
  }
}
```

### `POST /api/test/create-order`

Creates one guest order without going through checkout. Stock is **not**
decremented. Guest orders do not appear on `/orders` (which is scoped to the
logged-in user).

```json
{
  "status": "paid",
  "productId": "uuid (optional; defaults to first active product)",
  "quantity": 1,
  "customer": {
    "fullName": "Nguyen Van A",
    "email": "a@example.com",
    "phone": "0912345678",
    "address": "123 Test Street"
  },
  "paymentMethod": "bank_transfer",
  "deliveryMethod": "shipping"
}
```

`status` must be one of:
`pending`, `paid`, `processing`, `shipping`, `completed`, `cancelled`, `failed`.

### `POST /api/test/auth-token`

Exchanges credentials for a Bearer token (useful for JMeter).

```json
{ "email": "admin@test.local", "password": "Admin123!" }
```

Response:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1767225600,
  "user": { "id": "uuid", "email": "admin@test.local" },
  "is_admin": true
}
```

Use `Authorization: Bearer <access_token>` for protected endpoints.
Supabase tokens expire after `expires_in` seconds (default 3600). For long
JMeter runs, call `/api/test/auth-token` again or refresh via Supabase's
`POST {SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`.

## 6. Mock payment

Set `PAYMENT_MODE=mock` and restart. Then:

1. Add a product to the cart and go to `/checkout`.
2. Complete the 3 steps and submit with **bank transfer**.
3. The browser redirects to
   `/checkout/mock-payment?orderId=<order-uuid>`.
4. Click:
   - `mock-payment-success-button` → order becomes `paid` (payment row `paid`,
     stock decremented), or
   - `mock-payment-failure-button` → order becomes `failed`.
5. The API waits `MOCK_PAYMENT_DELAY_MS` before applying the result.
6. The page redirects to `/orders/<order-uuid>`.

Notes:
- Cash orders work normally (no mock page).
- Emails are **not sent** when `PAYMENT_MODE=mock`.
- `POST /api/payment/mock` and the mock page return 404 unless
  `PAYMENT_MODE=mock`.
- The real PayOS code path is used when `PAYMENT_MODE=real`.

## 7. Rate limiting

Applied to:

- `POST /api/checkout`
- `GET /api/orders`

Defaults: 10 requests per 60 seconds per IP. On overflow:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 42
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1767225642
```

```json
{ "error": "Too many requests. Please try again later.", "retryAfter": 42 }
```

The limiter is in-memory (one process). Restarting the server resets it.
`RATE_LIMIT_MAX=0` disables rate limiting.

## 8. Order status lifecycle

Canonical values used by the UI and APIs:

```
pending -> paid -> processing -> shipping -> completed
pending -> cancelled
paid    -> failed
```

Additional rules:
- Cash orders start at `processing`; stock is decremented at checkout.
- Bank-transfer orders start at `pending`; stock is decremented when a
  successful payment is recorded (webhook or mock success).
- `cancelled` and `failed` are terminal.
- Admin can set any status from `/admin/orders`.
- `types/index.ts` still mentions the legacy value `shipped`; the application
  uses `shipping`. Always use `shipping` in tests.

## 9. data-testid convention

Naming: `[area]-[component]-[action]` (see `TEST_IDS.md` for the complete
list). Dynamic containers use a suffix:

```html
<Link data-testid="product-card-iphone-13"> ... </Link>
```

Scope queries to the container:

```python
card = page.get_by_test_id("product-card-iphone-13")
card.get_by_test_id("product-card-title").click()
```

Some repeated children intentionally share the same testid (e.g.
`cart-item-remove-button`); scope by the parent row testid or use `.nth()`.

## 10. Playwright recipe (pytest + POM)

Suggested structure:

```
python-playwright/
├── pages/
├── tests/
├── conftest.py
├── pytest.ini
├── requirements.txt
└── .env            # BASE_URL=http://localhost:3000
```

`conftest.py` outline:

```python
import os
import pytest
import requests

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

@pytest.fixture(scope="session", autouse=True)
def seed_data():
    response = requests.post(f"{BASE_URL}/api/test/seed", json={})
    response.raise_for_status()
    return response.json()

@pytest.fixture
def base_url():
    return BASE_URL
```

Admin login via UI:

```python
def test_admin_login(page, base_url):
    page.goto(f"{base_url}/admin/login")
    page.get_by_test_id("admin-login-email-input").fill("admin@test.local")
    page.get_by_test_id("admin-login-password-input").fill("Admin123!")
    page.get_by_test_id("admin-login-submit-button").click()
    page.wait_for_url(f"{base_url}/admin")
```

Checkout with mock payment:

```python
page.goto(f"{base_url}/products/iphone-13")
page.get_by_test_id("product-detail-add-to-cart-button").click()
page.goto(f"{base_url}/checkout")
page.get_by_test_id("checkout-step1-fullname-input").fill("Test User")
page.get_by_test_id("checkout-step1-phone-input").fill("0912345678")
page.get_by_test_id("checkout-step1-email-input").fill("test@example.com")
page.get_by_test_id("checkout-step1-continue-button").click()
# pickup is the default and the first seeded collection point is pre-selected
page.get_by_test_id("checkout-step2-continue-button").click()
page.get_by_test_id("checkout-step3-continue-button").click()
page.get_by_test_id("checkout-submit-button").click()
page.wait_for_url("**/checkout/mock-payment?orderId=*")
page.get_by_test_id("mock-payment-success-button").click()
page.wait_for_url("**/orders/*")
```

API test:

```python
def test_admin_orders_api(seed_data):
    token = requests.post(
        f"{BASE_URL}/api/test/auth-token",
        json={"email": "admin@test.local", "password": "Admin123!"},
    ).json()["access_token"]
    response = requests.get(
        f"{BASE_URL}/api/orders",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
```

## 11. JMeter recipe

Recommended plan structure:

```
Test Plan
├── User Defined Variables
│     BASE_URL = http://localhost:3000
│     BASE_HOST = localhost
│     BASE_PORT = 3000
├── setUp Thread Group (1 thread, 1 loop)
│     ├── HTTP Request: POST /api/test/seed
│     └── HTTP Request: POST /api/test/auth-token
│           └── JSON Extractor: access_token -> ${authToken}
└── Main Thread Group (N threads)
      ├── HTTP Header Manager: Authorization = Bearer ${authToken}
      ├── HTTP Request: GET /api/products
      ├── HTTP Request: GET /api/orders
      ├── HTTP Request: GET /api/track-order?code=9900000000001&phone4=0001
      └── Response Assertion: 200 (and 429 in the rate-limit scenario)
```

JMeter notes:
- Use a **JSON Extractor** on `/api/test/auth-token`:
  `$..access_token` → variable `authToken`.
- Do not send a body for GET requests.
- Seed once per run; seeding is destructive.
- For write load tests, prefer `/api/test/create-order` over `/api/checkout`
  to avoid PayOS/email side effects.
- Default rate limit is 10 req/min/IP. For throughput tests set a high
  `RATE_LIMIT_MAX` (e.g. `100000`) in `.env.local` and restart. Keep the
  default when testing 429 behavior.
- Seeded order codes are deterministic, so CSV data is optional.

## 12. Security and production safety

- `ENABLE_TEST_API=false` and `PAYMENT_MODE=real` are the production-safe
  defaults. All test routes and the mock payment page return 404, and no test
  data can be created or wiped.
- Test APIs use the Supabase service-role key. Never enable them on a public
  deployment.
- Admin route protection is client-side (AuthContext + RLS). It is not a
  server-side security boundary.

## 13. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/api/test/*` returns 404 | `ENABLE_TEST_API` is not `true` and `NODE_ENV` is not `test`; restart after changing `.env.local` |
| Mock page returns 404 | `PAYMENT_MODE` is not `mock`; restart the server |
| Seed fails with `handle_new_user` error | Run `architecture/db_schema_full.sql` in the Supabase SQL Editor |
| Seed fails creating orders with `user_id` | The migration was not applied; the seed retries without `user_id`, but `/orders` UI tests need it |
| Store shows no products | Run `architecture/seed_iphone.sql` or `POST /api/test/seed` |
| Checkout shows "loading pickup locations" forever | No active `collection_points`; run `/api/test/seed` |
| Admin login succeeds but `/admin` redirects home | The account is not an admin (`public.users.is_admin`) |
| 429 during Playwright | Raise `RATE_LIMIT_MAX` or wait for the window to reset |
| JMeter token invalid after ~1 hour | Re-run `/api/test/auth-token` or refresh the token |
| `npm run dev` fails without Supabase vars | Copy `.env.example` to `.env.local` and fill it in |

## 14. Known limitations

- The app has no automated test suite of its own; this document only provides
  the hooks.
- Rate limiting is per-process and in-memory.
- Seed/reset are destructive and share the Supabase project used by the app.
- Emails are skipped in mock payment mode.
- `types/index.ts` still contains the legacy `shipped` status; use `shipping`.
- The event feature, kit-sales campaign and policy pages from the original
  project were removed. Only products + categories are used for the storefront.
- Admin pages fetch data directly from Supabase with the browser session
  (RLS), not through API routes. Only `/api/admin/email-forwarding` is used by
  an admin API screen; the rest of the admin UI is direct Supabase access.

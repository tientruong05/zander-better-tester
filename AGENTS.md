# AGENTS.md — aio-tester Workspace

## Project Purpose

This is a **personal learning workspace** owned by a **manual QA tester** who is learning:

1. **Python + Playwright** — UI test automation
2. **Apache JMeter** — performance / load testing

The workspace contains a **demo iPhone e-commerce website** used as the **Application Under Test (AUT)**, plus two empty folders where test code will be built step by step.

> **Important:** The owner is a learner. When implementing anything here, explain concepts clearly, prefer educational and well-documented code, and build things incrementally instead of dumping large solutions.

## Repository Layout

```
aio-tester/
├── AGENTS.md                    # This file
├── iphone-store-demo/           # AUT — demo iPhone Store (Next.js)
├── python-playwright/           # EMPTY — future Python Playwright test suite (pytest + POM)
└── jmeter/                      # EMPTY — future JMeter test plans (.jmx)
```

## 1. Application Under Test: `iphone-store-demo/`

A demo **iPhone Store** (products + categories only). The project was renamed and all customer branding, events, kit-sales campaign, policy pages and legacy assets were removed.

### Tech Stack

| Component   | Technology                                  |
|-------------|---------------------------------------------|
| Framework   | Next.js 16 (App Router), React 19, TypeScript |
| Styling     | Tailwind CSS 4                              |
| Database    | Supabase (PostgreSQL + Auth + RLS)          |
| Payment     | PayOS (VietQR / bank transfer)              |
| Email       | nodemailer (SMTP)                           |
| i18n        | Custom, `lib/i18n/vi.json` + `en.json` (VI/EN) |

### Running Locally (primary test environment)

```powershell
cd iphone-store-demo
Copy-Item .env.example .env.local   # fill in real values
npm install
npm run dev        # → http://localhost:3000
```

Requires `.env.local` (NOT committed — never create, print, or commit real secrets). `.env.example` lists every variable:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `NEXT_PUBLIC_URL`, `SMTP_USER`, `SMTP_PASSWORD`, `ADMIN_EMAIL`, plus the test variables.

The AUT has been instrumented for testing (data-testids, mock payment, test APIs, rate limiting, OpenAPI). See `iphone-store-demo/TESTING.md` for the full guide and `iphone-store-demo/TEST_IDS.md` for every testid.
Local test setup: run `architecture/db_schema_full.sql` then `architecture/seed_iphone.sql` in Supabase once, then set `PAYMENT_MODE=mock` and `ENABLE_TEST_API=true` in `.env.local`.

The owner tests **locally first**; later they will deploy (Vercel) and apply the same tests against the real environment → **always keep base URL configurable** in test code.

### Customer-Facing Routes (UI test targets)

| Route                  | Description                                   |
|------------------------|-----------------------------------------------|
| `/`                    | Homepage (iPhone hero, categories, featured products) |
| `/products`            | Product listing + category/price filters + pagination |
| `/products/[slug]`     | Product detail, gallery, reviews, add to cart |
| `/cart`                | Cart, quantity controls                       |
| `/checkout`            | 3-step checkout (see flow below)              |
| `/orders`, `/orders/[id]` | Order list/detail with status stepper       |
| `/track-order`         | Track order by `?code=` order code            |

### Admin Routes (login at `/admin/login` — email + password via Supabase Auth, admin role only)

`/admin` (dashboard), `/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/users`.

### Key Business Flows

- **Checkout** (accordion, 3 steps):
  1. Customer info (name, email, phone)
  2. Delivery method: `pickup` (choose collection point) or `shipping` (address form)
  3. Payment method: `bank_transfer` (redirects to PayOS checkout URL) or `cash`
- **Order status lifecycle**: `pending → paid → processing → shipping → completed`, plus `cancelled` and `failed`. The app uses `shipping` (legacy `shipped` remains only in `types/index.ts`). Expired pending orders can be cancelled via API.
- **Guest checkout supported** — registration optional.

### API Routes (for JMeter / API tests)

`GET /api/products`, `POST /api/checkout`, `GET /api/orders`, `GET /api/orders/[id]`, `POST /api/orders/confirm-payment`, `GET /api/orders/cancel-expired-orders`, `POST /api/payment/webhook` (PayOS), `POST /api/payment/mock` (test mode), `GET /api/track-order?code=`, `GET/POST /api/reviews`, `POST /api/track-visit`, `GET/POST/PATCH/DELETE /api/admin/email-forwarding`.

Test-only routes (404 unless `ENABLE_TEST_API=true` or `NODE_ENV=test`):
`POST /api/test/seed`, `POST /api/test/reset`, `POST /api/test/create-order`, `POST /api/test/auth-token`.
`POST /api/checkout` and `GET /api/orders` are rate limited (default 10/min/IP).
Full contract: `iphone-store-demo/openapi.yaml`.

### Reference Docs Inside AUT

- `architecture/db_schema_full.sql` — consolidated, idempotent schema (run this one in Supabase)
- `architecture/seed_iphone.sql` — destructive iPhone 13–18 catalog seed
- `docs/EMAIL_FORWARDING.md` — optional admin email-forwarding feature
- `types/index.ts` — canonical TypeScript models (Product, Order, Payment, ...)
- `TESTING.md` — test mode, seed accounts/data, test APIs, Playwright/JMeter recipes
- `TEST_IDS.md` — complete data-testid reference
- `openapi.yaml` — OpenAPI 3.0.3 contract for every endpoint
- `.env.example` — env template (copy to `.env.local`)

### Rules for the AUT

- The AUT was explicitly modified to become test-friendly. Keep existing business flows intact (checkout, order lifecycle, admin) and keep test hooks **disabled by default** (`PAYMENT_MODE=real`, `ENABLE_TEST_API=false`).
- Do not change business behavior unless explicitly asked; add test hooks instead of weakening real logic.
- The workspace root is not a git repo yet. Do not run `git init`, commit or push unless the owner explicitly asks.
- Never commit or expose `.env.local`, Supabase keys, or PayOS credentials.

## 2. `python-playwright/` — Planned Test Suite

Empty for now. Agreed direction:

- **Python 3 + Playwright + pytest**, structured with **Page Object Model (POM)**
- Suggested layout (create when work starts):
  ```
  python-playwright/
  ├── pages/           # Page objects (e.g. home_page.py, products_page.py, checkout_page.py)
  ├── tests/           # Test modules (test_*.py)
  ├── conftest.py      # Fixtures: browser, page, base_url
  ├── pytest.ini       # Markers, test paths
  ├── requirements.txt # playwright, pytest, pytest-html (pin versions)
  └── .env             # BASE_URL=http://localhost:3000 (never commit secrets)
  ```
- Base URL must come from env/config so the same suite runs against local and deployed environments.
- Prefer `pytest-playwright` plugin conventions; generate HTML reports for review.
- Start from `iphone-store-demo/TESTING.md` (seed API, accounts, testids, mock payment) so tests are deterministic.

## 3. `jmeter/` — Planned Performance Tests

Empty for now. Agreed direction:

- Test plans as `.jmx` files (e.g. `load-test-plan.jmx`), results as `.jtl`, HTML dashboards in `reports/`
- Parameterize host/port/protocol via JMeter **user-defined variables or properties** so plans work against local and deployed environments
- Typical scenarios to build from: browse products, view product detail, `/track-order`, `/api/orders` with a Bearer token, checkout (use `PAYMENT_MODE=mock` locally; test APIs write real orders to Supabase — reset/seed before runs)
- Get tokens via `POST /api/test/auth-token` (JMeter JSON Extractor) and seed data via `POST /api/test/seed`
- `/api/checkout` and `/api/orders` are rate limited by default (10/min/IP). Raise `RATE_LIMIT_MAX` for throughput tests or keep it to test 429 behavior.

## Environment & Conventions

- **OS:** Windows, **Shell:** PowerShell 5.1 — no `&&` chaining (use `;` or `if ($?)`), no `rg`/`grep` binaries (use the provided Grep tool or `Select-String`)
- **Communication language:** Vietnamese (the owner writes in Vietnamese); code, file names, and docs in English
- When suggesting commands, always give the exact PowerShell command and the working directory
- Teaching notes: when adding a new test/tool concept, briefly explain *what* and *why* before/while implementing

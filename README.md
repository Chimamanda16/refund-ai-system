# AI Powered Refund System

An AI-powered e-commerce customer support refund system. The system automates and partially abstracts away the need for a human to handle refund erquest at all times. It is AI powered but still maintains integrity and strict business decision making by using AI to categorize requests but leaving the final decision to predefined business rules. When issues have a certain nature that cannot be handled by the system, they are then escalated to a human admin

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + Vite, Tailwind CSS v4, React Router |
| Backend    | Node.js (ES modules) + Express 5 |
| Database   | PostgreSQL 16 |
| Validation | Zod |
| Containers | Docker Compose |

## Project structure

```
refund-ai-system/
├── frontend/                # React + Vite + Tailwind
│   └── src/
│       ├── components/      # Layout, status indicator, error/loading states
│       ├── hooks/           # useAsync
│       ├── lib/             # apiClient.js (single fetch wrapper), format.js
│       └── pages/           # CustomerRefundPage, AdminDashboardPage
├── backend/                 # Express API
│   └── src/
│       ├── config/          # env.js: loads and validates environment variables
│       ├── db/              # pool.js, migrate.js, seed.js, init.js
│       ├── routes/          # route
│       ├── controllers/     # HTTP request/response
│       ├── services/        # business logic
│       ├── repositories/    # parameterized SQL only
│       ├── middleware/      # validate, notFound, errorHandler
│       ├── validators/      # Zod schemas
│       └── scripts/         # db:init / db:migrate / db:seed / db:reset
├── database/
│   ├── migrations/          # 001_initial_schema.sql (idempotent, tracked)
│   └── seeds/seed.sql       # synthetic seed data (re-runnable)
├── docker-compose.yml
├── .env.example
└── README.md
```



## Getting started

### Option A — Docker (recommended)

```bash
cp .env.example .env
docker compose up
```

This starts PostgreSQL, waits for it to be healthy, applies migrations, seeds
the database (only if it's empty), and starts the backend and frontend with
hot reload.

- Frontend: http://localhost:5173
- Backend health check: http://localhost:4000/api/health

### Option B — Run locally without Docker

Requires a local PostgreSQL 16 instance.

```bash
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres connection string

# To run the backend
cd backend
npm install
npm run db:init     # wait for DB, run migrations, seed if empty
npm run dev

# To run the frontend
cd frontend
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and use your own details for the values

| Variable            | Used by  | Purpose |
|---------------------|----------|---------|
| `POSTGRES_USER`      | Docker   | Postgres container user |
| `POSTGRES_PASSWORD`  | Docker   | Postgres container password |
| `POSTGRES_DB`        | Docker   | Postgres container database name |
| `DATABASE_URL`       | backend  | Full Postgres connection string |
| `PORT`               | backend  | API port (default 4000) |
| `CLIENT_URL`         | backend  | Allowed CORS origin(s) for the frontend |
| `AUTO_SEED`          | backend  | Seed the DB on startup if empty (`true`/`false`) |
| `VITE_API_URL`       | frontend | Base URL the browser uses to call the API |

## Database

### Schema

- **customers** → **orders** (1 → many) → **order_items** (1 → many)
  `order_items.is_final_sale` is item-level, since one order can mix
  refundable and final-sale items.
- **refund_requests**: status
  (`pending` / `approved` / `denied` / `escalated`), plus `ai_*` and
  `policy_*` columns .
- **refund_request_items** — supports partial refunds and multi-item
  selection, linking a refund request to specific order items and quantities.
- **refund_messages** — a thread per refund request (`customer` / `admin` /
  `system`).
- **audit_logs** — status-change history per refund request, with a JSONB
  `metadata` column for structured detail.
- **admin_notes** — internal-only notes. `adminRepository.js` is the only
  place that queries this table; it's never returned from a customer-facing
  endpoint.

### Migrations

`database/migrations/*.sql` is applied in filename order by
`backend/src/scripts/migrate.js`, tracked in a `schema_migrations` table. `npm run db:init` waits for Postgres, runs migrations, then seeds only if the `customers` table is empty.

### Seed data

`database/seeds/seed.sql` truncates and reloads all application tables, so
it's safe to re-run (`npm run db:seed`). It creates 15 customers with
realistic orders and order items, deliberately covering different scenarios for testing:

| # | Scenario | Where to find it |
|---|----------|-------------------|
| 1 | Normal damaged item | Customer 1 (Amara Okafor), ORD-1001 |
| 2 | Final-sale item | Customer 2 (Daniel Brooks), ORD-1002 — clearance shoes, `is_final_sale = true` |
| 3 | Order older than 30 days | Customer 3 (Priya Nair), ORD-1003 — ordered 52 days ago |
| 4 | High-value order | Customer 4 (Marcus Chen), ORD-1004 — $1,948.99 TV + wall mount |
| 5 | Incorrect item | Customer 5 (Sofia Rossi), ORD-1005 |
| 6 | Prompt-injection test scenario | Customer 15 (Nadia Hassan) — an escalated refund whose message includes an unverifiable claim ("third damaged delivery"), for testing that AI triage isn't misled by claims embedded in customer text |
| 7 | Delivered order / non-delivery claim | Customer 6 (Jordan Whitfield), ORD-1006 |
| 8 | Previous refund history | Customer 8 (Tomás Herrera) — 3 prior refund requests (2 approved, 1 denied) across 4 orders |
| 9 | Multi-item order, partial refund | Customer 12 (Liam O'Connor), ORD-1012 — 3 line items |
| 10 | Ambiguous complaint | Customer 7 (Elena Petrova), ORD-1007 |
| 11 | Normal qualifying refund | Customer 9 (Grace Liu), ORD-1009 |
| 12 | Invalid order scenario | Query a non-existent order/customer id, e.g. `GET /api/orders/9999` |
| 13 | Requested amount > item/order value | Construct a `POST /api/refunds` body with `requestedAmount` above the item's price |
| 14 | Multiple-item order | Customer 14 (Kenji Tanaka), ORD-1014 — 4 line items, including one final-sale item |
| 15 | Previously escalated customer | Customer 15 (Nadia Hassan), refund request #4 (`status = escalated`) |

## API

All responses are JSON, wrapped as `{ "data": ... }` for success or
`{ "error": { "code", "message", "details" } }` for (failure).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | Checks API + database connectivity |
| GET | `/api/customers` | List customers with order counts |
| GET | `/api/customers/:customerId/orders` | Customer + their orders and items |
| GET | `/api/orders/:orderId` | A single order with its items |
| POST | `/api/refunds` | Validates the request shape; returns `501 |
| GET | `/api/refunds/:refundId` | Customer-safe refund view |
| GET | `/api/admin/dashboard` | Refund counts by status |
| GET | `/api/admin/refunds` | List refunds, filterable by `?status=` |
| GET | `/api/admin/refunds/:refundId` | Full refund detail, including AI/policy fields, notes, and audit log |

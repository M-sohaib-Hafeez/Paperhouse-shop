# Paperhouse — add to cart & checkout

A small shop where customers add items to a cart and check out, and an admin sees new orders and moves them through fulfilment.

**Stack:** FastAPI + SQLAlchemy (SQLite locally, Postgres-ready) · React + Vite · JWT auth

## Features

**Customer:** register / log in · browse products · add to cart, change quantity, remove · checkout with delivery details (cash on delivery) · see own orders and their status

**Admin:** sees incoming orders, filtered by status (new, processing, shipped, delivered, cancelled) · customer, address and items on each order · change status · live-refreshes every 10 seconds and highlights new arrivals · revenue and per-status counts

## Run locally

```bash
# 1. backend  (http://localhost:8000, API docs at /docs)
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# 2. frontend (http://localhost:5173), in a second terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

Admin login (seeded on first start): `admin@shop.com` / `admin123`. Customers sign up from the UI.

Run the backend tests: `cd backend && pytest`

## API

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register`, `/auth/login` | public | get a JWT |
| GET | `/auth/me` | user | current user |
| GET | `/products`, `/products/{id}` | public | catalogue |
| GET | `/cart` | user | cart with totals |
| POST | `/cart/items` | user | add item (merges quantities) |
| PATCH / DELETE | `/cart/items/{product_id}` | user | set quantity / remove |
| POST | `/orders/checkout` | user | cart → order |
| GET | `/orders` | user | my orders |
| GET | `/admin/orders?status=new` | admin | all orders |
| GET | `/admin/summary` | admin | counts per status, revenue |
| PATCH | `/admin/orders/{id}/status` | admin | update status |

## Design decisions

- **Server-side cart.** The cart lives in the database, so it survives refreshes and devices.
- **Checkout is one transaction.** Prices are re-read from the database (the client can't set a price). Stock is decremented with a conditional `UPDATE ... WHERE stock >= qty`, so two buyers can't both get the last item. If anything fails, everything rolls back and the cart is untouched.
- **Order items are snapshots.** Name and unit price are copied at purchase time, so later catalogue edits don't rewrite history.
- **Money is integer paisa**, never floats.
- **Roles.** Public sign-up always creates a customer; admin routes sit behind an `admin_only` dependency (401 without a token, 403 for customers).
- **Cancelling an order restocks it**, and cancelled orders can't be reopened.

## Deploy

**Backend → Render**
1. New Web Service from this repo, root directory `backend` (or use `render.yaml` as a Blueprint).
2. Build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Env vars: `SECRET_KEY` (random), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_ORIGIN` (your Vercel URL, no trailing slash).

**Frontend → Vercel**
1. Import the repo, root directory `frontend` (Vite is detected automatically).
2. Env var: `VITE_API_URL` = your Render URL, then deploy.
3. Go back to Render and set `FRONTEND_ORIGIN` to the final Vercel URL (needed for CORS).

**Database note.** On Render's free plan the disk is wiped on every redeploy, so SQLite data (orders, users) resets. Products and the admin account are re-seeded automatically, so the demo still works. To keep data, create a free Postgres database (Neon, Supabase, or Render Postgres) and set `DATABASE_URL`. No code changes needed. The free Render service also sleeps when idle, so the first request can take up to a minute.

## What I'd add next

Real payments (Stripe), email notification to the admin on new orders, product management in the admin UI, pagination, rate limiting on login, Alembic migrations, and a guest cart that merges on login.

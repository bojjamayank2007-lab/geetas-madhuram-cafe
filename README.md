# गीता'स मधुरम कैफे — Geeta's Madhuram Cafe

> Good food. Good quantity. Good vibes.

A complete, production-ready restaurant website for **Geeta's Madhuram Cafe**,
Bhiwandi (4.6★ · 16 Google reviews · Open daily 7:00 AM – 10:00 PM).

MERN-style stack: **vanilla HTML/CSS/JS** frontend (no React/Vue), an
**Express 4 + MongoDB (Mongoose 8)** REST API, and a separate static **admin
dashboard**. JWT authentication is stored in **HttpOnly cookies** (never
localStorage).

---

## 📇 Business details

| Field | Value |
| --- | --- |
| Name | Geeta's Madhuram Cafe |
| Hindi name | गीता'स मधुरम कैफे |
| Tagline | Good food. Good quantity. Good vibes. |
| Address | H No 157/2, Agra Road, beside Tirupati Hospital, Kaneri, Bhiwandi, Maharashtra 421302 |
| Phone | 095619 79727 |
| WhatsApp | +91 95619 79727 |
| Plus Code | 73R5+MC Bhiwandi, Maharashtra |
| Hours | Open daily 7:00 AM – 10:00 PM |
| Rating | 4.6 stars (16 Google reviews) |
| Swiggy (fallback order) | https://www.swiggy.com/search?query=Geeta%27s%20Madhuram%20Cafe |

---

## 🧱 Tech stack

**Backend** — Node.js, Express 4.x, MongoDB + Mongoose 8.x, JWT in HttpOnly
cookies, bcryptjs, helmet, express-rate-limit, cors, cookie-parser, Razorpay
SDK (COD is default), nodemailer (stub), dotenv, nodemon.

**Frontend** — Pure HTML5, CSS3, vanilla JS (ES6+). No frameworks, no Tailwind,
no Bootstrap, no jQuery. Font Awesome + Google Fonts (Fraunces + Inter) via CDN.

**Admin** — static `admin/` folder calling the backend API.

**Hosting** — Frontend → Vercel · Backend → Render/Railway · DB → MongoDB Atlas.

---

## 📁 Folder structure

```
Geeta's Madhuram Cafe/
├── frontend/            # Static multi-page customer site
│   ├── index.html
│   ├── menu.html
│   ├── cart.html
│   ├── about.html
│   ├── contact.html
│   ├── customer-login.html
│   ├── customer-orders.html
│   ├── css/             # style, navbar, hero, menu, reviews, footer, responsive, mobile-app
│   ├── js/              # api, main, navbar, menu, cart, reviews, contact, customerAuth, restaurant
│   └── assets/          # favicon.svg, logo.svg
├── backend/             # Express + MongoDB REST API
│   ├── server.js        # entry point
│   ├── seed.js          # menu + reviews + restaurant seed
│   ├── seedAdmin.js     # admin user seed
│   ├── config/db.js
│   ├── models/          # Admin, Customer, MenuItem, Order, Review, Restaurant
│   ├── middleware/      # auth.js, errorHandler.js
│   ├── controllers/     # auth, menu, order, review, restaurant, admin
│   └── routes/          # auth, menu, orders, reviews, restaurant, admin
├── admin/               # Admin dashboard (static)
├── README.md
└── .gitignore
```

---

## 🚀 Local setup

### 1. Database (MongoDB Atlas or local mongod)

Local dev:

```bash
brew services start mongodb-community   # macOS; or run mongod manually
```

Production: create a free cluster at https://www.mongodb.com/atlas and copy the
connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env    # then fill in your values
npm install
npm run seed:admin      # creates the admin login (idempotent — safe to re-run)
npm run seed            # wipes & re-inserts menu, restaurant profile, reviews
npm run dev             # nodemon → http://localhost:5000
```

Health check:

```bash
curl http://localhost:5000/api/health
```

### 3. Frontend (static)

Serve `frontend/` with any static server — **it must be served over HTTP**
(the API needs a browser Origin, and cookies require it):

```bash
npx serve frontend          # → http://localhost:3000   (or)
# VS Code "Live Server" on frontend/ → http://localhost:5500
```

The frontend calls the API automatically: `localhost`/`127.0.0.1` → backend at
`http://localhost:5000`; anywhere else → `window.__API_URL__` (set per page) or
the hardcoded production constant in `frontend/js/api.js`.

> ⚠️ Add the frontend origin (e.g. `http://localhost:5500`,
> `http://localhost:3000`) to `ALLOWED_ORIGINS` in `backend/.env`.

### 4. Admin dashboard

Serve `admin/` with a static server (same approach as the frontend) and visit
`admin/index.html`. Login with the seeded admin credentials.

### 5. Seed the database

```bash
cd backend
npm run seed:admin   # idempotent — creates the admin OR reports it already exists
npm run seed         # wipes & re-inserts menu, restaurant profile and reviews
```

- **`npm run seed`** **wipes** the `MenuItem`, `Restaurant` and `Review`
  collections, then re-inserts 18 menu items, the restaurant profile
  (rating 4.6★) and 3 approved customer reviews. It is **idempotent** — safe
  to re-run any time (products, reviews and the profile return to the exact
  seeded state; orders & customers are untouched).
- **`npm run seed:admin`** is **idempotent** — if the admin user already
  exists it skips and **never overwrites the password**.
- Default admin credentials: username **`admin`** / password
  **`ChangeMe123!`** — set a strong `ADMIN_PASSWORD` in `backend/.env` and
  change the password after the first login.

---

## 🔌 API endpoints

Base URL: `http://localhost:5000`

**Public**

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/health` | liveness probe |
| GET | `/api/restaurant` | cafe profile (singleton) |
| GET | `/api/menu?category=&search=&popular=` | menu list |
| GET | `/api/menu/:id` | single item |
| GET | `/api/reviews` | **approved only** |
| POST | `/api/reviews` | needs moderation; rate-limited |

**Customer auth (cookie `customerToken`)**

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ name, phone, password }` |
| POST | `/api/auth/login` | `{ phone, password }` |
| POST | `/api/auth/logout` | clears cookie |
| GET | `/api/auth/me` | current customer |
| PUT | `/api/auth/address` | update address |

**Customer orders (protected)**

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/api/orders` | server-side price validation |
| GET | `/api/orders/my` | own orders only |
| GET | `/api/orders/:id` | own order only |
| POST | `/api/orders/razorpay/create` | Razorpay order |
| POST | `/api/orders/razorpay/verify` | verify signature |

**Admin (cookie `adminToken`, role admin/owner)**

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/api/admin/login` | |
| POST | `/api/admin/logout` | |
| GET | `/api/admin/me` | |
| GET | `/api/admin/orders?status=&page=` | |
| PATCH | `/api/admin/orders/:id/status` | |
| GET | `/api/admin/menu` | |
| POST | `/api/admin/menu` | |
| PUT | `/api/admin/menu/:id` | |
| DELETE | `/api/admin/menu/:id` | |
| GET | `/api/admin/reviews` | |
| PATCH | `/api/admin/reviews/:id/approve` | |
| DELETE | `/api/admin/reviews/:id` | |
| PUT | `/api/admin/restaurant` | |
| GET | `/api/admin/stats` | |

### curl test examples

```bash
# Health
curl http://localhost:5000/api/health

# Public restaurant profile
curl http://localhost:5000/api/restaurant

# Menu with filters
curl "http://localhost:5000/api/menu?category=Breakfast"
curl "http://localhost:5000/api/menu?search=paneer"
curl "http://localhost:5000/api/menu?popular=true"

# Approved reviews only
curl http://localhost:5000/api/reviews

# Customer registration + login (stores HttpOnly cookie)
curl -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul","phone":"9876543210","password":"secret123"}'
curl -c cookies.txt -b cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","password":"secret123"}'

# Who am I (uses cookie from jar)
curl -b cookies.txt http://localhost:5000/api/auth/me

# Admin login
curl -c admin-cookies.txt -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ChangeMe123!"}'
curl -b admin-cookies.txt http://localhost:5000/api/admin/stats
```

---

## 📖 API Reference

All responses use the envelope `{ success, data?, message?, error? }`. Auth =
HttpOnly cookie (`customerToken` for customers, `adminToken` for admins).

| Method | Path | Auth | Body (JSON) | Success response |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | — | — | `200 { success, status:"ok", service, version, time }` |
| GET | `/api/restaurant` | — | — | `200 { success, data: restaurant }` (auto-creates) |
| GET | `/api/menu` | — | `?category=&search=&popular=` | `200 { success, data: [items] }` (available only) |
| GET | `/api/menu/:id` | — | — | `200 { success, data: item }` / `404` |
| GET | `/api/reviews` | — | — | `200 { success, data: [approved reviews ≤20] }` |
| POST | `/api/reviews` | optional | `{ name, rating 1-5, message\|text }` | `201` pending moderation |
| POST | `/api/auth/register` | — | `{ name, phone, password }` | `201 customer + customerToken` |
| POST | `/api/auth/login` | — | `{ phone, password }` | `200 customer + customerToken` / `401` |
| POST | `/api/auth/logout` | — | — | `200 { success, message }` (clears cookie) |
| GET | `/api/auth/me` | customer | — | `200 customer` / `401` / `403` |
| PUT | `/api/auth/address` | customer | `{ line, area, landmark, city, state, pincode }` | `200 updated customer` |
| POST | `/api/orders` | customer | `{ items:[{menuItem,quantity}], orderType, customerAddress?, paymentMethod?, notes? }` | `201 order` (COD default; prices from DB) |
| GET | `/api/orders/my` | customer | — | `200 [orders]` newest first |
| GET | `/api/orders/:id` | customer | — | `200 order` / `403 if not owner` |
| POST | `/api/orders/razorpay/create` | customer | cart body | `201 rzp order payload` / `503 if not configured` |
| POST | `/api/orders/razorpay/verify` | customer | `{ order, paymentId, signature }` | `200 verified` / `503 if not configured` |
| POST | `/api/admin/login` | — | `{ username, password }` | `200 admin + adminToken` / `401` |
| POST | `/api/admin/logout` | — | — | `200` (clears cookie) |
| GET | `/api/admin/me` | admin/owner | — | `200 admin` |
| GET | `/api/admin/orders` | admin/owner | `?status=&page=&limit=` | `200 { data: orders, meta }` |
| PATCH | `/api/admin/orders/:id/status` | admin/owner | `{ status }` | `200 order` (+ statusHistory entry) |
| GET | `/api/admin/menu` | admin/owner | `?category=&search=&popular=` | `200 { data: [all items incl. unavailable] }` |
| POST | `/api/admin/menu` | admin/owner | `{ name, description, price, category, ... }` | `201 item` |
| PUT | `/api/admin/menu/:id` | admin/owner | whitelisted fields | `200 item` |
| DELETE | `/api/admin/menu/:id` | admin/owner | — | `200 { success, message }` |
| GET | `/api/admin/reviews` | admin/owner | `?approved=false` | `200 { data, meta.pending }` |
| PATCH | `/api/admin/reviews/:id/approve` | admin/owner | — | `200 review` (now public) |
| DELETE | `/api/admin/reviews/:id` | admin/owner | — | `200 { success, message }` |
| PUT | `/api/admin/restaurant` | admin/owner | whitelisted profile fields + `hours` | `200 restaurant` |
| GET | `/api/admin/stats` | admin/owner | — | `200 { ordersToday, revenueToday, pendingOrders, avgRating, totalOrders }` |

Error responses: `4xx/5xx { success: false, message }`.

---

## 🧪 Curl smoke tests

Save as `smoke.sh` (from `backend/` with the API running) and run `bash smoke.sh`.
It prints ✅/❌ per test. Admin tests pass after `npm run seed:admin` (Step 3).

```bash
#!/usr/bin/env bash
BASE=http://localhost:5000/api
JAR=$(mktemp)
PASS=0; FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

t() { # t <label> <expected code> <curl args...>
  local got
  got=$(code "${@:3}")
  if [ "$got" = "$2" ]; then ok "$1 -> $got"; else bad "$1 -> got $got" "$2" "$got"; fi
}

echo '== Health & public =='
t 'GET health'                   200 "$BASE/health"
t 'GET menu (empty pre-seed)'    200 "$BASE/menu"
t 'GET restaurant (auto-create)' 200 "$BASE/restaurant"
t 'GET reviews (approved only)'  200 "$BASE/reviews"

echo '== Customer auth =='
PHONE="98765$((RANDOM % 10000))$((RANDOM % 1000))"
t 'POST register'                 201 -c "$JAR" -X POST "$BASE/auth/register" -H 'Content-Type: application/json' -d "{\"name\":\"Smoke User\",\"phone\":\"$PHONE\",\"password\":\"secret123\"}"
t 'POST register (duplicate 409)' 409 -X POST "$BASE/auth/register" -H 'Content-Type: application/json' -d "{\"name\":\"Dupe\",\"phone\":\"$PHONE\",\"password\":\"secret123\"}"
t 'POST login (wrong pw 401)'     401 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"phone\":\"$PHONE\",\"password\":\"wrong\"}"
t 'POST login'                    200 -b "$JAR" -c "$JAR" -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"phone\":\"$PHONE\",\"password\":\"secret123\"}"
t 'GET me (no cookie 401)'        401 "$BASE/auth/me"
t 'GET me'                        200 -b "$JAR" "$BASE/auth/me"

echo '== Guards =='
t 'GET admin/me (no cookie 401)'  401 "$BASE/admin/me"
t 'GET admin/me (customer 403)'   403 -b "$JAR" "$BASE/admin/me"
t 'GET unknown route (404)'       404 "$BASE/nope"

echo '== Orders (fail before seed) =='
t 'POST orders (empty menu 4xx)'  400 -b "$JAR" -X POST "$BASE/orders" -H 'Content-Type: application/json' -d '{"items":[{"menuItem":"000000000000000000000000","quantity":1}],"orderType":"delivery"}'
t 'POST razorpay/create (503)'    503 -b "$JAR" -X POST "$BASE/orders/razorpay/create" -H 'Content-Type: application/json' -d '{"items":[{"menuItem":"000000000000000000000000","quantity":1}]}'

echo '== Admin (after npm run seed:admin) =='
AJAR=$(mktemp)
t 'POST admin/login'              200 -c "$AJAR" -X POST "$BASE/admin/login" -H 'Content-Type: application/json' -d '{"username":"admin","password":"ChangeMe123!"}'
t 'GET admin/me'                  200 -b "$AJAR" "$BASE/admin/me"
t 'GET admin/orders'              200 -b "$AJAR" "$BASE/admin/orders"
t 'GET admin/stats'               200 -b "$AJAR" "$BASE/admin/stats"

echo
echo "Passed: $PASS | Failed: $FAIL"
```

---

## 🔒 Security rules baked into the API

- **Never trust client-side prices** — every order is recalculated server-side
  from the `MenuItem` collection.
- Orders are rejected when `restaurant.isAcceptingOrders === false`.
- `GET /api/reviews` returns approved reviews only.
- Customers can only view their **own** orders.
- Admin routes require a JWT with role `admin`/`owner`.
- Rate limits: `/api/auth` → 20 req / 15 min; general `/api` → 300 req / 15 min.
- JWT is stored in **HttpOnly cookies**, never `localStorage`.

---

## ☁️ Deployment

### Frontend → Vercel

1. Push the repo, add the **frontend** directory as the root for a new project
   (or use rewrites so `/menu.html`, `cart.html`, etc. all resolve).
2. On each page, set the production API URL:
   ```html
   <script>window.__API_URL__ = 'https://<your-backend>.onrender.com';</script>
   ```

### Backend → Render

1. New Web Service, root directory = `backend`:
   - Build command: `npm install`
   - Start command: `npm start`
2. Environment variables (see checklist below).
3. Add the Vercel frontend URL to `ALLOWED_ORIGINS`.

### Database → MongoDB Atlas

Create a cluster + database user, and use the SRV connection string as
`MONGO_URI`.

### Env var checklist per platform

| Variable | Value |
| --- | --- |
| `PORT` | `5000` (Render injects its own port; read `process.env.PORT`) |
| `NODE_ENV` | `production` |
| `MONGO_URI` | **required** — Atlas SRV string |
| `JWT_SECRET` | **required** — long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `ALLOWED_ORIGINS` | comma-separated frontend URLs (Vercel) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | optional (COD default) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | seed once, then change in env |

After first deploy, run `npm run seed` and `npm run seed:admin` once (a one-off
script or a Render shell) to populate the database.

---

## 🩷 Design system

| Token | Value |
| --- | --- |
| `--maroon` | `#6E2B20` |
| `--marigold` | `#E09A2E` |
| `--pista` | `#6E7F4E` |
| `--cream` | `#FBF6EC` |
| `--paper` | `#FFFDF8` |
| `--ink` | `#2A1A14` |
| `--muted` | `#7C6A61` |
| `--line` | `rgba(42,26,20,.14)` |

Fonts: **Fraunces** (display) + **Inter** (body). Warm, editorial "sweet shop"
aesthetic, rounded corners, soft shadows, cream backgrounds, light theme.
CSS transitions + IntersectionObserver scroll reveals, with
`prefers-reduced-motion` respected.

---

## 📄 Pages

- **Home** — sticky nav, arch hero, marquee, popular picks, story/stats,
  reviews carousel, visit/map, footer.
- **Menu** — category chips, search, sort, veg & spicy badges, cart drawer.
- **Cart** — quantities, order type (Delivery/Pickup/Dine-in), address,
  COD/Razorpay, login-required checkout.
- **Customer login** — Login / Register tabs, Indian phone validation.
- **Customer orders** — expandable order cards with status badges.
- **About** — story, values, photo gallery.
- **Contact** — address, click-to-call, WhatsApp, map iframe, form, hours.
- **Admin** — login + tabs: Orders, Menu CRUD, Reviews moderation, Settings,
  Stats.

---

## 🚧 Build roadmap

1. ✅ Scaffold + models + server boot + `/api/health`
2. ⏳ Controllers, routes, curl tests
3. ⏳ Seed scripts and data
4. ⏳ CSS foundation
5. ⏳ Frontend HTML pages
6. ⏳ Frontend JS wired to API (menu → cart → login → COD order)
7. ⏳ Admin dashboard
8. ⏳ Deployment configs (Vercel + Render)
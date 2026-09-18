# गीता'स मधुरम कैफे — Geeta's Madhuram Cafe

**Taste the South in Every Bite!**

Geeta's Madhuram Cafe is an authentic South Indian restaurant on Agra Road in Kaneri, Bhiwandi. The cafe is rated **4.6 ★ from 16 Google reviews** and serves fresh dosa, idli, pesarattu, uttapam, snacks, and more.

## 🧱 Tech stack

- **Customer site:** Vanilla HTML5, CSS3, and ES6 JavaScript across seven static pages.
- **Backend:** Express 4, MongoDB/Mongoose 8, JWT, bcryptjs, Helmet, CORS, cookie-parser, and rate limiting.
- **Admin:** Separate single-page vanilla HTML/CSS/JS dashboard with five operational tabs.
- **Authentication:** Customer and admin JWTs use separate HttpOnly cookies. Tokens are never stored in localStorage.

## 📇 Business details

| Field | Value |
| --- | --- |
| Name | Geeta's Madhuram Cafe |
| Hindi name | गीता'स मधुरम कैफे |
| Tagline | Taste the South in Every Bite! |
| Cuisine | Authentic South Indian |
| Address | H No 157/2, Agra Road, beside Tirupati Hospital, Kaneri, Bhiwandi, Maharashtra 421302 |
| Phone | 095619 79727 |
| WhatsApp | +91 95619 79727 |
| Plus code | 73R5+MC Bhiwandi, Maharashtra |
| Hours | Open daily 7:00 AM – 10:00 PM |
| Rating | 4.6 ★ (16 Google reviews) |
| Swiggy | https://www.swiggy.com/search?query=Geeta%27s%20Madhuram%20Cafe |
| Minimum order | ₹100 |
| Delivery fee | ₹20 |

## 📁 Folder structure

```text
Geeta's Madhuram Cafe/
├── frontend/                  # Customer site
│   ├── index.html             # Home and popular picks
│   ├── menu.html              # 58-item live menu and cart drawer
│   ├── cart.html              # COD checkout
│   ├── customer-login.html    # Email login/register
│   ├── customer-orders.html   # Customer order history
│   ├── about.html
│   ├── contact.html
│   ├── css/                   # Customer styles
│   ├── js/                    # API, menu, cart, auth, reviews, and page wiring
│   └── assets/
├── backend/                   # Express REST API
│   ├── server.js
│   ├── seed.js
│   ├── seedAdmin.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   └── middleware/
├── admin/                     # Static admin dashboard
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin.js
├── README.md
└── .gitignore
```

## 🍽️ Menu

The seed contains **58 items across 10 categories**:

| Slug | Label | Count |
| --- | --- | ---: |
| `idli` | Idli | 9 |
| `dosa` | Dosa | 15 |
| `benne_dosa` | Benne Dosa | 6 |
| `pesarattu` | Pesarattu | 9 |
| `uttapam` | Uttapam | 6 |
| `upma` | Upma | 2 |
| `wada` | Medhu Wada | 3 |
| `bonda` | Mysore Bonda | 1 |
| `poori` | Poori | 3 |
| `snacks` | Evening Snacks | 4 |
| **Total** |  | **58** |

Homepage popular picks: **Plain Dosa, Podi Masala Dosa, Plain Pesarattu, Upma Pesarattu, Plain Uttapam, and Mirchi Bajji.**

## 🚀 Local setup

Run MongoDB locally or use MongoDB Atlas, then start three servers:

### Backend — `http://localhost:5001`

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env, then:
npm run seed:admin
npm run seed
npm run dev
```

### Customer frontend — `http://localhost:5500`

```bash
cd frontend
npx serve . -l 5500
```

### Admin dashboard — `http://localhost:5501`

```bash
cd admin
npx serve . -l 5501
```

The backend intentionally uses port 5001 for local development because the usual alternate port is reserved by a macOS system service. Add both frontend origins to `ALLOWED_ORIGINS` in `backend/.env`:

```text
ALLOWED_ORIGINS=http://localhost:5500,http://localhost:5501
```

## ⚙️ Environment variables

| Key | Purpose |
| --- | --- |
| `PORT` | Backend port; local development uses 5001 |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT lifetime, normally `7d` |
| `ALLOWED_ORIGINS` | Comma-separated customer/admin origins |
| `RAZORPAY_KEY_ID` | Optional Razorpay key for the separate payment flow |
| `RAZORPAY_KEY_SECRET` | Optional Razorpay secret |
| `ADMIN_USERNAME` | Seeded admin username |
| `ADMIN_PASSWORD` | Seeded admin password |

## 🌱 Seeding and migrations

```bash
cd backend
npm run seed       # wipes and re-inserts 58 menu items, restaurant, and 3 reviews
npm run seed:admin # creates the admin if missing; never overwrites an existing password
```

The menu seed is idempotent and leaves customers and orders untouched. The development admin is `admin` / `ChangeMe123!`; change it before deployment.

If upgrading from the phone-auth version, clear legacy customers and remove the old unique index in MongoDB:

```javascript
db.customers.deleteMany({})
db.customers.dropIndex('phone_1') // ignore "index not found"
```

## 🔌 API reference

All responses use `{ success, data?, message?, error? }`. Errors use `4xx/5xx { success: false, message }`.

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health probe; exempt from the general limiter |
| GET | `/api/restaurant` | Restaurant singleton profile |
| GET | `/api/menu?category=&search=&popular=true` | Available menu items |
| GET | `/api/menu/:id` | One available menu item |
| GET | `/api/reviews` | Approved reviews only |
| POST | `/api/reviews` | Submit a review for moderation |

Valid menu category slugs are `idli`, `dosa`, `benne_dosa`, `pesarattu`, `uttapam`, `upma`, `wada`, `bonda`, `poori`, and `snacks`.

### Customer auth

| Method | Path | Body / result |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password, phone? }`; sets `customerToken` |
| POST | `/api/auth/login` | `{ email, password }`; sets `customerToken` |
| POST | `/api/auth/logout` | Clears the customer cookie |
| GET | `/api/auth/me` | `{ _id, name, email, phone, address, createdAt }` |
| PUT | `/api/auth/address` | Updates the saved address |

### Orders

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/orders` | `{ items: [{ menuItem, quantity }], orderType, phone, customerAddress?, notes? }`; prices are recalculated server-side |
| GET | `/api/orders/my` | Logged-in customer's orders, newest first |
| GET | `/api/orders/:id` | One owned order; other customers receive 403 |
| POST | `/api/orders/razorpay/create` | Separate Razorpay flow, if configured |
| POST | `/api/orders/razorpay/verify` | Separate Razorpay signature verification |

`orderType` is `delivery`, `pickup`, or `dinein`. Orders require a valid per-order phone, are rejected when the cafe is not accepting orders, and are rejected when the subtotal is below ₹100. The customer UI currently offers COD only; Razorpay is not wired into checkout.

### Admin

All admin endpoints require `adminProtect` and an admin/owner role.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/admin/login` | `{ username, password }`; sets `adminToken` |
| POST | `/api/admin/logout` | Clears the admin cookie |
| GET | `/api/admin/me` | Current admin |
| GET | `/api/admin/orders?status=&page=&limit=` | Paginated orders with `{ data, meta: { page, limit, total, pages } }` |
| PATCH | `/api/admin/orders/:id/status` | Update status and timeline |
| GET | `/api/admin/menu` | All menu items, including unavailable items |
| POST | `/api/admin/menu` | Create a menu item |
| PUT | `/api/admin/menu/:id` | Update a menu item |
| DELETE | `/api/admin/menu/:id` | Delete a menu item |
| GET | `/api/admin/reviews?approved=false` | Moderation queue or all reviews |
| PATCH | `/api/admin/reviews/:id/approve` | Approve a review |
| DELETE | `/api/admin/reviews/:id` | Delete a review |
| PUT | `/api/admin/restaurant` | Update restaurant settings |
| GET | `/api/admin/stats` | `{ ordersToday, revenueToday, pendingOrders, avgRating, totalOrders }` |

## 🔒 Security rules and hotfixes

- Order prices are always recalculated from MongoDB.
- Orders are rejected when `isAcceptingOrders` is false or subtotal is below ₹100.
- Public reviews expose approved reviews only.
- Customers can access only their own orders.
- Admin endpoints require the `admin` or `owner` role.
- `/api/auth` and `/api/admin/login` allow 20 requests per 15 minutes; the general API limit is 300 per 15 minutes. `/api/health` is exempt.
- JWTs use HttpOnly cookies only.
- Cookies use `SameSite=Lax` in development and `SameSite=None; Secure` in production for cross-domain frontend/backend deployments.
- Express trusts one proxy hop for correct Render/Railway client IP rate limiting.
- The five critical deployment hotfixes are complete: cross-site cookie support, proxy trust, health-rate-limit bypass, minimum-order enforcement, and Razorpay option removal from customer checkout.

## 🖥️ Admin dashboard

The dashboard is a single static app at `admin/` exposed through `window.GMCAdmin`:

- **Stats:** orders today, revenue today, pending orders, average rating, and recent orders.
- **Orders:** pagination, status filters, inline status changes, cancellation, detail drawer, and status timeline.
- **Menu:** all 10 category filters, add/edit/delete, availability/popularity toggles, and image preview.
- **Reviews:** pending approval queue, approve/delete actions, and approved review list.
- **Settings:** restaurant identity, contact details, address, hours, open days, delivery fee, minimum order, ratings, and accepting-orders toggle.

## ☁️ Deployment

- **Backend:** deploy `backend/` to Render or Railway. Build: `npm install`; start: `npm start`. Set `NODE_ENV=production`, Atlas `MONGO_URI`, `JWT_SECRET`, deployed `ALLOWED_ORIGINS`, and admin credentials. The platform supplies `PORT`.
- **Frontend:** deploy `frontend/` to Vercel. Replace the production placeholder in `frontend/js/api.js` with the deployed backend URL.
- **Admin:** deploy `admin/` under an `/admin` subpath or as a separate Vercel project. Replace the production placeholder in `admin/js/admin.js` with the same backend URL.
- **Database:** use MongoDB Atlas and run the seed scripts once against the production database.

Production cookies already use `SameSite=None; Secure` when `NODE_ENV=production`, which is required when Vercel and Render/Railway use different domains. Add every deployed customer/admin origin to `ALLOWED_ORIGINS` as a comma-separated list.

## 🎨 Design system

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

The visual language pairs Fraunces display typography with Inter body text, warm cream surfaces, maroon actions, marigold highlights, soft shadows, and rounded controls.

## 📄 Pages

- **Home:** hero, six popular picks, story, reviews, visit details, and footer.
- **Menu:** live 58-item menu, category chips, search, sorting, and cart drawer.
- **Cart:** quantity controls, delivery/pickup/dine-in choice, address, required order phone, and COD checkout.
- **Customer Login:** email login/register tabs and password controls.
- **Customer Orders:** authenticated order history and status cards.
- **About:** story, values, and photo gallery.
- **Contact:** restaurant details, map, contact form fallback, and hours.
- **Admin:** login plus Stats, Orders, Menu, Reviews, and Settings tabs.

## ✅ Build status / roadmap

- ✅ Backend models, controllers, routes, seeds, and deployment hotfixes
- ✅ Customer frontend: seven pages with live API wiring
- ✅ Admin dashboard: five operational tabs
- ✅ Menu expansion to 58 South Indian items
- ✅ Email-based customer authentication
- ✅ Five critical hotfixes: SameSite cookies, proxy trust, health bypass, minimum order, and Razorpay UI removal
- ⏳ Deployment to Vercel and Render/Railway
- ⏳ Post-launch polish: dedicated contact endpoint, Place Order double-submit guard, persisted `hours.daysOpen` updates, and per-dish image refinement

## 📄 License

MIT

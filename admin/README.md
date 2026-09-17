# Madhuram Admin Dashboard

This is the single-page administration dashboard for Geeta's Madhuram Cafe. It provides cookie-authenticated access to stats, order fulfilment, menu CRUD, review moderation, and restaurant settings.

## Run locally

1. Start MongoDB and the backend on port 5001:
   `cd backend && PORT=5001 npm start`
2. Add the admin origin to `backend/.env` before browser testing:
   `ALLOWED_ORIGINS=...,http://localhost:5501,http://127.0.0.1:5501`
3. Serve this folder:
   `cd admin && npx serve . -l 5501`
4. Open `http://localhost:5501/`.

The seeded development credentials are `admin` / `ChangeMe123!`. Change the seeded account through the backend seed/admin workflow before deploying.

## Architecture

The app is a plain HTML/CSS/ES6 single-page interface. `index.html` contains the login screen, dashboard shell, panels, modal, and drawer. `css/admin.css` owns the admin-only visual system. `js/admin.js` owns API access, cookie-authenticated login, tab state, rendering, CRUD actions, confirmation dialogs, toasts, and keyboard handling.

`window.GMCAdmin` exposes:

- `GMCAdmin.api`: `get`, `post`, `put`, `patch`, `del`, and `baseUrl`
- `GMCAdmin.auth`: `me`, `login`, and `logout`
- `GMCAdmin.ui`: `toast`, `confirm`, `openDrawer`, `closeDrawer`, and `setLoading`
- `GMCAdmin.escapeHtml()` and `GMCAdmin.money()` helpers

JWTs are stored only in the backend's HttpOnly `adminToken` cookie. No admin token is written to localStorage.

## Known limitations

- Razorpay payment processing remains the backend's separate payment flow; this dashboard displays the payment method/status but does not initiate a payment.
- The development backend currently needs an explicit `http://localhost:5501` CORS entry for cross-origin browser requests.
- Production should replace the placeholder API URL in `admin/js/admin.js` or serve the admin and API from compatible production origins. When both live under one domain, CORS is not needed for same-origin requests.
# Frontend JavaScript

All pages load scripts in this order: `api.js`, `main.js`, `navbar.js`, `restaurant.js`, then the page module. `index.html` also loads `menu.js` and `reviews.js`; `menu.html` loads `menu.js`; `cart.html` loads `cart.js`; `contact.html` loads `contact.js`; and both customer pages load `customerAuth.js`.

`window.GMC` exposes `GMC.api`, `GMC.cart`, `GMC.money`, `GMC.escapeHtml`, `GMC.qs`, `GMC.qsa`, and `GMC.toast`. The cart is stored under `gmc_cart_v1` as `{ _id, name, price, quantity, image }` objects. JWTs remain in HttpOnly cookies and are never stored in localStorage.

For production, change the placeholder URL in `api.js` where `GMC.api.baseUrl` is selected for non-local hosts. The contact form temporarily posts to `/api/reviews` until a dedicated `/api/contact` endpoint is available. The current backend's standard order endpoint always creates COD orders; Razorpay needs its separate payment flow and frontend checkout integration.

(() => {
  const GMC = window.GMC = window.GMC || {};
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  GMC.api = {
    // Update this production URL after the backend is deployed on Render.
    baseUrl: isLocal ? 'http://localhost:5001' : 'https://YOUR-PRODUCTION-BACKEND.onrender.com',

    async request(path, options = {}) {
      const requestOptions = { ...options, credentials: 'include' };
      const hasBody = requestOptions.body !== undefined && requestOptions.body !== null;
      requestOptions.headers = { ...(requestOptions.headers || {}) };
      if (hasBody && typeof requestOptions.body !== 'string') {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(requestOptions.body);
      }

      const response = await fetch(`${this.baseUrl}${path}`, requestOptions);
      let payload = {};
      try {
        payload = await response.json();
      } catch (error) {
        payload = {};
      }

      if (!response.ok || payload.success === false) {
        const message = payload.error?.message || payload.message || payload.error || `Request failed (${response.status})`;
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    },

    get(path) { return this.request(path); },
    post(path, body) { return this.request(path, { method: 'POST', body }); },
    put(path, body) { return this.request(path, { method: 'PUT', body }); },
    delete(path) { return this.request(path, { method: 'DELETE' }); }
  };

  GMC.money = (value) => `₹${Math.round(Number(value) || 0)}`;

  GMC.escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  GMC.qs = (selector, root = document) => root.querySelector(selector);
  GMC.qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  GMC.toast = (message, type = 'info') => {
    let region = GMC.qs('#gmc-toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'gmc-toast-region';
      region.setAttribute('aria-live', 'polite');
      region.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:1200;display:grid;gap:10px;max-width:min(360px,calc(100vw - 40px));';
      document.body.appendChild(region);
    }
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.dataset.type = type;
    toast.style.cssText = 'padding:13px 16px;border-radius:8px;background:#241a17;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.2);font-size:.9rem;line-height:1.4;';
    if (type === 'error') toast.style.background = '#8c2f39';
    if (type === 'success') toast.style.background = '#2f6b4f';
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3600);
  };

  const CART_KEY = 'gmc_cart_v1';
  const readCart = () => {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  };
  const writeCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('gmc:cart-updated', { detail: items }));
  };

  GMC.cart = {
    get: readCart,
    set(items) { writeCart(Array.isArray(items) ? items : []); },
    add(item) {
      const items = readCart();
      const existing = items.find((entry) => String(entry._id) === String(item._id));
      if (existing) existing.quantity += 1;
      else items.push({ _id: item._id, name: item.name, price: Number(item.price) || 0, quantity: 1, image: item.image || '' });
      writeCart(items);
    },
    remove(id) { writeCart(readCart().filter((entry) => String(entry._id) !== String(id))); },
    updateQty(id, quantity) {
      const nextQuantity = Number(quantity);
      if (nextQuantity <= 0) return this.remove(id);
      writeCart(readCart().map((entry) => String(entry._id) === String(id) ? { ...entry, quantity: Math.min(50, Math.floor(nextQuantity)) } : entry));
    },
    clear() { writeCart([]); },
    count() { return readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0); },
    subtotal() { return readCart().reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0); }
  };

  GMC.auth = {
    _cached: null,
    async isLoggedIn({ fresh = false } = {}) {
      if (!fresh && GMC.auth._cached !== null) return GMC.auth._cached;
      try {
        await GMC.api.get('/api/auth/me');
        GMC.auth._cached = true;
      } catch {
        GMC.auth._cached = false;
      }
      return GMC.auth._cached;
    },
    clearCache() { GMC.auth._cached = null; }
  };
})();

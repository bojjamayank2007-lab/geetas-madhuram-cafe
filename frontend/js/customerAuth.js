(() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const loginRedirect = () => new URLSearchParams(location.search).get('next') || 'index.html';
  const activateTab = (name) => {
    GMC.qsa('.tab').forEach((tab) => { const active = tab.dataset.tab === name; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
    GMC.qsa('.auth-form').forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
  };
  const togglePassword = (button) => { const input = button.parentElement.querySelector('input'); const visible = input.type === 'password'; input.type = visible ? 'text' : 'password'; button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password'); button.querySelector('i').className = visible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'; };
  const renderOrders = (orders) => {
    const list = GMC.qs('.orders-list');
    const empty = GMC.qs('.orders-empty');
    if (!list || !empty) return;
    empty.hidden = orders.length > 0;
    list.hidden = orders.length === 0;
    list.innerHTML = orders.map((order) => {
      const status = String(order.status || 'placed');
      const statusIcon = { placed: 'clock', confirmed: 'check', preparing: 'fire', ready: 'check-double', 'out-for-delivery': 'motorcycle', delivered: 'circle-check', cancelled: 'xmark' }[status] || 'clock';
      const type = { delivery: ['motorcycle', 'Delivery'], pickup: ['store', 'Pickup'], dinein: ['chair', 'Dine-in'] }[order.orderType] || ['utensils', order.orderType];
      return `<article class="order-card reveal in"><header class="order-head"><div class="order-head-left"><b class="order-number">${GMC.escapeHtml(order.orderNumber)}</b><small class="order-date">${new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div><span class="status-badge status-${GMC.escapeHtml(status)}"><i class="fa-solid fa-${statusIcon}" aria-hidden="true"></i> ${GMC.escapeHtml(status.replaceAll('-', ' '))}</span></header><ul class="order-items">${(order.items || []).map((item) => `<li><span class="order-item-name">${GMC.escapeHtml(item.name)}</span><span class="order-item-qty">× ${item.quantity}</span><span class="order-item-price">${GMC.money(item.price * item.quantity)}</span></li>`).join('')}</ul><footer class="order-foot"><div class="order-total"><span>Total</span><b>${GMC.money(order.total)}</b></div><div class="order-actions"><span class="order-type-pill"><i class="fa-solid fa-${type[0]}" aria-hidden="true"></i> ${type[1]}</span><button type="button" class="btn btn-ghost btn-sm" data-order-id="${GMC.escapeHtml(order._id)}">View details</button></div></footer></article>`;
    }).join('');
  };

  document.addEventListener('DOMContentLoaded', () => {
    GMC.qsa('.tab').forEach((tab) => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
    GMC.qsa('[data-switch-to]').forEach((button) => button.addEventListener('click', () => activateTab(button.dataset.switchTo)));
    GMC.qsa('.pw-toggle').forEach((button) => button.addEventListener('click', () => togglePassword(button)));

    GMC.qs('#login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const email = String(data.get('email') || '').trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return GMC.toast('Enter a valid email address', 'error');
      try { await GMC.api.post('/api/auth/login', { email, password: String(data.get('password')) }); GMC.toast('Logged in successfully', 'success'); window.setTimeout(() => { location.href = loginRedirect(); }, 500); }
      catch (error) { GMC.toast(error.message, 'error'); }
    });
    GMC.qs('#register-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const email = String(data.get('email') || '').trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return GMC.toast('Enter a valid email address', 'error');
      if (data.get('password') !== data.get('confirm')) return GMC.toast('Passwords do not match', 'error');
      try { await GMC.api.post('/api/auth/register', { name: String(data.get('name')).trim(), email, password: String(data.get('password')) }); GMC.toast('Account created successfully', 'success'); window.setTimeout(() => { location.href = loginRedirect(); }, 500); }
      catch (error) { GMC.toast(error.status === 409 ? 'This email is already registered' : error.message, 'error'); }
    });

    if (location.pathname.endsWith('customer-orders.html')) {
      GMC.api.get('/api/auth/me').then(() => GMC.api.get('/api/orders/my')).then(renderOrders).catch((error) => { if (error.status === 401) location.href = 'customer-login.html?next=customer-orders.html'; else GMC.toast(error.message, 'error'); });
    }
  });
})();

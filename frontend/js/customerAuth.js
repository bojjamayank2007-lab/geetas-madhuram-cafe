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
            const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
            const timelineHtml = history.length ? `<div class="order-timeline" hidden><ul>${history.map((entry, index) => `<li class="${index === history.length - 1 ? 'is-current' : ''}"><span class="dot" aria-hidden="true"></span><div><b>${GMC.escapeHtml(String(entry.status || '').replaceAll('-', ' '))}</b><small>${new Date(entry.at || order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })}${entry.note ? ` · ${GMC.escapeHtml(entry.note)}` : ''}</small></div></li>`).join('')}</ul></div>` : '';
            return `<article class="order-card reveal in"><header class="order-head"><div class="order-head-left"><b class="order-number">${GMC.escapeHtml(order.orderNumber)}</b><small class="order-date">${new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div><span class="status-badge status-${GMC.escapeHtml(status)}"><i class="fa-solid fa-${statusIcon}" aria-hidden="true"></i> ${GMC.escapeHtml(status.replaceAll('-', ' '))}</span></header><ul class="order-items">${(order.items || []).map((item) => `<li><span class="order-item-name">${GMC.escapeHtml(item.name)}</span><span class="order-item-qty">× ${item.quantity}</span><span class="order-item-price">${GMC.money(item.price * item.quantity)}</span></li>`).join('')}</ul>${timelineHtml}<footer class="order-foot"><div class="order-total"><span>Total</span><b>${GMC.money(order.total)}</b></div><div class="order-actions"><span class="order-type-pill"><i class="fa-solid fa-${type[0]}" aria-hidden="true"></i> ${type[1]}</span>${history.length ? `<button type="button" class="btn btn-ghost btn-sm" data-toggle-timeline="${GMC.escapeHtml(order._id)}">Track order</button>` : ''}${['delivered', 'cancelled'].includes(status) ? `<button type="button" class="btn btn-fill btn-sm" data-reorder="${GMC.escapeHtml(order._id)}">Reorder</button>` : ''}<a class="btn btn-ghost btn-sm" href="receipt.html?id=${GMC.escapeHtml(order._id)}">View receipt</a></div></footer></article>`;
        }).join('');
        GMC.qsa('[data-toggle-timeline]').forEach((button) => button.addEventListener('click', () => {
            const timeline = button.closest('.order-card')?.querySelector('.order-timeline');
            if (timeline) { timeline.hidden = !timeline.hidden; button.textContent = timeline.hidden ? 'Track order' : 'Hide timeline'; }
        }));
        GMC.qsa('[data-reorder]').forEach((button) => button.addEventListener('click', async () => {
            const order = orders.find((entry) => String(entry._id) === String(button.dataset.reorder));
            if (!order) return;
            button.disabled = true;
            button.textContent = 'Adding…';
            const available = [];
            const unavailable = [];
            for (const item of order.items || []) {
                try { available.push(await GMC.api.get(`/api/menu/${encodeURIComponent(item.menuItem)}`)); } catch (error) { unavailable.push(item.name); }
            }
            if (!available.length) {
                button.disabled = false;
                button.textContent = 'Reorder';
                GMC.toast('None of these items are available right now', 'error');
                return;
            }
            available.forEach((item) => GMC.cart.add({ _id: item._id, name: item.name, price: item.price, image: item.image }));
            GMC.toast(unavailable.length ? `${unavailable.length} item(s) no longer available — added the rest` : 'Items added to cart', unavailable.length ? 'info' : 'success');
            window.setTimeout(() => { location.href = 'cart.html'; }, 600);
        }));
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
            try { await GMC.api.post('/api/auth/login', { email, password: String(data.get('password')) }); GMC.auth.clearCache(); GMC.toast('Logged in successfully', 'success'); window.setTimeout(() => { location.href = loginRedirect(); }, 500); }
            catch (error) { GMC.toast(error.message, 'error'); }
        });
        GMC.qs('#register-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(event.target);
            const email = String(data.get('email') || '').trim().toLowerCase();
            if (!EMAIL_RE.test(email)) return GMC.toast('Enter a valid email address', 'error');
            if (data.get('password') !== data.get('confirm')) return GMC.toast('Passwords do not match', 'error');
            try { await GMC.api.post('/api/auth/register', { name: String(data.get('name')).trim(), email, password: String(data.get('password')) }); GMC.auth.clearCache(); GMC.toast('Account created successfully', 'success'); window.setTimeout(() => { location.href = loginRedirect(); }, 500); }
            catch (error) { GMC.toast(error.status === 409 ? 'This email is already registered' : error.message, 'error'); }
        });

        const isOrdersPage = !!document.querySelector('.orders-list, .orders-empty');
        if (isOrdersPage) {
            GMC.api.get('/api/auth/me')
                .then(() => GMC.api.get('/api/orders/my'))
                .then(renderOrders)
                .catch((error) => {
                    if (error.status === 401) location.href = 'customer-login.html?next=customer-orders.html';
                    else GMC.toast(error.message, 'error');
                });
        }
    });
})();

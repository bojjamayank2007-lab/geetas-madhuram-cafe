(() => {
    const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

    const spicyLabel = ['Mild', 'Mildly spicy', 'Spicy', 'Very spicy'];
    const renderDish = (item) => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const category = String(item.category || '').toLowerCase();
        const spicy = Number(item.spicyLevel || 0);
        return `<article class="dish reveal" data-category="${GMC.escapeHtml(category)}" data-price="${Number(item.price) || 0}" data-popular="${Boolean(item.isPopular)}" data-id="${GMC.escapeHtml(item._id)}">
      <div class="dish-row"><h3>${GMC.escapeHtml(item.name)}</h3><span class="leader" aria-hidden="true"></span><span class="price">${GMC.money(item.price)}</span></div>
      <p class="dish-desc">${GMC.escapeHtml(item.description)}</p>
      <div class="dish-tags">
        ${item.isVeg ? '<span class="badge-veg" title="100% Veg" aria-label="Vegetarian"></span>' : ''}
        ${spicy ? `<span class="badge-spicy"><i class="fa-solid fa-pepper-hot" aria-hidden="true"></i> ${spicyLabel[spicy]}</span>` : ''}
        ${tags.map((tag) => `<span class="pill">${GMC.escapeHtml(tag)}</span>`).join('')}
      </div>
      <button class="btn btn-fill btn-sm dish-add" data-id="${GMC.escapeHtml(item._id)}" aria-label="Add ${GMC.escapeHtml(item.name)} to cart"><i class="fa-solid fa-plus" aria-hidden="true"></i> Add</button>
    </article>`;
    };

    const wireAddButtons = (itemsById) => {
        GMC.qsa('.dish-add').forEach((button) => {
            button.addEventListener('click', () => {
                const item = itemsById.get(String(button.dataset.id));
                if (!item) return;
                GMC.cart.add({ _id: item._id, name: item.name, price: item.price, image: item.image });
                GMC.toast('Added to cart', 'success');
            });
        });
    };

    const drawer = () => {
        const drawerElement = GMC.qs('#cart-drawer');
        const backdrop = GMC.qs('#cart-backdrop');
        const body = GMC.qs('#cart-drawer-body');
        if (!drawerElement || !backdrop || !body) return;

        const render = () => {
            const items = GMC.cart.get();
            body.innerHTML = items.length ? items.map((item) => `<div class="cart-item" data-id="${GMC.escapeHtml(item._id)}">
        <div class="cart-item-info"><b>${GMC.escapeHtml(item.name)}</b><small>${GMC.money(item.price)} × ${item.quantity}</small></div>
        <div class="qty"><button type="button" data-qty="decrease" aria-label="Decrease ${GMC.escapeHtml(item.name)}">−</button><span>${item.quantity}</span><button type="button" data-qty="increase" aria-label="Increase ${GMC.escapeHtml(item.name)}">+</button></div>
      </div>`).join('') : '<p class="cart-empty">Your cart is empty.</p>';
            const subtotal = GMC.qs('.cart-total b', drawerElement);
            if (subtotal) subtotal.textContent = GMC.money(GMC.cart.subtotal());
            body.querySelectorAll('[data-qty]').forEach((button) => button.addEventListener('click', () => {
                const item = GMC.cart.get().find((entry) => String(entry._id) === String(button.closest('.cart-item').dataset.id));
                if (!item) return;
                GMC.cart.updateQty(item._id, item.quantity + (button.dataset.qty === 'increase' ? 1 : -1));
                render();
            }));
        };
        const open = () => { render(); drawerElement.classList.add('open'); backdrop.hidden = false; requestAnimationFrame(() => backdrop.classList.add('open')); drawerElement.setAttribute('aria-hidden', 'false'); };
        const close = () => { drawerElement.classList.remove('open'); backdrop.classList.remove('open'); drawerElement.setAttribute('aria-hidden', 'true'); window.setTimeout(() => { backdrop.hidden = true; }, 350); };
        GMC.qsa('.nav-cart-btn').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); open(); }));
        GMC.qs('#cart-close')?.addEventListener('click', close);
        backdrop.addEventListener('click', close);
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
        window.addEventListener('gmc:cart-updated', render);
    };

    document.addEventListener('DOMContentLoaded', async () => {
        const grid = GMC.qs('#menu-grid') || GMC.qs('#popular .menu-grid');
        if (!grid) return;
        const isMenu = !!GMC.qs('#menu-grid');

        try {
            const items = await GMC.api.get(isMenu ? '/api/menu' : '/api/menu?popular=true');
            const shownItems = isMenu ? items : items.slice(0, 6);
            const itemsById = new Map(shownItems.map((item) => [String(item._id), item]));
            grid.innerHTML = shownItems.map(renderDish).join('');
            shownItems.forEach(() => { });
            wireAddButtons(itemsById);
            GMC.qsa('.reveal', grid).forEach((element) => element.classList.add('in'));

            if (isMenu) {
                let category = 'all';
                let search = '';
                const applyFilters = () => {
                    const sort = GMC.qs('#menu-sort')?.value || 'popular';
                    const filtered = shownItems.filter((item) => {
                        const matchesCategory = category === 'all' || String(item.category).toLowerCase() === category;
                        const needle = search.toLowerCase();
                        const matchesSearch = !needle || `${item.name} ${item.description}`.toLowerCase().includes(needle);
                        return matchesCategory && matchesSearch;
                    }).sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : Number(b.isPopular) - Number(a.isPopular) || a.sortOrder - b.sortOrder);
                    filtered.forEach((item) => { const card = GMC.qs(`.dish[data-id="${CSS.escape(String(item._id))}"]`, grid); if (card) grid.appendChild(card); });
                    GMC.qsa('.dish', grid).forEach((card) => { card.classList.toggle('is-hidden', !filtered.some((item) => String(item._id) === card.dataset.id)); });
                };
                GMC.qsa('[data-filter]').forEach((chip) => chip.addEventListener('click', () => { category = chip.dataset.filter; GMC.qsa('[data-filter]').forEach((entry) => entry.classList.toggle('is-on', entry === chip)); applyFilters(); }));
                let timer;
                GMC.qs('#menu-search')?.addEventListener('input', (event) => { window.clearTimeout(timer); timer = window.setTimeout(() => { search = event.target.value; applyFilters(); }, 200); });
                GMC.qs('#menu-sort')?.addEventListener('change', applyFilters);
            }
            drawer();
        } catch (error) {
            grid.innerHTML = `<p class="menu-note">${GMC.escapeHtml(error.message)}</p>`;
            GMC.toast(error.message, 'error');
        }
    });
})();

document.addEventListener('DOMContentLoaded', async () => {
  const renderBadge = () => {
    const count = GMC.cart.count();
    GMC.qsa('.cart-badge').forEach((badge) => { badge.textContent = String(count); });
    GMC.qsa('.nav-cart-btn').forEach((button) => button.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`));
  };

  renderBadge();
  window.addEventListener('gmc:cart-updated', renderBadge);

  try {
    const customer = await GMC.api.get('/api/auth/me');
    const login = GMC.qs('.nav-login');
    if (login && customer) {
      const firstName = String(customer.name || '').trim().split(/\s+/)[0] || 'Account';
      login.textContent = firstName;
      login.setAttribute('aria-haspopup', 'true');
      login.setAttribute('aria-expanded', 'false');
      login.removeAttribute('href');
      login.classList.add('nav-login-authed');

      const menu = document.createElement('div');
      menu.className = 'nav-profile-menu';
      menu.hidden = true;
      menu.innerHTML = `
        <a href="customer-orders.html"><i class="fa-solid fa-receipt" aria-hidden="true"></i> My Orders</a>
        <button type="button" data-logout><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Log out</button>
      `;
      login.parentElement.style.position = 'relative';
      login.parentElement.appendChild(menu);

      const toggle = () => {
        const open = menu.hidden;
        menu.hidden = !open;
        login.setAttribute('aria-expanded', String(open));
      };
      login.addEventListener('click', (event) => { event.preventDefault(); toggle(); });
      document.addEventListener('click', (event) => {
        if (!login.parentElement.contains(event.target)) {
          menu.hidden = true;
          login.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          menu.hidden = true;
          login.setAttribute('aria-expanded', 'false');
        }
      });
      menu.querySelector('[data-logout]').addEventListener('click', async () => {
        try { await GMC.api.post('/api/auth/logout'); } catch (error) {}
        location.reload();
      });
    }
  } catch (error) {
    // A 401 simply means the visitor is not signed in.
  }
});

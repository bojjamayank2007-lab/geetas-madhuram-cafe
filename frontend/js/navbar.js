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
      login.textContent = String(customer.name || '').trim().split(/\s+/)[0] || 'Account';
      login.href = 'customer-orders.html';
    }
  } catch (error) {
    // A 401 simply means the visitor is not signed in.
  }
});

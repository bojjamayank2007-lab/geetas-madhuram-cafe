document.addEventListener('DOMContentLoaded', () => {
  const itemsRoot = GMC.qs('.cart-page-items');
  if (!itemsRoot) return;
  const deliveryBlock = GMC.qs('#delivery-block');
  const subtotalElement = GMC.qs('.summary-row:nth-of-type(1) b');
  const deliveryFeeElement = GMC.qs('.summary-row:nth-of-type(2) b');
  const totalElement = GMC.qs('.summary-total b');
  let orderType = GMC.qs('.order-type .is-on')?.dataset.orderType || 'delivery';
  let restaurant = { deliveryFee: 20, isAcceptingOrders: true };

  GMC.api.get('/api/auth/me').then((customer) => {
    const phoneInput = GMC.qs('[name="phone"]');
    if (phoneInput && customer?.phone) phoneInput.value = customer.phone;
  }).catch(() => {});

  const render = () => {
    const items = GMC.cart.get();
    itemsRoot.innerHTML = items.length ? items.map((item) => `<article class="cart-item" data-id="${GMC.escapeHtml(item._id)}">
      <div class="cart-item-thumb" aria-hidden="true"><i class="fa-solid fa-bowl-food"></i></div>
      <div class="cart-item-info"><b>${GMC.escapeHtml(item.name)}</b><span class="cart-item-price">${GMC.money(item.price)} × ${item.quantity}</span></div>
      <div class="qty" role="group" aria-label="Quantity for ${GMC.escapeHtml(item.name)}"><button type="button" data-qty="decrease" aria-label="Decrease">−</button><span>${item.quantity}</span><button type="button" data-qty="increase" aria-label="Increase">+</button></div>
    </article>`).join('') : '<div class="cart-empty"><p>Your cart is empty.</p><a class="btn btn-fill" href="menu.html">Browse the menu</a></div>';
    if (items.length) itemsRoot.insertAdjacentHTML('beforeend', '<div class="cart-clear"><button type="button" class="link-btn"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Clear cart</button></div>');
    GMC.qsa('[data-qty]', itemsRoot).forEach((button) => button.addEventListener('click', () => {
      const id = button.closest('.cart-item').dataset.id;
      const item = GMC.cart.get().find((entry) => String(entry._id) === String(id));
      if (item) GMC.cart.updateQty(id, item.quantity + (button.dataset.qty === 'increase' ? 1 : -1));
      render();
    }));
    GMC.qs('.cart-clear .link-btn', itemsRoot)?.addEventListener('click', () => { GMC.cart.clear(); render(); GMC.toast('Cart cleared'); });
    updateSummary();
  };

  const updateSummary = () => {
    const subtotal = GMC.cart.subtotal();
    const fee = orderType === 'delivery' ? Number(restaurant.deliveryFee || 0) : 0;
    if (subtotalElement) subtotalElement.textContent = GMC.money(subtotal);
    if (deliveryFeeElement) deliveryFeeElement.textContent = GMC.money(fee);
    if (totalElement) totalElement.textContent = GMC.money(subtotal + fee);
    if (deliveryBlock) deliveryBlock.hidden = orderType !== 'delivery';
  };

  GMC.qsa('.order-type .chip').forEach((button) => button.addEventListener('click', () => {
    orderType = button.dataset.orderType;
    GMC.qsa('.order-type .chip').forEach((entry) => { const active = entry === button; entry.classList.toggle('is-on', active); entry.setAttribute('aria-checked', String(active)); });
    updateSummary();
  }));
  GMC.qsa('.pay-card').forEach((card) => card.addEventListener('click', () => { GMC.qsa('.pay-card').forEach((entry) => entry.classList.remove('is-on')); card.classList.add('is-on'); }));
  window.addEventListener('gmc:restaurant-updated', (event) => { restaurant = event.detail || restaurant; updateSummary(); });

  GMC.qs('#place-order')?.addEventListener('click', async () => {
    const items = GMC.cart.get();
    if (!items.length) return GMC.toast('Your cart is empty', 'error');
    try {
      await GMC.api.get('/api/auth/me');
      const formValue = (name) => GMC.qs(`[name="${name}"]`)?.value.trim() || '';
      const phone = formValue('phone');
      const address = { line: formValue('line1'), area: formValue('line2'), city: formValue('city'), pincode: formValue('pincode'), landmark: formValue('landmark') };
      if (!/^[6-9]\d{9}$/.test(phone)) return GMC.toast('Enter a valid 10-digit phone number', 'error');
      if (orderType === 'delivery' && (!address.line || !/^\d{6}$/.test(address.pincode))) return GMC.toast('Enter a valid delivery address', 'error');
      const paymentMethod = GMC.qs('input[name="payment"]:checked')?.value || 'cod';
      await GMC.api.post('/api/orders', { items: items.map((item) => ({ menuItem: item._id, quantity: item.quantity })), orderType, customerAddress: address, phone, notes: formValue('notes'), paymentMethod });
      GMC.cart.clear();
      GMC.toast('Order placed successfully', 'success');
      window.setTimeout(() => { location.href = 'customer-orders.html'; }, 500);
    } catch (error) {
      if (error.status === 401) return (location.href = 'customer-login.html?next=cart.html');
      GMC.toast(error.message, 'error');
    }
  });

  GMC.api.get('/api/restaurant').then((data) => { restaurant = data; updateSummary(); }).catch(() => {});
  render();
});

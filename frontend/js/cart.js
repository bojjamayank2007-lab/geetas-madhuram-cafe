document.addEventListener('DOMContentLoaded', () => {
  const itemsRoot = GMC.qs('.cart-page-items');
  if (!itemsRoot) return;
  const deliveryBlock = GMC.qs('#delivery-block');
  const subtotalElement = GMC.qs('.summary-row:nth-of-type(1) b');
  const deliveryFeeElement = GMC.qs('.summary-row:nth-of-type(2) b');
  const totalElement = GMC.qs('.summary-total b');
  let orderType = GMC.qs('.order-type .is-on')?.dataset.orderType || 'delivery';
  let restaurant = { deliveryFee: 20, isAcceptingOrders: true };

  // Payment method state
  let paymentMethod = 'cod';

  const payOnlineCard = GMC.qs('#pay-online-card');
  const payCounterCard = GMC.qs('#pay-counter-card');
  const payNote = GMC.qs('#pay-note');
  let razorpayEnabled = false;

  // Ask the backend if Razorpay is configured
  GMC.api.get('/api/orders/config')
    .then((cfg) => {
      razorpayEnabled = Boolean(cfg?.razorpayEnabled);
      if (payOnlineCard && razorpayEnabled) payOnlineCard.hidden = false;
    })
    .catch(() => { /* leave hidden */ })
    .finally(updatePayNote);

  function updatePayNote() {
    if (!payNote) return;
    const messages = [];
    if (orderType === 'delivery' && !razorpayEnabled) {
      messages.push('Online payment is not available right now — please choose Cash on Delivery.');
    }
    if (orderType === 'dinein') {
      messages.push('Dine-in orders can be paid at the counter.');
    }
    payNote.hidden = messages.length === 0;
    payNote.textContent = messages.join(' ');
  }

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
    GMC.qsa('.order-type .chip').forEach((entry) => {
      const active = entry === button;
      entry.classList.toggle('is-on', active);
      entry.setAttribute('aria-checked', String(active));
    });

    // Show / hide Pay at Counter based on order type
    if (payCounterCard) payCounterCard.hidden = orderType !== 'dinein';
    // If Pay at Counter was selected but order type changed, fall back to COD
    if (orderType !== 'dinein' && paymentMethod === 'pay_at_counter') {
      paymentMethod = 'cod';
      const codInput = GMC.qs('input[name="payment"][value="cod"]');
      if (codInput) codInput.checked = true;
      GMC.qsa('.pay-card').forEach((c) => c.classList.toggle('is-on', c.contains(codInput)));
    }

    updateSummary();
    updatePayNote();
  }));
  GMC.qsa('.pay-card').forEach((card) => card.addEventListener('click', () => {
    const input = card.querySelector('input[name="payment"]');
    if (!input) return;
    paymentMethod = input.value;
    GMC.qsa('.pay-card').forEach((entry) => entry.classList.toggle('is-on', entry === card));
  }));
  window.addEventListener('gmc:restaurant-updated', (event) => { restaurant = event.detail || restaurant; updateSummary(); });

  GMC.qs('#place-order')?.addEventListener('click', async () => {
    const items = GMC.cart.get();
    if (!items.length) return GMC.toast('Your cart is empty', 'error');

    const placeOrderBtn = GMC.qs('#place-order');
    if (placeOrderBtn.disabled) return;
    placeOrderBtn.disabled = true;
    const originalLabel = placeOrderBtn.innerHTML;
    placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Placing…';

    try {
      await GMC.api.get('/api/auth/me');

      const formValue = (name) => GMC.qs(`[name="${name}"]`)?.value.trim() || '';
      const phone = formValue('phone');
      const address = {
        line: formValue('line1'),
        area: formValue('line2'),
        city: formValue('city'),
        pincode: formValue('pincode'),
        landmark: formValue('landmark'),
      };

      if (!/^[6-9]\d{9}$/.test(phone)) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalLabel;
        return GMC.toast('Enter a valid 10-digit phone number', 'error');
      }
      if (orderType === 'delivery' && (!address.line || !/^\d{6}$/.test(address.pincode))) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalLabel;
        return GMC.toast('Enter a valid delivery address', 'error');
      }

      const orderPayload = {
        items: items.map((item) => ({ menuItem: item._id, quantity: item.quantity })),
        orderType,
        customerAddress: address,
        phone,
        notes: formValue('notes'),
        paymentMethod,
      };

      if (paymentMethod === 'razorpay') {
        await handleRazorpayCheckout(orderPayload);
      } else {
        await handleCodCheckout(orderPayload);
      }
    } catch (error) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = originalLabel;
      if (error.status === 401) {
        const next = encodeURIComponent('cart.html');
        location.href = `customer-login.html?next=${next}`;
        return;
      }
      GMC.toast(error.message, 'error');
    }
  });

  async function handleCodCheckout(payload) {
    const order = await GMC.api.post('/api/orders', payload);
    GMC.cart.clear();
    showOrderSuccess(order);
  }

  async function handleRazorpayCheckout(payload) {
    // 1) Create a Razorpay order on the backend
    const rzp = await GMC.api.post('/api/orders/razorpay/create', payload);

    // 2) Load the Razorpay checkout SDK
    await loadRazorpayScript();

    // 3) Open Razorpay checkout
    await new Promise((resolve, reject) => {
      const rzpInstance = new window.Razorpay({
        key: rzp.key_id,
        amount: rzp.amount,
        currency: rzp.currency,
        name: "Geeta's Madhuram Cafe",
        description: `Order ${rzp.orderNumber}`,
        order_id: rzp.orderId,
        handler: async (response) => {
          try {
            await GMC.api.post('/api/orders/razorpay/verify', {
              order: rzp.order,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            // Fetch the freshly-verified order for the modal
            const fresh = await GMC.api.get(`/api/orders/${rzp.order}`);
            GMC.cart.clear();
            showOrderSuccess(fresh);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
        theme: { color: '#6E2B20' },
      });
      rzpInstance.open();
    }).catch((error) => {
      if (error.message === 'Payment cancelled') {
        GMC.toast('Payment cancelled', 'info');
      } else {
        throw error;
      }
    });
  }

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
      document.head.appendChild(s);
    });
  }

  function showOrderSuccess(order) {
    const backdrop = GMC.qs('#order-success-backdrop');
    if (!backdrop) {
      GMC.toast('Order placed successfully', 'success');
      setTimeout(() => { location.href = 'customer-orders.html'; }, 500);
      return;
    }
    GMC.qs('#order-success-number').textContent = `Order #${order.orderNumber}`;
    GMC.qs('#order-success-summary').innerHTML = `
      <div class="row"><span>${order.items.length} item${order.items.length === 1 ? '' : 's'}</span><b>${GMC.money(order.subtotal)}</b></div>
      ${order.deliveryFee > 0 ? `<div class="row"><span>Delivery fee</span><b>${GMC.money(order.deliveryFee)}</b></div>` : ''}
      <div class="row total"><span>Total (${order.paymentMethod.toUpperCase()})</span><b>${GMC.money(order.total)}</b></div>
    `;
    GMC.qs('#order-success-receipt').href = `receipt.html?id=${encodeURIComponent(order._id)}`;
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
  }

  GMC.api.get('/api/restaurant').then((data) => { restaurant = data; updateSummary(); }).catch(() => {});
  const successBackdrop = GMC.qs('#order-success-backdrop');
  if (successBackdrop) {
    const closeSuccess = () => {
      successBackdrop.classList.remove('is-open');
      window.setTimeout(() => { window.location.href = 'customer-orders.html'; }, 300);
    };
    successBackdrop.addEventListener('click', (event) => { if (event.target === successBackdrop) closeSuccess(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && successBackdrop.classList.contains('is-open')) closeSuccess(); });
  }
  render();
});

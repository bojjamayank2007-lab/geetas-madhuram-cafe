document.addEventListener('DOMContentLoaded', async () => {
  const root = GMC.qs('#receipt');
  if (!root) return;

  GMC.qs('#receipt-back')?.addEventListener('click', () => history.length > 1 ? history.back() : (location.href = 'customer-orders.html'));
  GMC.qs('#receipt-print')?.addEventListener('click', () => window.print());

  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    root.innerHTML = '<p class="receipt-error">No order specified. <a href="customer-orders.html">View all orders</a></p>';
    return;
  }

  let order;
  let restaurant;
  try {
    [order, restaurant] = await Promise.all([
      GMC.api.get(`/api/orders/${encodeURIComponent(id)}`),
      GMC.api.get('/api/restaurant').catch(() => null),
    ]);
  } catch (error) {
    if (error.status === 401) {
      location.href = `customer-login.html?next=${encodeURIComponent(`receipt.html?id=${id}`)}`;
      return;
    }
    root.innerHTML = `<p class="receipt-error">${GMC.escapeHtml(error.message)}</p>`;
    return;
  }

  const created = new Date(order.createdAt);
  const dateStr = created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = created.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const typeLabel = { delivery: 'Delivery', pickup: 'Pickup', dinein: 'Dine-in' }[order.orderType] || order.orderType;
  const itemsRows = (order.items || []).map((item) => `<tr><td>${GMC.escapeHtml(item.name)}</td><td class="num">${item.quantity}</td><td class="num">${GMC.money(item.price)}</td><td class="num">${GMC.money(item.price * item.quantity)}</td></tr>`).join('');
  const address = order.customerAddress || {};
  const addressHtml = order.orderType === 'delivery' && (address.line || address.area) ? `<div class="receipt-block"><b>Delivery address</b><p>${GMC.escapeHtml(address.line || '')}${address.area ? `<br>${GMC.escapeHtml(address.area)}` : ''}${address.landmark ? `<br>${GMC.escapeHtml(address.landmark)}` : ''}${address.city ? `<br>${GMC.escapeHtml(address.city)}` : ''}${address.pincode ? ` – ${GMC.escapeHtml(address.pincode)}` : ''}</p></div>` : '';

  root.innerHTML = `<header class="receipt-head"><div class="receipt-brand"><div class="receipt-brand-mark" aria-hidden="true">M</div><div><b>${GMC.escapeHtml(restaurant?.name || "Geeta's Madhuram Cafe")}</b><small>${GMC.escapeHtml(restaurant?.address || 'Agra Road, Kaneri, Bhiwandi')}</small><small>${GMC.escapeHtml(restaurant?.phone || '095619 79727')}</small></div></div><div class="receipt-meta"><b>Receipt</b><span>${GMC.escapeHtml(order.orderNumber)}</span></div></header><div class="receipt-info"><div class="receipt-block"><b>Order details</b><p>Placed ${GMC.escapeHtml(dateStr)} at ${GMC.escapeHtml(timeStr)}<br>Type: ${GMC.escapeHtml(typeLabel)}<br>Payment: ${GMC.escapeHtml((order.paymentMethod || 'cod').toUpperCase())} · ${GMC.escapeHtml(order.paymentStatus || 'pending')}</p></div><div class="receipt-block"><b>Customer</b><p>${GMC.escapeHtml(order.customer?.name || 'Guest')}<br>${GMC.escapeHtml(order.phone || order.customer?.phone || '')}</p></div>${addressHtml}</div><table class="receipt-table"><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr></thead><tbody>${itemsRows}</tbody></table><div class="receipt-totals"><div class="row"><span>Subtotal</span><b>${GMC.money(order.subtotal)}</b></div>${order.deliveryFee ? `<div class="row"><span>Delivery fee</span><b>${GMC.money(order.deliveryFee)}</b></div>` : ''}${order.discount ? `<div class="row"><span>Discount</span><b>−${GMC.money(order.discount)}</b></div>` : ''}<div class="row total"><span>Total</span><b>${GMC.money(order.total)}</b></div></div>${order.notes ? `<div class="receipt-note"><b>Notes:</b> ${GMC.escapeHtml(order.notes)}</div>` : ''}<footer class="receipt-foot"><p>Thank you for ordering from Geeta's Madhuram Cafe.</p><p class="receipt-thanks">Taste the South in Every Bite!</p></footer>`;
});

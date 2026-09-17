document.addEventListener('DOMContentLoaded', async () => {
  const formatHours = (hours) => hours ? `Open daily ${hours.open} – ${hours.close}` : '';
  const setText = (selector, value) => GMC.qsa(selector).forEach((element) => { element.textContent = value || ''; });
  try {
    const restaurant = await GMC.api.get('/api/restaurant');
    const phone = restaurant.phone || '';
    setText('[data-restaurant="phone"]', phone);
    setText('[data-restaurant="hours"]', formatHours(restaurant.hours));
    setText('[data-restaurant="address"]', restaurant.address);
    setText('[data-restaurant="plus-code"]', restaurant.plusCode);
    setText('[data-restaurant="tagline"]', restaurant.tagline);
    const phoneDigits = phone.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');
    GMC.qsa('[data-restaurant="phone-link"]').forEach((link) => { link.textContent = phone; link.href = `tel:+91${phoneDigits}`; });
    GMC.qsa('[data-restaurant="delivery-fee"]').forEach((element) => { element.textContent = GMC.money(restaurant.deliveryFee); });
    GMC.qsa('[data-restaurant="swiggy"]').forEach((link) => { link.href = restaurant.swiggyUrl; });
    if (!restaurant.isAcceptingOrders) {
      const banner = document.createElement('div');
      banner.textContent = `We're currently not accepting online orders. Please call ${phone}.`;
      banner.style.cssText = 'padding:12px 20px;text-align:center;background:#8c2f39;color:#fff;font-size:.9rem;';
      document.body.prepend(banner);
      const placeOrder = GMC.qs('#place-order');
      if (placeOrder) { placeOrder.disabled = true; placeOrder.setAttribute('aria-disabled', 'true'); }
    }
    window.dispatchEvent(new CustomEvent('gmc:restaurant-updated', { detail: restaurant }));
  } catch (error) {
    GMC.toast(error.message, 'error');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = GMC.qs('#contact-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (name.length < 2) return GMC.toast('Please enter your name', 'error');
    if (!/^[6-9]\d{9}$/.test(phone)) return GMC.toast('Enter a valid 10-digit phone number', 'error');
    if (message.length < 5) return GMC.toast('Message must be at least 5 characters', 'error');
    try {
      // TEMPORARY HACK: use reviews until a dedicated /api/contact endpoint exists.
      await GMC.api.post('/api/reviews', { name, rating: 5, message });
      GMC.toast("Thanks! We'll get back to you soon.", 'success');
      form.reset();
    } catch (error) {
      GMC.toast(error.message, 'error');
    }
  });
});

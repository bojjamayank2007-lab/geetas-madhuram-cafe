document.addEventListener('DOMContentLoaded', async () => {
  const list = GMC.qs('#reviews-list');
  if (!list) return;

  try {
    const reviews = await GMC.api.get('/api/reviews');
    if (!reviews.length) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-face-smile-beam" aria-hidden="true"></i>
          <p>No reviews yet — be the first to share your experience!</p>
        </div>`;
    } else {
      list.innerHTML = reviews.map((review) => `
        <article class="review-card reveal in">
          <header class="review-card-head">
            <b>${GMC.escapeHtml(review.name)}</b>
            <span class="stars" aria-label="${review.rating} out of 5">
              ${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}
            </span>
          </header>
          <p>"${GMC.escapeHtml(review.message)}"</p>
          <small class="review-date">
            ${new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </small>
        </article>
      `).join('');
    }
  } catch (error) {
    list.innerHTML = `<p class="menu-note">${GMC.escapeHtml(error.message)}</p>`;
  }

  const form = GMC.qs('#review-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const message = String(data.get('message') || '').trim();
    const rating = Number(data.get('rating'));

    if (name.length < 2) return GMC.toast('Please enter your name', 'error');
    if (message.length < 3) return GMC.toast('Please write a short review', 'error');

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Submitting…';

    try {
      await GMC.api.post('/api/reviews', { name, rating, message });
      GMC.toast('Thanks! Your review is awaiting approval.', 'success');
      form.reset();
    } catch (error) {
      GMC.toast(error.message, 'error');
    } finally {
      submit.disabled = false;
      submit.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Submit review';
    }
  });
});
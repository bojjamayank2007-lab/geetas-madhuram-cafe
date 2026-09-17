document.addEventListener('DOMContentLoaded', async () => {
  const rail = GMC.qs('.rail-scroll');
  if (!rail) return;
  try {
    const reviews = await GMC.api.get('/api/reviews');
    rail.innerHTML = reviews.slice(0, 3).map((review) => `<figure class="quote"><span class="stars" aria-label="${Number(review.rating)} out of 5 stars">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}</span><p>"${GMC.escapeHtml(review.message)}"</p><cite>${GMC.escapeHtml(review.name)} · Guest review</cite></figure>`).join('');
  } catch (error) {
    GMC.toast(error.message, 'error');
  }
  const scrollByCard = (direction) => { const card = GMC.qs('.quote', rail); rail.scrollBy({ left: direction * (card ? card.getBoundingClientRect().width + 20 : rail.clientWidth), behavior: 'smooth' }); };
  GMC.qs('[data-rail-prev]')?.addEventListener('click', () => scrollByCard(-1));
  GMC.qs('[data-rail-next]')?.addEventListener('click', () => scrollByCard(1));
});

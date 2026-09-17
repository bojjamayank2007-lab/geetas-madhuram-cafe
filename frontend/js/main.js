document.addEventListener('DOMContentLoaded', () => {
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;

  GMC.qsa('.reveal').forEach((element) => observer ? observer.observe(element) : element.classList.add('in'));

  const toggle = GMC.qs('.nav-toggle');
  const links = GMC.qs('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const year = GMC.qs('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  GMC.qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = GMC.qs(link.getAttribute('href'));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

class AltaeronHome extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    this.querySelectorAll('[data-slider]').forEach((slider) => {
      const scope = slider.closest('.ah-shell');
      const cards = [...slider.children];
      const step = () => (cards[0]?.getBoundingClientRect().width || 0) + 12;
      scope?.querySelector('[data-slider-prev]')?.addEventListener('click', () => slider.scrollBy({ left: -step(), behavior: 'smooth' }));
      scope?.querySelector('[data-slider-next]')?.addEventListener('click', () => slider.scrollBy({ left: step(), behavior: 'smooth' }));
      const dots = [...(scope?.querySelectorAll('[data-slider-dots] .ah-dot') || [])];
      dots.forEach((dot, index) => dot.addEventListener('click', () => slider.scrollTo({ left: step() * index, behavior: 'smooth' })));
      const updateDots = () => {
        const index = Math.min(dots.length - 1, Math.max(0, Math.round(slider.scrollLeft / Math.max(1, step()))));
        dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
      };
      slider.addEventListener('scroll', updateDots, { passive: true });
      updateDots();
      slider.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        if (!cards[0]) return;
        slider.scrollBy({ left: step() * (event.key === 'ArrowRight' ? 1 : -1), behavior: 'smooth' });
      });
    });
  }
}
if (!customElements.get('altaeron-home')) customElements.define('altaeron-home', AltaeronHome);

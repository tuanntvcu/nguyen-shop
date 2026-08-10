class AltaeronHome extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready === 'true') return;
    this.dataset.ready = 'true';
    this.initSliders();
    this.initQuiz();
    this.initVideoModal();
    this.initTracking();
  }

  initSliders() {
    this.querySelectorAll('[data-slider]').forEach((slider) => {
      const cards = [...slider.children];
      const dotsHost = slider.closest('.ah-shell')?.querySelector('[data-slider-dots]');
      if (!cards.length || !dotsHost) return;
      const visible = () => Math.max(1, Math.round(slider.clientWidth / cards[0].getBoundingClientRect().width));
      const pages = () => Math.max(1, cards.length - visible() + 1);

      const renderDots = () => {
        dotsHost.replaceChildren();
        for (let index = 0; index < pages(); index += 1) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = `ah-dot${index === 0 ? ' is-active' : ''}`;
          dot.setAttribute('aria-label', `${this.dataset.slideLabel} ${index + 1}`);
          dot.addEventListener('click', () => cards[index]?.scrollIntoView({ behavior: this.reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'start' }));
          dotsHost.append(dot);
        }
        dotsHost.hidden = pages() <= 1;
      };
      const updateDots = () => {
        const step = (cards[0]?.getBoundingClientRect().width || 1) + 16;
        const active = Math.min(pages() - 1, Math.max(0, Math.round(slider.scrollLeft / step)));
        dotsHost.querySelectorAll('.ah-dot').forEach((dot, index) => dot.classList.toggle('is-active', index === active));
      };
      renderDots();
      slider.addEventListener('scroll', updateDots, { passive: true });
      slider.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const amount = (cards[0]?.getBoundingClientRect().width || 0) + 16;
        slider.scrollBy({ left: event.key === 'ArrowRight' ? amount : -amount, behavior: this.reducedMotion ? 'auto' : 'smooth' });
      });
      const scrollOne = (direction) => slider.scrollBy({ left: direction * ((cards[0]?.getBoundingClientRect().width || 0) + 16), behavior: this.reducedMotion ? 'auto' : 'smooth' });
      slider.parentElement?.querySelector('[data-slider-prev]')?.addEventListener('click', () => scrollOne(-1));
      slider.parentElement?.querySelector('[data-slider-next]')?.addEventListener('click', () => scrollOne(1));
      new ResizeObserver(renderDots).observe(slider);
    });
  }

  initQuiz() {
    const quiz = this.querySelector('[data-quiz]');
    if (!quiz) return;
    const steps = [...quiz.querySelectorAll('[data-quiz-step]')];
    const markers = [...quiz.querySelectorAll('.ah-progress span')];
    const result = quiz.querySelector('[data-quiz-result]');
    quiz.querySelectorAll('[data-quiz-choice]').forEach((choice) => choice.setAttribute('aria-pressed', 'false'));
    let current = 0;
    let recommendation = { title: '', url: '' };

    const showStep = (index) => {
      steps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === index));
      markers.forEach((marker, markerIndex) => marker.classList.toggle('is-active', markerIndex <= index));
      current = index;
      steps[current]?.querySelector('[data-quiz-choice]')?.focus();
    };

    quiz.addEventListener('click', (event) => {
      const back = event.target.closest('[data-quiz-back]');
      if (back) {
        showStep(Math.max(0, current - 1));
        return;
      }
      const choice = event.target.closest('[data-quiz-choice]');
      if (choice) {
        const step = steps[current];
        step?.querySelectorAll('[data-quiz-choice]').forEach((button) => {
          button.classList.toggle('is-selected', button === choice);
          button.setAttribute('aria-pressed', button === choice ? 'true' : 'false');
        });
        if (step) step.dataset.answer = choice.textContent.trim();
        step?.querySelector('[data-quiz-next]')?.removeAttribute('disabled');
        if (current === 0) {
          recommendation = { title: choice.dataset.title || choice.textContent.trim(), url: choice.dataset.url || '' };
          if (!quiz.dataset.started) {
            quiz.dataset.started = 'true';
            this.track('quiz_started', { concern: recommendation.title });
          }
        }
        return;
      }
      const next = event.target.closest('[data-quiz-next]');
      if (!next || next.disabled || !steps[current]?.dataset.answer) return;
      this.track('quiz_step_completed', { step: current + 1, answer: steps[current].dataset.answer });
      if (current + 1 < steps.length) {
        showStep(current + 1);
        return;
      }
      steps[current]?.classList.remove('is-active');
      result.hidden = false;
      result.querySelector('[data-quiz-result-title]').textContent = recommendation.title;
      const link = result.querySelector('[data-quiz-result-link]');
      if (recommendation.url) link.href = recommendation.url;
      link.focus();
      this.track('quiz_completed', { concern: recommendation.title });
      this.track('quiz_result_viewed', { concern: recommendation.title });
    });
  }

  initVideoModal() {
    const modal = this.querySelector('[data-video-modal]');
    if (!modal) return;
    const video = modal.querySelector('video');
    const title = modal.querySelector('[data-video-modal-title]');
    const close = () => {
      video?.pause();
      if (modal.open) modal.close();
    };
    this.querySelectorAll('[data-video-open]').forEach((button) => button.addEventListener('click', () => {
      if (title) title.textContent = button.dataset.videoTitle || this.dataset.demoTitle;
      const source = video?.querySelector('source');
      if (source && button.dataset.videoSrc && source.src !== button.dataset.videoSrc) {
        source.src = button.dataset.videoSrc;
        video.poster = button.dataset.videoPoster || '';
        video.load();
      }
      modal.showModal();
      modal.querySelector('[data-video-close]')?.focus();
    }));
    modal.querySelector('[data-video-close]')?.addEventListener('click', close);
    modal.addEventListener('cancel', () => video?.pause());
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  }

  initTracking() {
    this.addEventListener('click', (event) => {
      const target = event.target.closest('[data-track]');
      if (!target) return;
      if (target.dataset.track === 'faq_open' && target.parentElement?.open) return;
      this.track(target.dataset.track, {
        label: target.textContent.trim().slice(0, 120),
        href: target.getAttribute('href') || undefined,
      });
    });
  }

  track(eventName, detail = {}) {
    if (!eventName) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...detail });
    this.dispatchEvent(new CustomEvent('altaeron:track', { bubbles: true, detail: { event: eventName, ...detail } }));
  }

  get reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

if (!customElements.get('altaeron-home')) customElements.define('altaeron-home', AltaeronHome);

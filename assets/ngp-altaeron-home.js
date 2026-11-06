class ngp_NgpAltaeronHome extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready === 'true') return;
    this.dataset.ready = 'true';
    this.ngp_initSliders();
    this.ngp_initQuiz();
    this.ngp_initVideoModal();
    this.ngp_initTracking();
  }
  ngp_initSliders() {
    this.querySelectorAll('[data-slider]').forEach(ngp_slider => {
      const ngp_cards = [...ngp_slider.children];
      const ngp_dotsHost = ngp_slider.closest('.ngp-ah-shell')?.querySelector('[data-slider-dots]');
      const ngp_carouselWrap = ngp_slider.closest('.ngp-ah-carousel-wrap');
      const ngp_arrows = [...(ngp_carouselWrap?.querySelectorAll('[data-slider-prev], [data-slider-next]') || [])];
      if (!ngp_cards.length || !ngp_dotsHost) return;
      const ngp_visible = () => Math.max(1, Math.round(ngp_slider.clientWidth / ngp_cards[0].getBoundingClientRect().width));
      const ngp_pages = () => Math.max(1, ngp_cards.length - ngp_visible() + 1);
      const ngp_renderDots = () => {
        const ngp_hasOverflow = ngp_pages() > 1;
        ngp_dotsHost.replaceChildren();
        for (let ngp_index = 0; ngp_index < ngp_pages(); ngp_index += 1) {
          const ngp_dot = document.createElement('button');
          ngp_dot.type = 'button';
          ngp_dot.className = `ngp-ah-dot${ngp_index === 0 ? ' ngp-is-active' : ''}`;
          ngp_dot.setAttribute('aria-label', `${this.dataset.slideLabel} ${ngp_index + 1}`);
          ngp_dot.addEventListener('click', () => ngp_cards[ngp_index]?.scrollIntoView({
            behavior: this.ngp_reducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'start'
          }));
          ngp_dotsHost.append(ngp_dot);
        }
        ngp_dotsHost.hidden = !ngp_hasOverflow;
        ngp_arrows.forEach(ngp_arrow => {
          ngp_arrow.hidden = !ngp_hasOverflow;
          ngp_arrow.setAttribute('aria-hidden', ngp_hasOverflow ? 'false' : 'true');
          ngp_arrow.tabIndex = ngp_hasOverflow ? 0 : -1;
        });
        ngp_slider.classList.toggle('ngp-ah-slider--static', !ngp_hasOverflow);
      };
      const ngp_updateDots = () => {
        const ngp_step = (ngp_cards[0]?.getBoundingClientRect().width || 1) + 16;
        const ngp_active = Math.min(ngp_pages() - 1, Math.max(0, Math.round(ngp_slider.scrollLeft / ngp_step)));
        ngp_dotsHost.querySelectorAll('.ngp-ah-dot').forEach((ngp_dot, ngp_index) => ngp_dot.classList.toggle('ngp-is-active', ngp_index === ngp_active));
      };
      ngp_renderDots();
      ngp_slider.addEventListener('scroll', ngp_updateDots, {
        passive: true
      });
      ngp_slider.addEventListener('keydown', ngp_event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(ngp_event.key)) return;
        ngp_event.preventDefault();
        const ngp_amount = (ngp_cards[0]?.getBoundingClientRect().width || 0) + 16;
        ngp_slider.scrollBy({
          left: ngp_event.key === 'ArrowRight' ? ngp_amount : -ngp_amount,
          behavior: this.ngp_reducedMotion ? 'auto' : 'smooth'
        });
      });
      const ngp_scrollOne = ngp_direction => ngp_slider.scrollBy({
        left: ngp_direction * ((ngp_cards[0]?.getBoundingClientRect().width || 0) + 16),
        behavior: this.ngp_reducedMotion ? 'auto' : 'smooth'
      });
      ngp_slider.parentElement?.querySelector('[data-slider-prev]')?.addEventListener('click', () => ngp_scrollOne(-1));
      ngp_slider.parentElement?.querySelector('[data-slider-next]')?.addEventListener('click', () => ngp_scrollOne(1));
      new ResizeObserver(ngp_renderDots).observe(ngp_slider);
    });
  }
  ngp_initQuiz() {
    const ngp_quiz = this.querySelector('[data-quiz]');
    if (!ngp_quiz) return;
    const ngp_steps = [...ngp_quiz.querySelectorAll('[data-quiz-step]')];
    const ngp_markers = [...ngp_quiz.querySelectorAll('.ngp-ah-progress span')];
    const ngp_result = ngp_quiz.querySelector('[data-quiz-result]');
    ngp_quiz.querySelectorAll('[data-quiz-choice]').forEach(ngp_choice => ngp_choice.setAttribute('aria-pressed', 'false'));
    let ngp_current = 0;
    let ngp_recommendation = {
      title: '',
      url: ''
    };
    const ngp_showStep = ngp_index => {
      ngp_steps.forEach((ngp_step, ngp_stepIndex) => ngp_step.classList.toggle('ngp-is-active', ngp_stepIndex === ngp_index));
      ngp_markers.forEach((ngp_marker, ngp_markerIndex) => ngp_marker.classList.toggle('ngp-is-active', ngp_markerIndex <= ngp_index));
      ngp_current = ngp_index;
      ngp_steps[ngp_current]?.querySelector('[data-quiz-choice]')?.focus();
    };
    ngp_quiz.addEventListener('click', ngp_event => {
      const ngp_back = ngp_event.target.closest('[data-quiz-back]');
      if (ngp_back) {
        ngp_showStep(Math.max(0, ngp_current - 1));
        return;
      }
      const ngp_choice = ngp_event.target.closest('[data-quiz-choice]');
      if (ngp_choice) {
        const ngp_step = ngp_steps[ngp_current];
        ngp_step?.querySelectorAll('[data-quiz-choice]').forEach(ngp_button => {
          ngp_button.classList.toggle('is-selected', ngp_button === ngp_choice);
          ngp_button.setAttribute('aria-pressed', ngp_button === ngp_choice ? 'true' : 'false');
        });
        if (ngp_step) ngp_step.dataset.answer = ngp_choice.textContent.trim();
        ngp_step?.querySelector('[data-quiz-next]')?.removeAttribute('disabled');
        if (ngp_current === 0) {
          ngp_recommendation = {
            title: ngp_choice.dataset.title || ngp_choice.textContent.trim(),
            url: ngp_choice.dataset.url || ''
          };
          if (!ngp_quiz.dataset.started) {
            ngp_quiz.dataset.started = 'true';
            this.ngp_track('quiz_started', {
              concern: ngp_recommendation.title
            });
          }
        }
        return;
      }
      const ngp_next = ngp_event.target.closest('[data-quiz-next]');
      if (!ngp_next || ngp_next.disabled || !ngp_steps[ngp_current]?.dataset.answer) return;
      this.ngp_track('quiz_step_completed', {
        step: ngp_current + 1,
        answer: ngp_steps[ngp_current].dataset.answer
      });
      if (ngp_current + 1 < ngp_steps.length) {
        ngp_showStep(ngp_current + 1);
        return;
      }
      ngp_steps[ngp_current]?.classList.remove('ngp-is-active');
      ngp_result.hidden = false;
      ngp_result.querySelector('[data-quiz-result-title]').textContent = ngp_recommendation.title;
      const ngp_link = ngp_result.querySelector('[data-quiz-result-link]');
      if (ngp_recommendation.url) ngp_link.href = ngp_recommendation.url;
      ngp_link.focus();
      this.ngp_track('quiz_completed', {
        concern: ngp_recommendation.title
      });
      this.ngp_track('quiz_result_viewed', {
        concern: ngp_recommendation.title
      });
    });
  }
  ngp_initVideoModal() {
    const ngp_modal = this.querySelector('[data-video-modal]');
    if (!ngp_modal) return;
    const ngp_video = ngp_modal.querySelector('video');
    const ngp_title = ngp_modal.querySelector('[data-video-modal-title]');
    const ngp_close = () => {
      ngp_video?.pause();
      if (ngp_modal.open) ngp_modal.close();
    };
    this.querySelectorAll('[data-video-open]').forEach(ngp_button => ngp_button.addEventListener('click', () => {
      if (ngp_title) ngp_title.textContent = ngp_button.dataset.videoTitle || this.dataset.demoTitle;
      const ngp_source = ngp_video?.querySelector('source');
      if (ngp_source && ngp_button.dataset.videoSrc && ngp_source.src !== ngp_button.dataset.videoSrc) {
        ngp_source.src = ngp_button.dataset.videoSrc;
        ngp_video.poster = ngp_button.dataset.videoPoster || '';
        ngp_video.load();
      }
      ngp_modal.showModal();
      ngp_modal.querySelector('[data-video-close]')?.focus();
    }));
    ngp_modal.querySelector('[data-video-close]')?.addEventListener('click', ngp_close);
    ngp_modal.addEventListener('cancel', () => ngp_video?.pause());
    ngp_modal.addEventListener('click', ngp_event => {
      if (ngp_event.target === ngp_modal) ngp_close();
    });
  }
  ngp_initTracking() {
    this.addEventListener('click', ngp_event => {
      const ngp_target = ngp_event.target.closest('[data-track]');
      if (!ngp_target) return;
      if (ngp_target.dataset.track === 'faq_open' && ngp_target.parentElement?.open) return;
      this.ngp_track(ngp_target.dataset.track, {
        label: ngp_target.textContent.trim().slice(0, 120),
        href: ngp_target.getAttribute('href') || undefined
      });
    });
  }
  ngp_track(ngp_eventName, ngp_detail = {}) {
    if (!ngp_eventName) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: ngp_eventName,
      ...ngp_detail
    });
    this.dispatchEvent(new CustomEvent('altaeron:track', {
      bubbles: true,
      detail: {
        event: ngp_eventName,
        ...ngp_detail
      }
    }));
  }
  get ngp_reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
if (!customElements.get('ngp-altaeron-home')) customElements.define('ngp-altaeron-home', ngp_NgpAltaeronHome);

(() => {
  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initAltaeron(root) {
    if (!root || root.dataset.altaeronReady === 'true') return;
    root.dataset.altaeronReady = 'true';

    const chapterMarker = root.querySelector('.altaeron__services--desktop') || root.querySelector('.altaeron__mobile-nav');
    const chapters = Array.from(root.querySelectorAll('[data-chapter-order]'));
    if (chapterMarker && chapters.length) {
      chapters
        .sort((a, b) => Number(a.dataset.chapterOrder) - Number(b.dataset.chapterOrder))
        .forEach((chapter) => root.insertBefore(chapter, chapterMarker));
    }

    const particleHost = root.querySelector('[data-particles]');
    if (particleHost && motionOK) {
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < 18; index += 1) {
        const particle = document.createElement('i');
        particle.className = 'altaeron__particle';
        particle.style.setProperty('--left', `${38 + Math.random() * 58}%`);
        particle.style.setProperty('--size', `${1 + Math.random() * 3}px`);
        particle.style.setProperty('--duration', `${5 + Math.random() * 7}s`);
        particle.style.setProperty('--drift', `${-55 + Math.random() * 110}px`);
        particle.style.animationDelay = `${Math.random() * -10}s`;
        fragment.appendChild(particle);
      }
      particleHost.appendChild(fragment);
    }

    const revealItems = root.querySelectorAll('[data-reveal]');
    if (!motionOK || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      revealItems.forEach((item) => observer.observe(item));
      const heroContent = root.querySelector('[data-reveal="hero"]');
      if (heroContent) requestAnimationFrame(() => heroContent.classList.add('is-visible'));
    }

    root.querySelectorAll('[data-slider]').forEach((track) => {
      const name = track.dataset.sliderName;
      const controls = root.querySelector(`[data-slider-ui="${name}"]`);
      if (!controls) return;
      const slides = Array.from(track.querySelectorAll('[data-slide]'));
      const dotsHost = controls.querySelector('[data-dots]');
      if (!slides.length || !dotsHost) return;

      const dots = slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.classList.toggle('is-active', index === 0);
        dot.setAttribute('aria-label', slide.getAttribute('aria-label') || `${index + 1}`);
        if (index === 0) dot.setAttribute('aria-current', 'true');
        dot.addEventListener('click', () => slide.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto', block: 'nearest', inline: 'center' }));
        dotsHost.appendChild(dot);
        return dot;
      });

      const updateDots = () => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let activeIndex = 0;
        let closest = Infinity;
        slides.forEach((slide, index) => {
          const distance = Math.abs(center - (slide.offsetLeft + slide.offsetWidth / 2));
          if (distance < closest) { closest = distance; activeIndex = index; }
        });
        dots.forEach((dot, index) => {
          dot.classList.toggle('is-active', index === activeIndex);
          dot.toggleAttribute('aria-current', index === activeIndex);
        });
      };

      let scheduled = false;
      track.addEventListener('scroll', () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { updateDots(); scheduled = false; });
      }, { passive: true });
      controls.querySelector('[data-prev]')?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * .84, behavior: motionOK ? 'smooth' : 'auto' }));
      controls.querySelector('[data-next]')?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * .84, behavior: motionOK ? 'smooth' : 'auto' }));
      track.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        track.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * track.clientWidth * .84, behavior: motionOK ? 'smooth' : 'auto' });
      });
    });

    const story = root.querySelector('[data-story]');
    if (story) {
      const slides = Array.from(story.querySelectorAll('[data-story-slide]'));
      const controls = Array.from(story.querySelectorAll('[data-story-nav]'));
      const showStory = (index) => {
        slides.forEach((slide, slideIndex) => {
          const active = slideIndex === index;
          slide.classList.toggle('is-active', active);
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
          slide.inert = !active;
        });
        controls.forEach((control, controlIndex) => {
          const active = controlIndex === index;
          control.classList.toggle('is-active', active);
          control.toggleAttribute('aria-current', active);
        });
      };
      controls.forEach((control, index) => control.addEventListener('click', () => showStory(index)));
      root.addEventListener('shopify:block:select', (event) => {
        const selectedSlide = event.target.closest?.('[data-story-slide]');
        const selectedIndex = slides.indexOf(selectedSlide);
        if (selectedIndex >= 0) showStory(selectedIndex);
      });
      showStory(0);
    }

    root.addEventListener('shopify:block:select', (event) => {
      const selectedCard = event.target.closest?.('[data-slide]');
      selectedCard?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
    });

    const processTrack = root.querySelector('[data-slider-name="process"]');
    const processTimeline = root.querySelector('[data-process-timeline]');
    if (processTrack && processTimeline) {
      const slides = Array.from(processTrack.querySelectorAll('[data-slide]'));
      const controls = Array.from(processTimeline.querySelectorAll('[data-process-nav]'));
      const progress = processTimeline.querySelector(':scope > span');
      const updateProcess = (activeIndex) => {
        controls.forEach((control, index) => {
          const active = activeIndex === index;
          control.classList.toggle('is-active', active);
          control.toggleAttribute('aria-current', active);
        });
        if (progress) progress.style.setProperty('--process-progress', `${slides.length > 1 ? activeIndex / (slides.length - 1) * 100 : 100}%`);
      };
      controls.forEach((control, index) => control.addEventListener('click', () => {
        slides[index]?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
        updateProcess(index);
      }));
      let processFrame = false;
      processTrack.addEventListener('scroll', () => {
        if (processFrame) return;
        processFrame = true;
        requestAnimationFrame(() => {
          const center = processTrack.scrollLeft + processTrack.clientWidth / 2;
          let active = 0;
          let nearest = Infinity;
          slides.forEach((slide, index) => {
            const distance = Math.abs(center - (slide.offsetLeft + slide.offsetWidth / 2));
            if (distance < nearest) { nearest = distance; active = index; }
          });
          updateProcess(active);
          processFrame = false;
        });
      }, { passive: true });
      updateProcess(0);
    }

    const videoDialog = root.querySelector('[data-video-dialog]');
    root.querySelectorAll('[data-video-open]').forEach((button) => button.addEventListener('click', () => {
      if (!videoDialog) return;
      if (typeof videoDialog.showModal === 'function') videoDialog.showModal();
      else videoDialog.setAttribute('open', '');
    }));
    const closeVideo = () => {
      if (!videoDialog) return;
      if (typeof videoDialog.close === 'function') videoDialog.close();
      else videoDialog.removeAttribute('open');
      const frame = videoDialog.querySelector('[data-video-frame]');
      if (frame) frame.src = frame.src;
    };
    videoDialog?.querySelector('[data-video-close]')?.addEventListener('click', closeVideo);
    videoDialog?.addEventListener('click', (event) => { if (event.target === videoDialog) closeVideo(); });
    videoDialog?.addEventListener('close', () => {
      const frame = videoDialog.querySelector('[data-video-frame]');
      if (frame) frame.src = frame.src;
    });

    const reviewsDialog = root.querySelector('[data-reviews-dialog]');
    root.querySelector('[data-reviews-open]')?.addEventListener('click', () => reviewsDialog?.showModal?.());
    reviewsDialog?.querySelector('[data-reviews-close]')?.addEventListener('click', () => reviewsDialog.close());
    reviewsDialog?.addEventListener('click', (event) => { if (event.target === reviewsDialog) reviewsDialog.close(); });

    root.querySelectorAll('[data-scroll-target]').forEach((button) => button.addEventListener('click', () => {
      root.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' });
    }));

    root.querySelector('[data-search-trigger]')?.addEventListener('click', () => {
      document.querySelector('.search-drawer-button')?.click();
    });
    root.querySelector('[data-menu-trigger]')?.addEventListener('click', () => document.querySelector('.menu-drawer-button')?.click());
    root.querySelector('[data-cart-trigger]')?.addEventListener('click', () => document.querySelector('.cart-drawer-button')?.click());

    root.querySelectorAll('[data-quick-add]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button');
      const status = form.querySelector('[role="status"]');
      if (!button || button.disabled) return;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: new FormData(form)
        });
        const data = await response.json();
        if (!response.ok || data.status) throw new Error(data.description || data.message || form.dataset.error);
        if (status) status.textContent = form.dataset.success;
        fetch(root.dataset.cartUrl, { headers: { Accept: 'application/json' } })
          .then((cartResponse) => cartResponse.ok ? cartResponse.json() : null)
          .then((cart) => {
            const mobileCount = root.querySelector('.altaeron__mobile-count');
            if (cart && mobileCount) mobileCount.textContent = cart.item_count;
          })
          .catch(() => {});
        document.dispatchEvent(new CustomEvent('product-ajax:added', { detail: { product: data } }));
        document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { open: true } }));
        window.setTimeout(() => document.querySelector('cart-drawer')?.show?.(button), 200);
      } catch (error) {
        if (status) status.textContent = error.message || form.dataset.error;
        else window.alert(error.message);
      } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }));
  }

  const initAll = (scope = document) => scope.querySelectorAll('[data-altaeron]').forEach(initAltaeron);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAll());
  else initAll();
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();

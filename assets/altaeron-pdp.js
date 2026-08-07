(() => {
  const SELECTOR = '.altaeron-pdp';

  function money(cents, format) {
    if (window.Shopify?.formatMoney) return window.Shopify.formatMoney(cents, format);
    const currency = window.Shopify?.currency?.active || 'USD';
    return new Intl.NumberFormat(document.documentElement.lang || 'en-US', { style: 'currency', currency }).format(Number(cents || 0) / 100);
  }

  function initGallery(root) {
    const thumbs = [...root.querySelectorAll('[data-apdp-thumb]')];
    const items = [...root.querySelectorAll('[data-apdp-media]')];
    const thumbsList = root.querySelector('.apdp-gallery__thumbs');
    if (!thumbs.length || !items.length) return () => {};

    if (thumbsList) {
      let pointerId = null;
      let startY = 0;
      let startScrollTop = 0;
      let dragged = false;
      let suppressClick = false;

      thumbsList.addEventListener('dragstart', (event) => event.preventDefault());

      thumbsList.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        pointerId = event.pointerId;
        startY = event.clientY;
        startScrollTop = thumbsList.scrollTop;
        dragged = false;
        thumbsList.setPointerCapture(pointerId);
      });

      thumbsList.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) return;
        const distance = event.clientY - startY;
        if (!dragged && Math.abs(distance) < 4) return;
        dragged = true;
        suppressClick = true;
        thumbsList.classList.add('is-dragging');
        thumbsList.scrollTop = startScrollTop - distance;
        event.preventDefault();
      });

      const stopDragging = (event) => {
        if (event.pointerId !== pointerId) return;
        if (thumbsList.hasPointerCapture(pointerId)) thumbsList.releasePointerCapture(pointerId);
        pointerId = null;
        thumbsList.classList.remove('is-dragging');
        if (dragged) window.setTimeout(() => { suppressClick = false; }, 0);
      };

      thumbsList.addEventListener('pointerup', stopDragging);
      thumbsList.addEventListener('pointercancel', stopDragging);
      thumbsList.addEventListener('click', (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    }

    const activate = (id, focus = false) => {
      let found = false;
      thumbs.forEach((thumb) => {
        const active = String(thumb.dataset.apdpThumb) === String(id);
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-selected', String(active));
        thumb.tabIndex = active ? 0 : -1;
        if (active) {
          found = true;
          if (focus) thumb.focus({ preventScroll: true });
        }
      });
      if (!found) return;
      items.forEach((item) => {
        const active = String(item.dataset.apdpMedia) === String(id);
        item.hidden = !active;
        item.classList.toggle('is-active', active);
        if (!active) item.querySelectorAll('video').forEach((video) => video.pause());
      });
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => activate(thumb.dataset.apdpThumb));
      thumb.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % thumbs.length;
        if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index - 1 + thumbs.length) % thumbs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = thumbs.length - 1;
        activate(thumbs[next].dataset.apdpThumb, true);
      });
    });
    return activate;
  }

  function initQuantity(root) {
    const input = root.querySelector('[data-apdp-quantity]');
    if (!input) return;
    root.querySelector('[data-apdp-quantity-minus]')?.addEventListener('click', () => {
      input.value = Math.max(Number(input.min || 1), Number(input.value || 1) - 1);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    root.querySelector('[data-apdp-quantity-plus]')?.addEventListener('click', () => {
      input.value = Number(input.value || 1) + 1;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function initVariants(root, activateMedia) {
    const form = root.querySelector('.apdp-form');
    const idInput = root.querySelector('[data-apdp-variant-id]');
    const select = root.querySelector('[data-apdp-variant-select]');
    const radios = [...root.querySelectorAll('[data-apdp-variant-option]')];
    const currentPrice = root.querySelector('[data-apdp-current-price]');
    const comparePrice = root.querySelector('[data-apdp-compare-price]');
    const savings = root.querySelector('[data-apdp-savings]');
    const submit = root.querySelector('[data-apdp-submit]');
    const submitText = root.querySelector('[data-apdp-submit-text]');
    const submitLabel = root.querySelector('[data-apdp-submit-label]');
    const ctaPrice = root.querySelector('[data-apdp-cta-price]');
    const stickySubmit = root.querySelector('[data-apdp-sticky-submit]');
    const stickyText = root.querySelector('[data-apdp-sticky-text]');
    const stickyPrice = root.querySelector('[data-apdp-sticky-price]');
    const stickyCompare = root.querySelector('[data-apdp-sticky-compare]');
    const stickySavings = root.querySelector('[data-apdp-sticky-savings]');
    const variantsNode = root.querySelector('[data-apdp-product-json]');
    const variants = variantsNode ? JSON.parse(variantsNode.textContent) : [];
    const format = root.dataset.moneyFormat;

    const chosenControl = () => select?.selectedOptions?.[0] || radios.find((radio) => radio.checked);
    const update = (pushUrl = true) => {
      const control = chosenControl();
      if (!control) return;
      const id = control.value;
      const price = Number(control.dataset.price || 0);
      const compare = Number(control.dataset.compare || 0);
      const available = control.dataset.available === 'true';
      const mediaId = control.dataset.mediaId;
      const variant = variants.find((item) => String(item.id) === String(id));

      if (idInput) idInput.value = id;
      if (currentPrice) currentPrice.textContent = money(price, format);
      if (stickyPrice) stickyPrice.textContent = money(price, format);
      if (stickyCompare) {
        stickyCompare.hidden = compare <= price;
        if (compare > price) stickyCompare.textContent = money(compare, format);
      }
      if (comparePrice) {
        if (comparePrice.dataset.staticPrice) {
          comparePrice.hidden = false;
          comparePrice.textContent = comparePrice.dataset.staticPrice;
        } else {
          comparePrice.hidden = compare <= price;
          if (compare > price) comparePrice.textContent = money(compare, format);
        }
      }
      if (savings) {
        if (savings.dataset.staticSavings) {
          savings.hidden = false;
          savings.textContent = savings.dataset.staticSavings;
        } else {
          savings.hidden = compare <= price;
          if (compare > price) savings.textContent = `Save ${money(compare - price, format)}`;
        }
      }
      if (stickySavings) {
        stickySavings.hidden = compare <= price;
        if (compare > price) stickySavings.textContent = `Save ${money(compare - price, format)}`;
      }
      [submit, stickySubmit].forEach((button) => {
        if (!button) return;
        button.disabled = !available;
        if (available) button.removeAttribute('aria-disabled');
        else button.setAttribute('aria-disabled', 'true');
      });
      const label = available ? (submitLabel?.dataset.availableText || 'Add to cart') : 'Sold out';
      if (submitLabel) submitLabel.textContent = label;
      if (ctaPrice) {
        ctaPrice.hidden = !available;
        if (available) ctaPrice.textContent = ` — ${money(price, format)}`;
      }
      if (stickyText) stickyText.textContent = label;
      if (mediaId) activateMedia(mediaId);
      if (pushUrl) {
        const url = new URL(root.dataset.productUrl, window.location.origin);
        url.searchParams.set('variant', id);
        window.history.replaceState({ ...window.history.state, variant: id }, '', url);
      }
      form?.dispatchEvent(new CustomEvent('altaeron:variant-change', { bubbles: true, detail: { variant } }));
    };

    select?.addEventListener('change', () => update());
    radios.forEach((radio) => radio.addEventListener('change', () => update()));
    update(false);
  }

  function initSticky(root) {
    const sticky = root.querySelector('[data-apdp-sticky]');
    const purchaseButton = root.querySelector('[data-apdp-submit]');
    const stickyButton = root.querySelector('[data-apdp-sticky-submit]');
    const form = root.querySelector('.apdp-form');
    const finalCta = root.querySelector('.apdp-final-cta');
    if (!sticky || !purchaseButton || !stickyButton || !form) return;

    const mobile = window.matchMedia('(max-width: 749px)');
    let purchaseIsPast = false;
    let finalCtaIsVisible = false;
    const updateVisibility = () => { sticky.hidden = !mobile.matches || !purchaseIsPast || finalCtaIsVisible; };
    const observer = new IntersectionObserver(([entry]) => {
      purchaseIsPast = !entry.isIntersecting;
      updateVisibility();
    }, { threshold: 0 });
    observer.observe(purchaseButton);
    if (finalCta) {
      const finalCtaObserver = new IntersectionObserver(([entry]) => {
        finalCtaIsVisible = entry.isIntersecting;
        updateVisibility();
      }, { threshold: 0 });
      finalCtaObserver.observe(finalCta);
    }
    mobile.addEventListener?.('change', updateVisibility);
    stickyButton.addEventListener('click', () => {
      if (!stickyButton.disabled) form.requestSubmit();
    });
  }

  function initLazyVideos(root) {
    const videos = [...root.querySelectorAll('[data-apdp-lazy-video] video')];
    if (!videos.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        video.querySelectorAll('source[data-src]').forEach((source) => { source.src = source.dataset.src; source.removeAttribute('data-src'); });
        video.load();
        observer.unobserve(video);
      });
    }, { rootMargin: '300px 0px' });
    videos.forEach((video) => observer.observe(video));
  }

  function initReviewSlider(root) {
    const slider = root.querySelector('[data-apdp-review-slider]');
    const previous = root.querySelector('[data-apdp-review-prev]');
    const next = root.querySelector('[data-apdp-review-next]');
    if (!slider || !previous || !next) return;

    const card = () => slider.querySelector('.apdp-tail-review');
    const step = () => {
      const item = card();
      if (!item) return slider.clientWidth;
      const styles = window.getComputedStyle(slider.querySelector('.apdp-tail-review-grid'));
      return item.getBoundingClientRect().width + Number.parseFloat(styles.columnGap || styles.gap || 0);
    };
    const update = () => {
      const maximum = Math.max(0, slider.scrollWidth - slider.clientWidth);
      previous.disabled = slider.scrollLeft <= 2;
      next.disabled = slider.scrollLeft >= maximum - 2;
    };
    previous.addEventListener('click', () => slider.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => slider.scrollBy({ left: step(), behavior: 'smooth' }));
    slider.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function init(root) {
    if (!root || root.dataset.apdpReady === 'true') return;
    root.dataset.apdpReady = 'true';
    const activateMedia = initGallery(root);
    initQuantity(root);
    initVariants(root, activateMedia);
    initSticky(root);
    initLazyVideos(root);
    initReviewSlider(root);
  }

  const initAll = (scope = document) => scope.querySelectorAll(SELECTOR).forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAll());
  else initAll();
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();

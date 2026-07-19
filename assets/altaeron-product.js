(() => {
  if (window.AltaeronProductExperience) {
    window.AltaeronProductExperience.refresh();
    return;
  }

  const state = {
    chapterObserver: null,
    videoObserver: null,
    chapters: [],
    activeIndex: 0,
    frame: null,
  };

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateChapterUI = (index) => {
    state.activeIndex = Math.max(0, index);
    const activeChapter = state.chapters[state.activeIndex];
    const links = document.querySelectorAll('[data-altaeron-chapter-link]');
    let visibleChapterNumber = 0;
    links.forEach((link) => {
      const target = document.querySelector(link.hash);
      link.closest('.altaeron-chapters__item')?.toggleAttribute('hidden', !target);
      if (target) {
        visibleChapterNumber += 1;
        const number = link.querySelector('.altaeron-chapters__number');
        if (number) number.textContent = String(visibleChapterNumber).padStart(2, '0');
      }
      if (activeChapter && link.hash === `#${activeChapter.id}`) {
        link.setAttribute('aria-current', 'true');
      }
      else link.removeAttribute('aria-current');
    });

    const current = document.querySelector('[data-altaeron-progress-current]');
    const bar = document.querySelector('[data-altaeron-progress-bar]');
    const label = document.querySelector('[data-altaeron-progress-label]');
    const total = document.querySelector('[data-altaeron-progress-total]');
    if (current) current.textContent = String(state.activeIndex + 1).padStart(2, '0');
    if (total) total.textContent = String(state.chapters.length).padStart(2, '0');
    if (bar) bar.style.width = `${((state.activeIndex + 1) / Math.max(state.chapters.length, 1)) * 100}%`;
    if (label && state.chapters[state.activeIndex]) label.textContent = state.chapters[state.activeIndex].dataset.altaeronChapter;
  };

  const updateFixedUI = () => {
    state.frame = null;
    const chapterNav = document.querySelector('[data-altaeron-chapters]');
    const first = state.chapters[0];
    const last = state.chapters[state.chapters.length - 1];
    if (chapterNav && first && last) {
      const firstTop = first.getBoundingClientRect().top;
      const lastBottom = last.getBoundingClientRect().bottom;
      chapterNav.classList.toggle('is-visible', firstTop < window.innerHeight * 0.35 && lastBottom > window.innerHeight * 0.25);
    }

    const sticky = document.querySelector('[data-altaeron-sticky-buy]');
    const purchase = document.querySelector('.altaeron-purchase');
    if (sticky && purchase) {
      const purchaseRect = purchase.getBoundingClientRect();
      const lastRect = last?.getBoundingClientRect();
      const hasPassedForm = purchaseRect.bottom < 0;
      const experienceRemaining = !lastRect || lastRect.bottom > 0;
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const overlayOpen = Boolean(document.querySelector('cart-drawer[open], menu-drawer[open], search-drawer[open], quick-view-modal[open], .pswp--open'));
      const designMode = document.body.classList.contains('shopify-design-mode');
      sticky.hidden = false;
      sticky.classList.toggle('is-visible', mobile && hasPassedForm && experienceRemaining && !overlayOpen && !designMode);
    }
  };

  const requestFixedUpdate = () => {
    if (state.frame) return;
    state.frame = requestAnimationFrame(updateFixedUI);
  };

  const refreshChapters = () => {
    state.chapterObserver?.disconnect();
    state.chapters = Array.from(document.querySelectorAll('[data-altaeron-chapter]'));
    if (!state.chapters.length) return;

    state.chapters.forEach((chapter, index) => {
      const kicker = chapter.querySelector('.altaeron-kicker');
      if (!kicker || kicker.classList.contains('altaeron-hero__chapter')) return;
      const label = kicker.textContent.replace(/^\s*\d{2}\s*\/\s*/, '').trim();
      if (label) kicker.textContent = `${String(index + 1).padStart(2, '0')} / ${label}`;
    });

    state.chapterObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        if (!visible.length) return;
        const index = state.chapters.indexOf(visible[0].target);
        if (index >= 0) updateChapterUI(index);
      },
      { rootMargin: '-18% 0px -64% 0px', threshold: [0, 0.01] }
    );

    state.chapters.forEach((chapter) => state.chapterObserver.observe(chapter));
    updateChapterUI(state.activeIndex);
    updateFixedUI();
  };

  const refreshVideos = () => {
    state.videoObserver?.disconnect();
    const videos = document.querySelectorAll('.altaeron-lore video, .altaeron-craft video');
    if (!videos.length) return;
    state.videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
      });
    }, { threshold: 0.15 });
    videos.forEach((video) => state.videoObserver.observe(video));
  };

  const setPackagingExpanded = (section, expanded) => {
    const toggle = section.querySelector('[data-altaeron-packaging-toggle]');
    toggle?.setAttribute('aria-expanded', String(expanded));
    section.querySelectorAll('[data-altaeron-packaging-content]').forEach((content) => {
      content.hidden = !expanded;
    });
  };

  const refreshPackaging = () => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    document.querySelectorAll('.altaeron-packaging').forEach((section) => {
      const expanded = mobile ? section.dataset.altaeronPackagingExpanded === 'true' : true;
      setPackagingExpanded(section, expanded);
    });
  };

  const refreshVariantPresentation = () => {
    document.querySelectorAll('.altaeron-purchase [data-option-name="wood-base"] label[data-option-value]').forEach((label) => {
      label.classList.add('altaeron-wood-swatch');
      label.setAttribute('title', label.dataset.optionValue);
      label.setAttribute('aria-label', label.dataset.optionValue);
    });
  };

  const updateStickyCommerce = (variant) => {
    const sticky = document.querySelector('[data-altaeron-sticky-buy]');
    if (!sticky) return;
    const mainButton = document.querySelector('.altaeron-purchase [name="add"]');
    const stickyButton = sticky.querySelector('[data-altaeron-sticky-submit]');
    const price = document.querySelector('.altaeron-purchase__price .f-price');
    const stickyPrice = sticky.querySelector('[data-altaeron-sticky-price]');
    const stickyVariant = sticky.querySelector('[data-altaeron-sticky-variant]');
    const visiblePrice = price?.classList.contains('f-price--on-sale')
      ? price.querySelector('.f-price__sale .f-price-item--sale')
      : price?.querySelector('.f-price__regular .f-price-item');

    if (stickyPrice && visiblePrice) stickyPrice.textContent = visiblePrice.textContent.trim();
    if (stickyVariant && variant?.title && variant.title !== 'Default Title') stickyVariant.textContent = variant.title;
    if (stickyButton && mainButton) {
      stickyButton.disabled = mainButton.disabled;
      stickyButton.textContent = mainButton.querySelector('span')?.textContent.trim() || mainButton.textContent.trim();
    }
  };

  const updateVariantVisual = (variant) => {
    const image = document.querySelector('[data-altaeron-variant-visual] img');
    const source = variant?.featured_media?.preview_image?.src;
    if (!image || !source) return;
    const url = new URL(source, window.location.origin);
    url.searchParams.set('width', '1600');
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = url.toString();
  };

  const updateSellingPlan = (choice) => {
    const fieldset = choice.closest('[data-altaeron-selling-plans]');
    const input = fieldset?.closest('.altaeron-purchase')?.querySelector('[data-altaeron-selling-plan-input]');
    if (!fieldset || !input) return;
    const sellingPlanId = choice.value;
    input.value = sellingPlanId;
    input.disabled = !sellingPlanId;
    const dynamicCheckout = fieldset.closest('.altaeron-purchase')?.querySelector('.shopify-payment-button');
    if (dynamicCheckout) dynamicCheckout.hidden = Boolean(sellingPlanId);
    fieldset.querySelectorAll('.altaeron-selling-plan').forEach((option) => {
      option.classList.toggle('is-selected', option.contains(choice));
    });
    const stickyPrice = document.querySelector('[data-altaeron-sticky-price]');
    if (stickyPrice && choice.dataset.price) stickyPrice.textContent = choice.dataset.price;
  };

  const refreshSellingPlans = (event) => {
    const sourceRegion = event?.data?.html?.querySelector?.('[data-altaeron-selling-plan-region]');
    const destinationRegion = document.querySelector('[data-altaeron-selling-plan-region]');
    if (!sourceRegion || !destinationRegion) return;

    const planInput = destinationRegion.closest('.altaeron-purchase')?.querySelector('[data-altaeron-selling-plan-input]');
    const selectedPlanId = planInput && !planInput.disabled ? planInput.value : '';
    destinationRegion.innerHTML = sourceRegion.innerHTML;

    const choices = Array.from(destinationRegion.querySelectorAll('[data-altaeron-selling-plan-choice]'));
    const nextChoice = choices.find((choice) => choice.value === selectedPlanId) || choices.find((choice) => choice.value === '');
    if (nextChoice) {
      nextChoice.checked = true;
      updateSellingPlan(nextChoice);
    } else if (planInput) {
      planInput.value = '';
      planInput.disabled = true;
    }
  };

  const handleClick = (event) => {
    const packagingToggle = event.target.closest('[data-altaeron-packaging-toggle]');
    if (packagingToggle) {
      const section = packagingToggle.closest('.altaeron-packaging');
      if (!section) return;
      const expanded = packagingToggle.getAttribute('aria-expanded') !== 'true';
      section.dataset.altaeronPackagingExpanded = String(expanded);
      setPackagingExpanded(section, expanded);
      return;
    }

    const chapterLink = event.target.closest('[data-altaeron-chapter-link]');
    if (chapterLink) {
      const target = document.querySelector(chapterLink.hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      const url = new URL(window.location.href);
      url.hash = chapterLink.hash;
      history.replaceState(null, '', url);
      return;
    }

    const stickyButton = event.target.closest('[data-altaeron-sticky-submit]');
    if (stickyButton) {
      const form = document.querySelector('.altaeron-purchase form[is="product-form"]');
      const submit = form?.querySelector('[name="add"]');
      if (form && submit && !submit.disabled) form.requestSubmit(submit);
    }
  };

  const handleChange = (event) => {
    if (event.target.matches?.('[data-altaeron-selling-plan-choice]')) updateSellingPlan(event.target);
  };

  const handleFaqToggle = (event) => {
    const opened = event.target;
    if (opened.matches?.('cart-drawer, menu-drawer, search-drawer, quick-view-modal')) requestFixedUpdate();
    if (!(opened instanceof HTMLDetailsElement) || !opened.matches('.altaeron-faq')) return;
    opened.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(opened.open));
    if (!opened.open) return;
    const guide = opened.closest('[data-one-open="true"]');
    if (!guide) return;
    guide.querySelectorAll('.altaeron-faq[open]').forEach((item) => {
      if (item !== opened) item.open = false;
    });
  };

  const refresh = () => {
    refreshChapters();
    refreshVideos();
    refreshPackaging();
    refreshVariantPresentation();
    updateStickyCommerce();
  };

  const handleResize = () => {
    requestFixedUpdate();
    refreshPackaging();
  };

  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('toggle', handleFaqToggle, true);
  document.addEventListener('variant:changed', (event) => {
    requestAnimationFrame(() => {
      updateStickyCommerce(event.detail?.variant);
      updateVariantVisual(event.detail?.variant);
      const selectedPlan = document.querySelector('[data-altaeron-selling-plan-choice]:checked');
      if (selectedPlan) updateSellingPlan(selectedPlan);
    });
  });

  if (window.ScaloraTheme?.pubsub) {
    window.ScaloraTheme.pubsub.subscribe(window.ScaloraTheme.pubsub.PUB_SUB_EVENTS.variantChange, refreshSellingPlans);
  }
  document.addEventListener('shopify:section:load', refresh);
  document.addEventListener('shopify:section:unload', refresh);
  document.addEventListener('keyup', requestFixedUpdate);
  window.addEventListener('scroll', requestFixedUpdate, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  window.AltaeronProductExperience = { refresh };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else refresh();
})();

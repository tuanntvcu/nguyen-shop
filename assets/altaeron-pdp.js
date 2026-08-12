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
    const stage = root.querySelector('.apdp-gallery__stage');
    const stageImage = stage?.querySelector('img');
    if (!thumbs.length || !items.length) return () => {};

    if (thumbsList) {
      let pointerId = null;
      let startPosition = 0;
      let startScrollPosition = 0;
      let horizontal = false;
      let dragged = false;
      let suppressClick = false;
      const dragThreshold = 8;

      thumbsList.addEventListener('dragstart', (event) => event.preventDefault());

      thumbsList.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        pointerId = event.pointerId;
        horizontal = getComputedStyle(thumbsList).flexDirection === 'row';
        startPosition = horizontal ? event.clientX : event.clientY;
        startScrollPosition = horizontal ? thumbsList.scrollLeft : thumbsList.scrollTop;
        dragged = false;
      });

      thumbsList.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) return;
        const position = horizontal ? event.clientX : event.clientY;
        const distance = position - startPosition;
        if (!dragged && Math.abs(distance) < dragThreshold) return;
        if (!dragged && !thumbsList.hasPointerCapture(pointerId)) thumbsList.setPointerCapture(pointerId);
        dragged = true;
        suppressClick = true;
        thumbsList.classList.add('is-dragging');
        if (horizontal) thumbsList.scrollLeft = startScrollPosition - distance;
        else thumbsList.scrollTop = startScrollPosition - distance;
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

    const activate = (id, focus = false, syncStage = true) => {
      const activeItem = items.find((item) => String(item.dataset.apdpMedia) === String(id));
      const activeThumb = thumbs.find((thumb) => String(thumb.dataset.apdpThumb) === String(id));
      if (!activeItem) return;

      if (syncStage && stageImage && activeThumb?.dataset.apdpPreviewSrc) {
        stageImage.src = activeThumb.dataset.apdpPreviewSrc;
        stageImage.removeAttribute('srcset');
        stageImage.alt = activeThumb.dataset.apdpPreviewAlt || '';
      }

      thumbs.forEach((thumb) => {
        const active = String(thumb.dataset.apdpThumb) === String(id);
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-selected', String(active));
        thumb.tabIndex = active ? 0 : -1;
        if (active && focus) {
          thumb.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
          thumb.focus({ preventScroll: true });
        }
      });
      items.forEach((item) => {
        const active = item === activeItem;
        item.hidden = !active;
        item.setAttribute('aria-hidden', String(!active));
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

    const initiallyActive = thumbs.find((thumb) => thumb.classList.contains('is-active')) || thumbs[0];
    activate(initiallyActive.dataset.apdpThumb, false, false);

    return activate;
  }

  function handleZoomClick(event) {
    const button = event.target.closest?.('[data-apdp-zoom]');
    const root = button?.closest(SELECTOR);
    if (!button || !root) return;
    event.preventDefault();
    event.stopPropagation();

    const zoomItems = [...root.querySelectorAll('[data-apdp-media][data-apdp-zoom-src]')];
    const activeItem = button.closest('[data-apdp-media]');
    const index = Math.max(0, zoomItems.indexOf(activeItem));
    openZoomViewer(zoomItems.map((item) => ({
      src: item.dataset.apdpZoomSrc,
      alt: item.querySelector('img')?.alt || '',
    })), index, button);
  }

  function openZoomViewer(images, initialIndex, trigger) {
    if (!images.length) return;
    document.querySelector('[data-apdp-zoom-viewer]')?.remove();

    const viewer = document.createElement('div');
    viewer.className = 'apdp-zoom-viewer';
    viewer.dataset.apdpZoomViewer = '';
    viewer.tabIndex = -1;
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', trigger.getAttribute('aria-label') || 'Product image viewer');
    viewer.innerHTML = `
      <button type="button" class="apdp-zoom-viewer__close" data-apdp-zoom-close aria-label="Close image viewer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
      <button type="button" class="apdp-zoom-viewer__nav apdp-zoom-viewer__nav--prev" data-apdp-zoom-prev aria-label="Previous image">&#8249;</button>
      <div class="apdp-zoom-viewer__canvas" data-apdp-zoom-canvas>
        <img class="apdp-zoom-viewer__image" data-apdp-zoom-image alt="">
      </div>
      <button type="button" class="apdp-zoom-viewer__nav apdp-zoom-viewer__nav--next" data-apdp-zoom-next aria-label="Next image">&#8250;</button>
      <div class="apdp-zoom-viewer__counter" data-apdp-zoom-counter aria-live="polite"></div>
    `;

    const image = viewer.querySelector('[data-apdp-zoom-image]');
    const canvas = viewer.querySelector('[data-apdp-zoom-canvas]');
    const counter = viewer.querySelector('[data-apdp-zoom-counter]');
    const previous = viewer.querySelector('[data-apdp-zoom-prev]');
    const next = viewer.querySelector('[data-apdp-zoom-next]');
    const oldOverflow = document.body.style.overflow;
    let index = initialIndex;
    let dragState = null;
    let suppressCanvasClick = false;

    const setZoomed = (zoomed) => {
      image.classList.toggle('is-zoomed', zoomed);
      canvas.classList.toggle('is-zoomed', zoomed);
      if (zoomed) {
        requestAnimationFrame(() => {
          canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
          canvas.scrollTop = Math.max(0, (canvas.scrollHeight - canvas.clientHeight) / 2);
        });
      } else {
        canvas.scrollTo(0, 0);
      }
    };

    const show = (nextIndex) => {
      index = (nextIndex + images.length) % images.length;
      image.style.transform = '';
      setZoomed(false);
      image.src = images[index].src;
      image.alt = images[index].alt;
      counter.textContent = `${index + 1} / ${images.length}`;
    };
    const close = () => {
      document.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = oldOverflow;
      viewer.remove();
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    };
    const onKeydown = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft' && images.length > 1) show(index - 1);
      if (event.key === 'ArrowRight' && images.length > 1) show(index + 1);
      if (event.key === 'Tab') {
        const controls = [...viewer.querySelectorAll('button:not([hidden])')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    if (images.length === 1) {
      previous.hidden = true;
      next.hidden = true;
    }
    viewer.querySelector('[data-apdp-zoom-close]').addEventListener('click', close);
    previous.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button > 0) return;
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: canvas.scrollLeft,
        scrollTop: canvas.scrollTop,
        zoomed: image.classList.contains('is-zoomed'),
        moved: false,
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(deltaX, deltaY) < 5) return;
      dragState.moved = true;
      event.preventDefault();
      if (dragState.zoomed) {
        canvas.scrollLeft = dragState.scrollLeft - deltaX;
        canvas.scrollTop = dragState.scrollTop - deltaY;
      } else if (images.length > 1) {
        image.style.transform = `translate3d(${deltaX}px,0,0)`;
      }
    });
    const finishDrag = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      const wasMoved = dragState.moved;
      const wasZoomed = dragState.zoomed;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.classList.remove('is-dragging');
      dragState = null;
      image.style.transform = '';
      if (wasMoved) {
        suppressCanvasClick = true;
        window.setTimeout(() => { suppressCanvasClick = false; }, 0);
      }
      if (!wasZoomed && wasMoved && Math.abs(deltaX) >= Math.min(100, canvas.clientWidth * 0.16)) {
        show(index + (deltaX < 0 ? 1 : -1));
      }
    };
    canvas.addEventListener('pointerup', finishDrag);
    canvas.addEventListener('pointercancel', finishDrag);
    canvas.addEventListener('click', () => {
      if (suppressCanvasClick) {
        suppressCanvasClick = false;
        return;
      }
      setZoomed(!image.classList.contains('is-zoomed'));
    });
    viewer.addEventListener('click', (event) => { if (event.target === viewer) close(); });
    document.addEventListener('keydown', onKeydown);
    document.body.appendChild(viewer);
    document.body.style.overflow = 'hidden';
    show(index);
    viewer.focus({ preventScroll: true });
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
    const finalSubmit = root.querySelector('[data-apdp-final-submit]');
    const stickyText = root.querySelector('[data-apdp-sticky-text]');
    const stickyPrice = root.querySelector('[data-apdp-sticky-price]');
    const stickyCompare = root.querySelector('[data-apdp-sticky-compare]');
    const stickySavings = root.querySelector('[data-apdp-sticky-savings]');
    const stickyBundleTitle = root.querySelector('[data-apdp-sticky-bundle-title]');
    const installmentTerms = [...root.querySelectorAll('[data-apdp-installments]')];
    const finalPrice = root.querySelector('[data-apdp-final-price]');
    const finalCompare = root.querySelector('[data-apdp-final-compare]');
    const finalSavings = root.querySelector('[data-apdp-final-savings]');
    const variantsNode = root.querySelector('[data-apdp-product-json]');
    const variants = variantsNode ? JSON.parse(variantsNode.textContent) : [];
    const format = root.dataset.moneyFormat;
    const bundleWidget = root.querySelector('bundle-deals-widget');

    const updateInstallments = (price) => {
      const installment = money(Math.round(price / 4), format);
      installmentTerms.forEach((element) => {
        const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && /\d/.test(node.textContent));
        if (!textNode) return;
        textNode.textContent = textNode.textContent.replace(/(?:[$€£¥₹₩₫]\s*\d[\d.,]*|\d[\d.,]*\s*(?:USD|EUR|GBP|CAD|AUD|VND|₫))/i, installment);
      });
    };

    const updateRelatedPrices = (price, compare) => {
      const hasSavings = compare > price;
      const saved = Math.max(compare - price, 0);
      if (finalPrice) finalPrice.textContent = money(price, format);
      if (finalCompare) {
        finalCompare.hidden = !hasSavings;
        if (hasSavings) finalCompare.textContent = money(compare, format);
      }
      if (finalSavings) {
        finalSavings.hidden = !hasSavings;
        if (hasSavings) finalSavings.textContent = `${root.dataset.saveLabel} ${money(saved, format)}`;
      }
      updateInstallments(price);
    };

    const chosenControl = () => {
      const explicitControl = select?.selectedOptions?.[0] || radios.find((radio) => radio.checked);
      if (explicitControl) return explicitControl;

      const variant = variants.find((item) => String(item.id) === String(idInput?.value)) || variants[0];
      if (!variant) return null;
      return {
        value: variant.id,
        dataset: {
          price: variant.price,
          compare: variant.compare_at_price || 0,
          available: String(variant.available),
          mediaId: variant.featured_media?.id || '',
        },
      };
    };
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
          if (compare > price) savings.textContent = `${root.dataset.saveLabel} ${money(compare - price, format)}`;
        }
      }
      if (stickySavings) {
        stickySavings.hidden = compare <= price;
        if (compare > price) stickySavings.textContent = `${root.dataset.saveLabel} ${money(compare - price, format)}`;
      }
      [submit, stickySubmit, finalSubmit].forEach((button) => {
        if (!button) return;
        button.disabled = !available;
        if (available) button.removeAttribute('aria-disabled');
        else button.setAttribute('aria-disabled', 'true');
      });
      const label = available ? (submitLabel?.dataset.availableText || root.dataset.addToCartLabel) : root.dataset.soldOutLabel;
      if (submitLabel) submitLabel.textContent = label;
      if (ctaPrice) {
        ctaPrice.hidden = !available;
        if (available) ctaPrice.textContent = ` — ${money(price, format)}`;
      }
      if (stickyText) stickyText.textContent = label;
      updateRelatedPrices(price, compare);
      if (mediaId) activateMedia(mediaId);
      if (pushUrl) {
        const url = new URL(root.dataset.productUrl, window.location.origin);
        url.searchParams.set('variant', id);
        window.history.replaceState({ ...window.history.state, variant: id }, '', url);
      }
      form?.dispatchEvent(new CustomEvent('altaeron:variant-change', { bubbles: true, detail: { variant } }));
    };

    const parseDisplayedMoney = (value) => {
      const numeric = String(value || '').replace(/[^\d.,]/g, '');
      const decimalIndex = Math.max(numeric.lastIndexOf('.'), numeric.lastIndexOf(','));
      if (decimalIndex >= 0 && numeric.length - decimalIndex - 1 === 2) {
        const whole = numeric.slice(0, decimalIndex).replace(/[^\d]/g, '');
        const decimal = numeric.slice(decimalIndex + 1).replace(/[^\d]/g, '');
        return (Number(whole || 0) * 100) + Number(decimal || 0);
      }
      return Number(numeric.replace(/[^\d]/g, '') || 0) * 100;
    };

    const selectedBundle = () => {
      if (!bundleWidget) return null;
      const widgetRoot = bundleWidget.shadowRoot || bundleWidget;
      const checkedInputs = [...widgetRoot.querySelectorAll('input[type="radio"]:checked, [role="radio"][aria-checked="true"]')];
      const moneyPattern = /(?:[$€£¥₹₩]\s*\d[\d.,]*|\d[\d.,]*\s*(?:USD|EUR|GBP|CAD|AUD|VND|₫))/gi;
      const bundleTitle = (option) => {
        const ignoredPattern = /^(?:recommended|best value|save\b|from\b|for\b)/i;
        const titlePattern = /\b(?:bundle|pack|correctors?|items?|pieces?|left|right)\b/i;
        const preferredTitlePattern = /(?:\b\d+\b.*\b(?:bundle|pack|correctors?|items?|pieces?|left|right)\b|\b(?:bundle|pack|correctors?|items?|pieces?)\b)/i;
        const containsMoney = (text) => {
          moneyPattern.lastIndex = 0;
          return moneyPattern.test(text);
        };
        const elementTexts = [...option.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,[class*="title"],[class*="name"]')]
          .map((element) => element.textContent.replace(/\s+/g, ' ').trim())
          .filter((text) => text && text.length <= 70 && !containsMoney(text) && !ignoredPattern.test(text));
        const lineTexts = String(option.innerText || option.textContent || '')
          .split(/\r?\n/)
          .map((text) => text.replace(/\s+/g, ' ').trim())
          .filter((text) => text && text.length <= 70 && !containsMoney(text) && !ignoredPattern.test(text));
        moneyPattern.lastIndex = 0;
        const texts = [...new Set([...elementTexts, ...lineTexts])];
        return texts.find((text) => preferredTitlePattern.test(text)) || texts.find((text) => titlePattern.test(text)) || '';
      };

      for (const input of checkedInputs) {
        const candidates = [...(input.labels || [])];
        let ancestor = input.parentElement;
        while (ancestor && ancestor !== widgetRoot) {
          candidates.push(ancestor);
          ancestor = ancestor.parentElement;
        }

        for (const option of candidates) {
          const optionInputs = option.querySelectorAll('input[type="radio"]').length;
          const priceLabels = option.textContent.match(moneyPattern) || [];
          if (optionInputs <= 1 && priceLabels.length) {
            const prices = [...new Set(priceLabels.map(parseDisplayedMoney).filter((price) => price > 0))];
            const quantityMatch = option.textContent.match(/\b(\d+)\s*(?:correctors?|items?|pieces?|packs?)\b/i);
            const quantity = Number(input.dataset.quantity || quantityMatch?.[1] || 1);
            return { price: prices[0], compare: prices[1] || 0, quantity, title: bundleTitle(option) };
          }
        }
      }
      return null;
    };

    const syncBundlePricing = () => {
      const bundle = selectedBundle();
      const control = chosenControl();
      if (!bundle?.price || !control) return;

      const basePrice = Number(control.dataset.price || 0);
      const baseCompare = Number(control.dataset.compare || 0);
      const bundleCompare = bundle.compare || (bundle.quantity > 1 ? basePrice * bundle.quantity : baseCompare);
      const bundleSavings = Math.max(bundleCompare - bundle.price, 0);

      if (stickyBundleTitle) {
        stickyBundleTitle.hidden = !bundle.title;
        stickyBundleTitle.textContent = bundle.title || '';
      }

      if (currentPrice) currentPrice.textContent = money(bundle.price, format);
      if (stickyPrice) stickyPrice.textContent = money(bundle.price, format);
      [comparePrice, stickyCompare].forEach((element) => {
        if (!element) return;
        element.hidden = bundleSavings <= 0;
        if (bundleSavings > 0) element.textContent = money(bundleCompare, format);
      });
      [savings, stickySavings].forEach((element) => {
        if (!element) return;
        element.hidden = bundleSavings <= 0;
        if (bundleSavings > 0) element.textContent = `${root.dataset.saveLabel} ${money(bundleSavings, format)}`;
      });
      if (ctaPrice) ctaPrice.textContent = ` — ${money(bundle.price, format)}`;
      updateRelatedPrices(bundle.price, bundleCompare);
    };

    let bundleFrame;
    const scheduleBundlePricing = () => {
      window.cancelAnimationFrame(bundleFrame);
      bundleFrame = window.requestAnimationFrame(syncBundlePricing);
    };

    select?.addEventListener('change', () => { update(); scheduleBundlePricing(); });
    radios.forEach((radio) => radio.addEventListener('change', () => { update(); scheduleBundlePricing(); }));
    if (bundleWidget) {
      const observedRoots = new WeakSet();
      const observeBundleRoot = (observedRoot) => {
        if (!observedRoot || observedRoots.has(observedRoot)) return;
        observedRoots.add(observedRoot);
        ['change', 'input', 'click'].forEach((eventName) => observedRoot.addEventListener(eventName, scheduleBundlePricing, true));
        new MutationObserver(scheduleBundlePricing).observe(observedRoot, {
          attributes: true,
          attributeFilter: ['checked', 'class', 'aria-checked'],
          childList: true,
          subtree: true,
        });
      };

      observeBundleRoot(bundleWidget);
      observeBundleRoot(bundleWidget.shadowRoot);
      window.customElements?.whenDefined(bundleWidget.localName).then(() => {
        observeBundleRoot(bundleWidget.shadowRoot);
        scheduleBundlePricing();
      });
    }
    update(false);
    scheduleBundlePricing();
  }

  function initSticky(root) {
    const sticky = root.querySelector('[data-apdp-sticky]');
    const purchaseButton = root.querySelector('[data-apdp-submit]');
    const stickyButton = root.querySelector('[data-apdp-sticky-submit]');
    const finalButton = root.querySelector('[data-apdp-final-submit]');
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
    finalButton?.addEventListener('click', () => {
      if (!finalButton.disabled) form.requestSubmit(purchaseButton);
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

  function initReviewSliders(root) {
    root.querySelectorAll('[data-apdp-review-slider]').forEach((slider) => {
      const group = slider.closest('[data-apdp-review-slider-group]');
      const previous = group?.querySelector('[data-apdp-review-prev]');
      const next = group?.querySelector('[data-apdp-review-next]');
      if (!previous || !next) return;

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
    });
  }

  function init(root) {
    if (!root || root.dataset.apdpReady === 'true') return;
    root.dataset.apdpReady = 'true';
    const activateMedia = initGallery(root);
    initQuantity(root);
    initVariants(root, activateMedia);
    initSticky(root);
    initLazyVideos(root);
    initReviewSliders(root);
  }

  const initAll = (scope = document) => scope.querySelectorAll(SELECTOR).forEach(init);
  if (!window.__altaeronPdpZoomBound) {
    window.__altaeronPdpZoomBound = true;
    document.addEventListener('click', handleZoomClick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAll());
  else initAll();
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();

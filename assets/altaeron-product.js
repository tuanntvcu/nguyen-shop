class AltaeronProduct {
  constructor(root) {
    this.root = root;
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.variantInput = root.querySelector('[data-variant-id]');
    this.quantityInput = root.querySelector('[data-quantity-input]');
    this.variants = this.readJSON('[data-variant-json]', []);
    this.currentVariant = this.variants.find((variant) => String(variant.id) === this.variantInput?.value) || this.variants[0];
    this.galleryIndex = 0;
    this.modalIndex = 0;
    this.bindQuantity();
    this.bindVariants();
    this.bindComparison();
    this.bindGallery();
    this.bindModal();
    this.bindCollapses();
    this.bindCartEvents();
    this.bindBundle();
    this.bindReviewLinks();
    this.bindSticky();
    this.syncVariant(this.currentVariant, false);
  }

  destroy() {
    this.abortController.abort();
    this.modal?.querySelectorAll('video').forEach((video) => video.pause());
  }

  on(element, event, handler, options = {}) {
    element?.addEventListener(event, handler, { ...options, signal: this.signal });
  }

  readJSON(selector, fallback) {
    try { return JSON.parse(this.root.querySelector(selector)?.textContent || ''); } catch (_) { return fallback; }
  }

  money(cents) {
    if (window.ScaloraTheme?.Currency) return ScaloraTheme.Currency.formatMoney(cents, ScaloraTheme.settings.moneyFormat);
    return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' }).format(cents / 100);
  }

  bindQuantity() {
    const wrapper = this.root.querySelector('[data-quantity]');
    if (!wrapper || !this.quantityInput) return;
    const normalize = (value) => {
      const min = Number(this.quantityInput.min || 1);
      const max = this.quantityInput.max ? Number(this.quantityInput.max) : Infinity;
      const step = Number(this.quantityInput.step || 1);
      return Math.min(max, Math.max(min, min + Math.round((Number(value || min) - min) / step) * step));
    };
    this.on(wrapper.querySelector('[data-qty-minus]'), 'click', () => { this.quantityInput.value = normalize(Number(this.quantityInput.value) - Number(this.quantityInput.step || 1)); this.syncSticky(); });
    this.on(wrapper.querySelector('[data-qty-plus]'), 'click', () => { this.quantityInput.value = normalize(Number(this.quantityInput.value) + Number(this.quantityInput.step || 1)); this.syncSticky(); });
    this.on(this.quantityInput, 'change', () => { this.quantityInput.value = normalize(this.quantityInput.value); this.syncSticky(); });
  }

  bindVariants() {
    this.root.querySelectorAll('[data-option-input]').forEach((input) => this.on(input, 'change', () => {
      const fieldset = input.closest('[data-option-index]');
      const label = fieldset?.querySelector('[data-option-label]');
      if (label) label.textContent = input.value;
      this.syncVariant(this.findSelectedVariant(), true);
    }));
    this.on(window, 'popstate', () => {
      const id = new URL(window.location.href).searchParams.get('variant');
      const variant = this.variants.find((item) => String(item.id) === id);
      if (!variant) return;
      this.setOptionInputs(variant.options);
      this.syncVariant(variant, false);
    });
  }

  selectedOptions() {
    return [...this.root.querySelectorAll('[data-option-index]')]
      .sort((a, b) => Number(a.dataset.optionIndex) - Number(b.dataset.optionIndex))
      .map((fieldset) => fieldset.querySelector('[data-option-input]:checked')?.value);
  }

  findSelectedVariant() {
    const options = this.selectedOptions();
    return this.variants.find((variant) => variant.options.every((value, index) => value === options[index]));
  }

  setOptionInputs(options) {
    options?.forEach((value, index) => {
      const input = [...this.root.querySelectorAll(`[data-option-input][data-option-index="${index}"]`)].find((item) => item.value === value);
      if (!input) return;
      input.checked = true;
      const label = input.closest('[data-option-index]')?.querySelector('[data-option-label]');
      if (label) label.textContent = value;
    });
  }

  syncOptionAvailability() {
    const selected = this.selectedOptions();
    this.root.querySelectorAll('[data-option-input]').forEach((input) => {
      const optionIndex = Number(input.dataset.optionIndex);
      const possible = this.variants.some((variant) => variant.available && variant.options.every((value, index) => index === optionIndex ? value === input.value : value === selected[index]));
      input.disabled = !possible && !input.checked;
      input.toggleAttribute('data-unavailable', !possible);
      input.nextElementSibling?.classList.toggle('is-unavailable', !possible);
      input.nextElementSibling?.setAttribute('aria-disabled', String(!possible));
    });
  }

  syncVariant(variant, updateUrl) {
    this.currentVariant = variant || null;
    this.syncOptionAvailability();
    const available = Boolean(variant?.available);
    if (this.variantInput) {
      this.variantInput.value = variant?.id || '';
      this.variantInput.disabled = !variant;
    }
    const price = this.root.querySelector('[data-product-price]');
    if (price) price.textContent = variant ? (variant.price_formatted || this.money(variant.price)) : '';
    const compare = this.root.querySelector('[data-compare-price]');
    if (compare) {
      const showCompare = variant?.compare_at_price > variant?.price;
      compare.hidden = !showCompare;
      compare.textContent = showCompare ? (variant.compare_at_price_formatted || this.money(variant.compare_at_price)) : '';
    }
    this.syncInventory(variant);
    this.syncQuantityRules(variant);
    const submit = this.root.querySelector('.ap-product-form [name="add"]');
    const submitLabel = submit?.querySelector('[data-add-label]');
    if (submit) {
      submit.disabled = !available;
      submit.toggleAttribute('aria-disabled', !available);
    }
    if (submitLabel) submitLabel.textContent = variant ? (available ? 'Add to cart' : 'Sold out') : 'Unavailable';
    if (variant?.featured_media_id) this.showGalleryByMediaId(variant.featured_media_id);
    if (updateUrl && variant) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({ variantId: variant.id }, '', url);
    }
    this.syncSticky();
    this.root.dispatchEvent(new CustomEvent('variant:changed', { bubbles: true, detail: { variant } }));
  }

  syncInventory(variant) {
    const tracked = variant?.inventory_management === 'shopify' && variant?.inventory_policy !== 'continue';
    const low = tracked && variant.inventory_quantity > 0 && variant.inventory_quantity <= Number(this.root.dataset.lowStockThreshold || 0);
    const status = this.root.querySelector('[data-inventory-status]');
    const proof = this.root.querySelector('[data-inventory-proof]');
    const text = low ? `Only ${variant.inventory_quantity} left in stock` : '';
    if (status) { status.hidden = !low; status.textContent = text; }
    if (proof) {
      proof.hidden = !low;
      const count = proof.querySelector('[data-inventory-count]');
      if (count) count.textContent = low ? `Only ${variant.inventory_quantity} left` : '';
    }
  }

  syncQuantityRules(variant) {
    if (!this.quantityInput || !variant) return;
    const rules = variant.quantity_rule || {};
    this.quantityInput.min = rules.min || 1;
    this.quantityInput.step = rules.increment || 1;
    if (rules.max) this.quantityInput.max = rules.max;
    else this.quantityInput.removeAttribute('max');
    if (Number(this.quantityInput.value) < Number(this.quantityInput.min)) this.quantityInput.value = this.quantityInput.min;
  }

  bindComparison() {
    const range = this.root.querySelector('[data-comparison-range]');
    if (!range) return;
    const update = () => {
      const value = Number(range.value);
      const clear = this.root.querySelector('[data-comparison-clear]');
      const divider = this.root.querySelector('[data-comparison-divider]');
      if (clear) clear.style.clipPath = `inset(0 0 0 ${value}%)`;
      if (divider) divider.style.left = `${value}%`;
    };
    this.on(range, 'input', update);
    update();
  }

  bindGallery() {
    this.slides = [...this.root.querySelectorAll('[data-gallery-slide]')];
    this.galleryIndex = Math.max(0, this.slides.findIndex((slide) => slide.classList.contains('is-active')));
    const dots = this.root.querySelector('[data-gallery-dots]');
    this.slides.forEach((_, index) => {
      if (!dots) return;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `ap-gallery__dot${index === this.galleryIndex ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `View media ${index + 1}`);
      this.on(dot, 'click', () => this.showGallery(index));
      dots.appendChild(dot);
    });
    this.root.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => this.on(thumb, 'click', () => this.showGallery(Number(thumb.dataset.galleryThumb))));
    this.root.querySelectorAll('[data-gallery-chip]').forEach((chip) => this.on(chip, 'click', () => this.showGallery(Number(chip.dataset.galleryChip))));
    this.on(this.root.querySelector('[data-gallery-prev]'), 'click', () => this.showGallery(this.galleryIndex - 1));
    this.on(this.root.querySelector('[data-gallery-next]'), 'click', () => this.showGallery(this.galleryIndex + 1));
    const track = this.root.querySelector('[data-gallery-track]');
    let startX = 0;
    this.on(track, 'touchstart', (event) => { startX = event.changedTouches[0].clientX; }, { passive: true });
    this.on(track, 'touchend', (event) => {
      const delta = event.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 45) this.showGallery(this.galleryIndex + (delta < 0 ? 1 : -1));
    }, { passive: true });
    this.showGallery(this.galleryIndex);
  }

  showGalleryByMediaId(mediaId) {
    const index = this.slides?.findIndex((slide) => String(slide.dataset.mediaId) === String(mediaId));
    if (index >= 0) this.showGallery(index);
  }

  showGallery(index) {
    if (!this.slides?.length) return;
    this.galleryIndex = (index + this.slides.length) % this.slides.length;
    this.slides.forEach((slide, itemIndex) => {
      const active = itemIndex === this.galleryIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if (!active) slide.querySelector('video')?.pause();
    });
    this.root.querySelectorAll('.ap-gallery__dot').forEach((dot, itemIndex) => dot.classList.toggle('is-active', itemIndex === this.galleryIndex));
    this.root.querySelectorAll('[data-gallery-thumb]').forEach((thumb, itemIndex) => { thumb.classList.toggle('is-active', itemIndex === this.galleryIndex); thumb.setAttribute('aria-current', itemIndex === this.galleryIndex ? 'true' : 'false'); });
    this.root.querySelectorAll('[data-gallery-chip]').forEach((chip, itemIndex) => chip.classList.toggle('is-active', itemIndex === this.galleryIndex));
  }

  bindModal() {
    this.modal = this.root.querySelector('[data-gallery-modal]');
    if (!this.modal) return;
    this.modalMedia = [...this.modal.querySelectorAll('[data-modal-media]')];
    this.galleryOpenButton = this.root.querySelector('[data-gallery-open]');
    this.on(this.galleryOpenButton, 'click', () => this.openModal(this.galleryIndex));
    this.on(this.root.querySelector('[data-gallery-track]'), 'dblclick', () => this.openModal(this.galleryIndex));
    this.on(this.modal.querySelector('[data-gallery-close]'), 'click', () => this.closeModal());
    this.on(this.modal, 'click', (event) => { if (event.target === this.modal) this.closeModal(); });
    this.on(this.modal, 'close', () => this.afterModalClose());
    this.modal.querySelectorAll('[data-modal-thumb]').forEach((thumb) => this.on(thumb, 'click', () => this.showModalMedia(Number(thumb.dataset.modalThumb))));
    this.on(this.modal.querySelector('[data-modal-prev]'), 'click', () => this.showModalMedia(this.modalIndex - 1));
    this.on(this.modal.querySelector('[data-modal-next]'), 'click', () => this.showModalMedia(this.modalIndex + 1));
    this.on(this.modal, 'keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); this.showModalMedia(this.modalIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); this.showModalMedia(this.modalIndex + 1); }
    });
  }

  openModal(index) {
    this.showModalMedia(index);
    this.modal.showModal();
    document.documentElement.style.overflow = 'hidden';
    if (window.ScaloraTheme?.a11y) ScaloraTheme.a11y.trapFocus(this.modal, this.modal.querySelector('[data-gallery-close]'));
  }

  closeModal() {
    this.modal.querySelectorAll('video').forEach((video) => video.pause());
    this.modal.close();
  }

  afterModalClose() {
    document.documentElement.style.overflow = '';
    if (window.ScaloraTheme?.a11y) ScaloraTheme.a11y.removeTrapFocus(this.galleryOpenButton);
  }

  showModalMedia(index) {
    if (!this.modalMedia?.length) return;
    this.modalIndex = (index + this.modalMedia.length) % this.modalMedia.length;
    this.modalMedia.forEach((media, itemIndex) => {
      media.hidden = itemIndex !== this.modalIndex;
      if (itemIndex !== this.modalIndex) media.querySelector('video')?.pause();
    });
    this.modal.querySelectorAll('[data-modal-thumb]').forEach((thumb, itemIndex) => { thumb.classList.toggle('is-active', itemIndex === this.modalIndex); thumb.setAttribute('aria-current', itemIndex === this.modalIndex ? 'true' : 'false'); });
  }

  bindCollapses() {
    this.root.querySelectorAll('[data-mobile-collapse]').forEach((section) => {
      const toggle = section.querySelector('.ap-mobile-toggle');
      this.on(toggle, 'click', () => {
        const open = section.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    });
  }

  bindCartEvents() {
    const status = this.root.querySelector('[data-cart-status]');
    this.on(document, 'product-ajax:added', () => { if (status) status.textContent = 'Product added to cart.'; });
    this.on(document, 'product-ajax:error', (event) => { if (status) status.textContent = event.detail?.errorMessage || 'Unable to add product to cart.'; });
    this.on(this.root.querySelector('[data-sticky-submit]'), 'click', () => this.root.querySelector('.ap-product-form [name="add"]')?.click());
  }

  bindBundle() {
    this.bundleButton = this.root.querySelector('[data-add-bundle]');
    this.root.querySelectorAll('[data-bundle-item]').forEach((input) => this.on(input, 'change', () => this.updateBundleTotal()));
    this.on(this.bundleButton, 'click', () => this.addBundle());
    this.updateBundleTotal();
  }

  updateBundleTotal() {
    const selected = [...this.root.querySelectorAll('[data-bundle-item]:checked:not(:disabled)')];
    const basePrice = this.currentVariant?.price || 0;
    const baseCompare = Math.max(basePrice, this.currentVariant?.compare_at_price || 0);
    const price = selected.reduce((sum, input) => sum + Number(input.dataset.price || 0), basePrice);
    const compare = selected.reduce((sum, input) => sum + Math.max(Number(input.dataset.price || 0), Number(input.dataset.compareAtPrice || 0)), baseCompare);
    const priceNode = this.root.querySelector('[data-bundle-price]');
    const compareNode = this.root.querySelector('[data-bundle-compare]');
    const saveNode = this.root.querySelector('[data-bundle-save]');
    if (priceNode) priceNode.textContent = this.money(price);
    if (compareNode) { compareNode.hidden = compare <= price; compareNode.textContent = compare > price ? this.money(compare) : ''; }
    if (saveNode) { saveNode.hidden = compare <= price; saveNode.textContent = compare > price ? `You save ${this.money(compare - price)}` : ''; }
  }

  async addBundle() {
    if (!this.bundleButton || !this.currentVariant?.available) return;
    const items = [{ id: this.currentVariant.id, quantity: Number(this.quantityInput?.value || 1) }];
    this.root.querySelectorAll('[data-bundle-item]:checked:not(:disabled)').forEach((input) => items.push({ id: Number(input.value), quantity: 1 }));
    this.bundleButton.disabled = true;
    this.bundleButton.setAttribute('aria-busy', 'true');
    const original = this.bundleButton.querySelector('span')?.textContent;
    const label = this.bundleButton.querySelector('span');
    if (label) label.textContent = 'Adding...';
    try {
      const sections = [];
      document.documentElement.dispatchEvent(new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections } }));
      const response = await fetch(ScaloraTheme.routes.cart_add_url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ items, sections, sections_url: window.location.pathname }) });
      const state = await response.json();
      if (!response.ok || state.status) throw new Error(state.description || 'Unable to add bundle');
      const cart = await fetch(ScaloraTheme.routes.cart_url, { headers: { Accept: 'application/json' } }).then((result) => result.json());
      cart.sections = state.sections;
      ScaloraTheme.pubsub.publish(ScaloraTheme.pubsub.PUB_SUB_EVENTS.cartUpdate, { cart });
      document.querySelector('cart-drawer')?.show(this.bundleButton);
      if (label) label.textContent = 'Bundle added';
    } catch (error) {
      if (label) label.textContent = error.message;
      const status = this.root.querySelector('[data-cart-status]');
      if (status) status.textContent = error.message;
    } finally {
      this.bundleButton.removeAttribute('aria-busy');
      setTimeout(() => { this.bundleButton.disabled = false; if (label) label.textContent = original; }, 1200);
    }
  }

  bindReviewLinks() {
    this.root.querySelectorAll('[data-scroll-reviews]').forEach((button) => this.on(button, 'click', () => this.root.querySelector('#AltaeronReviews')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })));
  }

  bindSticky() {
    const sticky = this.root.querySelector('[data-sticky-atc]');
    const form = this.root.querySelector('.ap-product-form');
    if (!sticky || !form) return;
    const update = () => sticky.classList.toggle('is-visible', form.getBoundingClientRect().bottom < 0);
    this.on(window, 'scroll', update, { passive: true });
    if ('IntersectionObserver' in window) {
      this.stickyObserver = new IntersectionObserver(update, { threshold: [0, 0.05] });
      this.stickyObserver.observe(form);
      this.signal.addEventListener('abort', () => this.stickyObserver.disconnect(), { once: true });
    }
    update();
  }

  syncSticky() {
    const sticky = this.root.querySelector('[data-sticky-atc]');
    if (!sticky) return;
    const price = sticky.querySelector('[data-sticky-price]');
    const compare = sticky.querySelector('[data-sticky-compare]');
    const summary = sticky.querySelector('[data-sticky-variant]');
    const button = sticky.querySelector('[data-sticky-submit]');
    if (price && this.currentVariant) price.textContent = this.currentVariant.price_formatted || this.money(this.currentVariant.price);
    if (compare) { const show = this.currentVariant?.compare_at_price > this.currentVariant?.price; compare.hidden = !show; compare.textContent = show ? (this.currentVariant.compare_at_price_formatted || this.money(this.currentVariant.compare_at_price)) : ''; }
    if (summary) summary.textContent = this.currentVariant?.title === 'Default Title' ? '' : this.currentVariant?.title || '';
    if (button) { button.disabled = !this.currentVariant?.available; const label = button.querySelector('span'); if (label) label.textContent = this.currentVariant?.available ? 'Add to cart' : 'Sold out'; }
    this.updateBundleTotal();
  }
}

const initAltaeronProducts = (scope = document) => scope.querySelectorAll('[data-altaeron-product]:not([data-ready])').forEach((root) => {
  root.dataset.ready = 'true';
  root.altaeronProduct = new AltaeronProduct(root);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAltaeronProducts(), { once: true });
else initAltaeronProducts();
document.addEventListener('shopify:section:load', (event) => initAltaeronProducts(event.target));
document.addEventListener('shopify:section:unload', (event) => event.target.querySelector('[data-altaeron-product]')?.altaeronProduct?.destroy());

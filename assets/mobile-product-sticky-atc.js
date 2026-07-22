if (!customElements.get('mobile-product-sticky-atc')) {
  customElements.define(
    'mobile-product-sticky-atc',
    class MobileProductStickyAtc extends HTMLElement {
      constructor() {
        super();

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleMediaChange = this.handleMediaChange.bind(this);
        this.handleProductAdded = this.handleProductAdded.bind(this);
        this.handleProductError = this.handleProductError.bind(this);
        this.handleVariantChanged = this.handleVariantChanged.bind(this);
        this.updateOverlayState = this.updateOverlayState.bind(this);
      }

      connectedCallback() {
        this.productInfo = this.closest('product-info') || document.querySelector(`product-info[data-product-id="${this.dataset.productId}"]`);
        this.mainForm = this.productInfo?.querySelector('form[is="product-form"][data-type="add-to-cart-form"]');
        this.mainSubmit = this.mainForm?.querySelector('[name="add"]');
        this.observeTarget = this.productInfo?.querySelector(this.dataset.observeSelector) || this.mainForm?.closest('.product__block') || this.mainForm;
        this.footer = document.querySelector('.footer, footer, [id*="shopify-section-footer"]');
        this.submitButton = this.querySelector('[data-sticky-submit]');
        this.errorElement = this.querySelector('[data-sticky-error]');
        this.priceElement = this.querySelector('[data-sticky-price]');
        this.compareElement = this.querySelector('[data-sticky-compare-price]');
        this.variantTitleElement = this.querySelector('[data-sticky-variant-title]');
        this.thumbnail = this.querySelector('.mobile-product-sticky-atc__thumb img');
        this.variantData = this.parseVariantData();
        this.mediaQuery = window.matchMedia(window.ScaloraTheme?.config?.mediaQueryMobile || '(max-width: 767px)');
        this.isSubmitting = false;
        this.mainAreaVisible = true;
        this.hasPassedMainArea = false;
        this.footerVisible = false;
        this.overlayOpen = false;

        this.submitButton?.addEventListener('click', this.handleSubmit);
        this.mediaQuery.addEventListener?.('change', this.handleMediaChange);
        document.addEventListener('product-ajax:added', this.handleProductAdded);
        document.addEventListener('product-ajax:error', this.handleProductError);
        document.addEventListener('variant:changed', this.handleVariantChanged);
        this.mainForm?.addEventListener('change', this.handleVariantChanged);

        if (window.ScaloraTheme?.pubsub) {
          this.variantUnsubscriber = window.ScaloraTheme.pubsub.subscribe(
            window.ScaloraTheme.pubsub.PUB_SUB_EVENTS.variantChange,
            (event) => {
              if (event.data?.sectionId === this.dataset.sectionId) this.syncVariant(event.data.variant);
            }
          );
        }

        this.setupObservers();
        this.syncVariant();
        this.updateOverlayState();
        this.updateVisibility();
      }

      disconnectedCallback() {
        this.submitButton?.removeEventListener('click', this.handleSubmit);
        this.mediaQuery.removeEventListener?.('change', this.handleMediaChange);
        document.removeEventListener('product-ajax:added', this.handleProductAdded);
        document.removeEventListener('product-ajax:error', this.handleProductError);
        document.removeEventListener('variant:changed', this.handleVariantChanged);
        this.mainForm?.removeEventListener('change', this.handleVariantChanged);
        this.variantUnsubscriber?.();
        this.formObserver?.disconnect();
        this.footerObserver?.disconnect();
        this.overlayObserver?.disconnect();
        this.buttonObserver?.disconnect();
        this.clearVisibleHeight();
      }

      parseVariantData() {
        try {
          return JSON.parse(this.querySelector('[data-mobile-sticky-variants]')?.textContent || '[]');
        } catch (error) {
          console.error(error);
          return [];
        }
      }

      setupObservers() {
        if (this.observeTarget) {
          this.formObserver = new IntersectionObserver(
            ([entry]) => {
              this.mainAreaVisible = entry.isIntersecting;
              this.hasPassedMainArea = entry.boundingClientRect.bottom <= 0;
              this.updateVisibility();
            },
            { threshold: [0, 0.01, 0.4] }
          );
          this.formObserver.observe(this.observeTarget);
        }

        if (this.footer) {
          this.footerObserver = new IntersectionObserver(
            ([entry]) => {
              this.footerVisible = entry.isIntersecting;
              this.updateVisibility();
            },
            { threshold: [0, 0.01] }
          );
          this.footerObserver.observe(this.footer);
        }

        this.overlayObserver = new MutationObserver(this.updateOverlayState);
        this.overlayObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ['class', 'open', 'active', 'hidden', 'style'],
          childList: true,
          subtree: true,
        });

        if (this.mainSubmit) {
          this.buttonObserver = new MutationObserver(() => {
            if (this.isSubmitting && !this.mainSubmit.hasAttribute('aria-disabled')) this.finishLoading();
            this.syncVariant();
          });
          this.buttonObserver.observe(this.mainSubmit, {
            attributes: true,
            attributeFilter: ['disabled', 'aria-disabled', 'class'],
            childList: true,
            subtree: true,
          });
        }
      }

      handleMediaChange() {
        this.updateVisibility();
      }

      handleVariantChanged(event) {
        if (event?.detail?.variant) {
          this.syncVariant(event.detail.variant);
          return;
        }
        window.requestAnimationFrame(() => this.syncVariant());
      }

      syncVariant(variant = null) {
        const variantId = this.mainForm?.querySelector('[name="id"]')?.value;
        const currentVariant = variant || this.variantData.find((item) => String(item.id) === String(variantId));
        const hasVariant = Boolean(variantId && currentVariant);
        const available = hasVariant && currentVariant.available && !this.mainSubmit?.disabled;
        const addLabel = this.dataset.addLabel || 'Add to cart';
        const soldOutLabel = this.dataset.soldOutLabel || 'Sold out';
        const unavailableLabel = this.dataset.unavailableLabel || 'Unavailable';
        const variantTitle = hasVariant && currentVariant.title !== 'Default Title' ? currentVariant.title : '';

        if (this.variantTitleElement) {
          this.variantTitleElement.textContent = variantTitle;
          this.variantTitleElement.hidden = !variantTitle;
        }

        if (hasVariant) {
          this.updatePrices(currentVariant);
          this.updateThumbnail(currentVariant);
        } else {
          this.updatePricesFromDom();
        }

        if (this.submitButton) {
          this.submitButton.disabled = this.isSubmitting || !available;
          if (!this.isSubmitting) {
            this.submitButton.textContent = !hasVariant ? unavailableLabel : available ? addLabel : soldOutLabel;
          }
          const labelParts = [addLabel, this.dataset.productTitle, variantTitle].filter(Boolean);
          this.submitButton.setAttribute('aria-label', labelParts.join(': '));
        }
      }

      updatePrices(variant) {
        const moneyFormat = window.ScaloraTheme?.settings?.moneyFormat;
        const formatMoney = window.ScaloraTheme?.Currency?.formatMoney;
        const price = formatMoney ? formatMoney(variant.price, moneyFormat) : this.priceElement?.textContent;
        const compareAtPrice = formatMoney ? formatMoney(variant.compare_at_price, moneyFormat) : this.compareElement?.textContent;

        if (this.priceElement && price) this.priceElement.textContent = price;
        if (!this.compareElement) return;

        const showCompare = variant.compare_at_price && variant.compare_at_price > variant.price;
        this.compareElement.hidden = !showCompare;
        if (showCompare && compareAtPrice) this.compareElement.textContent = compareAtPrice;
      }

      updatePricesFromDom() {
        const price = this.productInfo?.querySelector(`#price-${this.dataset.sectionId} .f-price`);
        const visiblePrice = price?.classList.contains('f-price--on-sale')
          ? price.querySelector('.f-price__sale .f-price-item--sale')
          : price?.querySelector('.f-price__regular .f-price-item');
        const visibleCompare = price?.querySelector('.f-price-item--regular s');

        if (this.priceElement && visiblePrice) this.priceElement.textContent = visiblePrice.textContent.trim();
        if (this.compareElement) {
          this.compareElement.hidden = !visibleCompare;
          if (visibleCompare) this.compareElement.textContent = visibleCompare.textContent.trim();
        }
      }

      updateThumbnail(variant) {
        if (!this.thumbnail) return;
        const image = variant.featured_media?.preview_image || variant.featured_image;
        const source = image?.src;
        if (!source) return;

        const url = new URL(source, window.location.origin);
        url.searchParams.set('width', '144');
        this.thumbnail.removeAttribute('srcset');
        this.thumbnail.sizes = '54px';
        this.thumbnail.src = url.toString();
      }

      updateOverlayState() {
        this.overlayOpen = Boolean(
          document.querySelector(
            'cart-drawer[open], cart-drawer[active], menu-drawer[open], search-drawer[open], quick-view-modal[open], basic-modal[open], .drawer[open], .modal[open], .pswp--open, #shopify-pc__banner:not([hidden]), .shopify-pc__banner:not([hidden]), #onetrust-banner-sdk:not([hidden]), .cc-window:not([hidden]), .cookie-banner:not([hidden])'
          )
        );
        this.updateVisibility();
      }

      updateVisibility() {
        const shouldShow = Boolean(
          this.mediaQuery.matches &&
            this.observeTarget &&
            this.hasPassedMainArea &&
            !this.mainAreaVisible &&
            !this.footerVisible &&
            !this.overlayOpen
        );

        this.hidden = false;
        this.classList.toggle('is-visible', shouldShow);
        this.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        this.inert = !shouldShow;

        if (shouldShow) this.setVisibleHeight();
        else this.clearVisibleHeight();
      }

      setVisibleHeight() {
        document.documentElement.style.setProperty('--mobile-product-sticky-atc-height', `${this.offsetHeight}px`);
      }

      clearVisibleHeight() {
        document.documentElement.style.setProperty('--mobile-product-sticky-atc-height', '0px');
      }

      handleSubmit(event) {
        event.preventDefault();
        if (this.isSubmitting || !this.mainForm || !this.mainSubmit) return;

        const variantId = this.mainForm.querySelector('[name="id"]')?.value;
        if (!variantId || this.mainSubmit.disabled) {
          this.focusVariantSelector();
          return;
        }

        if (!this.mainForm.reportValidity()) {
          this.focusInvalidField();
          return;
        }

        this.isSubmitting = true;
        this.hideError();
        this.submitButton.disabled = true;
        this.submitButton.textContent = this.dataset.loadingLabel || 'Adding...';
        this.submitButton.setAttribute('aria-busy', 'true');
        this.mainForm.requestSubmit(this.mainSubmit);
      }

      handleProductAdded() {
        if (!this.isSubmitting) return;
        this.finishLoading();
      }

      handleProductError(event) {
        if (!this.isSubmitting) return;
        this.finishLoading();
        this.showError(event.detail?.errorMessage || 'Unable to add this item to cart.');
      }

      finishLoading() {
        this.isSubmitting = false;
        this.submitButton?.removeAttribute('aria-busy');
        this.syncVariant();
      }

      showError(message) {
        if (!this.errorElement) return;
        this.errorElement.textContent = message;
        this.errorElement.hidden = false;
      }

      hideError() {
        if (!this.errorElement) return;
        this.errorElement.textContent = '';
        this.errorElement.hidden = true;
      }

      focusVariantSelector() {
        const selector = this.productInfo?.querySelector('variant-selects select, variant-selects input:not(:disabled)');
        const target = selector || this.mainSubmit;
        target?.scrollIntoView({ behavior: this.prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        window.setTimeout(() => target?.focus({ preventScroll: true }), 250);
      }

      focusInvalidField() {
        const invalid = this.mainForm?.querySelector(':invalid');
        invalid?.scrollIntoView({ behavior: this.prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        window.setTimeout(() => invalid?.focus({ preventScroll: true }), 250);
      }

      prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
    }
  );
}

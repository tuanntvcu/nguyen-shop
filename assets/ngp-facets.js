class ngp_FacetShort extends HTMLSelectElement {
  constructor() {
    super();
    this.ngp_initMotionInView();
    this.addEventListener('change', this.ngp_onSelectChange.bind(this));
  }
  get ngp_options() {
    return this.getElementsByTagName('option');
  }
  get ngp_fakeSelectElement() {
    return this.previousElementSibling;
  }
  ngp_initMotionInView() {
    NgpThemeRuntime.Motion.inView(this, this.ngp_calcSelectWidth.bind(this), {
      margin: '200px 0px 200px 0px'
    });
  }
  ngp_calcSelectWidth() {
    const ngp_selectStyle = window.getComputedStyle(this);
    const ngp_selectedOptionText = this.ngp_options[this.selectedIndex].text;
    const ngp_textElement = this.ngp_createTextElement(ngp_selectedOptionText, ngp_selectStyle);
    document.body.appendChild(ngp_textElement);
    const ngp_selectWidth = ngp_textElement.offsetWidth;
    ngp_textElement.remove();
    this.style.setProperty('--width', `${ngp_selectWidth + 22}px`);
  }
  ngp_createTextElement(ngp_text, ngp_style) {
    const ngp_textElement = document.createElement('span');
    ngp_textElement.style.fontFamily = ngp_style.fontFamily;
    ngp_textElement.style.fontSize = ngp_style.fontSize;
    ngp_textElement.style.fontWeight = ngp_style.fontWeight;
    ngp_textElement.style.visibility = 'hidden';
    ngp_textElement.style.position = "ngp-absolute";
    ngp_textElement.innerHTML = ngp_text;
    return ngp_textElement;
  }
  ngp_onSelectChange(ngp_event) {
    this.ngp_calcSelectWidth();
    this.ngp_updateFormParams(ngp_event);
  }
  ngp_updateFormParams(ngp_event) {
    const ngp_form = this.ngp_getClosestFacetForm() || this.ngp_getFirstFacetForm();
    if (ngp_form) {
      const ngp_url = new URL(window.location.href);
      ngp_url.searchParams.set('sort_by', ngp_event.target.value);
      ngp_url.searchParams.set('section_id', NgpThemeRuntime.utils.getSectionId(ngp_form));
      ngp_url.searchParams.delete('page');
      ngp_form.renderSection(ngp_url.toString(), ngp_event);
    }
  }
  ngp_getClosestFacetForm() {
    return this.closest('form[is="facet-form"]');
  }
  ngp_getFirstFacetForm() {
    return document.querySelector('form[is="facet-form"]');
  }
}
customElements.define("ngp-facet-short", ngp_FacetShort, {
  extends: "ngp-select"
});
class ngp_PriceRange extends HTMLElement {
  constructor() {
    super();
    this.minRangeInput = this.querySelector('input[type="range"]:first-child');
    this.maxRangeInput = this.querySelector('input[type="range"]:last-child');
    this.minPriceInput = this.querySelector('input[name="filter.v.price.gte"]');
    this.maxPriceInput = this.querySelector('input[name="filter.v.price.lte"]');
    this.minPriceInput.addEventListener('focus', this.minPriceInput.select);
    this.maxPriceInput.addEventListener('focus', this.maxPriceInput.select);
    this.minPriceInput.addEventListener('change', this.ngp_handleInputMinChange.bind(this));
    this.maxPriceInput.addEventListener('change', this.ngp_handleInputMaxChange.bind(this));
    this.minRangeInput.addEventListener('change', this.ngp_handleRangeMinChange.bind(this));
    this.maxRangeInput.addEventListener('change', this.ngp_handleRangeMaxChange.bind(this));
    this.minRangeInput.addEventListener('input', this.ngp_handleRangeMinInput.bind(this));
    this.maxRangeInput.addEventListener('input', this.ngp_handleRangeMaxInput.bind(this));
  }
  ngp_handleInputMinChange(ngp_event) {
    ngp_event.preventDefault();
    ngp_event.target.value = Math.max(Math.min(parseInt(ngp_event.target.value), parseInt(this.maxPriceInput.value || ngp_event.target.max) - 1), ngp_event.target.min);
    this.minRangeInput.value = ngp_event.target.value;
    this.minRangeInput.parentElement.style.setProperty('--range-min', `${parseInt(this.minRangeInput.value) / parseInt(this.minRangeInput.max) * 100}%`);
  }
  ngp_handleInputMaxChange(ngp_event) {
    ngp_event.preventDefault();
    ngp_event.target.value = Math.min(Math.max(parseInt(ngp_event.target.value), parseInt(this.minPriceInput.value || ngp_event.target.min) + 1), ngp_event.target.max);
    this.maxRangeInput.value = ngp_event.target.value;
    this.maxRangeInput.parentElement.style.setProperty('--range-max', `${parseInt(this.maxRangeInput.value) / parseInt(this.maxRangeInput.max) * 100}%`);
  }
  ngp_handleRangeMinChange(ngp_event) {
    ngp_event.stopPropagation();
    this.minPriceInput.value = ngp_event.target.value;
    this.minPriceInput.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  }
  ngp_handleRangeMaxChange(ngp_event) {
    ngp_event.stopPropagation();
    this.maxPriceInput.value = ngp_event.target.value;
    this.maxPriceInput.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  }
  ngp_handleRangeMinInput(ngp_event) {
    ngp_event.target.value = Math.min(parseInt(ngp_event.target.value), parseInt(this.maxPriceInput.value || ngp_event.target.max) - 1);
    ngp_event.target.parentElement.style.setProperty('--range-min', `${parseInt(ngp_event.target.value) / parseInt(ngp_event.target.max) * 100}%`);
    this.minPriceInput.value = ngp_event.target.value;
  }
  ngp_handleRangeMaxInput(ngp_event) {
    ngp_event.target.value = Math.max(parseInt(ngp_event.target.value), parseInt(this.minPriceInput.value || ngp_event.target.min) + 1);
    ngp_event.target.parentElement.style.setProperty('--range-max', `${parseInt(ngp_event.target.value) / parseInt(ngp_event.target.max) * 100}%`);
    this.maxPriceInput.value = ngp_event.target.value;
  }
}
customElements.define("ngp-price-range", ngp_PriceRange);
class ngp_FacetForm extends HTMLFormElement {
  constructor() {
    super();
    this.dirty = false;
    this.cachedMap = new Map();
    this.addEventListener('change', this.ngp_onFormChange);
    this.addEventListener('submit', this.ngp_onFormSubmit);
  }
  ngp_onFormChange() {
    this.dirty = true;
    this.dispatchEvent(new Event('submit', {
      cancelable: true
    }));
  }
  ngp_onFormSubmit(ngp_event) {
    ngp_event.preventDefault();
    if (!this.dirty) return;
    const ngp_url = this.ngp_buildUrl().toString();
    this.ngp_renderSection(ngp_url, ngp_event);
  }
  ngp_buildUrl() {
    const ngp_searchParams = new URLSearchParams(new FormData(this));
    const ngp_url = new URL(this.action);
    ngp_url.search = '';
    ngp_searchParams.forEach((ngp_value, ngp_key) => ngp_url.searchParams.append(ngp_key, ngp_value));
    ['page', 'filter.v.price.gte', 'filter.v.price.lte'].forEach(ngp_item => {
      if (ngp_url.searchParams.get(ngp_item) === '') {
        ngp_url.searchParams.delete(ngp_item);
      }
    });
    ngp_url.searchParams.set('section_id', NgpThemeRuntime.utils.getSectionId(this));
    return ngp_url;
  }
  ngp_updateURLHash(ngp_url) {
    const ngp_clonedUrl = new URL(ngp_url);
    ngp_clonedUrl.searchParams.delete('section_id');
    history.replaceState({}, '', ngp_clonedUrl.toString());
  }
  ngp_beforeRenderSection() {
    const ngp_container = document.getElementById('ProductGridContainer');
    const ngp_loadings = document.querySelectorAll('[data-facet-loading]');
    const ngp_translateY = NgpThemeRuntime.config.motionReduced ? 0 : 50;
    NgpThemeRuntime.Motion.timeline([[ngp_container, {
      y: ngp_translateY,
      opacity: 0
    }, {
      duration: 0
    }]]);
    setTimeout(() => {
      const ngp_target = document.querySelector(".ngp-collection");
      window.scrollTo({
        top: ngp_target.getBoundingClientRect().top + window.scrollY - 95,
        behavior: NgpThemeRuntime.config.motionReduced ? 'auto' : 'smooth'
      });
      if (ngp_loadings) {
        ngp_loadings.forEach(ngp_loading => {
          ngp_loading.classList.add("ngp-btn--loading");
        });
      }
    }, 100);
  }
  ngp_afterRenderSection() {
    const ngp_container = document.getElementById('ProductGridContainer');
    const ngp_items = ngp_container.querySelectorAll(".ngp-product-card");
    const ngp_loadings = document.querySelectorAll('[data-facet-loading]');
    const ngp_translateY = NgpThemeRuntime.config.motionReduced ? 0 : 50;
    NgpThemeRuntime.Motion.timeline([[ngp_container, {
      y: [ngp_translateY, 0],
      opacity: [0, 1]
    }], [ngp_items, {
      y: [ngp_translateY, 0],
      opacity: [0, 1],
      visibility: ['hidden', 'visible']
    }, {
      duration: 0.5,
      delay: NgpThemeRuntime.config.motionReduced ? 0 : NgpThemeRuntime.Motion.stagger(0.1)
    }]]);
    if (ngp_loadings) {
      ngp_loadings.forEach(ngp_loading => {
        ngp_loading.classList.remove("ngp-btn--loading");
      });
    }
    document.dispatchEvent(new CustomEvent('collection:rerendered'));
  }
  ngp_renderSection(ngp_url, ngp_event) {
    this.cachedMap.has(ngp_url) ? this.ngp_renderSectionFromCache(ngp_url, ngp_event) : this.ngp_renderSectionFromFetch(ngp_url, ngp_event);
    if (this.hasAttribute('data-history')) this.ngp_updateURLHash(ngp_url);
    this.dirty = false;
  }
  ngp_renderSectionFromFetch(ngp_url, ngp_event) {
    this.ngp_beforeRenderSection();
    const ngp_start = performance.now();
    fetch(ngp_url).then(ngp_response => ngp_response.text()).then(ngp_responseText => {
      const ngp_execution = performance.now() - ngp_start;
      setTimeout(() => {
        this.ngp_renderFilters(ngp_responseText, ngp_event);
        this.ngp_renderFiltersActive(ngp_responseText);
        this.ngp_renderProductGridContainer(ngp_responseText);
        this.ngp_renderProductCount(ngp_responseText);
        this.ngp_renderSortBy(ngp_responseText);
        this.ngp_renderSortByMobile(ngp_responseText);
        NgpThemeRuntime.pubsub.publish(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.facetUpdate, {
          responseText: ngp_responseText
        });
        this.cachedMap.set(ngp_url, ngp_responseText);
        this.ngp_afterRenderSection();
      }, ngp_execution > 250 ? 0 : 250);
    });
  }
  ngp_renderSectionFromCache(ngp_url, ngp_event) {
    this.ngp_beforeRenderSection();
    setTimeout(() => {
      const ngp_responseText = this.cachedMap.get(ngp_url);
      this.ngp_renderFilters(ngp_responseText, ngp_event);
      this.ngp_renderFiltersActive(ngp_responseText);
      this.ngp_renderProductGridContainer(ngp_responseText);
      this.ngp_renderProductCount(ngp_responseText);
      this.ngp_renderSortBy(ngp_responseText);
      this.ngp_renderSortByMobile(ngp_responseText);
      NgpThemeRuntime.pubsub.publish(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.facetUpdate, {
        responseText: ngp_responseText
      });
      this.ngp_afterRenderSection();
    }, 250);
  }
  ngp_renderFilters(ngp_responseText, ngp_event) {
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    const ngp_facetElements = ngp_parsedHTML.querySelectorAll('#FacetFiltersContainer [data-filter], #MobileFacetFiltersContainer [data-filter]');
    const ngp_matchesIndex = ngp_element => {
      const ngp_jsFilter = ngp_event ? ngp_event.target.closest('[data-filter]') : undefined;
      return ngp_jsFilter ? ngp_element.dataset.index === ngp_jsFilter.dataset.index : false;
    };
    const ngp_facetsToRender = Array.from(ngp_facetElements).filter(ngp_element => !ngp_matchesIndex(ngp_element));
    ngp_facetsToRender.forEach(ngp_element => {
      const ngp_filter = document.querySelector(`[data-filter][data-index="${ngp_element.dataset.index}"]`);
      if (ngp_filter !== null) {
        if (ngp_filter.tagName === 'DETAILS') {
          ngp_filter.querySelector('summary + *').innerHTML = ngp_element.querySelector('summary + *').innerHTML;
        } else {
          ngp_filter.innerHTML = ngp_element.innerHTML;
        }
      }
    });
  }
  ngp_renderFiltersActive(ngp_responseText) {
    const ngp_id = 'FacetFiltersActive';
    if (document.getElementById(ngp_id) === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    document.getElementById(ngp_id).innerHTML = ngp_parsedHTML.getElementById(ngp_id) && ngp_parsedHTML.getElementById(ngp_id).innerHTML;
  }
  ngp_renderProductGridContainer(ngp_responseText) {
    const ngp_id = 'ProductGridContainer';
    if (document.getElementById(ngp_id) === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    document.getElementById(ngp_id).innerHTML = ngp_parsedHTML.getElementById(ngp_id) && ngp_parsedHTML.getElementById(ngp_id).innerHTML;
    const ngp_layoutSwitcher = document.querySelector('#ProductGridWrapper layout-switcher');
    if (ngp_layoutSwitcher) ngp_layoutSwitcher.onButtonClick(ngp_layoutSwitcher.querySelector(".ngp-btn--active"));
  }
  ngp_renderProductCount(ngp_responseText) {
    const ngp_id = 'ProductCount';
    if (document.getElementById(ngp_id) === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    document.getElementById(ngp_id).innerHTML = ngp_parsedHTML.getElementById(ngp_id) && ngp_parsedHTML.getElementById(ngp_id).innerHTML;
  }
  ngp_renderSortBy(ngp_responseText) {
    const ngp_id = 'SortByContainer';
    if (document.getElementById(ngp_id) === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    document.getElementById(ngp_id).innerHTML = ngp_parsedHTML.getElementById(ngp_id) && ngp_parsedHTML.getElementById(ngp_id).innerHTML;
  }
  ngp_renderSortByMobile(ngp_responseText) {
    const ngp_id = 'SortByContainerMobile';
    if (document.getElementById(ngp_id) === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    document.getElementById(ngp_id).innerHTML = ngp_parsedHTML.getElementById(ngp_id) && ngp_parsedHTML.getElementById(ngp_id).innerHTML;
  }
}
customElements.define("ngp-facet-form", ngp_FacetForm, {
  extends: 'form'
});
class ngp_FacetRemove extends HTMLAnchorElement {
  constructor() {
    super();
    this.addEventListener('click', this.ngp_onClick);
  }
  ngp_onClick(ngp_event) {
    const ngp_form = this.closest('form[is="facet-form"]') || document.querySelector('form[is="facet-form"]');
    if (ngp_form) {
      ngp_event.preventDefault();
      const ngp_url = new URL(this.href);
      ngp_url.searchParams.set('section_id', NgpThemeRuntime.utils.getSectionId(ngp_form));
      ngp_form.renderSection(ngp_url.toString(), ngp_event);
    }
  }
}
customElements.define("ngp-facet-remove", ngp_FacetRemove, {
  extends: 'a'
});
class ngp_FacetCount extends HTMLElement {
  constructor() {
    super();
  }
  facetUpdateUnsubscriber = undefined;
  connectedCallback() {
    this.facetUpdateUnsubscriber = NgpThemeRuntime.pubsub.subscribe(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.facetUpdate, this.ngp_onFacetUpdate.bind(this));
  }
  disconnectedCallback() {
    if (this.facetUpdateUnsubscriber) {
      this.facetUpdateUnsubscriber();
    }
  }
  get ngp_itemCount() {
    return parseInt(this.innerText.replace(/\D/g, ''));
  }
  ngp_onFacetUpdate(ngp_event) {
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_event.responseText, 'text/html');
    const ngp_facetCount = ngp_parsedHTML.querySelector("ngp-facet-count");
    this.innerText = ngp_facetCount && ngp_facetCount.innerHTML;
    this.hidden = this.ngp_itemCount === 0;
  }
}
customElements.define("ngp-facet-count", ngp_FacetCount);
class ngp_LoadMoreButton extends HTMLButtonElement {
  constructor() {
    super();
    this.onClickHandler = this.ngp_onClick.bind(this);
  }
  connectedCallback() {
    this.addEventListener('click', this.onClickHandler);
    if (this.getAttribute('type') == 'infinite') {
      NgpThemeRuntime.Motion.inView(this, this.onClickHandler, {
        margin: '200px 0px 200px 0px'
      });
    }
  }
  disconnectedCallback() {
    this.removeEventListener('click', this.onClickHandler);
  }
  ngp_onClick() {
    if (this.classList.contains("ngp-btn--loading")) return;
    this.ngp_loadingState();
    const ngp_url = this.ngp_setUrl().toString();
    fetch(ngp_url).then(ngp_response => ngp_response.text()).then(ngp_responseText => {
      this.ngp_renderPagination(ngp_responseText);
      this.ngp_renderProductGridContainer(ngp_responseText);
    });
  }
  ngp_renderPagination(ngp_responseText) {
    const ngp_productGridContainer = document.getElementById('ProductGridContainer');
    if (ngp_productGridContainer === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    const ngp_pagination = ngp_productGridContainer.querySelector(".ngp-pagination");
    const ngp_source = ngp_parsedHTML.querySelector(".ngp-pagination");
    if (ngp_source) {
      ngp_pagination.innerHTML = ngp_source.innerHTML;
    } else {
      ngp_pagination.remove();
    }
  }
  ngp_renderProductGridContainer(ngp_responseText) {
    const ngp_productGridContainer = document.getElementById('ProductGridContainer');
    if (ngp_productGridContainer === null) return;
    const ngp_parsedHTML = new DOMParser().parseFromString(ngp_responseText, 'text/html');
    const ngp_productList = ngp_productGridContainer.querySelector(".ngp-products-list");
    const ngp_gridList = ngp_productGridContainer.querySelector("ngp-grid-list");
    const ngp_source = ngp_parsedHTML.querySelector(".ngp-products-list");
    if (ngp_source && ngp_productList) {
      ngp_source.querySelectorAll(".ngp-card").forEach(ngp_item => {
        ngp_productList.appendChild(ngp_item);
      });
      ngp_gridList && ngp_gridList.reload();
    }
  }
  ngp_setUrl() {
    const ngp_url = new URL(this.getAttribute('action'));
    ngp_url.searchParams.set('section_id', NgpThemeRuntime.utils.getSectionId(this));
    return ngp_url;
  }
  ngp_loadingState() {
    this.classList.add("ngp-pointer-events-none");
    this.classList.add("ngp-btn--loading");
  }
}
customElements.define("ngp-load-more-button", ngp_LoadMoreButton, {
  extends: "ngp-button"
});
class ngp_LayoutSwitcher extends HTMLElement {
  constructor() {
    super();
    this.cookieName = 'tuanntvcutheme:collection-layout';
    this.ngp_initLayoutMode();
    this.ngp_buttons.forEach(ngp_button => {
      ngp_button.addEventListener('click', this.ngp_onButtonClick.bind(this));
    });
  }
  get ngp_buttons() {
    return this.querySelectorAll("ngp-button");
  }
  ngp_onButtonClick(ngp_event) {
    const ngp_target = ngp_event.target ? ngp_event.target : ngp_event;
    this.ngp_changeLayout(ngp_target, ngp_target.dataset.layoutMode);
  }
  ngp_initLayoutMode() {
    if (NgpThemeRuntime.config.hasLocalStorage) {
      const ngp_layoutMode = window.localStorage.getItem(this.cookieName);
      if (ngp_layoutMode !== null) {
        const ngp_target = this.querySelector(`button[data-layout-mode="${ngp_layoutMode}"]`);
        if (ngp_target) {
          this.ngp_changeLayout(ngp_target, ngp_layoutMode);
        }
      }
    }
  }
  ngp_changeLayout(ngp_target, ngp_layoutMode) {
    const ngp_productGrid = document.getElementById('ProductsList');
    if (!ngp_productGrid) return;
    const ngp_removedClass = ["ngp-f-grid-1-cols", "ngp-f-grid-2-cols"];
    ngp_removedClass.forEach(ngp_removed => {
      ngp_productGrid.classList.remove(ngp_removed);
    });
    let ngp_addedClass = '';
    switch (ngp_layoutMode) {
      case 'grid-1':
        ngp_addedClass = "ngp-f-grid-1-cols";
        break;
      case 'grid-2':
        ngp_addedClass = "ngp-f-grid-2-cols";
        break;
    }
    ngp_productGrid.classList.add(ngp_addedClass);
    this.ngp_buttons.forEach(ngp_button => {
      ngp_button.classList.remove("ngp-btn--active");
    });
    ngp_target.classList.add("ngp-btn--active");
    if (NgpThemeRuntime.config.hasLocalStorage) {
      window.localStorage.setItem(this.cookieName, ngp_layoutMode);
    }
  }
}
customElements.define("ngp-layout-switcher", ngp_LayoutSwitcher);

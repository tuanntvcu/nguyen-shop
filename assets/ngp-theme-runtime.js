window.NgpThemeRuntime = window.NgpThemeRuntime || {};
NgpThemeRuntime.config = {
  hasLocalStorage: false,
  mqlMobile: false,
  mqlTablet: false,
  mediaQueryMobile: 'screen and (max-width: 767px)',
  mediaQueryTablet: 'screen and (max-width: 1023px)',
  motionReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
  isRTL: document.documentElement.getAttribute('dir') === 'rtl'
};
(function () {
  // Detect browser has support local storage.
  try {
    const ngp_key = 'tuanntvcu:test';
    window.localStorage.setItem(ngp_key, 'test');
    window.localStorage.removeItem(ngp_key);
    NgpThemeRuntime.config.hasLocalStorage = true;
  } catch (ngp_err) {}
  NgpThemeRuntime.DOMready = function (ngp_callback) {
    document.readyState != 'loading' ? ngp_callback() : document.addEventListener('DOMContentLoaded', ngp_callback);
  };
  NgpThemeRuntime.a11y = {
    trapFocusHandlers: {},
    getFocusableElements: ngp_container => {
      return Array.from(ngp_container.querySelectorAll("summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"));
    },
    trapFocus: (ngp_container, ngp_elementToFocus = ngp_container) => {
      var ngp_elements = NgpThemeRuntime.a11y.getFocusableElements(ngp_container);
      var ngp_first = ngp_elements[0];
      var ngp_last = ngp_elements[ngp_elements.length - 1];
      NgpThemeRuntime.a11y.removeTrapFocus();
      NgpThemeRuntime.a11y.trapFocusHandlers.focusin = ngp_event => {
        if (ngp_event.target !== ngp_container && ngp_event.target !== ngp_last && ngp_event.target !== ngp_first) return;
        document.addEventListener('keydown', NgpThemeRuntime.a11y.trapFocusHandlers.keydown);
      };
      NgpThemeRuntime.a11y.trapFocusHandlers.focusout = function () {
        document.removeEventListener('keydown', NgpThemeRuntime.a11y.trapFocusHandlers.keydown);
      };
      NgpThemeRuntime.a11y.trapFocusHandlers.keydown = function (ngp_event) {
        if (ngp_event.code.toUpperCase() !== 'TAB') return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (ngp_event.target === ngp_last && !ngp_event.shiftKey) {
          ngp_event.preventDefault();
          ngp_first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if ((ngp_event.target === ngp_container || ngp_event.target === ngp_first) && ngp_event.shiftKey) {
          ngp_event.preventDefault();
          ngp_last.focus();
        }
      };
      document.addEventListener('focusout', NgpThemeRuntime.a11y.trapFocusHandlers.focusout);
      document.addEventListener('focusin', NgpThemeRuntime.a11y.trapFocusHandlers.focusin);
      ngp_elementToFocus.focus();
      if (ngp_elementToFocus.tagName === 'INPUT' && ['search', 'text', 'email', 'url'].includes(ngp_elementToFocus.type) && ngp_elementToFocus.value) {
        ngp_elementToFocus.setSelectionRange(0, ngp_elementToFocus.value.length);
      }
    },
    removeTrapFocus: (ngp_elementToFocus = null) => {
      document.removeEventListener('focusin', NgpThemeRuntime.a11y.trapFocusHandlers.focusin);
      document.removeEventListener('focusout', NgpThemeRuntime.a11y.trapFocusHandlers.focusout);
      document.removeEventListener('keydown', NgpThemeRuntime.a11y.trapFocusHandlers.keydown);
      if (ngp_elementToFocus) ngp_elementToFocus.focus();
    }
  };
  NgpThemeRuntime.utils = {
    throttle: ngp_callback => {
      let ngp_requestId = null,
        ngp_lastArgs;
      const ngp_later = ngp_context => () => {
        ngp_requestId = null;
        ngp_callback.apply(ngp_context, ngp_lastArgs);
      };
      const ngp_throttled = (...ngp_args) => {
        ngp_lastArgs = ngp_args;
        if (ngp_requestId === null) {
          ngp_requestId = requestAnimationFrame(ngp_later(this));
        }
      };
      ngp_throttled.cancel = () => {
        cancelAnimationFrame(ngp_requestId);
        ngp_requestId = null;
      };
      return ngp_throttled;
    },
    setScrollbarWidth: () => {
      const ngp_scrollbarWidth = window.innerWidth - document.body.clientWidth;
      ngp_scrollbarWidth > 0 && document.documentElement.style.setProperty('--scrollbar-width', `${ngp_scrollbarWidth}px`);
    },
    waitForEvent: (ngp_element, ngp_eventName) => {
      return new Promise(ngp_resolve => {
        // Event handler that checks if the event target is the expected element
        const ngp_eventHandler = ngp_event => {
          if (ngp_event.target === ngp_element) {
            ngp_element.removeEventListener(ngp_eventName, ngp_eventHandler); // Clean up listener
            ngp_resolve(ngp_event); // Resolve the promise with the event
          }
        };

        // Attach the event handler to the element
        ngp_element.addEventListener(ngp_eventName, ngp_eventHandler);
      });
    },
    queryDomNodes: (ngp_selectors = {}, ngp_context = document) => {
      const ngp_domNodes = Object.entries(ngp_selectors).reduce((ngp_acc, [ngp_name, ngp_selector]) => {
        const ngp_findOne = typeof ngp_selector === 'string';
        const ngp_queryMethod = ngp_findOne ? 'querySelector' : 'querySelectorAll';
        const ngp_sl = ngp_findOne ? ngp_selector : ngp_selector[0];
        ngp_acc[ngp_name] = ngp_context && ngp_context[ngp_queryMethod](ngp_sl);
        if (!ngp_findOne && ngp_acc[ngp_name]) {
          ngp_acc[ngp_name] = [...ngp_acc[ngp_name]];
        }
        return ngp_acc;
      }, {});
      return ngp_domNodes;
    },
    addEventDelegate: ({
      context: ngp_context = document.documentElement,
      event: ngp_event = 'click',
      selector: ngp_selector,
      handler: ngp_handler,
      capture: ngp_capture = false
    }) => {
      const ngp_listener = function (ngp_e) {
        // loop parent nodes from the target to the delegation node
        for (let ngp_target = ngp_e.target; ngp_target && ngp_target !== this; ngp_target = ngp_target.parentNode) {
          if (ngp_target.matches(ngp_selector)) {
            ngp_handler.call(ngp_target, ngp_e, ngp_target);
            break;
          }
        }
      };
      ngp_context.addEventListener(ngp_event, ngp_listener, ngp_capture);
      return () => {
        ngp_context.removeEventListener(ngp_event, ngp_listener, ngp_capture);
      };
    },
    getSectionId: ngp_element => {
      if (ngp_element.hasAttribute('data-section-id')) {
        return ngp_element.dataset.sectionId;
      } else {
        if (!ngp_element.classList.contains("ngp-shopify-section")) {
          ngp_element = ngp_element.closest(".ngp-shopify-section");
        }
        return ngp_element.id.replace('shopify-section-', '');
      }
    },
    debounce: (ngp_fn, ngp_wait) => {
      let ngp_t;
      return (...ngp_args) => {
        clearTimeout(ngp_t);
        ngp_t = setTimeout(() => ngp_fn.apply(this, ngp_args), ngp_wait);
      };
    },
    fetchConfig: (ngp_type = 'json') => {
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: `application/${ngp_type}`
        }
      };
    },
    /**
     * Store key-value pair with expiration time in localStorage
     * Use storage instead of cookie to make it work properly on Safari IOS (in iframe).
     */
    setStorage(ngp_key, ngp_value, ngp_expiryInDays) {
      if (!NgpThemeRuntime.config.hasLocalStorage) return;
      const ngp_now = new Date();
      const ngp_item = {
        value: ngp_value,
        expiry: ngp_now.getTime() + ngp_expiryInDays * 86400000
      };
      window.localStorage.setItem(ngp_key, JSON.stringify(ngp_item));
    },
    getStorage(ngp_key) {
      if (!NgpThemeRuntime.config.hasLocalStorage) return null;
      const ngp_itemStr = window.localStorage.getItem(ngp_key);
      // If the item doesn't exist, return null.
      if (!ngp_itemStr) {
        return null;
      }
      const ngp_item = JSON.parse(ngp_itemStr);
      const ngp_now = new Date();
      // Compare the expiry time of the item with the current time.
      if (ngp_now.getTime() > ngp_item.expiry) {
        // If the item has expired, remove it from storage and return null.
        window.localStorage.removeItem(ngp_key);
        return null;
      }
      return ngp_item.value;
    },
    postLink: (ngp_path, ngp_options) => {
      ngp_options = ngp_options || {};
      const ngp_method = ngp_options['method'] || 'post';
      const ngp_params = ngp_options['parameters'] || {};
      const ngp_form = document.createElement('form');
      ngp_form.setAttribute('method', ngp_method);
      ngp_form.setAttribute('action', ngp_path);
      for (const ngp_key in ngp_params) {
        for (const ngp_index in ngp_params[ngp_key]) {
          for (const ngp_key2 in ngp_params[ngp_key][ngp_index]) {
            const ngp_hiddenField = document.createElement('input');
            ngp_hiddenField.setAttribute('type', 'hidden');
            ngp_hiddenField.setAttribute('name', `${ngp_key}[${ngp_index}][${ngp_key2}]`);
            ngp_hiddenField.setAttribute('value', ngp_params[ngp_key][ngp_index][ngp_key2]);
            ngp_form.appendChild(ngp_hiddenField);
          }
        }
      }
      document.body.appendChild(ngp_form);
      ngp_form.submit();
      document.body.removeChild(ngp_form);
    },
    imageReady: ngp_imageOrArray => {
      if (!ngp_imageOrArray) {
        return Promise.resolve();
      }
      ngp_imageOrArray = ngp_imageOrArray instanceof Element ? [ngp_imageOrArray] : Array.from(ngp_imageOrArray);
      return Promise.all(ngp_imageOrArray.map(ngp_image => {
        return new Promise(ngp_resolve => {
          if (ngp_image.tagName === 'IMG' && ngp_image.complete || !ngp_image.offsetParent) {
            ngp_resolve();
          } else {
            ngp_image.onload = () => ngp_resolve();
          }
        });
      }));
    },
    displayedMedia: ngp_media => {
      return Array.from(ngp_media).find(ngp_item => {
        const ngp_style = window.getComputedStyle(ngp_item);
        return ngp_style.display !== 'none';
      });
    }
  };
  NgpThemeRuntime.pubsub = {
    PUB_SUB_EVENTS: {
      cartUpdate: 'cart-update',
      quantityUpdate: 'quantity-update',
      quantityRules: 'quantity-rules',
      quantityBoundries: 'quantity-boundries',
      variantChange: 'variant-change',
      cartError: 'cart-error',
      facetUpdate: 'facet-update',
      optionValueSelectionChange: 'option-value-selection-change'
    },
    subscribers: {},
    subscribe: (ngp_eventName, ngp_callback) => {
      if (NgpThemeRuntime.pubsub.subscribers[ngp_eventName] === undefined) {
        NgpThemeRuntime.pubsub.subscribers[ngp_eventName] = [];
      }
      NgpThemeRuntime.pubsub.subscribers[ngp_eventName] = [...NgpThemeRuntime.pubsub.subscribers[ngp_eventName], ngp_callback];
      return function ngp_unsubscribe() {
        NgpThemeRuntime.pubsub.subscribers[ngp_eventName] = NgpThemeRuntime.pubsub.subscribers[ngp_eventName].filter(ngp_cb => {
          return ngp_cb !== ngp_callback;
        });
      };
    },
    publish: (ngp_eventName, ngp_data) => {
      if (NgpThemeRuntime.pubsub.subscribers[ngp_eventName]) {
        NgpThemeRuntime.pubsub.subscribers[ngp_eventName].forEach(ngp_callback => {
          ngp_callback(ngp_data);
        });
      }
    }
  };
  NgpThemeRuntime.focusVisiblePolyfill = function () {
    const ngp_navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN'];
    let ngp_currentFocusedElement = null;
    let ngp_mouseClick = null;
    window.addEventListener('keydown', ngp_event => {
      if (ngp_navKeys.includes(ngp_event.code.toUpperCase())) {
        ngp_mouseClick = false;
      }
    });
    window.addEventListener('mousedown', ngp_event => {
      ngp_mouseClick = true;
    });
    window.addEventListener('focus', () => {
      if (ngp_currentFocusedElement) ngp_currentFocusedElement.classList.remove("ngp-focused");
      if (ngp_mouseClick) return;
      ngp_currentFocusedElement = document.activeElement;
      ngp_currentFocusedElement.classList.add("ngp-focused");
    }, true);
  };
  NgpThemeRuntime.Carousel = function () {
    class ngp_Carousel {
      constructor(ngp_container, ngp_options, ngp_modules = null) {
        this.container = ngp_container;
        this.slideCount = ngp_container.querySelectorAll('.swiper-wrapper > .swiper-slide').length;
        let ngp_defaultModules = [NgpThemeRuntime.Swiper.Navigation, NgpThemeRuntime.Swiper.Pagination, NgpThemeRuntime.Swiper.Keyboard, NgpThemeRuntime.Swiper.Mousewheel];
        if (ngp_modules) {
          ngp_defaultModules = ngp_defaultModules.concat(ngp_modules);
        }
        const ngp_configuredSlidesPerView = [ngp_options.slidesPerView, ...Object.values(ngp_options.breakpoints || {}).map(ngp_breakpoint => ngp_breakpoint.slidesPerView)].map(Number).filter(Number.isFinite);
        const ngp_maximumSlidesPerView = Math.max(1, ...ngp_configuredSlidesPerView);
        const ngp_carouselEvents = ngp_options.on || {};
        const ngp_updateOverflow = ngp_eventName => (...ngp_args) => {
          if (typeof ngp_carouselEvents[ngp_eventName] === 'function') {
            ngp_carouselEvents[ngp_eventName](...ngp_args);
          }
          window.requestAnimationFrame(() => this.ngp_updateOverflowState(ngp_args[0]));
        };
        this.options = {
          modules: ngp_defaultModules,
          ...ngp_options,
          // Do not create duplicate loop slides when every real slide fits at
          // one of the configured breakpoints. The slider can still navigate
          // normally at narrower breakpoints where fewer cards are visible.
          loop: this.slideCount > ngp_maximumSlidesPerView && ngp_options.loop === true,
          watchOverflow: true,
          on: {
            ...ngp_carouselEvents,
            init: ngp_updateOverflow('init'),
            resize: ngp_updateOverflow('resize'),
            breakpoint: ngp_updateOverflow('breakpoint'),
            update: ngp_updateOverflow('update')
          }
        };
      }
      ngp_init() {
        this.slider = new NgpThemeRuntime.Swiper.Swiper(this.container, this.options);
      }
      ngp_updateOverflowState(ngp_swiper) {
        if (!ngp_swiper || ngp_swiper.destroyed) return;
        const ngp_slidesPerView = Number(ngp_swiper.params.slidesPerView);
        const ngp_hasOverflow = Number.isFinite(ngp_slidesPerView) ? this.slideCount > ngp_slidesPerView : this.ngp_hasAutoSlidesOverflow(ngp_swiper);
        const ngp_controls = [ngp_swiper.navigation && ngp_swiper.navigation.prevEl, ngp_swiper.navigation && ngp_swiper.navigation.nextEl, ngp_swiper.pagination && ngp_swiper.pagination.el].flatMap(ngp_element => Array.from(ngp_element ? ngp_element.length !== undefined && !ngp_element.nodeType ? ngp_element : [ngp_element] : []));
        this.container.classList.toggle('swiper-without-overflow', !ngp_hasOverflow);
        ngp_swiper.allowTouchMove = ngp_hasOverflow && ngp_swiper.params.allowTouchMove !== false;
        const ngp_controlGroups = new Set();
        ngp_controls.forEach(ngp_control => {
          ngp_control.classList.toggle("ngp-slider-control-hidden", !ngp_hasOverflow);
          const ngp_group = ngp_control.closest(".ngp-slider-controls--group") || ngp_control.closest(".ngp-swiper-controls") || ngp_control.closest(".ngp-slider-controls");
          if (ngp_group) ngp_controlGroups.add(ngp_group);
        });
        ngp_controlGroups.forEach(ngp_group => ngp_group.classList.toggle("ngp-slider-controls--inactive", !ngp_hasOverflow));
      }
      ngp_hasAutoSlidesOverflow(ngp_swiper) {
        const ngp_slides = Array.from(this.container.querySelectorAll('.swiper-wrapper > .swiper-slide')).slice(0, this.slideCount);
        const ngp_spaceBetween = Number(ngp_swiper.params.spaceBetween) || 0;
        const ngp_slidesWidth = ngp_slides.reduce((ngp_width, ngp_slide) => ngp_width + ngp_slide.getBoundingClientRect().width, 0);
        return ngp_slidesWidth + Math.max(0, ngp_slides.length - 1) * ngp_spaceBetween > this.container.clientWidth + 1;
      }
    }
    return ngp_Carousel;
  }();
  NgpThemeRuntime.delayUntilInteraction = function () {
    class ngp_ScriptLoader {
      constructor(ngp_callback, ngp_delay = 5000) {
        this.loadScriptTimer = setTimeout(ngp_callback, ngp_delay);
        this.userInteractionEvents = ['mouseover', 'mousemove', 'keydown', 'touchstart', 'touchend', 'touchmove', 'wheel'];
        this.onScriptLoader = this.ngp_triggerScriptLoader.bind(this, ngp_callback);
        this.userInteractionEvents.forEach(ngp_event => {
          window.addEventListener(ngp_event, this.onScriptLoader, {
            passive: !0
          });
        });
      }
      ngp_triggerScriptLoader(ngp_callback) {
        ngp_callback();
        clearTimeout(this.loadScriptTimer);
        this.userInteractionEvents.forEach(ngp_event => {
          window.removeEventListener(ngp_event, this.onScriptLoader, {
            passive: !0
          });
        });
      }
    }
    return ngp_ScriptLoader;
  }();
  NgpThemeRuntime.Currency = function () {
    const ngp_moneyFormat = '${{amount}}'; // eslint-disable-line camelcase

    function ngp_formatMoney(ngp_cents, ngp_format) {
      if (typeof ngp_cents === 'string') {
        ngp_cents = ngp_cents.replace('.', '');
      }
      let ngp_value = '';
      const ngp_placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const ngp_formatString = ngp_format || ngp_moneyFormat;
      function ngp_formatWithDelimiters(ngp_number, ngp_precision, ngp_thousands, ngp_decimal) {
        ngp_thousands = ngp_thousands || ',';
        ngp_decimal = ngp_decimal || '.';
        if (isNaN(ngp_number) || ngp_number === null) {
          return 0;
        }
        ngp_number = (ngp_number / 100.0).toFixed(ngp_precision);
        const ngp_parts = ngp_number.split('.');
        const ngp_dollarsAmount = ngp_parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + ngp_thousands);
        const ngp_centsAmount = ngp_parts[1] ? ngp_decimal + ngp_parts[1] : '';
        return ngp_dollarsAmount + ngp_centsAmount;
      }
      switch (ngp_formatString.match(ngp_placeholderRegex)[1]) {
        case 'amount':
          ngp_value = ngp_formatWithDelimiters(ngp_cents, 2);
          break;
        case 'amount_no_decimals':
          ngp_value = ngp_formatWithDelimiters(ngp_cents, 0);
          break;
        case 'amount_with_comma_separator':
          ngp_value = ngp_formatWithDelimiters(ngp_cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          ngp_value = ngp_formatWithDelimiters(ngp_cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          ngp_value = ngp_formatWithDelimiters(ngp_cents, 0, ' ');
          break;
        case 'amount_with_apostrophe_separator':
          ngp_value = ngp_formatWithDelimiters(ngp_cents, 2, "'");
          break;
      }
      return ngp_formatString.replace(ngp_placeholderRegex, ngp_value);
    }
    function ngp_getBaseUnit(ngp_variant) {
      if (!ngp_variant) {
        return;
      }
      if (!ngp_variant.unit_price_measurement || !ngp_variant.unit_price_measurement.reference_value) {
        return;
      }
      return ngp_variant.unit_price_measurement.reference_value === 1 ? ngp_variant.unit_price_measurement.reference_unit : ngp_variant.unit_price_measurement.reference_value + ngp_variant.unit_price_measurement.reference_unit;
    }
    return {
      formatMoney: ngp_formatMoney,
      getBaseUnit: ngp_getBaseUnit
    };
  }();
  new NgpThemeRuntime.delayUntilInteraction(() => {
    document.body.removeAttribute('data-initializing');
  });
  NgpThemeRuntime.DOMready(NgpThemeRuntime.utils.setScrollbarWidth);
  // window.addEventListener('resize', NgpThemeRuntime.utils.throttle(NgpThemeRuntime.utils.setScrollbarWidth));

  const ngp_mql = window.matchMedia(NgpThemeRuntime.config.mediaQueryMobile);
  NgpThemeRuntime.config.mqlMobile = ngp_mql.matches;
  ngp_mql.onchange = ngp_event => {
    if (ngp_event.matches) {
      NgpThemeRuntime.config.mqlMobile = true;
      document.dispatchEvent(new CustomEvent('matchMobile'));
    } else {
      NgpThemeRuntime.config.mqlMobile = false;
      document.dispatchEvent(new CustomEvent('unmatchMobile'));
    }
  };
  const ngp_mqlTablet = window.matchMedia(NgpThemeRuntime.config.mediaQueryTablet);
  NgpThemeRuntime.config.mqlTablet = ngp_mqlTablet.matches;
  ngp_mqlTablet.onchange = ngp_event => {
    if (ngp_event.matches) {
      NgpThemeRuntime.config.mqlTablet = true;
      document.dispatchEvent(new CustomEvent('matchTablet'));
    } else {
      NgpThemeRuntime.config.mqlTablet = false;
      document.dispatchEvent(new CustomEvent('unmatchTablet'));
    }
  };
})();

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(':focus-visible');
} catch (ngp_e) {
  NgpThemeRuntime.focusVisiblePolyfill();
}
function ngp_pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach(ngp_video => {
    ngp_video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach(ngp_video => {
    ngp_video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach(ngp_video => ngp_video.pause());
  document.querySelectorAll('product-model').forEach(ngp_model => {
    if (ngp_model.modelViewerUI) ngp_model.modelViewerUI.pause();
  });
}
class ngp_HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static ngp_viewTransition(ngp_oldNode, ngp_newContent, ngp_preProcessCallbacks = [], ngp_postProcessCallbacks = []) {
    if (!ngp_oldNode || !ngp_newContent) return;
    ngp_preProcessCallbacks?.forEach(ngp_callback => ngp_callback(ngp_newContent));
    const ngp_newNodeWrapper = document.createElement('div');
    ngp_HTMLUpdateUtility.setInnerHTML(ngp_newNodeWrapper, ngp_newContent.outerHTML);
    const ngp_newNode = ngp_newNodeWrapper.firstChild;

    // dedupe IDs
    const ngp_uniqueKey = Date.now();
    ngp_oldNode.querySelectorAll('[id], [form]').forEach(ngp_element => {
      ngp_element.id && (ngp_element.id = `${ngp_element.id}-${ngp_uniqueKey}`);
      ngp_element.form && ngp_element.setAttribute('form', `${ngp_element.form.getAttribute('id')}-${ngp_uniqueKey}`);
    });
    ngp_oldNode.parentNode.insertBefore(ngp_newNode, ngp_oldNode);
    ngp_oldNode.style.display = 'none';
    ngp_postProcessCallbacks?.forEach(ngp_callback => ngp_callback(ngp_newNode));
    setTimeout(() => ngp_oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static ngp_setInnerHTML(ngp_element, ngp_html) {
    ngp_element.innerHTML = ngp_html;
    ngp_element.querySelectorAll('script').forEach(ngp_oldScriptTag => {
      const ngp_newScriptTag = document.createElement('script');
      Array.from(ngp_oldScriptTag.attributes).forEach(ngp_attribute => {
        ngp_newScriptTag.setAttribute(ngp_attribute.name, ngp_attribute.value);
      });
      ngp_newScriptTag.appendChild(document.createTextNode(ngp_oldScriptTag.innerHTML));
      ngp_oldScriptTag.parentNode.replaceChild(ngp_newScriptTag, ngp_oldScriptTag);
    });
  }
}
class ngp_PageTransition extends HTMLElement {
  constructor() {
    super();
    window.addEventListener('beforeunload', () => {
      document.body.classList.add('page-loading');
    });
    window.addEventListener('DOMContentLoaded', () => {
      NgpThemeRuntime.Motion.animate(this, {
        visibility: 'hidden',
        opacity: 0
      }, {
        duration: 1
      });
      document.body.classList.add('page-loaded');
      document.dispatchEvent(new CustomEvent('page:loaded'));
    });
    window.addEventListener('pageshow', ngp_event => {
      if (ngp_event.persisted) {
        document.body.classList.remove('page-loading');
      }
    });
  }
}
customElements.define("ngp-page-transition", ngp_PageTransition);
const ngp_clearModalComponentCount = new WeakMap();
class ngp_ModalComponent extends HTMLElement {
  constructor() {
    super();
    this.events = {
      handleAfterHide: 'modal:handleAfterHide',
      handleAfterShow: 'modal:handleAfterShow'
    };
    this.classes = {
      show: "ngp-modal-show",
      showing: "ngp-modal-showing"
    };
  }
  static get ngp_observedAttributes() {
    return ['id', 'open'];
  }
  get ngp_isLockingNeeded() {
    return false;
  }
  get ngp_requiresBodyAppended() {
    return false;
  }
  get ngp_controls() {
    return Array.from(document.querySelectorAll(`[aria-controls="${this.id}"]`));
  }
  get ngp_designMode() {
    return this.hasAttribute("ngp-shopify-design-mode");
  }
  get ngp_open() {
    return this.hasAttribute('open');
  }
  get ngp_overlay() {
    // Check if the _overlay property is already set
    if (!this._overlay) {
      // If not set, find the element and cache it
      this._overlay = this.querySelector(".ngp-fixed-overlay");
    }

    // Return the cached element
    return this._overlay;
  }
  get ngp_focusElement() {
    return this.querySelector("ngp-button");
  }
  connectedCallback() {
    // Initialize the AbortController
    this.abortController = new AbortController();

    // Add click event listeners to all controls
    this.ngp_controls.forEach(ngp_button => {
      ngp_button.addEventListener('click', this.ngp_onButtonClick.bind(this), {
        signal: this.abortController.signal
      });
    });

    // Add keyup event listener to document for handling the Escape key
    document.addEventListener('keyup', ngp_event => {
      if (ngp_event.code === 'Escape') {
        this.ngp_hide();
      }
    }, {
      signal: this.abortController.signal
    });

    // Additional setup for Shopify design mode
    if (this.ngp_designMode && Shopify.designMode) {
      const ngp_section = this.closest(".ngp-shopify-section");
      ngp_section.addEventListener('shopify:section:select', ngp_event => {
        this.ngp_show(null, !ngp_event.detail.load);
      }, {
        signal: this.abortController.signal
      });
      ngp_section.addEventListener('shopify:section:deselect', () => {
        this.ngp_hide();
      }, {
        signal: this.abortController.signal
      });
    }
  }
  disconnectedCallback() {
    this.abortController.abort();
  }
  attributeChangedCallback(ngp_name, ngp_oldValue, ngp_newValue) {
    switch (ngp_name) {
      case 'open':
        this.ngp_controls.forEach(ngp_button => ngp_button.setAttribute('aria-expanded', ngp_newValue === null ? 'false' : 'true'));
        if (ngp_oldValue === null && (ngp_newValue === '' || ngp_newValue === 'immediate')) {
          this.hidden = false;
          this.removeAttribute('inert');
          this.parentElementBeforeAppend = null;
          if (this.ngp_requiresBodyAppended && this.parentElement !== document.body) {
            this.parentElementBeforeAppend = this.parentElement;
            document.body.append(this);
          }
          const ngp_handleShowTransitionPromise = this.ngp_handleShowTransition(ngp_newValue !== 'immediate') || Promise.resolve();
          ngp_handleShowTransitionPromise.then(() => {
            this.ngp_handleAfterShow();
            this.dispatchEvent(new CustomEvent(this.events.handleAfterShow, {
              bubbles: true
            }));
          });
        } else if (ngp_oldValue !== null && ngp_newValue === null) {
          this.setAttribute('inert', '');
          const ngp_handleHideTransitionPromise = this.ngp_handleHideTransition() || Promise.resolve();
          ngp_handleHideTransitionPromise.then(() => {
            this.ngp_handleAfterHide();
            if (!this.hasAttribute('inert')) return;
            if (this.parentElement === document.body && this.parentElementBeforeAppend) {
              this.parentElementBeforeAppend.appendChild(this);
              this.parentElementBeforeAppend = null;
            }
            this.dispatchEvent(new CustomEvent(this.events.handleAfterHide, {
              bubbles: true
            }));
            this.hidden = true;
          });
        }
        this.dispatchEvent(new CustomEvent('toggle', {
          bubbles: true
        }));
        break;
    }
  }
  ngp_onButtonClick(ngp_event) {
    ngp_event.preventDefault();
    if (this.ngp_open) {
      this.ngp_hide();
    } else {
      this.ngp_show(ngp_event.currentTarget);
    }
  }
  ngp_hide() {
    if (this.ngp_open) {
      this.removeAttribute('open');
      return NgpThemeRuntime.utils.waitForEvent(this, this.events.handleAfterHide);
    }
  }
  ngp_show(ngp_activeElement = null, ngp_animate = true) {
    // Never lock the document for a modal that page-specific CSS prevents the
    // customer from seeing or closing.
    if (!this.ngp_shouleBeShow() || this.ngp_isPresentationSuppressed()) {
      return Promise.resolve(false);
    }
    if (!this.ngp_open) {
      this.ngp_prepareToShow();
      this.activeElement = ngp_activeElement;
      this.setAttribute('open', ngp_animate ? '' : 'immediate');
      if (this.ngp_isLockingNeeded) {
        document.body.classList.add(this.classes.showing);
      }
      return NgpThemeRuntime.utils.waitForEvent(this, this.events.handleAfterShow);
    }
  }
  ngp_handleAfterHide() {
    setTimeout(() => {
      // Ignore a stale hide completion if this same modal has already reopened.
      if (this.ngp_open) return;

      // Remove trap focus from the active element
      NgpThemeRuntime.a11y.removeTrapFocus(this.activeElement);

      // Conditionally manage locking behavior
      if (this.ngp_isLockingNeeded) {
        document.body.classList.remove(this.classes.showing);

        // Only decrement a lock that this modal successfully registered.
        if (this.lockRegistered) {
          const ngp_currentModalCount = Math.max(0, (ngp_clearModalComponentCount.get(ngp_ModalComponent) || 0) - 1);
          ngp_clearModalComponentCount.set(ngp_ModalComponent, ngp_currentModalCount);
          this.lockRegistered = false;
        }

        // Toggle the 'open' class on the body based on the current lock count
        document.body.classList.toggle(this.classes.show, (ngp_clearModalComponentCount.get(ngp_ModalComponent) || 0) > 0);
      }
    });
  }
  ngp_handleAfterShow() {
    // Trap focus on the specified elements
    NgpThemeRuntime.a11y.trapFocus(this, this.ngp_focusElement);

    // Check if locking is needed
    if (this.ngp_isLockingNeeded) {
      // A modal can be closed while its opening transition is still pending.
      if (!this.ngp_open) {
        document.body.classList.remove(this.classes.showing);
        return;
      }

      // Increment the lock layer count for the ModalElement
      if (!this.lockRegistered) {
        const ngp_currentLockCount = (ngp_clearModalComponentCount.get(ngp_ModalComponent) || 0) + 1;
        ngp_clearModalComponentCount.set(ngp_ModalComponent, ngp_currentLockCount);
        this.lockRegistered = true;
      }

      // Manage class changes on the document body
      document.body.classList.remove(this.classes.showing);
      document.body.classList.add(this.classes.show);
    }
  }
  ngp_shouleBeShow() {
    return true;
  }
  ngp_prepareToShow() {}
  ngp_isPresentationSuppressed() {
    // A modal can be intentionally disabled by page-specific CSS. Check it
    // without the native `hidden` attribute, which would otherwise make every
    // closed modal report `display: none`.
    const ngp_wasHidden = this.hidden;
    if (ngp_wasHidden) this.hidden = false;
    const ngp_styles = window.getComputedStyle(this);
    const ngp_isSuppressed = ngp_styles.display === 'none' || ngp_styles.visibility === 'hidden' || Number.parseFloat(ngp_styles.opacity) === 0;
    if (ngp_wasHidden) this.hidden = true;
    return ngp_isSuppressed;
  }
  ngp_waitForOverlayTransition() {
    return new Promise(ngp_resolve => {
      const ngp_overlay = this.ngp_overlay;
      if (!ngp_overlay) {
        ngp_resolve();
        return;
      }
      let ngp_finished = false;
      const ngp_finish = ngp_event => {
        if (ngp_event && ngp_event.target !== ngp_overlay) return;
        if (ngp_finished) return;
        ngp_finished = true;
        ngp_overlay.removeEventListener('transitionend', ngp_finish);
        ngp_overlay.removeEventListener('transitioncancel', ngp_finish);
        clearTimeout(ngp_fallbackTimer);
        ngp_resolve();
      };
      const ngp_fallbackTimer = setTimeout(ngp_finish, 700);
      ngp_overlay.addEventListener('transitionend', ngp_finish);
      ngp_overlay.addEventListener('transitioncancel', ngp_finish);
    });
  }
  ngp_handleShowTransition() {
    // Start a timeout to set an attribute
    setTimeout(() => {
      this.setAttribute('active', '');
    }, 75);

    // Mobile browsers can cancel or omit transitionend; always release the scroll lock.
    return this.ngp_waitForOverlayTransition();
  }
  ngp_handleHideTransition() {
    // Immediately remove the 'active' attribute
    this.removeAttribute('active');
    return this.ngp_waitForOverlayTransition();
  }
}
customElements.define("ngp-modal-component", ngp_ModalComponent);
ngp_clearModalComponentCount.set(ngp_ModalComponent, 0);
class ngp_BasicModal extends ngp_ModalComponent {
  constructor() {
    super();
  }
  get ngp_isLockingNeeded() {
    return true;
  }
  get ngp_requiresBodyAppended() {
    return true;
  }
}
customElements.define("ngp-basic-modal", ngp_BasicModal);
class ngp_DrawerComponent extends ngp_ModalComponent {
  constructor() {
    super();
    this.events = {
      handleAfterHide: 'drawer:handleAfterHide',
      handleAfterShow: 'drawer:handleAfterShow'
    };
  }
  get ngp_isLockingNeeded() {
    return true;
  }
  get ngp_requiresBodyAppended() {
    return true;
  }
}
customElements.define("ngp-drawer-component", ngp_DrawerComponent);
class ngp_AccordionDetails extends HTMLDetailsElement {
  constructor() {
    super();
    this.ngp_initAccordion();
  }
  ngp_initAccordion() {
    this.isOpen = this.hasAttribute('open');
    this.summaryElement = this.querySelector('summary');
    this.contentElement = this.querySelector('summary + *');
    this.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
    this.summaryElement.addEventListener('click', this.ngp_toggleAccordion.bind(this));
    if (Shopify.designMode) {
      this.ngp_designModeEventSetup();
    }
  }
  static get ngp_observedAttributes() {
    return ['open'];
  }
  get ngp_open() {
    return this.isOpen;
  }
  set ngp_open(ngp_value) {
    if (ngp_value !== this.isOpen) {
      this.isOpen = ngp_value;
      if (this.isConnected) {
        this.ngp_animateAccordion(ngp_value);
      } else {
        if (ngp_value) {
          this.setAttribute('open', '');
        } else {
          this.removeAttribute('open');
        }
      }
      this.setAttribute('aria-expanded', ngp_value ? 'true' : 'false');
      this.setAttribute('aria-controls', this.contentElement.id);
      this.ngp_handleAfterToggle();
    }
  }
  ngp_handleAfterToggle() {}
  ngp_toggleAccordion(ngp_event) {
    ngp_event.preventDefault();
    this.ngp_open = !this.ngp_open;
  }
  ngp_close() {
    this.isOpen = false;
    this.ngp_animateAccordion(false);
  }
  async ngp_animateAccordion(ngp_isOpen) {
    this.style.overflow = 'hidden';
    if (ngp_isOpen) {
      this.setAttribute('open', '');
      await NgpThemeRuntime.Motion.timeline([[this, {
        height: [`${this.summaryElement.clientHeight + 1}px`, `${this.scrollHeight + 1}px`]
      }, {
        duration: 0.25,
        easing: 'ease'
      }], [this.contentElement, {
        opacity: [0, 1],
        transform: ['translateY(10px)', 'translateY(0)']
      }, {
        duration: 0.15,
        at: '<'
      }]]).finished;
    } else {
      await NgpThemeRuntime.Motion.timeline([[this.contentElement, {
        opacity: 0
      }, {
        duration: 0.15
      }], [this, {
        height: [`${this.clientHeight + 1}px`, `${this.summaryElement.clientHeight + 1}px`]
      }, {
        duration: 0.25,
        at: '<',
        easing: 'ease'
      }]]).finished;
      this.removeAttribute('open');
    }
    this.style.height = 'auto';
    this.style.overflow = 'visible';
  }
  ngp_designModeEventSetup() {
    this.addEventListener('shopify:block:select', () => {
      this.ngp_open = true;
    });
    this.addEventListener('shopify:block:deselect', () => {
      this.ngp_open = false;
    });
  }
  attributeChangedCallback(ngp_name, ngp_oldValue, ngp_newValue) {
    if (ngp_name === 'open') {
      this.setAttribute('aria-controls', this.contentElement.id);
    }
  }
}
customElements.define("ngp-accordion-details", ngp_AccordionDetails, {
  extends: 'details'
});
class ngp_AccordionGroup extends ngp_AccordionDetails {
  constructor() {
    super();
  }
  ngp_handleAfterToggle() {
    if (this.isOpen) {
      const ngp_parent = this.closest('.accordion-parent') || document;
      const ngp_siblingsAccordions = ngp_parent.querySelectorAll('details[is="accordion-group"]');
      ngp_siblingsAccordions.forEach(ngp_details => {
        if (ngp_details !== this) {
          ngp_details.open = false;
        }
      });
    }
  }
}
customElements.define("ngp-accordion-group", ngp_AccordionGroup, {
  extends: 'details'
});
class ngp_ProgressBar extends HTMLElement {
  constructor() {
    super();
    if (this.hasAttribute('style')) return;
    if (this.dataset.from) {
      this.ngp_initProgress();
    }
    NgpThemeRuntime.Motion.inView(this, this.ngp_init.bind(this));
  }
  ngp_init() {
    this.ngp_setPercentage(this.dataset.value, this.dataset.max);
  }
  ngp_initProgress() {
    this.ngp_setPercentage(this.dataset.from, this.dataset.max);
  }
  ngp_setPercentage(ngp_val1, ngp_val2) {
    this.style.setProperty('--percent', `${parseInt(ngp_val1) / parseInt(ngp_val2) * 100}%`);
  }
}
customElements.define("ngp-progress-bar", ngp_ProgressBar);
class ngp_CartCount extends HTMLElement {
  constructor() {
    super();
  }
  cartUpdateUnsubscriber = undefined;
  connectedCallback() {
    this.cartUpdateUnsubscriber = NgpThemeRuntime.pubsub.subscribe(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.cartUpdate, this.ngp_onCartUpdate.bind(this));
  }
  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }
  get ngp_itemCount() {
    return parseInt(this.innerText);
  }
  ngp_onCartUpdate(ngp_event) {
    if (ngp_event.cart.errors) return;
    if (ngp_event.cart.item_count > 99) {
      this.innerHTML = `<span class="text-sm">99+</span>`;
      this.classList.add("ngp-cart-count--small-medium");
    } else {
      this.innerText = ngp_event.cart.item_count;
      this.classList.remove("ngp-cart-count--small-medium");
    }
    this.hidden = this.ngp_itemCount === 0;
    const ngp_method = this.ngp_itemCount === 0 ? 'remove' : 'add';
    document.documentElement.classList[ngp_method]("ngp-cart-has-items");
  }
}
customElements.define("ngp-cart-count", ngp_CartCount);
class ngp_QuantityInput extends HTMLElement {
  quantityUpdateUnsubscriber = undefined;
  quantityBoundriesUnsubscriber = undefined;
  quantityRulesUnsubscriber = undefined;
  constructor() {
    super();
  }
  get ngp_sectionId() {
    return this.getAttribute('data-section-id');
  }
  get ngp_productId() {
    return this.getAttribute('data-product-id');
  }
  get ngp_input() {
    return this.querySelector('input');
  }
  get ngp_value() {
    return this.ngp_input.value;
  }
  connectedCallback() {
    this.abortController = new AbortController();
    this.ngp_buttons = Array.from(this.querySelectorAll("ngp-button"));
    this.changeEvent = new Event('change', {
      bubbles: true
    });
    this.ngp_input.addEventListener('change', this.ngp_onInputChange.bind(this));
    this.ngp_input.addEventListener('focus', () => setTimeout(() => this.ngp_input.select()));
    this.ngp_buttons.forEach(ngp_button => ngp_button.addEventListener('click', this.ngp_onButtonClick.bind(this)), {
      signal: this.abortController.signal
    });
    this.ngp_validateQtyRules();
    this.quantityUpdateUnsubscriber = NgpThemeRuntime.pubsub.subscribe(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.quantityUpdate, this.ngp_validateQtyRules.bind(this));
    this.quantityBoundriesUnsubscriber = NgpThemeRuntime.pubsub.subscribe(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.quantityBoundries, this.ngp_setQuantityBoundries.bind(this));
    this.quantityRulesUnsubscriber = NgpThemeRuntime.pubsub.subscribe(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.quantityRules, this.ngp_updateQuantityRules.bind(this));
    this.currentValue = this.ngp_value;
  }
  disconnectedCallback() {
    this.abortController.abort();
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
    if (this.quantityBoundriesUnsubscriber) {
      this.quantityBoundriesUnsubscriber();
    }
    if (this.quantityRulesUnsubscriber) {
      this.quantityRulesUnsubscriber();
    }
  }
  ngp_onButtonClick(ngp_event) {
    const ngp_previousValue = this.ngp_input.value;
    if (ngp_event.currentTarget.name === 'plus') {
      if (parseInt(this.ngp_input.getAttribute('data-min')) > parseInt(this.ngp_input.step) && this.ngp_input.value == 0) {
        this.ngp_input.value = this.ngp_input.getAttribute('data-min');
      } else {
        this.ngp_input.stepUp();
      }
    } else {
      this.ngp_input.stepDown();
    }
    if (ngp_previousValue !== this.ngp_input.value) this.ngp_input.dispatchEvent(this.changeEvent);
    if (this.ngp_input.getAttribute('data-min') === ngp_previousValue && ngp_event.currentTarget.name === 'minus') {
      this.ngp_input.value = parseInt(this.ngp_input.min);
    }
  }
  ngp_onInputChange() {
    if (this.ngp_input.value === '') {
      this.ngp_input.value = parseInt(this.ngp_input.min);
    }
    setTimeout(() => {
      this.ngp_validateQtyRules();
    }, 350);
  }
  ngp_validateQtyRules() {
    const ngp_value = parseInt(this.ngp_input.value);
    if (this.ngp_input.min) {
      const ngp_buttonMinus = this.querySelector('button[name="minus"]');
      if (ngp_buttonMinus) ngp_buttonMinus.toggleAttribute('disabled', parseInt(ngp_value) <= parseInt(this.ngp_input.min));
    }
    if (this.ngp_input.max) {
      const ngp_buttonPlus = this.querySelector('button[name="plus"]');
      if (ngp_buttonPlus) ngp_buttonPlus.toggleAttribute('disabled', parseInt(ngp_value) >= parseInt(this.ngp_input.max));
    } else {
      const ngp_buttonPlus = this.querySelector('button[name="plus"]');
      if (ngp_buttonPlus) ngp_buttonPlus.removeAttribute('disabled');
    }
  }
  ngp_updateQuantityRules({
    data: {
      sectionId: ngp_sectionId,
      productId: ngp_productId,
      parsedHTML: ngp_parsedHTML
    }
  }) {
    if (ngp_sectionId !== this.ngp_sectionId || ngp_productId !== this.ngp_productId) return;
    const ngp_selectors = [".ngp-quantity__input", ".ngp-quantity__rules", '.quantity__label'];
    const ngp_quantityFormUpdated = ngp_parsedHTML.getElementById(`QuantityForm-${ngp_sectionId}`);
    const ngp_quantityForm = this.closest(`#QuantityForm-${ngp_sectionId}`);
    for (let ngp_selector of ngp_selectors) {
      const ngp_current = ngp_quantityForm.querySelector(ngp_selector);
      const ngp_updated = ngp_quantityFormUpdated.querySelector(ngp_selector);
      if (!ngp_current || !ngp_updated) continue;
      if (ngp_selector === ".ngp-quantity__input") {
        const ngp_attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
        for (let ngp_attribute of ngp_attributes) {
          const ngp_valueUpdated = ngp_updated.getAttribute(ngp_attribute);
          if (ngp_valueUpdated !== null) {
            ngp_current.setAttribute(ngp_attribute, ngp_valueUpdated);
          } else {
            ngp_current.removeAttribute(ngp_attribute);
          }
        }
      } else {
        ngp_current.innerHTML = ngp_updated.innerHTML;
      }
    }
  }
  ngp_setQuantityBoundries({
    data: {
      sectionId: ngp_sectionId,
      productId: ngp_productId
    }
  }) {
    if (ngp_sectionId !== this.ngp_sectionId || ngp_productId !== this.ngp_productId) return;
    const ngp_data = {
      cartQuantity: this.ngp_input.hasAttribute('data-cart-quantity') ? parseInt(this.ngp_input.getAttribute('data-cart-quantity')) : 0,
      min: this.ngp_input.hasAttribute('data-min') ? parseInt(this.ngp_input.getAttribute('data-min')) : 1,
      max: this.ngp_input.hasAttribute('data-max') ? parseInt(this.ngp_input.getAttribute('data-max')) : null,
      step: this.ngp_input.hasAttribute('step') ? parseInt(this.ngp_input.getAttribute('step')) : 1
    };
    let ngp_min = ngp_data.min;
    const ngp_max = ngp_data.max === null ? ngp_data.max : ngp_data.max - ngp_data.cartQuantity;
    if (ngp_max !== null) ngp_min = Math.min(ngp_min, ngp_max);
    if (ngp_data.cartQuantity >= ngp_data.min) ngp_min = Math.min(ngp_min, ngp_data.step);
    this.ngp_input.min = ngp_min;
    if (ngp_max) {
      this.ngp_input.max = ngp_max;
    } else {
      this.ngp_input.removeAttribute('max');
    }
    this.ngp_input.value = ngp_min;
    NgpThemeRuntime.pubsub.publish(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.quantityUpdate, undefined);
  }
}
customElements.define("ngp-quantity-input", ngp_QuantityInput);
class ngp_QuantitySelector extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.abortController = new AbortController();
    this.ngp_input = this.querySelector('input');
    this.ngp_buttons = Array.from(this.querySelectorAll("ngp-button"));
    this.changeEvent = new Event('change', {
      bubbles: true
    });
    this.ngp_buttons.forEach(ngp_button => ngp_button.addEventListener('click', this.ngp_onButtonClick.bind(this)), {
      signal: this.abortController.signal
    });
  }
  disconnectedCallback() {
    this.abortController.abort();
  }
  ngp_onButtonClick(ngp_event) {
    ngp_event.preventDefault();
    const ngp_previousValue = this.ngp_input.value;
    if (ngp_event.currentTarget.name === 'plus') {
      this.ngp_input.quantity = this.ngp_input.quantity + 1;
    } else {
      this.ngp_input.quantity = this.ngp_input.quantity - 1;
    }
    if (ngp_previousValue !== this.ngp_input.value) this.ngp_input.dispatchEvent(this.changeEvent);
  }
}
customElements.define("ngp-quantity-selector", ngp_QuantitySelector);
const ngp_onYouTubeApiLoaded = new Promise(ngp_resolve => {
  window.onYouTubeIframeAPIReady = () => ngp_resolve();
});
class ngp_VideoElement extends HTMLElement {
  constructor() {
    super();
    if (this.ngp_posterElement) {
      this.ngp_posterElement.addEventListener('click', this.ngp_handlePosterClick.bind(this));
    }
    if (this.ngp_autoplay) {
      NgpThemeRuntime.Motion.inView(this, () => {
        if (!this.paused) {
          this.ngp_play();
        }
        return () => {
          this.ngp_pause();
        };
      });
    }
  }
  get ngp_posterElement() {
    return this.querySelector('[id^="DeferredPoster-"]');
  }
  get ngp_controlledElement() {
    return this.hasAttribute('aria-controls') ? document.getElementById(this.getAttribute('aria-controls')) : null;
  }
  get ngp_autoplay() {
    return this.hasAttribute('autoplay');
  }
  get ngp_playing() {
    return this.hasAttribute('playing');
  }
  get ngp_player() {
    return this.playerProxy = this.playerProxy || new Proxy(this.ngp_initializePlayer(), {
      get: (ngp_target, ngp_prop) => {
        return async () => {
          ngp_target = await ngp_target;
          this.ngp_handlePlayerAction(ngp_target, ngp_prop);
        };
      }
    });
  }
  static get ngp_observedAttributes() {
    return ['playing'];
  }
  ngp_handlePosterClick(ngp_event) {
    ngp_event.preventDefault();
    ngp_event.stopPropagation();
    if (this.ngp_playing) {
      this.paused = true;
      this.ngp_pause();
    } else {
      this.paused = false;
      this.ngp_play();
    }
  }
  ngp_play() {
    if (!this.ngp_playing) {
      this.ngp_player.play();
    }
  }
  ngp_pause() {
    if (this.ngp_playing) {
      this.ngp_player.pause();
    }
  }
  attributeChangedCallback(ngp_name, ngp_oldValue, ngp_newValue) {
    if (ngp_name === 'playing') {
      if (ngp_oldValue === null && ngp_newValue === '') {
        return this.dispatchEvent(new CustomEvent('video:play', {
          bubbles: true
        }));
      }
      if (ngp_newValue === null) {
        return this.dispatchEvent(new CustomEvent('video:pause', {
          bubbles: true
        }));
      }
    }
  }
  ngp_initializePlayer() {
    if (this.hasAttribute('source')) {
      this.setAttribute('loaded', '');
      this.closest(".ngp-media")?.classList.remove('loading');
      return new Promise(async ngp_resolve => {
        const ngp_templateElement = this.querySelector('template');
        if (ngp_templateElement) {
          ngp_templateElement.replaceWith(ngp_templateElement.content.firstElementChild.cloneNode(true));
        }
        const ngp_muteVideo = this.hasAttribute('autoplay') || window.matchMedia('screen and (max-width: 1023px)').matches;
        const ngp_script = document.createElement('script');
        ngp_script.type = 'text/javascript';
        if (this.getAttribute('source') === 'youtube') {
          if (!window.YT || !window.YT.Player) {
            ngp_script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(ngp_script);
            await new Promise(ngp_resolve2 => {
              ngp_script.onload = ngp_resolve2;
            });
          }
          await ngp_onYouTubeApiLoaded;
          const ngp_player = new YT.Player(this.querySelector('iframe'), {
            events: {
              onReady: () => {
                if (ngp_muteVideo) {
                  ngp_player.mute();
                }
                ngp_resolve(ngp_player);
              },
              onStateChange: ngp_event => {
                if (ngp_event.data === YT.PlayerState.PLAYING) {
                  this.setAttribute('playing', '');
                } else if (ngp_event.data === YT.PlayerState.ENDED || ngp_event.data === YT.PlayerState.PAUSED) {
                  this.removeAttribute('playing');
                }
              }
            }
          });
        }
        if (this.getAttribute('source') === 'vimeo') {
          if (!window.Vimeo || !window.Vimeo.Player) {
            ngp_script.src = 'https://player.vimeo.com/api/player.js';
            document.head.appendChild(ngp_script);
            await new Promise(ngp_resolve2 => {
              ngp_script.onload = ngp_resolve2;
            });
          }
          const ngp_player = new Vimeo.Player(this.querySelector('iframe'));
          if (ngp_muteVideo) {
            ngp_player.setMuted(true);
          }
          ngp_player.on('play', () => {
            this.setAttribute('playing', '');
          });
          ngp_player.on('pause', () => this.removeAttribute('playing'));
          ngp_player.on('ended', () => this.removeAttribute('playing'));
          ngp_resolve(ngp_player);
        }
      });
    } else {
      this.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));
      this.setAttribute('loaded', '');
      this.closest(".ngp-media")?.classList.remove('loading');
      const ngp_player = this.querySelector('video');
      ngp_player.addEventListener('play', () => {
        this.setAttribute('playing', '');
        this.removeAttribute('suspended');
      });
      ngp_player.addEventListener('pause', () => {
        if (!ngp_player.seeking && ngp_player.paused) {
          this.removeAttribute('playing');
        }
      });
      return ngp_player;
    }
  }
  ngp_handlePlayerAction(ngp_target, ngp_prop) {
    if (this.getAttribute('source') === 'youtube') {
      ngp_prop === 'play' ? ngp_target.playVideo() : ngp_target.pauseVideo();
    } else {
      if (ngp_prop === 'play' && !this.hasAttribute('source')) {
        ngp_target.play().catch(ngp_error => {
          if (ngp_error.name === 'NotAllowedError') {
            this.setAttribute('suspended', '');
            ngp_target.controls = true;
            const ngp_replacementImageSrc = ngp_target.previousElementSibling?.currentSrc;
            if (ngp_replacementImageSrc) {
              ngp_target.poster = ngp_replacementImageSrc;
            }
          }
        });
      } else {
        ngp_target[ngp_prop]();
      }
    }
  }
}
customElements.define("ngp-video-element", ngp_VideoElement);
class ngp_LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
      button: this.querySelector("ngp-button"),
      panel: this.querySelector(".ngp-disclosure-list")
    };
    this.elements.panel.removeAttribute('hidden');
    this.elements.button.addEventListener('click', this.ngp_openSelector.bind(this));
    this.elements.button.addEventListener('focusout', this.ngp_closeSelector.bind(this));
    this.addEventListener('keyup', this.ngp_onContainerKeyUp.bind(this));
    this.querySelectorAll('a').forEach(ngp_item => ngp_item.addEventListener('click', this.ngp_onItemClick.bind(this)));
    this.ngp_handleDropdownPos();
  }
  ngp_handleDropdownPos() {
    const ngp_offsetButton = this.elements.button.getBoundingClientRect().right;
    if (window.innerWidth - ngp_offsetButton < 220) {
      this.elements.button.nextElementSibling && this.elements.button.nextElementSibling.classList.add("ngp-disclosure-list__right");
    }
  }
  ngp_hidePanel() {
    this.elements.button.setAttribute('aria-expanded', 'false');
    this.removeAttribute('open');
  }
  ngp_onContainerKeyUp(ngp_event) {
    if (ngp_event.code.toUpperCase() !== 'ESCAPE') return;
    this.ngp_hidePanel();
    this.elements.button.focus();
  }
  ngp_onItemClick(ngp_event) {
    ngp_event.preventDefault();
    const ngp_form = this.querySelector('form');
    this.elements.input.value = ngp_event.currentTarget.dataset.value;
    if (ngp_form) ngp_form.submit();
  }
  ngp_openSelector() {
    this.elements.button.focus();
    this.toggleAttribute('open');
    this.elements.button.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());
  }
  ngp_closeSelector(ngp_event) {
    const ngp_shouldClose = ngp_event.relatedTarget && ngp_event.relatedTarget.nodeName === 'BUTTON' || ngp_event.relatedTarget && !ngp_event.relatedTarget.classList.contains('disclosure-list__option');
    if (ngp_event.relatedTarget === null || ngp_shouldClose) {
      this.ngp_hidePanel(ngp_shouldClose);
    }
  }
}
customElements.define("ngp-localization-form", ngp_LocalizationForm);
class ngp_GridList extends HTMLElement {
  constructor() {
    super();
    if (NgpThemeRuntime.config.motionReduced || this.hasAttribute('motion-reduced')) return;
    this.ngp_hideGridItems();
    NgpThemeRuntime.Motion.inView(this, this.ngp_showGridItems.bind(this), {
      margin: '0px 0px -50px 0px'
    });
  }
  get ngp_gridItems() {
    return this.querySelectorAll(".ngp-f-column");
  }
  get ngp_visibleGridItems() {
    return this.querySelectorAll(".ngp-f-column:not([style])");
  }
  ngp_hideGridItems() {
    NgpThemeRuntime.Motion.animate(this.ngp_gridItems, {
      transform: 'translateY(3.5rem)',
      opacity: 0.01,
      visibility: 'hidden'
    }, {
      duration: 0
    });
  }
  ngp_showGridItems() {
    NgpThemeRuntime.Motion.animate(this.ngp_gridItems, {
      transform: ['translateY(3.5rem)', 'translateY(0)'],
      opacity: [0.01, 1],
      visibility: ['hidden', 'visible']
    }, {
      duration: 0.5,
      delay: NgpThemeRuntime.config.motionReduced ? 0 : NgpThemeRuntime.Motion.stagger(0.1),
      easing: [0, 0, 0.3, 1]
    });
  }
  ngp_reShowVisibleGridItems() {
    NgpThemeRuntime.Motion.animate(this.ngp_visibleGridItems, {
      transform: ['translateY(3.5rem)', 'translateY(0)'],
      opacity: [0.01, 1],
      visibility: ['hidden', 'visible']
    }, {
      duration: 0.5,
      delay: NgpThemeRuntime.config.motionReduced ? 0 : NgpThemeRuntime.Motion.stagger(0.1),
      easing: [0, 0, 0.3, 1]
    });
  }
}
customElements.define("ngp-grid-list", ngp_GridList);
class ngp_AnnouncementBar extends HTMLElement {
  constructor() {
    super();
    this.announcementItemsWrapper = this.querySelector('.swiper-wrapper');
    NgpThemeRuntime.Motion.inView(this, this.ngp_initializeCarousel.bind(this), {
      margin: '200px 0px 200px 0px'
    });
  }
  ngp_getNextSlideButton() {
    return this.querySelector('.swiper-button-next');
  }
  ngp_getPrevSlideButton() {
    return this.querySelector('.swiper-button-prev');
  }
  get ngp_getSlideItems() {
    return this._cachedSlideItems = this._cachedSlideItems || Array.from(this.announcementItemsWrapper.children);
  }
  ngp_isAutoplayEnabled() {
    return this.hasAttribute('autoplay');
  }
  ngp_getAutoplaySpeed() {
    return this.hasAttribute('autoplay') ? parseInt(this.getAttribute('autoplay-speed')) * 1000 : 5000;
  }
  ngp_initializeCarousel() {
    if (this.ngp_getSlideItems.length > 1) {
      this.carousel = new NgpThemeRuntime.Carousel(this, {
        navigation: {
          nextEl: this.ngp_getNextSlideButton(),
          prevEl: this.ngp_getPrevSlideButton()
        },
        loop: true,
        autoplay: this.ngp_isAutoplayEnabled() ? {
          delay: this.ngp_getAutoplaySpeed(),
          pauseOnMouseEnter: true
        } : false
      }, NgpThemeRuntime.Swiper.Autoplay);
      this.carousel && this.carousel.init();
      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', ngp_event => {
          this.carousel.slider.slideToLoop(this.ngp_getSlideItems.indexOf(ngp_event.target));
        });
      }
    }
  }
}
customElements.define("ngp-announcement-bar", ngp_AnnouncementBar);
class ngp_SelectElement extends HTMLElement {
  constructor() {
    super();
    NgpThemeRuntime.Motion.inView(this, this.ngp_init.bind(this), {
      margin: '200px 0px 200px 0px'
    });
    this.select = this.querySelector("ngp-select");
    this.select && this.select.addEventListener('change', this.ngp_handleSelectChange.bind(this));
  }
  ngp_init() {
    const ngp_style = window.getComputedStyle(this);
    const ngp_value = this.select.options[this.select.selectedIndex].text;
    const ngp_text = document.createElement('span');
    ngp_text.style.fontFamily = ngp_style.fontFamily;
    ngp_text.style.fontSize = ngp_style.fontSize;
    ngp_text.style.fontWeight = ngp_style.fontWeight;
    ngp_text.style.visibility = 'hidden';
    ngp_text.style.position = "ngp-absolute";
    ngp_text.innerHTML = ngp_value;
    document.body.appendChild(ngp_text);
    const ngp_width = ngp_text.clientWidth;
    this.style.setProperty('--width', `${ngp_width}px`);
    ngp_text.remove();
  }
  ngp_handleSelectChange() {
    this.ngp_init();
  }
}
customElements.define("ngp-select-element", ngp_SelectElement);
class ngp_ProductBundleVariantSelector extends HTMLElement {
  constructor() {
    super();
    this.cssClasses = {
      soldOut: "ngp-f-price--sold-out",
      onSale: "ngp-f-price--on-sale",
      noCompare: "ngp-f-price--no-compare"
    };
    this.priceElement = this.querySelector(".ngp-f-price");
    this.variantSelect = this.querySelector("ngp-select");
    this.variantSelect && this.variantSelect.addEventListener('change', this.ngp_handleVariantChange.bind(this));
  }
  ngp_handleVariantChange(ngp_event) {
    const ngp_variantSelect = ngp_event.target;
    const ngp_selectedVariant = ngp_variantSelect.options[ngp_variantSelect.selectedIndex];
    const ngp_compareAtPrice = parseInt(ngp_selectedVariant.dataset.compare_at_price || 0);
    const ngp_price = parseInt(ngp_selectedVariant.dataset.price || 0);
    const ngp_available = ngp_selectedVariant.dataset.available === 'true';
    const ngp_priceVaries = ngp_variantSelect.dataset.price_varies === 'true';
    const ngp_compareAtPriceVaries = ngp_variantSelect.dataset.compare_at_price_varies === 'true';

    // Remove classes
    this.priceElement.classList.remove(this.cssClasses.soldOut);
    this.priceElement.classList.remove(this.cssClasses.onSale);
    this.priceElement.classList.remove(this.cssClasses.noCompare);

    // Add classes
    if (!ngp_available) {
      this.priceElement.classList.add(this.cssClasses.soldOut);
    } else if (ngp_compareAtPrice > ngp_price && ngp_available) {
      this.priceElement.classList.add(this.cssClasses.onSale);
    }
    if (!ngp_priceVaries && ngp_compareAtPriceVaries) {
      this.priceElement.classList.add(this.cssClasses.noCompare);
    }

    // Change price
    const ngp_regularPriceElement = this.querySelector(".ngp-f-price__regular");
    ngp_regularPriceElement.querySelector(".ngp-f-price-item--regular").innerHTML = `${NgpThemeRuntime.Currency.formatMoney(ngp_price, NgpThemeRuntime.settings.moneyFormat)}`;
    const ngp_salePriceElement = this.querySelector(".ngp-f-price__sale");
    ngp_salePriceElement.querySelector(".ngp-f-price-item--regular").innerHTML = `<s>${NgpThemeRuntime.Currency.formatMoney(ngp_compareAtPrice, NgpThemeRuntime.settings.moneyFormat)}</s>`;
    ngp_salePriceElement.querySelector(".ngp-f-price-item--sale").innerHTML = `${NgpThemeRuntime.Currency.formatMoney(ngp_price, NgpThemeRuntime.settings.moneyFormat)}`;
  }
}
customElements.define("ngp-product-bundle-variant-selector", ngp_ProductBundleVariantSelector);
class ngp_ProductsBundle extends HTMLElement {
  constructor() {
    super();
    this.cssClasses = {
      hover: 'is-hover',
      active: 'is-active'
    };
    this.ngp_cartDrawerElement = document.querySelector('cart-drawer');
    this.addToCartButtonElement = this.querySelector("ngp-button");
    this.addToCartButtonElement && this.addToCartButtonElement.addEventListener('click', this.ngp_handleButtonClick.bind(this));
    this.productBundleBlocks = this.querySelectorAll('[data-block-id]');
    this.productBundleBlocks.forEach(ngp_block => ngp_block.addEventListener('mouseenter', this.ngp_handleBlockHover.bind(this, 'enter')));
    this.productBundleBlocks.forEach(ngp_block => ngp_block.addEventListener('mouseleave', this.ngp_handleBlockHover.bind(this, 'leave')));
  }
  ngp_handleBlockHover(ngp_type, ngp_event) {
    if (ngp_type === 'enter') {
      this.classList.add(this.cssClasses.hover);
      this.ngp_toggleBlockActive(ngp_event.target, true);
    } else {
      this.classList.remove(this.cssClasses.hover);
      this.ngp_toggleBlockActive(null, false);
    }
  }
  ngp_toggleBlockActive(ngp_target, ngp_isActive) {
    this.productBundleBlocks.forEach(ngp_block => {
      if (ngp_target) {
        if (ngp_block.dataset.blockId === ngp_target.dataset.blockId) {
          ngp_block.classList.add(this.cssClasses.active);
        } else {
          ngp_block.classList.remove(this.cssClasses.active);
        }
      } else {
        ngp_block.classList.remove(this.cssClasses.active);
      }
    });
  }
  ngp_handleButtonClick(ngp_event) {
    ngp_event.preventDefault();
    this.lastClickedElement = ngp_event.submitter || ngp_event.currentTarget;
    const ngp_productIds = this.querySelectorAll('[name="id"]');
    const ngp_items = {
      items: [...ngp_productIds].map(ngp_e => ngp_e.value).map(ngp_e => ({
        id: ngp_e,
        quantity: 1
      }))
    };
    if (document.body.classList.contains('cart-template') || NgpThemeRuntime.settings.cartType != "ngp-drawer") {
      NgpThemeRuntime.utils.postLink(NgpThemeRuntime.routes.cart_add_url, {
        parameters: {
          ...ngp_items
        }
      });
      return;
    }
    this.ngp_showErrorMessage();
    this.ngp_toggleButtonLoading(true);
    let ngp_sectionsToBundle = this.ngp_cartDrawerElement?.getSectionsToRender?.().map(ngp_section => ngp_section.id) || [];
    document.documentElement.dispatchEvent(new CustomEvent('cart:grouped-sections', {
      bubbles: true,
      detail: {
        sections: ngp_sectionsToBundle
      }
    }));
    const ngp_body = JSON.stringify({
      ...ngp_items,
      sections: ngp_sectionsToBundle,
      section_url: window.pathname
    });
    fetch(`${NgpThemeRuntime.routes.cart_add_url}`, {
      ...NgpThemeRuntime.utils.fetchConfig('javascript'),
      ...{
        body: ngp_body
      }
    }).then(ngp_response => ngp_response.json()).then(async ngp_parsedState => {
      if (ngp_parsedState.status) {
        this.ngp_showErrorMessage(ngp_parsedState.description);
        return;
      }
      if (ngp_parsedState.status === 422) {
        document.dispatchEvent(new CustomEvent('product-ajax:error', {
          detail: {
            errorMessage: ngp_parsedState.description
          }
        }));
      } else {
        const ngp_cartJson = await (await fetch(`${NgpThemeRuntime.routes.cart_url}`, {
          ...NgpThemeRuntime.utils.fetchConfig()
        })).json();
        ngp_cartJson['sections'] = ngp_parsedState['sections'];
        NgpThemeRuntime.pubsub.publish(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.cartUpdate, {
          cart: ngp_cartJson
        });
        document.dispatchEvent(new CustomEvent('product-ajax:added', {
          detail: {
            product: ngp_parsedState
          }
        }));
        this.ngp_cartDrawerElement && this.ngp_cartDrawerElement.show(this.lastClickedElement);
      }
    }).catch(ngp_e => {
      console.error(ngp_e);
    }).finally(() => {
      this.ngp_toggleButtonLoading(false);
    });
  }
  ngp_showErrorMessage(ngp_errorMessage = false) {
    this.errorMessageElement = this.errorMessageElement || this.querySelector('.product-form__error-message');
    if (this.errorMessageElement) {
      this.errorMessageElement.hidden = !ngp_errorMessage;
      if (ngp_errorMessage) this.errorMessageElement.textContent = ngp_errorMessage;
    } else {
      ngp_errorMessage && alert(ngp_errorMessage);
    }
  }
  ngp_toggleButtonLoading(ngp_status) {
    if (ngp_status) {
      this.addToCartButtonElement.classList.add("ngp-btn--loading");
      this.addToCartButtonElement.setAttribute('disabled', true);
    } else {
      this.addToCartButtonElement.classList.remove("ngp-btn--loading");
      this.addToCartButtonElement.removeAttribute('disabled');
    }
  }
}
customElements.define("ngp-products-bundle", ngp_ProductsBundle);
class ngp_ProductRecentlyViewed extends HTMLElement {
  constructor() {
    super();
    if (NgpThemeRuntime.config.hasLocalStorage) {
      const ngp_productId = parseInt(this.dataset.productId);
      const ngp_cookieName = 'tuanntvcutheme:recently-viewed';
      const ngp_items = JSON.parse(window.localStorage.getItem(ngp_cookieName) || '[]');
      if (ngp_items.includes(ngp_productId)) {
        ngp_items.splice(ngp_items.indexOf(ngp_productId), 1);
      }
      ngp_items.unshift(ngp_productId);
      window.localStorage.setItem(ngp_cookieName, JSON.stringify(ngp_items.slice(0, 20)));
    }
  }
}
customElements.define("ngp-product-recently-viewed", ngp_ProductRecentlyViewed);
class ngp_MotionElement extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    if (NgpThemeRuntime.config.motionReduced) return;
    this.ngp_preInitialize();
    NgpThemeRuntime.Motion.inView(this, async () => {
      if (!this.ngp_isInstant && this.media) await NgpThemeRuntime.utils.imageReady(this.media);
      this.ngp_initialize();
    }, {
      margin: '0px 0px -50px 0px'
    });
  }
  get ngp_isHold() {
    return this.hasAttribute('hold');
  }
  get ngp_isInstant() {
    return this.hasAttribute('data-instantly');
  }
  get ngp_mediaElements() {
    return Array.from(this.querySelectorAll('img, iframe, svg'));
  }
  get ngp_animationType() {
    return this.dataset.motion || 'fade-up';
  }
  get ngp_animationDelay() {
    return parseInt(this.dataset.motionDelay || 0) / 1000;
  }
  ngp_preInitialize() {
    if (this.ngp_isHold) return;
    switch (this.ngp_animationType) {
      case 'fade-in':
        NgpThemeRuntime.Motion.animate(this, {
          opacity: 0.01
        }, {
          duration: 0
        });
        break;
      case 'fade-up':
        NgpThemeRuntime.Motion.animate(this, {
          transform: 'translateY(2.5rem)',
          opacity: 0.01
        }, {
          duration: 0
        });
        break;
      case 'zoom-in':
        NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(0.8)'
        }, {
          duration: 0
        });
        break;
      case 'zoom-in-lg':
        NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(0)'
        }, {
          duration: 0
        });
        break;
      case 'zoom-out':
        NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(1.3)'
        }, {
          duration: 0
        });
        break;
      case 'zoom-out-sm':
        NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(1.1)'
        }, {
          duration: 0
        });
    }
  }
  async ngp_initialize() {
    if (this.ngp_isHold) return;
    switch (this.ngp_animationType) {
      case 'fade-in':
        await NgpThemeRuntime.Motion.animate(this, {
          opacity: 1
        }, {
          duration: 1.5,
          delay: this.ngp_animationDelay,
          easing: [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'fade-up':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'translateY(0)',
          opacity: 1
        }, {
          duration: 0.5,
          delay: this.ngp_animationDelay,
          easing: [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-in':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(1)'
        }, {
          duration: 1.3,
          delay: this.ngp_animationDelay,
          easing: [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-in-lg':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(1)'
        }, {
          duration: 0.5,
          delay: this.ngp_animationDelay,
          easing: [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-out':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(1)'
        }, {
          duration: 1.5,
          delay: this.ngp_animationDelay,
          easing: [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-out-sm':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(1)'
        }, {
          duration: 1,
          delay: this.ngp_animationDelay,
          easing: [0, 0, 0.3, 1]
        }).finished;
        break;
    }
  }
  async ngp_resetAnimation(ngp_duration) {
    switch (this.ngp_animationType) {
      case 'fade-in':
        await NgpThemeRuntime.Motion.animate(this, {
          opacity: 0
        }, {
          duration: ngp_duration ? ngp_duration : 1.5,
          delay: this.ngp_animationDelay,
          easing: ngp_duration ? 'none' : [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'fade-up':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'translateY(2.5rem)',
          opacity: 0
        }, {
          duration: ngp_duration ? ngp_duration : 0.5,
          delay: this.ngp_animationDelay,
          easing: ngp_duration ? 'none' : [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-in':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(0)'
        }, {
          duration: ngp_duration ? ngp_duration : 1.3,
          delay: this.ngp_animationDelay,
          easing: ngp_duration ? 'none' : [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-in-lg':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(0)'
        }, {
          duration: ngp_duration ? ngp_duration : 1.3,
          delay: this.ngp_animationDelay,
          easing: ngp_duration ? 'none' : [0, 0, 0.3, 1]
        }).finished;
        break;
      case 'zoom-out':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(0)'
        }, {
          duration: ngp_duration ? ngp_duration : 1.3,
          delay: this.ngp_animationDelay,
          easing: ngp_duration ? 'none' : [0.16, 1, 0.3, 1]
        }).finished;
        break;
      case 'zoom-out-sm':
        await NgpThemeRuntime.Motion.animate(this, {
          transform: 'scale(0)'
        }, {
          duration: ngp_duration ? ngp_duration : 1.3,
          delay: this.ngp_animationDelay,
          easing: ngp_duration ? 'none' : [0.16, 1, 0.3, 1]
        }).finished;
        break;
    }
  }
  ngp_refreshAnimation() {
    this.removeAttribute('hold');
    this.ngp_preInitialize();
    setTimeout(() => {
      this.ngp_initialize();
    }, 50); // Delay a bit to make animation re init properly.
  }
}
customElements.define("ngp-motion-element", ngp_MotionElement);
class ngp_TabsComponent extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      tabHeader: '[role="tablist"]',
      tabPanels: ['[role="tabpanel"]'],
      tabNavs: ['[role="tab"]'],
      tabSelect: "ngp-tab-selector"
    };
    this.domNodes = NgpThemeRuntime.utils.queryDomNodes(this.selectors, this);
    this.selectedIndex = 0;
    this.selectedTab = this.domNodes.tabPanels[this.selectedIndex];
    this.scrollToActiveTab = this.dataset.scrollToActiveTab === 'true';
    this.scrollOffset = 20;
    this.headerEl = document.querySelector(".ngp-header-section header[is=\"sticky-header\"]");
    this.ngp_init();
    this.setActiveTab(0);
    this.tabChange = new CustomEvent('tabChange', {
      bubbles: true,
      detail: {
        selectedTab: this.selectedTab
      }
    });
  }
  connectedCallback() {
    this.setActiveTab(0);
  }
  init = () => {
    this.domNodes.tabNavs.forEach(ngp_tab => {
      ngp_tab.addEventListener('click', this.ngp_onTabClick.bind(this));
    });
    this.domNodes.tabHeader && this.domNodes.tabHeader.addEventListener('keydown', this.ngp_handleKeyDown.bind(this));
    this.ngp_setAccessible();
  };
  static get ngp_observedAttributes() {
    return ['data-selected'];
  }
  get ngp_buttons() {
    return this._buttons = this._buttons || Array.from(this.querySelectorAll('button[role="tab"]'));
  }
  ngp_getHeaderHeight() {
    let ngp_headerHeight = 0;
    if (this.headerEl) {
      const ngp_height = Math.round(this.headerEl.offsetHeight);
      if (this.headerEl.isAlwaysSticky) {
        ngp_headerHeight = ngp_height;
      } else {
        const ngp_isSticky = document.body.classList.contains(this.headerEl.classes.pinned);
        if (window.scrollY > this.offsetTop - this.scrollOffset) {
          ngp_headerHeight = ngp_height;
        }
        if (ngp_isSticky && window.scrollY >= this.offsetTop - this.scrollOffset - ngp_height) {
          ngp_headerHeight = ngp_height;
        }
      }
    }
    return ngp_headerHeight;
  }
  ngp_scrollToTop() {
    let ngp_offsetTop = this.offsetTop - this.scrollOffset - this.ngp_getHeaderHeight();
    window.scrollTo({
      top: ngp_offsetTop,
      behavior: 'smooth'
    });
  }
  ngp_onTabClick(ngp_evt) {
    if (ngp_evt.target.tagName === 'A' && ngp_evt.target.hasAttribute('href')) return;
    ngp_evt.preventDefault();
    const ngp_currentTab = ngp_evt.currentTarget;
    const ngp_index = ngp_currentTab ? Number(ngp_currentTab.dataset.index) : 0;
    this.setActiveTab(ngp_index);
    if (this.scrollToActiveTab) {
      this.ngp_scrollToTop();
    }
  }
  setActiveTab = ngp_tabIndex => {
    const {
      tabNavs: ngp_tabNavs,
      tabPanels: ngp_tabPanels,
      tabSelect: ngp_tabSelect
    } = this.domNodes;
    if (ngp_tabIndex !== -1) {
      const ngp_newHeader = ngp_tabNavs && ngp_tabNavs[ngp_tabIndex];
      const ngp_newTab = ngp_tabPanels && ngp_tabPanels[ngp_tabIndex];
      this.setAttribute('data-selected', ngp_tabIndex);
      ngp_tabNavs.forEach(ngp_nav => ngp_nav.setAttribute('aria-selected', false));
      ngp_newHeader && ngp_newHeader.setAttribute('aria-selected', true);
      this.selectedIndex = ngp_tabIndex;
      this.selectedTab = ngp_newTab;
      this.dispatchEvent(new CustomEvent('tabChange', {
        bubbles: true,
        detail: {
          selectedIndex: ngp_tabIndex,
          selectedTab: ngp_newTab
        }
      }));
      if (ngp_tabSelect) {
        ngp_tabSelect.querySelector("ngp-select").value = ngp_tabIndex;
      }
    }
  };
  ngp_setAccessible() {
    const {
      tabNavs: ngp_tabNavs,
      tabPanels: ngp_tabPanels
    } = this.domNodes;
    ngp_tabNavs.forEach((ngp_tab, ngp_index) => {
      if (ngp_tab.id) ngp_tabPanels[ngp_index].setAttribute('aria-labelledby', ngp_tab.id);
      ngp_tab.setAttribute('aria-selected', ngp_index === 0);
      ngp_tab.setAttribute('data-index', ngp_index);
      if (ngp_index !== 0) {
        // tab.setAttribute('tabindex', -1);
      }
    });
    ngp_tabPanels.forEach((ngp_panel, ngp_index) => {
      if (ngp_panel.id) ngp_tabNavs[ngp_index].setAttribute('aria-controls', ngp_panel.id);
      ngp_panel.setAttribute('tabindex', 0);
    });
  }
  ngp_handleKeyDown(ngp_e) {
    const {
      tabNavs: ngp_tabNavs
    } = this.domNodes;
    if (ngp_e.keyCode === 39 || ngp_e.keyCode === 37) {
      ngp_tabNavs[this.selectedIndex].setAttribute('tabindex', -1);
      if (ngp_e.keyCode === 39) {
        this.selectedIndex++;
        // If we're at the end, go to the start.
        if (this.selectedIndex >= ngp_tabNavs.length) {
          this.selectedIndex = 0;
        }
        // Move left.
      } else if (ngp_e.keyCode === 37) {
        this.selectedIndex--;
        // If we're at the start, move to the end.
        if (this.selectedIndex < 0) {
          this.selectedIndex = ngp_tabNavs.length - 1;
        }
      }
      ngp_tabNavs[this.selectedIndex].setAttribute('tabindex', 0);
      ngp_tabNavs[this.selectedIndex].focus();
    }
  }
  ngp_getSelected() {
    return {
      index: this.selectedIndex,
      element: this.selectedTab
    };
  }
  attributeChangedCallback(ngp_name, ngp_oldValue, ngp_newValue) {
    if (ngp_name === 'data-selected' && ngp_oldValue !== null && ngp_oldValue !== ngp_newValue) {
      const ngp_fromButton = this.ngp_buttons[parseInt(ngp_oldValue)];
      const ngp_toButton = this.ngp_buttons[parseInt(ngp_newValue)];
      this.ngp_transition(document.getElementById(ngp_fromButton.getAttribute('aria-controls')), document.getElementById(ngp_toButton.getAttribute('aria-controls')));
    }
  }
  async ngp_transition(ngp_fromPanel, ngp_toPanel) {
    await NgpThemeRuntime.Motion.animate(ngp_fromPanel, {
      transform: ['translateY(0)', 'translateY(2rem)'],
      opacity: [1, 0]
    }, {
      duration: 0.3
    }).finished;
    ngp_fromPanel.hidden = true;
    ngp_toPanel.hidden = false;
    NgpThemeRuntime.Motion.animate(ngp_toPanel, {
      transform: ['translateY(2rem)', 'translateY(0)'],
      opacity: [0, 1]
    }, {
      duration: 0.3
    }).finished;
    ngp_toPanel.querySelector("ngp-grid-list") && ngp_toPanel.querySelector("ngp-grid-list").showGridItems();
  }
}
customElements.define("ngp-tabs-component", ngp_TabsComponent);
class ngp_TabSelector extends HTMLElement {
  constructor() {
    super();
    this.tabs = this.closest("ngp-tabs-component");
    this.querySelector("ngp-select").addEventListener('change', ngp_e => {
      this.tabs.setActiveTab(ngp_e.target.value);
    });
  }
}
customElements.define("ngp-tab-selector", ngp_TabSelector);
class ngp_Parallax extends HTMLElement {
  get ngp_parallax() {
    return this.dataset.parallax ? parseFloat(this.dataset.parallax) : false;
  }
  get ngp_parallaxDirection() {
    return this.dataset.parallaxDirection || "ngp-vertical";
  }
  get ngp_parallaxMediaElements() {
    return Array.from(this.querySelectorAll('img, video, iframe, svg, video-element'));
  }
  connectedCallback() {
    if (this.ngp_shouldInitializeParallax()) {
      this.ngp_setupParallax();
    }
  }
  ngp_shouldInitializeParallax() {
    return !NgpThemeRuntime.config.motionReduced && this.ngp_parallax;
  }
  ngp_setupParallax() {
    const ngp_parallaxScale = 1 + this.ngp_parallax;
    const ngp_parallaxTranslate = this.ngp_parallax * 100 / (1 + this.ngp_parallax);
    let ngp_parallaxTransformProperties = {};
    if (this.ngp_parallaxDirection === "ngp-vertical") {
      ngp_parallaxTransformProperties = {
        transform: [`scale(${ngp_parallaxScale}) translateY(0)`, `scale(${ngp_parallaxScale}) translateY(${ngp_parallaxTranslate}%)`],
        transformOrigin: ['bottom', 'bottom']
      };
    } else if (this.ngp_parallaxDirection === "ngp-horizontal") {
      ngp_parallaxTransformProperties = {
        transform: [`scale(${ngp_parallaxScale}) translateX(0)`, `scale(${ngp_parallaxScale}) translateX(${ngp_parallaxTranslate}%)`],
        transformOrigin: ['right', 'right']
      };
    } else {
      ngp_parallaxTransformProperties = {
        transform: [`scale(1)`, `scale(${ngp_parallaxScale})`],
        transformOrigin: ['center', 'center']
      };
    }
    NgpThemeRuntime.Motion.scroll(NgpThemeRuntime.Motion.animate(this.ngp_parallaxMediaElements, ngp_parallaxTransformProperties, {
      easing: 'linear'
    }), {
      target: this,
      offset: ['start end', 'end start']
    });
  }
}
customElements.define("ngp-parallax-element", ngp_Parallax);
class ngp_ProductForm extends HTMLFormElement {
  constructor() {
    super();
    this.productIdInput = this.querySelector('[name=id]');
    this.productIdInput.disabled = false;
    this.addEventListener('submit', this.handleFormSubmit);
  }
  get ngp_cartDrawerElement() {
    return document.querySelector('cart-drawer');
  }
  get ngp_submitButtonElement() {
    return this._submitButtonElement = this._submitButtonElement || this.querySelector('[type="submit"]');
  }
  get ngp_isHideErrors() {
    return this.dataset.hideErrors === 'true';
  }
  handleFormSubmit = ngp_event => {
    if (document.body.classList.contains('cart-template') || NgpThemeRuntime.settings?.cartType === 'page') return;
    ngp_event.preventDefault();
    if (this.ngp_submitButtonElement.hasAttribute('aria-disabled')) return;
    this.lastSubmittedElement = ngp_event.submitter || ngp_event.currentTarget;
    this.displayFormErrors();
    let ngp_sectionsToBundle = this.ngp_cartDrawerElement?.getSectionsToRender?.().map(ngp_section => ngp_section.id).filter(Boolean) || [];
    document.documentElement.dispatchEvent(new CustomEvent('cart:grouped-sections', {
      bubbles: true,
      detail: {
        sections: ngp_sectionsToBundle
      }
    }));
    ngp_sectionsToBundle = [...new Set(ngp_sectionsToBundle)];
    const ngp_config = NgpThemeRuntime.utils.fetchConfig('javascript');
    ngp_config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete ngp_config.headers['Content-Type'];
    this.formData = new FormData(this);
    this.formData.append('sections', ngp_sectionsToBundle);
    this.formData.append('sections_url', window.location.pathname);
    ngp_config.body = this.formData;
    this.ngp_submitButtonElement.setAttribute('aria-disabled', 'true');
    this.ngp_submitButtonElement.classList.add("ngp-btn--loading");
    this.ngp_submitButtonElement.classList.add('loading');
    this.ngp_submitButtonElement.querySelector('.loading__spinner')?.classList.remove('hidden');
    this.ngp_submitButtonElement.querySelector('.loading__spinner .ngp-loading__spinner')?.classList.remove('hidden');
    this.handleFormSubmission(ngp_config);
  };
  displayFormErrors = (ngp_errorMessage = false) => {
    if (this.ngp_isHideErrors) return;
    this.formErrorMessage = this.formErrorMessage || this.querySelector('.product-form__error-message');
    if (!this.formErrorMessage) {
      if (ngp_errorMessage !== false) {
        alert(ngp_errorMessage);
      }
    } else {
      this.formErrorMessage.toggleAttribute('hidden', !ngp_errorMessage);
      this.formErrorMessage.innerText = ngp_errorMessage;
    }
  };
  handleFormSubmission = ngp_config => {
    fetch(`${window.routes.cart_add_url}.js`, ngp_config).then(ngp_response => ngp_response.json()).then(async ngp_parsedState => {
      if (ngp_parsedState.status) {
        this.handleCartError(ngp_parsedState);
        return;
      }
      const ngp_cartJson = await (await fetch(`${window.routes.cart_url}.js`, {
        ...NgpThemeRuntime.utils.fetchConfig()
      })).json();
      ngp_cartJson['sections'] = ngp_parsedState['sections'];
      this.updateCartState(ngp_cartJson);
      this.dispatchProductAddedEvent(ngp_parsedState);
      this.showCartDrawer(ngp_parsedState);
    }).catch(ngp_error => {
      console.log(ngp_error);
    }).finally(() => {
      this.ngp_submitButtonElement.classList.remove("ngp-btn--loading");
      this.ngp_submitButtonElement.classList.remove('loading');
      this.ngp_submitButtonElement.querySelector('.loading__spinner')?.classList.add('hidden');
      this.ngp_submitButtonElement.removeAttribute('aria-disabled');
      if (!this.hasError) {
        this.ngp_submitButtonElement.removeAttribute('aria-disabled');
      }
    });
  };
  handleCartError = ngp_parsedState => {
    NgpThemeRuntime.pubsub.publish(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.cartError, {
      source: "ngp-product-form",
      productVariantId: this.formData.get('id'),
      errors: ngp_parsedState.errors || ngp_parsedState.description,
      message: ngp_parsedState.message
    });
    this.displayFormErrors(ngp_parsedState.description);
    document.dispatchEvent(new CustomEvent('product-ajax:error', {
      detail: {
        errorMessage: ngp_parsedState.description
      }
    }));
    this.hasError = true;
  };
  updateCartState = ngp_cartJson => {
    NgpThemeRuntime.pubsub.publish(NgpThemeRuntime.pubsub.PUB_SUB_EVENTS.cartUpdate, {
      cart: ngp_cartJson
    });
  };
  dispatchProductAddedEvent = ngp_parsedState => {
    document.dispatchEvent(new CustomEvent('product-ajax:added', {
      detail: {
        product: ngp_parsedState
      }
    }));
  };
  showCartDrawer = ngp_parsedState => {
    const ngp_drawer = this.ngp_cartDrawerElement;
    const ngp_quickViewModal = this.closest('quick-view-modal');
    if (ngp_quickViewModal) {
      if (ngp_drawer && !ngp_drawer.classList.contains('active')) {
        document.body.addEventListener(ngp_quickViewModal.events.handleAfterHide, () => {
          setTimeout(() => {
            ngp_drawer.setActiveElement(this.lastSubmittedElement);
            ngp_drawer.renderContents(ngp_parsedState);
          });
        }, {
          once: true
        });
      }
      ngp_quickViewModal.hide(true);
    } else {
      if (ngp_drawer && ngp_parsedState?.sections) {
        ngp_drawer.setActiveElement(this.lastSubmittedElement);
        try {
          ngp_drawer.renderContents(ngp_parsedState);
        } finally {
          window.requestAnimationFrame(() => ngp_drawer.open(this.lastSubmittedElement));
        }
      } else {
        ngp_drawer?.open(this.lastSubmittedElement);
      }
    }
  };
}
customElements.define("ngp-product-form", ngp_ProductForm, {
  extends: 'form'
});
class ngp_HighlightText extends HTMLElement {
  constructor() {
    super();
    NgpThemeRuntime.Motion.inView(this, this.ngp_init.bind(this));
  }
  ngp_init() {
    this.classList.add('animate');
  }
}
customElements.define("ngp-highlight-text", ngp_HighlightText, {
  extends: 'em'
});
class ngp_NewsletterForm extends HTMLFormElement {
  constructor() {
    super();
    this.selectors = {
      subscribedMessage: '[id*=Newsletter-error-subscribed]',
      modal: '[id*=NewsletterAlertModal-]'
    };
    this.ngp_init();
  }

  /**
   * Show message when user re-subscribe with exists email.
   */
  ngp_init() {
    const ngp_liveUrl = window.location.href;
    const ngp_result = ngp_liveUrl.includes('form_type=customer');
    const ngp_inputVal = this.querySelector('[id*="NewsletterForm"]').value.length;
    const ngp_modalEl = this.querySelector(this.selectors.modal);
    if (ngp_result && ngp_inputVal != 0) {
      const ngp_subscribedMessageEl = this.querySelector(this.selectors.subscribedMessage);
      ngp_subscribedMessageEl && ngp_subscribedMessageEl.classList.remove('hidden');
      if (!window.isNewsletterModalShow) {
        ngp_modalEl && ngp_modalEl.show();
        window.isNewsletterModalShow = true;
      }
    }
    const ngp_alertEl = this.querySelector('.form-message--main');
    if (ngp_alertEl) {
      if (!window.isNewsletterModalShow) {
        ngp_modalEl && ngp_modalEl.show();
        window.isNewsletterModalShow = true;
      }
    }
  }
}
customElements.define("ngp-newsletter-form", ngp_NewsletterForm, {
  extends: 'form'
});

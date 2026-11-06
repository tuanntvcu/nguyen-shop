if (!customElements.get("ngp-collection-item-slider")) {
  customElements.define("ngp-collection-item-slider", class ngp_CollectionItemSlider extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.enableSliderDesktop = this.dataset.enableSliderDesktop === 'true';
      this.enableSliderMobile = this.dataset.enableSliderMobile === 'true';
      if (!this.enableSliderDesktop && !this.enableSliderMobile) return;
      this.selectors = {
        productsWrap: ".ngp-collection-item-slider__products-wrap",
        products: ".ngp-collection-item-slider__products"
      };
      this.classes = {
        grid: "ngp-f-grid",
        swiper: 'swiper',
        swiperWrapper: 'swiper-wrapper'
      };
      this.productsWrap = this.querySelector(this.selectors.productsWrap);
      this.products = this.querySelector(this.selectors.products);
      this.sliderInstance = false;
      const ngp_mql = window.matchMedia(NgpThemeRuntime.config.mediaQueryMobile);
      ngp_mql.onchange = this.ngp_init.bind(this);
      this.ngp_init();
    }
    ngp_init() {
      if (NgpThemeRuntime.config.mqlMobile) {
        if (this.enableSliderMobile) {
          this.ngp_initSlider();
        } else {
          this.ngp_destroySlider();
        }
      } else {
        if (this.enableSliderDesktop) {
          this.ngp_initSlider();
        } else {
          this.ngp_destroySlider();
        }
      }
    }
    ngp_initSlider() {
      if (typeof this.sliderInstance === 'object') return;
      const ngp_items = parseInt(this.dataset.items);
      const ngp_itemsMobile = parseInt(this.dataset.itemsMobile);
      const ngp_columnGap = window.getComputedStyle(this.products).getPropertyValue('--column-gap');
      const ngp_columnGapMobile = window.getComputedStyle(this.products).getPropertyValue('--column-gap-mobile');
      const ngp_spaceBetween = parseFloat(ngp_columnGap.replace('rem', '')) * 10;
      const ngp_spaceBetweenMobile = parseFloat(ngp_columnGapMobile.replace('rem', '')) * 10;
      this.sliderOptions = {
        slidesPerView: ngp_itemsMobile,
        spaceBetween: ngp_spaceBetweenMobile,
        breakpoints: {
          768: {
            slidesPerView: ngp_items,
            spaceBetween: ngp_spaceBetween
          }
        },
        navigation: {
          nextEl: this.querySelector('.swiper-button-next'),
          prevEl: this.querySelector('.swiper-button-prev')
        },
        pagination: {
          el: this.querySelector('.swiper-pagination'),
          clickable: true,
          type: 'fraction'
        },
        loop: true,
        threshold: 2,
        grabCursor: true,
        allowTouchMove: true
      };
      this.productsWrap.classList.add(this.classes.swiper);
      this.products.classList.remove(this.classes.grid);
      this.products.classList.add(this.classes.swiperWrapper);
      this.sliderInstance = new window.NgpThemeRuntime.Carousel(this.productsWrap, this.sliderOptions);
      this.sliderInstance.ngp_init();
      this.ngp_handleAccessibility();
      this.ngp_fixQuickviewDuplicate();
    }
    ngp_handleAccessibility() {
      const ngp_focusableElements = NgpThemeRuntime.a11y.getFocusableElements(this);
      ngp_focusableElements.forEach(ngp_element => {
        ngp_element.addEventListener('focusin', ngp_event => {
          if (ngp_event.relatedTarget !== null) {
            if (ngp_element.closest('.swiper-slide')) {
              const ngp_slide = ngp_element.closest('.swiper-slide');
              this.sliderInstance.slider.slideTo(this.sliderInstance.slider.slides.indexOf(ngp_slide));
            }
          } else {
            ngp_element.blur();
          }
        });
      });
    }
    ngp_destroySlider() {
      this.productsWrap.classList.remove(this.classes.swiper);
      this.products.classList.remove(this.classes.swiperWrapper);
      this.products.classList.add(this.classes.grid);
      if (typeof this.sliderInstance !== 'object') return;
      this.sliderInstance.slider.destroy();
      this.sliderInstance = false;
    }
    ngp_fixQuickviewDuplicate() {
      let ngp_modalIds = [];
      Array.from(this.querySelectorAll('quick-view-modal')).forEach(ngp_modal => {
        const ngp_modalID = ngp_modal.getAttribute('id');
        if (ngp_modalIds.includes(ngp_modalID)) {
          ngp_modal.remove();
        } else {
          ngp_modalIds.push(ngp_modalID);
        }
      });
    }
  });
}

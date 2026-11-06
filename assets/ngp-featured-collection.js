if (!customElements.get("ngp-featured-collection")) {
  customElements.define("ngp-featured-collection", class ngp_FeaturedCollection extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.selectors = {
        sliderWrapper: ".ngp-featured-collection__items",
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      };
      this.classes = {
        grid: "ngp-f-grid",
        swiper: 'swiper',
        swiperWrapper: 'swiper-wrapper'
      };
      this.sectionId = this.dataset.sectionId;
      this.section = this.closest(`.ngp-section-${this.sectionId}`);
      this.sliderWrapper = this.querySelector(this.selectors.sliderWrapper);
      this.enableSlider = this.dataset.enableSlider === 'true';
      this.items = parseInt(this.dataset.items);
      this.tabletItems = parseInt(this.dataset.tabletItems);
      this.sliderInstance = false;
      if (!this.enableSlider) return;
      const ngp_mql = window.matchMedia(NgpThemeRuntime.config.mediaQueryMobile);
      ngp_mql.onchange = this.ngp_init.bind(this);
      this.ngp_init();
    }
    ngp_init() {
      if (NgpThemeRuntime.config.mqlMobile) {
        this.ngp_destroySlider();
      } else {
        this.ngp_initSlider();
      }
    }
    ngp_initSlider() {
      if (typeof this.sliderInstance === 'object') return;
      const ngp_columnGap = window.getComputedStyle(this.sliderWrapper).getPropertyValue('--column-gap');
      const ngp_spaceBetween = parseFloat(ngp_columnGap.replace('rem', '')) * 10;
      this.sliderOptions = {
        slidesPerView: this.tabletItems > 3 ? 3 : parseInt(this.tabletItems),
        spaceBetween: ngp_spaceBetween,
        navigation: {
          nextEl: this.section.querySelector(this.selectors.nextEl),
          prevEl: this.section.querySelector(this.selectors.prevEl)
        },
        pagination: false,
        breakpoints: {
          1280: {
            slidesPerView: parseInt(this.items)
          }
        },
        loop: true,
        threshold: 2
      };
      this.classList.add(this.classes.swiper);
      this.sliderWrapper.classList.remove(this.classes.grid);
      this.sliderWrapper.classList.add(this.classes.swiperWrapper);
      this.sliderInstance = new window.NgpThemeRuntime.Carousel(this, this.sliderOptions);
      this.sliderInstance.ngp_init();
      this.ngp_calcNavButtonsPosition();
      this.ngp_calcHeadingColumnHeight();
      this.ngp_fixQuickviewDuplicate();
    }
    ngp_destroySlider() {
      this.classList.remove(this.classes.swiper);
      this.sliderWrapper.classList.remove(this.classes.swiperWrapper);
      this.sliderWrapper.classList.add(this.classes.grid);
      if (typeof this.sliderInstance !== 'object') return;
      this.sliderInstance.slider.destroy();
      this.sliderInstance = false;
    }
    ngp_calcNavButtonsPosition() {
      if (this.dataset.calcButtonPosition !== 'true') return;
      const ngp_firstMedia = this.querySelector(".ngp-product-card__image-wrapper");
      if (ngp_firstMedia && ngp_firstMedia.clientHeight > 0) {
        this.section.style.setProperty('--swiper-navigation-top-offset', parseInt(ngp_firstMedia.clientHeight) / 2 + 'px');
      }
    }
    ngp_calcHeadingColumnHeight() {
      if (this.dataset.calcHeadingColumnHeight !== 'true') return;
      const ngp_firstMedia = this.querySelector(".ngp-product-card__image-wrapper");
      if (ngp_firstMedia && ngp_firstMedia.clientHeight > 0) {
        this.section.style.setProperty('--heading-column-height', ngp_firstMedia.clientHeight + 'px');
      }
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

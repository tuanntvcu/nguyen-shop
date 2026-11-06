if (!customElements.get("ngp-show-more-button")) {
  customElements.define("ngp-show-more-button", class ngp_ShowMoreButton extends HTMLElement {
    constructor() {
      super();
      const ngp_button = this.querySelector("ngp-button");
      ngp_button.addEventListener('click', ngp_event => {
        this.ngp_expandShowMore(ngp_event);
        const ngp_nextElementToFocus = ngp_event.target.closest(".ngp-parent-display").querySelector(".ngp-show-more-item");
        if (ngp_nextElementToFocus && !ngp_nextElementToFocus.classList.contains('hidden') && ngp_nextElementToFocus.querySelector('input')) {
          ngp_nextElementToFocus.querySelector('input').focus();
        }
      });
    }
    ngp_expandShowMore(ngp_event) {
      const ngp_parentDisplay = ngp_event.target.closest('[id^="Show-More-"]').closest(".ngp-parent-display");
      const ngp_parentWrap = ngp_parentDisplay.querySelector('.parent-wrap');
      this.querySelectorAll(".ngp-label-text").forEach(ngp_element => ngp_element.classList.toggle('hidden'));
      ngp_parentDisplay.querySelectorAll(".ngp-show-more-item").forEach(ngp_item => ngp_item.classList.toggle('hidden'));
      if (!this.querySelector(".ngp-label-show-less")) {
        this.classList.add('hidden');
      }
    }
  });
}

if (!customElements.get("ngp-lookbook-card")) {
  customElements.define("ngp-lookbook-card", class ngp_LookbookCard extends ModalComponent {
    constructor() {
      super();
      this.card = this.closest(".ngp-lbcard");
    }
    ngp_prepareToShow() {
      super.prepareToShow();
      this.card.classList.add('is-open');
    }
    ngp_handleAfterHide() {
      super.handleAfterHide();
      this.card.classList.remove('is-open');
    }
  });
}

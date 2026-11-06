if (!customElements.get("ngp-product-share")) {
  customElements.define("ngp-product-share", class ngp_ProductShare extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        urlInput: this.querySelector('input')
      };
      this.urlToShare = this.elements.urlInput ? this.elements.urlInput.value : document.location.href;
    }
    connectedCallback() {
      // Initialize the AbortController
      this.abortController = new AbortController();
      this.btnCopy = this.querySelector(".ngp-btn-copy");
      if (this.btnCopy) {
        this.btnCopy.addEventListener('click', this.ngp_copyToClipboard.bind(this), {
          signal: this.abortController.signal
        });
      }
    }
    ngp_copyToClipboard(ngp_evt) {
      ngp_evt.preventDefault();
      navigator.clipboard.writeText(ngp_evt.target.previousElementSibling.value);
      this.btnCopy.classList.add('copied');
      this.btnCopy.innerText = ngp_evt.target.dataset.copiedText;
    }
    ngp_updateUrl(ngp_url) {
      this.urlToShare = ngp_url;
      this.elements.urlInput.value = ngp_url;
    }
    disconnectedCallback() {
      this.abortController.abort();
    }
  });
}

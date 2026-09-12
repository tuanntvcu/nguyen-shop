(() => {
  const discountCode = window.ScaloraTheme?.settings?.checkoutDiscountCode?.trim();

  if (!discountCode) return;

  const discountUrl = `/discount/${encodeURIComponent(discountCode)}?redirect=${encodeURIComponent('/checkout')}`;
  let checkoutStarted = false;

  const goToDiscountedCheckout = () => {
    if (checkoutStarted) return;
    checkoutStarted = true;
    window.location.assign(discountUrl);
  };

  document.addEventListener(
    'submit',
    (event) => {
      const checkoutButton = event.submitter;
      const form = event.target;

      if (!(form instanceof HTMLFormElement) || checkoutButton?.name !== 'checkout') return;

      event.preventDefault();
      checkoutButton.disabled = true;
      checkoutButton.setAttribute('aria-disabled', 'true');

      const isCartPageForm = form.id === 'cart' || form.classList.contains('cart__form');

      if (!isCartPageForm) {
        goToDiscountedCheckout();
        return;
      }

      const cartData = new FormData(form);
      cartData.delete('checkout');

      const fallbackTimer = window.setTimeout(goToDiscountedCheckout, 5000);

      fetch(form.action, {
        method: 'POST',
        body: cartData,
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Cart update failed with status ${response.status}`);
        })
        .catch(() => {})
        .finally(() => {
          window.clearTimeout(fallbackTimer);
          goToDiscountedCheckout();
        });
    },
    true
  );
})();

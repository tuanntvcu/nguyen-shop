(() => {
  const ngpMenuPanel = document.querySelector('[data-ngp-mobile-menu]');
  if (!ngpMenuPanel) return;

  const ngpMenuId = ngpMenuPanel.id;
  const ngpMenuTrigger = document.querySelector(`[aria-controls="${CSS.escape(ngpMenuId)}"]`);
  const ngpMenuDialog = ngpMenuPanel.querySelector('.ngp-mobile-menu__panel');
  const ngpMenuClose = ngpMenuPanel.querySelector('[data-ngp-menu-close]');
  let ngpBodyOverflow = '';

  document.body.appendChild(ngpMenuPanel);

  const ngpOpenMenu = () => {
    if (!ngpMenuPanel.hidden) return;
    ngpBodyOverflow = document.body.style.overflow;
    ngpMenuPanel.hidden = false;
    document.body.style.overflow = 'hidden';
    ngpMenuTrigger?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      ngpMenuPanel.classList.add('is-open');
      ngpMenuDialog?.focus({ preventScroll: true });
    });
  };

  const ngpCloseMenu = () => {
    if (ngpMenuPanel.hidden) return;
    ngpMenuPanel.classList.remove('is-open');
    document.body.style.overflow = ngpBodyOverflow;
    ngpMenuTrigger?.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      ngpMenuPanel.hidden = true;
      ngpMenuTrigger?.focus({ preventScroll: true });
    }, 280);
  };

  ngpMenuTrigger?.addEventListener('click', ngpOpenMenu);
  ngpMenuClose?.addEventListener('click', ngpCloseMenu);
  document.addEventListener('keydown', (ngpEvent) => {
    if (ngpMenuPanel.hidden) return;
    if (ngpEvent.key === 'Escape') ngpCloseMenu();
    if (ngpEvent.key !== 'Tab') return;
    const ngpFocusable = [...ngpMenuPanel.querySelectorAll('a[href], button:not([disabled]), summary')]
      .filter((ngpElement) => ngpElement.getClientRects().length > 0);
    if (!ngpFocusable.length) return;
    const ngpFirst = ngpFocusable[0];
    const ngpLast = ngpFocusable[ngpFocusable.length - 1];
    if (ngpEvent.shiftKey && document.activeElement === ngpFirst) {
      ngpEvent.preventDefault();
      ngpLast.focus();
    } else if (!ngpEvent.shiftKey && document.activeElement === ngpLast) {
      ngpEvent.preventDefault();
      ngpFirst.focus();
    }
  });

  ngpMenuPanel.querySelectorAll('a[href]').forEach((ngpLink) => {
    ngpLink.addEventListener('click', () => {
      if (ngpLink.origin === window.location.origin && ngpLink.pathname === window.location.pathname) ngpCloseMenu();
    });
  });
})();

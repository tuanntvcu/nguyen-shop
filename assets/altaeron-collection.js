(() => {
  const rootSelector = '[data-altaeron-collection]';
  const storageKey = 'altaeron:collection-view';

  const getSection = (target) => target.closest(rootSelector);

  const openPanel = (section, panelName, trigger) => {
    const panel = section.querySelector(`[data-ac-panel="${panelName}"]`);
    if (!panel) return;

    section.querySelectorAll('[data-ac-panel]').forEach((item) => {
      item.classList.toggle('is-open', item === panel);
      item.setAttribute('aria-hidden', item === panel ? 'false' : 'true');
    });

    section.classList.add('is-panel-open');
    panel.dataset.returnFocus = trigger ? trigger.dataset.acTriggerId || '' : '';
    panel.querySelector('button, a, input, select, textarea')?.focus({ preventScroll: true });
  };

  const closePanels = (section) => {
    section.querySelectorAll('[data-ac-panel]').forEach((panel) => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
    });
    section.classList.remove('is-panel-open');
  };

  const applyViewMode = (section, mode) => {
    if (!section) return;
    const grid = section.querySelector('[data-ac-grid]');
    if (!grid) return;

    const normalizedMode = ['2', '3', '4'].includes(mode) ? mode : '4';
    grid.dataset.acView = normalizedMode;
    section.querySelectorAll('[data-ac-view-button]').forEach((button) => {
      const active = button.dataset.acViewButton === normalizedMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    try {
      window.localStorage.setItem(storageKey, normalizedMode);
    } catch (error) {
      // Local storage can be unavailable in private browsing.
    }
  };

  const hydrateViewMode = (section) => {
    let mode = '4';
    try {
      mode = window.localStorage.getItem(storageKey) || mode;
    } catch (error) {
      mode = '4';
    }
    applyViewMode(section, mode);
  };

  const updateCardVariant = (button) => {
    const card = button.closest('[data-ac-product-card]');
    if (!card) return;

    card.querySelectorAll('[data-ac-swatch]').forEach((swatch) => {
      const active = swatch === button;
      swatch.classList.toggle('is-active', active);
      swatch.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const input = card.querySelector('[data-ac-variant-input]');
    if (input) {
      input.value = button.dataset.variantId;
      input.disabled = button.dataset.variantAvailable !== 'true';
    }

    card.querySelectorAll('[data-ac-card-link]').forEach((link) => {
      if (button.dataset.variantUrl) link.href = button.dataset.variantUrl;
    });

    const image = card.querySelector('[data-ac-card-image], .altaeron-product-card__main-image');
    if (image && button.dataset.variantImage) {
      image.src = button.dataset.variantImage;
      image.removeAttribute('srcset');
    }

    const price = card.querySelector('[data-ac-price]');
    if (price && button.dataset.variantPrice) price.textContent = button.dataset.variantPrice;

    const comparePrice = card.querySelector('[data-ac-compare-price]');
    if (comparePrice && button.dataset.variantCompare) {
      comparePrice.textContent = button.dataset.variantCompare;
      comparePrice.hidden = button.dataset.variantCompare === button.dataset.variantPrice;
    } else if (comparePrice) {
      comparePrice.hidden = true;
    }

    const variantTitle = card.querySelector('[data-ac-variant-title]');
    if (variantTitle && button.dataset.variantTitle && button.dataset.variantTitle !== 'Default Title') {
      variantTitle.textContent = button.dataset.variantTitle;
    }

    const addButton = card.querySelector('[data-ac-add-button]');
    const addText = card.querySelector('[data-ac-add-text]');
    if (addButton) {
      const available = button.dataset.variantAvailable === 'true';
      addButton.disabled = !available;
      if (addText) addText.textContent = available ? addButton.dataset.addText || 'Add to cart' : addButton.dataset.soldText || 'Sold out';
    }
  };

  document.addEventListener('click', (event) => {
    const panelTrigger = event.target.closest('[data-ac-open-panel]');
    if (panelTrigger) {
      const section = getSection(panelTrigger);
      if (section) openPanel(section, panelTrigger.dataset.acOpenPanel, panelTrigger);
      return;
    }

    const panelClose = event.target.closest('[data-ac-close-panel]');
    if (panelClose) {
      const section = getSection(panelClose);
      if (section) closePanels(section);
      return;
    }

    const viewButton = event.target.closest('[data-ac-view-button]');
    if (viewButton) {
      const section = getSection(viewButton);
      applyViewMode(section, viewButton.dataset.acViewButton);
      return;
    }

    const swatch = event.target.closest('[data-ac-swatch]');
    if (swatch) {
      updateCardVariant(swatch);
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Escape') return;
    document.querySelectorAll(`${rootSelector}.is-panel-open`).forEach(closePanels);
  });

  document.addEventListener('collection:rerendered', () => {
    document.querySelectorAll(rootSelector).forEach(hydrateViewMode);
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(rootSelector).forEach(hydrateViewMode);
  });
})();

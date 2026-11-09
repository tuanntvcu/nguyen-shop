(() => {
  const ngp_SELECTOR = '.ngp-pdp';
  function ngp_money(ngp_cents, ngp_format) {
    if (window.Shopify?.formatMoney) return window.Shopify.formatMoney(ngp_cents, ngp_format);
    const ngp_currency = window.Shopify?.currency?.active || 'USD';
    return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
      style: 'currency',
      currency: ngp_currency
    }).format(Number(ngp_cents || 0) / 100);
  }
  function ngp_addBusinessDays(ngp_date, ngp_businessDays) {
    const ngp_result = new Date(ngp_date);
    ngp_result.setHours(12, 0, 0, 0);
    let ngp_daysAdded = 0;
    while (ngp_daysAdded < ngp_businessDays) {
      ngp_result.setDate(ngp_result.getDate() + 1);
      const ngp_dayOfWeek = ngp_result.getDay();
      if (ngp_dayOfWeek !== 0 && ngp_dayOfWeek !== 6) ngp_daysAdded += 1;
    }
    return ngp_result;
  }
  function ngp_initDeliveryEstimate(ngp_root) {
    const ngp_estimate = ngp_root.querySelector('[data-apdp-delivery-estimate]');
    const ngp_range = ngp_estimate?.querySelector('[data-apdp-delivery-range]');
    if (!ngp_estimate || !ngp_range) return;
    const ngp_handlingBusinessDays = 1;
    const ngp_minTransitBusinessDays = 3;
    const ngp_maxTransitBusinessDays = 4;
    const ngp_locale = ngp_estimate.dataset.locale || document.documentElement.lang || 'en';
    const ngp_orderDate = new Date();
    const ngp_processingCompleteDate = ngp_addBusinessDays(ngp_orderDate, ngp_handlingBusinessDays);
    const ngp_earliestDelivery = ngp_addBusinessDays(ngp_processingCompleteDate, ngp_minTransitBusinessDays);
    const ngp_latestDelivery = ngp_addBusinessDays(ngp_processingCompleteDate, ngp_maxTransitBusinessDays);
    const ngp_includeYear = ngp_orderDate.getFullYear() !== ngp_latestDelivery.getFullYear() || ngp_earliestDelivery.getFullYear() !== ngp_latestDelivery.getFullYear();
    const ngp_formatter = new Intl.DateTimeFormat(ngp_locale, {
      month: 'short',
      day: 'numeric',
      ...(ngp_includeYear ? {
        year: 'numeric'
      } : {})
    });
    const ngp_formattedRange = typeof ngp_formatter.formatRange === 'function' ? ngp_formatter.formatRange(ngp_earliestDelivery, ngp_latestDelivery) : `${ngp_formatter.format(ngp_earliestDelivery)}–${ngp_formatter.format(ngp_latestDelivery)}`;
    ngp_range.textContent = ngp_locale.toLowerCase().startsWith('en') ? ngp_formattedRange.replace(/\s*[–-]\s*/u, '–') : ngp_formattedRange;
  }
  const ngp_promotion = {
    enabled: true,
    timeZone: 'America/Los_Angeles'
  };
  const ngp_promotionDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ngp_promotion.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  function ngp_promotionDateParts(ngp_timestamp) {
    return Object.fromEntries(ngp_promotionDateFormatter.formatToParts(new Date(ngp_timestamp)).filter(({
      type: ngp_type
    }) => ngp_type !== 'literal').map(({
      type: ngp_type,
      value: ngp_value
    }) => [ngp_type, Number(ngp_value)]));
  }
  function ngp_promotionTimeZoneOffset(ngp_timestamp) {
    const ngp_parts = ngp_promotionDateParts(ngp_timestamp);
    const ngp_timestampWithoutMilliseconds = Math.floor(ngp_timestamp / 1000) * 1000;
    return Date.UTC(ngp_parts.year, ngp_parts.month - 1, ngp_parts.day, ngp_parts.hour, ngp_parts.minute, ngp_parts.second) - ngp_timestampWithoutMilliseconds;
  }
  function ngp_nextPromotionMidnight(ngp_timestamp) {
    const ngp_parts = ngp_promotionDateParts(ngp_timestamp);
    const ngp_midnightAsUtc = Date.UTC(ngp_parts.year, ngp_parts.month - 1, ngp_parts.day + 1);
    let ngp_deadline = ngp_midnightAsUtc;

    // Resolve the IANA time-zone offset twice so this remains correct across PST/PDT changes.
    for (let ngp_pass = 0; ngp_pass < 2; ngp_pass += 1) {
      ngp_deadline = ngp_midnightAsUtc - ngp_promotionTimeZoneOffset(ngp_deadline);
    }
    return ngp_deadline;
  }
  function ngp_initPromotion(ngp_root) {
    const ngp_card = ngp_root.querySelector('[data-apdp-promotion-card]');
    if (!ngp_card || !ngp_promotion.enabled) return;
    const ngp_countdown = ngp_card.querySelector('[data-apdp-promotion-countdown]');
    const ngp_units = {
      days: ngp_card.querySelector('[data-apdp-promotion-days]'),
      hours: ngp_card.querySelector('[data-apdp-promotion-hours]'),
      minutes: ngp_card.querySelector('[data-apdp-promotion-minutes]'),
      seconds: ngp_card.querySelector('[data-apdp-promotion-seconds]')
    };
    const ngp_submitLabel = ngp_root.querySelector('[data-apdp-submit-label]');
    const ngp_stickyPromotion = ngp_root.querySelector('[data-apdp-promotion-sticky]');
    const ngp_announcement = document.querySelector('.announcement-bar');
    const ngp_translations = {
      cta: ngp_card.dataset.apdpPromotionCta,
      announcementDesktop: ngp_card.dataset.apdpPromotionAnnouncementDesktop,
      announcementMobile: ngp_card.dataset.apdpPromotionAnnouncementMobile,
      timerLabel: ngp_card.dataset.apdpPromotionTimerLabel
    };
    const ngp_update = () => {
      const ngp_now = Date.now();
      const ngp_deadline = ngp_nextPromotionMidnight(ngp_now);
      const ngp_remaining = ngp_deadline - ngp_now;
      const ngp_totalSeconds = Math.max(0, Math.floor(ngp_remaining / 1000));
      const ngp_values = {
        days: Math.floor(ngp_totalSeconds / 86400),
        hours: Math.floor(ngp_totalSeconds % 86400 / 3600),
        minutes: Math.floor(ngp_totalSeconds % 3600 / 60),
        seconds: ngp_totalSeconds % 60
      };
      Object.entries(ngp_values).forEach(([ngp_key, ngp_value]) => {
        if (ngp_units[ngp_key]) ngp_units[ngp_key].textContent = String(ngp_value).padStart(2, '0');
      });
      const ngp_timerLabel = ngp_translations.timerLabel?.replace('[days]', ngp_values.days).replace('[hours]', ngp_values.hours).replace('[minutes]', ngp_values.minutes).replace('[seconds]', ngp_values.seconds);
      if (ngp_timerLabel) ngp_countdown?.setAttribute('aria-label', ngp_timerLabel);
    };
    ngp_card.hidden = false;
    if (ngp_stickyPromotion) ngp_stickyPromotion.hidden = false;
    if (ngp_submitLabel && ngp_translations.cta) {
      ngp_submitLabel.textContent = ngp_translations.cta;
      ngp_submitLabel.dataset.availableText = ngp_translations.cta;
    }
    if (ngp_announcement && ngp_card.dataset.apdpPromotionSyncAnnouncement !== 'false') {
      ngp_announcement.classList.add('announcement-bar--labor-day');
      const ngp_announcementPromotion = document.createElement('div');
      ngp_announcementPromotion.dataset.apdpPromoAnnouncement = '';
      ngp_announcementPromotion.className = 'ngp-apdp-promo-announcement';
      const ngp_desktopCopy = document.createElement('span');
      ngp_desktopCopy.className = 'ngp-apdp-promo-announcement__desktop';
      ngp_desktopCopy.textContent = ngp_translations.announcementDesktop;
      const ngp_mobileCopy = document.createElement('span');
      ngp_mobileCopy.className = 'ngp-apdp-promo-announcement__mobile';
      ngp_mobileCopy.textContent = ngp_translations.announcementMobile;
      ngp_announcementPromotion.append(ngp_desktopCopy, ngp_mobileCopy);
      ngp_announcement.append(ngp_announcementPromotion);
    }
    ngp_update();
    window.setInterval(ngp_update, 1000);
  }
  function ngp_initSocialProof(ngp_root) {
    const ngp_message = ngp_root.querySelector('[data-apdp-social-proof]');
    const ngp_count = ngp_message?.querySelector('[data-apdp-social-proof-count]');
    if (!ngp_message || !ngp_count) return;
    const ngp_offsetMatch = ngp_message.dataset.storeUtcOffset?.match(/^([+-])(\d{2}):?(\d{2})$/);
    const ngp_offsetMinutes = ngp_offsetMatch ? (ngp_offsetMatch[1] === '-' ? -1 : 1) * (Number(ngp_offsetMatch[2]) * 60 + Number(ngp_offsetMatch[3])) : null;
    const ngp_storeDate = () => {
      if (ngp_offsetMinutes === null) return ngp_message.dataset.storeDate;
      return new Date(Date.now() + ngp_offsetMinutes * 60_000).toISOString().slice(0, 10);
    };
    const ngp_dailyCount = ngp_date => {
      let ngp_hash = 2166136261;
      for (let ngp_index = 0; ngp_index < ngp_date.length; ngp_index += 1) {
        ngp_hash ^= ngp_date.charCodeAt(ngp_index);
        ngp_hash = Math.imul(ngp_hash, 16777619);
      }
      ngp_hash ^= ngp_hash >>> 16;
      ngp_hash = Math.imul(ngp_hash, 2246822507);
      ngp_hash ^= ngp_hash >>> 13;
      return 20 + (ngp_hash >>> 0) % 11;
    };
    const ngp_update = () => {
      if (!ngp_message.isConnected) return;
      const ngp_date = ngp_storeDate();
      if (!ngp_date) return;
      ngp_count.textContent = String(ngp_dailyCount(ngp_date));
      ngp_message.hidden = false;
      const ngp_shiftedNow = new Date(Date.now() + (ngp_offsetMinutes || 0) * 60_000);
      const ngp_nextStoreMidnight = Date.UTC(ngp_shiftedNow.getUTCFullYear(), ngp_shiftedNow.getUTCMonth(), ngp_shiftedNow.getUTCDate() + 1);
      window.setTimeout(ngp_update, Math.max(1_000, ngp_nextStoreMidnight - ngp_shiftedNow.getTime() + 100));
    };
    ngp_update();
  }
  function ngp_initGallery(ngp_root) {
    const ngp_thumbs = [...ngp_root.querySelectorAll('[data-apdp-thumb]')];
    const ngp_items = [...ngp_root.querySelectorAll('[data-apdp-media]')];
    const ngp_thumbsList = ngp_root.querySelector('.ngp-apdp-gallery__thumbs');
    const ngp_stage = ngp_root.querySelector('.ngp-apdp-gallery__stage');
    const ngp_stageImage = ngp_stage?.querySelector('img');
    if (!ngp_thumbs.length || !ngp_items.length) return () => {};
    if (ngp_thumbsList) {
      let ngp_pointerId = null;
      let ngp_startPosition = 0;
      let ngp_startScrollPosition = 0;
      let ngp_horizontal = false;
      let ngp_dragged = false;
      let ngp_suppressClick = false;
      const ngp_dragThreshold = 8;
      ngp_thumbsList.addEventListener('dragstart', ngp_event => ngp_event.preventDefault());
      ngp_thumbsList.addEventListener('pointerdown', ngp_event => {
        if (ngp_event.pointerType !== 'mouse' || ngp_event.button !== 0) return;
        ngp_pointerId = ngp_event.pointerId;
        ngp_horizontal = getComputedStyle(ngp_thumbsList).flexDirection === 'row';
        ngp_startPosition = ngp_horizontal ? ngp_event.clientX : ngp_event.clientY;
        ngp_startScrollPosition = ngp_horizontal ? ngp_thumbsList.scrollLeft : ngp_thumbsList.scrollTop;
        ngp_dragged = false;
      });
      ngp_thumbsList.addEventListener('pointermove', ngp_event => {
        if (ngp_event.pointerId !== ngp_pointerId) return;
        const ngp_position = ngp_horizontal ? ngp_event.clientX : ngp_event.clientY;
        const ngp_distance = ngp_position - ngp_startPosition;
        if (!ngp_dragged && Math.abs(ngp_distance) < ngp_dragThreshold) return;
        if (!ngp_dragged && !ngp_thumbsList.hasPointerCapture(ngp_pointerId)) ngp_thumbsList.setPointerCapture(ngp_pointerId);
        ngp_dragged = true;
        ngp_suppressClick = true;
        ngp_thumbsList.classList.add('is-dragging');
        if (ngp_horizontal) ngp_thumbsList.scrollLeft = ngp_startScrollPosition - ngp_distance;else ngp_thumbsList.scrollTop = ngp_startScrollPosition - ngp_distance;
        ngp_event.preventDefault();
      });
      const ngp_stopDragging = ngp_event => {
        if (ngp_event.pointerId !== ngp_pointerId) return;
        if (ngp_thumbsList.hasPointerCapture(ngp_pointerId)) ngp_thumbsList.releasePointerCapture(ngp_pointerId);
        ngp_pointerId = null;
        ngp_thumbsList.classList.remove('is-dragging');
        if (ngp_dragged) window.setTimeout(() => {
          ngp_suppressClick = false;
        }, 0);
      };
      ngp_thumbsList.addEventListener('pointerup', ngp_stopDragging);
      ngp_thumbsList.addEventListener('pointercancel', ngp_stopDragging);
      ngp_thumbsList.addEventListener('click', ngp_event => {
        if (!ngp_suppressClick) return;
        ngp_event.preventDefault();
        ngp_event.stopPropagation();
      }, true);
    }
    const ngp_activate = (ngp_id, ngp_focus = false, ngp_syncStage = true) => {
      const ngp_activeItem = ngp_items.find(ngp_item => String(ngp_item.dataset.apdpMedia) === String(ngp_id));
      const ngp_activeThumb = ngp_thumbs.find(ngp_thumb => String(ngp_thumb.dataset.apdpThumb) === String(ngp_id));
      if (!ngp_activeItem) return;
      if (ngp_syncStage && ngp_stageImage && ngp_activeThumb?.dataset.apdpPreviewSrc) {
        ngp_stageImage.src = ngp_activeThumb.dataset.apdpPreviewSrc;
        ngp_stageImage.removeAttribute('srcset');
        ngp_stageImage.alt = ngp_activeThumb.dataset.apdpPreviewAlt || '';
      }
      ngp_thumbs.forEach(ngp_thumb => {
        const ngp_active = String(ngp_thumb.dataset.apdpThumb) === String(ngp_id);
        ngp_thumb.classList.toggle('ngp-is-active', ngp_active);
        ngp_thumb.setAttribute('aria-selected', String(ngp_active));
        ngp_thumb.tabIndex = ngp_active ? 0 : -1;
        if (ngp_active && ngp_focus) {
          ngp_thumb.scrollIntoView?.({
            block: 'nearest',
            inline: 'nearest'
          });
          ngp_thumb.focus({
            preventScroll: true
          });
        }
      });
      ngp_items.forEach(ngp_item => {
        const ngp_active = ngp_item === ngp_activeItem;
        ngp_item.hidden = !ngp_active;
        ngp_item.setAttribute('aria-hidden', String(!ngp_active));
        ngp_item.classList.toggle('ngp-is-active', ngp_active);
        if (!ngp_active) ngp_item.querySelectorAll('video').forEach(ngp_video => ngp_video.pause());
      });
      const ngp_activeVideo = ngp_activeItem.querySelector('video[autoplay]');
      if (ngp_activeVideo && !document.hidden) ngp_activeVideo.play().catch(() => {});
    };
    const ngp_swipeTargets = [ngp_stage, ngp_root.querySelector('.ngp-apdp-gallery__viewer')].filter(Boolean);
    if (ngp_swipeTargets.length && ngp_thumbs.length > 1) {
      ngp_swipeTargets.forEach(ngp_swipeTarget => {
        let ngp_stagePointer = null;
        ngp_swipeTarget.addEventListener('pointerdown', ngp_event => {
          if (!ngp_event.isPrimary || ngp_event.button > 0 || ngp_event.target.closest('button')) return;
          ngp_stagePointer = { id: ngp_event.pointerId, x: ngp_event.clientX, y: ngp_event.clientY };
          ngp_swipeTarget.setPointerCapture?.(ngp_event.pointerId);
        });
        ngp_swipeTarget.addEventListener('pointerup', ngp_event => {
          if (!ngp_stagePointer || ngp_event.pointerId !== ngp_stagePointer.id) return;
          const ngp_deltaX = ngp_event.clientX - ngp_stagePointer.x;
          const ngp_deltaY = ngp_event.clientY - ngp_stagePointer.y;
          ngp_stagePointer = null;
          if (Math.abs(ngp_deltaX) < 40 || Math.abs(ngp_deltaX) <= Math.abs(ngp_deltaY) * 1.25) return;
          const ngp_activeIndex = Math.max(0, ngp_thumbs.findIndex(ngp_thumb => ngp_thumb.getAttribute('aria-selected') === 'true'));
          const ngp_nextIndex = ngp_activeIndex + (ngp_deltaX < 0 ? 1 : -1);
          if (ngp_nextIndex < 0 || ngp_nextIndex >= ngp_thumbs.length) return;
          const ngp_nextThumb = ngp_thumbs[ngp_nextIndex];
          ngp_nextThumb.click();
          ngp_nextThumb.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
          const ngp_activeImage = ngp_swipeTarget.querySelector('img:not([hidden])') || ngp_stageImage;
          if (ngp_activeImage?.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            ngp_activeImage.animate([
              { opacity: 0.72, transform: `translateX(${ngp_deltaX < 0 ? '5%' : '-5%'})` },
              { opacity: 1, transform: 'translateX(0)' }
            ], { duration: 280, easing: 'cubic-bezier(.22,.61,.36,1)' });
          }
        });
        ngp_swipeTarget.addEventListener('pointercancel', () => { ngp_stagePointer = null; });
        ngp_swipeTarget.addEventListener('dragstart', ngp_event => ngp_event.preventDefault());
      });
    }
    ngp_thumbs.forEach((ngp_thumb, ngp_index) => {
      ngp_thumb.addEventListener('click', () => ngp_activate(ngp_thumb.dataset.apdpThumb));
      ngp_thumb.addEventListener('keydown', ngp_event => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ngp_event.key)) return;
        ngp_event.preventDefault();
        let ngp_next = ngp_index;
        if (['ArrowDown', 'ArrowRight'].includes(ngp_event.key)) ngp_next = (ngp_index + 1) % ngp_thumbs.length;
        if (['ArrowUp', 'ArrowLeft'].includes(ngp_event.key)) ngp_next = (ngp_index - 1 + ngp_thumbs.length) % ngp_thumbs.length;
        if (ngp_event.key === 'Home') ngp_next = 0;
        if (ngp_event.key === 'End') ngp_next = ngp_thumbs.length - 1;
        ngp_activate(ngp_thumbs[ngp_next].dataset.apdpThumb, true);
      });
    });
    const ngp_initiallyActive = ngp_thumbs.find(ngp_thumb => ngp_thumb.classList.contains('ngp-is-active')) || ngp_thumbs[0];
    ngp_activate(ngp_initiallyActive.dataset.apdpThumb, false, false);
    return ngp_activate;
  }
  function ngp_handleZoomClick(ngp_event) {
    const ngp_button = ngp_event.target.closest?.('[data-apdp-zoom]');
    const ngp_root = ngp_button?.closest(ngp_SELECTOR);
    if (!ngp_button || !ngp_root) return;
    ngp_event.preventDefault();
    ngp_event.stopPropagation();
    const ngp_zoomItems = [...ngp_root.querySelectorAll('[data-apdp-media][data-apdp-zoom-src]')];
    const ngp_activeItem = ngp_button.closest('[data-apdp-media]');
    const ngp_index = Math.max(0, ngp_zoomItems.indexOf(ngp_activeItem));
    ngp_openZoomViewer(ngp_zoomItems.map(ngp_item => ({
      src: ngp_item.dataset.apdpZoomSrc,
      alt: ngp_item.querySelector('img')?.alt || ''
    })), ngp_index, ngp_button);
  }
  function ngp_openZoomViewer(ngp_images, ngp_initialIndex, ngp_trigger) {
    if (!ngp_images.length) return;
    document.querySelector('[data-apdp-zoom-viewer]')?.remove();
    const ngp_viewer = document.createElement('div');
    ngp_viewer.className = 'ngp-apdp-zoom-viewer';
    ngp_viewer.dataset.apdpZoomViewer = '';
    ngp_viewer.tabIndex = -1;
    ngp_viewer.setAttribute('role', 'dialog');
    ngp_viewer.setAttribute('aria-modal', 'true');
    ngp_viewer.setAttribute('aria-label', ngp_trigger.getAttribute('aria-label') || 'Product image viewer');
    ngp_viewer.innerHTML = `
      <button type="button" class="ngp-apdp-zoom-viewer__close" data-apdp-zoom-close aria-label="Close image viewer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
      <button type="button" class="ngp-apdp-zoom-viewer__nav ngp-apdp-zoom-viewer__nav--prev" data-apdp-zoom-prev aria-label="Previous image">&#8249;</button>
      <div class="ngp-apdp-zoom-viewer__canvas" data-apdp-zoom-canvas>
        <img class="ngp-apdp-zoom-viewer__image" data-apdp-zoom-image alt="">
      </div>
      <button type="button" class="ngp-apdp-zoom-viewer__nav ngp-apdp-zoom-viewer__nav--next" data-apdp-zoom-next aria-label="Next image">&#8250;</button>
      <div class="ngp-apdp-zoom-viewer__counter" data-apdp-zoom-counter aria-live="polite"></div>
    `;
    const ngp_image = ngp_viewer.querySelector('[data-apdp-zoom-image]');
    const ngp_canvas = ngp_viewer.querySelector('[data-apdp-zoom-canvas]');
    const ngp_counter = ngp_viewer.querySelector('[data-apdp-zoom-counter]');
    const ngp_previous = ngp_viewer.querySelector('[data-apdp-zoom-prev]');
    const ngp_next = ngp_viewer.querySelector('[data-apdp-zoom-next]');
    const ngp_oldOverflow = document.body.style.overflow;
    let ngp_index = ngp_initialIndex;
    let ngp_dragState = null;
    let ngp_suppressCanvasClick = false;
    const ngp_setZoomed = ngp_zoomed => {
      ngp_image.classList.toggle('is-zoomed', ngp_zoomed);
      ngp_canvas.classList.toggle('is-zoomed', ngp_zoomed);
      if (ngp_zoomed) {
        requestAnimationFrame(() => {
          ngp_canvas.scrollLeft = Math.max(0, (ngp_canvas.scrollWidth - ngp_canvas.clientWidth) / 2);
          ngp_canvas.scrollTop = Math.max(0, (ngp_canvas.scrollHeight - ngp_canvas.clientHeight) / 2);
        });
      } else {
        ngp_canvas.scrollTo(0, 0);
      }
    };
    const ngp_show = ngp_nextIndex => {
      ngp_index = (ngp_nextIndex + ngp_images.length) % ngp_images.length;
      ngp_image.style.transform = '';
      ngp_setZoomed(false);
      ngp_image.src = ngp_images[ngp_index].src;
      ngp_image.alt = ngp_images[ngp_index].alt;
      ngp_counter.textContent = `${ngp_index + 1} / ${ngp_images.length}`;
    };
    const ngp_close = () => {
      document.removeEventListener('keydown', ngp_onKeydown);
      document.body.style.overflow = ngp_oldOverflow;
      ngp_viewer.remove();
      if (ngp_trigger.isConnected) ngp_trigger.focus({
        preventScroll: true
      });
    };
    const ngp_onKeydown = ngp_event => {
      if (ngp_event.key === 'Escape') ngp_close();
      if (ngp_event.key === 'ArrowLeft' && ngp_images.length > 1) ngp_show(ngp_index - 1);
      if (ngp_event.key === 'ArrowRight' && ngp_images.length > 1) ngp_show(ngp_index + 1);
      if (ngp_event.key === 'Tab') {
        const ngp_controls = [...ngp_viewer.querySelectorAll('button:not([hidden])')];
        const ngp_first = ngp_controls[0];
        const ngp_last = ngp_controls[ngp_controls.length - 1];
        if (ngp_event.shiftKey && document.activeElement === ngp_first) {
          ngp_event.preventDefault();
          ngp_last.focus();
        } else if (!ngp_event.shiftKey && document.activeElement === ngp_last) {
          ngp_event.preventDefault();
          ngp_first.focus();
        }
      }
    };
    if (ngp_images.length === 1) {
      ngp_previous.hidden = true;
      ngp_next.hidden = true;
    }
    ngp_viewer.querySelector('[data-apdp-zoom-close]').addEventListener('click', ngp_close);
    ngp_previous.addEventListener('click', () => ngp_show(ngp_index - 1));
    ngp_next.addEventListener('click', () => ngp_show(ngp_index + 1));
    ngp_canvas.addEventListener('pointerdown', ngp_event => {
      if (!ngp_event.isPrimary || ngp_event.button > 0) return;
      ngp_dragState = {
        pointerId: ngp_event.pointerId,
        startX: ngp_event.clientX,
        startY: ngp_event.clientY,
        scrollLeft: ngp_canvas.scrollLeft,
        scrollTop: ngp_canvas.scrollTop,
        zoomed: ngp_image.classList.contains('is-zoomed'),
        moved: false
      };
      ngp_canvas.setPointerCapture(ngp_event.pointerId);
      ngp_canvas.classList.add('is-dragging');
    });
    ngp_canvas.addEventListener('pointermove', ngp_event => {
      if (!ngp_dragState || ngp_event.pointerId !== ngp_dragState.pointerId) return;
      const ngp_deltaX = ngp_event.clientX - ngp_dragState.startX;
      const ngp_deltaY = ngp_event.clientY - ngp_dragState.startY;
      if (!ngp_dragState.moved && Math.hypot(ngp_deltaX, ngp_deltaY) < 5) return;
      ngp_dragState.moved = true;
      ngp_event.preventDefault();
      if (ngp_dragState.zoomed) {
        ngp_canvas.scrollLeft = ngp_dragState.scrollLeft - ngp_deltaX;
        ngp_canvas.scrollTop = ngp_dragState.scrollTop - ngp_deltaY;
      } else if (ngp_images.length > 1) {
        ngp_image.style.transform = `translate3d(${ngp_deltaX}px,0,0)`;
      }
    });
    const ngp_finishDrag = ngp_event => {
      if (!ngp_dragState || ngp_event.pointerId !== ngp_dragState.pointerId) return;
      const ngp_deltaX = ngp_event.clientX - ngp_dragState.startX;
      const ngp_wasMoved = ngp_dragState.moved;
      const ngp_wasZoomed = ngp_dragState.zoomed;
      if (ngp_canvas.hasPointerCapture(ngp_event.pointerId)) ngp_canvas.releasePointerCapture(ngp_event.pointerId);
      ngp_canvas.classList.remove('is-dragging');
      ngp_dragState = null;
      ngp_image.style.transform = '';
      if (ngp_wasMoved) {
        ngp_suppressCanvasClick = true;
        window.setTimeout(() => {
          ngp_suppressCanvasClick = false;
        }, 0);
      }
      if (!ngp_wasZoomed && ngp_wasMoved && Math.abs(ngp_deltaX) >= Math.min(100, ngp_canvas.clientWidth * 0.16)) {
        ngp_show(ngp_index + (ngp_deltaX < 0 ? 1 : -1));
      }
    };
    ngp_canvas.addEventListener('pointerup', ngp_finishDrag);
    ngp_canvas.addEventListener('pointercancel', ngp_finishDrag);
    ngp_canvas.addEventListener('click', () => {
      if (ngp_suppressCanvasClick) {
        ngp_suppressCanvasClick = false;
        return;
      }
      ngp_setZoomed(!ngp_image.classList.contains('is-zoomed'));
    });
    ngp_viewer.addEventListener('click', ngp_event => {
      if (ngp_event.target === ngp_viewer) ngp_close();
    });
    document.addEventListener('keydown', ngp_onKeydown);
    document.body.appendChild(ngp_viewer);
    document.body.style.overflow = 'hidden';
    ngp_show(ngp_index);
    ngp_viewer.focus({
      preventScroll: true
    });
  }
  function ngp_initQuantity(ngp_root) {
    const ngp_input = ngp_root.querySelector('[data-apdp-quantity]');
    if (!ngp_input) return;
    ngp_root.querySelector('[data-apdp-quantity-minus]')?.addEventListener('click', () => {
      ngp_input.value = Math.max(Number(ngp_input.min || 1), Number(ngp_input.value || 1) - 1);
      ngp_input.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    });
    ngp_root.querySelector('[data-apdp-quantity-plus]')?.addEventListener('click', () => {
      ngp_input.value = Number(ngp_input.value || 1) + 1;
      ngp_input.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    });
  }
  function ngp_initVariants(ngp_root, ngp_activateMedia) {
    const ngp_externalFinal = ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3') ? document.querySelector('[data-apdp-v3-final]') : null;
    const ngp_form = ngp_root.querySelector('.ngp-apdp-form');
    const ngp_idInput = ngp_root.querySelector('[data-apdp-variant-id]');
    const ngp_select = ngp_root.querySelector('[data-apdp-variant-select]');
    const ngp_radios = [...ngp_root.querySelectorAll('[data-apdp-variant-option]')];
    const ngp_currentPrice = ngp_root.querySelector('[data-apdp-current-price]');
    const ngp_comparePrice = ngp_root.querySelector('[data-apdp-compare-price]');
    const ngp_savings = ngp_root.querySelector('[data-apdp-savings]');
    const ngp_submit = ngp_root.querySelector('[data-apdp-submit]');
    const ngp_submitText = ngp_root.querySelector('[data-apdp-submit-text]');
    const ngp_submitLabel = ngp_root.querySelector('[data-apdp-submit-label]');
    const ngp_ctaPrice = ngp_root.querySelector('[data-apdp-cta-price]');
    const ngp_stickySubmit = ngp_root.querySelector('[data-apdp-sticky-submit]');
    const ngp_finalSubmit = ngp_root.querySelector('[data-apdp-final-submit]') || ngp_externalFinal?.querySelector('[data-apdp-final-submit]');
    const ngp_trySubmit = ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3') ? document.querySelector('[data-apdp-try-submit]') : null;
    const ngp_stickyText = ngp_root.querySelector('[data-apdp-sticky-text]');
    const ngp_stickyPrice = ngp_root.querySelector('[data-apdp-sticky-price]');
    const ngp_stickyCompare = ngp_root.querySelector('[data-apdp-sticky-compare]');
    const ngp_stickySavings = ngp_root.querySelector('[data-apdp-sticky-savings]');
    const ngp_stickyBundleTitle = ngp_root.querySelector('[data-apdp-sticky-bundle-title]');
    const ngp_installmentTerms = [...ngp_root.querySelectorAll('[data-apdp-installments]'), ...(ngp_externalFinal ? ngp_externalFinal.querySelectorAll('[data-apdp-installments]') : [])];
    const ngp_finalPrice = ngp_root.querySelector('[data-apdp-final-price]') || ngp_externalFinal?.querySelector('[data-apdp-final-price]');
    const ngp_finalButtonPrice = ngp_root.querySelector('[data-apdp-final-button-price]') || ngp_externalFinal?.querySelector('[data-apdp-final-button-price]');
    const ngp_finalCompare = ngp_root.querySelector('[data-apdp-final-compare]') || ngp_externalFinal?.querySelector('[data-apdp-final-compare]');
    const ngp_finalSavings = ngp_root.querySelector('[data-apdp-final-savings]') || ngp_externalFinal?.querySelector('[data-apdp-final-savings]');
    const ngp_variantsNode = ngp_root.querySelector('[data-apdp-product-json]');
    const ngp_variants = ngp_variantsNode ? JSON.parse(ngp_variantsNode.textContent) : [];
    const ngp_format = ngp_root.dataset.moneyFormat;
    const ngp_bundleWidget = ngp_root.querySelector('bundle-deals-widget, [data-apdp-bundle-widget]');
    const ngp_savingsText = ngp_amount => (ngp_root.dataset.saveTemplate || `${ngp_root.dataset.saveLabel} [amount]`).replaceAll('[amount]', ngp_money(ngp_amount, ngp_format));
    const ngp_fillTemplate = (ngp_template, ngp_replacements) => Object.entries(ngp_replacements).reduce((ngp_result, [ngp_key, ngp_value]) => ngp_result.replaceAll(`[${ngp_key}]`, ngp_value), ngp_template || '');
    const ngp_updateInstallments = ngp_price => {
      const ngp_installment = ngp_money(Math.round(ngp_price / 4), ngp_format);
      ngp_installmentTerms.forEach(ngp_element => {
        const ngp_textNode = [...ngp_element.childNodes].find(ngp_node => ngp_node.nodeType === Node.TEXT_NODE && /\d/.test(ngp_node.textContent));
        if (!ngp_textNode) return;
        ngp_textNode.textContent = ngp_textNode.textContent.replace(/(?:[$€£¥₹₩₫]\s*\d[\d.,]*|\d[\d.,]*\s*(?:USD|EUR|GBP|CAD|AUD|VND|₫))/i, ngp_installment);
      });
    };
    const ngp_updateRelatedPrices = (ngp_price, ngp_compare) => {
      const ngp_hasSavings = ngp_compare > ngp_price;
      const ngp_saved = Math.max(ngp_compare - ngp_price, 0);
      if (ngp_finalPrice) ngp_finalPrice.textContent = ngp_money(ngp_price, ngp_format);
      if (ngp_finalButtonPrice) {
        const ngp_priceSeparator = ngp_finalButtonPrice.hasAttribute('data-apdp-no-separator') ? ' ' : ' — ';
        ngp_finalButtonPrice.textContent = `${ngp_priceSeparator}${ngp_money(ngp_price, ngp_format)}`;
      }
      if (ngp_finalCompare) {
        ngp_finalCompare.hidden = !ngp_hasSavings;
        if (ngp_hasSavings) ngp_finalCompare.textContent = ngp_money(ngp_compare, ngp_format);
      }
      if (ngp_finalSavings) {
        ngp_finalSavings.hidden = !ngp_hasSavings;
        if (ngp_hasSavings) ngp_finalSavings.textContent = ngp_savingsText(ngp_saved);
      }
      ngp_updateInstallments(ngp_price);
    };
    const ngp_chosenControl = () => {
      const ngp_explicitControl = ngp_select?.selectedOptions?.[0] || ngp_radios.find(ngp_radio => ngp_radio.checked);
      if (ngp_explicitControl) return ngp_explicitControl;
      const ngp_variant = ngp_variants.find(ngp_item => String(ngp_item.id) === String(ngp_idInput?.value)) || ngp_variants[0];
      if (!ngp_variant) return null;
      return {
        value: ngp_variant.id,
        dataset: {
          price: ngp_variant.price,
          compare: ngp_variant.compare_at_price || 0,
          available: String(ngp_variant.available),
          mediaId: ngp_variant.featured_media?.id || ''
        }
      };
    };
    const ngp_update = (ngp_pushUrl = true) => {
      const ngp_control = ngp_chosenControl();
      if (!ngp_control) return;
      const ngp_id = ngp_control.value;
      const ngp_price = Number(ngp_control.dataset.price || 0);
      const ngp_compare = Number(ngp_control.dataset.compare || 0);
      const ngp_available = ngp_control.dataset.available === 'true';
      const ngp_mediaId = ngp_control.dataset.mediaId;
      const ngp_variant = ngp_variants.find(ngp_item => String(ngp_item.id) === String(ngp_id));
      if (ngp_idInput) ngp_idInput.value = ngp_id;
      if (ngp_currentPrice) ngp_currentPrice.textContent = ngp_money(ngp_price, ngp_format);
      if (ngp_stickyPrice) ngp_stickyPrice.textContent = ngp_money(ngp_price, ngp_format);
      if (ngp_stickyCompare) {
        ngp_stickyCompare.hidden = ngp_compare <= ngp_price;
        if (ngp_compare > ngp_price) ngp_stickyCompare.textContent = ngp_money(ngp_compare, ngp_format);
      }
      if (ngp_comparePrice) {
        if (ngp_comparePrice.dataset.staticPrice) {
          ngp_comparePrice.hidden = false;
          ngp_comparePrice.textContent = ngp_comparePrice.dataset.staticPrice;
        } else {
          ngp_comparePrice.hidden = ngp_compare <= ngp_price;
          if (ngp_compare > ngp_price) ngp_comparePrice.textContent = ngp_money(ngp_compare, ngp_format);
        }
      }
      if (ngp_savings) {
        if (ngp_savings.dataset.staticSavings) {
          ngp_savings.hidden = false;
          ngp_savings.textContent = ngp_savings.dataset.staticSavings;
        } else {
          ngp_savings.hidden = ngp_compare <= ngp_price;
          if (ngp_compare > ngp_price) ngp_savings.textContent = ngp_savingsText(ngp_compare - ngp_price);
        }
      }
      if (ngp_stickySavings) {
        ngp_stickySavings.hidden = ngp_compare <= ngp_price;
        if (ngp_compare > ngp_price) ngp_stickySavings.textContent = ngp_savingsText(ngp_compare - ngp_price);
      }
      [ngp_submit, ngp_stickySubmit, ngp_finalSubmit, ngp_trySubmit].forEach(ngp_button => {
        if (!ngp_button) return;
        ngp_button.disabled = !ngp_available;
        if (ngp_available) ngp_button.removeAttribute('aria-disabled');else ngp_button.setAttribute('aria-disabled', 'true');
      });
      const ngp_label = ngp_available ? ngp_submitLabel?.dataset.availableText || ngp_root.dataset.addToCartLabel : ngp_root.dataset.soldOutLabel;
      if (ngp_submitLabel) ngp_submitLabel.textContent = ngp_label;
      if (ngp_ctaPrice) {
        ngp_ctaPrice.hidden = !ngp_available;
        if (ngp_available) ngp_ctaPrice.textContent = ` — ${ngp_money(ngp_price, ngp_format)}`;
      }
      if (ngp_finalButtonPrice) ngp_finalButtonPrice.hidden = !ngp_available;
      if (ngp_stickyText) ngp_stickyText.textContent = ngp_label;
      ngp_updateRelatedPrices(ngp_price, ngp_compare);
      if (ngp_mediaId) ngp_activateMedia(ngp_mediaId);
      if (ngp_pushUrl) {
        const ngp_url = new URL(ngp_root.dataset.productUrl, window.location.origin);
        ngp_url.searchParams.set('variant', ngp_id);
        window.history.replaceState({
          ...window.history.state,
          variant: ngp_id
        }, '', ngp_url);
      }
      ngp_form?.dispatchEvent(new CustomEvent('altaeron:variant-change', {
        bubbles: true,
        detail: {
          variant: ngp_variant
        }
      }));
    };
    const ngp_parseDisplayedMoney = ngp_value => {
      const ngp_numeric = String(ngp_value || '').replace(/[^\d.,]/g, '');
      const ngp_decimalIndex = Math.max(ngp_numeric.lastIndexOf('.'), ngp_numeric.lastIndexOf(','));
      if (ngp_decimalIndex >= 0 && ngp_numeric.length - ngp_decimalIndex - 1 === 2) {
        const ngp_whole = ngp_numeric.slice(0, ngp_decimalIndex).replace(/[^\d]/g, '');
        const ngp_decimal = ngp_numeric.slice(ngp_decimalIndex + 1).replace(/[^\d]/g, '');
        return Number(ngp_whole || 0) * 100 + Number(ngp_decimal || 0);
      }
      return Number(ngp_numeric.replace(/[^\d]/g, '') || 0) * 100;
    };
    const ngp_selectedBundle = () => {
      if (!ngp_bundleWidget) return null;
      const ngp_widgetRoot = ngp_bundleWidget.shadowRoot || ngp_bundleWidget;
      const ngp_checkedInputs = [...ngp_widgetRoot.querySelectorAll('input[type="radio"]:checked, [role="radio"][aria-checked="true"]')];
      const ngp_moneyPattern = /(?:[$€£¥₹₩]\s*\d[\d.,]*|\d[\d.,]*\s*(?:USD|EUR|GBP|CAD|AUD|VND|₫))/gi;
      const ngp_bundleTitle = ngp_option => {
        const ngp_explicitTitle = ngp_option.querySelector('.bd-tier__name')?.textContent.replace(/\s+/g, ' ').trim();
        if (ngp_explicitTitle) return ngp_explicitTitle;
        const ngp_ignoredPattern = /^(?:recommended|best value|save\b|from\b|for\b)/i;
        const ngp_titlePattern = /\b(?:bundle|pack|correctors?|items?|pieces?|left|right)\b/i;
        const ngp_preferredTitlePattern = /(?:\b\d+\b.*\b(?:bundle|pack|correctors?|items?|pieces?|left|right)\b|\b(?:bundle|pack|correctors?|items?|pieces?)\b)/i;
        const ngp_containsMoney = ngp_text => {
          ngp_moneyPattern.lastIndex = 0;
          return ngp_moneyPattern.test(ngp_text);
        };
        const ngp_elementTexts = [...ngp_option.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,[class*="title"],[class*="name"]')].map(ngp_element => ngp_element.textContent.replace(/\s+/g, ' ').trim()).filter(ngp_text => ngp_text && ngp_text.length <= 70 && !ngp_containsMoney(ngp_text) && !ngp_ignoredPattern.test(ngp_text));
        const ngp_lineTexts = String(ngp_option.innerText || ngp_option.textContent || '').split(/\r?\n/).map(ngp_text => ngp_text.replace(/\s+/g, ' ').trim()).filter(ngp_text => ngp_text && ngp_text.length <= 70 && !ngp_containsMoney(ngp_text) && !ngp_ignoredPattern.test(ngp_text));
        ngp_moneyPattern.lastIndex = 0;
        const ngp_texts = [...new Set([...ngp_elementTexts, ...ngp_lineTexts])];
        return ngp_texts.find(ngp_text => ngp_preferredTitlePattern.test(ngp_text)) || ngp_texts.find(ngp_text => ngp_titlePattern.test(ngp_text)) || '';
      };
      for (const ngp_input of ngp_checkedInputs) {
        const ngp_candidates = [...(ngp_input.labels || [])];
        let ngp_ancestor = ngp_input.parentElement;
        while (ngp_ancestor && ngp_ancestor !== ngp_widgetRoot) {
          ngp_candidates.push(ngp_ancestor);
          ngp_ancestor = ngp_ancestor.parentElement;
        }
        for (const ngp_option of ngp_candidates) {
          const ngp_optionInputs = ngp_option.querySelectorAll('input[type="radio"]').length;
          const ngp_totalPrice = ngp_option.querySelector('.bd-tier__price');
          const ngp_comparePrice = ngp_option.querySelector('.bd-tier__compare');
          if (ngp_optionInputs <= 1 && ngp_totalPrice) {
            const ngp_quantityMatch = ngp_option.textContent.match(/\b(\d+)\s*(?:correctors?|items?|pieces?|packs?)\b/i);
            const ngp_tierQuantity = Number(ngp_option.dataset.tierIndex) + 1;
            const ngp_quantity = Number(ngp_input.dataset.quantity || ngp_quantityMatch?.[1] || ngp_tierQuantity || 1);
            return {
              price: Number(ngp_totalPrice.dataset.altaeronOriginalPrice || ngp_parseDisplayedMoney(ngp_totalPrice.textContent)),
              compare: ngp_parseDisplayedMoney(ngp_comparePrice?.textContent),
              quantity: ngp_quantity,
              title: ngp_bundleTitle(ngp_option)
            };
          }
        }
      }
      return null;
    };

    // Bundle option names, descriptions and badges belong to the app.
    // Only normalize the price fields used by the PDP pricing display.
    const ngp_syncBundleTierPrices = (ngp_widgetRoot, ngp_baseCompare, ngp_basePrice) => {
      if (ngp_root.dataset.bundleMode === 'fixed') return;
      const ngp_setText = (ngp_element, ngp_value) => {
        if (ngp_element && ngp_value && ngp_element.textContent !== ngp_value) ngp_element.textContent = ngp_value;
      };
      const ngp_firstTierElement = ngp_widgetRoot.querySelector('[data-tier-index="0"] .bd-tier__price');
      if (ngp_firstTierElement && !ngp_firstTierElement.dataset.altaeronOriginalPrice) {
        ngp_firstTierElement.dataset.altaeronOriginalPrice = String(ngp_parseDisplayedMoney(ngp_firstTierElement.textContent));
      }
      const ngp_firstTierPrice = Number(ngp_firstTierElement?.dataset.altaeronOriginalPrice || 0);
      [...ngp_widgetRoot.querySelectorAll('[data-tier-index]')].forEach((ngp_tier, ngp_index) => {
        const ngp_quantity = Number(ngp_tier.dataset.tierIndex) + 1 || ngp_index + 1;
        const ngp_priceElement = ngp_tier.querySelector('.bd-tier__price');
        if (ngp_priceElement && !ngp_priceElement.dataset.altaeronOriginalPrice) {
          ngp_priceElement.dataset.altaeronOriginalPrice = String(ngp_parseDisplayedMoney(ngp_priceElement.textContent));
        }
        const ngp_tierPrice = Number(ngp_priceElement?.dataset.altaeronOriginalPrice || 0);
        ngp_setText(ngp_priceElement, ngp_money(ngp_tierPrice, ngp_format));
        if (ngp_quantity === 1) return;
        const ngp_originalTotal = ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3') && ngp_quantity === 2 && ngp_firstTierPrice ? ngp_firstTierPrice * 2 : (ngp_baseCompare > ngp_basePrice ? ngp_baseCompare : ngp_basePrice) * ngp_quantity;
        ngp_setText(ngp_tier.querySelector('.bd-tier__compare'), ngp_originalTotal > 0 ? ngp_money(ngp_originalTotal, ngp_format) : '');
      });
    };
    const ngp_translateReelsV3Bundle = ngp_widgetRoot => {
      if (!ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3')) return;
      const ngp_locale = String(window.Shopify?.locale || document.documentElement.lang || 'en').toLowerCase();
      const ngp_language = ngp_locale.split('-')[0];
      const ngp_copy = {
        fr: ['Achetez plus, économisez plus', 'Correcteur d’oignon', 'Correcteurs d’oignon', 'Utilisable sur le pied gauche ou droit', 'Un pour chaque pied – portez-les aux deux pieds', 'Commencer avec 1', 'Le plus populaire'],
        de: ['Mehr kaufen, mehr sparen', 'Ballenzehkorrektor', 'Ballenzehkorrektoren', 'Für den linken oder rechten Fuß geeignet', 'Je einer pro Fuß – an beiden Füßen tragen', 'Mit 1 starten', 'Am beliebtesten'],
        es: ['Compra más y ahorra más', 'Corrector de juanete', 'Correctores de juanetes', 'Se puede usar en el pie izquierdo o derecho', 'Uno para cada pie: úsalos en ambos pies', 'Empieza con 1', 'Más popular'],
        it: ['Acquista di più, risparmia di più', 'Correttore per alluce valgo', 'Correttori per alluce valgo', 'Utilizzabile sul piede sinistro o destro', 'Uno per piede: indossali entrambi', 'Inizia con 1', 'Più popolare'],
        nl: ['Koop meer, bespaar meer', 'Halluxvalguscorrector', 'Halluxvalguscorrectoren', 'Geschikt voor de linker- of rechtervoet', 'Eén voor elke voet – draag ze allebei', 'Begin met 1', 'Meest populair'],
        pt: ['Compre mais, poupe mais', 'Corretor de joanetes', 'Corretores de joanetes', 'Pode ser usado no pé esquerdo ou direito', 'Um para cada pé – use nos dois', 'Comece com 1', 'Mais popular'],
        ja: ['まとめ買いでさらにお得', '外反母趾矯正器', '外反母趾矯正器', '左右どちらの足にも使用できます', '左右それぞれに1つずつ、両足に装着', '1個から始める', '人気商品'],
        ko: ['더 많이 구매하고 더 많이 할인받으세요', '무지외반증 교정기', '무지외반증 교정기', '왼발 또는 오른발 모두 사용 가능', '양쪽 발에 하나씩 착용하세요', '1개부터 시작', '가장 인기'],
        ru: ['Покупайте больше — экономьте больше', 'Корректор косточки', 'Корректоры косточки', 'Подходит для левой или правой ноги', 'По одному на каждую ногу — носите на обеих', 'Начните с 1', 'Популярный выбор'],
        'zh': ['买得越多，省得越多', '拇外翻矫正器', '拇外翻矫正器', '左右脚均可使用', '左右脚各一个，同时穿戴', '从 1 个开始', '最受欢迎'],
        vi: ['Mua nhiều, tiết kiệm nhiều', 'Đai chỉnh ngón chân cái', 'Đai chỉnh ngón chân cái', 'Dùng được cho chân trái hoặc chân phải', 'Mỗi chân một chiếc – đeo cả hai bên', 'Bắt đầu với 1 chiếc', 'Phổ biến nhất'],
      }[ngp_language];
      if (!ngp_copy) return;
      const [ngp_heading, ngp_single, ngp_plural, ngp_descOne, ngp_descTwo, ngp_start, ngp_popular] = ngp_copy;
      const ngp_replacements = new Map([
        ['Buy More, Save More', ngp_heading], ['Buy More Save More', ngp_heading],
        ['1 Bunion Corrector', `1 ${ngp_single}`], ['2 Bunion Correctors', `2 ${ngp_plural}`],
        ['Works on either the left or right foot', ngp_descOne],
        ['One for Each Foot – Wear Both Together', ngp_descTwo], ['One for Each Foot - Wear Both Together', ngp_descTwo],
        ['START WITH 1', ngp_start], ['MOST POPULAR', ngp_popular],
      ]);
      const ngp_walk = ngp_node => {
        if (ngp_node.nodeType === Node.TEXT_NODE) {
          const ngp_original = ngp_node.nodeValue.trim().replace(/\s+/g, ' ');
          const ngp_translation = ngp_replacements.get(ngp_original);
          if (ngp_translation) ngp_node.nodeValue = ngp_node.nodeValue.replace(ngp_original, ngp_translation);
          return;
        }
        if (ngp_node.nodeType === Node.ELEMENT_NODE && ngp_node.matches('script,style')) return;
        ngp_node.childNodes.forEach(ngp_walk);
      };
      ngp_walk(ngp_widgetRoot);
    };
    const ngp_syncReelsV3FirstTierLabel = ngp_widgetRoot => {
      if (!ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3')) return;
      const ngp_firstTier = ngp_widgetRoot.querySelector('[data-tier-index="0"]');
      const ngp_nameRow = ngp_firstTier?.querySelector('.bd-tier__name-row');
      if (!ngp_firstTier || !ngp_nameRow || ngp_nameRow.querySelector('.bd-tier__label')) return;
      const ngp_catalogElement = document.getElementById('bundle-deals-catalog');
      if (!ngp_catalogElement) return;
      let ngp_deals;
      try {
        ngp_deals = JSON.parse(ngp_catalogElement.textContent || '[]');
      } catch (ngp__) {
        return;
      }
      const ngp_tierInput = ngp_firstTier.querySelector('input[type="radio"]');
      const ngp_dealId = ngp_tierInput?.name.match(/^bd-tier-(.+)$/)?.[1];
      const ngp_deal = ngp_deals.find(ngp_item => ngp_item.id === ngp_dealId);
      const ngp_tier = ngp_deal?.blocks?.[Number(ngp_firstTier.dataset.tierIndex)];
      if (!ngp_tier?.label?.trim()) return;

      // The bundle app only renders label chips on discounted tiers. Reel V3's
      // first tier has its own catalog label, but no discount, so render that
      // label using the app's native chip class.
      const ngp_locale = window.Shopify?.locale || document.documentElement.lang;
      const ngp_translatedLabel = ngp_deal.translations?.[ngp_locale]?.blocks?.[ngp_tier.id]?.label;
      const ngp_label = document.createElement('span');
      ngp_label.className = 'bd-tier__label';
      ngp_label.dataset.altaeronTierLabel = '0';
      ngp_label.textContent = (ngp_translatedLabel || ngp_tier.label).replace('{{saved_total}}', ngp_money(0, ngp_format)).replace('{{saved_percent}}', '0%');
      ngp_nameRow.append(ngp_label);
    };
    const ngp_syncBundlePricing = () => {
      const ngp_control = ngp_chosenControl();
      if (!ngp_control) return;
      const ngp_basePrice = Number(ngp_control.dataset.price || 0);
      const ngp_baseCompare = Number(ngp_control.dataset.compare || 0);
      if (ngp_bundleWidget) {
        const ngp_widgetRoot = ngp_bundleWidget.shadowRoot || ngp_bundleWidget;
        ngp_translateReelsV3Bundle(ngp_widgetRoot);
        ngp_syncBundleTierPrices(ngp_widgetRoot, ngp_baseCompare, ngp_basePrice);
        ngp_syncReelsV3FirstTierLabel(ngp_widgetRoot);
      }
      const ngp_bundle = ngp_selectedBundle();
      if (!ngp_bundle?.price) return;
      const ngp_bundleCompare = ngp_baseCompare > ngp_basePrice ? ngp_baseCompare * ngp_bundle.quantity : ngp_bundle.compare || ngp_basePrice * ngp_bundle.quantity;
      const ngp_bundleSavings = Math.max(ngp_bundleCompare - ngp_bundle.price, 0);
      if (ngp_stickyBundleTitle) {
        ngp_stickyBundleTitle.hidden = !ngp_bundle.title;
        ngp_stickyBundleTitle.textContent = ngp_bundle.title || '';
      }
      if (ngp_currentPrice) ngp_currentPrice.textContent = ngp_money(ngp_bundle.price, ngp_format);
      if (ngp_stickyPrice) ngp_stickyPrice.textContent = ngp_money(ngp_bundle.price, ngp_format);
      [ngp_comparePrice, ngp_stickyCompare].forEach(ngp_element => {
        if (!ngp_element) return;
        ngp_element.hidden = ngp_bundleSavings <= 0;
        if (ngp_bundleSavings > 0) ngp_element.textContent = ngp_money(ngp_bundleCompare, ngp_format);
      });
      [ngp_savings, ngp_stickySavings].forEach(ngp_element => {
        if (!ngp_element) return;
        ngp_element.hidden = ngp_bundleSavings <= 0;
        if (ngp_bundleSavings > 0) ngp_element.textContent = ngp_savingsText(ngp_bundleSavings);
      });
      if (ngp_ctaPrice) ngp_ctaPrice.textContent = ` — ${ngp_money(ngp_bundle.price, ngp_format)}`;
      if (ngp_root.dataset.bundleCtaOne || ngp_root.dataset.bundleCtaMany) {
        const ngp_ctaText = ngp_bundle.quantity === 1 ? ngp_fillTemplate(ngp_root.dataset.bundleCtaOne, {
          price: ngp_money(ngp_bundle.price, ngp_format)
        }) : ngp_fillTemplate(ngp_root.dataset.bundleCtaMany, {
          count: String(ngp_bundle.quantity),
          price: ngp_money(ngp_bundle.price, ngp_format)
        });
        const ngp_ctaTextWithoutPrice = ngp_ctaText.replace(/\s*[—-]\s*[^—-]+$/, '').trim();
        if (ngp_submitLabel) ngp_submitLabel.textContent = ngp_ctaTextWithoutPrice;
        if (ngp_stickyText) ngp_stickyText.textContent = ngp_ctaText;
      }
      ngp_updateRelatedPrices(ngp_bundle.price, ngp_bundleCompare);
    };
    let ngp_bundleFrame;
    const ngp_scheduleBundlePricing = () => {
      window.cancelAnimationFrame(ngp_bundleFrame);
      ngp_bundleFrame = window.requestAnimationFrame(ngp_syncBundlePricing);
    };
    ngp_select?.addEventListener('change', () => {
      ngp_update();
      ngp_scheduleBundlePricing();
    });
    ngp_radios.forEach(ngp_radio => ngp_radio.addEventListener('change', () => {
      ngp_update();
      ngp_scheduleBundlePricing();
    }));
    if (ngp_bundleWidget) {
      const ngp_observedRoots = new WeakSet();
      const ngp_observeBundleRoot = ngp_observedRoot => {
        if (!ngp_observedRoot || ngp_observedRoots.has(ngp_observedRoot)) return;
        ngp_observedRoots.add(ngp_observedRoot);
        ['change', 'input', 'click'].forEach(ngp_eventName => ngp_observedRoot.addEventListener(ngp_eventName, ngp_scheduleBundlePricing, true));
        new MutationObserver(ngp_scheduleBundlePricing).observe(ngp_observedRoot, {
          attributes: true,
          attributeFilter: ['checked', 'class', 'aria-checked'],
          childList: true,
          subtree: true
        });
      };
      ngp_observeBundleRoot(ngp_bundleWidget);
      ngp_observeBundleRoot(ngp_bundleWidget.shadowRoot);
      if (ngp_bundleWidget.localName.includes('-')) {
        window.customElements?.whenDefined(ngp_bundleWidget.localName).then(() => {
          ngp_observeBundleRoot(ngp_bundleWidget.shadowRoot);
          ngp_scheduleBundlePricing();
        });
      }
    }
    ngp_update(false);
    ngp_scheduleBundlePricing();
  }
  function ngp_initSticky(ngp_root) {
    const ngp_externalFinal = ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3') ? document.querySelector('[data-apdp-v3-final]') : null;
    const ngp_sticky = ngp_root.querySelector('[data-apdp-sticky]');
    const ngp_purchaseButton = ngp_root.querySelector('[data-apdp-submit]');
    const ngp_primaryPurchase = ngp_root.querySelector('[data-apdp-primary-purchase]');
    const ngp_stickyButton = ngp_root.querySelector('[data-apdp-sticky-submit]');
    const ngp_finalButton = ngp_root.querySelector('[data-apdp-final-submit]') || ngp_externalFinal?.querySelector('[data-apdp-final-submit]');
    const ngp_tryButton = ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3') ? document.querySelector('[data-apdp-try-submit]') : null;
    const ngp_form = ngp_root.querySelector('.ngp-apdp-form');
    const ngp_finalCta = ngp_root.querySelector('.ngp-apdp-final-cta, .ngp-apdp-dialfit-bottom') || ngp_externalFinal?.querySelector('.ngp-apdp-final-cta');
    if (!ngp_sticky || !ngp_purchaseButton || !ngp_stickyButton || !ngp_form) return;
    const ngp_mobile = window.matchMedia('(max-width: 749px)');
    let ngp_purchaseIsPast = false;
    let ngp_finalCtaIsVisible = false;
    const ngp_updateVisibility = () => {
      ngp_sticky.hidden = !ngp_mobile.matches || !ngp_purchaseIsPast || ngp_finalCtaIsVisible;
    };
    const ngp_observer = new IntersectionObserver(([ngp_entry]) => {
      ngp_purchaseIsPast = !ngp_entry.isIntersecting && (!ngp_primaryPurchase || ngp_entry.boundingClientRect.bottom <= 0);
      ngp_updateVisibility();
    }, {
      threshold: 0
    });
    ngp_observer.observe(ngp_primaryPurchase || ngp_purchaseButton);
    if (ngp_finalCta) {
      const ngp_finalCtaObserver = new IntersectionObserver(([ngp_entry]) => {
        ngp_finalCtaIsVisible = ngp_entry.isIntersecting;
        ngp_updateVisibility();
      }, {
        threshold: 0
      });
      ngp_finalCtaObserver.observe(ngp_finalCta);
    }
    ngp_mobile.addEventListener?.('change', ngp_updateVisibility);
    ngp_stickyButton.addEventListener('click', () => {
      if (!ngp_stickyButton.disabled) ngp_form.requestSubmit();
    });
    ngp_finalButton?.addEventListener('click', () => {
      if (!ngp_finalButton.disabled) ngp_form.requestSubmit(ngp_purchaseButton);
    });
    ngp_tryButton?.addEventListener('click', () => {
      if (!ngp_tryButton.disabled) ngp_form.requestSubmit(ngp_purchaseButton);
    });
  }
  function ngp_initLazyVideos(ngp_root) {
    const ngp_media = [...ngp_root.querySelectorAll('[data-apdp-lazy-video]')];
    if (!ngp_media.length) return;
    const ngp_hydrate = ngp_element => {
      if (ngp_element.dataset.apdpVideoLoaded === 'true') return;
      ngp_element.dataset.apdpVideoLoaded = 'true';
      if (ngp_element.tagName === 'IFRAME') {
        if (ngp_element.dataset.src) {
          ngp_element.src = ngp_element.dataset.src;
          ngp_element.removeAttribute('data-src');
        }
        return;
      }
      ngp_element.querySelectorAll('source[data-src]').forEach(ngp_source => {
        ngp_source.src = ngp_source.dataset.src;
        ngp_source.removeAttribute('data-src');
      });
      ngp_element.load();
      if (ngp_element.autoplay) ngp_element.play().catch(() => {});
    };
    const ngp_startObserving = () => {
      if (!('IntersectionObserver' in window)) {
        ngp_media.forEach(ngp_hydrate);
        return;
      }
      const ngp_observer = new IntersectionObserver(ngp_entries => {
        ngp_entries.forEach(ngp_entry => {
          if (!ngp_entry.isIntersecting) return;
          ngp_hydrate(ngp_entry.target);
          ngp_observer.unobserve(ngp_entry.target);
        });
      }, {
        rootMargin: '300px 0px'
      });
      ngp_media.forEach(ngp_element => ngp_observer.observe(ngp_element));
    };
    if (document.readyState === 'complete') ngp_startObserving();else window.addEventListener('load', ngp_startObserving, {
      once: true
    });
  }
  function ngp_initHeroExperience(ngp_root) {
    const ngp_motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ngp_video = ngp_root.querySelector('[data-apdp-hero-video]');
    const ngp_bundleCta = ngp_root.querySelector('[data-apdp-bundle-cta]');
    let ngp_videoIsVisible = true;
    let ngp_videoMayStart = ngp_video?.hasAttribute('data-apdp-eager-video') || false;
    let ngp_videoSourcesLoaded = false;
    const ngp_loadVideoSources = () => {
      if (!ngp_video || ngp_videoSourcesLoaded) return;
      ngp_videoSourcesLoaded = true;
      let ngp_hasDeferredSources = false;
      ngp_video.querySelectorAll('source[data-src]').forEach(ngp_source => {
        ngp_source.src = ngp_source.dataset.src;
        ngp_source.removeAttribute('data-src');
        ngp_hasDeferredSources = true;
      });
      if (ngp_hasDeferredSources) ngp_video.load();
    };
    const ngp_syncVideo = () => {
      if (!ngp_video) return;
      ngp_video.muted = true;
      ngp_video.defaultMuted = true;
      const ngp_galleryStage = ngp_video.closest('.ngp-apdp-gallery__stage');
      if (ngp_motionPreference.matches && !ngp_video.hasAttribute('data-apdp-eager-video')) {
        ngp_video.pause();
        ngp_video.controls = true;
        ngp_loadVideoSources();
        ngp_galleryStage?.classList.add('is-video-controls-visible');
        return;
      }
      ngp_galleryStage?.classList.remove('is-video-controls-visible');
      ngp_video.controls = false;
      if (ngp_videoMayStart && ngp_videoIsVisible && !document.hidden) {
        ngp_loadVideoSources();
        ngp_video.play().catch(() => {});
      } else ngp_video.pause();
    };
    const ngp_scheduleVideoStart = () => {
      const ngp_startWhenIdle = () => {
        ngp_videoMayStart = true;
        ngp_syncVideo();
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(ngp_startWhenIdle, { timeout: 2500 });else window.setTimeout(ngp_startWhenIdle, 1500);
    };
    ngp_video?.addEventListener('playing', () => ngp_video.closest('.ngp-apdp-gallery__stage')?.classList.add('is-video-playing'), { once: true });
    if (ngp_video && 'IntersectionObserver' in window) {
      const ngp_observer = new IntersectionObserver(([ngp_entry]) => {
        ngp_videoIsVisible = ngp_entry.isIntersecting;
        ngp_syncVideo();
      }, {
        threshold: 0.08
      });
      ngp_observer.observe(ngp_video);
    }
    if (ngp_video) {
      document.addEventListener('visibilitychange', ngp_syncVideo);
      ngp_motionPreference.addEventListener?.('change', ngp_syncVideo);
      ngp_syncVideo();
      if (document.readyState === 'complete') ngp_scheduleVideoStart();else window.addEventListener('load', ngp_scheduleVideoStart, { once: true });
    }
    ngp_bundleCta?.addEventListener('click', ngp_event => {
      const ngp_targetId = ngp_bundleCta.getAttribute('href')?.slice(1);
      const ngp_target = ngp_targetId ? document.getElementById(ngp_targetId) : null;
      if (!ngp_target) return;
      ngp_event.preventDefault();
      ngp_target.scrollIntoView({
        behavior: ngp_motionPreference.matches ? 'auto' : 'smooth',
        block: 'start'
      });
      ngp_target.focus({
        preventScroll: true
      });
    });
  }
  function ngp_initMedicalReviewLink(ngp_root) {
    const ngp_link = ngp_root.querySelector('[data-apdp-medical-review-link]');
    if (!ngp_link) return;
    const ngp_target = ngp_root.querySelector(ngp_link.hash);
    if (!ngp_target) return;
    ngp_link.addEventListener('click', ngp_event => {
      if (ngp_event.button !== 0 || ngp_event.metaKey || ngp_event.ctrlKey || ngp_event.shiftKey || ngp_event.altKey) return;
      ngp_event.preventDefault();
      const ngp_reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ngp_target.scrollIntoView({
        behavior: ngp_reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      window.history.pushState(null, '', ngp_link.hash);
      ngp_target.focus({
        preventScroll: true
      });
    });
  }
  function ngp_initRatingReviewLink(ngp_root) {
    if (!ngp_root.classList.contains('ngp-altaeron-pdp--reels-v3')) return;
    const ngp_link = ngp_root.querySelector('[data-apdp-rating-link]');
    const ngp_target = ngp_link ? document.querySelector(ngp_link.hash) : null;
    if (!ngp_link || !ngp_target) return;
    ngp_link.addEventListener('click', ngp_event => {
      if (ngp_event.button !== 0 || ngp_event.metaKey || ngp_event.ctrlKey || ngp_event.shiftKey || ngp_event.altKey) return;
      ngp_event.preventDefault();
      const ngp_reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ngp_target.scrollIntoView({ behavior: ngp_reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }
  function ngp_initStepTimelines(ngp_root) {
    ngp_root.querySelectorAll('[data-apdp-step-timeline]').forEach(ngp_timeline => {
      if (ngp_timeline.dataset.timelineReady === 'true') return;
      ngp_timeline.dataset.timelineReady = 'true';
      const ngp_steps = [...ngp_timeline.querySelectorAll('[data-apdp-step]')];
      if (!ngp_steps.length) return;
      const ngp_motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      let ngp_timers = [];
      let ngp_isVisible = false;
      const ngp_clearTimers = () => {
        ngp_timers.forEach(window.clearTimeout);
        ngp_timers = [];
      };
      const ngp_setStepState = (ngp_step, ngp_state) => {
        ngp_step.dataset.stepState = ngp_state;
        if (ngp_state === 'current') ngp_step.setAttribute('aria-current', 'step');else ngp_step.removeAttribute('aria-current');
      };
      const ngp_finish = () => {
        ngp_clearTimers();
        ngp_timeline.classList.add('is-animation-ready');
        ngp_steps.forEach(ngp_step => ngp_setStepState(ngp_step, 'complete'));
      };
      const ngp_play = () => {
        if (!ngp_isVisible || ngp_motionPreference.matches) return;
        ngp_clearTimers();
        ngp_timeline.classList.add('is-animation-ready');
        ngp_steps.forEach(ngp_step => ngp_setStepState(ngp_step, 'upcoming'));
        ngp_steps.forEach((ngp_step, ngp_index) => {
          ngp_timers.push(window.setTimeout(() => {
            if (ngp_index > 0) ngp_setStepState(ngp_steps[ngp_index - 1], 'complete');
            ngp_setStepState(ngp_step, 'current');
          }, ngp_index * 650));
        });
        ngp_timers.push(window.setTimeout(() => {
          ngp_setStepState(ngp_steps[ngp_steps.length - 1], 'complete');
          ngp_timers.push(window.setTimeout(ngp_play, 1200));
        }, ngp_steps.length * 650));
      };
      if (!('IntersectionObserver' in window)) {
        ngp_finish();
        return;
      }
      const ngp_observer = new IntersectionObserver(([ngp_entry]) => {
        ngp_isVisible = ngp_entry.isIntersecting;
        if (ngp_isVisible && !ngp_motionPreference.matches) ngp_play();else ngp_clearTimers();
      }, {
        threshold: 0.35
      });
      ngp_observer.observe(ngp_timeline);
      if (ngp_motionPreference.matches) ngp_finish();
      ngp_motionPreference.addEventListener?.('change', ngp_event => {
        if (ngp_event.matches) ngp_finish();else if (ngp_isVisible) ngp_play();
      });
    });
  }
  function ngp_initReviewSliders(ngp_root) {
    ngp_root.querySelectorAll('[data-apdp-review-slider]').forEach(ngp_slider => {
      const ngp_group = ngp_slider.closest('[data-apdp-review-slider-group]');
      const ngp_previous = ngp_group?.querySelector('[data-apdp-review-prev]');
      const ngp_next = ngp_group?.querySelector('[data-apdp-review-next]');
      if (!ngp_previous || !ngp_next) return;
      const ngp_card = () => ngp_slider.querySelector('.ngp-apdp-tail-review');
      const ngp_step = () => {
        const ngp_item = ngp_card();
        if (!ngp_item) return ngp_slider.clientWidth;
        const ngp_styles = window.getComputedStyle(ngp_slider.querySelector('.ngp-apdp-tail-review-grid'));
        return ngp_item.getBoundingClientRect().width + Number.parseFloat(ngp_styles.columnGap || ngp_styles.gap || 0);
      };
      const ngp_update = () => {
        const ngp_maximum = Math.max(0, ngp_slider.scrollWidth - ngp_slider.clientWidth);
        ngp_previous.disabled = ngp_slider.scrollLeft <= 2;
        ngp_next.disabled = ngp_slider.scrollLeft >= ngp_maximum - 2;
      };
      ngp_previous.addEventListener('click', () => ngp_slider.scrollBy({
        left: -ngp_step(),
        behavior: 'smooth'
      }));
      ngp_next.addEventListener('click', () => ngp_slider.scrollBy({
        left: ngp_step(),
        behavior: 'smooth'
      }));
      ngp_slider.addEventListener('scroll', ngp_update, {
        passive: true
      });
      window.addEventListener('resize', ngp_update, {
        passive: true
      });
      ngp_update();
    });
  }
  function ngp_init(ngp_root) {
    if (!ngp_root || ngp_root.dataset.apdpReady === 'true') return;
    ngp_root.dataset.apdpReady = 'true';
    ngp_initPromotion(ngp_root);
    ngp_initDeliveryEstimate(ngp_root);
    ngp_initHeroExperience(ngp_root);
    ngp_initSocialProof(ngp_root);
    const ngp_activateMedia = ngp_initGallery(ngp_root);
    ngp_initQuantity(ngp_root);
    ngp_initVariants(ngp_root, ngp_activateMedia);
    ngp_initSticky(ngp_root);
    ngp_initMedicalReviewLink(ngp_root);
    ngp_initRatingReviewLink(ngp_root);
    ngp_initLazyVideos(ngp_root);
    ngp_initReviewSliders(ngp_root);
    ngp_initStepTimelines(ngp_root);
  }
  const ngp_initAll = (ngp_scope = document) => ngp_scope.querySelectorAll(ngp_SELECTOR).forEach(ngp_init);
  if (!window.__ngpPdpZoomBound) {
    window.__ngpPdpZoomBound = true;
    document.addEventListener('click', ngp_handleZoomClick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => ngp_initAll());else ngp_initAll();
  document.addEventListener('shopify:section:load', ngp_event => ngp_initAll(ngp_event.target));
})();

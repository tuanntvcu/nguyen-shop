(function () {
  const formatMoney = (cents) => {
    if (window.ScaloraTheme && ScaloraTheme.Currency && ScaloraTheme.settings) {
      return ScaloraTheme.Currency.formatMoney(cents, ScaloraTheme.settings.moneyFormat);
    }

    return (Number(cents) / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: window.Shopify && Shopify.currency ? Shopify.currency.active : 'USD',
    });
  };

  const setupVideos = (root) => {
    const videos = root.querySelectorAll('video');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    videos.forEach((video) => {
      if (reducedMotion) {
        video.pause();
        video.removeAttribute('autoplay');
      }
    });

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target;
              const shouldAutoplay = video.dataset.apdpAutoplay === 'true';
              if (entry.isIntersecting && entry.intersectionRatio > 0.45 && shouldAutoplay && !reducedMotion) {
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            });
          },
          { threshold: [0, 0.45, 0.75] }
        )
      : null;

    videos.forEach((video) => {
      if (observer && video.dataset.apdpAutoplay === 'true') observer.observe(video);
    });

    root.querySelectorAll('[data-apdp-video-toggle]').forEach((button) => {
      const video = button.closest('.apdp-hero__media') && button.closest('.apdp-hero__media').querySelector('video');
      if (!video) return;

      button.addEventListener('click', () => {
        video.muted = !video.muted;
        button.classList.toggle('is-unmuted', !video.muted);
        button.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        const label = button.querySelector('[data-apdp-sound-label]');
        if (label) label.textContent = video.muted ? 'Sound off' : 'Sound on';
      });
    });

    root.querySelectorAll('[data-apdp-video-replay]').forEach((button) => {
      const video = button.closest('.apdp-video-card')?.querySelector('video');
      if (!video) return;

      button.addEventListener('click', () => {
        video.currentTime = 0;
        video.play().catch(() => {});
        button.closest('.apdp-video-card')?.classList.add('is-playing');
      });
      video.addEventListener('pause', () => button.closest('.apdp-video-card')?.classList.remove('is-playing'));
      video.addEventListener('ended', () => button.closest('.apdp-video-card')?.classList.remove('is-playing'));
    });

    root.querySelectorAll('.apdp-card__media, .apdp-featured-review__media, .apdp-ugc__media').forEach((media) => {
      const video = media.querySelector('video');
      if (!video) return;

      media.tabIndex = 0;
      media.setAttribute('role', 'button');
      media.setAttribute('aria-label', 'Play video');
      const toggle = () => {
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
        media.classList.toggle('is-playing', !video.paused);
        media.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
      };
      media.addEventListener('click', toggle);
      media.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle();
      });
    });
  };

  const setupVariantPrice = (root) => {
    const select = root.querySelector('[data-apdp-variant-select]');
    if (!select) return;

    const variantsScript = root.querySelector('[data-apdp-product-json]');
    const variants = variantsScript ? JSON.parse(variantsScript.textContent) : [];
    const sectionId = root.dataset.section;
    const currentPrice = root.querySelector('[data-apdp-current-price]');
    const comparePrice = root.querySelector('[data-apdp-compare-price]');
    const submit = root.querySelector('.apdp-form [name="add"]');
    const submitText = submit && submit.querySelector('span');
    if (submitText) submitText.dataset.availableText = submitText.textContent;

    const update = () => {
      const option = select.selectedOptions[0];
      if (!option) return;

      const price = Number(option.dataset.price || 0);
      const compare = Number(option.dataset.comparePrice || 0);
      const available = option.dataset.available === 'true';

      if (currentPrice) currentPrice.textContent = formatMoney(price);
      if (comparePrice) {
        comparePrice.hidden = !(compare > price);
        if (compare > price) comparePrice.textContent = formatMoney(compare);
      }

      if (submit) {
        submit.disabled = !available;
        submit.toggleAttribute('aria-disabled', !available);
      }
      if (submitText && window.ScaloraTheme && ScaloraTheme.variantStrings) {
        submitText.textContent = available ? submitText.dataset.availableText : ScaloraTheme.variantStrings.soldOut;
      }

      if (window.ScaloraTheme && ScaloraTheme.pubsub && ScaloraTheme.pubsub.PUB_SUB_EVENTS) {
        const variant = variants.find((item) => String(item.id) === String(option.value));
        ScaloraTheme.pubsub.publish(ScaloraTheme.pubsub.PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html: document,
            variant,
          },
        });
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('variant', option.value);
      window.history.replaceState({}, '', nextUrl);
    };

    select.addEventListener('change', update);
    update();
  };

  const setupCarousels = (root) => {
    root.querySelectorAll('[data-apdp-carousel]').forEach((carousel) => {
      carousel.tabIndex = 0;
      carousel.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        carousel.scrollBy({ left: direction * carousel.clientWidth * 0.8, behavior: 'smooth' });
      });
    });

    const ugcSlider = root.querySelector('[data-apdp-ugc-slider]');
    const dots = [...root.querySelectorAll('[data-apdp-ugc-dots] button')];
    if (!ugcSlider || dots.length === 0) return;

    let frame;
    const setActiveDot = (index) => {
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };

    const updateDots = () => {
      frame = null;
      const maxScroll = ugcSlider.scrollWidth - ugcSlider.clientWidth;
      const progress = maxScroll > 0 ? ugcSlider.scrollLeft / maxScroll : 0;
      setActiveDot(Math.round(progress * (dots.length - 1)));
    };

    ugcSlider.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(updateDots);
    }, { passive: true });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        const maxScroll = ugcSlider.scrollWidth - ugcSlider.clientWidth;
        const left = dots.length > 1 ? maxScroll * index / (dots.length - 1) : 0;
        ugcSlider.scrollTo({ left, behavior: 'smooth' });
      });
    });

    updateDots();
  };

  const setupJudgeReview = (root) => {
    const featured = root.querySelector('[data-apdp-judge-featured]');
    const widget = root.querySelector('.apdp-reviews');
    if (!featured || !widget) return;

    const populate = () => {
      const review = widget.querySelector('.jdgm-rev');
      if (!review) return false;

      const body = review.querySelector('.jdgm-rev__body, .jdgm-rev__body p')?.textContent.trim();
      const author = review.querySelector('.jdgm-rev__author')?.textContent.trim();
      if (!body || !author) return false;

      const ratingElement = review.querySelector('.jdgm-rev__rating');
      const rating = Math.max(1, Math.min(5, Math.round(Number(
        ratingElement?.dataset.score || ratingElement?.getAttribute('data-score') || 5
      ))));
      featured.querySelector('[data-apdp-review-stars]').textContent = '\u2605'.repeat(rating);
      featured.querySelector('[data-apdp-review-stars]').setAttribute('aria-label', `${rating} out of 5 stars`);
      featured.querySelector('[data-apdp-review-body]').textContent = body;
      featured.querySelector('[data-apdp-review-author]').textContent = `- ${author}`;

      const reviewImage = review.querySelector('.jdgm-rev__pic-img, .jdgm-rev__pics img');
      const media = featured.querySelector('.apdp-featured-review__media');
      if (reviewImage && media) {
        const image = reviewImage.cloneNode(true);
        image.removeAttribute('width');
        image.removeAttribute('height');
        image.alt = `Customer review by ${author}`;
        media.replaceChildren(image);
        media.removeAttribute('role');
        media.removeAttribute('tabindex');
      }

      featured.hidden = false;
      return true;
    };

    if (populate()) return;
    const observer = new MutationObserver(() => {
      if (populate()) observer.disconnect();
    });
    observer.observe(widget, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  };

  const setupFaq = (root) => {
    const items = [...root.querySelectorAll('.apdp-faq__item')];
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  };

  const init = (root) => {
    if (root.dataset.apdpInitialized === 'true') return;
    root.dataset.apdpInitialized = 'true';
    document.body.classList.add('altaeron-pdp-active');
    setupVideos(root);
    setupVariantPrice(root);
    setupCarousels(root);
    setupFaq(root);
    setupJudgeReview(root);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.altaeron-pdp').forEach(init);
  });

  document.addEventListener('shopify:section:load', (event) => {
    const root = event.target.querySelector('.altaeron-pdp');
    if (root) init(root);
  });
})();

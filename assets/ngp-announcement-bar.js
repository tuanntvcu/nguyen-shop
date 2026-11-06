(() => {
  const ngpStartAnnouncementRotators = () => {
    document.querySelectorAll('[data-ngp-announcement-rotator]').forEach((ngpRotator) => {
      const ngpSlides = [...ngpRotator.querySelectorAll('.ngp-announcement__slide')];
      const ngpInterval = Number(ngpRotator.dataset.interval) || 5000;
      if (ngpSlides.length < 2) return;
      let ngpCurrent = ngpSlides.findIndex((ngpSlide) => ngpSlide.classList.contains('is-active'));
      window.setInterval(() => {
        ngpSlides[ngpCurrent].hidden = true;
        ngpSlides[ngpCurrent].classList.remove('is-active');
        ngpCurrent = (ngpCurrent + 1) % ngpSlides.length;
        ngpSlides[ngpCurrent].hidden = false;
        ngpSlides[ngpCurrent].classList.add('is-active');
      }, ngpInterval);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ngpStartAnnouncementRotators, { once: true });
  else ngpStartAnnouncementRotators();
})();

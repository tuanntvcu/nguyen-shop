(() => {
  const ngpFooterViewport = window.matchMedia('(max-width: 749px)');
  const ngpSyncFooterAccordions = () => {
    document.querySelectorAll('[data-ngp-footer-accordion]').forEach((ngpNode) => {
      ngpNode.open = ngpFooterViewport.matches ? ngpNode.dataset.mobileOpen === 'true' : true;
    });
  };
  ngpSyncFooterAccordions();
  ngpFooterViewport.addEventListener?.('change', ngpSyncFooterAccordions);
})();

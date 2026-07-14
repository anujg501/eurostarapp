/* lightbox.js — site-wide click-to-expand for product imagery.
   Plain JS, event-delegated, runs independent of React render timing.
   Zoomable: the size-pad hero, PDP hero + thumbs, cart thumbnails,
   order-detail line images, and any <img> from assets/products/.
   Selection controls (colour cards, shape cards) are intentionally excluded. */
(function () {
  var ZOOM_CONTAINERS = '.pad-header-art, .pdp-main-img, .cart-group-art, .line-item-art, .polki-design-thumb';

  // Build overlay once
  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML =
    '<button class="lightbox-close" aria-label="Close (Esc)">&times;</button>' +
    '<div class="lightbox-stage"></div>' +
    '<div class="lightbox-cap"></div>';
  document.body.appendChild(overlay);
  var stage = overlay.querySelector('.lightbox-stage');
  var cap = overlay.querySelector('.lightbox-cap');

  function show() {
    overlay.style.display = 'flex';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
    stage.innerHTML = '';
    cap.textContent = '';
    document.body.style.overflow = '';
  }

  function openFromImg(img) {
    stage.style.background = '#fff';
    stage.innerHTML = '';
    var bi = document.createElement('img');
    bi.src = img.currentSrc || img.src;
    bi.alt = img.alt || '';
    bi.className = 'lightbox-photo';
    stage.appendChild(bi);
    cap.textContent = img.alt || '';
    show();
  }

  function openFromContainer(container) {
    var img = container.querySelector('img');
    if (img) { openFromImg(img); return; }
    // Vector gem render — clone the whole tile so the backdrop comes along
    var cs = getComputedStyle(container);
    stage.style.background = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? cs.backgroundColor : 'var(--paper-2)';
    if (cs.backgroundImage && cs.backgroundImage !== 'none') stage.style.background = cs.backgroundImage;
    stage.innerHTML = container.innerHTML;
    var svg = stage.querySelector('svg');
    if (svg) { svg.style.width = '58%'; svg.style.height = '58%'; svg.removeAttribute('style'); svg.style.width = '58%'; svg.style.height = '58%'; }
    cap.textContent = '';
    show();
  }

  document.addEventListener('click', function (e) {
    // Inside the overlay: close (but ignore clicks on the photo itself)
    if (overlay.contains(e.target)) {
      if (e.target.classList && e.target.classList.contains('lightbox-photo')) return;
      close();
      return;
    }
    // A real product photo anywhere
    var img = e.target.closest ? e.target.closest('img') : null;
    if (img && /assets\/products\//.test(img.getAttribute('src') || '')) {
      // only if not inside a selection control
      if (!img.closest('.color-pick-card, .shape-pick-card, .product-card, .cat-card, .grade-card')) {
        e.preventDefault(); e.stopPropagation();
        openFromImg(img);
        return;
      }
    }
    // A zoomable container (vector gem hero / thumbnail)
    var box = e.target.closest ? e.target.closest(ZOOM_CONTAINERS) : null;
    if (box) {
      // let interactive controls inside the container work (upload/remove buttons)
      if (e.target.closest('button, input, label, a, [data-no-zoom]')) return;
      // a design thumb with no real photo (placeholder) is not zoomable
      if (box.classList.contains('polki-design-thumb') && !box.querySelector('img')) return;
      e.preventDefault(); e.stopPropagation();
      openFromContainer(box);
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
})();

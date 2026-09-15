/* ═══════════════════════════════════════════════════════════════════
   ORTAK FOTOĞRAF GALERİSİ — davranış

   Stiller /css/gallery.css içinde. Sayfaya bu iki dosya eklendiğinde
   .gallery-strip şeritleri ve lightbox kendiliğinden kurulur; sayfanın
   ayrıca kod yazmasına gerek yoktur.

   Dışarıya açılan API (dinamik galeriler için, ör. etkinlik kartları):
     SiteGallery.open(items, index)  items: [{ full, cap, alt }]
     SiteGallery.refresh()           sonradan eklenen şeritleri bağlar
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Şerit kontrolleri (oklar, ilerleme çubuğu, fareyle sürükleme) ── */
  function setupStrip(strip) {
    if (!strip || strip.dataset.stripReady === 'true') return;
    strip.dataset.stripReady = 'true';

    var nav = strip.id
      ? document.querySelector('.gallery-nav[data-for="' + strip.id + '"]')
      : null;
    var prev     = nav ? nav.querySelector('.slider-prev') : null;
    var next     = nav ? nav.querySelector('.slider-next') : null;
    var progress = nav ? nav.querySelector('.slider-progress span') : null;

    var items = function () {
      return Array.prototype.slice.call(strip.querySelectorAll('.gallery-item'));
    };
    var maxScroll = function () {
      return Math.max(0, strip.scrollWidth - strip.clientWidth);
    };
    // Şeridin sol iç boşluğu varsa (bkz. .gallery-section) ilk kare
    // scrollLeft 0'da tam başa yaslansın diye hesaba katılır.
    var snapPos = function (item) {
      var pad = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
      return item.getBoundingClientRect().left - strip.getBoundingClientRect().left
             + strip.scrollLeft - pad;
    };

    var sync = function () {
      var max = maxScroll();
      if (prev) prev.disabled = strip.scrollLeft <= 1;
      if (next) next.disabled = strip.scrollLeft >= max - 1;
      if (progress) {
        var ratio = max > 0 ? strip.clientWidth / strip.scrollWidth : 1;
        var pos   = max > 0 ? strip.scrollLeft / max : 0;
        progress.style.width = (ratio * 100) + '%';
        progress.style.transform = 'translateX(' + (pos * (100 / ratio - 100)) + '%)';
      }
    };

    var goTo = function (dir) {
      var max   = maxScroll();
      var here  = strip.scrollLeft;
      var stops = items().map(snapPos).map(function (p) {
        return Math.min(Math.max(p, 0), max);
      });
      var found = dir > 0
        ? stops.filter(function (p) { return p > here + 1; })[0]
        : stops.filter(function (p) { return p < here - 1; }).pop();
      var target = found === undefined ? (dir > 0 ? max : 0) : found;
      strip.scrollTo({ left: target, behavior: reduced.matches ? 'auto' : 'smooth' });
    };

    if (prev) prev.addEventListener('click', function () { goTo(-1); });
    if (next) next.addEventListener('click', function () { goTo(1); });
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    // Yazı tipleri/görseller geç yüklenip şeridin genişliğini
    // değiştirebildiği için ilerleme çubuğu load'da bir kez daha ölçülür.
    window.addEventListener('load', sync);
    sync();

    /* Fare ile sürükleme; eşik aşılmadan tıklama iptal edilmiyor.
       Dokunmatikte tarayıcının kendi kaydırması kullanılır. */
    var down = false, moved = false, startX = 0, startScroll = 0;
    strip.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      down = true; moved = false; startX = e.pageX; startScroll = strip.scrollLeft;
    });
    strip.addEventListener('mousemove', function (e) {
      if (!down) return;
      var dx = e.pageX - startX;
      if (!moved && Math.abs(dx) < 5) return;
      if (!moved) { moved = true; strip.classList.add('is-dragging'); }
      e.preventDefault();
      strip.scrollLeft = startScroll - dx;
    });
    var endDrag = function () {
      if (!down) return;
      down = false;
      if (moved) setTimeout(function () { strip.classList.remove('is-dragging'); }, 0);
    };
    strip.addEventListener('mouseup', endDrag);
    strip.addEventListener('mouseleave', endDrag);
    strip.addEventListener('dragstart', function (e) { if (moved) e.preventDefault(); });
  }

  /* ── Lightbox ── */
  var box, boxImg, caption, closeBtn;
  var items = [], index = 0, lastFocused = null;

  function build() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'lightbox';
    box.id = 'lightbox';
    box.dataset.open = 'false';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Fotoğraf görüntüleyici');
    box.innerHTML =
      '<button class="lightbox-btn lightbox-close" id="lightbox-close" aria-label="Kapat">&#10005;</button>' +
      '<button class="lightbox-btn lightbox-prev"  id="lightbox-prev"  aria-label="Önceki fotoğraf">&#8592;</button>' +
      '<button class="lightbox-btn lightbox-next"  id="lightbox-next"  aria-label="Sonraki fotoğraf">&#8594;</button>' +
      '<img id="lightbox-img" src="" alt="">' +
      '<div class="lightbox-caption" id="lightbox-caption"></div>';
    document.body.appendChild(box);

    boxImg   = box.querySelector('#lightbox-img');
    caption  = box.querySelector('#lightbox-caption');
    closeBtn = box.querySelector('#lightbox-close');

    closeBtn.addEventListener('click', closeViaBack);
    box.querySelector('#lightbox-prev').addEventListener('click', function () { show(index - 1); });
    box.querySelector('#lightbox-next').addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) closeViaBack(); });

    document.addEventListener('keydown', function (e) {
      if (box.dataset.open !== 'true') return;
      if (e.key === 'Escape')     closeViaBack();
      if (e.key === 'ArrowLeft')  show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    var tx = 0;
    box.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      var d = e.changedTouches[0].clientX - tx;
      if (Math.abs(d) < 50) return;
      show(d > 0 ? index - 1 : index + 1);
    }, { passive: true });

    // Galeri açıkken geri (swipe/donanım/tarayıcı) tuşu sayfadan
    // çıkmak yerine önce galeriyi kapatsın.
    window.addEventListener('popstate', function () {
      if (box.dataset.open === 'true') close();
    });
  }

  function show(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    var it = items[index];
    boxImg.src = it.full;
    boxImg.alt = it.alt || '';
    caption.textContent = (it.cap || it.alt || '') + '  ·  ' + (index + 1) + ' / ' + items.length;
    if (it.el) it.el.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function open(list, i) {
    if (!list || !list.length) return;
    build();
    items = list;
    lastFocused = document.activeElement;
    show(i || 0);
    box.dataset.open = 'true';
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
    history.pushState({ galleryOpen: true }, '');
  }

  function close() {
    box.dataset.open = 'false';
    document.body.classList.remove('lightbox-open');
    boxImg.src = '';
    if (lastFocused) lastFocused.focus();
  }

  function closeViaBack() {
    if (history.state && history.state.galleryOpen) history.back(); else close();
  }

  /* ── Şeritleri ve tekil fotoğrafları bağla ──
     Bir şerit data-lb ile bir grup oluşturur; sayfaya serpiştirilmiş
     fotoğraflar data-lb + data-idx ile aynı gruba katılır. */
  var groups = {};

  function collect(strip) {
    groups[strip.dataset.lb] = Array.prototype.map.call(
      strip.querySelectorAll('.gallery-item'),
      function (el) {
        var img = el.querySelector('img');
        return {
          full: el.dataset.full || (img ? (img.currentSrc || img.src) : ''),
          cap:  el.dataset.cap || '',
          alt:  img ? img.alt : '',
          el:   el
        };
      }
    );
  }

  function refresh() {
    document.querySelectorAll('.gallery-strip').forEach(function (strip) {
      setupStrip(strip);
      if (!strip.dataset.lb) return;
      collect(strip);
      if (strip.dataset.lbReady === 'true') return;
      strip.dataset.lbReady = 'true';
      strip.querySelectorAll('.gallery-item').forEach(function (el, i) {
        el.addEventListener('click', function () {
          // Sürükleme sonrası gelen tıklamayı yut
          if (strip.classList.contains('is-dragging')) return;
          open(groups[strip.dataset.lb], i);
        });
      });
    });

    document.querySelectorAll('[data-lb][data-idx]').forEach(function (el) {
      if (el.dataset.lbReady === 'true') return;
      el.dataset.lbReady = 'true';
      el.addEventListener('click', function () {
        open(groups[el.dataset.lb], Number(el.dataset.idx) || 0);
      });
    });
  }

  window.SiteGallery = {
    open: function (list, i) { open(list, i); },
    refresh: refresh
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})();

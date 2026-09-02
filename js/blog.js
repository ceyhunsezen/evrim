/* Blog yazıları için ortak davranışlar.
 *
 * Yeni bir yazı eklerken yapılacak iki şey var:
 *   1. Künyeye okuma süresi kutusunu koy:
 *        <span data-okuma-suresi>5 dk okuma</span>
 *      İçindeki değer JS kapalıyken görünen yedektir; JS açıkken
 *      yazının gerçek uzunluğundan yeniden hesaplanır.
 *   2. </body> öncesine bu dosyayı ekle:
 *        <script src="/js/blog.js" defer></script>
 *
 * Süre .post-body içindeki metinden hesaplanır.
 */
(function () {
  'use strict';

  /* Türkçe bilimsel metin İngilizceden yavaş okunur (uzun, eklemeli
     kelimeler): dakikada ~160 kelime. Her görsel için 10 sn eklenir. */
  var KELIME_HIZI = 160;
  var GORSEL_SANIYE = 10;

  /* Okuma akışının dışında kalan, göz gezdirilen parçalar. */
  var HARIC = 'figcaption, .post-source, .post-byline, .post-paper-ref';

  function dakikaHesapla(govde) {
    var klon = govde.cloneNode(true);
    Array.prototype.forEach.call(klon.querySelectorAll(HARIC), function (el) {
      el.parentNode.removeChild(el);
    });

    var kelimeler = (klon.textContent || '')
      .split(/\s+/)
      .filter(function (k) { return /[0-9A-Za-zÇĞİÖŞÜçğıöşü]/.test(k); });

    var saniye = (kelimeler.length / KELIME_HIZI) * 60
      + govde.querySelectorAll('img').length * GORSEL_SANIYE;

    return Math.max(1, Math.round(saniye / 60));
  }

  function okumaSuresiniYaz() {
    var kutular = document.querySelectorAll('[data-okuma-suresi]');
    if (!kutular.length) return;

    var govde = document.querySelector('.post-body');
    if (!govde) return;

    var dk = dakikaHesapla(govde);
    Array.prototype.forEach.call(kutular, function (el) {
      el.textContent = dk + ' dk okuma';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', okumaSuresiniYaz);
  } else {
    okumaSuresiniYaz();
  }
})();

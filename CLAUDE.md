# Proje kuralları

## URL yapısı: hiçbir sayfa `.html` ile bitmemeli

Bu site statik olarak GitHub Pages üzerinden yayınlanıyor (bkz. `CNAME`) ve
sunucu taraflı yönlendirme yok. Bu yüzden **her sayfa temiz bir URL** ile
sunulmalı:

- ✅ Doğru: `bolum-adi/index.html` → `https://iuevrim.org/bolum-adi/`
- ❌ Yanlış: `bolum-adi/sayfa-adi.html` → `https://iuevrim.org/bolum-adi/sayfa-adi.html`

Yeni bir sayfa (blog yazısı, etkinlik, vb.) eklerken:

1. İçeriği `klasor-adi/index.html` olarak oluştur — dosya adı her zaman
   `index.html` olmalı, klasör adı slug'ı taşır.
2. Sayfa içindeki `<link rel="canonical">`, `og:url` ve `twitter:url` gibi
   meta etiketlerinde sonu `/` ile biten adresi kullan (örn.
   `https://iuevrim.org/makale-grubu/tardigradlar/`), `.html` uzantısı asla
   görünmemeli.
3. Diğer sayfalardan bu içeriğe verilen tüm `href`'leri de aynı temiz
   adrese göre yaz (göreli veya `/klasor-adi/` şeklinde kök-göreli).
4. `sitemap.xml`'e eklerken de `.html` uzantısı kullanma.

İstisna: `404.html` ve GitHub Pages'in kendisinin dosya adıyla aradığı
kök seviyesindeki özel dosyalar (`404.html` gibi) bu kuralın dışındadır.

Geçmişte bu kurala uyulmadığı için `makale-grubu/makale-grubu-tardigradlar.html`
adresi `makale-grubu/tardigradlar/` olarak taşındı; eski adres artık sadece
yeni adrese yönlendiren ince bir `<meta http-equiv="refresh">` sayfası
(`makale-grubu/makale-grubu-tardigradlar.html`, `noindex`). Böyle bir durumla
tekrar karşılaşılırsa aynı yöntem izlenmeli: dosyayı yeni konuma taşı, tüm
iç linkleri ve `sitemap.xml`'i güncelle, eski adrese de bu tarz bir
yönlendirme dosyası bırak.

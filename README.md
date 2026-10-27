# Görsel Operasyon

Görsel hazırlayan ekipler için çalışan raporları, görsel incelemesi, firma bazlı iş talepleri, aylık vardiyalar, süre analizi ve ofis gelir/gider kayıtlarını gösteren çalışan demo web uygulaması.

## Çalıştırma

Node.js 20 veya üzeri gerekir. Harici paket kurulumu yoktur.

```sh
npm run dev
```

Uygulama `http://127.0.0.1:5080/` adresinde açılır. Başka bir port için `PORT=5081 npm run dev` kullanın (PowerShell: `$env:PORT=5081; npm run dev`).

```sh
npm test
```

Test komutu alan kurallarına ait testleri çalıştırır. `npm run check` ayrıca JavaScript sözdizimini denetler.

## Yapı

- `dist/`: yayınlanabilir statik web uygulaması ve örnek SVG görseller.
- `dist/domain.mjs`: rapor, rol ve iş akışı kuralları.
- `dist/app.mjs`: ekranlar ve tarayıcı etkileşimleri.
- `tests/`: alan kuralları testleri.
- `docs/`: onaylanan ilk sürüm planı, kullanıcı rolleri, kullanım ve sonraki adımlar.
- `PRODUCT.md`, `DESIGN.md`, `.impeccable/`: ürün ve arayüz kararları.
- `.openai/hosting.json`: mevcut Sites projesinin statik yayın ayarı.

## Demo sınırları

İş talebinde firma adı ve Sosyal, Maç, Site veya Full Paket görsel türü seçilir. Atanan çalışan kendi işini Beklemede, Tasarım aşamasında, İptal veya Tamamlandı durumuna alabilir. Raporlar ekranı durum geçmişinden bekleme, tasarım ve teslim sürelerini hesaplar; **Excel için CSV indir** dosyası Excel'de açılabilir. Aylık vardiya düzeni seçilen hafta günlerine uygulanır; ek mesai ve izin nedeni ayrı kayıt olarak eklenir. Ofis paneli demo içinde yalnız sistem ve operasyon yöneticisi rollerinde görünür.

Veriler sentetiktir. Rol değiştirici gerçek kullanıcı girişi değildir; finans ve personel verilerinin gerçek erişim denetimi için sunucu tarafı kimlik doğrulama gerekir. Kayıtlar ve yüklenen görseller yalnızca kullanılan tarayıcının yerel alanında saklanır; ekip üyeleri arasında paylaşılmaz. Google Drive API bağlantısı, ortak veri tabanı ve üretim otomasyonları henüz yoktur. Eski demo işlerinde durum zaman damgaları olmadığı için süreler boş gösterilir; mevcut tarayıcı verileri sürüm yükseltmesinde korunur. Üretim kullanımına geçiş ihtiyaçları için [kullanım ve sonraki adımlar](docs/kullanim-ve-sonraki-adimlar.md) belgesine bakın.

Mevcut Sites demosu: https://gorsel-operasyon-ekim27.fair-snail-5311.chatgpt.site/ . Bu depoya yapılan commitler o siteyi otomatik olarak yayımlamaz. Sonraki geliştirmeler bu depoda yapılmalı; yayımlamadan önce `npm run check` çalıştırılıp `dist/` içeriği Sites projesine aktarılmalıdır.

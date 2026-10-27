# Personel ve Operasyon Takip Sistemi

<!-- impeccable:product-schema 1 -->

Bu başlık çalışma tanımıdır; ürünün marka adı henüz belirlenmedi.

## Platform

web

## Stack

İlk çalışan demo bağımlılıksız HTML, CSS ve JavaScript modüllerinden oluşur. `dist/` statik yayın klasörüdür; alan kuralları `dist/domain.mjs` içinde, tarayıcı etkileşimleri `dist/app.mjs` içindedir. Testler Node.js ile çalışır. Bu teknoloji seçimi demo içindir; çok kullanıcılı üretim altyapısı henüz kurulmadı.

## Users

Sistem çalışanların raporlama, vardiya, iş ve verimlilik takibini kapsayacak.
Çalışanlar görsel hazırlıyor. Kullanıcılar sistemi ağırlıklı olarak bilgisayardan kullanacak. Yönetici ana ekranının birincil işi rapor inceleme ve görsel kontrolü olacak.
Birincil kullanıcı grubu, sektörü ve ekip büyüklüğü henüz belirlenmedi. Başlangıç modeli çalışanların kendi hesabıyla giriş yapmasını içerir; gerçek kullanım ortamı ekran planlamasında netleştirilecek.

Kullanıcı dört rollü başlangıç modelini kabul etti: sistem yöneticisi, operasyon yöneticisi, ekip lideri ve çalışan. Model `docs/kullanici-rolleri.md` dosyasındadır; yetkiler işletme, atanmış ekipler ve kişinin kendi kayıtları düzeyinde ayrılır. Kişinin kendi raporunu onaylayamaması ve görsel arşivin kayıt erişim sınırlarını izlemesi başlangıç kurallarıdır. Demo içinde roller denenebilir; gerçek hesap veya sunucu tarafı yetkilendirme henüz kurulmadı.

## Product Purpose

Çalışan raporlama, vardiya takibi, görsel arşivleme, personel verimliliği ve iş takibini bir web uygulamasında desteklemek; ilgili iş süreçlerinde otomasyon sağlamak.

## Operating Context

Görsel arşiv, kullanıcının belirttiği Drive hizmeti üzerinden API entegrasyonuyla oluşturulacak. Kullanılacak hesap, klasör yapısı, kimlik doğrulama yöntemi ve paylaşım modeli henüz belirlenmedi.

Kullanıcı 27 Ekim 2026 tarihinde `docs/ilk-surum-ekran-plani.md` dosyasındaki ilk sürüm ekran ve iş akışı planını kabul etti. Yönetici ana ekranı rapor kuyruğu, büyük görsel önizlemesi ve karar alanından oluşur. Çalışan akışı İşlerim → Rapor hazırla → İncelemeye gönder olarak demoda uygulanmıştır. Onay raporun tamamına verilir; revizyon notları tek tek görsellere bağlanabilir. Sade vardiya ve iş listeleri ile uygulama içi bildirimler demoda yer alır; özel otomasyon tasarlayıcısı sonraya bırakılmıştır. Belgede açık bırakılan entegrasyon ve üretim ayrıntıları henüz kesinleşmedi.

## Capabilities and Constraints

Kullanıcı tarafından belirtilen kapsam:

- Çalışan raporlama.
- Vardiya (shift) takibi.
- Drive API üzerinden görsel arşiv oluşturma.
- Personel verimliliği takibi.
- İş takibi ve otomasyon.
- İş talebinde firma adı ve görsel türü: Sosyal, Maç, Site, Full Paket.
- Çalışanın iş durumunu Beklemede, Tasarım aşamasında, İptal ve Tamamlandı arasında değiştirmesi.
- Aylık vardiya düzeni, ek mesai ve nedenli izin kaydı.
- İşin teslim, bekleme ve tasarım sürelerinin grafikle sunulması ve Excel uyumlu CSV aktarımı.
- Ofis gelir/gider panelinin yalnız sistem ve operasyon yöneticisi rollerinde gösterilmesi.

Açık kararlar:

- Raporların içeriği, kim tarafından hazırlanacağı ve raporlama sıklığı.
- Vardiya planlama, gerçekleşen çalışma kaydı ve onay ihtiyaçları.
- İşlerin atanması, durumları ve tamamlanma kuralları.
- Verimlilik ölçütleri, hesaplama yöntemleri ve kullanılacak veriler.
- Görsellerin yüklenme yöntemi ve çalışan, vardiya veya işle ilişkilendirilmesi.
- Otomasyon tetikleyicileri, işlemleri, bildirim kanalları ve insan onayı gereken adımlar.
- Kullanıcı yetkilendirme, veri saklama süreleri ve erişim gereksinimleri.
- İlk sürümün öncelikleri ve başarı ölçütleri.

## Evidence on Hand

Ürün kapsamı kullanıcının bu sohbette verdiği açıklamaya dayanır. Depoda çalışan demo kodu, sentetik rapor ve örnek SVG görseller bulunur; gerçek personel verisi ve marka varlığı bulunmaz. Drive hesabına bağlanılmadı ve entegrasyon doğrulanmadı.

## Product Principles

Aşağıdaki ilkeler kullanıcının belirttiği kapsamdan türetilmiştir:

- Çalışan raporları, vardiyalar ve iş takibi aynı operasyonel amaca hizmet etmeli.
- Görsel arşivleme Drive API entegrasyonunu temel almalı.
- Verimlilik takibi ve otomasyon, tanımlanmış ölçütler ve iş kuralları üzerinden uygulanmalı; henüz kararlaştırılmamış kurallar ürün gerçeği olarak kabul edilmemeli.

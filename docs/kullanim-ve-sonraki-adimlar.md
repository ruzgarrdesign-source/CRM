# Görsel Operasyon: ilk çalışan sürüm

Özel site: https://gorsel-operasyon-ekim27.fair-snail-5311.chatgpt.site

Bu sürüm, onaylanan ekran planını etkileşimli olarak denemek içindir. Sitedeki kişiler, işler, vardiyalar ve görseller örnek veridir.

## Deneme sırası

1. **İnceleme** ekranında bir rapor seçip görseller arasında geç. Görseli büyüt veya tam ekranda aç.
2. Bir görsel seç, “Notu seçili görsele bağla” işaretle, açıklama yaz ve **Revizyon iste**. İstersen uygun raporu **Raporu onayla** ile onayla.
3. Sol alttaki **Demo · Rolü dene** alanından raporu hazırlayan çalışanı seç. **Raporlarım** üzerinden revizyon notunu gör, raporu düzenle, yeni görsel ekle ve yeniden gönder.
4. Yönetici rolüne dönerek yeni gönderimi aç. Önceki sürümü seçerek eski görseller ve eski üretim notunu karşılaştır.
5. **İşler** bölümünden firma ve görsel türüyle iş talebi oluştur; çalışan rolünde işin durumunu değiştir.
6. **Vardiyalar** bölümünde bir ay ve hafta günleri seçerek düzen ekle; ek mesai veya izin nedenini kaydet.
7. **Raporlar** bölümünde teslim, bekleme ve tasarım sürelerini incele; Excel için CSV indir.
8. Sistem veya operasyon yöneticisi rolünde **Ofis** panelinden örnek gelir/gider kayıtlarını incele.

## Saklama ve erişim

- Site, sahibine özel olarak yayımlandı. Demo içindeki rol değiştirici gerçek kimlik doğrulama değildir.
- Değişiklikler ve yüklenen PNG/JPG/WebP görseller yalnızca o tarayıcının yerel saklama alanında kalır. Başka kullanıcıya veya cihaza aktarılmaz. Tarayıcı verilerini temizlemek bunları siler.
- Google Drive bağlantısı henüz yoktur. Arşiv ekranı tarayıcıda saklanan demo kayıtlarını gösterir; Drive'a yükleme yapmaz.
- Ofis panelinin rol kısıtı yalnız demo arayüzü ve alan kuralları düzeyindedir; gerçek gizlilik ve yetki için sunucu tarafı kontrol kurulmalıdır.
- Eski tarayıcı kayıtları korunur. Eski işlerde durum geçmişi bulunmuyorsa süre grafiği bu kayıtlar için ölçüm göstermez.
- **Ayarlar → Görünen kayıtları indir** ile mevcut rolün görebildiği kayıtları JSON olarak alabilirsin. Dosya, yüklediğin görselleri de içerebilir; kendi erişim kurallarına göre sakla.
- **Ayarlar → Demoyu sıfırla** yerel değişiklikleri silip örnek kayıtları geri getirir.

## Gerçek operasyon için gerekli bilgiler

Gerçek personelle kullanıma geçmeden önce kullanıcı giriş yöntemi, ekip/şube yapısı, rapor başına tipik görsel türü ve boyutu, kullanılacak Google hesabı ve Drive klasör modeli, saklama süreleri ve verimlilik ölçütleri belirlenmeli. Ardından sunucu tarafında kimlik doğrulama ve yetki kontrolleri, paylaşılan veri saklama ve Drive API bağlantısı kurulmalı. Bu demo, bu üretim altyapısının yerine kullanılmamalı.

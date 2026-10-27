# İlk sürüm ekran planı

Durum: Kullanıcı tarafından 27 Ekim 2026 tarihinde onaylanan ilk sürüm ekran ve iş akışı planı. Açık noktalar ayrıca belirtilmiştir. Uygulama kodu, çalışan prototip veya seçilmiş bir görsel kimlik değildir.

## 1. Amaç ve kullanıcı

Doğrulanan bilgiler:
- Çalışanlar görsel hazırlıyor.
- Dört rol var: sistem yöneticisi, operasyon yöneticisi, ekip lideri ve çalışan.
- Kullanım ağırlıklı olarak bilgisayardan gerçekleşecek.
- Yönetici ana ekranının önceliği rapor inceleme ve görsel kontrolü.
- Ürün vardiya, iş, verimlilik, Drive görsel arşivi ve otomasyon kapsamını taşıyor.

Mod: Operate. Başarı, yetkili kişinin bekleyen bir raporu bulabilmesi, ilgili görselleri yeterli büyüklükte inceleyebilmesi ve gerekçesi izlenebilen bir karar verebilmesidir. Çalışan, hangi işin hangi görseli için düzeltme istendiğini anlayabilmelidir.

Ürüne özgü bağ: Görsel teslimi; çalışan, görev ve ilgili vardiya/rapor bağlamıyla birlikte incelenir. Drive dosyaları bu akışın görsel arşividir. Gerçek örnek görseller ve raporlar henüz paylaşılmadı; bu plan hayalî performans verisi kullanmaz.

## 2. İlk açılış ve gezinme

Yetkili yönetici veya ekip lideri girişten sonra **İnceleme** ekranına ulaşır. Çalışan **İşlerim** ekranına ulaşır. Sistem yöneticisi için Drive veya kullanıcı kurulumu eksikse bunları gösteren bir kurulum adımı bulunur.

Sol menü: İnceleme (yalnızca onay yetkisi olanlar), İşler / İşlerim, Raporlar / Raporlarım, Vardiyalar / Vardiyalarım, Görsel arşiv, Ekip ve özetler, Ayarlar. Menü ve kayıt kapsamı rol matrisini izler. Ekip ekranı yerine çalışan kendi özetini görür.

## 3. Yönetici ana ekranı: İnceleme

Onaylanan yapı, aynı sayfada kuyruk → görsel → karar sırasıdır. Renk, font ve marka kimliği seçimi sonraki tasarım çalışmasına aittir.

```text
┌──────────┬─────────────────────────────────────────────────────────────┐
│ Menü     │ İnceleme  ·  Ekip / Çalışan / Tarih / Durum filtreleri       │
│          ├───────────────┬────────────────────────┬────────────────────┤
│ İnceleme │ Rapor kuyruğu │ Seçili görsel          │ Rapor ve iş bilgisi│
│ İşler    │               │                        │                    │
│ Raporlar │ Çalışan       │ Sığdır / %100 / Büyüt  │ Çalışan, vardiya   │
│ Vardiya  │ İş başlığı    │                        │ Görev açıklaması   │
│ Arşiv    │ Gönderim      │                        │ Çalışan notu       │
│ Ekip     │ Görsel adedi  │                        │ Önceki geri bildirim│
│ Ayarlar  │ Durum         │                        │ İnceleme notu      │
│          │               ├────────────────────────┤                    │
│          │               │ Küçük görseller/sürüm  │ Revizyon iste      │
│          │               │ gezinmesi              │ Raporu onayla      │
└──────────┴───────────────┴────────────────────────┴────────────────────┘
```

- **Kuyruk:** Varsayılan olarak onay bekleyen raporlar, en eski gönderim önce. Satırda çalışan, iş, gönderim zamanı, görsel sayısı ve durum bulunur. Tarih filtresi nedeniyle eski bekleyen raporlar sessizce gizlenmez.
- **Görsel:** Seçili dosya ekranın en geniş alanını alır. Sığdırma, gerçek boyutta inceleme, yakınlaştırma ve tam ekran görünümü desteklenir. Küçük görseller arasında gezinirken hangi raporun incelendiği korunur.
- **Karar alanı:** Görev açıklaması, çalışan notu, ilgili vardiya, gönderim/sürüm bilgisi ve geçmiş geri bildirim görünür. Varsa işin teslim tarihi gösterilir; zorunlu olduğu varsayılmaz.
- **Revizyon iste:** Gerekçe zorunludur. İlgili görsel veya görseller seçilebilir. İlk sürümde görsel üzerine çizim yerine görsele bağlı metin notu önerilir.
- **Raporu onayla:** Kararın kapsadığı rapor ve görsel adedi belirtilir. Onay, raporun o anki gönderim sürümüne uygulanır. Bir dosya görüntülenemiyorsa karar alanı eksik incelemeyi açıkça gösterir ve onay verilmez.
- **Karar sonrası:** Sonuç görünür biçimde bildirilir. Filtreler ve kuyruk konumu korunur; kullanıcı “Sonraki rapor” ile devam eder. Otomatik geçiş ile sonucun gözden kaçması önlenir.
- **Kendi raporu:** Görüntülenebilir fakat onay eylemi sunulmaz; gerekli başka onaylayıcı belirtilir.

İlk sürüm için onaylanan karar birimi rapordur. Görsele özel geri bildirim verilebilir; kısmi görsel onayı yerine rapor revizyona döner.

## 4. Ekranlar ve kapsam

| Ekran | İçerik | Ana eylem | İlk sürüm sınırı |
|---|---|---|---|
| Giriş ve kurulum | Oturum, erişim durumu; yöneticide ekip ve Drive kurulum adımları | Giriş yap / kurulumu tamamla | Kimlik doğrulama yöntemi ayrıca seçilecek |
| İnceleme | Bekleyen raporlar, büyük görsel önizlemesi, karar ve geçmiş | Onayla / revizyon iste | Toplu veya kısmi görsel onayı yok |
| İşler / İşlerim | Görev listesi; atanan çalışan, durum, varsa teslim tarihi | İş oluştur/ata; çalışan için işe başla veya rapor hazırla | Kanban ve bağımlılık yönetimi yerine filtrelenebilir liste |
| İş detayı | Görev açıklaması, çalışan, ilgili raporlar ve teslimler | İlerleme bildir / rapor hazırla | Üretim araçlarının yerine geçmez |
| Raporlar / Raporlarım | Taslak, incelemede, revizyon, onaylı kayıtlar | Rapor aç / düzenle / gönder | Tek gönderim sürümü için açık durum takibi |
| Rapor hazırlama | İş, ilgili vardiya, yapılan iş notu, görseller ve yükleme durumu | Taslağı kaydet / incelemeye gönder | Raporun tek iş ve ilgili vardiyaya bağlanması öneri; gerçek rapor düzeni netleşecek |
| Vardiyalar | Gün/hafta listesi; çalışan, başlangıç, bitiş, gerçekleşme bildirimi | Yetkili kişi için planla; çalışan için kendi vardiyasını gör | Bordro, ücret, GPS veya biyometrik takip yok |
| Görsel arşiv | Küçük görseller; çalışan, iş, tarih ve onay durumu filtreleri | Görseli aç / bağlı rapora git | Oluşturulan bağlantılar kendiliğinden herkese açık yapılmaz |
| Ekip ve özetler | Ekip üyeleri; seçilen dönemde teslim, onay ve revizyon sayıları | Çalışanın kayıtlarına git | Bileşik verimlilik puanı veya çalışan sıralaması yok |
| Ayarlar | Kullanıcı/rol/ekip, Drive bağlantısı, ilk sürüm bildirim tercihleri | Yetkiye göre yapılandır | Genel amaçlı otomasyon tasarlayıcısı yok |

Rapor hazırlama alanları başlangıç önerisidir. “Görsel hazırlıyorlar” bilgisi dosya türlerini, ölçüleri, üretim adet hedeflerini veya zorunlu alanları henüz belirlemiyor.

## 5. Temel akış

1. Ekip lideri veya yönetici bir iş oluşturur ve çalışana atar.
2. Çalışan İşlerim ekranından görevi açar ve görsellerini hazırlar.
3. Rapor taslağını doldurur; görseller uygulama üzerinden seçilen Drive arşivine yüklenir. Her dosyanın yükleme durumu ayrı görünür.
4. Yüklemeler tamamlanınca çalışan raporu incelemeye gönderir. Drive aktarımı tamamlanmadan gönderim başarılı sayılmaz.
5. Rapor, yetkili onaylayıcının inceleme kuyruğuna girer.
6. Onaylayıcı raporu onaylar veya görsele bağlı notlarla revizyon ister.
7. Çalışan revizyon notlarını görür, yeni dosya sürümlerini yükler ve raporu yeniden gönderir. Önceki gönderim ve karar geçmişi korunur.
8. Onaylanan gönderim arşivde onaylı olarak bulunur; rapor/iş bağlantısı korunur. İşin tamamlanması, rapor onayından ayrı durum olarak tutulur; her işte tek rapor olduğu varsayılmaz.

Rapor durumları: **Taslak → İncelemede → Onaylandı** veya **İncelemede → Revizyon istendi → İncelemede**. Arşivleme, onay durumunu değiştirmeyen ayrı bir kayıt özelliğidir. Dosya yükleme durumları rapor durumlarından ayrıdır.

## 6. Önemli durumlar ve davranışlar

| Durum | Beklenen davranış |
|---|---|
| Bekleyen rapor yok | “İncelenecek rapor yok” açıklaması; filtre varsa filtreleri temizleme seçeneği |
| İş veya vardiya atanmamış | Çalışana neden işlem yapamadığı ve kime başvuracağı gösterilir |
| Drive bağlantısı eksik/kopuk | Taslak korunur; gönderim engellenir; yöneticiye bağlantı düzeltme adımı gösterilir |
| Bir dosya yüklenemedi | Başarılı dosyalar korunur, başarısız dosya yeniden denenir; sessiz veri kaybı veya sahte başarı olmaz |
| Dosya önizlenemiyor | Açık hata ve yeniden deneme; desteklenmeyen dosya türü yükleme aşamasında belirtilir |
| İki yönetici aynı raporu inceliyor | İlk geçerli karar kaydedilir; ikinci kişiye güncel durum gösterilir, eski kararla üzerine yazılmaz |
| İnceleme sırasında sürüm değişti | Eski görünüm üzerinden onay verilmez; güncel gönderim yeniden açılır |
| Yetki yok veya oturum bitti | Yetkisiz veri gösterilmez; uygun erişim/oturum mesajı verilir |
| Uzun liste veya çok görsel | Rapor listesi sayfalanır; küçük görseller kademeli yüklenir; büyük dosya yalnızca istendiğinde açılır |
| Kaydedilmemiş değişiklik | Başka ekrana geçerken kayıp önlenir; taslak kaydetme durumu açıkça görünür |

Gerçek ekip büyüklüğü, günlük rapor sayısı, rapor başına görsel sayısı ve dosya boyutları bilinmiyor. Tasarım boş, tek kayıt ve çok kayıt durumlarını kapsar; yükleme sınırları gerçek örneklere göre belirlenir.

## 7. Yerleşim ve erişilebilirlik

- Bilgisayar öncelikli tasarım: Sol menü sabit bir dayanak; inceleme alanında görsel ana odak. İlk ekranda büyük istatistik kartları inceleme işinin önüne geçmez.
- Dar dizüstü ekranlarında kuyruk veya bilgi paneli açılıp kapanır; görsel inceleme alanı aşırı daraltılmaz.
- Telefonda aynı üç sütun sıkıştırılmaz: kuyruk, rapor/görsel ve karar alanı sıralı görünür; geri dönüşte seçim korunur.
- Durumlar yalnızca renklerle anlatılmaz. Düğmeler ve küçük görseller klavyeyle erişilebilir; odak görünürdür. Tam ekran önizlemeden çıkış ve odak dönüşü tanımlıdır.
- Bir görselin dosya adı, sıra numarası ve varsa açıklaması erişilebilir metin sağlar. İnceleme kararı yalnızca hover veya sürükleme hareketine bağlı olmaz.
- İlk sürüm arayüz dili önerisi Türkçe. Uygulamanın çalışma saat dilimi ve vardiyaların gün sınırı işletmeye göre ayrıca netleştirilecek; sohbetin saat dilimi otomatik ürün kuralı yapılmaz.

## 8. Otomasyon ve ölçüm

İlk sürüm otomasyon önerisi: Rapor gönderilince inceleme kuyruğuna ekleme; revizyon veya onay kararını çalışanın uygulama içi bildirimlerine aktarma. E-posta, mesajlaşma servisleri, otomatik kalite değerlendirmesi ve özel kural tasarlayıcısı sonraki sürümlere bırakılır.

Özetler sayıları açık tanımlarla gösterir: gönderilen benzersiz rapor adedi, onaylanan rapor adedi ve revizyon istenen rapor adedi. Tek rapordaki tekrar revizyon sayısı ayrı tutulur; dosya sürümleri yeni üretim gibi sayılmaz. Bu sayılar kalite veya üretkenlik puanı değildir. Dönem filtresinin gönderim tarihini mi karar tarihini mi kullandığı göstergenin yanında belirtilir.

## 9. Onaylanan kararlar ve açık noktalar

Kullanıcının planı kabul etmesiyle onaylanan kararlar:
- Yönetici ana ekranında rapor kuyruğu + büyük görsel + karar alanı.
- Çalışan için İşlerim → Rapor hazırla → İncelemeye gönder akışı.
- İlk sürümde rapor bazında karar, görsele bağlı revizyon notları.
- Sade vardiya/iş listeleri ve uygulama içi bildirimler; özel otomasyon tasarlayıcısının sonraya bırakılması.

Uygulama öncesi netleştirilecek noktalar:
- Görsel türleri (örneğin çıktı dosyaları mı, kaynak tasarım dosyaları da mı), boyutlar ve tipik adetler.
- Tek raporun bir iş için mi yoksa vardiyadaki birden fazla iş için mi hazırlanacağı.
- Ekip/işletme yapısı, Drive hesabı/klasörü ve kullanıcı giriş yöntemi.
- Vardiya doğrulaması, saklama süreleri, verimlilik ölçütleri ve teknoloji seçimi.

Kapsam dışı: Görsel düzenleme yazılımı, otomatik kalite puanı, bordro, ileri planlama, dış müşteriye portal, gerçek verilerle doğrulanmamış performans iddiaları. Bu plan uygulama geliştirmeye veya Drive bağlantısı kurmaya kendiliğinden başlamaz.

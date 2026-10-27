# Kullanıcı rolleri ve yetkiler

Durum: Kullanıcı dört rollü başlangıç modelini kabul etti. Model çalışan raporlama, vardiya, görsel arşiv, verimlilik ve otomasyon kapsamına göre hazırlandı. Ayrıntılı yetki matrisi ve iş akışı tercihleri ekran planlamasında netleştirilecek önerilerdir. Bu belge hesap oluşturmaz veya Drive erişimi vermez.

## Roller

| Rol | Kod | Sorumluluk | Kayıt kapsamı |
|---|---|---|---|
| Sistem yöneticisi | `admin` | Kullanıcılar, roller, ekipler, entegrasyonlar ve sistem ayarları; gerektiğinde operasyon yönetimi | İşletmenin tüm kayıtları |
| Operasyon yöneticisi | `operations_manager` | İşletme genelinde vardiyalar, işler, raporlar ve performans takibi | İşletmenin tüm operasyon kayıtları |
| Ekip lideri | `team_lead` | Sorumlu olduğu ekibin günlük iş dağılımı, vardiyaları ve rapor kontrolü | Yalnızca atanmış ekipleri |
| Çalışan | `employee` | Kendi işlerini takip etme, rapor hazırlama ve ilgili görselleri yükleme | Kendisine ait veya kendisine atanmış kayıtlar |

## Yetki matrisi

“Tümü” yalnızca ilgili işletmenin kayıtlarını ifade eder. “Ekip” atanmış ekipleri, “kendi” kişinin kendi kayıtlarını ifade eder. Sistem yöneticisi dışındaki roller birbirinden bağımsız atanır; unvan tek başına erişim vermez.

| İşlem | Sistem yöneticisi | Operasyon yöneticisi | Ekip lideri | Çalışan |
|---|---|---|---|---|
| Kullanıcı davet etme, hesabı pasifleştirme, rol atama | Evet | Hayır | Hayır | Hayır |
| Ekip oluşturma ve üyelik atama | Evet | Hayır | Hayır | Hayır |
| Drive bağlantısı ve arşiv kök klasörünü yönetme | Evet | Hayır | Hayır | Hayır |
| Vardiyaları görüntüleme | Tümü | Tümü | Ekip | Kendi |
| Vardiya planı oluşturma ve değiştirme | Tümü | Tümü | Ekip | Hayır |
| Kendi vardiyası için gerçekleşme bildirimi gönderme | Kendi | Kendi | Kendi | Kendi |
| İş oluşturma ve atama | Tümü | Tümü | Ekip içi | Hayır |
| Atanmış işte ilerleme veya tamamlanma bildirme | Tümü | Tümü | Ekip | Kendi |
| Rapor ve iş kaydı görüntüleme | Tümü | Tümü | Ekip | Kendi |
| Kendi raporunu hazırlama ve gönderme | Kendi | Kendi | Kendi | Kendi |
| Gönderilmiş raporu onaylama veya düzeltmeye gönderme | Tümü; kendisi hariç | Tümü; kendisi hariç | Ekip; kendisi hariç | Hayır |
| İş veya raporla ilişkili görsel görüntüleme | Tümü | Tümü | Ekip | Erişebildiği iş/rapor |
| Düzenleyebildiği iş veya rapora görsel ekleme | Evet | Evet | Evet | Evet |
| Verimlilik sonuçlarını görüntüleme | Tümü | Tümü | Ekip | Kendi |
| Rapor dışa aktarma | Tümü | Tümü | Ekip | Kendi |
| Gönderilmiş kayıt veya görseli arşivleme | Tümü | Tümü | Hayır | Hayır |
| Otomasyon kuralı oluşturma/değiştirme | Evet | Hayır | Hayır | Hayır |
| Otomasyon sonuçlarını görüntüleme | Tümü | Tümü | İlgili ekip kayıtları | İlgili kendi kayıtları |
| İşlem geçmişini görüntüleme | Sistem ve kayıt geçmişi | Operasyon kayıt geçmişi | Ekip kayıt geçmişi | Kendi kayıtlarının durum geçmişi |

## Kayıt ve onay kuralları

- Çalışan taslak raporunu düzenler, taslak görselini kaldırabilir ve raporunu gönderir. Gönderilen rapor, düzeltmeye iade edilene kadar kilitlenir. Onaylı kayıt üzerindeki düzeltme yeni sürüm olarak saklanır.
- Olağan rapor onayı ekip liderindedir. Ekip liderinin raporunu operasyon yöneticisi veya sistem yöneticisi onaylar. Operasyon yöneticisinin raporunu başka bir operasyon yöneticisi veya sistem yöneticisi onaylar. Sistem yöneticisinin raporu başka bir yetkili onaylayıcıya gider. Uygun başka bir onaylayıcı yoksa kayıt bekler; kişi kendi raporunu onaylayamaz.
- İşin tamamlandığını bildirmek raporun onaylandığı anlamına gelmez. Vardiya gerçekleşme bildirimi de otomatik olarak doğrulanmış çalışma süresi sayılmaz; gerekli doğrulama akışı ayrıca tanımlanacak.
- Gönderilmiş veya onaylı kayıtlar ilk sürüm arayüzünden kalıcı silinmez. Arşivleme, gerekçesi ve yapan kişiyle kaydedilir. Saklama ve kalıcı silme politikası ayrıca belirlenir.
- İşlem geçmişinde rol değişiklikleri, vardiya değişiklikleri, rapor onayları ve arşivleme işlemleri aktör ve zaman bilgisiyle tutulur. Kullanıcılar bu geçmişi düzenleyemez.

## Drive ve uygulama erişimi

- Uygulamadaki kayıt yetkisi, ilişkili görselin erişimini de belirler. Bir dosyanın kimliğini veya URL'sini bilmek erişim hakkı sağlamaz.
- Varsayılan arşiv özel olmalıdır; otomatik olarak herkese açık Drive bağlantısı oluşturulmaz. API kimlik bilgileri kullanıcı arayüzüne veya tarayıcıya verilmez.
- Google Drive'ın kendi paylaşım izinleri ile uygulama rolleri ayrı mekanizmalardır. Arşiv, kullanıcıların uygulama dışından da erişeceği şekilde paylaşılırsa uygulamadaki sınırlamalar tek başına yeterli olmaz. Kimlik doğrulama ve dosya sunma yöntemi geliştirmeden önce seçilecek.
- Yetki kontrolü menüleri gizlemekle sınırlı kalmaz; sunucu her görüntüleme, indirme, dışa aktarma ve değişiklik isteğinde rolü, işletmeyi ve kayıt kapsamını kontrol eder.
- İlk sürüm önerisi: Her kullanıcıya tek ana rol ve gerektiğinde ekip atamaları verilir. Hesabı pasifleştirilen kullanıcı oturum açamaz; mevcut oturumları da geçersiz kılınır.
- Ekip değişikliği, başka ekibin geçmiş kayıtlarına otomatik erişim vermemelidir. Geçmiş kayıt sahipliği ve ekip devri için uygulanacak kesin kural ayrıca belirlenecek.
- Otomasyonların çalıştırdığı işlemlerin kapsamı tanımlanır ve işlem geçmişine yazılır. Otomasyon tanımlama izni olmayan kullanıcı, başka bir işlem üzerinden otomasyon yetkilerini kullanamaz.

## Netleştirilecek noktalar

- Gerçek organizasyonda ekip lideri ile operasyon yöneticisinin ayrı kişiler olup olmadığı.
- Çalışanların kendi hesabıyla giriş yapması ve raporlarını doğrudan göndermesi.
- Tek işletme mi, birden fazla işletme/şube mi destekleneceği ve ekip sınırları.
- Verimlilik ölçütleri, vardiya doğrulama yöntemi ve raporlarda zorunlu alanlar.
- Dışa aktarma kapsamı, dosya saklama süreleri ve Drive erişim yöntemi.

## Uygulama sırasında doğrulanacak örnekler

- Bir çalışan başka bir çalışanın rapor kimliğini kullanarak raporu veya ilişkili görseli açamaz.
- Ekip lideri kendi ekibine iş atayabilir; başka ekibe ait bir kaydı değiştiremez.
- Operasyon yöneticisi tüm operasyon raporlarını görebilir; kullanıcıya yönetici rolü veremez veya Drive bağlantısını değiştiremez.
- Onay yetkisi bulunan kişi kendi raporunu onaylayamaz.
- Dışa aktarma ve görsel indirme, ekrandaki kayıt kapsamıyla aynı erişim kurallarına uyar.

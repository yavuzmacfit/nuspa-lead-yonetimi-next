# NuSpa Lead Yönetimi (Next.js Prototip)

Ürün özelliklerini görselleştirmek ve hızlıca deneme/karar almak için hazırlanmış
bağımsız bir prototip. `nuspa-lead-yonetimi` (Express + SQLite) projesinin
Next.js'e taşınmış, **veritabanı kullanmayan** versiyonudur.

## Mimari

- **Next.js App Router** (TypeScript), hem sayfaları hem `/api/nuspa/*` altındaki
  API route handler'larını barındırır.
- **DB yok.** Tüm veri (`src/lib/store.ts`) sunucu süreci boyunca bellekte tutulan
  düz JS dizileriyle temsil edilir. `src/lib/seed.ts` her sunucu başlangıcında
  örnek veriyi oluşturur (`src/lib/services/leadService.ts` vb. gerçek servis
  fonksiyonları üzerinden — demo akışları gerçek iş kurallarını uygular).
- Sunucu açık kaldığı sürece yapılan değişiklikler (yeni lead, arama sonucu vb.)
  bellekte kalır; `npm run dev`'i yeniden başlattığında veri sıfırdan seed edilir.
- Bu yaklaşımın amacı: yeni bir alan/özellik eklemek için migration, seed script
  güncellemesi veya db dosyası sıfırlama gerektirmemesi — sadece `src/lib/store.ts`
  ve ilgili servis/sayfa dosyalarını düzenlemek yeterli.

## Klasör yapısı

```
src/
  app/                    Next.js sayfaları (leads, calendar, lost-leads, admin/*)
  app/api/nuspa/          Eski Express route'larıyla birebir eşleşen API katmanı
  components/             Sidebar/Topbar (Shell), modallar, takvim görünümleri, admin tabloları
  lib/
    store.ts              Bellek-içi veri deposu (Table<T> + tüm koleksiyonlar)
    seed.ts                Demo veri
    services/              İş mantığı (leadService, reportService, taskService, ...)
    AppDataContext.tsx      Ortak meta veri + seçili satış danışmanı + toast context'i
```

## Çalıştırma

```bash
npm install
npm run dev
```

`http://localhost:3000` (meşgulse Next.js otomatik başka porta geçer).

## Notlar

- Görsel tasarım, mevcut `nuspa-lead-yonetimi` projesindeki CSS ile birebir aynı
  tutulmuştur (`src/app/globals.css`).
- "Kişileri Dışa Aktar" ve "Toplu Güncelle" butonları şu an placeholder'dır.

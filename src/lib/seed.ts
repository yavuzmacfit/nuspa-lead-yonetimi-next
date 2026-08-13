// Prototip için örnek/başlangıç verisi. DB olmadığı için bu fonksiyon
// sunucu süreci her başladığında bellek-içi depoyu sıfırdan doldurur.
import { db, isSeeded, markSeeded, nowIso } from "./store";
import { acceptLeadTransaction } from "./services/leadService";
import { startCall } from "./services/callService";
import { submitCallResult } from "./services/callResultService";
import { checkOrSubmitManualEntry } from "./services/manualEntryService";

function seedLocations() {
  const tier1 = ["Kanyon", "Ataköy", "Ortaköy", "Maslak", "Zorlu", "Göktürk", "City's", "İstinye", "Ormanada", "The Stay", "Fişekhane"];
  const tier2 = ["Buyaka", "Panora", "Bodrum", "Maltepe", "Mavibahçe", "Kızıltoprak"];
  const tier3 = ["Ritim", "Tunalı", "Torun", "Anadolu Hisarı", "Emaar", "CKM", "Suadiye", "Brandium"];
  for (const name of tier1) {
    db.NuSpaLocation.insert({ name, tier: "TIER_1", isDefault: 0, fitnessClubId: null, isActive: 1 });
  }
  for (const name of tier2) {
    db.NuSpaLocation.insert({ name, tier: "TIER_2", isDefault: 0, fitnessClubId: null, isActive: 1 });
  }
  for (const name of tier3) {
    db.NuSpaLocation.insert({ name, tier: "TIER_3", isDefault: 0, fitnessClubId: null, isActive: 1 });
  }
  db.NuSpaLocation.insert({ name: "DigitalNuSpaLocation", tier: null, isDefault: 1, fitnessClubId: null, isActive: 1 });
  console.log("Lokasyonlar eklendi.");
}

function locId(name: string): number {
  const row = db.NuSpaLocation.findOne((l) => l.name === name);
  if (!row) throw new Error(`Lokasyon bulunamadı: ${name}`);
  return row.id;
}

function seedSalesReps() {
  db.SalesRep.insert({ name: "Ayşe Yılmaz (Call Center)", role: "NUSPA_CALL_CENTER", locationId: null, isActive: 1 });
  db.SalesRep.insert({ name: "Mehmet Demir (Call Center)", role: "NUSPA_CALL_CENTER", locationId: null, isActive: 1 });
  db.SalesRep.insert({ name: "Elif Kaya (Kanyon SD)", role: "NUSPA_SD", locationId: locId("Kanyon"), isActive: 1 });
  db.SalesRep.insert({ name: "Burak Şahin (Ataköy SD)", role: "NUSPA_SD", locationId: locId("Ataköy"), isActive: 1 });
  db.SalesRep.insert({ name: "Zeynep Arslan (Buyaka SD)", role: "NUSPA_SD", locationId: locId("Buyaka"), isActive: 1 });
  db.SalesRep.insert({ name: "Can Yıldız (Ritim SD)", role: "NUSPA_SD", locationId: locId("Ritim"), isActive: 1 });
  db.SalesRep.insert({ name: "Selin Koç (Kanyon Yöneticisi)", role: "LOKASYON_YONETICISI", locationId: locId("Kanyon"), isActive: 1 });
  console.log("Satış danışmanları eklendi.");
}

function seedMembers() {
  db.Member.insert({
    name: "Deniz", surname: "Aydın", gsmAreaCode: "532", gsmNo: "1110001", email: "deniz.aydin@example.com",
    isActiveFitnessMember: 0, fitnessClubId: null, fitnessLocationCode: null, birthDate: null,
    fitnessClubName: null, exMembershipType: null, exMembershipDuration: null, isBankasiCardType: null,
    createdAt: nowIso(),
  });
  db.Member.insert({
    name: "Ece", surname: "Polat", gsmAreaCode: "533", gsmNo: "1110002", email: "ece.polat@example.com",
    isActiveFitnessMember: 1, fitnessClubId: 12, fitnessLocationCode: "Kanyon", birthDate: null,
    fitnessClubName: "Kanyon", exMembershipType: "Yıllık Üyelik", exMembershipDuration: "12 Ay", isBankasiCardType: "Maximiles",
    createdAt: nowIso(),
  });
  db.Member.insert({
    name: "Kerem", surname: "Öztürk", gsmAreaCode: "535", gsmNo: "1110003", email: "kerem.ozturk@example.com",
    isActiveFitnessMember: 0, fitnessClubId: null, fitnessLocationCode: null, birthDate: null,
    fitnessClubName: null, exMembershipType: null, exMembershipDuration: null, isBankasiCardType: null,
    createdAt: nowIso(),
  });
  db.Member.insert({
    name: "Naz", surname: "Çelik", gsmAreaCode: "536", gsmNo: "1110004", email: "naz.celik@example.com",
    isActiveFitnessMember: 1, fitnessClubId: 7, fitnessLocationCode: "Buyaka", birthDate: null,
    fitnessClubName: "Buyaka", exMembershipType: "Aylık Üyelik", exMembershipDuration: "6 Ay", isBankasiCardType: "Maximum",
    createdAt: nowIso(),
  });
  console.log("Örnek üyeler eklendi.");
}

function seedBlacklist() {
  db.BlacklistEntry.insert({ gsmAreaCode: "599", gsmNo: "9999999", reason: "Tekrarlayan kötü niyetli başvuru", createdAt: nowIso() });
  console.log("Blacklist eklendi.");
}

function seedSources() {
  const sources: Array<{ name: string; description: string; isInternal: boolean; details: string[] }> = [
    { name: "Website", description: "NuSpa web sitesi form başvurusu", isInternal: false, details: ["Kampanya X", "Genel İletişim Formu"] },
    { name: "Sosyal Medya", description: "Instagram / Facebook reklamı", isInternal: false, details: ["Instagram", "DM"] },
    { name: "Fitness Üye Referansı", description: "Mevcut fitness üyesinin NuSpa'ya yönlendirmesi", isInternal: true, details: ["Mevcut Üye Referansı"] },
    { name: "Spa Çağrı Merkezi", description: "Çağrı merkezine gelen doğrudan talep", isInternal: true, details: ["Gelen Çağrı"] },
    { name: "Kulüpte Yönlendirme", description: "Fiziksel kulüpte resepsiyon/PT yönlendirmesi", isInternal: true, details: ["Resepsiyon", "Etkinlik"] },
    { name: "Manuel Giriş", description: "SD tarafından elle oluşturulan lead (Bölüm 10)", isInternal: true, details: ["CRM Manuel Kayıt"] },
  ];
  for (const s of sources) {
    const source = db.NuSpaSource.insert({ name: s.name, description: s.description, isInternal: s.isInternal ? 1 : 0, isActive: 1 });
    for (const d of s.details) {
      db.NuSpaSourceDetail.insert({ sourceId: source.id, name: d });
    }
  }
  console.log("Source/Source Detail eklendi.");
}

function seedReasons() {
  const reasons: [string, string, boolean][] = [
    ["Fiyat", "Masaj paketi fiyatı uygun bulunmadı", false],
    ["İlgi Yok", "Üye/aday hizmetle ilgilenmediğini belirtti", false],
    ["Lokasyon Uzak", "Atanan NuSpa lokasyonu aday için uygun değil", false],
    ["Zamanlama Uygun Değil", "Şu an için randevu/hizmet zamanı uygun değil", false],
    ["Rakip Tercih Edildi", "Başka bir spa/wellness merkezi tercih edildi", false],
    ["Sağlık Nedeniyle Vazgeçti", "Sağlık durumu nedeniyle hizmet alamayacak", false],
    ["Ulaşılamıyor (Kalıcı)", "Tekrarlı arama denemelerine rağmen ulaşılamadı", false],
    ["Yanlış Numara", "Numara ilgili kişiye ait değil", false],
    ["Diğer", "Diğer / açıklamalı neden", true],
  ];
  for (const [label, description, requiresExplanation] of reasons) {
    db.NuSpaRejectReason.insert({ label, description, requiresExplanation: requiresExplanation ? 1 : 0, isActive: 1 });
  }
  console.log("NuSpa'ya özgü Ret Tanımları eklendi.");

  const releaseReasons: [string, string][] = [
    ["MANUEL_DEVIR", "Manuel olarak başka satış danışmanına aktarıldı"],
    ["YENI_TRANSACTION_LOKASYON_DEGISTI", "Yeni Lead Transaction nedeniyle lokasyonu değişti"],
    ["MANUEL_GIRIS_BASKA_LOKASYON", "Manuel lead girişiyle başka lokasyona alındı"],
    ["KULLANICI_PASIF", "Kullanıcı işten ayrıldı veya pasife alındı"],
    ["OTOMATIK_KURAL", "Konfigüre edilmiş otomatik serbest bırakma kuralı çalıştı"],
    ["DIGER", "Diğer / açıklamalı neden"],
  ];
  for (const [code, label] of releaseReasons) {
    db.NuSpaReleaseReason.insert({ code, label, isActive: 1 });
  }
  console.log("Sahiplik çıkış sebepleri eklendi.");

  const taskTypes: [string, string, string][] = [
    ["TELEFON_ARAMASI", "Telefon Araması", "Alotech ile aranabilmeli"],
    ["SATIS", "Satış", "Masaj paketi satışı; close sale ile atanır"],
    ["RET", "Ret", "NuSpa'ya özgü ret sebebi seçilir"],
    ["GOREV_KAPAMA", "Görev Kapama", "Yönetimsel"],
    ["UZERINE_ALMA", "Üzerine Alma", "Yönetimsel"],
    ["YENI_KAYNAK_TALEBI", "Yeni Kaynaktan Talebi", "Yönetimsel"],
  ];
  for (const [code, label, description] of taskTypes) {
    db.NuSpaTaskTypeDefinition.insert({ code, label, description, isActive: 1 });
  }
  console.log("NuSpa Görev Tanımları eklendi.");

  const closureReasons = [
    "SD tarafından iptal edildi",
    "Sistem hatası",
    "Tekrar deneme limiti doldu",
    "Lead başka lokasyona taşındı",
    "Diğer",
  ];
  for (const label of closureReasons) {
    db.NuSpaClosureReason.insert({ label, isActive: 1 });
  }
  console.log("Neden Kodları (görev kapama sebepleri) eklendi.");
}

function seedClubLocationMapping() {
  const mappings: [string, string][] = [
    ["Kanyon Fitness", "Kanyon"],
    ["Ataköy Fitness", "Ataköy"],
    ["Buyaka Fitness", "Buyaka"],
    ["Ritim Fitness", "Ritim"],
  ];
  for (const [club, loc] of mappings) {
    const row = db.NuSpaLocation.findOne((l) => l.name === loc);
    if (!row) continue;
    db.NuSpaClubLocationMapping.insert({ fitnessClubName: club, nuspaLocationId: row.id, isActive: 1 });
  }
  console.log("Fitness Kulübü -> NuSpa Lokasyon eşleştirmesi eklendi.");
}

function seedFitnessMockTasks() {
  const rep = db.SalesRep.findOne((r) => r.name === "Elif Kaya (Kanyon SD)");
  if (!rep) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const start = tomorrow.toISOString();
  tomorrow.setHours(11, 30, 0, 0);
  const end = tomorrow.toISOString();
  db.FitnessTaskMock.insert({ salesRepId: rep.id, title: "Fitness: Üye Görüşmesi (mock)", startAt: start, endAt: end });
  console.log("Fitness mock görevi eklendi (yalnızca çakışma kontrolü demosu için).");
}

/**
 * Sadece prototip demosu için: yönetici projeyi çalıştırdığında karşısına
 * boş ekranlar yerine dolu bir örnek akış çıkması için gerçek servis
 * fonksiyonları üzerinden birkaç örnek lead oluşturulur.
 */
function seedDemoLeads() {
  const src = (name: string) => db.NuSpaSource.findOne((s) => s.name === name)!.id;
  const detail = (sourceId: number, name: string) =>
    db.NuSpaSourceDetail.findOne((d) => d.sourceId === sourceId && d.name === name)!.id;
  const repId = (name: string) => db.SalesRep.findOne((r) => r.name === name)!.id;

  const websiteId = src("Website");
  const sosyalId = src("Sosyal Medya");
  const referansId = src("Fitness Üye Referansı");
  const cagriId = src("Spa Çağrı Merkezi");

  const elifId = repId("Elif Kaya (Kanyon SD)");
  const burakId = repId("Burak Şahin (Ataköy SD)");
  const canId = repId("Can Yıldız (Ritim SD)");
  const zeynepId = repId("Zeynep Arslan (Buyaka SD)");

  // 1) Kanyon'a düşen, henüz aranmamış lead (havuzda demo).
  acceptLeadTransaction({
    sourceId: websiteId,
    sourceDetailId: detail(websiteId, "Genel İletişim Formu"),
    name: "Selin",
    surname: "Arıkan",
    gsmAreaCode: "532",
    gsmNo: "4440001",
    email: "selin.arikan@example.com",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Kanyon" }],
    digitalCampaignName: "Yaz Kampanyası 2026",
    isSmsApproved: true,
    hasIysPermissonSms: true,
    hasIysPermissonCall: true,
  });

  // 2) Ataköy'e düşen lead: aranır, "Tekrar Ara" ile açık görev bırakılır (Takvim demosu).
  const l2 = acceptLeadTransaction({
    sourceId: sosyalId,
    sourceDetailId: detail(sosyalId, "Instagram"),
    name: "Baran",
    surname: "Yücel",
    gsmAreaCode: "533",
    gsmNo: "4440002",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Ataköy" }],
    digitalCampaignName: "Instagram Yaz Reklamı",
    isSmsApproved: true,
  });
  const call2 = startCall(l2.lead.id, burakId, {});
  const callback = new Date();
  callback.setDate(callback.getDate() + 2);
  callback.setHours(11, 0, 0, 0);
  submitCallResult(call2.activity.id, {
    callResult: "ULASILDI",
    nextStep: "TEKRAR_ARA",
    callbackAt: callback.toISOString(),
  });

  // 3) Ritim'e düşen lead: aranır, satış anında tamamlanır.
  const l3 = acceptLeadTransaction({
    sourceId: referansId,
    sourceDetailId: detail(referansId, "Mevcut Üye Referansı"),
    name: "Melis",
    surname: "Doğan",
    gsmAreaCode: "535",
    gsmNo: "4440003",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Ritim" }],
  });
  const call3 = startCall(l3.lead.id, canId, {});
  submitCallResult(call3.activity.id, {
    callResult: "ULASILDI",
    nextStep: "SATIS",
    saleLocationId: l3.lead.locationId ?? undefined,
    packageName: "10 Seans Masaj Paketi",
  });

  // 4) Buyaka'ya düşen lead: aranır, Ret ile kapanır.
  const l4 = acceptLeadTransaction({
    sourceId: cagriId,
    sourceDetailId: detail(cagriId, "Gelen Çağrı"),
    name: "Emir",
    surname: "Kara",
    gsmAreaCode: "536",
    gsmNo: "4440004",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Buyaka" }],
  });
  const call4 = startCall(l4.lead.id, zeynepId, {});
  submitCallResult(call4.activity.id, {
    callResult: "ULASILDI",
    nextStep: "RET",
    rejectReasonLabel: "Fiyat",
  });

  // 5) Manuel lead girişi + farklı lokasyon uyarısı üzerinden "Üzerimden Giden
  //    Leadler" ekranı için gerçek bir devir/serbest bırakma kaydı üretilir.
  const l5 = acceptLeadTransaction({
    sourceId: websiteId,
    sourceDetailId: detail(websiteId, "Kampanya X"),
    name: "Naz",
    surname: "Yıldırım",
    gsmAreaCode: "537",
    gsmNo: "4440005",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Kanyon" }],
    digitalCampaignName: "Kampanya X - Dijital",
    hasIysPermissonMail: true,
    hasIysPermissonCall: true,
  });
  startCall(l5.lead.id, elifId, {});
  checkOrSubmitManualEntry(
    { name: "Naz", surname: "Yıldırım", gsmAreaCode: "537", gsmNo: "4440005" },
    canId,
    true
  );

  // 6-9) Havuzun dolu görünmesi için birkaç lead daha eklenir.
  acceptLeadTransaction({
    sourceId: sosyalId,
    sourceDetailId: detail(sosyalId, "DM"),
    name: "Ayşe",
    surname: "Güneş",
    gsmAreaCode: "538",
    gsmNo: "4440006",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Ataköy" }],
  });
  const kulupId = src("Kulüpte Yönlendirme");
  acceptLeadTransaction({
    sourceId: kulupId,
    sourceDetailId: detail(kulupId, "Resepsiyon"),
    name: "Kerem",
    surname: "Aydemir",
    gsmAreaCode: "539",
    gsmNo: "4440007",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Ritim" }],
  });
  acceptLeadTransaction({
    sourceId: websiteId,
    sourceDetailId: detail(websiteId, "Kampanya X"),
    name: "Pelin",
    surname: "Sarı",
    gsmAreaCode: "530",
    gsmNo: "4440008",
    leadSourceHistorySubdetails: [{ key: "nuspaLocation", value: "Buyaka" }],
    digitalCampaignName: "Kampanya X - Dijital",
  });
  // Lokasyon/tier bilgisi çözülemeyen bir lead: DigitalNuSpaLocation havuzuna düşer.
  acceptLeadTransaction({
    sourceId: websiteId,
    sourceDetailId: detail(websiteId, "Genel İletişim Formu"),
    name: "Onur",
    surname: "Taş",
    gsmAreaCode: "541",
    gsmNo: "4440009",
  });

  // Birkaç demo lead'in geçmiş fitness üyeliği mock verisiyle doldurulması.
  const melisMember = db.Member.findOne((m) => m.gsmAreaCode === "535" && m.gsmNo === "4440003");
  if (melisMember) {
    db.Member.update(melisMember.id, {
      fitnessClubName: "Ritim", exMembershipType: "Aylık Üyelik", exMembershipDuration: "1 Ay", isBankasiCardType: "World",
    });
  }
  const emirMember = db.Member.findOne((m) => m.gsmAreaCode === "536" && m.gsmNo === "4440004");
  if (emirMember) {
    db.Member.update(emirMember.id, {
      fitnessClubName: "Buyaka", exMembershipType: "Yıllık Üyelik", exMembershipDuration: "3 Ay", isBankasiCardType: "Bonus",
    });
  }

  console.log("Demo lead akışları eklendi (prototip inceleme kolaylığı için).");
}

export function seedAll() {
  if (isSeeded()) return;
  seedLocations();
  seedSalesReps();
  seedMembers();
  seedBlacklist();
  seedSources();
  seedReasons();
  seedClubLocationMapping();
  seedFitnessMockTasks();
  seedDemoLeads();
  markSeeded();
}

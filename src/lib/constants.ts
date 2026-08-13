// NuSpa'ya özgü sabitler. PRD'de "editlenebilir olmalı" denen alanlar
// (source, reject reason, release reason) veri deposundan okunur; burada
// sadece durum/tip alanlarının kapalı liste değerleri tutulur.

export const LEAD_STATUS = {
  AKTIF: "AKTIF",
  SATIS: "SATIS",
  RET: "RET",
  PASIF: "PASIF",
} as const;
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const TIER = {
  TIER_1: "TIER_1",
  TIER_2: "TIER_2",
  TIER_3: "TIER_3",
} as const;
export type Tier = (typeof TIER)[keyof typeof TIER];

export const CALL_RESULT = {
  ULASILDI: "ULASILDI",
  CEVAP_YOK: "CEVAP_YOK",
  MESGUL: "MESGUL",
  YANLIS_NUMARA: "YANLIS_NUMARA",
  TEKNIK_HATA: "TEKNIK_HATA",
} as const;
export type CallResult = (typeof CALL_RESULT)[keyof typeof CALL_RESULT];

export const NEXT_STEP = {
  TEKRAR_ARA: "TEKRAR_ARA",
  SATIS: "SATIS",
  RET: "RET",
} as const;
export type NextStep = (typeof NEXT_STEP)[keyof typeof NEXT_STEP];

// "Cevap yok" veya "Meşgul" tek başına aramayı kapatmaz -> next step
// zorunlu olarak TEKRAR_ARA olmalı (Bölüm 7.1)
export const RESULTS_REQUIRING_CALLBACK: CallResult[] = [
  CALL_RESULT.CEVAP_YOK,
  CALL_RESULT.MESGUL,
];

export const TASK_TYPE = {
  TELEFON_ARAMASI: "TELEFON_ARAMASI",
  SATIS: "SATIS",
  RET: "RET",
  GOREV_KAPAMA: "GOREV_KAPAMA",
  UZERINE_ALMA: "UZERINE_ALMA",
  YENI_KAYNAK_TALEBI: "YENI_KAYNAK_TALEBI",
} as const;
export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE];

export const TASK_STATUS = {
  ACIK: "ACIK",
  TAMAMLANDI: "TAMAMLANDI",
  IPTAL: "IPTAL",
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const SALE_CHANNEL = {
  OLYMPUS_MANUEL: "OLYMPUS_MANUEL",
  DIS_KANAL: "DIS_KANAL",
} as const;

export const SALE_STATUS = {
  BEKLIYOR: "BEKLIYOR",
  BASARILI: "BASARILI",
  BASARISIZ: "BASARISIZ",
  SURESI_DOLDU: "SURESI_DOLDU",
} as const;

export const SALES_REP_ROLE = {
  NUSPA_SD: "NUSPA_SD",
  NUSPA_CALL_CENTER: "NUSPA_CALL_CENTER",
  LOKASYON_YONETICISI: "LOKASYON_YONETICISI",
} as const;

// Bölüm 9.1: geçmiş tarihli görev yok, 01:00-07:00 arası görev yok,
// tekrar arama en fazla 5 gün sonrasına planlanabilir.
export const CALL_BACK_MAX_DAYS = 5;
export const CALENDAR_BLOCKED_START_HOUR = 1;
export const CALENDAR_BLOCKED_END_HOUR = 7;

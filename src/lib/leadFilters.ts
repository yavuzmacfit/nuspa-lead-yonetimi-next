export interface FilterFieldDef {
  key: string;
  label: string;
}

export const LEAD_FILTER_DEFS: FilterFieldDef[] = [
  { key: "statu", label: "Statü" },
  { key: "kaynak", label: "Kaynak" },
  { key: "kampanya", label: "Dij. Kampanya Adı" },
  { key: "tagKey", label: "Tag Anahtarı (Key)" },
  { key: "tagValue", label: "Tag Değeri (Value)" },
  { key: "rep", label: "Satış Temsilcisi" },
  { key: "gorev", label: "Görev" },
  { key: "tarih", label: "Tarih" },
];

const LEAD_FILTER_STORAGE_KEY = "nuspaLeadFilters.v1";

export function loadVisibleLeadFilters(): string[] {
  const allKeys = LEAD_FILTER_DEFS.map((f) => f.key);
  let stored: unknown = null;
  try {
    stored = JSON.parse(localStorage.getItem(LEAD_FILTER_STORAGE_KEY) ?? "null");
  } catch {
    stored = null;
  }
  return Array.isArray(stored) ? (stored as string[]).filter((k) => allKeys.includes(k)) : allKeys.slice();
}

export function saveVisibleLeadFilters(keys: string[]): void {
  localStorage.setItem(LEAD_FILTER_STORAGE_KEY, JSON.stringify(keys));
}

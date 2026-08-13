export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return (
    d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  );
}

export const LEAD_STATUS_LABEL: Record<string, string> = { AKTIF: "Aktif", SATIS: "Satış", RET: "Ret", PASIF: "Pasif" };
export const LEAD_STATUS_PILL: Record<string, string> = {
  AKTIF: "pill-aktif",
  SATIS: "pill-satis",
  RET: "pill-ret",
  PASIF: "pill-pasif",
};
export const TASK_STATUS_LABEL: Record<string, string> = {
  ACIK: "Açık",
  TAMAMLANDI: "Tamamlanmış",
  IPTAL: "İptal",
  GECIKMIS: "Gecikmiş",
};

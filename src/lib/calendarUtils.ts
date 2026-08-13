export const CAL_HOUR_START = 7;
export const CAL_HOUR_END = 21; // 21:00 dahil son satır
export const CAL_ROW_H = 56;

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function mondayOf(refDate: Date): Date {
  const d = new Date(refDate);
  const offset = (d.getDay() + 6) % 7; // Pazartesi=0
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function weekRangeLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const fmt = (d: Date) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`.toUpperCase();
}

export interface EnrichedTask {
  id: number;
  leadId: number;
  type: string;
  assignedToId: number | null;
  assignedToName: string | null;
  status: string;
  dueAt: string | null;
  memberName: string | null;
  memberSurname: string | null;
  leadLocationId: number | null;
  effectiveStatus: string;
}

export function statusClass(t: EnrichedTask): string {
  return t.effectiveStatus === "GECIKMIS" ? "gecikmis" : t.effectiveStatus === "TAMAMLANDI" ? "tamamlanmis" : t.effectiveStatus === "IPTAL" ? "iptal" : "acik";
}

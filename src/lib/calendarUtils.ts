export const CAL_HOUR_START = 7;
export const CAL_HOUR_END = 23; // 23:00 dahil son satır (gece 00:00'a kadar)
export const CAL_ROW_H = 56;
export const CAL_EVENT_HEIGHT = 44;

/**
 * Aynı gün kolonunda zaman aralığı çakışan görevleri yan yana dizmek için
 * kolon indeksi hesaplar (Google Calendar tarzı). Çakışmayan görevler her
 * zaman tek kolonda (totalCols=1) kalır, tam genişlik kullanır.
 */
export function layoutDayEvents(items: { top: number }[]): { col: number; totalCols: number }[] {
  const order = items.map((it, idx) => ({ idx, top: it.top })).sort((a, b) => a.top - b.top);
  const layout: { col: number; totalCols: number }[] = new Array(items.length);
  const colEndTimes: number[] = [];
  let clusterEnd = -Infinity;
  let clusterIndices: number[] = [];

  function flushCluster() {
    if (!clusterIndices.length) return;
    const totalCols = Math.max(...clusterIndices.map((i) => layout[i].col)) + 1;
    clusterIndices.forEach((i) => (layout[i].totalCols = totalCols));
    clusterIndices = [];
  }

  order.forEach(({ idx, top }) => {
    if (top >= clusterEnd) {
      flushCluster();
      colEndTimes.length = 0;
      clusterEnd = -Infinity;
    }
    let col = 0;
    while (colEndTimes[col] !== undefined && colEndTimes[col] > top) col++;
    colEndTimes[col] = top + CAL_EVENT_HEIGHT;
    clusterEnd = Math.max(clusterEnd, top + CAL_EVENT_HEIGHT);
    layout[idx] = { col, totalCols: 1 };
    clusterIndices.push(idx);
  });
  flushCluster();
  return layout;
}

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

const TASK_TYPE_HUE: Record<string, "blue" | "teal"> = {
  TELEFON_ARAMASI: "blue",
  SATIS: "teal",
};

/**
 * Hafta/Gün ızgarasındaki görev kutucukları için: açık görevler görev tipine
 * göre renklenir (telefon->mavi, satış->teal), zamanı geçmiş olanlar ise aynı
 * tonun "ölü" (soluk/koyu pastel) halinde gösterilir. Tamamlanmış/İptal
 * durumları tipten bağımsız, sabit renklerde kalır.
 */
export function eventToneClass(t: EnrichedTask): string {
  if (t.effectiveStatus === "TAMAMLANDI") return "tamamlanmis";
  if (t.effectiveStatus === "IPTAL") return "iptal";
  const hue = TASK_TYPE_HUE[t.type] ?? "muted";
  const tone = t.effectiveStatus === "GECIKMIS" ? "dead" : "live";
  return `type-${hue}-${tone}`;
}

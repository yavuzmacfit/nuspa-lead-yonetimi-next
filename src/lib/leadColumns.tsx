import { Lead } from "./types";
import { fmtDate, LEAD_STATUS_LABEL, LEAD_STATUS_PILL } from "./format";

export interface LeadColumnDef {
  key: string;
  label: string;
  locked?: boolean;
}

export const LEAD_COLUMN_DEFS: LeadColumnDef[] = [
  { key: "id", label: "ID", locked: true },
  { key: "ad", label: "Ad", locked: true },
  { key: "soyad", label: "Soyad", locked: true },
  { key: "telefon", label: "Telefon", locked: true },
  { key: "email", label: "E-Posta" },
  { key: "kulupAdi", label: "Kulüp Adı" },
  { key: "satisTemsilcisi", label: "Satış Temsilcisi" },
  { key: "olusturmaTarihi", label: "Oluşturma Tarihi" },
  { key: "kaynak", label: "Kaynak" },
  { key: "detaylar", label: "Detaylar (Tags)" },
  { key: "statu", label: "Statü" },
  { key: "gorevTarihi", label: "Görev Tarihi" },
  { key: "ayrUyelikTipi", label: "Ayr. Üyelik Tipi" },
  { key: "ayrUyelikSuresi", label: "Ayr. Üyelik Süresi" },
  { key: "isBankasiKkTipi", label: "İş Bankası KK Tipi" },
  { key: "dijKampanyaAdi", label: "Dij. Kampanya Adı" },
  { key: "iletisimIzni", label: "İletişim İzni" },
  { key: "sms", label: "SMS" },
];

const LEAD_COLUMN_STORAGE_KEY = "nuspaLeadColumns.v1";

export function loadVisibleLeadColumns(): string[] {
  const allKeys = LEAD_COLUMN_DEFS.map((c) => c.key);
  let stored: unknown = null;
  try {
    stored = JSON.parse(localStorage.getItem(LEAD_COLUMN_STORAGE_KEY) ?? "null");
  } catch {
    stored = null;
  }
  const visible = Array.isArray(stored) ? (stored as string[]).filter((k) => allKeys.includes(k)) : allKeys.slice();
  LEAD_COLUMN_DEFS.filter((c) => c.locked).forEach((c) => {
    if (!visible.includes(c.key)) visible.push(c.key);
  });
  return visible;
}

export function saveVisibleLeadColumns(cols: string[]): void {
  localStorage.setItem(LEAD_COLUMN_STORAGE_KEY, JSON.stringify(cols));
}

export function renderLeadCell(key: string, l: Lead): React.ReactNode {
  switch (key) {
    case "id":
      return String(l.id);
    case "ad":
      return l.memberName;
    case "soyad":
      return l.memberSurname;
    case "telefon":
      return `${l.gsmAreaCode} ${l.gsmNo}`;
    case "email":
      return l.email || "—";
    case "kulupAdi":
      return l.fitnessClubName || "—";
    case "satisTemsilcisi":
      return l.ownerId ? l.ownerName : <span className="owner-pool">Havuzda</span>;
    case "olusturmaTarihi":
      return fmtDate(l.createdAt);
    case "kaynak":
      return l.lastSourceName || "—";
    case "detaylar":
      return l.lastSourceDetailName || "—";
    case "statu":
      return (
        <span className={`pill ${LEAD_STATUS_PILL[l.status] || ""}`}>{LEAD_STATUS_LABEL[l.status] || l.status}</span>
      );
    case "gorevTarihi": {
      if (!l.openTaskType) return <span className="task-type">—</span>;
      const overdue = !!l.openTaskDueAt && new Date(l.openTaskDueAt) < new Date();
      return (
        <>
          <span className={`task-date${overdue ? " overdue" : ""}`}>
            {fmtDate(l.openTaskDueAt)}
            {overdue ? " — Gecikmiş" : ""}
          </span>
          <span className="task-type">{l.openTaskType}</span>
        </>
      );
    }
    case "ayrUyelikTipi":
      return l.exMembershipType || "—";
    case "ayrUyelikSuresi":
      return l.exMembershipDuration || "—";
    case "isBankasiKkTipi":
      return l.isBankasiCardType || "—";
    case "dijKampanyaAdi":
      return l.lastDigitalCampaignName || "—";
    case "iletisimIzni":
      return l.lastContactPermission ? <span className="perm-yes">Var</span> : <span className="perm-no">Yok</span>;
    case "sms":
      return l.lastSmsPermission ? <span className="perm-yes">Var</span> : <span className="perm-no">Yok</span>;
    default:
      return null;
  }
}

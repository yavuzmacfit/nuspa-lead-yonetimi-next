"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useAppData } from "@/lib/AppDataContext";
import { fmtDateTime, LEAD_STATUS_LABEL, LEAD_STATUS_PILL, TASK_STATUS_LABEL } from "@/lib/format";

interface TimelineEvent {
  at: string | null;
  title: string;
  meta: string;
  detail: string;
  dot: "green" | "gray" | null;
}

interface LeadDetail {
  lead: {
    memberName: string;
    memberSurname: string;
    gsmAreaCode: string;
    gsmNo: string;
    status: string;
    isActiveFitnessMember: number;
    fitnessClubId: number | null;
    fitnessLocationCode: string | null;
    tier: string | null;
    locationName: string | null;
    relatedPackageOrCampaign: string | null;
    email: string | null;
  };
  transactions: { createdAt: string; sourceName: string | null }[];
  activities: {
    startedAt: string | null;
    createdAt: string;
    endedAt: string | null;
    callResult: string | null;
    nextStep: string | null;
    salesRepName: string | null;
  }[];
  tasks: { createdAt: string; dueAt: string | null; type: string; status: string; assignedToName: string | null }[];
}

export default function LeadDetailModal({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const { toast } = useAppData();
  const [detail, setDetail] = useState<LeadDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<LeadDetail>(`/api/nuspa/leads/${leadId}`)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        toast(err instanceof Error ? err.message : String(err), true);
        onClose();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  if (!detail) return null;
  const { lead } = detail;

  const events: TimelineEvent[] = [];
  detail.transactions.forEach((t) => {
    events.push({
      at: t.createdAt,
      title: "Lead Transaction alındı",
      meta: fmtDateTime(t.createdAt),
      detail: `Kaynak: ${t.sourceName || "—"}`,
      dot: "green",
    });
  });
  detail.activities.forEach((a) => {
    events.push({
      at: a.startedAt || a.createdAt,
      title: a.endedAt ? `Arama Sonucu: ${a.callResult || "—"}` : "Ara ile sahiplenildi",
      meta: `${fmtDateTime(a.startedAt || a.createdAt)} — ${a.salesRepName || "—"}`,
      detail: a.nextStep ? `Sonraki Adım: ${a.nextStep}` : "",
      dot: a.endedAt ? "gray" : null,
    });
  });
  detail.tasks.forEach((t) => {
    events.push({
      at: t.createdAt,
      title: `Görev: ${t.type} (${TASK_STATUS_LABEL[t.status] || t.status})`,
      meta: `${fmtDateTime(t.dueAt || t.createdAt)}${t.assignedToName ? " — " + t.assignedToName : ""}`,
      detail: "",
      dot: null,
    });
  });
  events.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());

  return (
    <Modal onClose={onClose} wide>
      <div className="modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h2>
              {lead.memberName} {lead.memberSurname}
            </h2>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {lead.gsmAreaCode} {lead.gsmNo}
            </div>
          </div>
          <span className={`pill ${LEAD_STATUS_PILL[lead.status] || ""}`}>{LEAD_STATUS_LABEL[lead.status] || lead.status}</span>
        </div>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="detail-body">
        <div className="info-panel">
          <div className="info-item">
            <label>Fiziksel Üye mi?</label>
            <div className={`value ${lead.isActiveFitnessMember ? "badge-yes" : "badge-no"}`}>
              {lead.isActiveFitnessMember ? "✓ Evet" : "Hayır"}
            </div>
          </div>
          <div className="info-item">
            <label>Fiziksel Üyelik Kulübü</label>
            <div className={`value ${lead.fitnessClubId ? "" : "muted"}`}>
              {lead.fitnessLocationCode ? lead.fitnessLocationCode : lead.fitnessClubId ? "Kulüp #" + lead.fitnessClubId : "—"}
            </div>
          </div>
          <div className="info-item">
            <label>Tier</label>
            <div className="value">{lead.tier || "—"}</div>
          </div>
          <div className="info-item">
            <label>Atanmış NuSpa Lokasyonu</label>
            <div className="value">{lead.locationName || "—"}</div>
          </div>
          <div className="info-item">
            <label>İlgili Masaj Paketi / Kampanya</label>
            <div className={`value ${lead.relatedPackageOrCampaign ? "" : "muted"}`}>{lead.relatedPackageOrCampaign || "Yok"}</div>
          </div>
          <div className="info-item">
            <label>E-posta</label>
            <div className="value muted">{lead.email || "—"}</div>
          </div>
        </div>
        <div className="timeline-panel">
          <h3>Geçmiş (Lead Transaction &amp; Aktiviteler)</h3>
          {events.length === 0 ? (
            <div className="empty-state">Henüz aktivite yok.</div>
          ) : (
            events.map((e, i) => (
              <div className="tl-item" key={i}>
                <div className="tl-marker">
                  <div className={`tl-dot ${e.dot || ""}`}></div>
                  {i < events.length - 1 && <div className="tl-line"></div>}
                </div>
                <div className="tl-content">
                  <div className="tl-title">{e.title}</div>
                  <div className="tl-meta">{e.meta}</div>
                  {e.detail && <div className="tl-detail">{e.detail}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="modal-footer">
        <span></span>
        <button className="btn btn-ghost" onClick={onClose}>
          Kapat
        </button>
      </div>
    </Modal>
  );
}

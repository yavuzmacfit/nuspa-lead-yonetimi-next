"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useAppData } from "@/lib/AppDataContext";
import { Lead } from "@/lib/types";
import { PendingCallActivity } from "./CallResultModal";

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type FollowUpType = "TELEFON_ARAMASI" | "SATIS" | "RET";

const FOLLOW_UP_CARDS: { key: FollowUpType; icon: string; label: string; accent: string }[] = [
  { key: "TELEFON_ARAMASI", icon: "📞", label: "Telefon Araması Planla", accent: "blue" },
  { key: "SATIS", icon: "🛒", label: "Satış Görüşmesi", accent: "teal" },
  { key: "RET", icon: "⊗", label: "Ret", accent: "red" },
];

export default function SchedulePhoneCallModal({
  lead,
  closingTaskId,
  onClose,
  onCallStarted,
  onTaskScheduled,
  onShowHistory,
}: {
  lead: Lead;
  closingTaskId?: number | null;
  onClose: () => void;
  onCallStarted: (ctx: PendingCallActivity) => void;
  onTaskScheduled: () => void;
  onShowHistory: () => void;
}) {
  const { currentRepId, rejectReasons, toast } = useAppData();
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState<FollowUpType>("TELEFON_ARAMASI");
  const [rejectReasonLabel, setRejectReasonLabel] = useState("");
  const [rejectExplanation, setRejectExplanation] = useState("");
  const [calling, setCalling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const selectedRejectReason = rejectReasons.find((r) => r.label === rejectReasonLabel);
  const [activeCall, setActiveCall] = useState<PendingCallActivity | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeCall) return;
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  async function closeExistingTask(reasonCode: string) {
    if (!closingTaskId) return;
    await apiFetch(`/api/nuspa/tasks/${closingTaskId}/close`, {
      method: "POST",
      body: JSON.stringify({ status: "TAMAMLANDI", reasonCode }),
    });
  }

  async function startCallNow() {
    setCalling(true);
    try {
      await closeExistingTask("YENI_ARAMA_BASLATILDI");
      const result = await apiFetch<{ activity: { id: number } }>(`/api/nuspa/leads/${lead.id}/call`, {
        method: "POST",
        repId: currentRepId,
      });
      setActiveCall({
        leadId: lead.id,
        activityId: result.activity.id,
        leadSource: `${lead.lastSourceName || "Bilinmiyor"}${lead.lastSourceDetailName ? " – " + lead.lastSourceDetailName : ""}`,
        phone: `${lead.gsmAreaCode} ${lead.gsmNo}`,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setCalling(false);
    }
  }

  function endCall() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeCall) onCallStarted(activeCall);
  }

  async function save() {
    if (followUp === "SATIS") {
      toast("Bu özellik yakında eklenecek.", true);
      return;
    }
    if (followUp === "RET") {
      if (!rejectReasonLabel) {
        toast("Ret sebebi zorunludur.", true);
        return;
      }
      if (selectedRejectReason?.requiresExplanation && !rejectExplanation.trim()) {
        toast(`"${selectedRejectReason.label}" için açıklama zorunludur.`, true);
        return;
      }
      setSaving(true);
      try {
        await apiFetch(`/api/nuspa/leads/${lead.id}/reject`, {
          method: "POST",
          body: JSON.stringify({ rejectReasonLabel, rejectExplanation: rejectExplanation.trim() || undefined }),
        });
        toast("Lead reddedildi.");
        onTaskScheduled();
      } catch (err) {
        toast(err instanceof Error ? err.message : String(err), true);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!date || !time) {
      toast("Telefon araması tarihi ve saati zorunludur.", true);
      return;
    }

    setSaving(true);
    try {
      const dueAtIso = new Date(`${date}T${time}`).toISOString();
      const params = new URLSearchParams({ dueAt: dueAtIso, leadId: String(lead.id) });
      if (closingTaskId) params.set("excludeTaskId", String(closingTaskId));
      const conflict = await apiFetch<{ hasConflict: boolean }>(`/api/nuspa/tasks/conflicts?${params.toString()}`, {
        repId: currentRepId,
      });
      if (conflict.hasConflict) {
        setSaving(false);
        setShowConflictConfirm(true);
        return;
      }
    } catch {
      // Çakışma kontrolü başarısız olsa bile planlamayı engellemeyelim.
    }

    await actuallyScheduleTask();
  }

  async function actuallyScheduleTask() {
    setSaving(true);
    try {
      await closeExistingTask("TAKIP_GOREVI_OLUSTURULDU");
      await apiFetch("/api/nuspa/tasks", {
        method: "POST",
        body: JSON.stringify({
          leadId: lead.id,
          type: "TELEFON_ARAMASI",
          assignedToId: currentRepId,
          dueAt: new Date(`${date}T${time}`).toISOString(),
          note: note.trim() || undefined,
        }),
      });
      toast(closingTaskId ? "Görev tamamlandı, yeni arama planlandı." : "Telefon araması planlandı.");
      onTaskScheduled();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSaving(false);
    }
  }

  if (activeCall) {
    return (
      <Modal onClose={endCall}>
        <div className="modal-header">
          <h2>ARAMA DEVAM EDİYOR</h2>
          <button className="close" onClick={endCall}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="in-call-screen">
            <div className="in-call-avatar">📞</div>
            <div className="in-call-name">
              {lead.memberName} {lead.memberSurname}
            </div>
            <div className="in-call-phone">
              (+90) {lead.gsmAreaCode} {lead.gsmNo}
            </div>
            <div className="in-call-status">Görüşme sürüyor…</div>
            <div className="in-call-timer">{formatElapsed(elapsed)}</div>
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center" }}>
          <button className="btn btn-warn" onClick={endCall}>
            ✕ Aramayı Sonlandır
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <>
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>TELEFON ARAMASI PLANLA</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="call-plan-top">
          <div>
            <div className="call-plan-name">
              {lead.memberName} {lead.memberSurname}
            </div>
            <div className="call-plan-email">{lead.email || "—"}</div>
          </div>
          <div className="call-plan-dial">
            <button type="button" className="ara-btn" disabled={calling} onClick={startCallNow}>
              ☁ Ara
            </button>
            <div className="phone-num">
              (+90) {lead.gsmAreaCode} {lead.gsmNo}
            </div>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Telefon Araması Tarihi</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Telefon Araması Saati</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Notlar</label>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="section-label">Takip Eden Görevi Oluştur</div>
        <div className="step-cards followup-cards">
          {FOLLOW_UP_CARDS.map((c) => (
            <div
              key={c.key}
              className={`step-card accent-${c.accent}${followUp === c.key ? " selected" : ""}`}
              onClick={() => setFollowUp(c.key)}
            >
              <span className="step-icon">{c.icon}</span>
              {c.label}
            </div>
          ))}
        </div>

        {followUp === "RET" && (
          <>
            <div className="field">
              <label>
                Ret Sebebi <span className="req">*</span>
              </label>
              <select value={rejectReasonLabel} onChange={(e) => setRejectReasonLabel(e.target.value)}>
                <option value="">Seçiniz</option>
                {rejectReasons
                  .filter((r) => r.isActive)
                  .map((r) => (
                    <option key={r.id} value={r.label}>
                      {r.label}
                    </option>
                  ))}
              </select>
            </div>
            {selectedRejectReason?.requiresExplanation && (
              <div className="field">
                <label>
                  Açıklama <span className="req">*</span>
                </label>
                <input value={rejectExplanation} onChange={(e) => setRejectExplanation(e.target.value)} />
              </div>
            )}
          </>
        )}

        <div className="call-plan-links">
          <button type="button" className="call-plan-link" onClick={() => toast("Bu özellik yakında eklenecek.")}>
            ✉ Sms Gönder
          </button>
          <button type="button" className="call-plan-link" onClick={onShowHistory}>
            🕐 İşlem Tarihçesi
          </button>
        </div>
      </div>
      <div className="modal-footer">
        <span></span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            İptal
          </button>
          <button className="btn btn-add" disabled={saving} onClick={save}>
            Kaydet
          </button>
        </div>
      </div>
    </Modal>

    {showConflictConfirm && (
      <Modal onClose={() => setShowConflictConfirm(false)}>
        <div className="modal-body" style={{ textAlign: "center", padding: "36px 30px" }}>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Tarih veya saati değiştirmek ister misin?</h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 24 }}>
            Seçtiğin tarih ve saatte bir etkinlik gözükmektedir. Değiştirmek için Evet, bulunan etkinliğin üstüne
            eklemek için Hayır&apos;a basınız.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowConflictConfirm(false);
                actuallyScheduleTask();
              }}
            >
              Hayır
            </button>
            <button className="btn btn-primary" onClick={() => setShowConflictConfirm(false)}>
              Evet
            </button>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}

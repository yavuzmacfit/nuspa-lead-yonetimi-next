"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useAppData } from "@/lib/AppDataContext";

export interface PendingCallActivity {
  leadId: number;
  activityId: number;
  leadSource: string;
  phone: string;
}

type Step = "TEKRAR_ARA" | "SATIS" | "RET";

export default function CallResultModal({
  ctx,
  onClose,
  onSuccess,
}: {
  ctx: PendingCallActivity;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { rejectReasons, locations, toast } = useAppData();
  const [callResult, setCallResult] = useState("");
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [callbackAt, setCallbackAt] = useState("");
  const [saleLocationId, setSaleLocationId] = useState("");
  const [packageName, setPackageName] = useState("");
  const [rejectReasonLabel, setRejectReasonLabel] = useState("");
  const [rejectExplanation, setRejectExplanation] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const forced = callResult === "CEVAP_YOK" || callResult === "MESGUL";
  const activeStep = forced ? "TEKRAR_ARA" : selectedStep;
  const selectedReason = rejectReasons.find((r) => r.label === rejectReasonLabel);

  function handleCallResultChange(value: string) {
    setCallResult(value);
    const nowForced = value === "CEVAP_YOK" || value === "MESGUL";
    if (nowForced) setSelectedStep("TEKRAR_ARA");
  }

  async function submit() {
    if (!callResult) return toast("Arama sonucu seçmelisin.", true);
    if (!activeStep) return toast("Sonraki adım seçmelisin.", true);

    const payload: Record<string, unknown> = { callResult, nextStep: activeStep };
    if (activeStep === "TEKRAR_ARA") {
      if (!callbackAt) return toast("Tekrar arama tarihi/saati zorunludur.", true);
      payload.callbackAt = new Date(callbackAt).toISOString();
    } else if (activeStep === "SATIS") {
      if (!saleLocationId || !packageName.trim()) return toast("Satış lokasyonu ve paket adı zorunludur.", true);
      payload.saleLocationId = Number(saleLocationId);
      payload.packageName = packageName.trim();
    } else if (activeStep === "RET") {
      if (!rejectReasonLabel) return toast("Ret sebebi zorunludur.", true);
      payload.rejectReasonLabel = rejectReasonLabel;
      if (selectedReason?.requiresExplanation) {
        if (!rejectExplanation.trim()) return toast("Bu ret sebebi için açıklama zorunludur.", true);
        payload.rejectExplanation = rejectExplanation.trim();
      }
    }
    if (note.trim()) payload.rejectExplanation = payload.rejectExplanation || note.trim();

    setSubmitting(true);
    try {
      await apiFetch(`/api/nuspa/leads/${ctx.leadId}/activities/${ctx.activityId}/result`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast("Arama sonucu kaydedildi.");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>NUSPA ARAMA SONUCU</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="lead-info-row">
          <div className="lead-source">{ctx.leadSource}</div>
          <div className="call-block">
            <div className="phone-num">{ctx.phone}</div>
          </div>
        </div>

        <div className="field">
          <label>
            Arama Sonucu <span className="req">*</span>
          </label>
          <select value={callResult} onChange={(e) => handleCallResultChange(e.target.value)}>
            <option value="">Seçiniz</option>
            <option value="ULASILDI">Ulaşıldı</option>
            <option value="CEVAP_YOK">Cevap Yok</option>
            <option value="MESGUL">Meşgul</option>
            <option value="YANLIS_NUMARA">Yanlış Numara</option>
            <option value="TEKNIK_HATA">Teknik Hata</option>
          </select>
        </div>

        <div className="section-label">
          Sonraki Adım <span style={{ color: "#d64545" }}>*</span>
        </div>
        <div className="step-cards">
          {(["TEKRAR_ARA", "SATIS", "RET"] as Step[]).map((step) => {
            const icon = step === "TEKRAR_ARA" ? "🔁" : step === "SATIS" ? "🛒" : "🚫";
            const label = step === "TEKRAR_ARA" ? "Tekrar Ara" : step === "SATIS" ? "Satış Yapıldı" : "Ret";
            const disabled = forced && step !== "TEKRAR_ARA";
            return (
              <div
                key={step}
                className={`step-card${activeStep === step ? " selected" : ""}${disabled ? " disabled" : ""}`}
                onClick={() => {
                  if (disabled) return;
                  setSelectedStep(step);
                }}
              >
                <span className="step-icon">{icon}</span>
                {label}
              </div>
            );
          })}
        </div>
        {forced && (
          <div className="inline-note warn">
            &quot;Cevap Yok&quot; / &quot;Meşgul&quot; sonucunda Sonraki Adım zorunlu olarak Tekrar Ara olur (Bölüm 7.1).
          </div>
        )}

        {activeStep === "TEKRAR_ARA" && (
          <>
            <div className="field-row">
              <div className="field">
                <label>
                  Tekrar Arama Tarihi/Saati <span className="req">*</span>
                </label>
                <input type="datetime-local" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)} />
              </div>
            </div>
            <div className="inline-note">En geç arama zamanından 5 gün sonrasına kadar planlanabilir; 01:00–07:00 arası seçilemez.</div>
          </>
        )}
        {activeStep === "SATIS" && (
          <>
            <div className="field-row">
              <div className="field">
                <label>
                  Satış Lokasyonu <span className="req">*</span>
                </label>
                <select value={saleLocationId} onChange={(e) => setSaleLocationId(e.target.value)}>
                  <option value="">Seçiniz</option>
                  {locations
                    .filter((l) => l.isActive)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label>
                  Masaj Paketi <span className="req">*</span>
                </label>
                <input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="Ör. Klasik Masaj Paketi" />
              </div>
            </div>
            <div className="inline-note">
              Satış ileriye dönük planlanan bir görüşme değildir; kaydettiğinde satış anında tamamlanmış sayılır, bekleme durumu yoktur (Bölüm 13).
            </div>
          </>
        )}
        {activeStep === "RET" && (
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
            {selectedReason?.requiresExplanation && (
              <div className="field">
                <label>
                  Açıklama <span className="req">*</span>
                </label>
                <input value={rejectExplanation} onChange={(e) => setRejectExplanation(e.target.value)} />
              </div>
            )}
          </>
        )}

        <div className="field">
          <label>Notlar</label>
          <textarea rows={3} placeholder="Görüşme notu ekleyin..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <span></span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            İptal
          </button>
          <button className="btn btn-primary" disabled={submitting} onClick={submit}>
            Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
}

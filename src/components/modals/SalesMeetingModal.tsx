"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useAppData } from "@/lib/AppDataContext";
import { Lead } from "@/lib/types";
import { buildReservationLink, PackageType } from "@/lib/services/saleLinkService";

type Step = "LINK" | "DONE";

const STEPS: { key: Step; label: string }[] = [
  { key: "LINK", label: "Rezervasyon Linki" },
  { key: "DONE", label: "Satışı Tamamla" },
];

const PACKAGE_TYPE_LABEL: Record<PackageType, string> = {
  PAKET: "Paket",
  TEKLI_MASAJ: "Tekli Masaj",
};

export default function SalesMeetingModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { currentRepId, locations, toast } = useAppData();
  const [step, setStep] = useState<Step>("LINK");

  const [locationId, setLocationId] = useState(lead.locationId ? String(lead.locationId) : "");
  const [packageType, setPackageType] = useState<PackageType>("PAKET");
  const [sendingSms, setSendingSms] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [closingSale, setClosingSale] = useState(false);

  const generatedLink = useMemo(
    () => (locationId ? buildReservationLink(Number(locationId), packageType) : ""),
    [locationId, packageType]
  );

  async function sendSms() {
    if (!locationId) {
      toast("Lokasyon seçmelisin.", true);
      return;
    }

    setSendingSms(true);
    try {
      const res = await apiFetch<{ sentAt: string }>(`/api/nuspa/leads/${lead.id}/sales/send-link`, {
        method: "POST",
        repId: currentRepId,
        body: JSON.stringify({
          link: generatedLink,
          packageType,
          locationId: Number(locationId),
        }),
      });
      setSentAt(res.sentAt);
      toast("Rezervasyon linki SMS ile gönderildi.");
      setStep("DONE");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSendingSms(false);
    }
  }

  async function closeSale() {
    setClosingSale(true);
    try {
      await apiFetch("/api/nuspa/sales/manual", {
        method: "POST",
        body: JSON.stringify({
          leadId: lead.id,
          packageName: PACKAGE_TYPE_LABEL[packageType],
          locationId: Number(locationId),
          isSinglePackage: packageType === "TEKLI_MASAJ",
        }),
      });
      toast("Lead statüsü \"Satış\" olarak güncellendi.");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setClosingSale(false);
    }
  }

  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>SATIŞ GÖRÜŞMESİ</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="lead-info-row">
          <div className="lead-source">
            {lead.memberName} {lead.memberSurname}
          </div>
          <div className="phone-num">
            (+90) {lead.gsmAreaCode} {lead.gsmNo}
          </div>
        </div>

        <div className="step-progress">
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div className={`step-progress-item${i < activeIndex ? " done" : i === activeIndex ? " active" : ""}`}>
                <span className="dot">{i < activeIndex ? "✓" : i + 1}</span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="step-progress-line" />}
            </div>
          ))}
        </div>

        {step === "LINK" && (
          <>
            <div className="field">
              <label>
                Lokasyon <span className="req">*</span>
              </label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
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

            <div className="section-label">
              Paket Türü <span style={{ color: "#d64545" }}>*</span>
            </div>
            <div className="step-cards">
              <div
                className={`step-card${packageType === "PAKET" ? " selected" : ""}`}
                onClick={() => setPackageType("PAKET")}
              >
                <span className="step-icon">📦</span>
                Paket
              </div>
              <div
                className={`step-card${packageType === "TEKLI_MASAJ" ? " selected" : ""}`}
                onClick={() => setPackageType("TEKLI_MASAJ")}
              >
                <span className="step-icon">💆</span>
                Tekli Masaj
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Rezervasyon/Satın Alma Linki (nuspa.com)</label>
              <input readOnly value={generatedLink} placeholder="Lokasyon seçtiğinizde link otomatik oluşturulur" />
            </div>
            <div className="inline-note">Bu link, seçilen lokasyon ve paket türüne göre sistem tarafından otomatik oluşturulur.</div>
          </>
        )}

        {step === "DONE" && (
          <div className="sale-confirm-box">
            <div className="icon">✅</div>
            <div className="title">Rezervasyon linki SMS ile gönderildi</div>
            <div className="detail">
              {sentAt ? new Date(sentAt).toLocaleString("tr-TR") : ""} — (+90) {lead.gsmAreaCode} {lead.gsmNo}
            </div>
            <div className="inline-note">
              Aday üye nuspa.com üzerinden satın alma işlemini tamamladığında, Aday üye statüsünü manuel olarak
              &quot;Satış&quot;a çekmelisin. Bu adım otomatik gerçekleşmez.
            </div>
            <button className="btn btn-add" disabled={closingSale} onClick={closeSale} style={{ marginTop: 6 }}>
              Lead Statüsünü &quot;Satış&quot; Yap
            </button>
          </div>
        )}
      </div>
      {step === "LINK" && (
        <div className="modal-footer">
          <span></span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              İptal
            </button>
            <button className="btn btn-primary" disabled={sendingSms} onClick={sendSms}>
              SMS Gönder
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

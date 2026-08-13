"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useAppData } from "@/lib/AppDataContext";

interface ConflictInfo {
  existingLeadId: number;
  currentLocationName: string | null;
  currentOwnerName: string | null;
}

export default function ManualEntryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { currentRepId, reps, locations, toast } = useAppData();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [areaCode, setAreaCode] = useState("90");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentRep = reps.find((r) => r.id === currentRepId);
  const currentRepLocation = locations.find((l) => l.id === currentRep?.locationId);

  async function submit(confirmOverride: boolean) {
    const payload = {
      name: name.trim(),
      surname: surname.trim(),
      gsmAreaCode: areaCode.trim(),
      gsmNo: phone.trim(),
      email: email.trim() || null,
      confirm: confirmOverride,
    };
    if (!payload.name || !payload.surname || !payload.gsmAreaCode || !payload.gsmNo) {
      toast("Ad, soyad, ülke kodu ve telefon zorunludur.", true);
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<{
        requiresConfirmation: boolean;
        existingLeadId?: number;
        currentLocationName?: string | null;
        currentOwnerName?: string | null;
      }>("/api/nuspa/leads/manual", { method: "POST", body: JSON.stringify(payload), repId: currentRepId });
      if (result.requiresConfirmation) {
        setConflict({
          existingLeadId: result.existingLeadId!,
          currentLocationName: result.currentLocationName ?? null,
          currentOwnerName: result.currentOwnerName ?? null,
        });
      } else {
        toast("Lead oluşturuldu.");
        onSuccess();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSubmitting(false);
    }
  }

  if (conflict) {
    return (
      <Modal onClose={onClose}>
        <div className="modal-header">
          <h2 style={{ color: "#6b4f06" }}>FARKLI LOKASYONDA KAYITLI LEAD</h2>
          <button className="close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p>Girdiğiniz telefon numarası sistemde zaten başka bir lokasyonda aktif bir NuSpa lead&apos;i olarak kayıtlı.</p>
          <div className="field" style={{ background: "#fafbfc", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ color: "var(--muted)" }}>Mevcut Lokasyon</span>
              <b>{conflict.currentLocationName || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ color: "var(--muted)" }}>Mevcut Sahip</span>
              <b>{conflict.currentOwnerName || "Havuzda"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ color: "var(--muted)" }}>Yeni Lokasyon (senin)</span>
              <b>{currentRepLocation?.name || "—"}</b>
            </div>
          </div>
          <p>Yine de devam edersen, lead senin lokasyonuna taşınır, mevcut atama serbest bırakılır ve sen yeni sahibi olursun.</p>
        </div>
        <div className="modal-footer">
          <span></span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Vazgeç
            </button>
            <button className="btn btn-warn" disabled={submitting} onClick={() => submit(true)}>
              Yine de Devam Et
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>NUSPA ADAY ÜYE EKLE</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="field-row">
          <div className="field">
            <label>
              Ad <span className="req">*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>
              Soyad <span className="req">*</span>
            </label>
            <input value={surname} onChange={(e) => setSurname(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field" style={{ flex: "0 0 90px" }}>
            <label>
              Ülke Kodu <span className="req">*</span>
            </label>
            <input value={areaCode} onChange={(e) => setAreaCode(e.target.value)} />
          </div>
          <div className="field">
            <label>
              Telefon Numarası <span className="req">*</span>
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5xx xxx xxxx" />
          </div>
        </div>
        <div className="field">
          <label>E-posta</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Doğum Tarihi</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <span></span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Çık
          </button>
          <button className="btn btn-primary" disabled={submitting} onClick={() => submit(false)}>
            Devam Et
          </button>
        </div>
      </div>
    </Modal>
  );
}

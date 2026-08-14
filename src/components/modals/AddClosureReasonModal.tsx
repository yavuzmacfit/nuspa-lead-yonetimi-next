"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAppData } from "@/lib/AppDataContext";

export default function AddClosureReasonModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: { taskName: string; label: string; isActive: boolean }) => Promise<void>;
}) {
  const { toast } = useAppData();
  const [taskName, setTaskName] = useState("");
  const [label, setLabel] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!label.trim()) {
      toast("Neden kodu adı zorunludur.", true);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ taskName: taskName.trim(), label: label.trim(), isActive });
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Neden Kodu Ekle</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="field">
          <label>Görev Adı</label>
          <input value={taskName} onChange={(e) => setTaskName(e.target.value)} />
        </div>
        <div className="field">
          <label>Neden Kodu</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Neden Kodu" />
        </div>
        <div className="checkbox-row">
          <input type="checkbox" id="closureReasonActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="closureReasonActive">Aktif ?</label>
        </div>
      </div>
      <div className="modal-footer">
        <span></span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-cancel" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn btn-add" disabled={saving} onClick={save}>
            Ekle
          </button>
        </div>
      </div>
    </Modal>
  );
}

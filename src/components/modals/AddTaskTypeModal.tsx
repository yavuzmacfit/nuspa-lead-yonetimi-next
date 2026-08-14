"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAppData } from "@/lib/AppDataContext";

export default function AddTaskTypeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: { label: string; description: string; isActive: boolean }) => Promise<void>;
}) {
  const { toast } = useAppData();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!label.trim()) {
      toast("Görev adı zorunludur.", true);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ label: label.trim(), description: description.trim(), isActive });
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>Görev Ekle</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="field">
          <label>Görev Adı</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Görev Adı" />
        </div>
        <div className="field">
          <label>Görev Açıklaması</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Görev Açıklaması" />
        </div>
        <div className="checkbox-row">
          <input type="checkbox" id="taskTypeActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="taskTypeActive">Aktif ?</label>
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

"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";

export interface FormFieldDef {
  id: string;
  label: string;
}

export default function InlineForm({
  fields,
  onCancel,
  onSubmit,
}: {
  fields: FormFieldDef[];
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const { toast } = useAppData();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSubmit(values);
      toast("Kaydedildi.");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="filter-bar">
      {fields.map((f) => (
        <div className="filter-field" key={f.id}>
          <label>{f.label}</label>
          <input value={values[f.id] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
        </div>
      ))}
      <div className="filter-actions">
        <button className="btn btn-ghost" onClick={onCancel}>
          Vazgeç
        </button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          Kaydet
        </button>
      </div>
    </div>
  );
}

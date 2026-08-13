"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import ToggleIcon from "@/components/admin/ToggleIcon";
import InlineForm from "@/components/admin/InlineForm";

export default function ClosureReasonsAdminPage() {
  const { closureReasons, refetchMeta, toast } = useAppData();
  const [showAdd, setShowAdd] = useState(false);

  async function toggleActive(id: number, current: number) {
    try {
      await apiFetch(`/api/nuspa/admin/closure-reasons/${id}`, { method: "PUT", body: JSON.stringify({ isActive: !current }) });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function remove(id: number) {
    if (!confirm("Silmek istediğine emin misin?")) return;
    try {
      await apiFetch(`/api/nuspa/admin/closure-reasons/${id}`, { method: "DELETE" });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  return (
    <>
      <h1>NuSpa Neden Kodları</h1>
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <button className="btn btn-add" onClick={() => setShowAdd(true)}>
          Neden Kodu Ekle
        </button>
        <span></span>
      </div>
      {showAdd && (
        <InlineForm
          fields={[{ id: "label", label: "Ad" }]}
          onCancel={() => setShowAdd(false)}
          onSubmit={async (vals) => {
            await apiFetch("/api/nuspa/admin/closure-reasons", { method: "POST", body: JSON.stringify(vals) });
            setShowAdd(false);
            refetchMeta();
          }}
        />
      )}
      <table className="admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ad</th>
            <th>Açıklama</th>
            <th>Aktiflik</th>
            <th>Düzenle</th>
            <th>Sil</th>
          </tr>
        </thead>
        <tbody>
          {closureReasons.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>
                <b>{r.label}</b>
              </td>
              <td>—</td>
              <td>
                <ToggleIcon active={r.isActive} />
              </td>
              <td className="icon-cell">
                <button className="icon-edit" onClick={() => toggleActive(r.id, r.isActive)}>
                  ✎
                </button>
              </td>
              <td>
                <button className="icon-delete" onClick={() => remove(r.id)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

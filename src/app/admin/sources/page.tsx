"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import ToggleIcon from "@/components/admin/ToggleIcon";
import InlineForm from "@/components/admin/InlineForm";

export default function SourcesAdminPage() {
  const { sources, refetchMeta, toast } = useAppData();
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    await refetchMeta();
  }

  async function toggleActive(id: number, current: number) {
    try {
      await apiFetch(`/api/nuspa/admin/sources/${id}`, { method: "PUT", body: JSON.stringify({ isActive: !current }) });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function remove(id: number) {
    if (!confirm("Silmek istediğine emin misin?")) return;
    try {
      await apiFetch(`/api/nuspa/admin/sources/${id}`, { method: "DELETE" });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  return (
    <>
      <h1>NuSpa Kaynak Bilgileri</h1>
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <button className="btn btn-add" onClick={() => setShowAdd(true)}>
          Kaynak Ekle
        </button>
        <span></span>
      </div>
      {showAdd && (
        <InlineForm
          fields={[
            { id: "name", label: "Ad" },
            { id: "description", label: "Açıklama" },
          ]}
          onCancel={() => setShowAdd(false)}
          onSubmit={async (vals) => {
            await apiFetch("/api/nuspa/admin/sources", { method: "POST", body: JSON.stringify(vals) });
            setShowAdd(false);
            refresh();
          }}
        />
      )}
      <table className="admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ad</th>
            <th>Açıklama</th>
            <th>İç Kaynak</th>
            <th>Aktiflik</th>
            <th>Düzenle</th>
            <th>Sil</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>
                <b>{s.name}</b>
              </td>
              <td>{s.description || "—"}</td>
              <td>
                <ToggleIcon active={s.isInternal} />
              </td>
              <td>
                <ToggleIcon active={s.isActive} />
              </td>
              <td className="icon-cell">
                <button className="icon-edit" title="Aktif/Pasif" onClick={() => toggleActive(s.id, s.isActive)}>
                  ✎
                </button>
              </td>
              <td>
                <button className="icon-delete" onClick={() => remove(s.id)}>
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

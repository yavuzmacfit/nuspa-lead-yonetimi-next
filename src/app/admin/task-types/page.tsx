"use client";

import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import ToggleIcon from "@/components/admin/ToggleIcon";

export default function TaskTypesAdminPage() {
  const { taskTypes, refetchMeta, toast } = useAppData();

  async function toggleActive(id: number, current: number) {
    try {
      await apiFetch(`/api/nuspa/admin/task-types/${id}`, { method: "PUT", body: JSON.stringify({ isActive: !current }) });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  return (
    <>
      <h1>NuSpa Görevler</h1>
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <span></span>
        <span></span>
      </div>
      <table className="admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Görev Tipi</th>
            <th>Açıklama</th>
            <th>Aktiflik</th>
            <th>Düzenle</th>
            <th>Sil</th>
          </tr>
        </thead>
        <tbody>
          {taskTypes.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>
                <b>{t.label}</b>
              </td>
              <td>{t.description || "—"}</td>
              <td>
                <ToggleIcon active={t.isActive} />
              </td>
              <td className="icon-cell">
                <button className="icon-edit" onClick={() => toggleActive(t.id, t.isActive)}>
                  ✎
                </button>
              </td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

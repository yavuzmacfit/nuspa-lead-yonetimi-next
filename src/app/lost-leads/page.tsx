"use client";

import { useEffect, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import { LostLead } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

export default function LostLeadsPage() {
  const { currentRepId, toast } = useAppData();
  const [rows, setRows] = useState<LostLead[] | null>(null);

  useEffect(() => {
    if (!currentRepId) return;
    apiFetch<LostLead[]>("/api/nuspa/reports/lost-leads", { repId: currentRepId })
      .then(setRows)
      .catch((err) => toast(err instanceof Error ? err.message : String(err), true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRepId]);

  return (
    <>
      <h1>Üzerimden Giden Leadler</h1>
      <p className="subtitle">Daha önce bana atanmış, sonradan serbest bırakılmış / devredilmiş NuSpa lead&apos;leri</p>
      <span className="readonly-badge">🔒 Salt okunur</span>

      {rows === null ? (
        <div className="empty-state">Yükleniyor...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">Kayıt yok.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Önceki Sahip</th>
              <th>Güncel Sahip</th>
              <th>Lokasyon</th>
              <th>Sebep</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="name-cell">
                  <strong>
                    {r.memberName} {r.memberSurname}
                  </strong>
                </td>
                <td>{r.salesRepName}</td>
                <td>{r.currentOwnerName ? r.currentOwnerName : <span className="owner-pool">Havuzda</span>}</td>
                <td>{r.locationName || "—"}</td>
                <td>
                  <span className="reason-pill">{r.reasonLabel || "—"}</span>
                </td>
                <td>{fmtDateTime(r.releasedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

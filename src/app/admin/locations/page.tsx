"use client";

import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import ToggleIcon from "@/components/admin/ToggleIcon";
import InlineForm from "@/components/admin/InlineForm";

export default function LocationsAdminPage() {
  const { locations, clubMappings, refetchMeta, toast } = useAppData();
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [mappingClub, setMappingClub] = useState("");
  const [mappingLocationId, setMappingLocationId] = useState(locations[0]?.id ? String(locations[0].id) : "");

  async function setDefault(id: number) {
    try {
      await apiFetch(`/api/nuspa/admin/locations/${id}/set-default`, { method: "POST" });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function toggleActive(id: number, current: number) {
    try {
      await apiFetch(`/api/nuspa/admin/locations/${id}`, { method: "PUT", body: JSON.stringify({ isActive: !current }) });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function removeLocation(id: number) {
    if (!confirm("Bu lokasyonu silmek istediğine emin misin?")) return;
    try {
      await apiFetch(`/api/nuspa/admin/locations/${id}`, { method: "DELETE" });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function removeMapping(id: number) {
    if (!confirm("Bu eşleştirmeyi silmek istediğine emin misin?")) return;
    try {
      await apiFetch(`/api/nuspa/admin/club-mappings/${id}`, { method: "DELETE" });
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function addMapping() {
    if (!mappingClub.trim()) return toast("Kulüp adı zorunludur.", true);
    try {
      await apiFetch("/api/nuspa/admin/club-mappings", {
        method: "POST",
        body: JSON.stringify({ fitnessClubName: mappingClub.trim(), nuspaLocationId: Number(mappingLocationId) }),
      });
      setShowAddMapping(false);
      setMappingClub("");
      refetchMeta();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  return (
    <>
      <h1>NuSpa Lokasyon &amp; Tier Yönetimi</h1>

      <div className="section">
        <div className="section-header">
          <div>
            <h2>NuSpa Lokasyonları</h2>
            <p>Her lokasyonun hizmet verdiği tier</p>
          </div>
          <button className="btn btn-add" onClick={() => setShowAddLocation(true)}>
            Lokasyon Ekle
          </button>
        </div>
        {showAddLocation && (
          <InlineForm
            fields={[
              { id: "name", label: "Lokasyon Adı" },
              { id: "tier", label: "Tier (TIER_1/TIER_2/TIER_3, boş bırakılabilir)" },
            ]}
            onCancel={() => setShowAddLocation(false)}
            onSubmit={async (vals) => {
              await apiFetch("/api/nuspa/admin/locations", {
                method: "POST",
                body: JSON.stringify({ name: vals.name, tier: vals.tier || null }),
              });
              setShowAddLocation(false);
              refetchMeta();
            }}
          />
        )}
        <table className="admin">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lokasyon Adı</th>
              <th>Tier</th>
              <th>Varsayılan</th>
              <th>Aktiflik</th>
              <th>Düzenle</th>
              <th>Sil</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>
                  <b>{l.name}</b>
                </td>
                <td>{l.tier ? <span className="tier-pill">{l.tier}</span> : <span className="tier-pill all">Tüm Tier&apos;lar</span>}</td>
                <td>
                  {l.isDefault ? (
                    <span className="tier-pill">Varsayılan</span>
                  ) : (
                    <button className="action-btn" onClick={() => setDefault(l.id)}>
                      Varsayılan Yap
                    </button>
                  )}
                </td>
                <td>
                  <ToggleIcon active={l.isActive} />
                </td>
                <td className="icon-cell">
                  <button className="icon-edit" onClick={() => toggleActive(l.id, l.isActive)}>
                    ✎
                  </button>
                </td>
                <td>
                  <button className="icon-delete" onClick={() => removeLocation(l.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <div className="section-header">
          <div>
            <h2>Fitness Kulübü → NuSpa Lokasyon Eşleştirmesi</h2>
            <p>Lead&apos;in geldiği fitness kulübü hangi NuSpa lokasyonuna atanır</p>
          </div>
          <button className="btn btn-add" onClick={() => setShowAddMapping(true)}>
            Eşleştirme Ekle
          </button>
        </div>
        {showAddMapping && (
          <div className="filter-bar">
            <div className="filter-field">
              <label>Fitness Kulübü</label>
              <input value={mappingClub} onChange={(e) => setMappingClub(e.target.value)} />
            </div>
            <div className="filter-field">
              <label>NuSpa Lokasyonu</label>
              <select value={mappingLocationId} onChange={(e) => setMappingLocationId(e.target.value)}>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary" onClick={addMapping}>
                Kaydet
              </button>
            </div>
          </div>
        )}
        <table className="admin">
          <thead>
            <tr>
              <th>Fitness Kulübü</th>
              <th>NuSpa Lokasyonu</th>
              <th></th>
              <th>Sil</th>
            </tr>
          </thead>
          <tbody>
            {clubMappings.map((m) => (
              <tr key={m.id}>
                <td>
                  <b>{m.fitnessClubName}</b>
                </td>
                <td>{m.locationName}</td>
                <td className="icon-cell"></td>
                <td>
                  <button className="icon-delete" onClick={() => removeMapping(m.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

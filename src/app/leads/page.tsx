"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import { Lead } from "@/lib/types";
import { LEAD_COLUMN_DEFS, loadVisibleLeadColumns, renderLeadCell } from "@/lib/leadColumns";
import ColumnSettingsPanel from "@/components/leads/ColumnSettingsPanel";
import ManualEntryModal from "@/components/modals/ManualEntryModal";
import CallResultModal, { PendingCallActivity } from "@/components/modals/CallResultModal";
import LeadDetailModal from "@/components/modals/LeadDetailModal";

type ModalState =
  | { kind: "manualEntry" }
  | { kind: "callResult"; ctx: PendingCallActivity }
  | { kind: "leadDetail"; leadId: number }
  | null;

export default function LeadsPage() {
  const router = useRouter();
  const { currentRepId, reps, sources, taskTypes, toast } = useAppData();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>(null);

  const [status, setStatus] = useState("");
  const [kaynak, setKaynak] = useState("");
  const [kampanya, setKampanya] = useState("");
  const [rep, setRep] = useState("");
  const [dateField, setDateField] = useState("createdAt");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [phoneLookupInput, setPhoneLookupInput] = useState("");

  useEffect(() => {
    setVisibleColumns(loadVisibleLeadColumns());
  }, []);

  const loadLeads = useCallback(async () => {
    if (!currentRepId) return;
    setLoading(true);
    try {
      const rows = await apiFetch<Lead[]>("/api/nuspa/leads", { repId: currentRepId });
      setLeads(rows);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [currentRepId]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const sourceOptions = useMemo(() => [...new Set(sources.filter((s) => s.isActive).map((s) => s.name))], [sources]);
  const campaignOptions = useMemo(
    () => [...new Set(leads.map((l) => l.lastDigitalCampaignName).filter((v): v is string => !!v))],
    [leads]
  );

  const rows = useMemo(() => {
    return leads.filter((l) => {
      if (status && l.status !== status) return false;
      if (kaynak && l.lastSourceName !== kaynak) return false;
      if (kampanya && l.lastDigitalCampaignName !== kampanya) return false;
      if (rep === "POOL" && l.ownerId) return false;
      if (rep && rep !== "POOL" && l.ownerId !== Number(rep)) return false;
      const fieldValue = dateField === "updatedAt" ? l.updatedAt : l.createdAt;
      if (dateFrom && (!fieldValue || new Date(fieldValue) < new Date(dateFrom))) return false;
      if (dateTo && (!fieldValue || new Date(fieldValue) > new Date(`${dateTo}T23:59:59`))) return false;
      if (search) {
        const full = `${l.memberName} ${l.memberSurname} ${l.gsmAreaCode}${l.gsmNo}`.toLowerCase();
        if (!full.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, status, kaynak, kampanya, rep, dateField, dateFrom, dateTo, search]);

  const visibleDefs = LEAD_COLUMN_DEFS.filter((c) => visibleColumns.includes(c.key));

  function clearFilters() {
    setStatus("");
    setKaynak("");
    setKampanya("");
    setRep("");
    setDateField("createdAt");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  async function startCallFlow(leadId: number) {
    try {
      const result = await apiFetch<{ activity: { id: number } }>(`/api/nuspa/leads/${leadId}/call`, {
        method: "POST",
        repId: currentRepId,
      });
      const lead = leads.find((l) => l.id === leadId);
      setModal({
        kind: "callResult",
        ctx: {
          leadId,
          activityId: result.activity.id,
          leadSource: lead ? `${lead.lastSourceName || "Bilinmiyor"}${lead.lastSourceDetailName ? " – " + lead.lastSourceDetailName : ""}` : "",
          phone: lead ? `${lead.gsmAreaCode} ${lead.gsmNo}` : "",
        },
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  async function lookupLeadByPhone() {
    const raw = phoneLookupInput.replace(/\D/g, "");
    if (raw.length < 4) {
      toast("Aramak için geçerli bir telefon numarası girin.", true);
      return;
    }
    const gsmAreaCode = raw.slice(0, 3);
    const gsmNo = raw.slice(3);
    try {
      const result = await apiFetch<{ id: number | null; memberName: string; memberSurname: string } | null>(
        `/api/nuspa/leads/search-by-phone?gsmAreaCode=${gsmAreaCode}&gsmNo=${gsmNo}`
      );
      if (!result) {
        toast("Bu numaraya ait kayıt bulunamadı (tüm kulüpler).");
        return;
      }
      if (result.id) {
        setModal({ kind: "leadDetail", leadId: result.id });
      } else {
        toast(`${result.memberName} ${result.memberSurname} bulundu, ancak aktif bir NuSpa lead kaydı yok.`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    }
  }

  return (
    <>
      <h1>NuSpa Aday Üye</h1>
      <p className="subtitle">Kullanıcının lokasyon kapsamındaki havuz + sahipli NuSpa lead&apos;leri (PRD Bölüm 8.1)</p>

      <div className="filter-bar">
        <div className="filter-field">
          <label>Statü</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Seçiniz</option>
            <option value="AKTIF">Aktif</option>
            <option value="SATIS">Satış</option>
            <option value="RET">Ret</option>
            <option value="PASIF">Pasif</option>
          </select>
        </div>
        <div className="filter-field">
          <label>Kaynak</label>
          <select value={kaynak} onChange={(e) => setKaynak(e.target.value)}>
            <option value="">Seçiniz</option>
            {sourceOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Dij. Kampanya Adı</label>
          <select value={kampanya} onChange={(e) => setKampanya(e.target.value)}>
            <option value="">Seçiniz</option>
            {campaignOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Tag Anahtarı (Key)</label>
          <select defaultValue="">
            <option value="">Seçiniz</option>
          </select>
        </div>
        <div className="filter-field">
          <label>Tag Değeri (Value)</label>
          <select defaultValue="">
            <option value="">Seçiniz</option>
          </select>
        </div>
        <div className="filter-field">
          <label>Satış Temsilcisi</label>
          <select value={rep} onChange={(e) => setRep(e.target.value)}>
            <option value="">Seçiniz</option>
            <option value="POOL">Havuzda (Sahipsiz)</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Görev</label>
          <select defaultValue="">
            <option value="">Seçiniz</option>
            {taskTypes
              .filter((t) => t.isActive)
              .map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Tarih</label>
          <select value={dateField} onChange={(e) => setDateField(e.target.value)}>
            <option value="createdAt">Oluşturma Tarihi</option>
            <option value="updatedAt">Güncelleme Tarihi</option>
          </select>
        </div>
        <div className="filter-field">
          <label>Başlangıç</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>Bitiş</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="filter-actions">
          <button className="btn btn-ghost" onClick={clearFilters}>
            Temizle
          </button>
        </div>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <button className="btn btn-add" onClick={() => setModal({ kind: "manualEntry" })}>
            + Aday Üye Ekle
          </button>
          <button className="btn-icon-ghost" title="Takvim" onClick={() => router.push("/calendar")}>
            📅
          </button>
          <button className="btn btn-soft-warn" onClick={() => toast("Bu özellik yakında eklenecek.")}>
            Kişileri Dışa Aktar
          </button>
          <button className="btn btn-soft-warn" onClick={() => toast("Bu özellik yakında eklenecek.")}>
            Toplu Güncelle
          </button>
        </div>
        <div className="action-bar-right">
          <div className="lookup-field">
            <label>Telefon Sorgulama (Tüm Kulüpler)</label>
            <div className="lookup-row">
              <select defaultValue="90">
                <option value="90">90</option>
              </select>
              <input
                type="text"
                placeholder="(xxx) xxx-xxxx"
                value={phoneLookupInput}
                onChange={(e) => setPhoneLookupInput(e.target.value)}
              />
              <button className="btn btn-add" onClick={lookupLeadByPhone}>
                Ara
              </button>
            </div>
          </div>
          <div className="lookup-field">
            <label>Genel Sorgulama (Kendi Kulübün)</label>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Arama yap..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <span className="result-count">{loading ? "Yükleniyor..." : `${rows.length} lead listeleniyor`}</span>
        <div className="toolbar-actions">
          <ColumnSettingsPanel visible={visibleColumns} onChange={setVisibleColumns} />
        </div>
      </div>

      {loadError ? (
        <div className="empty-state">Leadler yüklenemedi: {loadError}</div>
      ) : !loading && rows.length === 0 ? (
        <div className="empty-state">Kriterlere uyan lead bulunamadı.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {visibleDefs.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const disabledCall = !!l.ownerId && l.ownerId !== currentRepId;
                return (
                  <tr key={l.id}>
                    {visibleDefs.map((c) => (
                      <td key={c.key}>{renderLeadCell(c.key, l)}</td>
                    ))}
                    <td className="row-action">
                      <button
                        className="action-btn primary"
                        disabled={disabledCall}
                        title={disabledCall ? "Başka SD'ye atanmış" : undefined}
                        onClick={() => startCallFlow(l.id)}
                      >
                        Ara
                      </button>
                      <button className="action-btn" onClick={() => setModal({ kind: "leadDetail", leadId: l.id })}>
                        Detay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal?.kind === "manualEntry" && (
        <ManualEntryModal
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadLeads();
          }}
        />
      )}
      {modal?.kind === "callResult" && (
        <CallResultModal
          ctx={modal.ctx}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadLeads();
          }}
        />
      )}
      {modal?.kind === "leadDetail" && <LeadDetailModal leadId={modal.leadId} onClose={() => setModal(null)} />}
    </>
  );
}

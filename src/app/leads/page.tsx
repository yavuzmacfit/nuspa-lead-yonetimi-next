"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import { Lead } from "@/lib/types";
import { LEAD_COLUMN_DEFS, loadVisibleLeadColumns, renderLeadCell } from "@/lib/leadColumns";
import { loadVisibleLeadFilters } from "@/lib/leadFilters";
import ColumnSettingsPanel from "@/components/leads/ColumnSettingsPanel";
import FilterSettingsPanel from "@/components/leads/FilterSettingsPanel";
import RowActionMenu from "@/components/leads/RowActionMenu";
import TaskTypeIconButton from "@/components/leads/TaskTypeIconButton";
import ManualEntryModal from "@/components/modals/ManualEntryModal";
import CallResultModal, { PendingCallActivity } from "@/components/modals/CallResultModal";
import LeadDetailModal from "@/components/modals/LeadDetailModal";
import SchedulePhoneCallModal from "@/components/modals/SchedulePhoneCallModal";

type ModalState =
  | { kind: "manualEntry" }
  | { kind: "schedulePhoneCall"; leadId: number; closingTaskId?: number | null }
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
  const [visibleFilters, setVisibleFilters] = useState<string[]>([]);
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
    setVisibleFilters(loadVisibleLeadFilters());
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

  function handleVisibleFiltersChange(next: string[]) {
    const hidden = visibleFilters.filter((k) => !next.includes(k));
    hidden.forEach((key) => {
      if (key === "statu") setStatus("");
      if (key === "kaynak") setKaynak("");
      if (key === "kampanya") setKampanya("");
      if (key === "rep") setRep("");
      if (key === "tarih") {
        setDateField("createdAt");
        setDateFrom("");
        setDateTo("");
      }
    });
    setVisibleFilters(next);
  }

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
      <div className="leads-header">
        <div>
          <h1>NuSpa Aday Üye</h1>
          <p className="subtitle">Kullanıcının lokasyon kapsamındaki havuz + sahipli NuSpa lead&apos;leri (PRD Bölüm 8.1)</p>
        </div>
        <FilterSettingsPanel visible={visibleFilters} onChange={handleVisibleFiltersChange} />
      </div>

      <div className="filter-bar">
        {visibleFilters.includes("statu") && (
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
        )}
        {visibleFilters.includes("kaynak") && (
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
        )}
        {visibleFilters.includes("kampanya") && (
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
        )}
        {visibleFilters.includes("tagKey") && (
          <div className="filter-field">
            <label>Tag Anahtarı (Key)</label>
            <select defaultValue="">
              <option value="">Seçiniz</option>
            </select>
          </div>
        )}
        {visibleFilters.includes("tagValue") && (
          <div className="filter-field">
            <label>Tag Değeri (Value)</label>
            <select defaultValue="">
              <option value="">Seçiniz</option>
            </select>
          </div>
        )}
        {visibleFilters.includes("rep") && (
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
        )}
        {visibleFilters.includes("gorev") && (
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
        )}
        {visibleFilters.includes("tarih") && (
          <>
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
          </>
        )}
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
                Bul
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
                <th className="sticky-action-col"></th>
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
                    <td className="row-action sticky-action-col">
                      {l.openTaskType ? (
                        <TaskTypeIconButton
                          taskType={l.openTaskType}
                          title={l.openTaskType === "SATIS" ? "Satış Görüşmesi (açık görev)" : "Telefon Araması (açık görev)"}
                        />
                      ) : (
                        <button
                          className="action-btn primary"
                          disabled={disabledCall}
                          title={disabledCall ? "Başka SD'ye atanmış" : undefined}
                          onClick={() => setModal({ kind: "schedulePhoneCall", leadId: l.id })}
                        >
                          Ara
                        </button>
                      )}
                      <RowActionMenu
                        items={
                          l.openTaskType
                            ? [
                                {
                                  icon: "✓",
                                  label: "Görevi Tamamla",
                                  onClick: () => setModal({ kind: "schedulePhoneCall", leadId: l.id, closingTaskId: l.openTaskId }),
                                },
                                { icon: "🕐", label: "İşlem Tarihçesi", onClick: () => setModal({ kind: "leadDetail", leadId: l.id }) },
                                { icon: "✉️", label: "Sms Gönder", onClick: () => toast("Bu özellik yakında eklenecek.") },
                                { icon: "ℹ️", label: "Ek Bilgiler", onClick: () => toast("Bu özellik yakında eklenecek.") },
                                { icon: "✏️", label: "Aday Üye Güncelle", onClick: () => toast("Bu özellik yakında eklenecek.") },
                              ]
                            : [
                                { icon: "📞", label: "Arama Görevi Planla", onClick: () => setModal({ kind: "schedulePhoneCall", leadId: l.id }) },
                                { icon: "🛒", label: "Satış Görüşmesi", onClick: () => toast("Bu özellik yakında eklenecek.") },
                                { icon: "🕐", label: "İşlem Tarihçesi", onClick: () => setModal({ kind: "leadDetail", leadId: l.id }) },
                                { icon: "ℹ️", label: "Ek Bilgiler", onClick: () => toast("Bu özellik yakında eklenecek.") },
                                { icon: "✏️", label: "Aday Üye Güncelle", onClick: () => toast("Bu özellik yakında eklenecek.") },
                              ]
                        }
                      />
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
      {modal?.kind === "schedulePhoneCall" &&
        (() => {
          const lead = leads.find((l) => l.id === modal.leadId);
          if (!lead) return null;
          return (
            <SchedulePhoneCallModal
              lead={lead}
              closingTaskId={modal.closingTaskId}
              onClose={() => setModal(null)}
              onCallStarted={(ctx) => setModal({ kind: "callResult", ctx })}
              onTaskScheduled={() => {
                setModal(null);
                loadLeads();
              }}
              onShowHistory={() => setModal({ kind: "leadDetail", leadId: lead.id })}
            />
          );
        })()}
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

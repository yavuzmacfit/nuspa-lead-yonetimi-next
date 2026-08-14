"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { apiFetch } from "@/lib/apiClient";
import { TaskRow } from "@/lib/types";
import { addDays, EnrichedTask, mondayOf, weekRangeLabel } from "@/lib/calendarUtils";
import AgendaView from "@/components/calendar/AgendaView";
import MonthView from "@/components/calendar/MonthView";
import HourGridView from "@/components/calendar/HourGridView";

type View = "month" | "week" | "day" | "agenda";

export default function CalendarPage() {
  const { locations, taskTypes, reps, toast } = useAppData();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [view, setView] = useState<View>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);

  const [fltLocation, setFltLocation] = useState("");
  const [fltType, setFltType] = useState("");
  const [fltRep, setFltRep] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  useEffect(() => {
    apiFetch<TaskRow[]>("/api/nuspa/tasks")
      .then(setTasks)
      .catch((err) => toast(err instanceof Error ? err.message : String(err), true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = useMemo(() => new Date(), []);

  const enriched: EnrichedTask[] = useMemo(() => {
    return tasks
      .map((t) => {
        let effectiveStatus = t.status;
        if (t.status === "ACIK" && t.dueAt && new Date(t.dueAt) < now) effectiveStatus = "GECIKMIS";
        return { ...t, effectiveStatus };
      })
      .filter((t) => {
        if (fltLocation && String(t.leadLocationId) !== fltLocation) return false;
        if (fltType && t.type !== fltType) return false;
        if (fltRep && String(t.assignedToId) !== fltRep) return false;
        if (onlyOpen && !(t.effectiveStatus === "ACIK" || t.effectiveStatus === "GECIKMIS")) return false;
        return true;
      });
  }, [tasks, fltLocation, fltType, fltRep, onlyOpen, now]);

  const monday = mondayOf(addDays(now, weekOffset * 7));
  const dayRef = addDays(now, dayOffset);
  const monthRef = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

  let navLabel: string;
  if (view === "month") {
    navLabel = monthRef.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase();
  } else if (view === "day") {
    navLabel = dayRef.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }).toUpperCase();
  } else {
    navLabel = weekRangeLabel(monday);
  }

  function navPrev() {
    if (view === "month") setMonthOffset((v) => v - 1);
    else if (view === "day") setDayOffset((v) => v - 1);
    else setWeekOffset((v) => v - 1);
  }
  function navNext() {
    if (view === "month") setMonthOffset((v) => v + 1);
    else if (view === "day") setDayOffset((v) => v + 1);
    else setWeekOffset((v) => v + 1);
  }
  function navBigPrev() {
    if (view === "month") setMonthOffset((v) => v - 12);
    else if (view === "day") setDayOffset((v) => v - 7);
    else setWeekOffset((v) => v - 4);
  }
  function navBigNext() {
    if (view === "month") setMonthOffset((v) => v + 12);
    else if (view === "day") setDayOffset((v) => v + 7);
    else setWeekOffset((v) => v + 4);
  }

  return (
    <>
      <h1>Takvim</h1>
      <div className="filter-bar">
        <div className="filter-field">
          <label>Lokasyon</label>
          <select value={fltLocation} onChange={(e) => setFltLocation(e.target.value)}>
            <option value="">Tümü</option>
            {locations
              .filter((l) => l.isActive)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Görev Tipi</label>
          <select value={fltType} onChange={(e) => setFltType(e.target.value)}>
            <option value="">Tümü</option>
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
          <label>Satış Danışmanı</label>
          <select value={fltRep} onChange={(e) => setFltRep(e.target.value)}>
            <option value="">Tümü</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="checkbox-field">
          <input type="checkbox" id="calFltOpen" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          <label htmlFor="calFltOpen">Sadece açık görevler</label>
        </div>
      </div>

      <div className="view-toolbar">
        <div className="view-tabs">
          {(["month", "week", "day", "agenda"] as View[]).map((v) => (
            <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
              {v === "month" ? "Ay" : v === "week" ? "Hafta" : v === "day" ? "Gün" : "Ajanda"}
            </button>
          ))}
        </div>
        <div className="date-nav">
          <button onClick={navBigPrev}>«</button>
          <button onClick={navPrev}>‹</button>
          <span>{navLabel}</span>
          <button onClick={navNext}>›</button>
          <button onClick={navBigNext}>»</button>
        </div>
      </div>

      <div>
        {view === "month" && <MonthView tasks={enriched} refDate={monthRef} />}
        {view === "week" && <HourGridView tasks={enriched} refDate={monday} colsCount={7} />}
        {view === "day" && <HourGridView tasks={enriched} refDate={dayRef} colsCount={1} />}
        {view === "agenda" && <AgendaView tasks={enriched} monday={monday} />}
      </div>

      <div className="legend">
        <span>
          <span className="dot dot-acik"></span>Açık
        </span>
        <span>
          <span className="dot dot-gecikmis"></span>Gecikmiş
        </span>
        <span>
          <span className="dot dot-tamamlanmis"></span>Tamamlanmış
        </span>
        <span>
          <span className="dot dot-iptal"></span>İptal
        </span>
      </div>
    </>
  );
}

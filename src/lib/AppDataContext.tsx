"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { apiFetch } from "./apiClient";
import {
  ClosureReason,
  ClubMapping,
  NuSpaLocation,
  RejectReason,
  SalesRep,
  Source,
  TaskTypeDefinition,
} from "./types";

interface ToastItem {
  id: number;
  message: string;
  isError: boolean;
}

interface AppData {
  reps: SalesRep[];
  locations: NuSpaLocation[];
  sources: Source[];
  rejectReasons: RejectReason[];
  taskTypes: TaskTypeDefinition[];
  closureReasons: ClosureReason[];
  clubMappings: ClubMapping[];
  currentRepId: number | null;
  setCurrentRepId: (id: number) => void;
  ready: boolean;
  error: string | null;
  toast: (message: string, isError?: boolean) => void;
  refetchMeta: () => Promise<void>;
}

const AppDataCtx = createContext<AppData | null>(null);

const REP_STORAGE_KEY = "nuspa.currentRepId";

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [locations, setLocations] = useState<NuSpaLocation[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [rejectReasons, setRejectReasons] = useState<RejectReason[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskTypeDefinition[]>([]);
  const [closureReasons, setClosureReasons] = useState<ClosureReason[]>([]);
  const [clubMappings, setClubMappings] = useState<ClubMapping[]>([]);
  const [currentRepId, setCurrentRepIdState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, isError = false) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const loadMeta = useCallback(async () => {
    const [repsRes, locationsRes, sourcesRes] = await Promise.all([
      apiFetch<SalesRep[]>("/api/nuspa/meta/sales-reps"),
      apiFetch<NuSpaLocation[]>("/api/nuspa/admin/locations"),
      apiFetch<Source[]>("/api/nuspa/admin/sources"),
    ]);
    setReps(repsRes);
    setLocations(locationsRes);
    setSources(sourcesRes);

    const [rejectReasonsRes, taskTypesRes, closureReasonsRes, clubMappingsRes] = await Promise.all([
      apiFetch<RejectReason[]>("/api/nuspa/admin/reject-reasons"),
      apiFetch<TaskTypeDefinition[]>("/api/nuspa/admin/task-types"),
      apiFetch<ClosureReason[]>("/api/nuspa/admin/closure-reasons"),
      apiFetch<ClubMapping[]>("/api/nuspa/admin/club-mappings"),
    ]);
    setRejectReasons(rejectReasonsRes);
    setTaskTypes(taskTypesRes);
    setClosureReasons(closureReasonsRes);
    setClubMappings(clubMappingsRes);
    return repsRes;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repsRes = await loadMeta();
        if (cancelled) return;
        const stored = Number(localStorage.getItem(REP_STORAGE_KEY));
        const initial = repsRes.find((r) => r.id === stored) ?? repsRes[0];
        setCurrentRepIdState(initial ? initial.id : null);
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMeta]);

  const setCurrentRepId = useCallback((id: number) => {
    setCurrentRepIdState(id);
    localStorage.setItem(REP_STORAGE_KEY, String(id));
  }, []);

  const value = useMemo<AppData>(
    () => ({
      reps,
      locations,
      sources,
      rejectReasons,
      taskTypes,
      closureReasons,
      clubMappings,
      currentRepId,
      setCurrentRepId,
      ready,
      error,
      toast,
      refetchMeta: async () => {
        await loadMeta();
      },
    }),
    [reps, locations, sources, rejectReasons, taskTypes, closureReasons, clubMappings, currentRepId, setCurrentRepId, ready, error, toast, loadMeta]
  );

  return (
    <AppDataCtx.Provider value={value}>
      {children}
      <div id="toastRoot">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.isError ? " error" : ""}`}>
            {t.message}
          </div>
        ))}
      </div>
    </AppDataCtx.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataCtx);
  if (!ctx) throw new Error("useAppData, AppDataProvider içinde kullanılmalıdır.");
  return ctx;
}

import { db, nowIso, NuSpaTaskRow } from "../store";
import { badRequest, conflict as conflictErr, notFound } from "../errors";
import {
  CALENDAR_BLOCKED_END_HOUR,
  CALENDAR_BLOCKED_START_HOUR,
  CALL_BACK_MAX_DAYS,
  LEAD_STATUS,
  TASK_STATUS,
} from "../constants";

const TASK_DEFAULT_DURATION_MIN = 30;

/** Bölüm 9.1: Genel Takvim Kuralları. */
export function validateCalendarSlot(dueAtIso: string, referenceNow: Date = new Date()) {
  const due = new Date(dueAtIso);
  if (isNaN(due.getTime())) {
    throw badRequest("Geçersiz tarih/saat formatı.");
  }
  if (due.getTime() < referenceNow.getTime()) {
    throw badRequest("Geçmiş tarihli görev oluşturulamaz.");
  }
  const hour = due.getHours();
  if (hour >= CALENDAR_BLOCKED_START_HOUR && hour < CALENDAR_BLOCKED_END_HOUR) {
    throw badRequest(
      `${CALENDAR_BLOCKED_START_HOUR}:00–${CALENDAR_BLOCKED_END_HOUR}:00 arasında görev planlanamaz.`
    );
  }
  return due;
}

export function validateCallbackWindow(dueAtIso: string, calledAt: Date = new Date()) {
  const due = validateCalendarSlot(dueAtIso, calledAt);
  const maxDate = new Date(calledAt.getTime() + CALL_BACK_MAX_DAYS * 24 * 60 * 60 * 1000);
  if (due.getTime() > maxDate.getTime()) {
    throw badRequest(`Tekrar arama tarihi en geç arama zamanından ${CALL_BACK_MAX_DAYS} gün sonrası olabilir.`);
  }
  return due;
}

/**
 * Bölüm 9.2: Çift yönlü çakışma farkındalığı. NuSpa hem kendi görevlerini
 * hem de (SADECE OKUMA amaçlı) FitnessTaskMock tablosunu kontrol eder.
 * Uyarı bloklamaz; bilgi amaçlıdır.
 */
export function checkScheduleConflicts(salesRepId: number, dueAtIso: string, excludeTaskId?: number) {
  const due = new Date(dueAtIso);
  const start = due.getTime();
  const end = start + TASK_DEFAULT_DURATION_MIN * 60 * 1000;

  const nuspaTasks = db.NuSpaTask
    .where((t) => t.assignedToId === salesRepId && t.status === "ACIK" && t.dueAt !== null && t.id !== excludeTaskId)
    .filter((t) => {
      const tStart = new Date(t.dueAt as string).getTime();
      const tEnd = tStart + TASK_DEFAULT_DURATION_MIN * 60 * 1000;
      return tStart < end && tEnd > start;
    });

  const fitnessTasks = db.FitnessTaskMock
    .where((t) => t.salesRepId === salesRepId)
    .filter((t) => {
      const tStart = new Date(t.startAt).getTime();
      const tEnd = new Date(t.endAt).getTime();
      return tStart < end && tEnd > start;
    });

  return {
    hasConflict: nuspaTasks.length > 0 || fitnessTasks.length > 0,
    conflictingNuspaTasks: nuspaTasks,
    conflictingFitnessTasks: fitnessTasks, // salt okunur - bilgi amaçlı
  };
}

export function getOpenMainTask(leadId: number): NuSpaTaskRow | undefined {
  return db.NuSpaTask
    .where((t) => t.leadId === leadId && t.status === "ACIK")
    .sort((a, b) => b.id - a.id)[0];
}

/** Bölüm 8.2 tekillik kuralı: bir Member için aynı anda en fazla bir açık ana görev. */
export function createTask(input: {
  leadId: number;
  type: string;
  assignedToId?: number | null;
  dueAt?: string | null;
  reasonCode?: string | null;
  note?: string | null;
  skipSingleOpenTaskCheck?: boolean;
}): NuSpaTaskRow {
  const existingOpen = getOpenMainTask(input.leadId);
  if (existingOpen && !input.skipSingleOpenTaskCheck) {
    throw conflictErr("Bu lead için zaten açık bir ana görev var; yeni görev açılamaz.", {
      existingTaskId: existingOpen.id,
    });
  }

  const task = db.NuSpaTask.insert({
    leadId: input.leadId,
    type: input.type,
    assignedToId: input.assignedToId ?? null,
    status: TASK_STATUS.ACIK,
    dueAt: input.dueAt ?? null,
    closedByActivityId: null,
    reasonCode: input.reasonCode ?? null,
    note: input.note ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  // Ret/Satış/Pasif sonrası bu lead için yeni bir görev planlanması, Bölüm
  // 13.3'teki "yeni talep -> tekrar Aktif" kuralıyla aynı mantıkla lead'i
  // tekrar Aktif statüsüne çeker.
  db.NuSpaLead.update(input.leadId, { openTaskId: task.id, status: LEAD_STATUS.AKTIF, updatedAt: nowIso() });

  // Bir göreve satış danışmanı atanması, o lead'in sahipliğini de o danışmana
  // taşır (Satış Temsilcisi kolonunda görünen kişi ile görevi üstlenen kişi
  // her zaman aynı olsun diye). Farklı bir sahip varsa serbest bırakılır.
  if (input.assignedToId) {
    assignLeadOwner(input.leadId, input.assignedToId);
  }

  return task;
}

function assignLeadOwner(leadId: number, salesRepId: number) {
  const currentActive = db.NuSpaLeadAssignment.findOne((a) => a.leadId === leadId && a.releasedAt === null);
  if (currentActive && currentActive.salesRepId === salesRepId) return;

  if (currentActive) {
    db.NuSpaLeadAssignment.update(currentActive.id, { releasedAt: nowIso(), releaseReasonCode: "YENI_GOREV_ATANDI" });
  }
  const lead = db.NuSpaLead.find(leadId);
  db.NuSpaLeadAssignment.insert({
    leadId,
    salesRepId,
    locationId: lead?.locationId ?? null,
    assignedAt: nowIso(),
    releasedAt: null,
    releaseReasonCode: null,
    releaseNote: null,
  });
}

export function closeTask(
  taskId: number,
  input: { status: string; reasonCode?: string | null; note?: string | null; closedByActivityId?: number | null }
): NuSpaTaskRow {
  const task = db.NuSpaTask.find(taskId);
  if (!task) throw notFound("Görev bulunamadı.");
  if (task.status !== TASK_STATUS.ACIK) {
    throw badRequest("Görev zaten kapalı.");
  }

  const updated = db.NuSpaTask.update(taskId, {
    status: input.status,
    reasonCode: input.reasonCode ?? task.reasonCode,
    note: input.note ?? task.note,
    closedByActivityId: input.closedByActivityId ?? null,
    updatedAt: nowIso(),
  });

  const lead = db.NuSpaLead.find(task.leadId);
  if (lead?.openTaskId === taskId) {
    db.NuSpaLead.update(lead.id, { openTaskId: null, updatedAt: nowIso() });
  }
  return updated;
}

/** Sürükle-bırak yeniden planlama: önceki görevden önceye alınamaz. */
export function rescheduleTask(taskId: number, newDueAtIso: string): NuSpaTaskRow {
  const task = db.NuSpaTask.find(taskId);
  if (!task) throw notFound("Görev bulunamadı.");
  if (task.status !== TASK_STATUS.ACIK) throw badRequest("Sadece açık görevler yeniden planlanabilir.");

  const newDue = validateCalendarSlot(newDueAtIso);
  if (task.dueAt && newDue.getTime() < new Date(task.dueAt).getTime()) {
    throw badRequest("Görev, önceki planlanan zamandan önceye alınamaz.");
  }

  return db.NuSpaTask.update(taskId, { dueAt: newDue.toISOString(), updatedAt: nowIso() });
}

export function listTasks(filters: {
  salesRepId?: number;
  locationId?: number;
  status?: string;
  type?: string;
}) {
  const now = nowIso();
  let rows = db.NuSpaTask.all();

  if (filters.salesRepId) rows = rows.filter((t) => t.assignedToId === filters.salesRepId);
  if (filters.type) rows = rows.filter((t) => t.type === filters.type);
  if (filters.locationId) {
    rows = rows.filter((t) => {
      const lead = db.NuSpaLead.find(t.leadId);
      return lead?.locationId === filters.locationId;
    });
  }
  if (filters.status === "GECIKMIS") {
    rows = rows.filter((t) => t.status === "ACIK" && t.dueAt !== null && t.dueAt < now);
  } else if (filters.status) {
    rows = rows.filter((t) => t.status === filters.status);
  }

  rows = rows.sort((a, b) => {
    if (a.dueAt === null && b.dueAt === null) return 0;
    if (a.dueAt === null) return 1;
    if (b.dueAt === null) return -1;
    return a.dueAt.localeCompare(b.dueAt);
  });

  return rows.map((t) => {
    const lead = db.NuSpaLead.find(t.leadId);
    const member = lead ? db.Member.find(lead.memberId) : undefined;
    const rep = t.assignedToId ? db.SalesRep.find(t.assignedToId) : undefined;
    return {
      ...t,
      assignedToName: rep?.name ?? null,
      memberName: member?.name ?? null,
      memberSurname: member?.surname ?? null,
      leadLocationId: lead?.locationId ?? null,
      isOverdue: t.status === "ACIK" && !!t.dueAt && new Date(t.dueAt).getTime() < Date.now(),
    };
  });
}

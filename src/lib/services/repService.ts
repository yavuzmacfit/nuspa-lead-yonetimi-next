import { db, nowIso } from "../store";
import { notFound } from "../errors";
import { LEAD_STATUS, TASK_STATUS } from "../constants";
import { getOpenMainTask, closeTask } from "./taskService";

export function listSalesReps() {
  return db.SalesRep.all()
    .map((sr) => ({ ...sr, locationName: sr.locationId ? db.NuSpaLocation.find(sr.locationId)?.name ?? null : null }))
    .sort((a, b) => b.isActive - a.isActive || a.name.localeCompare(b.name));
}

/**
 * Bölüm 12: Kullanıcı işten ayrılma veya pasife alma.
 * Satış/Ret/Pasif statülerindeki leadlere dokunulmaz. Aktif statüdeki
 * leadler için açık görev iptal edilir ve lead aynı lokasyonda havuza döner.
 */
export function deactivateSalesRep(salesRepId: number) {
  const rep = db.SalesRep.find(salesRepId);
  if (!rep) throw notFound("Satış danışmanı bulunamadı.");

  db.SalesRep.update(salesRepId, { isActive: 0 });

  const activeAssignments = db.NuSpaLeadAssignment.where(
    (a) => a.salesRepId === salesRepId && a.releasedAt === null
  );

  const releasedLeadIds: number[] = [];
  for (const assignment of activeAssignments) {
    const lead = db.NuSpaLead.find(assignment.leadId);
    if (!lead || lead.status !== LEAD_STATUS.AKTIF) continue; // Satış/Ret/Pasif -> dokunulmaz

    const openTask = getOpenMainTask(assignment.leadId);
    if (openTask) {
      closeTask(openTask.id, { status: TASK_STATUS.IPTAL, reasonCode: "KULLANICI_PASIF" });
    }
    db.NuSpaLeadAssignment.update(assignment.id, {
      releasedAt: nowIso(),
      releaseReasonCode: "KULLANICI_PASIF",
    });
    releasedLeadIds.push(assignment.leadId);
  }

  return { rep: db.SalesRep.find(salesRepId), releasedLeadIds };
}

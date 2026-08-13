import { db, nowIso } from "../store";
import { badRequest, conflict, notFound } from "../errors";
import { getLeadAggregate } from "./leadService";
import { getDefaultLocation } from "./locationService";

function randomAlotechCallId(): string {
  return "ALOTECH-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * Bölüm 6: "Ara" aksiyonu ile lead sahiplenme.
 * Sahiplenme ve arama başlatma aynı işlem akışında yürütülür.
 */
export function startCall(leadId: number, salesRepId: number, opts: { simulateAlotechFailure?: boolean } = {}) {
  const lead = getLeadAggregate(leadId);
  if (!lead) throw notFound("Lead bulunamadı.");

  const rep = db.SalesRep.findOne((r) => r.id === salesRepId && r.isActive === 1);
  if (!rep) throw badRequest("Geçersiz veya pasif satış danışmanı.");

  // Bölüm 5.3: lokasyonsuz (tier-only veya DigitalNuSpaLocation) lead'leri
  // yalnız NuSpa Call Center personeli arayabilir.
  const digitalId = getDefaultLocation().id;
  const isLocationless = lead.locationId === null || lead.locationId === digitalId;
  if (isLocationless && rep.role !== "NUSPA_CALL_CENTER") {
    throw badRequest("Lokasyonsuz lead'leri yalnızca NuSpa Call Center personeli arayabilir.");
  }

  const activeAssignment = db.NuSpaLeadAssignment.findOne((a) => a.leadId === leadId && a.releasedAt === null);

  if (activeAssignment && activeAssignment.salesRepId !== salesRepId) {
    const owner = db.SalesRep.find(activeAssignment.salesRepId);
    throw conflict(`Bu lead başka bir satış danışmanı (${owner?.name ?? activeAssignment.salesRepId}) tarafından zaten alındı.`);
  }

  let assignment = activeAssignment;
  if (!assignment) {
    assignment = db.NuSpaLeadAssignment.insert({
      leadId,
      salesRepId,
      locationId: lead.locationId,
      assignedAt: nowIso(),
      releasedAt: null,
      releaseReasonCode: null,
      releaseNote: null,
    });
  }

  // Alotech arama oturumu simülasyonu
  if (opts.simulateAlotechFailure) {
    // Arama başlatılamazsa: eğer bu "Ara" ile YENİ oluşturulan bir
    // assignment varsa geri al (finalize edilmez), lead havuzda kalsın.
    if (!activeAssignment) {
      db.NuSpaLeadAssignment.delete(assignment.id);
    }
    throw conflict("Alotech araması başlatılamadı; lead sahipliği finalize edilmedi, lead havuzda kaldı.", {
      alotechError: true,
    });
  }

  const activity = db.NuSpaLeadActivity.insert({
    leadId,
    salesRepId,
    type: "CALL",
    alotechCallId: randomAlotechCallId(),
    startedAt: nowIso(),
    endedAt: null,
    callResult: null,
    nextStep: null,
    note: null,
    createdAt: nowIso(),
  });

  return { assignment, activity, alreadyOwnedBySameRep: !!activeAssignment };
}

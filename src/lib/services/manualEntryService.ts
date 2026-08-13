import { db, nowIso, NuSpaLeadRow } from "../store";
import { badRequest } from "../errors";
import { assertNotBlacklisted, findOrCreateMemberByPhone } from "./memberService";
import { getLeadByMemberId } from "./leadService";

/**
 * Bölüm 10: Manuel Lead Girişi ve Farklı Lokasyon Uyarısı.
 * Manuel girişte, "Ara"/üzerine alma ekranından farklı olarak ayrı bir
 * lokasyon çakışması kontrolü uygulanır.
 */
export function checkOrSubmitManualEntry(
  payload: {
    name: string;
    surname: string;
    gsmAreaCode: string;
    gsmNo: string;
    email?: string | null;
  },
  salesRepId: number,
  confirmOverride = false
) {
  if (!payload.name || !payload.surname || !payload.gsmAreaCode || !payload.gsmNo) {
    throw badRequest("name, surname, gsmAreaCode ve gsmNo zorunludur.");
  }

  const rep = db.SalesRep.findOne((r) => r.id === salesRepId && r.isActive === 1);
  if (!rep) throw badRequest("Geçersiz veya pasif satış danışmanı.");
  if (!rep.locationId) throw badRequest("Manuel lead girişi için satış danışmanının bir lokasyonu olmalıdır.");
  const repLocation = db.NuSpaLocation.find(rep.locationId);

  assertNotBlacklisted(payload.gsmAreaCode, payload.gsmNo);

  const member = findOrCreateMemberByPhone(payload);
  const existingLead = getLeadByMemberId(member.id);

  if (existingLead) {
    const activeAssignment = db.NuSpaLeadAssignment.findOne(
      (a) => a.leadId === existingLead.id && a.releasedAt === null
    );
    const conflictLocationId = activeAssignment?.locationId ?? existingLead.locationId;

    if (conflictLocationId && conflictLocationId !== rep.locationId && !confirmOverride) {
      const activeRep = activeAssignment ? db.SalesRep.find(activeAssignment.salesRepId) : undefined;
      const activeLoc = activeAssignment?.locationId ? db.NuSpaLocation.find(activeAssignment.locationId) : undefined;
      return {
        requiresConfirmation: true as const,
        existingLeadId: existingLead.id,
        currentLocationName: activeLoc?.name ?? null,
        currentOwnerName: activeRep?.name ?? null,
        member,
      };
    }

    if (activeAssignment && conflictLocationId !== rep.locationId) {
      db.NuSpaLeadAssignment.update(activeAssignment.id, {
        releasedAt: nowIso(),
        releaseReasonCode: "MANUEL_GIRIS_BASKA_LOKASYON",
      });
    }
  }

  const manualSource = db.NuSpaSource.findOne((s) => s.name === "Manuel Giriş");

  let lead: NuSpaLeadRow;
  if (!existingLead) {
    lead = db.NuSpaLead.insert({
      memberId: member.id,
      status: "AKTIF",
      locationId: rep.locationId,
      tier: repLocation?.tier ?? null,
      openTaskId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  } else {
    lead = db.NuSpaLead.update(existingLead.id, {
      status: "AKTIF",
      locationId: rep.locationId,
      tier: repLocation?.tier ?? null,
      updatedAt: nowIso(),
    });
  }

  const transaction = db.NuSpaLeadTransaction.insert({
    leadId: lead.id,
    memberId: member.id,
    sourceId: manualSource?.id ?? null,
    sourceDetailId: null,
    clubId: null,
    requestedLocationId: null,
    requestedTier: null,
    resolvedLocationId: rep.locationId,
    resolvedTier: repLocation?.tier ?? null,
    sessionId: null,
    leadOwnerRaw: null,
    isSmsApproved: 0,
    hasIysPermissionMail: 0,
    hasIysPermissionCall: 0,
    hasIysPermissionSms: 0,
    digitalCampaignName: null,
    leadSourceHistorySubdetailsJson: "[]",
    thirdPartyCreateDate: null,
    rawPayloadJson: JSON.stringify({ ...payload, manualEntryBySalesRepId: salesRepId }),
    createdAt: nowIso(),
  });

  // Lead satış danışmanına atanır ve lokasyonu sd'ninkiyle aynı yapılır.
  const assignment = db.NuSpaLeadAssignment.insert({
    leadId: lead.id,
    salesRepId,
    locationId: rep.locationId,
    assignedAt: nowIso(),
    releasedAt: null,
    releaseReasonCode: null,
    releaseNote: null,
  });

  return {
    requiresConfirmation: false as const,
    member,
    lead,
    transaction,
    assignment,
  };
}

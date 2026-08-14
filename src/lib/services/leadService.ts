import { db, nowIso, NuSpaLeadRow } from "../store";
import { badRequest, notFound } from "../errors";
import { assertNotBlacklisted, findOrCreateMemberByPhone } from "./memberService";
import { resolveLocationForIntake } from "./locationService";
import { closeTask, getOpenMainTask } from "./taskService";
import { LEAD_STATUS, TASK_STATUS } from "../constants";

export interface IntakePayload {
  sourceId?: number | null;
  sourceDetailId?: number | null;
  name: string;
  surname: string;
  gsmAreaCode: string;
  gsmNo: string;
  email?: string | null;
  birthDate?: string | null;
  clubId?: number | null;
  isSmsApproved?: boolean;
  hasIysPermissonMail?: boolean;
  hasIysPermissonCall?: boolean;
  hasIysPermissonSms?: boolean;
  leadOwner?: string | null;
  leadSourceHistorySubdetails?: { key: string; value: string }[];
  thirdPartyCreateDate?: string | null;
  digitalCampaignName?: string | null;
}

function subdetailValue(subs: { key: string; value: string }[] | undefined, key: string): string | null {
  if (!subs) return null;
  const hit = subs.find((s) => s.key.toLowerCase() === key.toLowerCase());
  return hit ? hit.value : null;
}

export function getLeadAggregate(leadId: number): NuSpaLeadRow | undefined {
  return db.NuSpaLead.find(leadId);
}

export function getLeadByMemberId(memberId: number): NuSpaLeadRow | undefined {
  return db.NuSpaLead.findOne((l) => l.memberId === memberId);
}

/**
 * Ardıl görev olarak "Ret" seçildiğinde: lead statüsü RET'e çekilir ve
 * varsa açık ana görev, bu ret sebebiyle tamamlanmış olarak kapatılır.
 * Yeni bir görev AÇILMAZ (Ret bir bitiş/terminal aksiyondur).
 */
export function rejectLead(
  leadId: number,
  input: { rejectReasonLabel: string; rejectExplanation?: string | null }
): NuSpaLeadRow {
  const lead = db.NuSpaLead.find(leadId);
  if (!lead) throw notFound("Lead bulunamadı.");
  if (!input.rejectReasonLabel) throw badRequest("Ret sebebi zorunludur.");

  const reason = db.NuSpaRejectReason.findOne((r) => r.label === input.rejectReasonLabel && r.isActive === 1);
  if (!reason) throw badRequest("Geçersiz ret sebebi.");
  if (reason.requiresExplanation && !input.rejectExplanation) {
    throw badRequest(`"${reason.label}" için açıklama zorunludur.`);
  }

  db.NuSpaLead.update(leadId, { status: LEAD_STATUS.RET, updatedAt: nowIso() });

  const openTask = getOpenMainTask(leadId);
  if (openTask) {
    closeTask(openTask.id, {
      status: TASK_STATUS.TAMAMLANDI,
      reasonCode: input.rejectReasonLabel,
      note: input.rejectExplanation ?? null,
    });
  }

  return db.NuSpaLead.find(leadId)!;
}

/**
 * Bölüm 4: Lead Transaction Kabulü.
 * Gelen her yeni NuSpa satış talebi ayrı bir NuSpaLeadTransaction olarak
 * saklanır; Member bazında GÜNCEL durum NuSpaLead aggregate'inde tutulur.
 */
export function acceptLeadTransaction(payload: IntakePayload) {
  if (!payload.name || !payload.surname || !payload.gsmAreaCode || !payload.gsmNo) {
    throw badRequest("name, surname, gsmAreaCode ve gsmNo zorunludur.");
  }

  // Blacklist kontrolü (Bölüm 4.4)
  assertNotBlacklisted(payload.gsmAreaCode, payload.gsmNo);

  // Member eşleştirme (fiziksel üye kabulü dahil - aktif üyelik elemez)
  const member = findOrCreateMemberByPhone({
    name: payload.name,
    surname: payload.surname,
    gsmAreaCode: payload.gsmAreaCode,
    gsmNo: payload.gsmNo,
    email: payload.email,
    birthDate: payload.birthDate,
  });

  // Session ID ile tekrar istek kontrolü (Bölüm 4.3)
  const sessionId = subdetailValue(payload.leadSourceHistorySubdetails, "sessionId");
  if (sessionId) {
    const dup = db.NuSpaLeadTransaction
      .where((t) => t.memberId === member.id && t.sessionId === sessionId)
      .sort((a, b) => b.id - a.id)[0];
    if (dup) {
      const lead = getLeadAggregate(dup.leadId)!;
      return { member, lead, transaction: dup, deduped: true, locationResolution: null as unknown };
    }
  }

  // Lokasyon/Tier atama merdiveni (Bölüm 5.2)
  const requestedLocationName = subdetailValue(payload.leadSourceHistorySubdetails, "nuspaLocation");
  const requestedTier = subdetailValue(payload.leadSourceHistorySubdetails, "tier");
  const resolution = resolveLocationForIntake({
    requestedLocationName,
    requestedTier,
    memberFitnessLocationCode: member.fitnessLocationCode,
  });

  // NuSpaLead aggregate (Member bazında güncel durum)
  let lead = getLeadByMemberId(member.id);
  let locationChanged = false;

  if (!lead) {
    lead = db.NuSpaLead.insert({
      memberId: member.id,
      status: LEAD_STATUS.AKTIF,
      locationId: resolution.locationId,
      tier: resolution.tier,
      openTaskId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  } else {
    let newLocationId = lead.locationId;
    let newTier = lead.tier;

    if (resolution.locationId !== null) {
      if (resolution.locationId !== lead.locationId) locationChanged = true;
      newLocationId = resolution.locationId;
      newTier = resolution.tier;
    } else if (resolution.tier !== null && lead.locationId === null) {
      newTier = resolution.tier;
    }
    // Not: lokasyon bilgisi boş gelen istek, mevcut set edilmiş lokasyonu DEĞİŞTİRMEZ (Bölüm 5.1).

    const newStatus = lead.status === LEAD_STATUS.AKTIF ? lead.status : LEAD_STATUS.AKTIF; // 13.3

    lead = db.NuSpaLead.update(lead.id, {
      locationId: newLocationId,
      tier: newTier,
      status: newStatus,
      updatedAt: nowIso(),
    });

    if (locationChanged) {
      // Bölüm 11.1: yeni transaction nedeniyle lokasyon değişti -> aktif
      // assignment (varsa) serbest bırakılır, lead havuza döner.
      const activeAssignment = db.NuSpaLeadAssignment.findOne((a) => a.leadId === lead!.id && a.releasedAt === null);
      if (activeAssignment) {
        db.NuSpaLeadAssignment.update(activeAssignment.id, {
          releasedAt: nowIso(),
          releaseReasonCode: "YENI_TRANSACTION_LOKASYON_DEGISTI",
        });
      }
    }
  }

  const txn = db.NuSpaLeadTransaction.insert({
    leadId: lead.id,
    memberId: member.id,
    sourceId: payload.sourceId ?? null,
    sourceDetailId: payload.sourceDetailId ?? null,
    clubId: payload.clubId ?? null,
    requestedLocationId: null,
    requestedTier: requestedTier,
    resolvedLocationId: resolution.locationId,
    resolvedTier: resolution.tier,
    sessionId: sessionId,
    leadOwnerRaw: payload.leadOwner ?? null,
    isSmsApproved: payload.isSmsApproved ? 1 : 0,
    hasIysPermissionMail: payload.hasIysPermissonMail ? 1 : 0,
    hasIysPermissionCall: payload.hasIysPermissonCall ? 1 : 0,
    hasIysPermissionSms: payload.hasIysPermissonSms ? 1 : 0,
    digitalCampaignName: payload.digitalCampaignName ?? null,
    leadSourceHistorySubdetailsJson: JSON.stringify(payload.leadSourceHistorySubdetails ?? []),
    thirdPartyCreateDate: payload.thirdPartyCreateDate ?? null,
    rawPayloadJson: JSON.stringify(payload),
    createdAt: nowIso(),
  });

  return { member, lead, transaction: txn, deduped: false, locationResolution: resolution };
}

import { db } from "../store";
import { getDefaultLocation } from "./locationService";

export interface RepContext {
  id: number;
  role: string;
  locationId: number | null;
  tier: string | null; // rep'in lokasyonunun tier'ı (varsa)
}

export function getRepContext(salesRepId: number): RepContext {
  const rep = db.SalesRep.find(salesRepId);
  if (!rep) throw new Error("Satış danışmanı bulunamadı.");
  const locationTier = rep.locationId ? db.NuSpaLocation.find(rep.locationId)?.tier ?? null : null;
  return { id: rep.id, role: rep.role, locationId: rep.locationId, tier: locationTier };
}

/**
 * Bölüm 5: lokasyon bazlı görünürlük kuralı.
 *
 *  - NUSPA_CALL_CENTER: lokasyonu boş (tier-only) VEYA DigitalNuSpaLocation
 *    olan kayıtları görür.
 *  - NUSPA_SD / LOKASYON_YONETICISI: kendi lokasyonundaki + DigitalNuSpaLocation
 *    + (lokasyonu boş ama tier'ı kendi lokasyonunun tier'ına eşit olan) kayıtları görür.
 */
function isVisible(rep: RepContext, locationId: number | null, tier: string | null): boolean {
  const digitalId = getDefaultLocation().id;
  if (rep.role === "NUSPA_CALL_CENTER") {
    return locationId === null || locationId === digitalId;
  }
  return locationId === rep.locationId || locationId === digitalId || (locationId === null && (tier === rep.tier || tier === null));
}

function memberOf(memberId: number) {
  return db.Member.find(memberId)!;
}

export function getPool(rep: RepContext) {
  const rows = db.NuSpaLead
    .where((l) => l.status === "AKTIF" && isVisible(rep, l.locationId, l.tier))
    .filter((l) => !db.NuSpaLeadAssignment.findOne((a) => a.leadId === l.id && a.releasedAt === null))
    .map((l) => {
      const member = memberOf(l.memberId);
      const loc = l.locationId ? db.NuSpaLocation.find(l.locationId) : undefined;
      const transactionCount = db.NuSpaLeadTransaction.where((t) => t.leadId === l.id).length;
      const poolSince = db.NuSpaLeadTransaction
        .where((t) => t.leadId === l.id)
        .map((t) => t.createdAt)
        .sort()[0] ?? null;
      return {
        ...l,
        memberName: member.name,
        memberSurname: member.surname,
        gsmAreaCode: member.gsmAreaCode,
        gsmNo: member.gsmNo,
        locationName: loc?.name ?? null,
        transactionCount,
        poolSince,
      };
    })
    .sort((a, b) => (a.poolSince ?? "").localeCompare(b.poolSince ?? ""));
  return rows;
}

export function getLeadsInScope(rep: RepContext) {
  return db.NuSpaLead
    .where((l) => isVisible(rep, l.locationId, l.tier))
    .map((l) => {
      const member = memberOf(l.memberId);
      const loc = l.locationId ? db.NuSpaLocation.find(l.locationId) : undefined;
      const activeAssignment = db.NuSpaLeadAssignment.findOne((a) => a.leadId === l.id && a.releasedAt === null);
      const owner = activeAssignment ? db.SalesRep.find(activeAssignment.salesRepId) : undefined;
      const transactions = db.NuSpaLeadTransaction.where((t) => t.leadId === l.id).sort((a, b) => b.id - a.id);
      const lastTxn = transactions[0];
      const lastSource = lastTxn?.sourceId ? db.NuSpaSource.find(lastTxn.sourceId) : undefined;
      const lastSourceDetail = lastTxn?.sourceDetailId ? db.NuSpaSourceDetail.find(lastTxn.sourceDetailId) : undefined;
      const openTask = l.openTaskId ? db.NuSpaTask.find(l.openTaskId) : undefined;

      return {
        ...l,
        memberName: member.name,
        memberSurname: member.surname,
        gsmAreaCode: member.gsmAreaCode,
        gsmNo: member.gsmNo,
        email: member.email,
        fitnessClubName: member.fitnessClubName,
        exMembershipType: member.exMembershipType,
        exMembershipDuration: member.exMembershipDuration,
        isBankasiCardType: member.isBankasiCardType,
        locationName: loc?.name ?? null,
        ownerId: owner?.id ?? null,
        ownerName: owner?.name ?? null,
        lastTransactionId: lastTxn?.id ?? null,
        lastTransactionAt: lastTxn?.createdAt ?? null,
        lastSourceName: lastSource?.name ?? null,
        lastSourceDetailName: lastSourceDetail?.name ?? null,
        lastDigitalCampaignName: lastTxn?.digitalCampaignName ?? null,
        lastContactPermission: lastTxn ? (lastTxn.hasIysPermissionCall === 1 || lastTxn.hasIysPermissionMail === 1 ? 1 : 0) : 0,
        lastSmsPermission: lastTxn ? (lastTxn.isSmsApproved === 1 || lastTxn.hasIysPermissionSms === 1 ? 1 : 0) : 0,
        openTaskType: openTask?.type ?? null,
        openTaskDueAt: openTask?.dueAt ?? null,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Telefon Sorgulama (Tüm Kulüpler): lokasyon/rep görünürlük kısıtı olmadan,
 * sistemdeki herhangi bir Member + NuSpaLead kaydını telefon numarasıyla bulur.
 */
export function searchLeadByPhone(gsmAreaCode: string, gsmNo: string) {
  const member = db.Member.findOne((m) => m.gsmAreaCode === gsmAreaCode && m.gsmNo === gsmNo);
  if (!member) return null;
  const lead = db.NuSpaLead.findOne((l) => l.memberId === member.id);
  const loc = lead?.locationId ? db.NuSpaLocation.find(lead.locationId) : undefined;
  return {
    ...(lead ?? { id: null }),
    memberName: member.name,
    memberSurname: member.surname,
    gsmAreaCode: member.gsmAreaCode,
    gsmNo: member.gsmNo,
    email: member.email,
    locationName: loc?.name ?? null,
  };
}

export function getLeadDetail(leadId: number) {
  const lead = db.NuSpaLead.find(leadId);
  if (!lead) return null;
  const member = memberOf(lead.memberId);
  const loc = lead.locationId ? db.NuSpaLocation.find(lead.locationId) : undefined;

  const transactions = db.NuSpaLeadTransaction.where((t) => t.leadId === leadId).sort((a, b) => b.id - a.id);
  const lastTxn = transactions[0];
  const lastSource = lastTxn?.sourceId ? db.NuSpaSource.find(lastTxn.sourceId) : undefined;
  const lastSourceDetail = lastTxn?.sourceDetailId ? db.NuSpaSourceDetail.find(lastTxn.sourceDetailId) : undefined;

  const leadWithDetails = {
    ...lead,
    memberName: member.name,
    memberSurname: member.surname,
    gsmAreaCode: member.gsmAreaCode,
    gsmNo: member.gsmNo,
    email: member.email,
    isActiveFitnessMember: member.isActiveFitnessMember,
    fitnessClubId: member.fitnessClubId,
    fitnessLocationCode: member.fitnessLocationCode,
    locationName: loc?.name ?? null,
    lastSourceName: lastSource?.name ?? null,
    relatedPackageOrCampaign: lastSourceDetail?.name ?? null,
  };

  const transactionsWithSource = transactions.map((t) => ({
    ...t,
    sourceName: t.sourceId ? db.NuSpaSource.find(t.sourceId)?.name ?? null : null,
  }));
  const activities = db.NuSpaLeadActivity
    .where((a) => a.leadId === leadId)
    .sort((a, b) => b.id - a.id)
    .map((a) => ({ ...a, salesRepName: a.salesRepId ? db.SalesRep.find(a.salesRepId)?.name ?? null : null }));
  const tasks = db.NuSpaTask
    .where((t) => t.leadId === leadId)
    .sort((a, b) => b.id - a.id)
    .map((t) => ({ ...t, assignedToName: t.assignedToId ? db.SalesRep.find(t.assignedToId)?.name ?? null : null }));
  const assignments = db.NuSpaLeadAssignment
    .where((a) => a.leadId === leadId)
    .sort((a, b) => b.id - a.id)
    .map((a) => ({
      ...a,
      salesRepName: db.SalesRep.find(a.salesRepId)?.name ?? null,
      locationName: a.locationId ? db.NuSpaLocation.find(a.locationId)?.name ?? null : null,
    }));
  const saleFlows = db.NuSpaSaleFlow.where((s) => s.leadId === leadId).sort((a, b) => b.id - a.id);

  return { lead: leadWithDetails, transactions: transactionsWithSource, activities, tasks, assignments, saleFlows };
}

/** Bölüm 15: temel raporlama sayaçları. */
export function getSummary(rep: RepContext) {
  const visibleLeads = db.NuSpaLead.where((l) => isVisible(rep, l.locationId, l.tier));
  const visibleLeadIds = new Set(visibleLeads.map((l) => l.id));

  const poolCount = visibleLeads.filter(
    (l) => l.status === "AKTIF" && !db.NuSpaLeadAssignment.findOne((a) => a.leadId === l.id && a.releasedAt === null)
  ).length;

  const now = new Date();
  const visibleTasks = db.NuSpaTask.where((t) => visibleLeadIds.has(t.leadId));
  const taskCounts = {
    acik: visibleTasks.filter((t) => t.status === "ACIK" && (!t.dueAt || new Date(t.dueAt) >= now)).length,
    gecikmis: visibleTasks.filter((t) => t.status === "ACIK" && t.dueAt && new Date(t.dueAt) < now).length,
    tamamlanmis: visibleTasks.filter((t) => t.status === "TAMAMLANDI").length,
    iptal: visibleTasks.filter((t) => t.status === "IPTAL").length,
  };

  const visibleCalls = db.NuSpaLeadActivity.where((a) => a.type === "CALL" && visibleLeadIds.has(a.leadId));
  const callCounts = {
    toplamArama: visibleCalls.length,
    ulasildi: visibleCalls.filter((a) => a.callResult === "ULASILDI").length,
    cevapYok: visibleCalls.filter((a) => a.callResult === "CEVAP_YOK").length,
    mesgul: visibleCalls.filter((a) => a.callResult === "MESGUL").length,
    satisNextStep: visibleCalls.filter((a) => a.nextStep === "SATIS").length,
  };

  const visibleSales = db.NuSpaSaleFlow.where((s) => visibleLeadIds.has(s.leadId));
  const saleCounts = {
    bekliyor: visibleSales.filter((s) => s.status === "BEKLIYOR").length,
    basarili: visibleSales.filter((s) => s.status === "BASARILI").length,
    basarisiz: visibleSales.filter((s) => s.status === "BASARISIZ").length,
    suresiDoldu: visibleSales.filter((s) => s.status === "SURESI_DOLDU").length,
  };

  return { poolCount, taskCounts, callCounts, saleCounts };
}

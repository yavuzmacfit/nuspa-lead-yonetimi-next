import { db, nowIso } from "../store";
import { badRequest, notFound } from "../errors";
import { TASK_STATUS, TASK_TYPE } from "../constants";
import { closeTask, createTask, getOpenMainTask } from "./taskService";

/**
 * Bölüm 13: Satın Alma ve Close Sale Akışı.
 * Manuel satışta bekleme durumu yok, kayıt anında BAŞARILI olarak kapanır.
 * Bölüm 13.2 Kısmi Dönüşüm üç modu (a/b/c) parametrik olarak gösterir.
 */
export function makeManualSale(
  leadId: number,
  input: {
    packageName: string;
    locationId?: number | null;
    isSinglePackage?: boolean;
    conversionMode?: "a" | "b" | "c";
  }
) {
  const lead = db.NuSpaLead.find(leadId);
  if (!lead) throw notFound("Lead bulunamadı.");
  if (!input.packageName) throw badRequest("Masaj paketi zorunludur.");

  const mode = input.conversionMode ?? "a";
  const isPartial = (mode === "b" || mode === "c") && !!input.isSinglePackage;

  const saleFlow = db.NuSpaSaleFlow.insert({
    leadId,
    taskId: null,
    channel: "OLYMPUS_MANUEL",
    packageName: input.packageName,
    status: "BASARILI",
    isPartial: isPartial ? 1 : 0,
    completedAt: nowIso(),
    createdAt: nowIso(),
  });

  const openTask = getOpenMainTask(leadId);

  if (isPartial) {
    // Lead açık kalır, follow-up görevi oluşturulur.
    if (openTask) {
      closeTask(openTask.id, { status: TASK_STATUS.TAMAMLANDI, reasonCode: "KISMI_DONUSUM_SATIS" });
    }
    const followUp = createTask({
      leadId,
      type: TASK_TYPE.TELEFON_ARAMASI,
      note: "Kısmi dönüşüm sonrası follow-up (tekli paket satışı)",
    });
    return { saleFlow, lead: db.NuSpaLead.find(leadId), followUpTask: followUp };
  }

  db.NuSpaLead.update(leadId, { status: "SATIS", updatedAt: nowIso() });
  if (openTask) {
    closeTask(openTask.id, { status: TASK_STATUS.TAMAMLANDI, reasonCode: "SATIS_TAMAMLANDI" });
  }
  return { saleFlow, lead: db.NuSpaLead.find(leadId), followUpTask: null };
}

/** Bölüm 13.1: Dış Kanal Close Sale (NuSpa sitesi / başka kanal bildirimi). */
export function closeSaleFromExternalChannel(input: {
  gsmAreaCode: string;
  gsmNo: string;
  packageName: string;
}) {
  const member = db.Member.findOne((m) => m.gsmAreaCode === input.gsmAreaCode && m.gsmNo === input.gsmNo);
  if (!member) throw notFound("Bu numaraya ait Member kaydı bulunamadı.");

  const lead = db.NuSpaLead.findOne((l) => l.memberId === member.id);
  if (!lead) {
    throw badRequest("Bu Member için eşleşen bir NuSpa lead'i bulunamadı; bildirim işlenemedi.");
  }

  const saleFlow = db.NuSpaSaleFlow.insert({
    leadId: lead.id,
    taskId: null,
    channel: "DIS_KANAL",
    packageName: input.packageName,
    status: "BASARILI",
    isPartial: 0,
    completedAt: nowIso(),
    createdAt: nowIso(),
  });

  db.NuSpaLead.update(lead.id, { status: "SATIS", updatedAt: nowIso() });
  const openTask = getOpenMainTask(lead.id);
  if (openTask) {
    closeTask(openTask.id, { status: TASK_STATUS.TAMAMLANDI, reasonCode: "DIS_KANAL_SATIS" });
  }

  return { saleFlow, lead: db.NuSpaLead.find(lead.id), member };
}

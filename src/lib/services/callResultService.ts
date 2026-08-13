import { db, nowIso } from "../store";
import { badRequest, notFound } from "../errors";
import {
  CALL_RESULT,
  NEXT_STEP,
  RESULTS_REQUIRING_CALLBACK,
  TASK_STATUS,
  TASK_TYPE,
} from "../constants";
import { validateCallbackWindow, closeTask, createTask, getOpenMainTask } from "./taskService";

export interface CallResultInput {
  callResult: string;
  nextStep: string;
  callbackAt?: string; // TEKRAR_ARA için zorunlu
  saleLocationId?: number; // SATIS için zorunlu
  packageName?: string; // SATIS için zorunlu
  rejectReasonLabel?: string; // RET için zorunlu
  rejectExplanation?: string; // bazı ret sebepleri için zorunlu
}

/**
 * Bölüm 7: Arama Sonu ve Zorunlu Next Step.
 * Arama, next step seçilmeden tamamlanmış kabul edilmez.
 */
export function submitCallResult(activityId: number, input: CallResultInput) {
  const activity = db.NuSpaLeadActivity.find(activityId);
  if (!activity) throw notFound("Arama aktivitesi bulunamadı.");
  if (activity.endedAt) throw badRequest("Bu arama zaten sonuçlandırılmış.");

  if (!Object.values(CALL_RESULT).includes(input.callResult as (typeof CALL_RESULT)[keyof typeof CALL_RESULT])) {
    throw badRequest("Geçersiz arama sonucu.");
  }
  if (!Object.values(NEXT_STEP).includes(input.nextStep as (typeof NEXT_STEP)[keyof typeof NEXT_STEP])) {
    throw badRequest("Next step seçilmeden arama kapatılamaz.");
  }

  // "Cevap yok" / "Meşgul" tek başına aramayı kapatmaz -> next step zorunlu TEKRAR_ARA
  if (
    RESULTS_REQUIRING_CALLBACK.includes(input.callResult as (typeof RESULTS_REQUIRING_CALLBACK)[number]) &&
    input.nextStep !== NEXT_STEP.TEKRAR_ARA
  ) {
    throw badRequest('"Cevap yok" veya "Meşgul" sonucunda next step yalnızca "Tekrar Ara" olabilir.');
  }

  const lead = db.NuSpaLead.find(activity.leadId);
  if (!lead) throw notFound("Lead bulunamadı.");

  let task = null;
  let saleFlow = null;

  if (input.nextStep === NEXT_STEP.TEKRAR_ARA) {
    if (!input.callbackAt) throw badRequest("Tekrar arama için geri arama tarihi/saati zorunludur.");
    const due = validateCallbackWindow(input.callbackAt, new Date(activity.startedAt ?? Date.now()));
    task = createTask({
      leadId: lead.id,
      type: TASK_TYPE.TELEFON_ARAMASI,
      assignedToId: activity.salesRepId,
      dueAt: due.toISOString(),
    });
  } else if (input.nextStep === NEXT_STEP.SATIS) {
    if (!input.saleLocationId || !input.packageName) {
      throw badRequest("Satış için lokasyon ve masaj paketi zorunludur.");
    }
    // Bölüm 13 kararı: satış anında BAŞARILI olarak kapanır, bekleme durumu yok.
    saleFlow = db.NuSpaSaleFlow.insert({
      leadId: lead.id,
      taskId: null,
      channel: "OLYMPUS_MANUEL",
      packageName: input.packageName,
      status: "BASARILI",
      isPartial: 0,
      completedAt: nowIso(),
      createdAt: nowIso(),
    });
    db.NuSpaLead.update(lead.id, { status: "SATIS", updatedAt: nowIso() });
    const openTaskOnSale = getOpenMainTask(lead.id);
    if (openTaskOnSale) {
      closeTask(openTaskOnSale.id, { status: TASK_STATUS.TAMAMLANDI, reasonCode: "SATIS_TAMAMLANDI", closedByActivityId: activity.id });
    }
  } else if (input.nextStep === NEXT_STEP.RET) {
    if (!input.rejectReasonLabel) throw badRequest("Ret sebebi zorunludur.");
    const reason = db.NuSpaRejectReason.findOne((r) => r.label === input.rejectReasonLabel && r.isActive === 1);
    if (!reason) throw badRequest("Geçersiz ret sebebi.");
    if (reason.requiresExplanation && !input.rejectExplanation) {
      throw badRequest(`"${reason.label}" için açıklama zorunludur.`);
    }
    db.NuSpaLead.update(lead.id, { status: "RET", updatedAt: nowIso() });

    const openTask = getOpenMainTask(lead.id);
    if (openTask) {
      closeTask(openTask.id, {
        status: TASK_STATUS.TAMAMLANDI,
        reasonCode: input.rejectReasonLabel,
        note: input.rejectExplanation,
        closedByActivityId: activity.id,
      });
    }
  }

  const updatedActivity = db.NuSpaLeadActivity.update(activityId, {
    endedAt: nowIso(),
    callResult: input.callResult,
    nextStep: input.nextStep,
    note: input.rejectExplanation ?? null,
  });
  const updatedLead = db.NuSpaLead.find(lead.id);
  return { activity: updatedActivity, lead: updatedLead, task, saleFlow };
}

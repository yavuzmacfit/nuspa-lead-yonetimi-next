import { NextRequest } from "next/server";
import { apiHandler, resolveSalesRepId } from "@/lib/http";
import { badRequest } from "@/lib/errors";
import { checkLeadScheduleConflict, checkScheduleConflicts } from "@/lib/services/taskService";

// Bölüm 9.2: kaydetmeden önce çakışma kontrolü (uyarı amaçlı, bloklamaz).
// Hem satış danışmanının hem de (leadId verildiyse) lead'in kendi takvimi
// aynı slot için kontrol edilir.
export const GET = apiHandler((req: NextRequest) => {
  const salesRepId = resolveSalesRepId(req);
  const dueAt = req.nextUrl.searchParams.get("dueAt");
  if (!dueAt) throw badRequest("dueAt zorunludur.");
  const excludeTaskId = req.nextUrl.searchParams.get("excludeTaskId");
  const excludeId = excludeTaskId ? Number(excludeTaskId) : undefined;
  const leadIdParam = req.nextUrl.searchParams.get("leadId");

  const repResult = checkScheduleConflicts(salesRepId, dueAt, excludeId);
  const conflictingLeadTasks = leadIdParam ? checkLeadScheduleConflict(Number(leadIdParam), dueAt, excludeId) : [];

  return {
    hasConflict: repResult.hasConflict || conflictingLeadTasks.length > 0,
    conflictingNuspaTasks: repResult.conflictingNuspaTasks,
    conflictingFitnessTasks: repResult.conflictingFitnessTasks,
    conflictingLeadTasks,
  };
});

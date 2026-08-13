import { NextRequest } from "next/server";
import { apiHandler, resolveSalesRepId } from "@/lib/http";
import { badRequest } from "@/lib/errors";
import { checkScheduleConflicts } from "@/lib/services/taskService";

// Bölüm 9.2: kaydetmeden önce çakışma kontrolü (uyarı amaçlı, bloklamaz).
export const GET = apiHandler((req: NextRequest) => {
  const salesRepId = resolveSalesRepId(req);
  const dueAt = req.nextUrl.searchParams.get("dueAt");
  if (!dueAt) throw badRequest("dueAt zorunludur.");
  const excludeTaskId = req.nextUrl.searchParams.get("excludeTaskId");
  return checkScheduleConflicts(salesRepId, dueAt, excludeTaskId ? Number(excludeTaskId) : undefined);
});

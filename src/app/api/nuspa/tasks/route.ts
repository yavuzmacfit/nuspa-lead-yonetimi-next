import { NextRequest } from "next/server";
import { apiHandler, withStatus } from "@/lib/http";
import { createTask, listTasks, validateCalendarSlot } from "@/lib/services/taskService";

// Bölüm 8.2 / 9: Görevler + Takvim görünümü, filtrelenebilir.
export const GET = apiHandler((req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const salesRepId = sp.get("salesRepId");
  const locationId = sp.get("locationId");
  return listTasks({
    salesRepId: salesRepId ? Number(salesRepId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
    status: sp.get("status") ?? undefined,
    type: sp.get("type") ?? undefined,
  });
});

// Yönetimsel görev tipleri için manuel görev oluşturma.
export const POST = apiHandler(async (req: NextRequest) => {
  const { leadId, type, assignedToId, dueAt, note } = await req.json();
  if (dueAt) validateCalendarSlot(dueAt);
  const task = createTask({ leadId, type, assignedToId, dueAt, note });
  return withStatus(task, 201);
});

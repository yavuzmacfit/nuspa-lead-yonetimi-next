import { apiHandler } from "@/lib/http";
import { rescheduleTask } from "@/lib/services/taskService";

export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const { dueAt } = await req.json();
  return rescheduleTask(Number(params.id), dueAt);
});

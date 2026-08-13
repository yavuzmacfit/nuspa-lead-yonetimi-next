import { apiHandler } from "@/lib/http";
import { closeTask } from "@/lib/services/taskService";

export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const { status, reasonCode, note } = await req.json();
  return closeTask(Number(params.id), { status, reasonCode, note });
});

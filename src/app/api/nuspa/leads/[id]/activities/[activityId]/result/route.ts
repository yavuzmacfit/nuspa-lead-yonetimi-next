import { apiHandler } from "@/lib/http";
import { submitCallResult } from "@/lib/services/callResultService";

// Bölüm 7: Arama sonucu + zorunlu next step.
export const POST = apiHandler(async (req, { params }: { params: { id: string; activityId: string } }) => {
  const body = await req.json();
  return submitCallResult(Number(params.activityId), body);
});

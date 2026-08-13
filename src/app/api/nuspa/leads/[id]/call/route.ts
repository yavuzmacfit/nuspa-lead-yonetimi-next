import { apiHandler, resolveSalesRepId, withStatus } from "@/lib/http";
import { startCall } from "@/lib/services/callService";

// Bölüm 6: "Ara" aksiyonu = sahiplenme + arama başlatma (tek adım).
export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const salesRepId = resolveSalesRepId(req);
  const body = await req.json().catch(() => ({}));
  const result = startCall(Number(params.id), salesRepId, {
    simulateAlotechFailure: body?.simulateAlotechFailure === true,
  });
  return withStatus(result, 201);
});

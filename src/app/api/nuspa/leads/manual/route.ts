import { NextRequest } from "next/server";
import { apiHandler, resolveSalesRepId, withStatus } from "@/lib/http";
import { checkOrSubmitManualEntry } from "@/lib/services/manualEntryService";

// Bölüm 10: Manuel Lead Girişi ve Farklı Lokasyon Uyarısı.
export const POST = apiHandler(async (req: NextRequest) => {
  const salesRepId = resolveSalesRepId(req);
  const body = await req.json();
  const confirm = body.confirm === true;
  const result = checkOrSubmitManualEntry(body, salesRepId, confirm);
  return withStatus(result, result.requiresConfirmation ? 200 : 201);
});

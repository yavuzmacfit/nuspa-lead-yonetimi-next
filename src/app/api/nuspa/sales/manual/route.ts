import { NextRequest } from "next/server";
import { apiHandler, withStatus } from "@/lib/http";
import { makeManualSale } from "@/lib/services/saleService";

// Bölüm 13: "Satış Yap" - Olympus üzerinden manuel satış, rezervasyon anında kapanır.
export const POST = apiHandler(async (req: NextRequest) => {
  const { leadId, packageName, locationId, isSinglePackage, conversionMode } = await req.json();
  const result = makeManualSale(Number(leadId), { packageName, locationId, isSinglePackage, conversionMode });
  return withStatus(result, 201);
});

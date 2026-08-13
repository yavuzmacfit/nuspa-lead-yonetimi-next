import { NextRequest } from "next/server";
import { apiHandler, withStatus } from "@/lib/http";
import { closeSaleFromExternalChannel } from "@/lib/services/saleService";

// Bölüm 13.1: Dış kanal (NuSpa sitesi vb.) close sale bildirimi.
export const POST = apiHandler(async (req: NextRequest) => {
  const { gsmAreaCode, gsmNo, packageName } = await req.json();
  const result = closeSaleFromExternalChannel({ gsmAreaCode, gsmNo, packageName });
  return withStatus(result, 201);
});

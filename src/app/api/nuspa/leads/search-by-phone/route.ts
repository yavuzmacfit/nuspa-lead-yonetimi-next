import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/http";
import { badRequest } from "@/lib/errors";
import { searchLeadByPhone } from "@/lib/services/reportService";

// Telefon Sorgulama (Tüm Kulüpler): lokasyon/rep kapsamından bağımsız arama.
export const GET = apiHandler((req: NextRequest) => {
  const gsmAreaCode = req.nextUrl.searchParams.get("gsmAreaCode") ?? "";
  const gsmNo = req.nextUrl.searchParams.get("gsmNo") ?? "";
  if (!gsmAreaCode || !gsmNo) throw badRequest("gsmAreaCode ve gsmNo zorunludur.");
  return searchLeadByPhone(gsmAreaCode, gsmNo);
});

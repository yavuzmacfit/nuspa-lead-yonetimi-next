import { NextRequest } from "next/server";
import { apiHandler, resolveRepContext, withStatus } from "@/lib/http";
import { acceptLeadTransaction } from "@/lib/services/leadService";
import { getLeadsInScope } from "@/lib/services/reportService";

// Bölüm 8.1: Leadler Görünümü (havuz + sahipli, kullanıcının kapsamına göre).
export const GET = apiHandler((req: NextRequest) => {
  const rep = resolveRepContext(req);
  return getLeadsInScope(rep);
});

// Bölüm 4: NuSpa Lead Transaction Kabulü (dış kaynak / walk-in / form).
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const result = acceptLeadTransaction(body);
  return withStatus(result, 201);
});

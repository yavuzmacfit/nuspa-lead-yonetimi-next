import { NextRequest } from "next/server";
import { apiHandler, resolveRepContext } from "@/lib/http";
import { getPool } from "@/lib/services/reportService";

// Bölüm 5: Tek NuSpa Lead Havuzu (lokasyon bazlı görünürlük).
export const GET = apiHandler((req: NextRequest) => {
  const rep = resolveRepContext(req);
  return getPool(rep);
});

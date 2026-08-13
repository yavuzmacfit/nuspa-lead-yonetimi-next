import { NextRequest } from "next/server";
import { apiHandler, resolveRepContext } from "@/lib/http";
import { getSummary } from "@/lib/services/reportService";

// Bölüm 15: temel raporlama sayaçları (lokasyon yetkisine göre).
export const GET = apiHandler((req: NextRequest) => getSummary(resolveRepContext(req)));

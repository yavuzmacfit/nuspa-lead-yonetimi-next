import { NextRequest } from "next/server";
import { apiHandler, resolveRepContext } from "@/lib/http";
import { getLostLeads } from "@/lib/services/reportService";

// Bölüm 11.2: Üzerimden Giden Leadler (salt okunur, tarihsel).
export const GET = apiHandler((req: NextRequest) => getLostLeads(resolveRepContext(req)));

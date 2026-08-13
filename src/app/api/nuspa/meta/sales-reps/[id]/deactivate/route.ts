import { apiHandler } from "@/lib/http";
import { deactivateSalesRep } from "@/lib/services/repService";

export const POST = apiHandler((_req, { params }: { params: { id: string } }) => deactivateSalesRep(Number(params.id)));

import { apiHandler } from "@/lib/http";
import { listSalesReps } from "@/lib/services/repService";

export const GET = apiHandler(() => listSalesReps());

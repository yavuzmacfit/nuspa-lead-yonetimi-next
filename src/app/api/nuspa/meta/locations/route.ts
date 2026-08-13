import { apiHandler } from "@/lib/http";
import { listLocations } from "@/lib/services/locationService";

export const GET = apiHandler(() => listLocations());

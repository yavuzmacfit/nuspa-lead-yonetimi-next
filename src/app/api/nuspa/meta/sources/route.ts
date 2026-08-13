import { apiHandler } from "@/lib/http";
import { listSources } from "@/lib/services/adminService";

export const GET = apiHandler(() => listSources());

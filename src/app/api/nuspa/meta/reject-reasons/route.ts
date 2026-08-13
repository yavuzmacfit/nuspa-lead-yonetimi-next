import { apiHandler } from "@/lib/http";
import { listRejectReasons } from "@/lib/services/adminService";

export const GET = apiHandler(() => listRejectReasons().filter((r) => r.isActive === 1));

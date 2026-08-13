import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const GET = apiHandler(() => admin.listTaskTypeDefinitions());

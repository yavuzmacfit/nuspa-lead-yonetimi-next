import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const DELETE = apiHandler((_req, { params }: { params: { id: string } }) => admin.deleteClubMapping(Number(params.id)));

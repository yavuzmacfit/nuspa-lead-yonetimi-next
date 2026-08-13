import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const POST = apiHandler((_req, { params }: { params: { id: string } }) => admin.setDefaultLocation(Number(params.id)));

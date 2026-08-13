import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const PUT = apiHandler(async (req, { params }: { params: { id: string } }) =>
  admin.updateTaskTypeDefinition(Number(params.id), await req.json())
);

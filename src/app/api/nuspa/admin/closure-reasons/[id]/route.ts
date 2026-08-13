import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const PUT = apiHandler(async (req, { params }: { params: { id: string } }) =>
  admin.updateClosureReason(Number(params.id), await req.json())
);
export const DELETE = apiHandler((_req, { params }: { params: { id: string } }) => admin.deleteClosureReason(Number(params.id)));

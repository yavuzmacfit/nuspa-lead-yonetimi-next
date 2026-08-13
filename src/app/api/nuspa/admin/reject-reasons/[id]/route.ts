import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const PUT = apiHandler(async (req, { params }: { params: { id: string } }) =>
  admin.updateRejectReason(Number(params.id), await req.json())
);
export const DELETE = apiHandler((_req, { params }: { params: { id: string } }) => admin.deleteRejectReason(Number(params.id)));

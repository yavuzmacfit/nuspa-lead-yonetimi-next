import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const GET = apiHandler(() => admin.listRejectReasons());
export const POST = apiHandler(async (req: NextRequest) => admin.createRejectReason(await req.json()));

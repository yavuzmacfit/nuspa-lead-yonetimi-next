import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/http";
import * as admin from "@/lib/services/adminService";

export const GET = apiHandler(() => admin.listTaskTypeDefinitions());
export const POST = apiHandler(async (req: NextRequest) => admin.createTaskTypeDefinition(await req.json()));

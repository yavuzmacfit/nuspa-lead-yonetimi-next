import { apiHandler } from "@/lib/http";
import { db } from "@/lib/store";

export const GET = apiHandler(() => db.Member.all().sort((a, b) => a.id - b.id));

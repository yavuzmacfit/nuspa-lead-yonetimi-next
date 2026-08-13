import { apiHandler } from "@/lib/http";
import { db } from "@/lib/store";

export const GET = apiHandler(() => db.NuSpaReleaseReason.where((r) => r.isActive === 1).sort((a, b) => a.id - b.id));

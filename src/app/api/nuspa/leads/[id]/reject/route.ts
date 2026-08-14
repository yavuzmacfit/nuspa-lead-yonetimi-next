import { apiHandler } from "@/lib/http";
import { rejectLead } from "@/lib/services/leadService";

// Ardıl görev olarak "Ret" seçildiğinde: lead statüsü RET'e çekilir,
// açık ana görev (varsa) bu sebeple kapatılır, yeni görev açılmaz.
export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const body = await req.json();
  return rejectLead(Number(params.id), body);
});

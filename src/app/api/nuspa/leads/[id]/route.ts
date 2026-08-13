import { apiHandler } from "@/lib/http";
import { notFound } from "@/lib/errors";
import { getLeadDetail } from "@/lib/services/reportService";

export const GET = apiHandler((_req, { params }: { params: { id: string } }) => {
  const detail = getLeadDetail(Number(params.id));
  if (!detail) throw notFound("Lead bulunamadı.");
  return detail;
});

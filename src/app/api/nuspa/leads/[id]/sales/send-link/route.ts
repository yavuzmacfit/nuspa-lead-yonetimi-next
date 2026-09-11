import { apiHandler, resolveSalesRepId, withStatus } from "@/lib/http";
import { sendReservationLink } from "@/lib/services/smsService";

// Satış Görüşmesi akışı: OTP doğrulanmış lead'e rezervasyon linkinin SMS ile gönderimi.
export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const salesRepId = resolveSalesRepId(req);
  const { link, packageType, locationId } = await req.json();
  const result = sendReservationLink(Number(params.id), salesRepId, {
    link: String(link || ""),
    packageType: packageType === "TEKLI_MASAJ" ? "TEKLI_MASAJ" : "PAKET",
    locationId: locationId ? Number(locationId) : null,
  });
  return withStatus(result, 201);
});

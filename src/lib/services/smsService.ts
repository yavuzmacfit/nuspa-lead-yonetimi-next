import { db, nowIso } from "../store";
import { badRequest, notFound } from "../errors";
import { hasVerifiedOtp } from "./otpService";

/**
 * Bölüm 13 (Satış Görüşmesi): OTP doğrulanmış lead'e rezervasyon/satın alma
 * linkinin SMS ile gönderimi. Gerçek bir SMS sağlayıcı entegre değil; gönderim
 * lead aktivitesi olarak loglanır (İşlem Tarihçesi'nde görünür).
 */
export function sendReservationLink(
  leadId: number,
  salesRepId: number,
  input: { link: string; packageType: "PAKET" | "TEKLI_MASAJ"; locationId: number | null }
) {
  const lead = db.NuSpaLead.find(leadId);
  if (!lead) throw notFound("Lead bulunamadı.");
  if (!hasVerifiedOtp(leadId)) {
    throw badRequest("OTP doğrulanmadan rezervasyon linki gönderilemez.");
  }
  if (!input.locationId) throw badRequest("Lokasyon zorunludur.");
  if (!input.link.trim()) throw badRequest("Rezervasyon linki zorunludur.");

  const location = db.NuSpaLocation.find(input.locationId);
  const typeLabel = input.packageType === "PAKET" ? "Paket" : "Tekli Masaj";

  const activity = db.NuSpaLeadActivity.insert({
    leadId,
    salesRepId,
    type: "SMS_REZERVASYON_LINKI",
    alotechCallId: null,
    startedAt: nowIso(),
    endedAt: nowIso(),
    callResult: null,
    nextStep: "SATIS",
    note: `${typeLabel} (${location?.name ?? "—"}) için rezervasyon linki SMS ile gönderildi: ${input.link.trim()}`,
    createdAt: nowIso(),
  });

  return { activity, sentAt: activity.createdAt };
}

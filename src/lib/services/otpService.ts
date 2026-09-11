import { db, nowIso } from "../store";
import { badRequest, notFound } from "../errors";

/**
 * Satış görüşmesi akışında satın alma niyetindeki lead'e SMS linki
 * gönderilmeden önce zorunlu OTP adımı. Gerçek bir SMS sağlayıcı entegre
 * değil (prototip); bu yüzden kod burada üretilip demo amaçlı geri
 * döndürülüyor.
 */
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function requestOtp(leadId: number) {
  const lead = db.NuSpaLead.find(leadId);
  if (!lead) throw notFound("Lead bulunamadı.");

  const challenge = db.NuSpaOtpChallenge.insert({
    leadId,
    code: generateCode(),
    attempts: 0,
    verified: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    createdAt: nowIso(),
    verifiedAt: null,
  });

  return { challengeId: challenge.id, devCode: challenge.code, expiresAt: challenge.expiresAt };
}

export function verifyOtp(leadId: number, challengeId: number, code: string) {
  const challenge = db.NuSpaOtpChallenge.find(challengeId);
  if (!challenge || challenge.leadId !== leadId) throw notFound("OTP isteği bulunamadı.");
  if (challenge.verified) return { verified: true };
  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    throw badRequest("OTP kodunun süresi doldu, tekrar gönderin.");
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw badRequest("Çok fazla hatalı deneme yapıldı, yeni bir OTP gönderin.");
  }
  if (challenge.code !== code.trim()) {
    db.NuSpaOtpChallenge.update(challenge.id, { attempts: challenge.attempts + 1 });
    throw badRequest("OTP kodu hatalı.");
  }

  db.NuSpaOtpChallenge.update(challenge.id, { verified: 1, verifiedAt: nowIso() });
  // Lead için OTP doğrulaması kalıcı olarak işaretlenir: "Satış Görüşmesi"
  // aksiyonu, bu doğrulama yapılmadan kullanılamaz (bkz. leadService kontrolü).
  db.NuSpaLead.update(leadId, { otpVerifiedAt: nowIso() });
  return { verified: true };
}

export function hasVerifiedOtp(leadId: number): boolean {
  return !!db.NuSpaLead.find(leadId)?.otpVerifiedAt;
}

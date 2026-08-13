import { db, nowIso, MemberRow } from "../store";
import { forbidden } from "../errors";

// Gerçek sistemde Member ana verisinin sahibi başka bir modüldür; NuSpa
// yalnızca telefon numarasından eşleştirme yapıp dönen Member ID'yi kullanır.
// Bu prototipte eşleşme bulunamazsa (entegrasyon olmadığı için) demo amaçlı
// yeni bir Member kaydı oluşturuyoruz.
export function findOrCreateMemberByPhone(input: {
  name: string;
  surname: string;
  gsmAreaCode: string;
  gsmNo: string;
  email?: string | null;
  birthDate?: string | null;
}): MemberRow {
  const existing = db.Member.findOne((m) => m.gsmAreaCode === input.gsmAreaCode && m.gsmNo === input.gsmNo);
  if (existing) return existing;

  return db.Member.insert({
    name: input.name,
    surname: input.surname,
    gsmAreaCode: input.gsmAreaCode,
    gsmNo: input.gsmNo,
    email: input.email ?? null,
    birthDate: input.birthDate ?? null,
    isActiveFitnessMember: 0,
    fitnessClubId: null,
    fitnessLocationCode: null,
    fitnessClubName: null,
    exMembershipType: null,
    exMembershipDuration: null,
    isBankasiCardType: null,
    createdAt: nowIso(),
  });
}

export function assertNotBlacklisted(gsmAreaCode: string, gsmNo: string) {
  const hit = db.BlacklistEntry.findOne((b) => b.gsmAreaCode === gsmAreaCode && b.gsmNo === gsmNo);
  if (hit) {
    throw forbidden("Bu numara blacklist kapsamında; NuSpa lead talebi reddedildi.", { gsmAreaCode, gsmNo });
  }
}

export function getMember(id: number): MemberRow | undefined {
  return db.Member.find(id);
}

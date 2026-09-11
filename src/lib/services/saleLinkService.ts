export type PackageType = "PAKET" | "TEKLI_MASAJ";

/**
 * Gerçek shop.nuspa.com.tr template ID'leri bu prototipte (DB'siz, bellek-içi
 * veri) tanımlı değil. Her lokasyon + paket türü kombinasyonu için sabit
 * (deterministik) bir placeholder template ID üretilir; gerçek entegrasyonda
 * bu ID'ler lokasyon bazlı admin verisinden gelecektir.
 */
export function buildReservationLink(locationId: number, packageType: PackageType): string {
  const templateId = 8000 + locationId * 2 + (packageType === "TEKLI_MASAJ" ? 1 : 0);
  const path = packageType === "PAKET" ? "packages" : "reservations";
  return `https://shop.nuspa.com.tr/${path}/template/${templateId}/?`;
}

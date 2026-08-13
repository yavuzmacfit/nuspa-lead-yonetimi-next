import { db, NuSpaLocationRow } from "../store";

export function listLocations(): NuSpaLocationRow[] {
  return db.NuSpaLocation
    .where((l) => l.isActive === 1)
    .sort((a, b) => (a.tier ?? "").localeCompare(b.tier ?? "") || a.name.localeCompare(b.name));
}

export function findLocationByName(name: string): NuSpaLocationRow | undefined {
  const lower = name.toLowerCase();
  return db.NuSpaLocation.findOne((l) => l.isActive === 1 && l.name.toLowerCase() === lower);
}

export function getDefaultLocation(): NuSpaLocationRow {
  const loc = db.NuSpaLocation.findOne((l) => l.isDefault === 1);
  if (!loc) throw new Error("Default NuSpa lokasyonu (DigitalNuSpaLocation) tanımlı değil.");
  return loc;
}

export function getLocation(id: number): NuSpaLocationRow | undefined {
  return db.NuSpaLocation.find(id);
}

export interface ResolvedLocation {
  locationId: number | null;
  tier: string | null;
  step: "EXPLICIT" | "TIER_ONLY" | "FITNESS_REFERENCE" | "DEFAULT";
}

/**
 * Bölüm 5.2 Lokasyon Atama Merdiveni.
 *  1. Explicit lokasyon geldiyse ve geçerli bir NuSpa lokasyonuysa -> o lokasyon.
 *  2. Lokasyon yok ama tier geldiyse -> lokasyon boş bırakılır, sadece tier set edilir.
 *  3. Lokasyon/tier yok ama üyenin fitness lokasyonu bir NuSpa lokasyonuysa -> o lokasyon.
 *  4. Hiçbiri çözülemezse -> DigitalNuSpaLocation (default).
 */
export function resolveLocationForIntake(input: {
  requestedLocationName?: string | null;
  requestedTier?: string | null;
  memberFitnessLocationCode?: string | null;
}): ResolvedLocation {
  if (input.requestedLocationName) {
    const loc = findLocationByName(input.requestedLocationName);
    if (loc) {
      return { locationId: loc.id, tier: loc.tier, step: "EXPLICIT" };
    }
  }

  if (input.requestedTier) {
    return { locationId: null, tier: input.requestedTier, step: "TIER_ONLY" };
  }

  if (input.memberFitnessLocationCode) {
    const loc = findLocationByName(input.memberFitnessLocationCode);
    if (loc) {
      return { locationId: loc.id, tier: loc.tier, step: "FITNESS_REFERENCE" };
    }
  }

  const def = getDefaultLocation();
  return { locationId: def.id, tier: def.tier, step: "DEFAULT" };
}

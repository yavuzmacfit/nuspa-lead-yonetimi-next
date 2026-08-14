import { db } from "../store";
import { badRequest, notFound } from "../errors";

/**
 * Sistem Yönetimi ekranları (Kaynaklar, Ret Tanımları, Görevler, Neden
 * Kodları, Lokasyon & Tier Yönetimi) için CRUD-lite yardımcılar.
 */

// ---------------------------------------------------------------- Kaynaklar
export function listSources() {
  const sources = db.NuSpaSource.all().sort((a, b) => a.id - b.id);
  const details = db.NuSpaSourceDetail.all().sort((a, b) => a.name.localeCompare(b.name));
  return sources.map((s) => ({ ...s, details: details.filter((d) => d.sourceId === s.id) }));
}

export function createSource(input: { name: string; description?: string; isInternal?: boolean }) {
  if (!input.name) throw badRequest("Kaynak adı zorunludur.");
  return db.NuSpaSource.insert({
    name: input.name,
    description: input.description ?? null,
    isInternal: input.isInternal ? 1 : 0,
    isActive: 1,
  });
}

export function updateSource(id: number, input: { name?: string; description?: string; isInternal?: boolean; isActive?: boolean }) {
  const existing = db.NuSpaSource.find(id);
  if (!existing) throw notFound("Kaynak bulunamadı.");
  return db.NuSpaSource.update(id, {
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    isInternal: input.isInternal !== undefined ? (input.isInternal ? 1 : 0) : existing.isInternal,
    isActive: input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive,
  });
}

export function deleteSource(id: number) {
  db.NuSpaSourceDetail.deleteWhere((d) => d.sourceId === id);
  db.NuSpaSource.delete(id);
  return { deleted: true };
}

// ------------------------------------------------------------ Ret Tanımları
export function listRejectReasons() {
  return db.NuSpaRejectReason.all().sort((a, b) => a.id - b.id);
}

export function createRejectReason(input: { label: string; description?: string; requiresExplanation?: boolean }) {
  if (!input.label) throw badRequest("Ret tanımı adı zorunludur.");
  return db.NuSpaRejectReason.insert({
    label: input.label,
    description: input.description ?? null,
    requiresExplanation: input.requiresExplanation ? 1 : 0,
    isActive: 1,
  });
}

export function updateRejectReason(id: number, input: { label?: string; description?: string; isActive?: boolean }) {
  const existing = db.NuSpaRejectReason.find(id);
  if (!existing) throw notFound("Ret tanımı bulunamadı.");
  return db.NuSpaRejectReason.update(id, {
    label: input.label ?? existing.label,
    description: input.description ?? existing.description,
    isActive: input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive,
  });
}

export function deleteRejectReason(id: number) {
  db.NuSpaRejectReason.delete(id);
  return { deleted: true };
}

// -------------------------------------------------------------- Görevler
export function listTaskTypeDefinitions() {
  return db.NuSpaTaskTypeDefinition.all().sort((a, b) => a.id - b.id);
}

function codeFromLabel(label: string): string {
  return label
    .toLocaleUpperCase("tr-TR")
    .replace(/[İI]/g, "I")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function createTaskTypeDefinition(input: { label: string; description?: string; isActive?: boolean }) {
  if (!input.label) throw badRequest("Görev adı zorunludur.");
  return db.NuSpaTaskTypeDefinition.insert({
    code: codeFromLabel(input.label) || `GOREV_${Date.now()}`,
    label: input.label,
    description: input.description ?? null,
    isActive: input.isActive ? 1 : 0,
  });
}

export function updateTaskTypeDefinition(id: number, input: { label?: string; description?: string; isActive?: boolean }) {
  const existing = db.NuSpaTaskTypeDefinition.find(id);
  if (!existing) throw notFound("Görev tanımı bulunamadı.");
  return db.NuSpaTaskTypeDefinition.update(id, {
    label: input.label ?? existing.label,
    description: input.description ?? existing.description,
    isActive: input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive,
  });
}

// -------------------------------------------------------------- Neden Kodları
export function listClosureReasons() {
  return db.NuSpaClosureReason.all().sort((a, b) => a.id - b.id);
}

export function createClosureReason(input: { label: string; taskName?: string | null; isActive?: boolean }) {
  if (!input.label) throw badRequest("Neden kodu adı zorunludur.");
  return db.NuSpaClosureReason.insert({
    label: input.label,
    taskName: input.taskName ?? null,
    isActive: input.isActive ? 1 : 0,
  });
}

export function updateClosureReason(id: number, input: { label?: string; taskName?: string | null; isActive?: boolean }) {
  const existing = db.NuSpaClosureReason.find(id);
  if (!existing) throw notFound("Neden kodu bulunamadı.");
  return db.NuSpaClosureReason.update(id, {
    label: input.label ?? existing.label,
    taskName: input.taskName !== undefined ? input.taskName : existing.taskName,
    isActive: input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive,
  });
}

export function deleteClosureReason(id: number) {
  db.NuSpaClosureReason.delete(id);
  return { deleted: true };
}

// ------------------------------------------------ Lokasyon & Tier Yönetimi
export function listAllLocations() {
  return db.NuSpaLocation.all().sort((a, b) => (a.tier ?? "").localeCompare(b.tier ?? "") || a.name.localeCompare(b.name));
}

export function createLocation(input: { name: string; tier?: string | null }) {
  if (!input.name) throw badRequest("Lokasyon adı zorunludur.");
  return db.NuSpaLocation.insert({
    name: input.name,
    tier: input.tier ?? null,
    isDefault: 0,
    fitnessClubId: null,
    isActive: 1,
  });
}

export function updateLocation(id: number, input: { name?: string; tier?: string | null; isActive?: boolean }) {
  const existing = db.NuSpaLocation.find(id);
  if (!existing) throw notFound("Lokasyon bulunamadı.");
  return db.NuSpaLocation.update(id, {
    name: input.name ?? existing.name,
    tier: input.tier !== undefined ? input.tier : existing.tier,
    isActive: input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive,
  });
}

export function deleteLocation(id: number) {
  db.NuSpaLocation.delete(id);
  return { deleted: true };
}

export function setDefaultLocation(id: number) {
  const loc = db.NuSpaLocation.find(id);
  if (!loc) throw notFound("Lokasyon bulunamadı.");
  db.NuSpaLocation.all().forEach((l) => db.NuSpaLocation.update(l.id, { isDefault: 0 }));
  return db.NuSpaLocation.update(id, { isDefault: 1 });
}

export function listClubMappings() {
  return db.NuSpaClubLocationMapping.all()
    .sort((a, b) => a.id - b.id)
    .map((m) => ({ ...m, locationName: db.NuSpaLocation.find(m.nuspaLocationId)?.name ?? null }));
}

export function createClubMapping(input: { fitnessClubName: string; nuspaLocationId: number }) {
  if (!input.fitnessClubName || !input.nuspaLocationId) {
    throw badRequest("fitnessClubName ve nuspaLocationId zorunludur.");
  }
  return db.NuSpaClubLocationMapping.insert({
    fitnessClubName: input.fitnessClubName,
    nuspaLocationId: input.nuspaLocationId,
    isActive: 1,
  });
}

export function deleteClubMapping(id: number) {
  db.NuSpaClubLocationMapping.delete(id);
  return { deleted: true };
}

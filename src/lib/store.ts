// Bellek-içi veri katmanı. Bu proje bilinçli olarak DB kullanmaz: PM'in
// hızlıca özellik/alan eklenip çıkarabildiği bir prototip olması hedefleniyor.
// Sunucu (dev) süreci ayakta kaldığı sürece veriler burada yaşar; süreç
// yeniden başladığında seed verisiyle sıfırdan kurulur.

export function nowIso(): string {
  return new Date().toISOString();
}

export class Table<T extends { id: number }> {
  private rows: T[] = [];
  private seq = 0;

  insert(row: Omit<T, "id">): T {
    this.seq += 1;
    const record = { id: this.seq, ...row } as T;
    this.rows.push(record);
    return record;
  }

  all(): T[] {
    return this.rows.slice();
  }

  find(id: number | null | undefined): T | undefined {
    if (id === null || id === undefined) return undefined;
    return this.rows.find((r) => r.id === id);
  }

  findOne(predicate: (row: T) => boolean): T | undefined {
    return this.rows.find(predicate);
  }

  where(predicate: (row: T) => boolean): T[] {
    return this.rows.filter(predicate);
  }

  update(id: number, patch: Partial<T>): T {
    const row = this.find(id);
    if (!row) throw new Error(`Kayıt bulunamadı (id=${id}).`);
    Object.assign(row, patch);
    return row;
  }

  delete(id: number): void {
    this.rows = this.rows.filter((r) => r.id !== id);
  }

  deleteWhere(predicate: (row: T) => boolean): number {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => !predicate(r));
    return before - this.rows.length;
  }

  clear(): void {
    this.rows = [];
    this.seq = 0;
  }
}

export interface MemberRow {
  id: number;
  name: string;
  surname: string;
  gsmAreaCode: string;
  gsmNo: string;
  email: string | null;
  birthDate: string | null;
  isActiveFitnessMember: number;
  fitnessClubId: number | null;
  fitnessLocationCode: string | null;
  fitnessClubName: string | null;
  exMembershipType: string | null;
  exMembershipDuration: string | null;
  isBankasiCardType: string | null;
  createdAt: string;
}

export interface BlacklistEntryRow {
  id: number;
  gsmAreaCode: string;
  gsmNo: string;
  reason: string;
  createdAt: string;
}

export interface NuSpaLocationRow {
  id: number;
  name: string;
  tier: string | null;
  isDefault: number;
  fitnessClubId: number | null;
  isActive: number;
}

export interface SalesRepRow {
  id: number;
  name: string;
  role: string;
  locationId: number | null;
  isActive: number;
}

export interface NuSpaSourceRow {
  id: number;
  name: string;
  description: string | null;
  isInternal: number;
  isActive: number;
}

export interface NuSpaSourceDetailRow {
  id: number;
  sourceId: number;
  name: string;
}

export interface NuSpaRejectReasonRow {
  id: number;
  label: string;
  description: string | null;
  requiresExplanation: number;
  isActive: number;
}

export interface NuSpaTaskTypeDefinitionRow {
  id: number;
  code: string;
  label: string;
  description: string | null;
  isActive: number;
}

export interface NuSpaClosureReasonRow {
  id: number;
  label: string;
  taskName: string | null;
  isActive: number;
}

export interface NuSpaClubLocationMappingRow {
  id: number;
  fitnessClubName: string;
  nuspaLocationId: number;
  isActive: number;
}

export interface NuSpaLeadRow {
  id: number;
  memberId: number;
  status: string;
  locationId: number | null;
  tier: string | null;
  openTaskId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NuSpaLeadTransactionRow {
  id: number;
  leadId: number;
  memberId: number;
  sourceId: number | null;
  sourceDetailId: number | null;
  clubId: number | null;
  requestedLocationId: number | null;
  requestedTier: string | null;
  resolvedLocationId: number | null;
  resolvedTier: string | null;
  sessionId: string | null;
  leadOwnerRaw: string | null;
  isSmsApproved: number;
  hasIysPermissionMail: number;
  hasIysPermissionCall: number;
  hasIysPermissionSms: number;
  digitalCampaignName: string | null;
  leadSourceHistorySubdetailsJson: string;
  thirdPartyCreateDate: string | null;
  rawPayloadJson: string;
  createdAt: string;
}

export interface NuSpaLeadAssignmentRow {
  id: number;
  leadId: number;
  salesRepId: number;
  locationId: number | null;
  assignedAt: string;
  releasedAt: string | null;
  releaseReasonCode: string | null;
  releaseNote: string | null;
}

export interface NuSpaLeadActivityRow {
  id: number;
  leadId: number;
  salesRepId: number | null;
  type: string;
  alotechCallId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  callResult: string | null;
  nextStep: string | null;
  note: string | null;
  createdAt: string;
}

export interface NuSpaTaskRow {
  id: number;
  leadId: number;
  type: string;
  assignedToId: number | null;
  status: string;
  dueAt: string | null;
  closedByActivityId: number | null;
  reasonCode: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NuSpaSaleFlowRow {
  id: number;
  leadId: number;
  taskId: number | null;
  channel: string;
  packageName: string | null;
  status: string;
  isPartial: number;
  completedAt: string | null;
  createdAt: string;
}

export interface FitnessTaskMockRow {
  id: number;
  salesRepId: number;
  title: string;
  startAt: string;
  endAt: string;
}

export interface Store {
  Member: Table<MemberRow>;
  BlacklistEntry: Table<BlacklistEntryRow>;
  NuSpaLocation: Table<NuSpaLocationRow>;
  SalesRep: Table<SalesRepRow>;
  NuSpaSource: Table<NuSpaSourceRow>;
  NuSpaSourceDetail: Table<NuSpaSourceDetailRow>;
  NuSpaRejectReason: Table<NuSpaRejectReasonRow>;
  NuSpaTaskTypeDefinition: Table<NuSpaTaskTypeDefinitionRow>;
  NuSpaClosureReason: Table<NuSpaClosureReasonRow>;
  NuSpaClubLocationMapping: Table<NuSpaClubLocationMappingRow>;
  NuSpaLead: Table<NuSpaLeadRow>;
  NuSpaLeadTransaction: Table<NuSpaLeadTransactionRow>;
  NuSpaLeadAssignment: Table<NuSpaLeadAssignmentRow>;
  NuSpaLeadActivity: Table<NuSpaLeadActivityRow>;
  NuSpaTask: Table<NuSpaTaskRow>;
  NuSpaSaleFlow: Table<NuSpaSaleFlowRow>;
  FitnessTaskMock: Table<FitnessTaskMockRow>;
}

function createStore(): Store {
  return {
    Member: new Table<MemberRow>(),
    BlacklistEntry: new Table<BlacklistEntryRow>(),
    NuSpaLocation: new Table<NuSpaLocationRow>(),
    SalesRep: new Table<SalesRepRow>(),
    NuSpaSource: new Table<NuSpaSourceRow>(),
    NuSpaSourceDetail: new Table<NuSpaSourceDetailRow>(),
    NuSpaRejectReason: new Table<NuSpaRejectReasonRow>(),
    NuSpaTaskTypeDefinition: new Table<NuSpaTaskTypeDefinitionRow>(),
    NuSpaClosureReason: new Table<NuSpaClosureReasonRow>(),
    NuSpaClubLocationMapping: new Table<NuSpaClubLocationMappingRow>(),
    NuSpaLead: new Table<NuSpaLeadRow>(),
    NuSpaLeadTransaction: new Table<NuSpaLeadTransactionRow>(),
    NuSpaLeadAssignment: new Table<NuSpaLeadAssignmentRow>(),
    NuSpaLeadActivity: new Table<NuSpaLeadActivityRow>(),
    NuSpaTask: new Table<NuSpaTaskRow>(),
    NuSpaSaleFlow: new Table<NuSpaSaleFlowRow>(),
    FitnessTaskMock: new Table<FitnessTaskMockRow>(),
  };
}

// Next.js dev modunda route module'leri hot-reload olabilir; global'e asıp
// tekil örneği koruyoruz ki "Ara" ile alınan bir lead, dosya kaydettiğimizde
// sıfırlanmasın (yalnızca sunucu süreci tam yeniden başlayınca sıfırlanır).
const globalForStore = globalThis as unknown as { __nuspaStore?: Store; __nuspaSeeded?: boolean };

export const db: Store = globalForStore.__nuspaStore ?? (globalForStore.__nuspaStore = createStore());

export function isSeeded(): boolean {
  return !!globalForStore.__nuspaSeeded;
}

export function markSeeded(): void {
  globalForStore.__nuspaSeeded = true;
}

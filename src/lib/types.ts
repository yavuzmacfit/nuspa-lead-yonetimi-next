export interface SalesRep {
  id: number;
  name: string;
  role: string;
  locationId: number | null;
  locationName: string | null;
  isActive: number;
}

export interface NuSpaLocation {
  id: number;
  name: string;
  tier: string | null;
  isDefault: number;
  isActive: number;
}

export interface SourceDetail {
  id: number;
  sourceId: number;
  name: string;
}

export interface Source {
  id: number;
  name: string;
  description: string | null;
  isInternal: number;
  isActive: number;
  details: SourceDetail[];
}

export interface RejectReason {
  id: number;
  label: string;
  description: string | null;
  requiresExplanation: number;
  isActive: number;
}

export interface ReleaseReason {
  id: number;
  code: string;
  label: string;
  isActive: number;
}

export interface TaskTypeDefinition {
  id: number;
  code: string;
  label: string;
  description: string | null;
  isActive: number;
}

export interface ClosureReason {
  id: number;
  label: string;
  isActive: number;
}

export interface ClubMapping {
  id: number;
  fitnessClubName: string;
  nuspaLocationId: number;
  locationName: string | null;
  isActive: number;
}

export interface Lead {
  id: number;
  memberId: number;
  status: string;
  locationId: number | null;
  tier: string | null;
  openTaskId: number | null;
  createdAt: string;
  updatedAt: string;
  memberName: string;
  memberSurname: string;
  gsmAreaCode: string;
  gsmNo: string;
  email: string | null;
  fitnessClubName: string | null;
  exMembershipType: string | null;
  exMembershipDuration: string | null;
  isBankasiCardType: string | null;
  locationName: string | null;
  ownerId: number | null;
  ownerName: string | null;
  lastTransactionId: number | null;
  lastTransactionAt: string | null;
  lastSourceName: string | null;
  lastSourceDetailName: string | null;
  lastDigitalCampaignName: string | null;
  lastContactPermission: number;
  lastSmsPermission: number;
  openTaskType: string | null;
  openTaskDueAt: string | null;
}

export interface TaskRow {
  id: number;
  leadId: number;
  type: string;
  assignedToId: number | null;
  assignedToName: string | null;
  status: string;
  dueAt: string | null;
  reasonCode: string | null;
  note: string | null;
  memberName: string | null;
  memberSurname: string | null;
  leadLocationId: number | null;
  isOverdue: boolean;
}

export interface LostLead {
  id: number;
  leadId: number;
  salesRepId: number;
  salesRepName: string | null;
  memberName: string | null;
  memberSurname: string | null;
  currentOwnerName: string | null;
  locationName: string | null;
  reasonLabel: string | null;
  releasedAt: string | null;
}

export type LeadOriginType = "SCHOOL" | "COURSE";
export type LeadStatus = "NUEVO" | "INTERESADO" | "VISITA" | "INSCRITO";
export type LeadTrigger = "FAVORITE" | "INFO_REQUEST" | "CONTACT_MESSAGE" | "VISIT_SCHEDULE" | "VIEW";

export interface LeadMetadata {
  notes?: string[];
  tags?: string[];
  reminderAt?: string; // ISO string
}

export interface Lead {
  id: string;
  originType: LeadOriginType;
  targetId: string;
  userId: string;
  status: LeadStatus;
  lastTrigger: LeadTrigger;
  metadata: LeadMetadata;
  createdAt: string;
  updatedAt: string;
  userName?: string; // opcional, para UI
}

import { VisitType, Photo } from './common.types';

export interface Site {
  _id: string;
  IHS_ID_SITE: string;
  Site_Name: string;
  Region: string;
  GRATO_Cluster?: string;
  Technician_Name?: string;
  Actual_Date_Visit?: Date;
  Type_of_Visit?: VisitType;
  Latitude?: number;
  Longitude?: number;
  days_since_last_visit?: number;
  needs_visit?: boolean;
  visit_history?: Visit[];
}

export interface Visit {
  visit_id: string;
  Actual_Date_Visit: Date;
  Type_of_Visit: VisitType;
  Technician_Name: string;
  technician_id: string;
  status: 'draft' | 'submitted';
  photos?: Photo[];
}


import { Photo, StatusType, PriorityType, VisitType } from './common.types';

export interface GeneratorDetail {
  generator_number: number;
  brand: string;
  serial_number: string;
  actual_running_hours: number;
  last_running_hours?: number;
  run_hours?: number;
  kva?: number;
  load_1ph?: number;
  load_2ph?: number;
  load_3ph?: number;
  dc_load?: number;
}

export interface FuelData {
  previous_fuel_quantity?: number;
  fuel_quantity_found?: number;
  fuel_quantity_added?: number;
  fuel_quantity_consumed?: number;
  tank_capacity?: number;
}

export interface ElectricalData {
  earthing_ohm?: number;
  eneo_working?: string;
  phase_type?: string;
  n_ph1_voltage?: number;
  n_ph2_voltage?: number;
  n_ph3_voltage?: number;
  eneo_meter_number?: string;
  actual_index?: number;
  previous_index?: number;
  consumed_kwa?: number;
}

export interface IssuesFound {
  DG_Issues?: string;
  IPT_BB_Issues?: string;
  Issue_of_Aircon?: string;
  Issue_of_Solar?: string;
  Any_Other_Issue?: string;
}

export interface PartUsed {
  part_id?: string;
  part_name: string;
  part_number?: string;
  quantity_used: number;
  technician_notes?: string;
}

export interface Maintenance {
  _id: string;
  maintenance_id: string;
  site_id: string;
  site_name?: string;
  visit_reference: string;
  technician: {
    _id: string;
    fullName: string;
    email: string;
  };
  technician_name?: string;
  supervisor: {
    _id: string;
    fullName: string;
  };
  visit_type: VisitType;
  visit_date: Date;
  work_performed?: string;
  issues_found?: IssuesFound;
  parts_used?: PartUsed[];
  generators_checked?: GeneratorDetail[];
  fuel_data?: FuelData;
  electrical_data?: ElectricalData;
  photos?: Photo[];
  status: StatusType;
  is_draft: boolean;
  draft_saved_at?: Date;
  submitted_at?: Date;
  reviewed_at?: Date;
  reviewed_by?: {
    _id: string;
    fullName: string;
  };
  review_comments?: string;
  rejection_reason?: string;
  completed_at?: Date;
  completion_notes?: string;
  priority: PriorityType;
  estimated_duration?: number;
  actual_duration?: number;
  createdAt: Date;
  updatedAt: Date;
  days_pending?: number;
  site_details?: {
    Site_Name: string;
    Region: string;
    GRATO_Cluster: string;
  };
}

export interface VisitFormData {
  Actual_Date_Visit: string;
  Type_of_Visit: VisitType;
  technician_id: string;
  technician_name?: string;
  Earthing_OHM?: number;
  ENEO_Working?: string;
  Phase_Type?: string;
  N_PH1_Voltage?: number;
  N_PH2_Voltage?: number;
  N_PH3_Voltage?: number;
  ENEO_Meter_Number?: string;
  Actual_Index?: number;
  Previous_Index?: number;
  Consumed_KWA?: number;
  Previous_Fuel_Quantity?: number;
  Fuel_Quantity_Found?: number;
  Fuel_Quantity_Added?: number;
  Fuel_Quantity_Consumed?: number;
  Tank_Capacity_1?: number;
  Generators_Details?: GeneratorDetail[];
  Parts_Used_During_Visit?: PartUsed[];
  Issues_Found?: IssuesFound;
  Visit_Comments?: string;
  priority?: PriorityType;
}
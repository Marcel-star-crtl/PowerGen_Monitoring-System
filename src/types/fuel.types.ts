export interface FuelConsumption {
    photos?: string[];
  _id: string;
  site_id: string;
  site_name?: string;
  generator_id?: string;
  generator_model?: string;
  record_date: Date;
  period: 'daily' | 'weekly' | 'monthly';
  fuel_data: {
    opening_level: number;
    closing_level: number;
    fuel_added: number;
    fuel_consumed: number;
    tank_capacity: number;
    fuel_type: 'diesel' | 'gasoline' | 'natural_gas';
    tank_length_cm?: number;
    tank_height_cm?: number;
    tank_width_cm?: number;
    tank_observations?: string;
    fuel_sensor_status?: string;
    dip_stick_before_cm?: number;
    dip_stick_after_cm?: number;
  };
  runtime_data?: {
    opening_hours?: number;
    closing_hours?: number;
    runtime_hours?: number;
    load_average?: number;
    truck_flow_meter_before_l?: number;
    truck_flow_meter_after_l?: number;
    truck_plate_number?: string;
    departure_time_min?: number;
    arrival_time_station?: string;
    arrival_time_site?: string;
    transfer_time_min?: number;
    quantity_transfer_l?: number;
  };
  fse_name?: string;
  planifier?: string;
  guard_name?: string;
  guard_number?: string;
  comments?: string;
  notes?: string;
  metrics?: {
    consumption_rate?: number;
    efficiency_rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    cost_estimate?: number;
    anomaly_detected?: boolean;
    anomaly_reason?: string;
  };
  request_info?: {
    fuel_requested?: number;
    request_reason?: string;
    request_urgency?: 'low' | 'medium' | 'high' | 'critical';
    requested_by?: string;
    requested_at?: Date;
  };
  approval_status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  approved_by?: {
    _id: string;
    fullName: string;
  };
  approved_at?: Date;
  approval_notes?: string;
  rejection_reason?: string;
  delivery_info?: {
    delivered: boolean;
    delivered_at?: Date;
    delivered_quantity?: number;
    delivered_by?: string;
    delivery_notes?: string;
  };
  recorded_by: {
    _id: string;
    fullName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  fuel_percentage_remaining?: number;
  days_until_empty?: number;
  site_details?: {
    Site_Name: string;
    Region: string;
    GRATO_Cluster: string;
  };
}

export interface FuelDashboard {
  period_days: number;
  total_consumption: number;
  pending_requests: number;
  critical_sites: number;
  avg_consumption_rate: number;
  anomaly_count: number;
}

export interface LowFuelAlert {
  site_id: string;
  site_name: string;
  region: string;
  cluster: string;
  technician: string;
  fuel_level: number;
  tank_capacity: number;
  fuel_percentage: number;
  last_updated: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}
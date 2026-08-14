// ─── Cycle ────────────────────────────────────────────────────────────────────
export interface DieselCycle {
  _id: string;
  cycle_key: string;       // "2026-05"
  label: string;           // "May 2026 Cycle"
  start_date: string;
  end_date: string;
  days_in_cycle: number;
  status: 'open' | 'closed' | 'archived';
  closed_at?: string;
  notes?: string;
}

// ─── Site Budget ──────────────────────────────────────────────────────────────
export interface SiteBudget {
  _id: string;
  site_id: string;
  site_name: string;
  cluster: string;
  region: string;
  topology: string;
  dg_kva: number;
  ccph: number;
  days_in_cycle: number;
  budgeted_rh: number;
  rh_per_day: number;
  final_grid_availability: number;
  budget_liters: number;
  dc_load_amps: number;
  is_fueling_site: boolean;
  cycle_key: string;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export type AlertType =
  | 'LOW_FUEL' | 'ZERO_GRID_24H' | 'CONSUMPTION_OVER_CCPH'
  | 'REFUEL_MISMATCH_CMS' | 'REFUEL_MISMATCH_TOMCARD'
  | 'MISSING_GRATO' | 'MISSING_CMS' | 'FAULTY_METER'
  | 'THEFT_SUSPECTED' | 'RH_MISMATCH'
  | 'GENERATOR_MOVED' | 'CYCLE_CLOSED' | 'DATA_IMPORTED' | 'IMPORT_ERROR';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus   = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export interface DieselAlert {
  _id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  site_id?: string;
  site_name?: string;
  cluster?: string;
  region?: string;
  cycle_key?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
  email_sent: boolean;
  email_sent_at?: string;
  email_recipients?: string[];
  read_by?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Reconciliation ───────────────────────────────────────────────────────────
export interface AlertFlags {
  low_fuel: boolean;
  zero_grid_24h: boolean;
  consumption_over_ccph: boolean;
  refuel_mismatch: boolean;
  tomcard_mismatch: boolean;
  missing_grato: boolean;
  missing_cms: boolean;
  faulty_meter: boolean;
  theft_suspected: boolean;
  rh_mismatch: boolean;
}

export interface SwapSegment {
  generator_id: string;
  ccph: number;
  from_date: string;
  to_date: string;
  rh_in_segment: number;
  consumption_in_segment: number;
}

export interface CycleReconciliation {
  _id: string;
  site_id: string;
  site_name: string;
  cluster: string;
  region: string;
  cycle_key: string;
  dg_kva: number;
  ccph: number;
  budgeted_rh: number;
  budget_liters: number;
  grid_avail_target: number;
  topology: string;
  is_fueling_site: boolean;
  generator_id: string;
  generator_brand: string;
  had_mid_cycle_swap: boolean;
  swap_segments: SwapSegment[];
  field_rh: number;
  cms_rh: number;
  final_rh: number;
  faulty_meter_days: number;
  rh_variance: number;
  rh_variance_pct: number;
  contractual_consumption: number;
  cms_consumption: number;
  cms_refuel_total: number;
  field_fuel_found: number;
  field_fuel_added: number;
  field_fuel_left: number;
  field_consumption_actual: number;
  field_visits_count: number;
  tomcard_purchased: number | null;
  cons_variance: number;
  cons_variance_pct: number;
  cons_status: 'ok' | 'over' | 'under' | 'unknown';
  refuel_field_vs_cms_var: number;
  refuel_status: 'ok' | 'discrepancy' | 'no_cms_data' | 'unknown';
  refuel_field_vs_card_var: number | null;
  card_reconciled: boolean;
  gap_cph_variation: number;
  theft_detected: boolean;
  theft_liters: number;
  grid_avail_actual: number;
  grid_avail_hours: number;
  zero_grid_max_streak: number;
  zero_grid_alert: boolean;
  has_cms_data: boolean;
  has_grato_data: boolean;
  cms_days_covered: number;
  cms_days_expected: number;
  missing_cms_days: number;
  grato_submission_missing: boolean;
  alerts: AlertFlags;
  alert_count: number;
  last_reconciled_at: string;
  is_manually_reviewed: boolean;
  override_notes?: string;
  reviewed_by?: { fullName?: string; email?: string } | string;
  reviewed_at?: string;
}

export interface ClusterSummary {
  _id: string;           // cluster name
  sites: number;
  total_budget_liters: number;
  total_field_rh: number;
  total_contractual: number;
  total_cms_consumed: number;
  total_field_added: number;
  total_tomcard: number;
  avg_cons_variance_pct: number;
  sites_over_ccph: number;
  sites_low_fuel: number;
  sites_zero_grid: number;
  sites_missing_data: number;
  total_alerts: number;
}

// ─── CMS ─────────────────────────────────────────────────────────────────────
export interface CmsUpload {
  _id: string;
  filename: string;
  data_date: string;
  cycle_key: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  sites_in_file: number;
  sites_processed: number;
  sites_skipped: number;
  errors: string[];
  warnings: string[];
  uploaded_by?: { fullName: string };
  createdAt: string;
}

export interface CmsDailyRecord {
  _id: string;
  site_id: string;
  record_date: string;
  cycle_key: string;
  gen_rh: number;
  grid_availability_hr: number;
  fuel_consumption_without_drop: number;
  fuel_consumption_rate: number;
  fuel_level_l: number;
  refuel_l: number;
  zero_grid_flag: boolean;
  consecutive_zero_grid_hours: number;
  power_topology: string;
}

// ─── Field Visits ─────────────────────────────────────────────────────────────
export interface FieldVisitRecord {
  _id: string;
  site_id: string;
  site_name: string;
  cluster: string;
  cycle_key: string;
  current_visit_date: string;
  prev_visit_date: string;
  nbr_days: number;
  generator_brand: string;
  dg_kva: number;
  ccph: number;
  prev_meter: string | number;
  current_meter: string | number;
  meter_is_faulty: boolean;
  field_rh: number;
  final_rh: number;
  cms_rh_fallback: number;
  fuel_qty_found: number;
  fuel_qty_added: number;
  fuel_qty_left: number;
  qty_consumed_actual: number;
  gap_cph_variation: number;
  theft_l: number;
  theft_detected: boolean;
  reconciliation_status: string;
}

// ─── Tom Card ─────────────────────────────────────────────────────────────────
export interface TomCardTransaction {
  _id: string;
  card_num: string;
  card_name: string;
  date: string;
  station_name: string;
  registration_num: string;
  quantity_l: number;
  amount_cfa: number;
  cycle_key: string;
  cluster?: string;
  site_id?: string;
  mapping_confidence: 'mapped' | 'station_match' | 'unlinked';
  reconciled: boolean;
}

export interface TomCardSummary {
  cycle_key: string;
  total_liters: number;
  total_amount_cfa: number;
  total_transactions: number;
  by_card: { _id: string; total_liters: number; total_cfa: number; transactions: number }[];
  by_station: { _id: string; total_liters: number; total_cfa: number }[];
}

export interface TomCardMapping {
  _id: string;
  card_num: string;
  card_label: string;
  cluster: string;
  site_ids: string[];
  station_hint: string;
  truck_plate: string;
  driver_name: string;
  is_active: boolean;
  notes: string;
}

// ─── Generator Ledger ─────────────────────────────────────────────────────────
export interface GeneratorLedgerEntry {
  _id: string;
  site_id: string;
  site_name: string;
  cluster: string;
  generator_id: string;
  generator_brand: string;
  dg_kva: number;
  ccph: number;
  assigned_at: string;
  removed_at?: string;
  is_active: boolean;
  assigned_reason: string;
  removed_reason?: string;
  cycles_affected: string[];
  recorded_by?: { fullName: string };
  removed_by?: { fullName: string };
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export interface DashboardKPIs {
  cycle: DieselCycle;
  kpis: {
    // From CycleReconciliation aggregation — genuinely optional: the
    // backend does `kpis = agg[0] || {}`, so a cycle with zero
    // CycleReconciliation records (nothing reconciled yet) has NONE of
    // these fields at all, not zeros.
    total_sites?: number;
    total_contractual?: number;
    total_cms_consumed?: number;
    total_field_added?: number;
    // Always the live source figure (FieldVisitRecord + FuelConsumption),
    // independent of whether CycleReconciliation has run — see Phase 37.
    // total_field_added itself prefers the reconciled figure when
    // available, falling back to this. Exposed separately so the UI can
    // indicate when the two diverge, or when the shown figure is the
    // live one because reconciliation hasn't run yet.
    total_field_added_live?: number;
    total_final_rh?: number;
    total_tomcard?: number;
    total_theft?: number;
    sites_over_ccph?: number;
    sites_low_fuel?: number;
    sites_zero_grid?: number;
    sites_missing_grato?: number;
    sites_missing_cms?: number;
    sites_theft_suspected?: number;
    total_alerts?: number;
    avg_cons_var_pct?: number;
    contractual_vs_cms_var?: number;
    budget_utilisation_pct: string | null;

    // From SiteBudget aggregation — always present (defaulted via `|| 0`
    // in the backend regardless of whether any CycleReconciliation exists).
    total_budget_liters: number;
    total_budget_xaf: number;
    total_liters_used_requests: number;
    budget_liters_approved_ihs: number;
    budget_by_cluster: Array<{
      _id: string; // cluster name
      sites: number;
      budget_liters: number;
      budget_xaf: number;
      liters_used: number;
      budget_liters_approved_ihs: number;
    }>;

    // From FuelRequest aggregation — always present (defaulted via `|| 0`).
    fuel_request_committed_pct: string | null;
    fuel_requests: {
      total: number;
      pending: number;
      approved: number;
      disbursed: number;
      denied: number;
      total_liters_approved: number;
      total_xaf_approved: number;
      total_xaf_disbursed: number;
    };
  };
  alerts_by_severity: Partial<Record<AlertSeverity, number>>;
  open_alerts_total: number;
}

export interface DailyTrend {
  date: string;
  total_gen_rh: number;
  total_consumed: number;
  total_refuel: number;
  total_grid_h: number;
  sites_count: number;
  zero_grid_sites: number;
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
  summary?: Record<string, any>;
  count?: number;
}

// ─── Validation (GRATO Validation Template upload) ──────────────────────────────
export interface ValidationRecord {
  _id: string;
  site_id: string;
  cycle_key: string;
  access_ticket?: string;
  state?: string;
  site_name?: string;
  customer_id?: string;
  sbc?: string;
  sbc_region?: string;
  cluster?: string;
  topology?: string;
  site_supervisor?: string;
  prev_date?: string;
  current_date?: string;
  prev_meter?: number | null;
  current_meter?: number | null;
  prev_meter_raw?: string;
  current_meter_raw?: string;
  sbc_dg_kva?: number;
  final_dg_kva?: number;
  dg_check?: boolean;
  dg_comment?: string;
  sbc_rh?: number;
  final_rh?: number;
  cms_rh?: number | null;
  cms_vs_field?: number;
  cms_vs_field_comment?: string;
  total_fuel_added_reported?: number;
  service_desk_recording?: number;
  fuel_added_var?: number;
  qty_fuel_previously?: number;
  qty_fuel_found?: number;
  qty_fuel_added?: number;
  qty_fuel_left?: number;
  final_dg_cph: number;
  sbc_cons?: number;
  final_cons?: number;
  cons_var?: number;
  all_comment?: string;
  sbc_comment?: string;
  final_comment?: string;
  cost_per_liter?: number;
  management_fee_rate?: number;
  management_amount?: number;
  upload_id?: string;
  uploaded_by?: string;
  source_filename?: string;
  source_row?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationUpload {
  _id: string;
  filename: string;
  uploaded_by: string | { fullName?: string; email?: string };
  main_rows_total: number;
  main_rows_imported: number;
  main_rows_skipped: number;
  main_technician_links: number;
  main_generator_swaps: number;
  validation_rows_total: number;
  validation_rows_imported: number;
  validation_rows_skipped: number;
  validation_cycles_touched: string[];
  site_budgets_updated: number;
  error_count: number;
  errors: string[];
  status: 'success' | 'partial' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

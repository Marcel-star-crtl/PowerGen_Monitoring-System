/**
 * TankAuditPage.tsx
 *
 * Dashboard view for tank audits captured on the mobile app — see
 * SITE TANK AUDIT PLAN. Read-only: the mobile app is the only place
 * audits are created or edited, including fully offline; this page
 * just surfaces what's already landed on the server.
 */
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useNotification } from '@/contexts/NotificationContext';
import { tankAuditApi } from '../../api/dieselApi';
import { PageHeader, Spinner, ErrorBox, EmptyState, Btn, KpiCard } from '../../components/diesel/DieselComponents';
import { neutral, ink, urgency, font } from '../../styles/dieselTokens';

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: urgency.critical.fg,
  major: urgency.high.fg,
  minor: '#CA8A04',
};

const CHECK_AREAS: { key: string; label: string }[] = [
  { key: 'check_tank_capacity_verification', label: 'Tank Capacity Verification' },
  { key: 'check_fuel_level', label: 'Fuel Level (Dip vs. CMS vs. Theoretical)' },
  { key: 'check_structural_condition', label: 'Structural Condition' },
  { key: 'check_leakage', label: 'Leakage Checks' },
  { key: 'check_caps_locking_security', label: 'Caps, Locking and Security' },
  { key: 'check_pipe_passage_earthing', label: 'Pipe Passage / Earthing' },
  { key: 'check_sensor_hardware', label: 'Sensor Hardware' },
  { key: 'check_gen_cards_faulty', label: 'Gen Cards Faulty (replace with mechanical counter meter)' },
];

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span style={{ color: neutral[400] }}>—</span>;
  const colors: Record<string, { bg: string; fg: string }> = {
    ok: { bg: '#DCFCE7', fg: '#15803D' },
    issue: { bg: '#FEE2E2', fg: '#B91C1C' },
    na: { bg: neutral[100], fg: neutral[500] },
  };
  const c = colors[status] || colors.na;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
      {status === 'na' ? 'N/A' : status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return <span style={{ color: neutral[400], fontSize: 12 }}>No issues flagged</span>;
  return (
    <span style={{ color: SEVERITY_COLOR[severity] || neutral[500], fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
      {severity}
    </span>
  );
}

export default function TankAuditPage() {
  const { success, error: showError } = useNotification();
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [audits, setAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  const [severityFilter, setSeverityFilter] = useState('');
  const [logsFilter, setLogsFilter] = useState('');
  const [siteQuery, setSiteQuery] = useState('');
  // Date range on audit_date (the day the audit actually happened) —
  // a single day is just dateFrom === dateTo, so no separate
  // "single day" mode is needed.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Blank = show both drafts and submitted audits — drafts need to be
  // immediately visible to a diesel admin per the user's explicit
  // request, not hidden until an audit is fully completed.
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [extractingRunHours, setExtractingRunHours] = useState(false);
  const [acceptingExtraction, setAcceptingExtraction] = useState(false);
  const [manualRunHoursInput, setManualRunHoursInput] = useState('');
  const [savingManualRunHours, setSavingManualRunHours] = useState(false);
  // Phase 121 — notes-scanning review panel state
  const [notesCandidates, setNotesCandidates] = useState<any[]>([]);
  const [notesCandidatesLoading, setNotesCandidatesLoading] = useState(false);
  const [notesCandidatesScanned, setNotesCandidatesScanned] = useState(false);
  const [notesScanMeta, setNotesScanMeta] = useState<{ audits_scanned: number; audits_with_candidates: number } | null>(null);
  const [acceptingNotesAuditId, setAcceptingNotesAuditId] = useState<string | null>(null);
  // Phase 138 — audit analytics section
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [reconOpen, setReconOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [exportingReconciliation, setExportingReconciliation] = useState(false);

  // ── Cycle reconciliation (gain/loss) — Phase 106/107 ──────────────────
  // A genuinely different shape of data from the audit list above: a
  // per-site rollup across a whole cycle (every site, audited or not),
  // not a paginated list of individual audit submissions. Kept as its
  // own section rather than force it into the existing table.
  const [reconCycleKey, setReconCycleKey] = useState('2026-08');
  const [reconData, setReconData] = useState<any[]>([]);
  const [reconSummary, setReconSummary] = useState<any>(null);
  const [reconLoading, setReconLoading] = useState(true);
  const [reconError, setReconError] = useState<string | null>(null);
  const [reconSiteQuery, setReconSiteQuery] = useState('');
  const [reconShowOnly, setReconShowOnly] = useState<'' | 'audited' | 'not_audited' | 'loss' | 'missing_data'>('');
  const [reconCycleFound, setReconCycleFound] = useState(true);
  const [reconDateFallbackCount, setReconDateFallbackCount] = useState(0);

  useEffect(() => {
    setReconLoading(true);
    setReconError(null);
    tankAuditApi.reconciliation(reconCycleKey)
      .then((res: any) => {
        setReconData(res?.data || []);
        setReconSummary(res?.summary || null);
        setReconCycleFound(res?.cycle_found !== false);
        setReconDateFallbackCount(res?.audits_matched_by_date_fallback || 0);
      })
      .catch((err: any) => {
        setReconData([]);
        setReconSummary(null);
        setReconError(err?.response?.data?.error || 'Failed to load cycle reconciliation data');
      })
      .finally(() => setReconLoading(false));
  }, [reconCycleKey]);

  const reconFiltered = reconData.filter(r => {
    if (reconSiteQuery.trim()) {
      const q = reconSiteQuery.trim().toLowerCase();
      if (!(r.site_id?.toLowerCase().includes(q) || r.site_name?.toLowerCase().includes(q))) return false;
    }
    if (reconShowOnly === 'audited') return r.has_recent_audit;
    if (reconShowOnly === 'not_audited') return !r.has_recent_audit;
    if (reconShowOnly === 'loss') return typeof r.gain_loss_l === 'number' && r.gain_loss_l < 0;
    if (reconShowOnly === 'missing_data') return r.data_quality_flags?.missing_opening_stock || r.data_quality_flags?.missing_cycle_data;
    return true;
  });

  function GainLossCell({ value, hasAudit, cycleClosed }: { value: number | null; hasAudit?: boolean; cycleClosed?: boolean }) {
    if (value == null) {
      if (hasAudit && !cycleClosed) {
        return <span title="Gain/Loss can only be determined once this cycle closes and a final run-hours reading exists." style={{ color: '#D97706', fontSize: 10, fontStyle: 'italic' }}>cycle open</span>;
      }
      return <span style={{ color: neutral[400] }}>—</span>;
    }
    const isLoss = value < 0;
    return (
      <span style={{ color: isLoss ? urgency.critical.fg : urgency.ok.fg, fontWeight: 700 }}>
        {isLoss ? '' : '+'}{fmt(value, 1)} L
      </span>
    );
  }

  async function handleExtractRunHours() {
    if (!selectedAudit?._id) return;
    setExtractingRunHours(true);
    try {
      const res: any = await tankAuditApi.extractRunHours(selectedAudit._id);
      setSelectedAudit((prev: any) => prev ? { ...prev, run_hours_extraction: res?.data } : prev);
      if (res?.data?.status === 'completed' && res?.data?.extracted_value != null) {
        success('Run hours extracted — review and accept below if it looks right.');
      } else {
        showError('Extraction did not find a readable value — check the photo or enter the reading manually.');
      }
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to extract run hours from the photo');
    } finally {
      setExtractingRunHours(false);
    }
  }

  async function handleAcceptExtraction() {
    if (!selectedAudit?._id) return;
    setAcceptingExtraction(true);
    try {
      const res: any = await tankAuditApi.acceptExtractedRunHours(selectedAudit._id);
      setSelectedAudit((prev: any) => prev ? {
        ...prev,
        audit_run_hours_reading: res?.data?.audit_run_hours_reading,
        run_hours_extraction: res?.data?.run_hours_extraction,
      } : prev);
      success('Extracted reading accepted as this audit\'s run-hours value.');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to accept the extracted reading');
    } finally {
      setAcceptingExtraction(false);
    }
  }

  async function handleSaveManualRunHours() {
    if (!selectedAudit?._id) return;
    const trimmed = manualRunHoursInput.trim();
    if (!trimmed) { showError('Enter a run-hours value first.'); return; }
    const value = Number(trimmed);
    if (!Number.isFinite(value)) { showError('That doesn\'t look like a valid number.'); return; }

    setSavingManualRunHours(true);
    try {
      const res: any = await tankAuditApi.setManualRunHours(selectedAudit._id, value);
      setSelectedAudit((prev: any) => prev ? {
        ...prev,
        audit_run_hours_reading: res?.data?.audit_run_hours_reading ?? value,
        audit_run_hours_reading_source: 'manual_correction',
        true_cph: res?.data?.true_cph ?? prev.true_cph,
      } : prev);
      success('Run hours saved.');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to save the run-hours value');
    } finally {
      setSavingManualRunHours(false);
    }
  }

  async function handleToggleAnalytics() {
    if (analyticsOpen) { setAnalyticsOpen(false); return; }
    setAnalyticsOpen(true);
    if (analyticsData) return; // already loaded once this session
    setAnalyticsLoading(true);
    try {
      const res: any = await tankAuditApi.analytics();
      setAnalyticsData(res);
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to load audit analytics');
      setAnalyticsOpen(false);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function handleScanNotesForRunHours() {
    setNotesCandidatesLoading(true);
    try {
      const res: any = await tankAuditApi.notesRunHoursCandidates();
      setNotesCandidates(res?.data || []);
      setNotesScanMeta({ audits_scanned: res?.audits_scanned ?? 0, audits_with_candidates: res?.audits_with_candidates ?? 0 });
      setNotesCandidatesScanned(true);
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to scan notes for run-hours values');
    } finally {
      setNotesCandidatesLoading(false);
    }
  }

  async function handleAcceptNotesCandidate(auditId: string, value: number) {
    setAcceptingNotesAuditId(auditId);
    try {
      await tankAuditApi.setManualRunHours(auditId, value);
      // Remove it from the review list on success — it's been applied,
      // no reason to keep showing it as something still needing review.
      setNotesCandidates(prev => prev.filter(c => c.audit_id !== auditId));
      success('Run hours saved from notes.');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to save this value');
    } finally {
      setAcceptingNotesAuditId(null);
    }
  }

  async function handleExportReconciliationExcel() {
    if (!reconFiltered.length) { showError('No sites match the current filter'); return; }
    setExportingReconciliation(true);
    try {
      let deliveryEvents: any[] = [];
      try {
        const res: any = await tankAuditApi.deliveryEventsForCycle(reconCycleKey);
        deliveryEvents = res?.events || [];
      } catch (err: any) {
        // Export still proceeds without the delivery-event detail rather
        // than block the whole export over one failed fetch — the
        // Reconciliation sheet's own totals are unaffected either way.
        showError('Could not load individual delivery events — exporting without that detail.');
      }

    const eventsBySite = new Map<string, any[]>();
    for (const ev of deliveryEvents) {
      if (!eventsBySite.has(ev.site_id)) eventsBySite.set(ev.site_id, []);
      eventsBySite.get(ev.site_id)!.push(ev);
    }

    const rows = reconFiltered.map(r => ({
      'Site ID': r.site_id,
      'Site Name': r.site_name || '',
      'Region': r.region || '',
      'Cluster': r.cluster || '',
      'Opening Stock (L)': r.opening_stock_l ?? (r.data_quality_flags?.missing_opening_stock ? 'missing' : ''),
      'Opening Meter (hrs)': r.opening_meter_hours ?? '',
      'Total Refueled (L)': r.total_refueled_l ?? '',
      'Times Refueled This Cycle': eventsBySite.get(r.site_id)?.length ?? (r.total_refueled_source ? 0 : ''),
      'Total Refueled Source': r.total_refueled_source === 'mail_verified' ? 'Mail-verified (exact)' : r.total_refueled_source === 'cycle_reconciliation' ? 'System aggregate' : '',
      'Validated CPH': r.validated_cph ?? '',
      'Closing Meter (hrs)': r.closing_meter_hours ?? '',
      'System Consumption (L)': r.system_consumption_l ?? '',
      'Theoretical Stock — Actualized (L)': r.stock_actualized_1_l ?? '',
      'Audited': r.has_recent_audit ? 'Yes' : 'No',
      'Audit Date': r.audit_date ? new Date(r.audit_date).toLocaleDateString() : '',
      'Auditor': r.auditor_name || '',
      'Dip Reading (L)': r.dip_reading_l ?? '',
      'Run Hours (audit)': r.audit_run_hours_reading ?? '',
      'Find Consumption (L)': r.find_consumption_l ?? '',
      'True CPH (from this audit)': r.true_cph ?? '',
      'Gain / Loss (L)': r.gain_loss_l ?? '',
      'Missing Opening Stock': r.data_quality_flags?.missing_opening_stock ? 'Yes' : '',
      'Missing Cycle Data': r.data_quality_flags?.missing_cycle_data ? 'Yes' : '',
    }));
    const summaryRows = reconSummary ? [{
      'Cycle': reconCycleKey,
      'Total Sites': reconSummary.total_sites ?? 0,
      'Audited': reconSummary.sites_audited ?? 0,
      'Not Yet Audited': (reconSummary.total_sites ?? 0) - (reconSummary.sites_audited ?? 0),
      'Sites With a Loss': reconSummary.sites_with_loss ?? 0,
      'Missing Opening Stock': reconSummary.sites_missing_opening_stock ?? 0,
      'Missing Cycle Data': reconSummary.sites_missing_cycle_data ?? 0,
    }] : [];

    // Every individual delivery event, filtered to the sites currently
    // on screen (respects the same search/filter as the Reconciliation
    // sheet) — directly answers "how many times, and what quantity on
    // each date," not just a summed total.
    const visibleSiteIds = new Set(reconFiltered.map(r => r.site_id));
    const eventRows = deliveryEvents
      .filter(ev => visibleSiteIds.has(ev.site_id))
      .map(ev => ({
        'Site ID': ev.site_id,
        'Site Name': ev.site_name || '',
        'Cluster': ev.cluster || '',
        'Delivery Date': new Date(ev.delivery_date).toLocaleDateString(),
        'Quantity (L)': ev.quantity_l ?? '',
        'Dip Stick Reading (L)': ev.dip_stick_qty_l ?? '',
        'RMS Reading (L)': ev.rms_qty_l ?? '',
        'Truck Flow Meter (L)': ev.truck_flow_meter_qty_l ?? '',
        'Gen Running Hour': ev.gen_running_hour ?? '',
        'Truck Plate': ev.truck_plate_number || '',
        'Note': ev.raison || '',
      }));

    const wb = XLSX.utils.book_new();
    if (summaryRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Reconciliation');
    if (eventRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventRows), 'Delivery Events');
    XLSX.writeFile(wb, `Cycle_Reconciliation_${reconCycleKey}_${Date.now()}.xlsx`);
    success(`Exported ${rows.length} site(s)${eventRows.length ? ` and ${eventRows.length} delivery event(s)` : ''} to Excel`);
    } finally {
      setExportingReconciliation(false);
    }
  }

  useEffect(() => {
    tankAuditApi.summary()
      .then((res: any) => setSummary((res as any)?.data || res))
      .catch((err: any) => setError(err?.response?.data?.error || 'Failed to load tank audit summary'))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    setAuditsLoading(true);
    tankAuditApi.list({
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      logsCollected: logsFilter || undefined,
      siteId: siteQuery.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'audit_date',
      sortOrder,
      page,
      limit: 20,
    })
      .then((res: any) => {
        setAudits((res as any)?.data || []);
        setPagination((res as any)?.pagination || null);
      })
      .catch(() => { setAudits([]); setPagination(null); })
      .finally(() => setAuditsLoading(false));
  }, [statusFilter, severityFilter, logsFilter, siteQuery, dateFrom, dateTo, sortOrder, page]);

  async function openAudit(id: string) {
    setSelectedLoading(true);
    try {
      const res: any = await tankAuditApi.get(id);
      const audit = res?.data || res;
      setSelectedAudit(audit);
      setManualRunHoursInput(audit?.audit_run_hours_reading != null ? String(audit.audit_run_hours_reading) : '');
    } catch {
      setSelectedAudit(null);
    } finally {
      setSelectedLoading(false);
    }
  }

  // Shared by both export paths — pulls every record matching the
  // current filters, not just the current page, since an export is
  // expected to be a complete snapshot of what's currently filtered
  // for, not just what's visible on screen right now.
  async function fetchAllMatchingAudits(): Promise<any[]> {
    const res: any = await tankAuditApi.list({
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      logsCollected: logsFilter || undefined,
      siteId: siteQuery.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: 'audit_date',
      sortOrder,
      page: 1,
      limit: 5000,
    });
    return res?.data || [];
  }

  function checkCell(audit: any, key: string, field: 'status' | 'severity' | 'notes') {
    const item = audit[key];
    if (!item) return '';
    if (field === 'severity') return item.status === 'issue' ? (item.severity || '') : '';
    return item[field] ?? '';
  }

  async function handleExportExcel() {
    setExporting('excel');
    try {
      const allAudits = await fetchAllMatchingAudits();
      if (!allAudits.length) { showError('No audits match the current filters'); return; }

      const summaryRows = summary ? [{
        'Total Submitted Audits': summary.total_audits ?? 0,
        'Drafts In Progress': summary.draft_count ?? 0,
        'Critical Findings': summary.by_severity?.critical ?? 0,
        'Major Findings': summary.by_severity?.major ?? 0,
        'Minor Findings': summary.by_severity?.minor ?? 0,
        'No Issues Flagged': summary.by_severity?.none ?? 0,
        'Logs Collected': summary.logs_collected?.collected ?? 0,
        'Logs Not Collected': summary.logs_collected?.notCollected ?? 0,
        'Logs Unspecified': summary.logs_collected?.unspecified ?? 0,
      }] : [];

      const auditRows = allAudits.map((a: any) => {
        const row: Record<string, any> = {
          'Status': a.status === 'draft' ? 'DRAFT' : 'SUBMITTED',
          'Site ID': a.site_id_ihs || '',
          'Site Name': a.site_name || '',
          'Region': a.region || '',
          'Cluster': a.cluster || '',
          'Site Priority': a.site_priority || '',
          'Audit Date': a.audit_date ? new Date(a.audit_date).toLocaleDateString() : '',
          'Auditor': a.auditor_name || '',
          'Tank Capacity (L)': a.tank_capacity_l ?? '',
          'Dip Reading (L)': a.dip_reading_l ?? '',
          'CMS Reading (L)': a.cms_reading_l ?? '',
          'Theoretical Stock (L)': a.theoretical_stock_l ?? '',
          'Variance (%)': a.variance_pct ?? '',
          'Cycle': a.cycle_key ?? '',
          'Opening Stock (L)': a.opening_stock_l ?? (a.reconciliation_flags?.missing_opening_stock ? 'missing' : ''),
          'Opening Meter (hrs)': a.opening_meter_hours ?? '',
          'Total Refueled (L)': a.total_refueled_l ?? '',
          'Total Refueled Source': a.total_refueled_source === 'mail_verified' ? 'Mail-verified (exact)' : a.total_refueled_source === 'cycle_reconciliation' ? 'System aggregate' : '',
          'Validated CPH': a.validated_cph ?? '',
          'Closing Meter (hrs)': a.closing_meter_hours ?? '',
          'Theoretical Stock — Actualized (L)': a.stock_actualized_1_l ?? '',
          'Run Hours (audit)': a.audit_run_hours_reading ?? '',
          'Find Consumption (L)': a.find_consumption_l ?? '',
          'True CPH (from this audit)': a.true_cph ?? '',
          'Gain / Loss (L)': a.gain_loss_l ?? '',
          'Overall Severity': a.overall_severity || 'None',
          'Logs Collected': a.logs_collected === true ? 'Yes' : a.logs_collected === false ? 'No' : '',
          'Gen Card Faulty': a.gen_card_faulty === true ? 'Yes' : a.gen_card_faulty === false ? 'No' : '',
        };
        for (const area of CHECK_AREAS) {
          row[`${area.label} — Status`] = checkCell(a, area.key, 'status');
          row[`${area.label} — Severity`] = checkCell(a, area.key, 'severity');
          row[`${area.label} — Notes`] = checkCell(a, area.key, 'notes');
        }
        row['General Notes'] = a.general_notes || '';
        return row;
      });

      const wb = XLSX.utils.book_new();
      if (summaryRows.length) {
        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      }
      const auditsSheet = XLSX.utils.json_to_sheet(auditRows);
      XLSX.utils.book_append_sheet(wb, auditsSheet, 'Audits');
      XLSX.writeFile(wb, `Tank_Audits_${Date.now()}.xlsx`);
      success(`Exported ${auditRows.length} audit(s) to Excel`);
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to export to Excel');
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPDF() {
    setExporting('pdf');
    try {
      const allAudits = await fetchAllMatchingAudits();
      if (!allAudits.length) { showError('No audits match the current filters'); return; }

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('Tank Audit Report', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);

      if (summary) {
        doc.setFontSize(11);
        doc.setTextColor(0);
        const summaryLine =
          `Total Audits: ${summary.total_audits ?? 0}   |   Drafts In Progress: ${summary.draft_count ?? 0}   |   ` +
          `Critical: ${summary.by_severity?.critical ?? 0}   |   Major: ${summary.by_severity?.major ?? 0}   |   ` +
          `Minor: ${summary.by_severity?.minor ?? 0}   |   No Issues: ${summary.by_severity?.none ?? 0}`;
        doc.text(summaryLine, 14, 30);
        const logsLine =
          `Logs Collected: ${summary.logs_collected?.collected ?? 0}   |   Not Collected: ${summary.logs_collected?.notCollected ?? 0}   |   ` +
          `Unspecified: ${summary.logs_collected?.unspecified ?? 0}`;
        doc.text(logsLine, 14, 36);
      }

      // Summary-level table only — a full per-check breakdown for every
      // audit doesn't fit a page width usefully; that level of detail
      // is what the Excel export is for. This matches the same columns
      // already shown in the on-screen audit list.
      autoTable(doc, {
        startY: summary ? 42 : 26,
        head: [['Status', 'Site', 'Site ID', 'Audit Date', 'Auditor', 'Fuel Variance', 'True CPH', 'Gain / Loss (L)', 'Logs Collected', 'Gen Card Faulty', 'Severity']],
        body: allAudits.map((a: any) => [
          a.status === 'draft' ? 'DRAFT' : 'SUBMITTED',
          a.site_name || a.site_id_ihs || '',
          a.site_id_ihs || '',
          a.audit_date ? new Date(a.audit_date).toLocaleDateString() : '',
          a.auditor_name || '',
          a.variance_pct != null ? `${a.variance_pct > 0 ? '+' : ''}${a.variance_pct}%` : '',
          a.true_cph != null ? a.true_cph.toFixed(2) : '',
          a.gain_loss_l != null ? `${a.gain_loss_l > 0 ? '+' : ''}${a.gain_loss_l.toFixed(1)}` : '',
          a.logs_collected === true ? 'Yes' : a.logs_collected === false ? 'No' : '',
          a.gen_card_faulty === true ? 'Yes' : a.gen_card_faulty === false ? 'No' : '',
          a.overall_severity || 'None',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 116, 144] },
      });

      doc.save(`Tank_Audits_${Date.now()}.pdf`);
      success(`Exported ${allAudits.length} audit(s) to PDF`);
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to export to PDF');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div style={{ fontFamily: font.ui }}>
      <PageHeader
        title="🛢️ Tank Audits"
        subtitle="Site tank audits captured on the mobile app — tank capacity, fuel-level cross-checks, structural and leakage findings, and whether generator logs were collected on each visit."
        actions={
          <>
            <Btn variant="secondary" size="sm" onClick={handleExportExcel} disabled={exporting !== null}>
              {exporting === 'excel' ? 'Exporting…' : '📊 Export Excel'}
            </Btn>
            <Btn variant="secondary" size="sm" onClick={handleExportPDF} disabled={exporting !== null}>
              {exporting === 'pdf' ? 'Exporting…' : '📄 Export PDF'}
            </Btn>
          </>
        }
      />

      {error && <ErrorBox message={error} />}

      {/* ── Summary KPIs ── */}
      {summaryLoading ? <Spinner /> : summary && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KpiCard label="Total Audits" value={summary.total_audits ?? 0} icon="📋" />
            <KpiCard label="Drafts In Progress" value={summary.draft_count ?? 0} icon="✏️" color="#D97706" />
            <KpiCard label="Critical Findings" value={summary.by_severity?.critical ?? 0} icon="🚨" color={urgency.critical.fg} />
            <KpiCard label="Major Findings" value={summary.by_severity?.major ?? 0} icon="⚠️" color={urgency.high.fg} />
            <KpiCard label="Minor Findings" value={summary.by_severity?.minor ?? 0} icon="🔎" color="#CA8A04" />
            <KpiCard label="No Issues Flagged" value={summary.by_severity?.none ?? 0} icon="✅" color={urgency.ok.fg} />
          </div>

          {/* ── Logs collected ── */}
          <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📄 Generator Logs Collected</div>
            <div style={{ fontSize: 11, color: neutral[500], marginBottom: 10 }}>
              Whether generator run-hour/consumption logs were collected during each audit visit — supports the plan's run-hour vs. fuel consumption correlation objective.
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Collected</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: urgency.ok.fg }}>{summary.logs_collected?.collected ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Not Collected</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: urgency.critical.fg }}>{summary.logs_collected?.notCollected ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Unspecified</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: neutral[400] }}>{summary.logs_collected?.unspecified ?? 0}</div>
              </div>
            </div>
          </div>

          {/* ── Recently flagged sites ── */}
          {summary.recent_flagged_sites?.length > 0 && (
            <div style={{ border: `1px solid ${urgency.critical.fg}33`, background: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🚨 Recently Flagged Sites (Critical / Major)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.recent_flagged_sites.map((s: any) => (
                  <div key={s._id} onClick={() => openAudit(s._id)} style={{ cursor: 'pointer', background: '#fff', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>{s.site_name || s.site_id_ihs}</div>
                    <div style={{ color: neutral[400], fontSize: 10 }}>{s.site_id_ihs}</div>
                    <SeverityBadge severity={s.overall_severity} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Cycle Reconciliation (gain/loss) ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => setReconOpen(o => !o)}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>⚖️ Cycle Reconciliation — Gain / Loss</div>
            <div style={{ fontSize: 11, color: neutral[500], marginTop: 2 }}>
              Every site for the cycle, audited or not. Opening stock + total refueled = theoretical stock; compared against what an audit physically found on-site, this shows each site's real gain or loss. Sites with no audit yet still appear, with their system baseline visible and audit columns blank — nothing here is estimated.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              value={reconCycleKey}
              onChange={e => setReconCycleKey(e.target.value)}
              placeholder="2026-08"
              style={{ width: 100, padding: '6px 10px', border: `1px solid ${neutral[200]}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }}
            />
            <Btn variant="secondary" size="sm" onClick={handleExportReconciliationExcel} disabled={reconLoading || !reconFiltered.length || exportingReconciliation} loading={exportingReconciliation}>
              📊 Export
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => setReconOpen(o => !o)}>{reconOpen ? '▲ Collapse' : '▼ Expand'}</Btn>
          </div>
        </div>

        {reconOpen && (
          <>
        {reconError && <ErrorBox message={reconError} />}

        {!reconLoading && !reconCycleFound && (
          <div style={{ fontSize: 11, color: urgency.high.fg, background: '#FFFBEB', border: `1px solid ${urgency.high.fg}33`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
            ⚠ No cycle record was found for "{reconCycleKey}" — audit matching fell back to exact cycle_key only, which may miss audits submitted before the reconciliation feature existed. Check the cycle key is correct (e.g. "2026-08").
          </div>
        )}
        {!reconLoading && reconCycleFound && reconDateFallbackCount > 0 && (
          <div style={{ fontSize: 11, color: neutral[500], background: neutral[50], border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
            ℹ {reconDateFallbackCount} audit{reconDateFallbackCount === 1 ? '' : 's'} shown here {reconDateFallbackCount === 1 ? 'was' : 'were'} matched by date rather than a resolved cycle reference — {reconDateFallbackCount === 1 ? 'it predates' : 'these predate'} the reconciliation feature and {reconDateFallbackCount === 1 ? "hasn't" : "haven't"} been backfilled yet. Run <code>scripts/backfillTankAuditReconciliation.js</code> to resolve this permanently.
          </div>
        )}

        {reconLoading ? <Spinner /> : reconSummary && (
          <>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '14px 0' }}>
              <KpiCard label="Total Sites" value={reconSummary.total_sites ?? 0} icon="📍" />
              <KpiCard label="Audited" value={reconSummary.sites_audited ?? 0} icon="✅" color={urgency.ok.fg} />
              <KpiCard label="Not Yet Audited" value={(reconSummary.total_sites ?? 0) - (reconSummary.sites_audited ?? 0)} icon="⏳" color="#D97706" />
              <KpiCard label="Sites With a Loss" value={reconSummary.sites_with_loss ?? 0} icon="📉" color={urgency.critical.fg} />
              <KpiCard label="Missing Opening Stock" value={reconSummary.sites_missing_opening_stock ?? 0} icon="❓" color={urgency.high.fg} />
              <KpiCard label="Missing Cycle Data" value={reconSummary.sites_missing_cycle_data ?? 0} icon="❓" color={urgency.high.fg} />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                value={reconSiteQuery}
                onChange={e => setReconSiteQuery(e.target.value)}
                placeholder="Search site name or ID…"
                style={{ flex: 1, minWidth: 200, padding: '7px 10px', border: `1px solid ${neutral[200]}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }}
              />
              <select value={reconShowOnly} onChange={e => setReconShowOnly(e.target.value as any)} style={{ padding: '7px 10px', border: `1px solid ${neutral[200]}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }}>
                <option value="">All sites</option>
                <option value="audited">Audited only</option>
                <option value="not_audited">Not yet audited</option>
                <option value="loss">Showing a loss</option>
                <option value="missing_data">Missing opening stock or cycle data</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Site', 'Cluster', 'Opening Stock (L)', 'Refueled (L)', 'Theoretical Stock (L)', 'Validated CPH', 'Audit Date', 'Dip Reading (L)', 'Find Consumption (L)', 'True CPH', 'Gain / Loss'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500], whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reconFiltered.map(r => (
                    <tr key={r.site_id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '5px 8px' }}>
                        <div style={{ fontWeight: 700 }}>{r.site_name || r.site_id}</div>
                        <div style={{ color: neutral[400], fontSize: 10 }}>{r.site_id}</div>
                      </td>
                      <td style={{ padding: '5px 8px' }}>{r.cluster || '—'}</td>
                      <td style={{ padding: '5px 8px' }}>
                        {r.opening_stock_l != null ? fmt(r.opening_stock_l, 1) : (
                          <span title="No prior-cycle closing snapshot found" style={{ color: urgency.high.fg }}>missing</span>
                        )}
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        {r.total_refueled_l != null ? fmt(r.total_refueled_l, 1) : '—'}
                        {r.total_refueled_source === 'mail_verified' && (
                          <span title="Exact figure from per-delivery-event mail records" style={{ marginLeft: 4, fontSize: 9, color: urgency.ok.fg }}>✓</span>
                        )}
                      </td>
                      <td style={{ padding: '5px 8px' }}>{r.stock_actualized_1_l != null ? fmt(r.stock_actualized_1_l, 1) : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{r.validated_cph != null ? fmt(r.validated_cph, 2) : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{r.audit_date ? new Date(r.audit_date).toLocaleDateString() : <span style={{ color: neutral[400] }}>not audited</span>}</td>
                      <td style={{ padding: '5px 8px' }}>{r.dip_reading_l != null ? fmt(r.dip_reading_l, 1) : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{r.find_consumption_l != null ? fmt(r.find_consumption_l, 1) : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{r.true_cph != null ? fmt(r.true_cph, 2) : '—'}</td>
                      <td style={{ padding: '5px 8px' }}><GainLossCell value={r.gain_loss_l} hasAudit={r.has_recent_audit} cycleClosed={r.cycle_closed} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reconFiltered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: neutral[400], fontSize: 12 }}>No sites match the current filter.</div>
              )}
            </div>
          </>
        )}
          </>
        )}
      </div>

      {/* ── Notes-Extracted Run Hours (Phase 121) ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📝 Run Hours Found in Notes</div>
            <div style={{ fontSize: 11, color: neutral[500], marginTop: 2 }}>
              Before this system had a dedicated run-hours field, some technicians recorded it directly in the Faulty Gen Card check's own notes instead. Scans every submitted audit that's still missing a run-hours value for an explicit mention there — a suggestion to review, never applied automatically.
            </div>
          </div>
          <Btn variant="secondary" size="sm" onClick={handleScanNotesForRunHours} loading={notesCandidatesLoading}>
            {notesCandidatesScanned ? '🔄 Re-scan' : '🔍 Scan Notes'}
          </Btn>
        </div>

        {notesCandidatesScanned && notesScanMeta && (
          <div style={{ fontSize: 11, color: neutral[500], margin: '10px 0' }}>
            Scanned {notesScanMeta.audits_scanned} audit(s) missing a run-hours value — found a possible mention in {notesScanMeta.audits_with_candidates}.
          </div>
        )}

        {notesCandidates.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Site', 'Auditor', 'Audit Date', 'Found In', 'Matched Text', 'Suggested Value', 'Confidence', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500], whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notesCandidates.flatMap((row: any) =>
                  row.candidates.map((c: any, i: number) => (
                    <tr key={`${row.audit_id}-${i}`} style={{ borderBottom: `1px solid ${neutral[100]}`, background: c.plausible === false ? '#FEF2F2' : undefined }}>
                      <td style={{ padding: '5px 8px', fontWeight: 700 }}>{row.site_id}</td>
                      <td style={{ padding: '5px 8px' }}>{row.auditor_name || '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{row.audit_date ? new Date(row.audit_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '5px 8px', color: neutral[400] }}>Gen Cards Faulty notes</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: neutral[600] }}>"{c.matched_text}"</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700 }}>
                        {fmt(c.value)}
                        {c.plausible === false && (
                          <div title="This is an unusually high value for a generator run-hours reading — over 10 years of continuous operation. Likely a typo or misread; verify before accepting." style={{ fontSize: 9, fontWeight: 700, color: urgency.critical.fg, marginTop: 2 }}>
                            ⚠ Unusually high — verify
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: c.confidence === 'high' ? '#DCFCE7' : '#FEF3C7',
                          color: c.confidence === 'high' ? '#166534' : '#92400E',
                        }}>
                          {c.confidence.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <Btn
                          variant="secondary" size="sm"
                          onClick={() => {
                            if (c.plausible === false && !window.confirm(`${fmt(c.value)} is unusually high for a run-hours reading (over 10 years of continuous operation). Accept it anyway?`)) return;
                            handleAcceptNotesCandidate(row.audit_id, c.value);
                          }}
                          loading={acceptingNotesAuditId === row.audit_id}
                        >
                          Accept
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {notesCandidatesScanned && notesCandidates.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: neutral[400], fontSize: 12 }}>No run-hours mentions found in notes for any audit currently missing a value.</div>
        )}
      </div>

      {/* ── Audit Analytics (Phase 138) ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={handleToggleAnalytics}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📊 Audit Analytics</div>
            <div style={{ fontSize: 11, color: neutral[500], marginTop: 2 }}>Data completeness, consumption patterns, CPH comparison, and data-quality findings — computed live from submitted audits.</div>
          </div>
          <Btn variant="secondary" size="sm" onClick={handleToggleAnalytics}>{analyticsOpen ? '▲ Collapse' : '▼ Expand'}</Btn>
        </div>

        {analyticsOpen && (
          <div style={{ marginTop: 16 }}>
            {analyticsLoading && <Spinner />}
            {!analyticsLoading && analyticsData && (() => {
              const d = analyticsData;
              const s = d.summary;
              const negCount = s.negative_consumption_count;
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
                    <KpiCard label="Total Sites" value={String(s.total_sites)} />
                    <KpiCard label="Sites With Audit Data" value={`${s.sites_with_audit_data} / ${s.total_sites}`} />
                    <KpiCard label="Faulty Meters" value={String(s.faulty_meter_count)} color={s.faulty_meter_count > 0 ? '#D97706' : urgency.ok.fg} alert={s.faulty_meter_count > 0} />
                    <KpiCard label="Negative Consumption" value={String(negCount)} color={negCount > 0 ? urgency.critical.fg : urgency.ok.fg} alert={negCount > 0} />
                    <KpiCard label="Above Validated Rate" value={`${s.sites_above_validated_rate} / ${s.cph_pairs_available}`} />
                  </div>

                  {/* Chart 1: Data completeness by cluster */}
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Audit Data Completeness by Cluster</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={d.completeness_by_cluster} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                      <XAxis dataKey="cluster" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="has_data" name="Has audit data" stackId="a" fill={urgency.ok.fg} />
                      <Bar dataKey="missing" name="Missing" stackId="a" fill={urgency.critical.fg} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Chart 2: Consumption by cluster */}
                  <div style={{ fontSize: 12, fontWeight: 700, margin: '20px 0 8px' }}>Average Find Consumption by Cluster</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={d.consumption_by_cluster} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                      <XAxis dataKey="cluster" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} label={{ value: 'L', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v} L`, 'Avg consumption']} />
                      <Bar dataKey="avg_consumption_l" name="Avg Find Consumption (L)" fill="#2563EB" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Chart 3: True CPH vs Validated CPH scatter */}
                  {d.cph_comparison.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, margin: '20px 0 8px' }}>
                        True CPH vs Validated CPH ({d.cph_comparison.length} sites with both values)
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ left: 10, right: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                          <XAxis type="number" dataKey="validated_cph" name="Validated CPH" tick={{ fontSize: 11 }} label={{ value: 'Validated CPH (L/hr)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                          <YAxis type="number" dataKey="true_cph" name="True CPH" tick={{ fontSize: 11 }} label={{ value: 'True CPH (L/hr)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any) => Number(v).toFixed(2)} />
                          <Scatter data={d.cph_comparison} fill="#2563EB">
                            {d.cph_comparison.map((p: any, i: number) => (
                              <Cell key={i} fill={p.above_validated ? urgency.critical.fg : urgency.ok.fg} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                      <div style={{ fontSize: 10, color: neutral[400], marginTop: 4 }}>
                        <span style={{ color: urgency.critical.fg }}>●</span> Above validated rate (burning faster than expected) &nbsp;
                        <span style={{ color: urgency.ok.fg }}>●</span> At or below validated rate
                      </div>
                    </>
                  )}

                  {/* Chart 4: Faulty meters by cluster */}
                  {d.faulty_meters_by_cluster.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, margin: '20px 0 8px' }}>Faulty Gen Card Meters by Cluster</div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={d.faulty_meters_by_cluster} margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={neutral[100]} />
                          <XAxis dataKey="cluster" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" name="Faulty meters" fill="#D97706" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}

                  {/* Negative consumption outliers table */}
                  {d.negative_consumption_sites.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, margin: '20px 0 8px', color: urgency.critical.fg }}>
                        ⚠ {d.negative_consumption_sites.length} Site(s) With Physically Impossible Negative Consumption
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr>
                              {['Site', 'Cluster', 'Opening Stock', 'Refueled', 'Theoretical', 'Dipstick', 'Find Consumption'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {d.negative_consumption_sites.map((r: any) => (
                              <tr key={r.site_id} style={{ borderBottom: `1px solid ${neutral[100]}`, background: '#FEF2F2' }}>
                                <td style={{ padding: '5px 8px', fontWeight: 700 }}>{r.site_id}</td>
                                <td style={{ padding: '5px 8px' }}>{r.cluster || '—'}</td>
                                <td style={{ padding: '5px 8px' }}>{r.opening_stock_l ?? '—'}</td>
                                <td style={{ padding: '5px 8px' }}>{r.total_refueled_l ?? '—'}</td>
                                <td style={{ padding: '5px 8px' }}>{r.stock_actualized_1_l ?? '—'}</td>
                                <td style={{ padding: '5px 8px' }}>{r.dip_reading_l ?? '—'}</td>
                                <td style={{ padding: '5px 8px', fontWeight: 700, color: urgency.critical.fg }}>{r.find_consumption_l} L</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Full audit list ── */}
      <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>All Audits — Including Drafts In Progress</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={siteQuery} onChange={e => { setSiteQuery(e.target.value); setPage(1); }} placeholder="Site ID…"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 140 }}
            />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="">All (Drafts + Submitted)</option>
              <option value="submitted">Submitted Only</option>
              <option value="draft">Drafts Only</option>
            </select>
            <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
            <select value={logsFilter} onChange={e => { setLogsFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="">Logs — Any</option>
              <option value="true">Logs Collected</option>
              <option value="false">Logs Not Collected</option>
            </select>
            <input
              type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              title="Audit date — from"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
            />
            <input
              type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              title="Audit date — to (inclusive; leave equal to 'from' for a single day)"
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
            />
            {(dateFrom || dateTo) && (
              <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}>
                ✕ Clear dates
              </Btn>
            )}
            <select value={sortOrder} onChange={e => { setSortOrder(e.target.value as 'asc' | 'desc'); setPage(1); }}
              style={{ border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="desc">Audit Date — Newest First</option>
              <option value="asc">Audit Date — Oldest First</option>
            </select>
          </div>
        </div>

        {auditsLoading ? <Spinner /> : !audits.length ? (
          <EmptyState icon="🛢️" title="No tank audits yet" desc="Audits submitted from the mobile app — including offline, synced automatically when back online — will show up here." />
        ) : (
          <>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Site', 'Status', 'Audit Date', 'Auditor', 'Fuel Variance', 'Logs Collected', 'Severity', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 9px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a: any) => (
                    <tr key={a._id} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                      <td style={{ padding: '6px 9px' }}>
                        <div style={{ fontWeight: 600 }}>{a.site_name || a.site_id_ihs}</div>
                        <div style={{ color: neutral[400], fontSize: 10 }}>{a.site_id_ihs}</div>
                      </td>
                      <td style={{ padding: '6px 9px' }}>
                        {a.status === 'draft'
                          ? <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>DRAFT</span>
                          : <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>SUBMITTED</span>}
                      </td>
                      <td style={{ padding: '6px 9px' }}>{a.audit_date ? new Date(a.audit_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '6px 9px' }}>{a.auditor_name || '—'}</td>
                      <td style={{ padding: '6px 9px', color: a.variance_pct != null && Math.abs(a.variance_pct) > 5 ? urgency.high.fg : ink }}>
                        {a.variance_pct != null ? `${a.variance_pct > 0 ? '+' : ''}${a.variance_pct}%` : '—'}
                      </td>
                      <td style={{ padding: '6px 9px' }}>
                        {a.logs_collected === true ? <span style={{ color: urgency.ok.fg, fontWeight: 700 }}>Yes</span>
                          : a.logs_collected === false ? <span style={{ color: urgency.critical.fg, fontWeight: 700 }}>No</span>
                          : <span style={{ color: neutral[400] }}>—</span>}
                      </td>
                      <td style={{ padding: '6px 9px' }}><SeverityBadge severity={a.overall_severity} /></td>
                      <td style={{ padding: '6px 9px' }}>
                        <button onClick={() => openAudit(a._id)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                <Btn variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Btn>
                <span style={{ fontSize: 12, color: neutral[500], alignSelf: 'center' }}>Page {pagination.current} of {pagination.pages}</span>
                <Btn variant="secondary" size="sm" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}>Next</Btn>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Audit detail modal ── */}
      {(selectedLoading || selectedAudit) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setSelectedAudit(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 700, width: '90%', maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            {selectedLoading ? <Spinner /> : selectedAudit && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedAudit.site_name || selectedAudit.site_id_ihs}</div>
                    <div style={{ fontSize: 12, color: neutral[400] }}>{selectedAudit.site_id_ihs} · {selectedAudit.audit_date ? new Date(selectedAudit.audit_date).toLocaleDateString() : '—'} · {selectedAudit.auditor_name || 'Unknown auditor'}</div>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => setSelectedAudit(null)}>Close</Btn>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Dip Reading</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(selectedAudit.dip_reading_l)} L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>CMS Reading</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(selectedAudit.cms_reading_l)} L</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Theoretical Stock</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(selectedAudit.theoretical_stock_l)} L</div>
                  </div>
                </div>

                {/* ── Cycle Reconciliation — Phase 106/107 ── */}
                {(selectedAudit.cycle_key || selectedAudit.find_consumption_l != null) && (
                  <div style={{ border: `1px solid ${neutral[200]}`, borderRadius: 10, padding: 14, marginBottom: 16, background: neutral[50] }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                      ⚖️ Cycle Reconciliation {selectedAudit.cycle_key ? `— ${selectedAudit.cycle_key}` : ''}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Opening Stock</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {selectedAudit.opening_stock_l != null ? `${fmt(selectedAudit.opening_stock_l)} L` : (
                            <span style={{ color: urgency.high.fg, fontSize: 11 }}>missing</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Opening Meter (hrs)</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.opening_meter_hours != null ? fmt(selectedAudit.opening_meter_hours) : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>
                          Total Refueled
                          {selectedAudit.total_refueled_source === 'mail_verified' && (
                            <span title="Exact figure from per-delivery-event mail records" style={{ marginLeft: 4, color: urgency.ok.fg }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.total_refueled_l != null ? `${fmt(selectedAudit.total_refueled_l)} L` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Theoretical (Stock Actualized)</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.stock_actualized_1_l != null ? `${fmt(selectedAudit.stock_actualized_1_l)} L` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Find Consumption</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.find_consumption_l != null ? `${fmt(selectedAudit.find_consumption_l)} L` : '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Closing Meter (hrs)</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.closing_meter_hours != null ? fmt(selectedAudit.closing_meter_hours) : '—'}</div>
                        {selectedAudit.closing_meter_date && (
                          <div style={{ fontSize: 9, color: neutral[400] }}>{new Date(selectedAudit.closing_meter_date).toLocaleDateString()}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>Run Hours (audit)</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="number"
                            value={manualRunHoursInput}
                            onChange={e => setManualRunHoursInput(e.target.value)}
                            placeholder="Enter reading"
                            style={{ width: 90, fontSize: 13, fontWeight: 700, padding: '4px 6px', border: `1px solid ${neutral[200]}`, borderRadius: 6, fontFamily: 'inherit' }}
                          />
                          <button
                            onClick={handleSaveManualRunHours}
                            disabled={savingManualRunHours || manualRunHoursInput.trim() === (selectedAudit.audit_run_hours_reading != null ? String(selectedAudit.audit_run_hours_reading) : '')}
                            style={{ fontSize: 10, padding: '5px 8px', borderRadius: 6, border: 'none', background: neutral[900], color: '#fff', cursor: savingManualRunHours ? 'default' : 'pointer', opacity: savingManualRunHours ? 0.6 : 1 }}
                          >
                            {savingManualRunHours ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                        {selectedAudit.audit_run_hours_reading_source && (
                          <div style={{ fontSize: 9, color: neutral[400], marginTop: 3 }}>
                            {selectedAudit.audit_run_hours_reading_source === 'technician_entry' && 'From field entry'}
                            {selectedAudit.audit_run_hours_reading_source === 'extraction_accepted' && 'From photo extraction'}
                            {selectedAudit.audit_run_hours_reading_source === 'manual_correction' && 'Manually corrected'}
                          </div>
                        )}
                        {(selectedAudit.check_gen_cards_faulty?.photos?.length > 0) && (
                          <button
                            onClick={handleExtractRunHours}
                            disabled={extractingRunHours}
                            style={{ marginTop: 4, fontSize: 10, padding: '3px 8px', borderRadius: 6, border: `1px solid ${neutral[200]}`, background: '#fff', cursor: extractingRunHours ? 'default' : 'pointer', color: neutral[600] }}
                          >
                            {extractingRunHours ? 'Reading photo…' : '🔍 Extract from Gen Card photo'}
                          </button>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Validated CPH</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.validated_cph != null ? fmt(selectedAudit.validated_cph, 2) : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>True CPH</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAudit.true_cph != null ? fmt(selectedAudit.true_cph, 2) : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: neutral[400], textTransform: 'uppercase', fontWeight: 700 }}>Gain / Loss</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: selectedAudit.gain_loss_l == null ? neutral[900] : selectedAudit.gain_loss_l < 0 ? urgency.critical.fg : urgency.ok.fg }}>
                          {selectedAudit.gain_loss_l != null
                            ? `${selectedAudit.gain_loss_l < 0 ? '' : '+'}${fmt(selectedAudit.gain_loss_l)} L`
                            : !selectedAudit.cycle_closed
                              ? <span style={{ fontSize: 11, color: '#D97706', fontWeight: 400, fontStyle: 'italic' }}>Cycle still open</span>
                              : '—'}
                        </div>
                      </div>
                    </div>

                    {selectedAudit.run_hours_extraction && selectedAudit.run_hours_extraction.status !== 'not_attempted' && (
                      <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fff', border: `1px solid ${neutral[200]}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: neutral[500], marginBottom: 4 }}>RUN-HOURS EXTRACTION (from Gen Card photo — a suggestion, not yet applied)</div>
                        {selectedAudit.run_hours_extraction.status === 'pending' && (
                          <div style={{ fontSize: 12, color: neutral[500] }}>Reading the photo…</div>
                        )}
                        {selectedAudit.run_hours_extraction.status === 'no_photo' && (
                          <div style={{ fontSize: 12, color: neutral[500] }}>No photo attached to the Gen Cards Faulty check area yet.</div>
                        )}
                        {selectedAudit.run_hours_extraction.status === 'failed' && (
                          <div style={{ fontSize: 12, color: urgency.critical.fg }}>Extraction failed: {selectedAudit.run_hours_extraction.notes || 'unknown error'}</div>
                        )}
                        {selectedAudit.run_hours_extraction.status === 'completed' && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <span style={{ fontSize: 16, fontWeight: 700 }}>
                                {selectedAudit.run_hours_extraction.extracted_value != null ? fmt(selectedAudit.run_hours_extraction.extracted_value) : 'Unreadable'}
                              </span>
                              {selectedAudit.run_hours_extraction.confidence && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                  background: selectedAudit.run_hours_extraction.confidence === 'high' ? '#DCFCE7' : selectedAudit.run_hours_extraction.confidence === 'medium' ? '#FEF3C7' : '#FEE2E2',
                                  color: selectedAudit.run_hours_extraction.confidence === 'high' ? '#166534' : selectedAudit.run_hours_extraction.confidence === 'medium' ? '#92400E' : urgency.critical.fg,
                                }}>
                                  {selectedAudit.run_hours_extraction.confidence.toUpperCase()} CONFIDENCE
                                </span>
                              )}
                              {selectedAudit.run_hours_extraction.accepted && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: urgency.ok.fg }}>✓ Accepted</span>
                              )}
                            </div>
                            {selectedAudit.run_hours_extraction.notes && (
                              <div style={{ fontSize: 11, color: neutral[500], marginBottom: 8 }}>{selectedAudit.run_hours_extraction.notes}</div>
                            )}
                            {selectedAudit.run_hours_extraction.extracted_value != null && !selectedAudit.run_hours_extraction.accepted && (
                              <Btn variant="secondary" size="sm" onClick={handleAcceptExtraction} loading={acceptingExtraction}>
                                Use this value as Run Hours (audit)
                              </Btn>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {(selectedAudit.reconciliation_flags?.missing_opening_stock || selectedAudit.reconciliation_flags?.missing_cycle_data) && (
                      <div style={{ fontSize: 10, color: urgency.high.fg, marginTop: 10 }}>
                        {selectedAudit.reconciliation_flags?.missing_opening_stock && '⚠ No prior-cycle closing stock snapshot was found for this site. '}
                        {selectedAudit.reconciliation_flags?.missing_cycle_data && '⚠ No cycle reconciliation record was found for this site/cycle.'}
                      </div>
                    )}
                    {selectedAudit.site_state_updated && (
                      <div style={{ fontSize: 10, color: urgency.ok.fg, marginTop: 6 }}>
                        ✓ This audit's findings have been written back to the site's live record.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  Logs collected: {selectedAudit.logs_collected === true ? <strong style={{ color: urgency.ok.fg }}>Yes</strong>
                    : selectedAudit.logs_collected === false ? <strong style={{ color: urgency.critical.fg }}>No</strong>
                    : <span style={{ color: neutral[400] }}>Not specified</span>}
                </div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>
                  Gen Card faulty: {selectedAudit.gen_card_faulty === true ? <strong style={{ color: urgency.critical.fg }}>Yes</strong>
                    : selectedAudit.gen_card_faulty === false ? <strong style={{ color: urgency.ok.fg }}>No</strong>
                    : <span style={{ color: neutral[400] }}>Not specified</span>}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Physical Checks</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      {['Area', 'Status', 'Severity', 'Notes', 'Photos'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '5px 8px', borderBottom: `1px solid ${neutral[200]}`, color: neutral[500] }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHECK_AREAS.map(area => {
                      const item = selectedAudit[area.key] || {};
                      return (
                        <tr key={area.key} style={{ borderBottom: `1px solid ${neutral[100]}` }}>
                          <td style={{ padding: '5px 8px' }}>{area.label}</td>
                          <td style={{ padding: '5px 8px' }}><StatusBadge status={item.status} /></td>
                          <td style={{ padding: '5px 8px' }}>{item.status === 'issue' ? <SeverityBadge severity={item.severity} /> : '—'}</td>
                          <td style={{ padding: '5px 8px', color: neutral[600] }}>{item.notes || '—'}</td>
                          <td style={{ padding: '5px 8px' }}>
                            {item.photos?.length > 0 ? (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {item.photos.map((p: any, i: number) => (
                                  <a key={i} href={p.uri} target="_blank" rel="noopener noreferrer">
                                    <img src={p.uri} alt={area.label} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: `1px solid ${neutral[200]}` }} />
                                  </a>
                                ))}
                              </div>
                            ) : <span style={{ color: neutral[400] }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {selectedAudit.general_photos?.length > 0 && (
                  <div style={{ fontSize: 12, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>General Photos</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedAudit.general_photos.map((p: any, i: number) => (
                        <a key={i} href={p.uri} target="_blank" rel="noopener noreferrer">
                          <img src={p.uri} alt="General" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: `1px solid ${neutral[200]}` }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAudit.log_files?.length > 0 && (
                  <div style={{ fontSize: 12, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Equipment Log Files</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedAudit.log_files.map((f: any, i: number) => (
                        <a key={i} href={f.uri} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#2563eb', textDecoration: 'none' }}>
                          {f.equipment === 'power_cabinet' ? '🔌 Power Cabinet' : f.equipment === 'generator' ? '⚙️ Generator' : '📄 Other'} — View
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAudit.general_notes && (
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>General Notes</div>
                    <div style={{ color: neutral[600] }}>{selectedAudit.general_notes}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== TECHNICIAN AUDITS PAGE ==========
import TechnicianAuditsPage from '@/pages/supervisor/TechnicianAuditsPage';
import TechnicianAuditDetailPage from '@/pages/supervisor/TechnicianAuditDetailPage';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { EnvCheck } from '@/components/diagnostics/EnvCheck';

// ========== PUBLIC PAGES ==========
import LoginPage from '@/pages/public/LoginPage';
import UnauthorizedPage from '@/pages/public/UnauthorizedPage';

// ========== ADMIN PAGES ==========
import AdminDashboard from '@/pages/admin/DashboardPage';
import AdminUsers from '@/pages/admin/UsersPage';
import AdminSites from '@/pages/admin/SitesManagementPage';
import AdminMaintenance from '@/pages/admin/MaintenanceManagementPage';
import AdminParts from '@/pages/admin/PartsManagementPage';
import AdminClusters from '@/pages/admin/ClustersManagementPage';
import AdminReports from '@/pages/admin/SystemReportsPage';

// ========== TECHNICIAN PAGES ==========
import TechnicianDashboard from '@/pages/technician/DashboardPage';
import TechnicianSites from '@/pages/technician/SitesPage';
import SubmitVisitPage from '@/pages/technician/SubmitVisitPage';
import TechnicianDrafts from '@/pages/technician/DraftsPage';
import TechnicianTasks from '@/pages/technician/TasksPage';
import TechnicianHistory from '@/pages/technician/HistoryPage';

// ========== SUPERVISOR PAGES ==========
import SupervisorDashboard from '@/pages/supervisor/DashboardPage';
import SupervisorSites from '@/pages/supervisor/SitesPage';
import SupervisorSiteDetail from '@/pages/supervisor/SiteDetailPage';
import SupervisorApprovals from '@/pages/supervisor/ApprovalsPage';
import SupervisorReportDetail from '@/pages/supervisor/ReportDetailPage';
import SupervisorPartRequests from '@/pages/supervisor/PartRequestsPage';
import SupervisorScheduled from '@/pages/supervisor/ScheduledPage';
import SupervisorTechnicians from '@/pages/supervisor/TechniciansPage';
import SupervisorStatistics from '@/pages/supervisor/StatisticsPage';

// ========== DIESEL MANAGER PAGES (existing fuel-request workflow) ==========
import DieselDashboard from '@/pages/diesel/DieselDashboardPage';
import FuelRequests from '@/pages/diesel/FuelRequestsPage';
import FuelConsumption from '@/pages/diesel/ConsumptionPage';
import LowFuelAlerts from '@/pages/diesel/LowFuelAlertsPage';
import FuelTrends from '@/pages/diesel/TrendsPage';

// ========== DIESEL RECONCILIATION SYSTEM PAGES (new — CMS/GRATO/Tom Card/alerts) ==========
// These are SEPARATE components from the existing diesel pages above.
// Mounted as sibling routes under the same /diesel path so diesel_manager
// and admin can reach both the existing fuel-request workflow and the
// new reconciliation system from one role area.
import DieselReconciliationDashboard from '@/pages/diesel/DieselDashboardPage';
import CmsUploadPage from '@/pages/diesel/CmsUploadPage';
import ValidationUploadPage from '@/pages/diesel/ValidationUploadPage';
import SiteBudgetUploadPage from '@/pages/diesel/SiteBudgetUploadPage';
import GratoUploadPage from '@/pages/diesel/GratoUploadPage';
import ReconciliationPage from '@/pages/diesel/ReconciliationPage';
import DieselReconAlertsPage from '@/pages/diesel/AlertsPage';
import TomCardPage from '@/pages/diesel/TomCardPage';
import GeneratorLedgerPage from '@/pages/diesel/GeneratorLedgerPage';
import DieselReconReportsPage from '@/pages/diesel/ReportsPage';

// ========== DATA COLLECTOR PAGES ==========
import DataCollectorDashboard from '@/pages/data-collector/DashboardPage';
import DataQuality from '@/pages/data-collector/DataQualityPage';
import MissingData from '@/pages/data-collector/MissingDataPage';
import DataExports from '@/pages/data-collector/ExportsPage';
import DataReports from '@/pages/data-collector/ReportsPage';
import SubmittedMaintenance from '@/pages/data-collector/SubmittedMaintenancePage';
import MaintenanceDetail from '@/pages/data-collector/MaintenanceDetailPage';

// ========== OPERATIONS PAGES ==========
import OperationsDashboard from '@/pages/operations/DashboardPage';
import OperationsAudits from '@/pages/operations/AuditsPage';
import OperationsAuditDetail from '@/pages/operations/AuditDetailPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <EnvCheck />
          <Routes>
            {/* ========== PUBLIC ROUTES ========== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ========== ADMIN ROUTES ========== */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="sites" element={<AdminSites />} />
              <Route path="maintenance" element={<AdminMaintenance />} />
              <Route path="parts" element={<AdminParts />} />
              <Route path="clusters" element={<AdminClusters />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="technician-audits" element={<TechnicianAuditsPage />} />
              <Route path="technician-audits/:id" element={<TechnicianAuditDetailPage />} />
              <Route path="technician-audits/:id" element={<TechnicianAuditDetailPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* ========== TECHNICIAN ROUTES ========== */}
            <Route
              path="/technician"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TechnicianDashboard />} />
              <Route path="sites" element={<TechnicianSites />} />
              <Route path="sites/:siteId/submit" element={<SubmitVisitPage />} />
              <Route path="tasks" element={<TechnicianTasks />} />
              <Route path="drafts" element={<TechnicianDrafts />} />
              <Route path="drafts/:draftId/edit" element={<SubmitVisitPage />} />
              <Route path="history" element={<TechnicianHistory />} />
              <Route path="*" element={<Navigate to="/technician" replace />} />
            </Route>

            {/* ========== SUPERVISOR ROUTES ========== */}
            <Route
              path="/supervisor"
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SupervisorDashboard />} />
              <Route path="sites" element={<SupervisorSites />} />
              <Route path="sites/:siteId" element={<SupervisorSiteDetail />} />
              <Route path="approvals" element={<SupervisorApprovals />} />
              <Route path="approvals/:maintenanceId" element={<SupervisorReportDetail />} />
              <Route path="part-requests" element={<SupervisorPartRequests />} />
              <Route path="scheduled" element={<SupervisorScheduled />} />
              <Route path="technicians" element={<SupervisorTechnicians />} />
              <Route path="statistics" element={<SupervisorStatistics />} />
              {/* <Route path="technician-audits" element={<TechnicianAuditsPage />} />
              <Route path="*" element={<Navigate to="/supervisor" replace />} /> */}
              <Route path="technician-audits" element={<TechnicianAuditsPage />} />
              <Route path="technician-audits/:id" element={<TechnicianAuditDetailPage />} />
              <Route path="*" element={<Navigate to="/supervisor" replace />} />
            </Route>

            {/* ========== DIESEL MANAGER ROUTES ========== */}
            {/* Existing fuel-request workflow PLUS new reconciliation system, */}
            {/* both living under /diesel since they serve the same roles. */}
            <Route
              path="/diesel"
              element={
                <ProtectedRoute allowedRoles={['diesel_manager', 'admin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DieselDashboard />} />

              {/* ── Existing fuel-request workflow (unchanged) ── */}
              <Route path="fuel-requests" element={<FuelRequests />} />
              <Route path="consumption" element={<FuelConsumption />} />
              <Route path="alerts" element={<LowFuelAlerts />} />
              <Route path="trends" element={<FuelTrends />} />
              <Route path="validation" element={<ValidationUploadPage />} />
              <Route path="site-budget" element={<SiteBudgetUploadPage />} />
              <Route path="scheduled" element={React.createElement(require('@/pages/diesel/ScheduledPage').default)} />

              {/* ── New: diesel reconciliation system (CMS/GRATO/Tom Card) ── */}
              <Route path="reconciliation-dashboard" element={<DieselReconciliationDashboard />} />
              <Route path="cms-upload" element={<CmsUploadPage />} />
              <Route path="grato-upload" element={<GratoUploadPage />} />
              <Route path="reconciliation" element={<ReconciliationPage />} />
              <Route path="reconciliation-alerts" element={<DieselReconAlertsPage />} />
              <Route path="tomcard" element={<TomCardPage />} />
              <Route path="generators" element={<GeneratorLedgerPage />} />
              <Route path="recon-reports" element={<DieselReconReportsPage />} />

              <Route path="*" element={<Navigate to="/diesel" replace />} />
            </Route>

            {/* ========== DATA COLLECTOR ROUTES ========== */}
            {/* data_collector also needs CMS/GRATO upload + alerts visibility */}
            {/* per the diesel system requirements — added as additional paths */}
            {/* inside the existing /data-collector role area, nothing removed. */}
            <Route
              path="/data-collector"
              element={
                <ProtectedRoute allowedRoles={['data_collector', 'admin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DataCollectorDashboard />} />
              <Route path="data-quality" element={<DataQuality />} />
              <Route path="missing-data" element={<MissingData />} />
              <Route path="exports" element={<DataExports />} />
              <Route path="reports" element={<DataReports />} />
              <Route path="maintenance" element={<SubmittedMaintenance />} />
              <Route path="maintenance/:maintenanceId" element={<MaintenanceDetail />} />

              {/* ── New: diesel data-entry access for data_collector role ── */}
              <Route path="diesel/cms-upload" element={<CmsUploadPage />} />
              <Route path="diesel/validation" element={<ValidationUploadPage />} />
              <Route path="diesel/grato-upload" element={<GratoUploadPage />} />
              <Route path="diesel/alerts" element={<DieselReconAlertsPage />} />

              <Route path="*" element={<Navigate to="/data-collector" replace />} />
            </Route>

            {/* ========== OPERATIONS ROUTES ========== */}
            <Route
              path="/operations"
              element={
                <ProtectedRoute allowedRoles={['operations', 'admin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OperationsDashboard />} />
              <Route path="audits" element={<OperationsAudits />} />
              <Route path="audits/:auditId" element={<OperationsAuditDetail />} />
              <Route path="*" element={<Navigate to="/operations" replace />} />
            </Route>

            {/* ========== DEFAULT REDIRECTS ========== */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;











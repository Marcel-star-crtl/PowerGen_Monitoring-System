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

// ========== DIESEL MANAGER PAGES ==========
import DieselDashboard from '@/pages/diesel/DashboardPage';
import FuelRequests from '@/pages/diesel/FuelRequestsPage';
import FuelConsumption from '@/pages/diesel/ConsumptionPage';
import LowFuelAlerts from '@/pages/diesel/LowFuelAlertsPage';
import FuelTrends from '@/pages/diesel/TrendsPage';

// ========== DATA COLLECTOR PAGES ==========
import DataCollectorDashboard from '@/pages/data-collector/DashboardPage';
import DataQuality from '@/pages/data-collector/DataQualityPage';
import MissingData from '@/pages/data-collector/MissingDataPage';
import DataExports from '@/pages/data-collector/ExportsPage';
import DataReports from '@/pages/data-collector/ReportsPage';
import SubmittedMaintenance from '@/pages/data-collector/SubmittedMaintenancePage';
import MaintenanceDetail from '@/pages/data-collector/MaintenanceDetailPage';

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
              <Route path="*" element={<Navigate to="/supervisor" replace />} />
            </Route>

            {/* ========== DIESEL MANAGER ROUTES ========== */}
            <Route
              path="/diesel"
              element={
                <ProtectedRoute allowedRoles={['diesel_manager', 'admin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DieselDashboard />} />
              <Route path="fuel-requests" element={<FuelRequests />} />
              <Route path="consumption" element={<FuelConsumption />} />
              <Route path="alerts" element={<LowFuelAlerts />} />
              <Route path="trends" element={<FuelTrends />} />
              <Route path="*" element={<Navigate to="/diesel" replace />} />
            </Route>

            {/* ========== DATA COLLECTOR ROUTES ========== */}
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
              <Route path="*" element={<Navigate to="/data-collector" replace />} />
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





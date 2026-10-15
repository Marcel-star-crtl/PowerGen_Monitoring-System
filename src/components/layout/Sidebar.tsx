import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { classNames } from '@/utils/helpers';
import PowerGenLogo from '@/components/common/PowerGenLogo';
import {
  FiHome, FiSettings, FiCheckSquare, FiBarChart2,
  FiFileText, FiAlertCircle, FiUpload, FiTruck,
  FiMap, FiMapPin, FiClipboard, FiList, FiTrendingUp, FiColumns, FiClock, FiBell, FiDollarSign, FiStar,
  FiUsers, FiCalendar, FiDroplet, FiDownload, FiTool,
  FiPackage, FiLayers, FiRefreshCw, FiCreditCard, FiCpu, FiActivity, FiSearch,
} from 'react-icons/fi';


// Poll /fuel-requests/pending-for-me every 60s for approval-chain roles
function useFuelPendingCount(role: string): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const approvalRoles = ['supervisor', 'finance', 'head_of_business', 'ceo', 'admin'];
    if (!approvalRoles.includes(role)) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { default: apiClient } = await import('../../api/client');
        const r = await apiClient.get('/fuel-requests/pending-for-me');
        if (!cancelled) setCount((r.data?.data || []).length);
      } catch {}
    };
    load();
    const iv = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [role]);
  return count;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  dividerBefore?: boolean; // renders a visual section separator above this item
  // Section header text shown above the divider (e.g. "Monthly Close").
  // Optional — items that just want a plain unlabeled divider (used
  // elsewhere for other roles) can set dividerBefore without this.
  groupLabel?: string;
  // Set ONLY for items whose page route is mounted under a DIFFERENT
  // top-level portal than some of the roles that can see it — e.g. these
  // diesel-analytics pages are registered in App.tsx only under
  // "/diesel/*", but finance/head_of_business/ceo/supervisor/admin also
  // have permission to view them from their OWN portal ("/finance",
  // "/hob", etc). A relative `to="ai-insights"` would resolve against
  // whatever portal is currently mounted, landing on a URL like
  // "/finance/ai-insights" that has no matching route and instantly
  // bounces back via that portal's catch-all redirect. basePath forces
  // an ABSOLUTE link (e.g. "/diesel/ai-insights") so it lands on the
  // route that actually exists, no matter which portal the viewer is on.
  basePath?: string;
}

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '',
    icon: <FiHome className="h-5 w-5" />,
    roles: ['admin', 'supervisor', 'technician', 'diesel_manager', 'data_collector', 'analyst', 'operations'],
  },
  {
    name: 'Technician Audits',
    path: 'technician-audits',
    icon: <FiClipboard className="h-5 w-5" />,
    roles: ['admin', 'supervisor'],
  },

  // ========== ADMIN NAVIGATION ==========
  {
    name: 'Users',
    path: 'users',
    icon: <FiUsers className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    name: 'Sites',
    path: 'sites',
    icon: <FiMapPin className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    name: 'Maintenance',
    path: 'maintenance',
    icon: <FiTool className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    name: 'Parts',
    path: 'parts',
    icon: <FiPackage className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    name: 'Clusters',
    path: 'clusters',
    icon: <FiLayers className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    name: 'System Reports',
    path: 'reports',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    name: 'Approval Chain',
    path: 'approval-chain',
    icon: <FiCheckSquare className="h-5 w-5" />,
    roles: ['admin'],
  },

  // ========== TECHNICIAN NAVIGATION ==========
  {
    name: 'My Sites',
    path: 'sites',
    icon: <FiMapPin className="h-5 w-5" />,
    roles: ['technician'],
  },
  {
    name: 'My Tasks',
    path: 'tasks',
    icon: <FiCheckSquare className="h-5 w-5" />,
    roles: ['technician'],
  },
  {
    name: 'Drafts',
    path: 'drafts',
    icon: <FiFileText className="h-5 w-5" />,
    roles: ['technician'],
  },
  {
    name: 'Visit History',
    path: 'history',
    icon: <FiCalendar className="h-5 w-5" />,
    roles: ['technician'],
  },

  // ========== SUPERVISOR NAVIGATION ==========
  {
    name: 'Sites',
    path: 'sites',
    icon: <FiMapPin className="h-5 w-5" />,
    roles: ['supervisor'],
  },
  {
    name: 'Visit Approvals',
    path: 'approvals',
    icon: <FiCheckSquare className="h-5 w-5" />,
    roles: ['supervisor'],
  },
  {
    name: 'Part Requests',
    path: 'part-requests',
    icon: <FiTool className="h-5 w-5" />,
    roles: ['supervisor'],
  },
  {
    name: 'Scheduled',
    path: 'scheduled',
    icon: <FiCalendar className="h-5 w-5" />,
    roles: ['supervisor'],
  },
  {
    name: 'Technicians',
    path: 'technicians',
    icon: <FiUsers className="h-5 w-5" />,
    roles: ['supervisor'],
  },
  {
    name: 'Statistics',
    path: 'statistics',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['supervisor'],
  },

  // ========== DIESEL MANAGER NAVIGATION ==========
  // Regrouped into named sections (Daily Operations / Planning & Analysis /
  // Monthly Close / Tom Card & Budgets / Reference) to match the redesign —
  // every item below keeps its original name/path/icon/roles/basePath
  // exactly; only the order and the dividerBefore/groupLabel markers changed,
  // so no route or permission behavior is affected.

  // ── Daily Operations ──
  {
    name: 'Fuel Planning',
    path: 'fuel-planning',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor'],
    basePath: '/diesel', // only mounted under /diesel — see NavItem.basePath comment
    dividerBefore: true,
    groupLabel: 'Daily Operations',
  },
  {
    name: 'Refuel',
    path: 'fuel-requests',
    icon: <FiDroplet className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Consumption',
    path: 'consumption',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  // {
  //   name: 'Low Fuel Alerts',
  //   path: 'alerts',
  //   icon: <FiAlertCircle className="h-5 w-5" />,
  //   roles: ['diesel_manager'],
  // },
  // {
  //   name: 'Scheduled Fuel Tasks',
  //   path: 'scheduled',
  //   icon: <FiCalendar className="h-5 w-5" />,
  //   roles: ['diesel_manager'],
  // },
  // {
  //   name: 'Trends',
  //   path: 'trends',
  //   icon: <FiBarChart2 className="h-5 w-5" />,
  //   roles: ['diesel_manager'],
  // },
  {
    name: 'Upload CMS Data',
    path: 'cms-upload',
    icon: <FiUpload className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Upload Daily Visits',
    path: 'grato-upload',
    icon: <FiUpload className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Tank Level Upload',
    path: 'tank-level',
    icon: <FiDroplet className="h-5 w-5" />,
    roles: ['diesel_manager', 'data_collector'],
  },

  // ── Planning & Analysis ──
  {
    name: 'Gain/Loss Tracker',
    path: 'gain-loss-tracker',
    icon: <FiTrendingUp className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
    dividerBefore: true,
    groupLabel: 'Planning & Analysis',
  },
  {
    name: 'AI Fleet Insights',
    path: 'ai-insights',
    icon: <FiCpu className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },

  // ── Monthly Close ──
  {
    name: 'Reconciliation',
    path: 'reconciliation-dashboard',
    icon: <FiActivity className="h-5 w-5" />,
    roles: ['diesel_manager'],
    dividerBefore: true,
    groupLabel: 'Monthly Close',
  },
  {
    name: 'Site Reconciliation',
    path: 'reconciliation',
    icon: <FiRefreshCw className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Recon Alerts',
    path: 'reconciliation-alerts',
    icon: <FiBell className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Validation Upload',
    path: 'validation',
    icon: <FiBell className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Tank Audits',
    path: 'tank-audits',
    icon: <FiClipboard className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'CMS vs Field Data',
    path: 'data-sources',
    icon: <FiColumns className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'Historical Data',
    path: 'historical-data',
    icon: <FiClock className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'History Analysis',
    path: 'historical-analysis',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'Site & Cluster Stock',
    path: 'site-stock',
    icon: <FiPackage className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'Recon Reports',
    path: 'recon-reports',
    icon: <FiDownload className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },

  // ── Tom Card & Budgets ──
  {
    name: 'Tom Card',
    path: 'tomcard',
    icon: <FiCreditCard className="h-5 w-5" />,
    roles: ['diesel_manager'],
    dividerBefore: true,
    groupLabel: 'Tom Card & Budgets',
  },
  {
    name: 'Tom Card Cycle Budget',
    path: 'tomcard-cycle-budget',
    icon: <FiCreditCard className="h-5 w-5" />,
    roles: ['diesel_manager', 'finance'],
    basePath: '/diesel',
  },
  {
    name: 'Site Budget Upload',
    path: 'site-budget',
    icon: <FiBell className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Budget Planning',
    path: 'budget-planning',
    icon: <FiTrendingUp className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },

  // ── Reference ──
  {
    name: 'Generator Ledger',
    path: 'generators',
    icon: <FiCpu className="h-5 w-5" />,
    roles: ['diesel_manager'],
    dividerBefore: true,
    groupLabel: 'Reference',
  },
  {
    name: 'Live Site Map',
    path: 'sites-map',
    icon: <FiMap className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'Site Directory',
    path: 'site-directory',
    icon: <FiList className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },
  {
    name: 'Technician Integrity',
    path: 'technician-integrity',
    icon: <FiSearch className="h-5 w-5" />,
    roles: ['diesel_manager', 'admin', 'supervisor', 'finance', 'head_of_business', 'ceo'],
    basePath: '/diesel',
  },

  // ========== DATA COLLECTOR NAVIGATION ==========
  // ── Existing data quality pages (unchanged) ──
  {
    name: 'Data Quality',
    path: 'data-quality',
    icon: <FiCheckSquare className="h-5 w-5" />,
    roles: ['data_collector'],
  },
  {
    name: 'Missing Data',
    path: 'missing-data',
    icon: <FiFileText className="h-5 w-5" />,
    roles: ['data_collector'],
  },
  {
    name: 'Maintenance Records',
    path: 'maintenance',
    icon: <FiTool className="h-5 w-5" />,
    roles: ['data_collector'],
  },
  {
    name: 'Exports',
    path: 'exports',
    icon: <FiDownload className="h-5 w-5" />,
    roles: ['data_collector'],
  },
  {
    name: 'Reports',
    path: 'reports',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['data_collector'],
  },

  // ── New: diesel data-entry access for data_collector ──
  {
    name: 'Upload CMS',
    path: 'diesel/cms-upload',
    icon: <FiUpload className="h-5 w-5" />,
    roles: ['data_collector'],
    dividerBefore: true,
  },
  {
    name: 'Upload GRATO',
    path: 'diesel/grato-upload',
    icon: <FiUpload className="h-5 w-5" />,
    roles: ['data_collector'],
  },
  {
    name: 'Diesel Alerts',
    path: 'diesel/alerts',
    icon: <FiBell className="h-5 w-5" />,
    roles: ['data_collector'],
  },

  // ========== OPERATIONS NAVIGATION ==========
  {
    name: 'Site Audits',
    path: 'audits',
    icon: <FiClipboard className="h-5 w-5" />,
    roles: ['operations'],
  },

  // ========== FINANCE NAVIGATION ==========
  {
    name: 'Finance Dashboard',
    path: '',
    icon: <FiDollarSign className="h-5 w-5" />,
    roles: ['finance'],
  },

  // ========== HEAD OF BUSINESS NAVIGATION ==========
  {
    name: 'Operations Command',
    path: '',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['head_of_business'],
  },

  // ========== CEO NAVIGATION ==========
  {
    name: 'Executive Command',
    path: '',
    icon: <FiStar className="h-5 w-5" />,
    roles: ['ceo'],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthContext();
  const fuelPendingCount = useFuelPendingCount(user?.role || '');

  const filteredNav = navigationItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 bg-secondary min-h-screen overflow-y-auto">
      <div className="flex flex-col items-center py-6">
        <PowerGenLogo className="mb-4" />
      </div>
      <div className="p-4 pt-0">
        {/* Role Badge */}
        <div className="mb-6">
          <h2 className="text-primary text-lg font-semibold mb-2">
            {user?.role === 'admin'           && 'Admin Portal'}
            {user?.role === 'supervisor'      && 'Supervisor Portal'}
            {user?.role === 'technician'      && 'Technician Portal'}
            {user?.role === 'diesel_manager'  && 'Diesel Manager'}
            {user?.role === 'data_collector'  && 'Data Collector'}
            {user?.role === 'analyst'         && 'Analyst Portal'}
            {user?.role === 'operations'      && 'Operations Portal'}
            {user?.role === 'finance'          && '💜 Finance Officer'}
            {user?.role === 'head_of_business' && '🔷 Head of Business'}
            {user?.role === 'ceo'              && '★ Chief Executive'}
          </h2>
          <div className="text-xs text-primary-light uppercase tracking-wider">
            {user?.fullName}
          </div>
        </div>

        <nav className="space-y-1">
          {filteredNav.map((item) => (
            <React.Fragment key={`${item.roles.join('-')}-${item.path}`}>

              {/* Section divider — only rendered when dividerBefore is true.
                  groupLabel adds a small uppercase heading under the line
                  for named sections (e.g. "Monthly Close"); a divider with
                  no groupLabel renders as a plain separator, unchanged. */}
              {item.dividerBefore && (
                <div className="pt-3 pb-1">
                  <div className="border-t border-white/10" />
                  {item.groupLabel && (
                    <div
                      className="px-3 pt-2 pb-1 font-semibold uppercase tracking-wider"
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}
                    >
                      {item.groupLabel}
                    </div>
                  )}
                </div>
              )}

              <NavLink
                to={item.basePath ? `${item.basePath}/${item.path}` : item.path}
                end={item.path === ''}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-primary-light hover:bg-danger hover:text-white'
                  )
                }
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: classNames('h-5 w-5', 'text-primary-light'),
                })}
                <span>{item.name}</span>
              </NavLink>

            </React.Fragment>
          ))}
        </nav>
      </div>
    </aside>
  );
};












// // ...existing code...
// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import { useAuthContext } from '@/contexts/AuthContext';
// import { classNames } from '@/utils/helpers';
// import PowerGenLogo from '@/components/common/PowerGenLogo';
// import {
//   FiHome,
//   FiTruck,
//   FiMapPin,
//   FiFileText,
//   FiCheckSquare,
//   FiUsers,
//   FiCalendar,
//   FiDroplet,
//   FiBarChart2,
//   FiDownload,
//   FiSettings,
//   FiTool,
//   FiPackage,
//   FiLayers,
//   FiAlertCircle,
//   FiClipboard,
//   FiUpload,
//   FiRefreshCw,
//   FiCreditCard,
//   FiCpu,
//   FiActivity,
//   FiBell,
//   FiDollarSign,
//   FiStar,
// } from 'react-icons/fi';

// interface NavItem {
//   name: string;
//   path: string;
//   icon: React.ReactNode;
//   roles: string[];
//   dividerBefore?: boolean; // renders a visual section separator above this item
// }

// const navigationItems: NavItem[] = [
//   {
//     name: 'Dashboard',
//     path: '',
//     icon: <FiHome className="h-5 w-5" />,
//     roles: ['admin', 'supervisor', 'technician', 'diesel_manager', 'data_collector', 'analyst', 'operations'],
//   },
//   {
//     name: 'Technician Audits',
//     path: 'technician-audits',
//     icon: <FiClipboard className="h-5 w-5" />,
//     roles: ['admin', 'supervisor'],
//   },

//   // ========== ADMIN NAVIGATION ==========
//   {
//     name: 'Users',
//     path: 'users',
//     icon: <FiUsers className="h-5 w-5" />,
//     roles: ['admin'],
//   },
//   {
//     name: 'Sites',
//     path: 'sites',
//     icon: <FiMapPin className="h-5 w-5" />,
//     roles: ['admin'],
//   },
//   {
//     name: 'Maintenance',
//     path: 'maintenance',
//     icon: <FiTool className="h-5 w-5" />,
//     roles: ['admin'],
//   },
//   {
//     name: 'Parts',
//     path: 'parts',
//     icon: <FiPackage className="h-5 w-5" />,
//     roles: ['admin'],
//   },
//   {
//     name: 'Clusters',
//     path: 'clusters',
//     icon: <FiLayers className="h-5 w-5" />,
//     roles: ['admin'],
//   },
//   {
//     name: 'System Reports',
//     path: 'reports',
//     icon: <FiBarChart2 className="h-5 w-5" />,
//     roles: ['admin'],
//   },

//   // ========== TECHNICIAN NAVIGATION ==========
//   {
//     name: 'My Sites',
//     path: 'sites',
//     icon: <FiMapPin className="h-5 w-5" />,
//     roles: ['technician'],
//   },
//   {
//     name: 'My Tasks',
//     path: 'tasks',
//     icon: <FiCheckSquare className="h-5 w-5" />,
//     roles: ['technician'],
//   },
//   {
//     name: 'Drafts',
//     path: 'drafts',
//     icon: <FiFileText className="h-5 w-5" />,
//     roles: ['technician'],
//   },
//   {
//     name: 'Visit History',
//     path: 'history',
//     icon: <FiCalendar className="h-5 w-5" />,
//     roles: ['technician'],
//   },

//   // ========== SUPERVISOR NAVIGATION ==========
//   {
//     name: 'Sites',
//     path: 'sites',
//     icon: <FiMapPin className="h-5 w-5" />,
//     roles: ['supervisor'],
//   },
//   {
//     name: 'Visit Approvals',
//     path: 'approvals',
//     icon: <FiCheckSquare className="h-5 w-5" />,
//     roles: ['supervisor'],
//   },
//   {
//     name: 'Part Requests',
//     path: 'part-requests',
//     icon: <FiTool className="h-5 w-5" />,
//     roles: ['supervisor'],
//   },
//   {
//     name: 'Scheduled',
//     path: 'scheduled',
//     icon: <FiCalendar className="h-5 w-5" />,
//     roles: ['supervisor'],
//   },
//   {
//     name: 'Technicians',
//     path: 'technicians',
//     icon: <FiUsers className="h-5 w-5" />,
//     roles: ['supervisor'],
//   },
//   {
//     name: 'Statistics',
//     path: 'statistics',
//     icon: <FiBarChart2 className="h-5 w-5" />,
//     roles: ['supervisor'],
//   },

//   // ========== DIESEL MANAGER NAVIGATION ==========
//   // ── Existing fuel-request workflow (unchanged) ──
//   {
//     name: 'Refuel',
//     path: 'fuel-requests',
//     icon: <FiDroplet className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Consumption',
//     path: 'consumption',
//     icon: <FiBarChart2 className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   // {
//   //   name: 'Low Fuel Alerts',
//   //   path: 'alerts',
//   //   icon: <FiAlertCircle className="h-5 w-5" />,
//   //   roles: ['diesel_manager'],
//   // },
//   // {
//   //   name: 'Scheduled Fuel Tasks',
//   //   path: 'scheduled',
//   //   icon: <FiCalendar className="h-5 w-5" />,
//   //   roles: ['diesel_manager'],
//   // },
//   // {
//   //   name: 'Trends',
//   //   path: 'trends',
//   //   icon: <FiBarChart2 className="h-5 w-5" />,
//   //   roles: ['diesel_manager'],
//   // },

//   // ── New: reconciliation system ──
//   {
//     name: 'Reconciliation',           // divider separates old workflow from new system
//     path: 'reconciliation-dashboard',
//     icon: <FiActivity className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//     dividerBefore: true,
//   },
//   {
//     name: 'Upload CMS Data',
//     path: 'cms-upload',
//     icon: <FiUpload className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Upload Daily Visits',
//     path: 'grato-upload',
//     icon: <FiUpload className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Site Reconciliation',
//     path: 'reconciliation',
//     icon: <FiRefreshCw className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Recon Alerts',
//     path: 'reconciliation-alerts',
//     icon: <FiBell className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Site Budget Upload',
//     path: 'site-budget',
//     icon: <FiBell className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Validation Upload',
//     path: 'validation',
//     icon: <FiBell className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Tom Card',
//     path: 'tomcard',
//     icon: <FiCreditCard className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Generator Ledger',
//     path: 'generators',
//     icon: <FiCpu className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },
//   {
//     name: 'Recon Reports',
//     path: 'recon-reports',
//     icon: <FiDownload className="h-5 w-5" />,
//     roles: ['diesel_manager'],
//   },

//   // ========== DATA COLLECTOR NAVIGATION ==========
//   // ── Existing data quality pages (unchanged) ──
//   {
//     name: 'Data Quality',
//     path: 'data-quality',
//     icon: <FiCheckSquare className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },
//   {
//     name: 'Missing Data',
//     path: 'missing-data',
//     icon: <FiFileText className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },
//   {
//     name: 'Maintenance Records',
//     path: 'maintenance',
//     icon: <FiTool className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },
//   {
//     name: 'Exports',
//     path: 'exports',
//     icon: <FiDownload className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },
//   {
//     name: 'Reports',
//     path: 'reports',
//     icon: <FiBarChart2 className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },

//   // ── New: diesel data-entry access for data_collector ──
//   {
//     name: 'Upload CMS',
//     path: 'diesel/cms-upload',
//     icon: <FiUpload className="h-5 w-5" />,
//     roles: ['data_collector'],
//     dividerBefore: true,
//   },
//   {
//     name: 'Upload GRATO',
//     path: 'diesel/grato-upload',
//     icon: <FiUpload className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },
//   {
//     name: 'Diesel Alerts',
//     path: 'diesel/alerts',
//     icon: <FiBell className="h-5 w-5" />,
//     roles: ['data_collector'],
//   },

//   // ========== OPERATIONS NAVIGATION ==========
//   {
//     name: 'Site Audits',
//     path: 'audits',
//     icon: <FiClipboard className="h-5 w-5" />,
//     roles: ['operations'],
//   },

//   // ========== FINANCE NAVIGATION ==========
//   {
//     name: 'Finance Dashboard',
//     path: '',
//     icon: <FiDollarSign className="h-5 w-5" />,
//     roles: ['finance'],
//   },

//   // ========== HEAD OF BUSINESS NAVIGATION ==========
//   {
//     name: 'Operations Command',
//     path: '',
//     icon: <FiBarChart2 className="h-5 w-5" />,
//     roles: ['head_of_business'],
//   },

//   // ========== CEO NAVIGATION ==========
//   {
//     name: 'Executive Command',
//     path: '',
//     icon: <FiStar className="h-5 w-5" />,
//     roles: ['ceo'],
//   },
// ];

// export const Sidebar: React.FC = () => {
//   const { user } = useAuthContext();

//   const filteredNav = navigationItems.filter((item) =>
//     item.roles.includes(user?.role || '')
//   );

//   return (
//     <aside className="w-64 bg-secondary min-h-screen overflow-y-auto">
//       <div className="flex flex-col items-center py-6">
//         <PowerGenLogo className="mb-4" />
//       </div>
//       <div className="p-4 pt-0">
//         {/* Role Badge */}
//         <div className="mb-6">
//           <h2 className="text-primary text-lg font-semibold mb-2">
//             {user?.role === 'admin'           && 'Admin Portal'}
//             {user?.role === 'supervisor'      && 'Supervisor Portal'}
//             {user?.role === 'technician'      && 'Technician Portal'}
//             {user?.role === 'diesel_manager'  && 'Diesel Manager'}
//             {user?.role === 'data_collector'  && 'Data Collector'}
//             {user?.role === 'analyst'         && 'Analyst Portal'}
//             {user?.role === 'operations'      && 'Operations Portal'}
//             {user?.role === 'finance'          && 'Finance Officer'}
//             {user?.role === 'head_of_business' && 'Head of Business'}
//             {user?.role === 'ceo'              && 'Chief Executive'}
//           </h2>
//           <div className="text-xs text-primary-light uppercase tracking-wider">
//             {user?.fullName}
//           </div>
//         </div>

//         <nav className="space-y-1">
//           {filteredNav.map((item) => (
//             <React.Fragment key={`${item.roles.join('-')}-${item.path}`}>

//               {/* Section divider — only rendered when dividerBefore is true */}
//               {item.dividerBefore && (
//                 <div className="pt-3 pb-1">
//                   <div className="border-t border-white/10" />
//                 </div>
//               )}

//               <NavLink
//                 to={item.path}
//                 end={item.path === ''}
//                 className={({ isActive }) =>
//                   classNames(
//                     'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
//                     isActive
//                       ? 'bg-primary text-white'
//                       : 'text-primary-light hover:bg-danger hover:text-white'
//                   )
//                 }
//               >
//                 {React.cloneElement(item.icon as React.ReactElement, {
//                   className: classNames('h-5 w-5', 'text-primary-light'),
//                 })}
//                 <span>{item.name}</span>
//               </NavLink>

//             </React.Fragment>
//           ))}
//         </nav>
//       </div>
//     </aside>
//   );
// };













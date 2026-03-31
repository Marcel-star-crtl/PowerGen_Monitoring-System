// ...existing code...
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { classNames } from '@/utils/helpers';
import PowerGenLogo from '@/components/common/PowerGenLogo';
import {
  FiHome,
  FiTruck,
  FiMapPin,
  FiFileText,
  FiCheckSquare,
  FiUsers,
  FiCalendar,
  FiDroplet,
  FiBarChart2,
  FiDownload,
  FiSettings,
  FiTool,
  FiPackage,
  FiLayers,
  FiAlertCircle,
  FiClipboard,
} from 'react-icons/fi';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
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
  // ========== ADMIN NAVIGATION ===========
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
  {
    name: 'Fuel Requests',
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
  {
    name: 'Low Fuel Alerts',
    path: 'alerts',
    icon: <FiAlertCircle className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Scheduled Fuel Tasks',
    path: 'scheduled',
    icon: <FiCalendar className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  {
    name: 'Trends',
    path: 'trends',
    icon: <FiBarChart2 className="h-5 w-5" />,
    roles: ['diesel_manager'],
  },
  
  // ========== DATA COLLECTOR NAVIGATION ==========
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

  // ========== OPERATIONS NAVIGATION ==========
  {
    name: 'Site Audits',
    path: 'audits',
    icon: <FiClipboard className="h-5 w-5" />,
    roles: ['operations'],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthContext();

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
            {user?.role === 'admin' && 'Admin Portal'}
            {user?.role === 'supervisor' && 'Supervisor Portal'}
            {user?.role === 'technician' && 'Technician Portal'}
            {user?.role === 'diesel_manager' && 'Diesel Manager'}
            {user?.role === 'data_collector' && 'Data Collector'}
            {user?.role === 'analyst' && 'Analyst Portal'}
            {user?.role === 'operations' && 'Operations Portal'}
          </h2>
          <div className="text-xs text-primary-light uppercase tracking-wider">
            {user?.fullName}
          </div>
        </div>

        <nav className="space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
              {/* Icon color is always text-primary-light for consistency */}
              {React.cloneElement(item.icon as React.ReactElement, {
                className: classNames('h-5 w-5', 'text-primary-light'),
              })}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};



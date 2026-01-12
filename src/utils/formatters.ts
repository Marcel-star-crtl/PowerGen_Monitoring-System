import { format, formatDistance } from 'date-fns';
import { StatusType, PriorityType } from '@/types/common.types';

export const formatDate = (date: Date | string | null | undefined, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return '-';
  try {
    return format(new Date(date), formatStr);
  } catch {
    return '-';
  }
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  } catch {
    return '-';
  }
};

export const formatNumber = (num: number | null | undefined, decimals: number = 0): string => {
  if (num === null || num === undefined) return '-';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercentage = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, decimals)}%`;
};

export const formatFuelLevel = (
  level: number | null | undefined,
  capacity: number | null | undefined
): { text: string; percentage: number; color: string } => {
  if (!level || !capacity) return { text: '-', percentage: 0, color: 'gray' };

  const percentage = (level / capacity) * 100;

  let color = 'green';
  if (percentage < 10) color = 'red';
  else if (percentage < 25) color = 'orange';
  else if (percentage < 50) color = 'yellow';

  return {
    text: `${formatNumber(level, 1)}L (${formatPercentage(percentage, 0)})`,
    percentage,
    color,
  };
};

export const formatStatus = (status: StatusType): { label: string; color: string } => {
  const statusMap: Record<StatusType, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'gray' },
    pending_approval: { label: 'Pending', color: 'yellow' },
    approved: { label: 'Approved', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    in_progress: { label: 'In Progress', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
  };

  return statusMap[status] || { label: status, color: 'gray' };
};

export const formatPriority = (priority: PriorityType): { label: string; color: string } => {
  const priorityMap: Record<PriorityType, { label: string; color: string }> = {
    low: { label: 'Low', color: 'gray' },
    medium: { label: 'Medium', color: 'blue' },
    high: { label: 'High', color: 'orange' },
    critical: { label: 'Critical', color: 'red' },
  };

  return priorityMap[priority] || { label: priority, color: 'gray' };
};

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  // Format Cameroon phone numbers: +237 6XX XXX XXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9 && cleaned.startsWith('6')) {
    return `+237 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  return phone;
};


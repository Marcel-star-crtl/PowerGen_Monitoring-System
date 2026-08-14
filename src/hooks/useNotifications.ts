/**
 * useNotifications.ts
 * Hook for reading diesel system alerts / notifications.
 * Matches the interface expected by NotificationBell.tsx and Header.tsx.
 */
import { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '@/api/dieselApi';
import type { DieselAlert } from '@/types/diesel.types';

interface UseNotificationsReturn {
  notifications: DieselAlert[];
  unreadCount:   number;
  loading:       boolean;
  error:         string | null;
  refetch:       () => void;
  acknowledge:   (id: string) => Promise<void>;
  resolve:       (id: string, note: string) => Promise<void>;
  markAllRead:   () => Promise<void>;
}

export function useNotifications(params?: any): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<DieselAlert[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, countRes] = await Promise.all([
        alertsApi.list({ limit: 50, status: 'open', ...params }),
        alertsApi.unreadCount(),
      ]);
      setNotifications((listRes as any)?.data || []);
      setUnreadCount((countRes as any)?.data?.count || (countRes as any)?.count || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id: string) => {
    await alertsApi.acknowledge(id);
    load();
  };

  const resolve = async (id: string, note: string) => {
    await alertsApi.resolve(id, note);
    load();
  };

  const markAllRead = async () => {
    await alertsApi.readAll();
    load();
  };

  return { notifications, unreadCount, loading, error, refetch: load, acknowledge, resolve, markAllRead };
}

import { useState, useCallback, useEffect } from 'react';
import { authAPI, handleApiError } from '@/api';
import { User, ApiError } from '@/types/common.types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasRole: (roles: User['role'] | User['role'][]) => boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = authAPI.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await authAPI.login(credentials);
      setUser(data.user);
      return { user: data.user };
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    return authAPI.isAuthenticated();
  }, []);

  const hasRole = useCallback(
    (roles: User['role'] | User['role'][]) => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return roles.includes(user.role);
      }
      return user.role === roles;
    },
    [user]
  );

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };
};
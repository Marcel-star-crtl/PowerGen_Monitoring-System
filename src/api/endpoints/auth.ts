import apiClient from '../client';
import { User, ApiResponse } from '@/types/common.types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data!;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { accessToken, refreshToken, user };
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  refreshToken: async (): Promise<{ accessToken: string; refreshToken?: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
      '/auth/refresh',
      { refreshToken }
    );
    
    const { accessToken, refreshToken: newRefreshToken } = response.data.data!;
    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return { accessToken, refreshToken: newRefreshToken };
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  getUserRole: (): User['role'] | null => {
    const user = authAPI.getCurrentUser();
    return user?.role || null;
  },
};



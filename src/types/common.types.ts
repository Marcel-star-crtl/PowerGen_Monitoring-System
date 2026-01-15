export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'supervisor' | 'technician' | 'diesel_manager' | 'data_collector' | 'analyst';
  phone?: string;
  isActive: boolean;
  assignedTechnicians?: string[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  current: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface ApiError {
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface Photo {
  url: string;
  category: 'before' | 'during' | 'after' | 'issue' | 'parts' | 'general';
  description: string;
  uploaded_at: Date;
}

export type StatusType = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 'completed';
export type PriorityType = 'low' | 'medium' | 'high' | 'critical';
export type VisitType = 'PM' | 'END' | 'RF' | 'PM+END' | 'PM+RF' | 'RF+END' | 'PM+RF+END';




export interface User {
  id: number;
  nama: string;
  email: string;
  role: 'admin' | 'sarpras' | 'perpus' | 'kepala_sekolah';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  table_name: string;
  record_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user_nama?: string;
}

export interface Notification {
  id: number;
  user_id: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: number | null;
  reference_table: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

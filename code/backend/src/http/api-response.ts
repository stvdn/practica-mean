export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: { field: string; message: string }[];
  meta?: { total: number; page: number; limit: number; pages: number };
}
export function success<T>(data: T, message: string): ApiResponse<T> {
  return { success: true, message, data, errors: [] };
}

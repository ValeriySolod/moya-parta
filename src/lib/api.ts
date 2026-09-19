import type { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('desk_token');
};

export const setToken = (token: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    localStorage.setItem('desk_token', token);
  } else {
    localStorage.removeItem('desk_token');
  }
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.message ?? 'Щось пішло не так. Спробуй ще раз',
      response.status,
    );
  }

  return payload.data as T;
}

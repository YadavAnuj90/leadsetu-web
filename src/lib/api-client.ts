import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

// Uses Next.js rewrite `/api/:path*` -> `${NEXT_PUBLIC_API_URL}/v1/:path*`
// withCredentials: true ensures the HttpOnly `leadsetu_refresh_token` cookie is sent automatically
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer accessToken
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401 using the HttpOnly refresh cookie
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[]; error?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // The browser automatically sends the HttpOnly `leadsetu_refresh_token` cookie
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().setAuth({
          user: data.user,
          tenant: data.tenant,
          accessToken: data.accessToken,
        });
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
    if (err.code === 'ECONNABORTED' || !err.response) {
      return 'Cannot reach Leadsetu API server (port 3001). Please make sure the backend is running.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

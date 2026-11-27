import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('savora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export function formatEGP(v: number | string, locale: string): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 2 }).format(n);
  return locale === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
}

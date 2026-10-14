import { request } from './api';

export const passwordService = {
  forgot: (email: string) =>
    request<{ message: string }>('/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  reset: (token: string, newPassword: string) =>
    request<void>('/password/reset', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  change: (currentPassword: string, newPassword: string) =>
    request<void>('/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

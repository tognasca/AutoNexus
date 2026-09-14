import { request } from './api';
import type { LoginResponse, User } from '../types/auth';

export const authService = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => request<User>('/auth/me'),
};

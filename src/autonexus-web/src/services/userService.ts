import { request } from './api';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  profile: number; // 1 = Admin, 2 = Vendedor, 3 = Cliente
  profileName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  profile: number;
}

export const userService = {
  getAll: async (): Promise<UserItem[]> => {
    return await request<UserItem[]>('/users');
  },

  create: async (data: CreateUserInput): Promise<UserItem> => {
    return await request<UserItem>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
import { request } from './api';

export interface BankConfig {
  id: string;
  bankCode: string;
  name: string;
  defaultMonthlyRate: number;
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  merchantId?: string;
  isActive: boolean;
  isSandbox: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBankConfig {
  bankCode: string;
  name: string;
  defaultMonthlyRate: number;
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  merchantId?: string;
  isSandbox: boolean;
}

export interface UpdateBankConfig {
  name: string;
  defaultMonthlyRate: number;
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  merchantId?: string;
  isActive: boolean;
  isSandbox: boolean;
}

export const bankConfigService = {
  getAll: async (): Promise<BankConfig[]> => {
    return await request<BankConfig[]>('/bank-configs');
  },

  create: async (data: CreateBankConfig): Promise<BankConfig> => {
    return await request<BankConfig>('/bank-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateBankConfig): Promise<BankConfig> => {
    return await request<BankConfig>(`/bank-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleActive: async (id: string): Promise<{ isActive: boolean }> => {
    return await request<{ isActive: boolean }>(`/bank-configs/${id}/toggle-active`, {
      method: 'PATCH',
    });
  },
};
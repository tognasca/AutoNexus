import { request } from './api';

export interface TenantSettings {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  timeZone: string;
  currency: string;
}

export const tenantSettingsService = {
  get: async (): Promise<TenantSettings> => {
    return await request<TenantSettings>('/tenant-settings');
  },

  update: async (data: TenantSettings): Promise<TenantSettings> => {
    return await request<TenantSettings>('/tenant-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

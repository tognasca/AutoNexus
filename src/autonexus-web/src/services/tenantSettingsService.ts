import { request } from './api';

export interface TenantSettings {
  companyName: string; logoUrl: string | null; primaryColor: string;
  whatsappNumber: string | null; timeZone: string; currency: string;
  heroImageUrl?: string | null; heroTemplateKey?: string | null;
}
export const tenantSettingsService = {
  get: async (): Promise<TenantSettings> => request<TenantSettings>('/tenant-settings'),
  update: async (data: TenantSettings): Promise<TenantSettings> => request<TenantSettings>('/tenant-settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadHero: async (file: File): Promise<{ heroImageUrl: string }> => {
    const form = new FormData(); form.append('file', file);
    return request<{ heroImageUrl: string }>('/tenant-settings/hero-image', { method: 'POST', body: form });
  },
  removeHero: async (): Promise<void> => request<void>('/tenant-settings/hero-image', { method: 'DELETE' }),
};

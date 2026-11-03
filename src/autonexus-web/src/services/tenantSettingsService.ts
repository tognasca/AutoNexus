import { request } from './api';

export interface TenantSettings {
  companyName: string; logoUrl: string | null; primaryColor: string;
  whatsappNumber: string | null; timeZone: string; currency: string;
  heroImageUrl?: string | null; heroTemplateKey?: string | null;
  welcomeText?: string | null; heroTitle?: string | null;
}
export const tenantSettingsService = {
  get: async (): Promise<TenantSettings> => request<TenantSettings>('/tenant-settings'),
  update: async (data: TenantSettings): Promise<TenantSettings> => request<TenantSettings>('/tenant-settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const form = new FormData(); form.append('file', file);
    return request<{ logoUrl: string }>('/tenant-settings/logo', { method: 'POST', body: form });
  },
  removeLogo: async (): Promise<void> => request<void>('/tenant-settings/logo', { method: 'DELETE' }),
  uploadHero: async (file: File): Promise<{ heroImageUrl: string }> => {
    const form = new FormData(); form.append('file', file);
    return request<{ heroImageUrl: string }>('/tenant-settings/hero-image', { method: 'POST', body: form });
  },
  removeHero: async (): Promise<void> => request<void>('/tenant-settings/hero-image', { method: 'DELETE' }),
};

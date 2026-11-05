import { request } from './api';

export interface TenantSettings {
  companyName: string; logoUrl: string | null; primaryColor: string;
  whatsappNumber: string | null; timeZone: string; currency: string;
  heroImageUrl?: string | null; heroTemplateKey?: string | null;
  welcomeText?: string | null; heroTitle?: string | null;
}
export interface WhatsAppContact { id: string; name: string; phoneNumber: string; isDefault: boolean; isActive: boolean; }
export const tenantSettingsService = {
  getWhatsAppContacts: async (): Promise<WhatsAppContact[]> => request<WhatsAppContact[]>('/tenant-settings/whatsapp-contacts'),
  createWhatsAppContact: async (data: { name: string; phoneNumber: string; isDefault: boolean }): Promise<WhatsAppContact> => request<WhatsAppContact>('/tenant-settings/whatsapp-contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateWhatsAppContact: async (id: string, data: { name: string; phoneNumber: string; isDefault: boolean }): Promise<WhatsAppContact> => request<WhatsAppContact>(`/tenant-settings/whatsapp-contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setWhatsAppContactActive: async (id: string, isActive: boolean): Promise<void> => request<void>(`/tenant-settings/whatsapp-contacts/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
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

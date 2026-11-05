import { request } from './api';
import type { Plan } from './subscriptionService';

export interface Tenant { id: string; name: string; slug: string; isActive: boolean; createdAt: string; }
export interface CreateTenantInput { tenantName: string; tenantSlug: string; adminName: string; adminEmail: string; adminPassword: string; }
export interface SuperAdminUser { id: string; name: string; email: string; profile: number; profileName: string; isActive: boolean; createdAt: string; tenantId: string; }
export interface AuditLogEntry { id: string; tenantId: string; userId: string | null; operation: string; resource: string; resourceId: string | null; details: string | null; executedAt: string; }
export interface ProductionReadinessCheck { name: string; ok: boolean; blocking: boolean; guidance: string; }
export interface ProductionReadiness { ready: boolean; environment: string; checkedAtUtc: string; checks: ProductionReadinessCheck[]; }
export interface MercadoPagoConfigurationStatus { configured: boolean; environment: 'test' | 'production'; accessTokenHint: string | null; webhookSecretConfigured: boolean; configuredAtUtc: string | null; }

export const superAdminService = {
  getTenants: async (): Promise<Tenant[]> => await request<Tenant[]>('/superadmin/tenants'),
  createTenant: async (data: CreateTenantInput): Promise<Tenant> => await request<Tenant>('/superadmin/tenants', { method: 'POST', body: JSON.stringify(data) }),
  activateTenant: async (tenantId: string): Promise<void> => { await request<void>(`/superadmin/tenants/${tenantId}/activate`, { method: 'POST' }); },
  deactivateTenant: async (tenantId: string): Promise<void> => { await request<void>(`/superadmin/tenants/${tenantId}/deactivate`, { method: 'POST' }); },
  getUsers: async (tenantId?: string): Promise<SuperAdminUser[]> => await request<SuperAdminUser[]>(`/superadmin/users${tenantId ? `?tenantId=${tenantId}` : ''}`),
  getPlans: async (): Promise<Plan[]> => await request<Plan[]>('/superadmin/plans'),
  updatePlan: async (id: string, data: { name: string; price: number; annualPrice: number | null; trialDays: number; maxUsers: number | null; maxVehicles: number | null; maxStorageMb: number | null }): Promise<Plan> => await request<Plan>(`/superadmin/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createPlan: async (data: { name: string; price: number; annualPrice?: number | null; trialDays?: number; maxUsers: number | null; maxVehicles: number | null; maxStorageMb: number | null }): Promise<Plan> => await request<Plan>('/superadmin/plans', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: async (tenantId?: string): Promise<AuditLogEntry[]> => await request<AuditLogEntry[]>(`/superadmin/audit-logs${tenantId ? `?tenantId=${tenantId}` : ''}`),
  getProductionReadiness: async (): Promise<ProductionReadiness> => await request<ProductionReadiness>('/superadmin/production-readiness'),
  getMercadoPagoConfiguration: async (): Promise<MercadoPagoConfigurationStatus> => await request<MercadoPagoConfigurationStatus>('/superadmin/mercadopago'),
  saveMercadoPagoConfiguration: async (data: { accessToken: string; webhookSecret: string; environment: 'test' | 'production' }): Promise<{ message: string }> => await request<{ message: string }>('/superadmin/mercadopago', { method: 'PUT', body: JSON.stringify(data) }),
  validateMercadoPagoConfiguration: async (): Promise<{ valid: boolean; message: string; account?: string }> => await request<{ valid: boolean; message: string; account?: string }>('/superadmin/mercadopago/validate', { method: 'POST' }),
  getPlatformIntegrationSettings: async (): Promise<PlatformIntegrationSettings> => await request<PlatformIntegrationSettings>('/superadmin/integrations'),
  savePlatformIntegrationSettings: async (data: { resendApiKey: string; resendFromEmail: string; resendFromName: string; bvAccessToken: string; bvCommercialPartnerCode: string; bvFinancingConditionsEndpoint: string }): Promise<{ message: string }> => await request<{ message: string }>('/superadmin/integrations', { method: 'PUT', body: JSON.stringify(data) }),
};

export interface PlatformIntegrationSettings {
  resendConfigured: boolean; resendApiKeyHint: string | null; resendFromEmail: string | null; resendFromName: string;
  bvConfigured: boolean; bvAccessTokenHint: string | null; bvPartnerCodeHint: string | null; bvEndpoint: string | null; configuredAtUtc: string | null;
}
export const platformIntegrationSettingsApi = {
  get: async (): Promise<PlatformIntegrationSettings> => await request<PlatformIntegrationSettings>('/superadmin/integrations'),
  save: async (data: { resendApiKey: string; resendFromEmail: string; resendFromName: string; bvAccessToken: string; bvCommercialPartnerCode: string; bvFinancingConditionsEndpoint: string }): Promise<{ message: string }> =>
    await request<{ message: string }>('/superadmin/integrations', { method: 'PUT', body: JSON.stringify(data) }),
};

import { request } from './api';
import type { TenantSubscription, Plan } from './subscriptionService';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTenantInput {
  tenantName: string;
  tenantSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  profile: number;
  profileName: string;
  isActive: boolean;
  createdAt: string;
  tenantId: string;
}

export const superAdminService = {
  getTenants: async (): Promise<Tenant[]> => {
    return await request<Tenant[]>('/superadmin/tenants');
  },

  createTenant: async (data: CreateTenantInput): Promise<Tenant> => {
    return await request<Tenant>('/superadmin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  activateTenant: async (tenantId: string): Promise<void> => {
    await request<void>(`/superadmin/tenants/${tenantId}/activate`, { method: 'POST' });
  },

  deactivateTenant: async (tenantId: string): Promise<void> => {
    await request<void>(`/superadmin/tenants/${tenantId}/deactivate`, { method: 'POST' });
  },

  getUsers: async (tenantId?: string): Promise<SuperAdminUser[]> => {
    const query = tenantId ? `?tenantId=${tenantId}` : '';
    return await request<SuperAdminUser[]>(`/superadmin/users${query}`);
  },

  getPlans: async (): Promise<Plan[]> => {
    return await request<Plan[]>('/superadmin/plans');
  },

  createPlan: async (data: { name: string; price: number; maxUsers: number | null; maxVehicles: number | null; maxStorageMb: number | null }): Promise<Plan> => {
    return await request<Plan>('/superadmin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSubscription: async (tenantId: string): Promise<TenantSubscription | null> => {
    try {
      return await request<TenantSubscription>(`/superadmin/tenants/${tenantId}/subscription`);
    } catch {
      return null;
    }
  },

  assignPlan: async (tenantId: string, planId: string): Promise<TenantSubscription> => {
    return await request<TenantSubscription>(`/superadmin/tenants/${tenantId}/subscription`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },
};

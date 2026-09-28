import { request } from './api';

// 1=Trialing, 2=Active, 3=PastDue, 4=Canceled, 5=Suspended
export const SubscriptionStatus: Record<number, string> = {
  1: 'Em teste',
  2: 'Ativa',
  3: 'Pagamento pendente',
  4: 'Cancelada',
  5: 'Suspensa',
};

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  planName: string;
  status: number;
  startDate: string;
  endDate: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  maxUsers: number | null;
  maxVehicles: number | null;
  maxStorageMb: number | null;
}

export const subscriptionService = {
  getCurrent: async (): Promise<TenantSubscription | null> => {
    try {
      return await request<TenantSubscription>('/subscription');
    } catch {
      // Empresa ainda sem assinatura (404) — tela trata como "sem plano".
      return null;
    }
  },

  getAvailablePlans: async (): Promise<Plan[]> => {
    return await request<Plan[]>('/subscription/plans');
  },
};

import { request } from './api';
import type { Plan, TenantSubscription } from './subscriptionService';

export type BillingCycle = 1 | 2; // 1 = mensal, 2 = anual
export type PaymentMethod = 1 | 2 | 3; // 1 = Pix, 2 = Cartão, 3 = Boleto

export const PaymentMethodLabel: Record<number, string> = { 1: 'Pix', 2: 'Cartão de crédito', 3: 'Boleto' };
export const PaymentStatusLabel: Record<number, string> = { 1: 'Pendente', 2: 'Aprovado', 3: 'Recusado', 4: 'Estornado', 5: 'Cancelado' };

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  method: number;
  status: number;
  createdAt: string;
  paidAt: string | null;
}

export interface BillingOverview {
  subscription: TenantSubscription | null;
  plan: Plan | null;
  paymentHistory: PaymentHistoryItem[];
  trialDaysRemaining: number | null;
}

export interface CheckoutResult {
  paymentId: string;
  method: number;
  status: number;
  redirectUrl: string | null;
  pixCode: string | null;
  qrCodeBase64: string | null;
}

export interface SignupInput {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  planId: string;
  cycle: BillingCycle;
  acceptTermsOfUse: boolean;
  acceptPrivacyPolicy: boolean;
  acceptCookiePolicy: boolean;
}

export interface LegalDocument {
  type: number;
  version: number;
  content: string;
  publishedAt: string;
}

// Formato brasileiro: R$ 49,90
export const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const billingService = {
  getOverview: () => request<BillingOverview>('/billing/overview'),

  checkout: (data: { planId: string; cycle: BillingCycle; method: PaymentMethod; payerDocument?: string }) =>
    request<CheckoutResult>('/billing/checkout', { method: 'POST', body: JSON.stringify(data) }),

  cancel: (reason?: string) =>
    request<void>('/billing/cancel', { method: 'POST', body: JSON.stringify({ reason }) }),

  publicPlans: () => request<Plan[]>('/signup/plans'),

  signup: (data: SignupInput) =>
    request<{ login: { token: string; userId: string; name: string; email: string; profile: number; tenantId: string }; trialDays: number }>(
      '/signup', { method: 'POST', body: JSON.stringify(data) }),

  getLegal: (slug: 'termos' | 'privacidade' | 'cookies') => request<LegalDocument>(`/legal/${slug}`),
};

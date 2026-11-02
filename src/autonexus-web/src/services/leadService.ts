import { request } from './api';

export const LeadStatus = {
  Novo: 0,
  Contato: 1,
  Negociacao: 2,
  Proposta: 3,
  Venda: 4,
  Perdido: 5,
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  notes?: string | null;
  status: LeadStatus;
  statusName: string;
  vehicleId?: string | null;
  vehicleName?: string | null;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  lastContactAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface LeadInput {
  name: string;
  phone: string;
  email?: string | null;
  source?: string;
  notes?: string | null;
  vehicleId?: string | null;
  assignedToUserId?: string | null;
}

export const leadService = {
  getAll: (search?: string) => {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    return request<LeadItem[]>(`/leads?${params.toString()}`);
  },
  create: (input: LeadInput) => request<LeadItem>('/leads', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  update: (id: string, input: LeadInput) => request<LeadItem>(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }),
  changeStatus: (id: string, status: LeadStatus) => request<LeadItem>(`/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  registerContact: (id: string) => request<LeadItem>(`/leads/${id}/contact`, {
    method: 'POST',
  }),
  delete: (id: string) => request<void>(`/leads/${id}`, { method: 'DELETE' }),
};

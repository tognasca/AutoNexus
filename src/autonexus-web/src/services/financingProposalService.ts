import { request } from './api';

export interface FinancingProposal {
  id: string;
  proposalNumber: string;
  status: string;
  customerName: string;
  customerCpf: string;
  vehicleName: string;
  vehiclePrice: number;
  entryValue: number;
  tradeValue: number;
  financedAmount: number;
  months: number;
  installmentValue: number;
  createdAt: string;
  statusUpdatedAt: string;
  message: string;
}

export interface FinancingProposalCreate {
  customerName: string;
  customerCpf: string;
  birthDate?: string;
  monthlyIncome: number;
  hasDriverLicense: boolean;
  phone?: string;
  email?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: Record<string, string | undefined>;
  professional?: Record<string, string | number | undefined>;
  vehicleName: string;
  vehicleId?: string;
  brand?: string;
  model?: string;
  vehicleYear?: string;
  plate?: string;
  renavam?: string;
  chassis?: string;
  vehiclePrice: number;
  entryValue: number;
  tradeValue: number;
  financedAmount: number;
  months: number;
  installmentValue: number;
  notes?: string;
  documentReferences?: string[];
  privacyConsent: boolean;
}

export const financingProposalService = {
  list: () => request<FinancingProposal[]>('/financing/proposals'),
  create: (data: FinancingProposalCreate) => request<FinancingProposal>('/financing/proposals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  export: async (id: string, format: 'xml' | 'txt' | 'csv' | 'json') => {
    const response = await fetch(`/api/financing/proposals/${id}/export/${format}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Não foi possível exportar a proposta.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `autonexus-financiamento-${id}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

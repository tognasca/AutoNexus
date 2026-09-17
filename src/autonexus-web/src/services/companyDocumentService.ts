import { request } from './api';

export interface CompanyDocument {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  amount?: number;
  referenceDate?: string;
  notes?: string;
  createdAt: string;
}

export const companyDocumentService = {
  getAll: async (): Promise<CompanyDocument[]> => {
    return await request<CompanyDocument[]>('/company-documents');
  },

  upload: async (formData: FormData): Promise<CompanyDocument> => {
    const token = localStorage.getItem('autonexus_token');
    const response = await fetch('/api/company-documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erro no upload' }));
      throw new Error(err.message || 'Erro ao enviar documento.');
    }

    return await response.json();
  },

  delete: async (id: string): Promise<void> => {
    return await request<void>(`/company-documents/${id}`, {
      method: 'DELETE'
    });
  }
};
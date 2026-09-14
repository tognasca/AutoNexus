const API_BASE_URL = '/api';

export interface DocumentItem {
  id: string;
  vehicleId: string;
  documentCategoryId: string;
  documentCategoryName: string;
  name: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  notes?: string;
  createdAt: string;
}

export interface BuyerLink {
  id: string;
  vehicleId: string;
  token: string;
  shareUrl: string;
  expiresAt: string;
  isValid: boolean;
  buyerName?: string;
  createdAt: string;
}

export const documentService = {
  getDocuments: async (vehicleId: string): Promise<DocumentItem[]> => {
    const token = localStorage.getItem('autonexus_token');
    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erro ao carregar documentos.');
    return res.json();
  },

  uploadDocument: async (vehicleId: string, categoryId: string, name: string, file: File, notes?: string): Promise<DocumentItem> => {
    const token = localStorage.getItem('autonexus_token');
    const formData = new FormData();
    formData.append('categoryId', categoryId);
    formData.append('name', name);
    formData.append('file', file);
    if (notes) formData.append('notes', notes);

    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erro ao salvar documento.' }));
      throw new Error(err.message || 'Erro no upload do documento.');
    }
    return res.json();
  },

  deleteDocument: async (vehicleId: string, documentId: string): Promise<void> => {
    const token = localStorage.getItem('autonexus_token');
    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erro ao excluir documento.');
  },

  downloadZipUrl: (vehicleId: string) => {
    const token = localStorage.getItem('autonexus_token');
    return `${API_BASE_URL}/vehicles/${vehicleId}/documents/download-zip`;
  },

  createBuyerLink: async (vehicleId: string, buyerName?: string): Promise<BuyerLink> => {
    const token = localStorage.getItem('autonexus_token');
    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/documents/share-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ buyerName, expirationDays: 30 }),
    });
    if (!res.ok) throw new Error('Erro ao gerar link do comprador.');
    return res.json();
  },
};

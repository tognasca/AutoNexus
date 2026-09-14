const API_BASE_URL = '/api/portal';

export interface PortalVehicle {
  vehicleId: string;
  brand: string;
  model: string;
  version?: string;
  modelYear: number;
  plate?: string;
  price: number;
  photos: Array<{ id: string; storagePath: string; isMain: boolean }>;
  documents: Array<{ id: string; name: string; documentCategoryName: string; fileName: string; fileSize: number }>;
  hasElectronicAcceptance: boolean;
  acceptedAt?: string;
  acceptedByBuyerName?: string;
}

export interface AcceptanceResult {
  id: string;
  buyerName: string;
  acceptedAt: string;
  ipAddress: string;
  termVersion: string;
}

export const portalService = {
  getDetails: async (token: string): Promise<PortalVehicle> => {
    const res = await fetch(`${API_BASE_URL}/${token}`);
    if (!res.ok) throw new Error('Link do comprador inválido ou expirado.');
    return res.json();
  },

  getDownloadDocUrl: (token: string, documentId: string) =>
    `${API_BASE_URL}/${token}/documents/${documentId}/download`,

  getDownloadZipUrl: (token: string) =>
    `${API_BASE_URL}/${token}/documents/download-all`,

  submitAcceptance: async (token: string, buyerName: string, buyerDocument: string): Promise<AcceptanceResult> => {
    const res = await fetch(`${API_BASE_URL}/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerName, buyerDocument }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erro ao registrar aceite.' }));
      throw new Error(err.message || 'Erro no registro de aceite.');
    }
    return res.json();
  },
};

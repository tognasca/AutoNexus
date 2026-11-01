import { request } from './api';

export interface PremiumCatalogPublication {
  domain: string;
  isActive: boolean;
  lastGeneratedAt?: string | null;
}

export const premiumCatalogService = {
  getPublication: () => request<PremiumCatalogPublication | null>('/premium/catalog/publication'),
  savePublication: (domain: string) => request<PremiumCatalogPublication>('/premium/catalog/publication', {
    method: 'PUT',
    body: JSON.stringify({ domain }),
    headers: { 'Content-Type': 'application/json' },
  }),
  downloadPackage: async () => {
    const token = localStorage.getItem('token');
    const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/premium/catalog/package`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || 'Não foi possível gerar o catálogo Premium.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'autonexus-catalogo-premium.zip';
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

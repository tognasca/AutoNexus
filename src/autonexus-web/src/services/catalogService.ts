import { request } from './api';

export interface VehicleDocumentDetail {
  id: string;
  name: string;
  documentType?: string;
  filePath?: string;
  fileUrl?: string;
  createdAt?: string;
}

export interface PublicVehiclePhoto {
  id: string;
  fileName?: string;
  storagePath?: string;
  url?: string;
  isMain?: boolean;
  order?: number;
}

export interface PublicVehicleDetail {
  id: string;
  brand: string;
  model: string;
  version?: string;
  manufacturingYear: number;
  modelYear: number;
  plate?: string;
  mileage: number;
  color?: string;
  fuel?: number;
  transmission?: number;
  status?: number;
  purchaseValue?: number;
  listedValue?: number;
  notes?: string;
  mainPhotoUrl?: string;
  photos?: PublicVehiclePhoto[];
  documents?: VehicleDocumentDetail[];
  createdAt?: string;
}

export function getPhotoUrl(input?: string | null): string {
  if (!input) return '';
  
  let url = input.trim().replace(/\\/g, '/');

  // Se vier URL absoluta (http://...:5000/uploads/...), extrai só o /uploads/...
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      const withoutProtocol = url.replace(/^https?:\/\//i, '');
      const slashIndex = withoutProtocol.indexOf('/');
      if (slashIndex !== -1) return withoutProtocol.substring(slashIndex);
      return '';
    }
  }

  // Garante barra inicial
  if (!url.startsWith('/')) url = '/' + url;
  return url;
}

export const catalogService = {
  getPublicCatalog: async (): Promise<any[]> => {
    const data = await request<any>('/public/catalog');
    return data.items || data;
  },

  getPublicVehicle: async (id: string): Promise<PublicVehicleDetail> => {
    return await request<PublicVehicleDetail>(`/public/catalog/${id}`);
  },

  generateAiDescription: async (payload: {
    brand: string;
    model: string;
    year: number;
    price: number;
    fipePrice?: number;
    mileage: number;
    color: string;
    fuelType: string;
    transmission: string;
    optionals?: string[];
  }): Promise<string> => {
    const response = await request<{ description: string }>('/public/generate-ai-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.description;
  },

  getXmlFeedUrl: (): string => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const baseURL = import.meta.env.VITE_API_URL || `http://${host}:5000/api`;
    return `${baseURL}/public/feed/xml`;
  }
};
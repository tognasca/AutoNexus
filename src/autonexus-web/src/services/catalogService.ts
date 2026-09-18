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

export const getPhotoUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalized = path.replace(/\\/g, '/');
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;

  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const apiBase = import.meta.env.VITE_API_URL || `http://${host}:5000/api`;
  const baseUrl = apiBase.replace(/\/api\/?$/, ''); // http://localhost:5000

  return `${baseUrl}${cleanPath}`;
};

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
import { request } from './api';
import { VehicleSummary } from '../types/vehicle';


export const catalogService = {
  getPublicCatalog: async (): Promise<VehicleSummary[]> => {
    return await request<VehicleSummary[]>('/public/catalog');
  },

  getPublicVehicle: async (id: string): Promise<VehicleSummary> => {
    return await request<VehicleSummary>(`/public/catalog/${id}`);
  },

  generateAiDescription: async (payload: {
    brand: string;
    model: string;
    year: number;
    price: number;
    fipePrice?: number;
    mileage: number;
    color?: string;
    fuelType: string;
    transmission: string;
    optionals?: string[];
  }): Promise<string> => {
    const data = await request<{ description: string }>('/public/generate-ai-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return data.description;
  },

  getXmlFeedUrl: (): string => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/public/feed/xml`;
  }
};
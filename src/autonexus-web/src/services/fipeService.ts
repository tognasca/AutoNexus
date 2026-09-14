import { request } from './api';

export interface FipeLookupItem {
  code: string;
  name: string;
}

export interface FipeHistoryItem {
  id: string;
  vehicleId: string;
  fipeValue: number;
  referenceMonth: number;
  referenceYear: number;
  consultationDate: string;
  source?: string;
}

export interface FipeSummary {
  vehicleId: string;
  latestFipeValue?: number;
  latestReferenceMonth?: number;
  latestReferenceYear?: number;
  lastConsultationDate?: string;
  history: FipeHistoryItem[];
}

export const fipeService = {
  getSummary: (vehicleId: string) =>
    request<FipeSummary>(`/vehicles/${vehicleId}/fipe`),  

  getBrands: (vehicleId: string) =>
    request<FipeLookupItem[]>(`/vehicles/${vehicleId}/fipe/brands`),

  getModels: (vehicleId: string, brandCode: string) =>
    request<FipeLookupItem[]>(`/vehicles/${vehicleId}/fipe/brands/${brandCode}/models`),

  getYears: (vehicleId: string, brandCode: string, modelCode: string) =>
    request<FipeLookupItem[]>(`/vehicles/${vehicleId}/fipe/brands/${brandCode}/models/${modelCode}/years`),

  fetchGuided: (vehicleId: string, vehicleType: string, brandCode: string, modelCode: string, yearCode: string) =>
    request<FipeSummary>(`/vehicles/${vehicleId}/fipe/fetch-guided`, {
      method: 'POST',
      body: JSON.stringify({ vehicleType, brandCode, modelCode, yearCode }),
    }),

  fetchFromBrasilApi: (vehicleId: string, fipeCode: string, modelYear?: number) =>
    request<FipeSummary>(`/vehicles/${vehicleId}/fipe/fetch`, {
      method: 'POST',
      body: JSON.stringify({ fipeCode, modelYear }),
    }),

  addManual: (vehicleId: string, fipeValue: number, referenceMonth: number, referenceYear: number, notes?: string) =>
    request<FipeSummary>(`/vehicles/${vehicleId}/fipe/manual`, {
      method: 'POST',
      body: JSON.stringify({ fipeValue, referenceMonth, referenceYear, notes }),
    }),
};

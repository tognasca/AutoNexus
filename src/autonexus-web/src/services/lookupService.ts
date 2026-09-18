import { request } from './api';
import type { LookupItem } from '../types/lookup';

export const lookupService = {
  getVehicleTypes: () => request<LookupItem[]>('/lookup/vehicle-types'),
  getCostCategories: () => request<LookupItem[]>('/lookup/cost-categories'),
  getDocumentCategories: () => request<LookupItem[]>('/lookup/document-categories'),
  getBrands: () => request<LookupItem[]>('/lookup/brands'),
  getModelsByBrand: (brandId: string) => request<LookupItem[]>(`/lookup/brands/${brandId}/models`)
};
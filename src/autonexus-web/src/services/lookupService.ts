import { request } from './api';
import type { LookupItem } from '../types/lookup';

export const lookupService = {
  getVehicleTypes: () => request<LookupItem[]>('/lookup/vehicle-types'),
  getCostCategories: () => request<LookupItem[]>('/lookup/cost-categories'),
  getDocumentCategories: () => request<LookupItem[]>('/lookup/document-categories'),
};
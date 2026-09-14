import { request } from './api';

export interface CostItem {
  id: string;
  vehicleId: string;
  costCategoryId: string;
  costCategoryName: string;
  description: string;
  value: number;
  costDate: string;
  responsibleUserId: string;
  notes?: string;
  createdAt: string;
}

export interface VehicleCostSummary {
  vehicleId: string;
  purchaseValue: number;
  totalAdditionalCosts: number;
  totalVehicleCost: number;
  costs: CostItem[];
}

export interface CreateCostInput {
  costCategoryId: string;
  description: string;
  value: number;
  costDate: string;
  notes?: string;
}

export const costService = {
  getSummary: (vehicleId: string) =>
    request<VehicleCostSummary>(`/vehicles/${vehicleId}/costs`),

  addCost: (vehicleId: string, input: CreateCostInput) =>
    request<CostItem>(`/vehicles/${vehicleId}/costs`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteCost: (vehicleId: string, costId: string) =>
    request<void>(`/vehicles/${vehicleId}/costs/${costId}`, {
      method: 'DELETE',
    }),
};

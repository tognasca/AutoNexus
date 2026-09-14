import { request } from './api';
import type { VehicleSummary, PagedResult, VehicleFilter, CreateVehicleInput, VehicleStatus } from '../types/vehicle';

export const vehicleService = {
  getAll: (filter: VehicleFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.vehicleTypeId) params.append('vehicleTypeId', filter.vehicleTypeId);
    if (filter.status !== undefined) params.append('status', filter.status.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.minPrice) params.append('minPrice', filter.minPrice.toString());
    if (filter.maxPrice) params.append('maxPrice', filter.maxPrice.toString());

    return request<PagedResult<VehicleSummary>>(`/vehicles?${params.toString()}`);
  },

  create: (data: CreateVehicleInput) =>
    request<{ id: string }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changeStatus: (id: string, status: VehicleStatus) =>
    request<void>(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status),
    }),

  delete: (id: string) =>
    request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    }),
};

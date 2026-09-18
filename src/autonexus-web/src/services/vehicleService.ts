import { request } from './api';
import type {
  VehicleSummary,
  PagedResult,
  VehicleFilter,
  CreateVehicleInput,
  UpdateVehicleInput
} from '../types/vehicle';

export const vehicleService = {
  getAll: async (filter: VehicleFilter = {}): Promise<PagedResult<VehicleSummary>> => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.status !== undefined && filter.status !== null) params.append('status', filter.status.toString());
    if (filter.vehicleTypeId) params.append('vehicleTypeId', filter.vehicleTypeId);

    const response = await request<any>(`/vehicles?${params.toString()}`);
    const rawItems = response.items || response || [];

    const items: VehicleSummary[] = rawItems.map((v: any) => ({
      id: v.id || v.Id,
      vehicleTypeId: v.vehicleTypeId || v.VehicleTypeId,
      vehicleTypeName: v.vehicleTypeName || v.VehicleTypeName || '',
      brand: v.brand || v.Brand || '',
      model: v.model || v.Model || '',
      version: v.version || v.Version || '',
      manufacturingYear: v.manufacturingYear || v.ManufacturingYear || 0,
      modelYear: v.modelYear || v.ModelYear || 0,
      plate: v.plate || v.Plate || '',
      mileage: v.mileage || v.Mileage || 0,
      color: v.color || v.Color || '',
      status: v.status ?? v.Status ?? 1,
      purchaseValue: Number(v.purchaseValue ?? v.PurchaseValue ?? 0),
      listedValue: Number(v.listedValue ?? v.ListedValue ?? 0),
      saleValue: v.saleValue ?? v.SaleValue,
      mainPhotoUrl: v.mainPhotoUrl || v.MainPhotoUrl,
      createdAt: v.createdAt || v.CreatedAt || new Date().toISOString(),
    }));

    return {
      items,
      totalCount: response.totalCount ?? items.length,
      page: response.page ?? 1,
      pageSize: response.pageSize ?? 10,
      totalPages: response.totalPages ?? 1,
    };
  },

  getById: async (id: string): Promise<any> => {
    return await request<any>(`/vehicles/${id}`);
  },

  getVehicleById: async (id: string): Promise<any> => {
    return await request<any>(`/vehicles/${id}`);
  },

  create: async (input: CreateVehicleInput): Promise<VehicleSummary> => {
    return await request<VehicleSummary>('/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  update: async (id: string, input: UpdateVehicleInput): Promise<VehicleSummary> => {
    return await request<VehicleSummary>(`/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  updateVehicle: async (id: string, input: UpdateVehicleInput): Promise<VehicleSummary> => {
    return await request<VehicleSummary>(`/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  delete: async (id: string): Promise<void> => {
    await request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }
};
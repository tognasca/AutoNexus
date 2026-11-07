import { request } from './api';
import type {
  VehicleSummary,
  PagedResult,
  VehicleFilter,
  CreateVehicleInput,
  UpdateVehicleInput
} from '../types/vehicle';

interface VehicleApiRecord {
  id?: string;
  Id?: string;
  vehicleTypeId?: string;
  VehicleTypeId?: string;
  vehicleTypeName?: string;
  VehicleTypeName?: string;
  brand?: string;
  Brand?: string;
  model?: string;
  Model?: string;
  version?: string;
  Version?: string;
  manufacturingYear?: number;
  ManufacturingYear?: number;
  modelYear?: number;
  ModelYear?: number;
  plate?: string;
  Plate?: string;
  mileage?: number;
  Mileage?: number;
  color?: string;
  Color?: string;
  status?: number | string;
  Status?: number | string;
  purchaseValue?: number;
  PurchaseValue?: number;
  listedValue?: number;
  ListedValue?: number;
  saleValue?: number;
  SaleValue?: number;
  mainPhotoUrl?: string;
  MainPhotoUrl?: string;
  whatsAppContactId?: string | null;
  WhatsAppContactId?: string | null;
  createdAt?: string;
  CreatedAt?: string;
  photos?: Array<{ id: string; fileName?: string; storagePath?: string; url?: string; isMain?: boolean; order?: number }>;
  [key: string]: unknown;
}

interface VehicleApiPage {
  items?: VehicleApiRecord[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export const vehicleService = {
  getAll: async (filter: VehicleFilter = {}): Promise<PagedResult<VehicleSummary>> => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.status !== undefined && filter.status !== null) params.append('status', filter.status.toString());
    if (filter.vehicleTypeId) params.append('vehicleTypeId', filter.vehicleTypeId);

    const response = await request<VehicleApiPage | VehicleApiRecord[]>(`/vehicles?${params.toString()}`);
    const page = Array.isArray(response) ? undefined : response;
    const rawItems: VehicleApiRecord[] = Array.isArray(response) ? response : page?.items || [];

    const items: VehicleSummary[] = rawItems.map((v) => ({
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
      whatsappContactId: v.whatsAppContactId || v.WhatsAppContactId || null,
      createdAt: v.createdAt || v.CreatedAt || new Date().toISOString(),
    }));

    return {
      items,
      totalCount: page?.totalCount ?? items.length,
      page: page?.page ?? 1,
      pageSize: page?.pageSize ?? 10,
      totalPages: page?.totalPages ?? 1,
    };
  },

  getInventorySummary: async (): Promise<{ total: number; available: number; reserved: number; sold: number; over60Days: number; over90Days: number }> => {
    return await request<{ total: number; available: number; reserved: number; sold: number; over60Days: number; over90Days: number }>('/vehicles/inventory-summary');
  },

  getHistory: async (id: string): Promise<Array<{ id: string; operation: string; details?: string; userId?: string; executedAt: string }>> => {
    return await request<Array<{ id: string; operation: string; details?: string; userId?: string; executedAt: string }>>(`/vehicles/${id}/history`);
  },

  getById: async (id: string): Promise<VehicleApiRecord> => {
    return await request<VehicleApiRecord>(`/vehicles/${id}`);
  },

  getVehicleById: async (id: string): Promise<VehicleApiRecord> => {
    return await request<VehicleApiRecord>(`/vehicles/${id}`);
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  updateVehicle: async (id: string, input: UpdateVehicleInput): Promise<VehicleSummary> => {
    return await request<VehicleSummary>(`/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  assignWhatsAppContact: async (id: string, contactId: string | null): Promise<void> => { await request<void>(`/vehicles/${id}/whatsapp-contact`, { method: 'PUT', body: JSON.stringify({ contactId }) }); },

  delete: async (id: string): Promise<void> => {
    await request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }
};
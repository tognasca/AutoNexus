// Espelho dos Enums do C# para uso no Frontend
export const VehicleStatus = {
  AVenda: 1,
  EmTroca: 2,
  Vendido: 3,
} as const;
export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const FuelType = {
  Gasolina: 1,
  Etanol: 2,
  Flex: 3,
  Diesel: 4,
  Hibrido: 5,
  Eletrico: 6,
  Outro: 99,
} as const;
export type FuelType = (typeof FuelType)[keyof typeof FuelType];

export const TransmissionType = {
  Manual: 1,
  Automatico: 2,
  CVT: 3,
  Outro: 99,
} as const;
export type TransmissionType = (typeof TransmissionType)[keyof typeof TransmissionType];

export interface VehicleSummary {
  id: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  brand: string;
  model: string;
  version?: string;
  manufacturingYear: number;
  modelYear: number;
  plate?: string;
  mileage: number;
  color?: string;
  status: VehicleStatus;
  purchaseValue: number;
  listedValue?: number;
  saleValue?: number;
  mainPhotoUrl?: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VehicleFilter {
  page?: number;
  pageSize?: number;
  vehicleTypeId?: string;
  status?: VehicleStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
}

export interface CreateVehicleInput {
  vehicleTypeId: string;
  brand: string;
  model: string;
  version?: string;
  manufacturingYear: number;
  modelYear: number;
  plate?: string;
  chassis?: string;
  mileage: number;
  color?: string;
  fuel?: FuelType;
  transmission?: TransmissionType;
  purchaseValue: number;
  listedValue?: number;
  notes?: string;
}

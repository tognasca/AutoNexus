import { request } from './api';

export interface CostDetail {
  description: string;
  categoryName: string;
  value: number;
  date: string;
}

export interface VehicleDre {
  vehicleId: string;
  brand: string;
  model: string;
  plate?: string;
  status: string;
  PurchaseValue: number;
  totalDirectCosts: number;
  totalCostBase: number;
  targetOrSaleValue: number;
  profitOrMargin: number;
  marginPercentage: number;
  daysInStock: number;
  costs: CostDetail[];
  soldByName?: string;
  soldAt?: string;
}

export interface DreSummary {
  totalRevenue: number;
  totalPurchaseCosts: number;
  totalDirectExpenses: number;
  totalCostBase: number;
  totalNetProfit: number;
  averageMarginPercentage: number;
  totalVehiclesCount: number;
  vehicles: VehicleDre[];
}

export const reportService = {
  getDreReport: async (): Promise<DreSummary> => {
    return await request<DreSummary>('/reports/dre');
  }
};
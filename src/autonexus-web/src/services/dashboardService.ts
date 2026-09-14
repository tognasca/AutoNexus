import { request } from './api';

export interface DashboardKpi {
  vehiclesForSale: number;
  vehiclesInTrade: number;
  vehiclesSold: number;
  totalStockCost: number;
  totalStockListedValue: number;
  totalStockFipeValue: number;
  estimatedPotentialMargin: number;
}

export interface RecentActivity {
  vehicleId: string;
  vehicleName: string;
  operationType: string;
  value: number;
  date: string;
  status: string;
}

export interface DashboardSummary {
  kpis: DashboardKpi;
  recentActivities: RecentActivity[];
}

export const dashboardService = {
  getSummary: () => request<DashboardSummary>('/dashboard/summary'),
};

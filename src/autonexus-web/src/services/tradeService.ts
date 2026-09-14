import { request } from './api';
import type { CreateVehicleInput } from '../types/vehicle';

export interface CompleteSaleInput {
  saleValue: number;
  buyerName?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface CreateTradeInput {
  deliveredVehicleId: string;
  receivedVehicle: CreateVehicleInput;
  receivedVehicleFipe: number;
  deliveredVehicleFipe: number;
  receivedVehicleNegotiatedValue: number;
  deliveredVehicleNegotiatedValue: number;
  estimatedResaleCost: number;
  differenceValue: number;
  differencePaidByUs: boolean;
  tradeDate: string;
  notes?: string;
}

export interface TradeEvaluation {
  receivedVehicleFipe: number;
  estimatedResaleCost: number;
  receivedResult: number;
  deliveredVehicleFipe: number;
  differenceValue: number;
  differencePaidByUs: boolean;
  deliveredResult: number;
  indicator: number;
  indicatorExplanation: string;
}

export interface TradeItem {
  id: string;
  receivedVehicleId: string;
  receivedVehicleName: string;
  deliveredVehicleId: string;
  deliveredVehicleName: string;
  receivedVehicleFipe: number;
  deliveredVehicleFipe: number;
  receivedVehicleNegotiatedValue: number;
  deliveredVehicleNegotiatedValue: number;
  estimatedResaleCost: number;
  differenceValue: number;
  differencePaidByUs: boolean;
  evaluation: TradeEvaluation;
  tradeDate: string;
  responsibleUserId: string;
  notes?: string;
  createdAt: string;
}

export const tradeService = {
  getAll: () => request<TradeItem[]>('/trades'),
  getById: (id: string) => request<TradeItem>(`/trades/${id}`),
  createTrade: (input: CreateTradeInput) =>
    request<TradeItem>('/trades', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  completeSale: (vehicleId: string, input: CompleteSaleInput) =>
    request<void>(`/vehicles/${vehicleId}/sell`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

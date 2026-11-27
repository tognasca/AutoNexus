import { request } from './api';

export interface StoreSetup {
  companyName: string;
  identityReady: boolean;
  contactReady: boolean;
  teamCount: number;
  vehiclesCount: number;
  publishedCount: number;
  hasAttendance: boolean;
  hasProposal: boolean;
  hasSale: boolean;
  catalogPath: string;
}

export const getStoreSetup = (signal?: AbortSignal) => request<StoreSetup>('/store-setup', { signal });

export function firstSaleSteps(setup: StoreSetup) {
  return [
    { label: 'Estoque cadastrado', done: setup.vehiclesCount > 0, action: 'Importar estoque', href: '#importar-estoque' },
    { label: 'Vitrine com veículo disponível', done: setup.publishedCount > 0, action: 'Abrir estoque', view: 'vehicles' },
    { label: 'Primeiro atendimento', done: setup.hasAttendance, action: 'Abrir Mesa de Atendimento', view: 'leads' },
    { label: 'Primeira proposta publicada', done: setup.hasProposal, action: 'Preparar proposta na Mesa de Atendimento', view: 'leads' },
    { label: 'Primeira venda registrada', done: setup.hasSale, action: 'Fechar venda na Mesa de Atendimento', view: 'leads' },
  ];
}

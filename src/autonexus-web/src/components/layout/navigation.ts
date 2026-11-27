import {
  ArrowLeftRight, BarChart3, Building2, Calculator, Car, CreditCard, FileText,
  LayoutDashboard, MessageCircle, Settings, ShieldCheck, Truck, Award, Rocket,
} from 'lucide-react';

export const primaryNavigation = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Estoque', icon: Car },
  { id: 'leads', label: 'Atendimentos', icon: MessageCircle },
  { id: 'after-sales', label: 'Pós-venda', icon: Truck },
];

export const navigationGroups = [
  { label: 'Negociações', items: [
    { id: 'trades', label: 'Histórico de trocas', icon: ArrowLeftRight },
    { id: 'financing', label: 'Propostas de financiamento', icon: CreditCard },
    { id: 'simulator', label: 'Simulador avulso', icon: Calculator },
  ] },
  { label: 'Relatórios', items: [
    { id: 'commercial-dashboard', label: 'Indicadores comerciais', icon: BarChart3 },
    { id: 'reports', label: 'DRE', icon: BarChart3 },
    { id: 'commissions', label: 'Comissões', icon: Award },
  ] },
  { label: 'Administração', items: [
    { id: 'settings-center', label: 'Configurações', icon: Settings },
    { id: 'subscription', label: 'Assinatura', icon: Building2 },
    { id: 'superadmin', label: 'Painel SuperAdmin', icon: ShieldCheck },
    { id: 'legal-documents', label: 'Documentos legais', icon: FileText },
    { id: 'production-readiness', label: 'Prontidão para produção', icon: Rocket },
  ] },
];

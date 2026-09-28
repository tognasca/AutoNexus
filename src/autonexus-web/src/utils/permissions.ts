export const UserProfileEnum = {
  SuperAdmin: 0,
  Admin: 1,
  Seller: 2,
  Customer: 3,
} as const;

export const canAccessView = (profile?: number, view?: string): boolean => {
  if (profile === undefined || profile === null || !view) return false;
  if (view === 'catalog') return true;

  // SuperAdmin (0): só acessa a área global do SaaS — nenhum módulo
  // operacional de uma empresa específica (ele não pertence a nenhuma).
  if (profile === UserProfileEnum.SuperAdmin) {
    return view === 'superadmin';
  }

  // Administrador (1): Acesso total a todas as visões da própria empresa
  if (profile === UserProfileEnum.Admin) {
    return view !== 'superadmin';
  }

  // Vendedor (2): Módulos operacionais de vendas, estoque e simulador
  if (profile === UserProfileEnum.Seller) {
    const sellerAllowedViews = [
      'dashboard',
      'vehicles',
      'trades',
      'simulator',
      'reports',
      'catalog',
      'subscription'
    ];
    return sellerAllowedViews.includes(view);
  }

  // Cliente (3): Acesso restrito ao Portal do Comprador
  if (profile === UserProfileEnum.Customer) {
    const customerAllowedViews = ['portal', 'buyer-link'];
    return customerAllowedViews.includes(view);
  }

  return false;
};
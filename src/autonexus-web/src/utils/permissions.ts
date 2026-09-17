export const UserProfileEnum = {
  Admin: 1,
  Seller: 2,
  Customer: 3,
} as const;

export const canAccessView = (profile?: number, view?: string): boolean => {
  if (!profile || !view) return false;
  if (view === 'catalog') return true;
  // Administrador (1): Acesso total a todas as visões do sistema
  if (profile === UserProfileEnum.Admin) {
    return true;
  }

  // Vendedor (2): Módulos operacionais de vendas, estoque e simulador
  if (profile === UserProfileEnum.Seller) {
    const sellerAllowedViews = [
      'dashboard',
      'vehicles',
      'trades',
      'simulator',
      'reports',
      'catalog'
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
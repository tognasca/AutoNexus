export const UserProfileEnum = {
  SuperAdmin: 0,
  Admin: 1,
  Seller: 2,
  Customer: 3,
} as const;

export const canAccessView = (profile?: number, view?: string): boolean => {
  if (profile === undefined || profile === null || !view) return false;
  if (view === 'catalog') return true;
  if (profile === UserProfileEnum.SuperAdmin) return view === 'superadmin';
  if (profile === UserProfileEnum.Admin) return view !== 'superadmin';
  if (profile === UserProfileEnum.Seller) {
    const sellerAllowedViews = [
      'dashboard', 'vehicles', 'trades', 'simulator', 'financing', 'reports', 'catalog', 'subscription'
    ];
    return sellerAllowedViews.includes(view);
  }
  if (profile === UserProfileEnum.Customer) {
    const customerAllowedViews = ['portal', 'buyer-link'];
    return customerAllowedViews.includes(view);
  }
  return false;
};

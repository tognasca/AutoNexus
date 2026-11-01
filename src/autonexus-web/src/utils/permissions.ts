export const UserProfileEnum = {
  SuperAdmin: 0,
  Admin: 1,
  Seller: 2,
  Customer: 3,
} as const;

export const canAccessView = (profile?: number, view?: string): boolean => {
  if (profile === undefined || profile === null || !view) return false;
  if (view === 'catalog') return true;
  if (profile === UserProfileEnum.SuperAdmin) return view === 'superadmin' || view === 'production-readiness';
  if (profile === UserProfileEnum.Admin) return view !== 'superadmin' && view !== 'production-readiness';
  if (profile === UserProfileEnum.Seller) {
    const sellerAllowedViews = ['dashboard', 'commercial-dashboard', 'vehicles', 'trades', 'simulator', 'financing', 'reports', 'commissions', 'catalog', 'subscription', 'onboarding', 'commercial'];
    return sellerAllowedViews.includes(view);
  }
  if (profile === UserProfileEnum.Customer) return ['portal', 'buyer-link'].includes(view);
  return false;
};

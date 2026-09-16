export const UserProfile = {
  Admin: 1,
  Vendedor: 2,
  Cliente: 3,
} as const;
export type UserProfile = (typeof UserProfile)[keyof typeof UserProfile];

export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  profile: UserProfile; 
  profileName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
  isActive: boolean;
}

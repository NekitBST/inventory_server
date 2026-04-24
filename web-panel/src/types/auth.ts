import type { RoleName } from './common';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
  role?: {
    id: number;
    name: RoleName;
  };
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

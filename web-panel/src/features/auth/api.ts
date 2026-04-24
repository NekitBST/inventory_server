import { apiClient } from '../../lib/api-client';
import type {
  AuthTokens,
  ChangePasswordPayload,
  CurrentUser,
  LoginPayload,
} from '../../types/auth';

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', payload);
    return data;
  },

  async me() {
    const { data } = await apiClient.get<CurrentUser>('/auth/me');
    return data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async logoutAll() {
    await apiClient.post('/auth/logout-all');
  },

  async changePassword(payload: ChangePasswordPayload) {
    await apiClient.post('/auth/change-password', payload);
  },
};

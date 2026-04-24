import { apiClient } from '../../lib/api-client';
import type { PaginatedResponse } from '../../types/common';
import type {
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from '../../types/entities';

export type UsersQuery = {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
  isActive?: boolean;
};

export const usersApi = {
  async getAll(params: UsersQuery) {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/users', {
      params,
    });
    return data;
  },

  async create(payload: UserCreatePayload) {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  async update(id: string, payload: UserUpdatePayload) {
    const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async deactivate(id: string) {
    await apiClient.delete(`/users/${id}`);
  },

  async restore(id: string) {
    await apiClient.post(`/users/${id}/restore`);
  },
};

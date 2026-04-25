import { apiClient } from '../../lib/api-client';
import type { PaginatedResponse } from '../../types/common';
import type { OptionItem } from '../../types/common';

export type ReferenceModule =
  | 'locations'
  | 'equipment-types'
  | 'equipment-statuses';

export type PaginatedReferenceModule = 'locations' | 'equipment-types';

export type ReferenceListQuery = {
  page: number;
  limit: number;
  search?: string;
};

function isPaginatedModule(
  module: ReferenceModule,
): module is PaginatedReferenceModule {
  return module === 'locations' || module === 'equipment-types';
}

export const referencesApi = {
  async getAll(module: ReferenceModule) {
    if (isPaginatedModule(module)) {
      const paged = await this.getList(module, {
        page: 1,
        limit: 100,
      });
      return paged.items;
    }

    const { data } = await apiClient.get<OptionItem[]>(`/${module}`);
    return data;
  },

  async getList(module: PaginatedReferenceModule, params: ReferenceListQuery) {
    const { data } = await apiClient.get<PaginatedResponse<OptionItem>>(
      `/${module}`,
      {
        params,
      },
    );
    return data;
  },

  async create(module: ReferenceModule, payload: { name: string }) {
    const { data } = await apiClient.post<OptionItem>(`/${module}`, payload);
    return data;
  },

  async update(module: ReferenceModule, id: number, payload: { name: string }) {
    const { data } = await apiClient.patch<OptionItem>(
      `/${module}/${id}`,
      payload,
    );
    return data;
  },

  async remove(module: ReferenceModule, id: number) {
    await apiClient.delete(`/${module}/${id}`);
  },
};

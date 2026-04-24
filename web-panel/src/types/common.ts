export type RoleName = 'ADMIN' | 'USER';

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type OptionItem = {
  id: number;
  name: string;
};

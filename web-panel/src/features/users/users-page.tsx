import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { usersApi } from './api';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<number | undefined>();
  const [isActive, setIsActive] = useState<boolean | undefined>();

  const filters = useMemo(
    () => ({ page, limit: 20, search: search || undefined, roleId, isActive }),
    [page, search, roleId, isActive],
  );

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.getAll(filters),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => [
      { id: 1, name: 'ADMIN' },
      { id: 2, name: 'USER' },
    ],
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => usersApi.restore(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <Card title="Пользователи">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input
          placeholder="Поиск по ФИО"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />

        <Select
          value={roleId ?? ''}
          onChange={(event) => {
            setPage(1);
            setRoleId(
              event.target.value ? Number(event.target.value) : undefined,
            );
          }}
        >
          <option value="">Все роли</option>
          {rolesQuery.data?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Select>

        <Select
          value={isActive === undefined ? '' : String(isActive)}
          onChange={(event) => {
            setPage(1);
            if (event.target.value === '') {
              setIsActive(undefined);
            } else {
              setIsActive(event.target.value === 'true');
            }
          }}
        >
          <option value="">Любая активность</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </Select>

        <div className="h-10" />
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">ФИО</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Роль</th>
              <th className="px-3 py-2">Активность</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {usersQuery.data?.items.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-2">{user.fullName}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.role?.name ?? user.roleId}</td>
                <td className="px-3 py-2">
                  {user.isActive ? 'Активен' : 'Неактивен'}
                </td>
                <td className="px-3 py-2">
                  {user.isActive ? (
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => deactivateMutation.mutate(user.id)}
                    >
                      Деактивировать
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => restoreMutation.mutate(user.id)}
                    >
                      Восстановить
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!usersQuery.isLoading && !usersQuery.data?.items.length ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center text-gray-500">
                  Ничего не найдено
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {usersQuery.data ? (
        <Pagination
          page={usersQuery.data.page}
          limit={usersQuery.data.limit}
          total={usersQuery.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </Card>
  );
}

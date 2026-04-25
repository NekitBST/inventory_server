import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../app/toast-provider';
import { getApiErrorMessage } from '../../lib/api-error';
import { useAuth } from '../auth/useAuth';
import { usersApi } from './api';
import type {
  UserCreatePayload,
  UserUpdatePayload,
} from '../../types/entities';

type UserFormState = {
  email: string;
  fullName: string;
  password: string;
  roleId: string;
};

const initialFormState: UserFormState = {
  email: '',
  fullName: '',
  password: '',
  roleId: '2',
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, refreshMe } = useAuth();
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<number | undefined>();
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState('');

  const syncCurrentUserIfNeeded = async (affectedUserId: string) => {
    if (currentUser?.id !== affectedUserId) return;
    try {
      await refreshMe();
    } catch {
    }
  };

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
    onSuccess: async (_, affectedUserId) => {
      setPendingDeactivateId(null);
      pushToast({ title: 'Пользователь деактивирован', tone: 'warning' });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await syncCurrentUserIfNeeded(affectedUserId);
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      const isDefaultAdminProtection = message
        .toLowerCase()
        .includes('дефолтного администратора');
      pushToast({
        title: isDefaultAdminProtection
          ? 'Дефолтного администратора нельзя деактивировать'
          : 'Не удалось деактивировать пользователя',
        description: isDefaultAdminProtection ? undefined : message,
        tone: 'error',
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => usersApi.restore(id),
    onSuccess: async (_, affectedUserId) => {
      pushToast({ title: 'Пользователь восстановлен', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await syncCurrentUserIfNeeded(affectedUserId);
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      pushToast({
        title: 'Не удалось восстановить пользователя',
        description: message,
        tone: 'error',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserCreatePayload) => usersApi.create(payload),
    onSuccess: async () => {
      setForm(initialFormState);
      setFormError('');
      pushToast({ title: 'Пользователь создан', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setFormError(message);
      pushToast({
        title: 'Ошибка создания пользователя',
        description: message,
        tone: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdatePayload }) =>
      usersApi.update(id, payload),
    onSuccess: async (_, variables) => {
      setEditingUserId(null);
      setForm(initialFormState);
      setFormError('');
      pushToast({ title: 'Пользователь обновлён', tone: 'info' });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await syncCurrentUserIfNeeded(variables.id);
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setFormError(message);
      pushToast({
        title: 'Ошибка обновления пользователя',
        description: message,
        tone: 'error',
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleStartEdit = (user: {
    id: string;
    email: string;
    fullName: string;
    roleId: number;
  }) => {
    setEditingUserId(user.id);
    setForm({
      email: user.email,
      fullName: user.fullName,
      password: '',
      roleId: String(user.roleId),
    });
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setForm(initialFormState);
    setFormError('');
  };

  const handleSubmitForm = async () => {
    const email = form.email.trim().toLowerCase();
    const fullName = form.fullName.trim();
    const roleValue = Number(form.roleId);

    if (!fullName || !form.roleId) {
      setFormError('Укажите ФИО и роль');
      return;
    }

    if (editingUserId) {
      const payload: UserUpdatePayload = {
        fullName,
        roleId: roleValue,
      };

      const trimmedPassword = form.password.trim();
      if (trimmedPassword) {
        if (trimmedPassword.length < 8) {
          setFormError('Новый пароль должен быть не менее 8 символов');
          return;
        }
        payload.password = trimmedPassword;
      }

      await updateMutation.mutateAsync({ id: editingUserId, payload });
      return;
    }

    const password = form.password.trim();
    if (!email || !password) {
      setFormError('Для создания укажите email и пароль');
      return;
    }

    if (password.length < 8) {
      setFormError('Пароль должен быть не менее 8 символов');
      return;
    }

    await createMutation.mutateAsync({
      email,
      fullName,
      password,
      roleId: roleValue,
    });
  };

  return (
    <Card title="Пользователи">
      <section className="mb-5 rounded-md border border-gray-200 p-3">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          {editingUserId ? 'Редактирование пользователя' : 'Новый пользователь'}
        </h3>

        <div className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Email*"
            value={form.email}
            disabled={Boolean(editingUserId)}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))
            }
          />
          <Input
            placeholder="ФИО*"
            value={form.fullName}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                fullName: event.target.value,
              }))
            }
          />
          <Input
            type="password"
            placeholder={
              editingUserId ? 'Новый пароль (опционально)' : 'Пароль*'
            }
            value={form.password}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                password: event.target.value,
              }))
            }
          />
          <Select
            value={form.roleId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                roleId: event.target.value,
              }))
            }
          >
            {rolesQuery.data?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>

        {formError ? (
          <p className="mt-2 text-sm text-red-600">{formError}</p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => void handleSubmitForm()}
            disabled={isSubmitting}
          >
            {editingUserId ? 'Сохранить изменения' : 'Создать'}
          </Button>
          {editingUserId ? (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Отмена
            </Button>
          ) : null}
        </div>
      </section>

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

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full min-w-[820px] divide-y divide-gray-200 text-sm">
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
              <tr
                key={user.id}
                className={
                  user.isActive
                    ? undefined
                    : 'bg-rose-50/70 ring-1 ring-inset ring-rose-100'
                }
              >
                <td className="px-3 py-2">{user.fullName}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.role?.name ?? user.roleId}</td>
                <td className="px-3 py-2">
                  {user.isActive ? 'Активен' : 'Неактивен'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => handleStartEdit(user)}
                    >
                      Изменить
                    </Button>
                    {user.isActive ? (
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => setPendingDeactivateId(user.id)}
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
                  </div>
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

      <ConfirmDialog
        isOpen={Boolean(pendingDeactivateId)}
        title="Деактивировать пользователя?"
        description="Пользователь не сможет входить в систему до восстановления."
        confirmText="Деактивировать"
        tone="danger"
        isProcessing={deactivateMutation.isPending}
        onCancel={() => setPendingDeactivateId(null)}
        onConfirm={() => {
          if (!pendingDeactivateId) return;
          deactivateMutation.mutate(pendingDeactivateId);
        }}
      />
    </Card>
  );
}

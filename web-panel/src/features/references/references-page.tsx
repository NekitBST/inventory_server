import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../app/toast-provider';
import { getApiErrorMessage } from '../../lib/api-error';
import { referencesApi, type ReferenceModule } from './api';

type ReferencesPageProps = {
  module: ReferenceModule;
  title: string;
};

export function ReferencesPage({ module, title }: ReferencesPageProps) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const queryKey = useMemo(() => ['reference', module], [module]);

  const referencesQuery = useQuery({
    queryKey,
    queryFn: () => referencesApi.getAll(module),
  });

  const createMutation = useMutation({
    mutationFn: (value: string) =>
      referencesApi.create(module, { name: value }),
    onSuccess: async () => {
      setName('');
      setError('');
      pushToast({ title: 'Запись добавлена', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setError(message);
      pushToast({
        title: 'Ошибка добавления записи',
        description: message,
        tone: 'error',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => referencesApi.remove(module, id),
    onSuccess: async () => {
      setPendingDeleteId(null);
      pushToast({ title: 'Запись удалена', tone: 'warning' });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      pushToast({
        title: 'Ошибка удаления записи',
        description: message,
        tone: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: number; value: string }) =>
      referencesApi.update(module, id, { name: value }),
    onSuccess: async () => {
      setEditingId(null);
      setEditingName('');
      setError('');
      pushToast({ title: 'Запись обновлена', tone: 'info' });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setError(message);
      pushToast({
        title: 'Ошибка обновления записи',
        description: message,
        tone: 'error',
      });
    },
  });

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createMutation.mutateAsync(trimmed);
  };

  const handleStartEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = async () => {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError('Название не может быть пустым');
      return;
    }
    await updateMutation.mutateAsync({ id: editingId, value: trimmed });
  };

  return (
    <Card title={title}>
      <div className="mb-4 flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название"
        />
        <Button
          onClick={() => void handleCreate()}
          disabled={createMutation.isPending}
        >
          Добавить
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {referencesQuery.data?.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-3 py-2"
          >
            {editingId === item.id ? (
              <div className="flex w-full items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <Button
                  className="px-2 py-1 text-xs"
                  onClick={() => void handleUpdate()}
                  disabled={updateMutation.isPending}
                >
                  Сохранить
                </Button>
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  onClick={handleCancelEdit}
                >
                  Отмена
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm text-gray-700">{item.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={() => handleStartEdit(item.id, item.name)}
                  >
                    Изменить
                  </Button>
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => setPendingDeleteId(item.id)}
                    disabled={removeMutation.isPending}
                  >
                    Удалить
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {!referencesQuery.isLoading && !referencesQuery.data?.length ? (
          <div className="px-3 py-3 text-sm text-gray-500">Список пуст</div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Удалить запись справочника?"
        description="Удалённое значение может использоваться в старых сущностях, проверьте связи."
        confirmText="Удалить"
        tone="danger"
        isProcessing={removeMutation.isPending}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId === null) return;
          removeMutation.mutate(pendingDeleteId);
        }}
      />
    </Card>
  );
}

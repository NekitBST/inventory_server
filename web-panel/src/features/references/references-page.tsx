import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { referencesApi, type ReferenceModule } from './api';

type ReferencesPageProps = {
  module: ReferenceModule;
  title: string;
};

export function ReferencesPage({ module, title }: ReferencesPageProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

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
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      setError('Не удалось создать запись');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => referencesApi.remove(module, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createMutation.mutateAsync(trimmed);
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
            <span className="text-sm text-gray-700">{item.name}</span>
            <Button
              variant="danger"
              className="px-2 py-1 text-xs"
              onClick={() => removeMutation.mutate(item.id)}
              disabled={removeMutation.isPending}
            >
              Удалить
            </Button>
          </div>
        ))}

        {!referencesQuery.isLoading && !referencesQuery.data?.length ? (
          <div className="px-3 py-3 text-sm text-gray-500">Список пуст</div>
        ) : null}
      </div>
    </Card>
  );
}

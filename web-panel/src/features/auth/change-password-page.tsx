import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from './api';
import { useToast } from '../../app/toast-provider';
import { getApiErrorMessage } from '../../lib/api-error';

const schema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Текущий пароль должен быть не менее 8 символов'),
    newPassword: z
      .string()
      .min(8, 'Новый пароль должен быть не менее 8 символов'),
    confirmPassword: z.string().min(8, 'Подтвердите новый пароль'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

type ChangePasswordForm = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const { pushToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      pushToast({ title: 'Пароль успешно изменён', tone: 'success' });
    } catch (error) {
      const message = getApiErrorMessage(error);
      pushToast({
        title: 'Не удалось изменить пароль',
        description: message,
        tone: 'error',
      });
    }
  });

  return (
    <Card title="Смена пароля">
      <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm text-gray-700">
            Текущий пароль
          </label>
          <Input type="password" {...register('currentPassword')} />
          {errors.currentPassword ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.currentPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">
            Новый пароль
          </label>
          <Input type="password" {...register('newPassword')} />
          {errors.newPassword ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">
            Подтверждение пароля
          </label>
          <Input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохраняем...' : 'Изменить пароль'}
        </Button>
      </form>
    </Card>
  );
}

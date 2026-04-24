import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from './useAuth';

const schema = z.object({
  email: z.email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type LoginFormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setErrorMessage('');
      await login(values);
      navigate('/', { replace: true });
    } catch {
      setErrorMessage('Не удалось войти. Проверьте email и пароль.');
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Вход</h1>
        <p className="mb-6 text-sm text-gray-500">Inventory Web Panel</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Email</label>
            <Input placeholder="admin@example.com" {...register('email')} />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Пароль</label>
            <Input
              type="password"
              placeholder="********"
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Входим...' : 'Войти'}
          </Button>
        </form>
      </section>
    </main>
  );
}

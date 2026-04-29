import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10 text-gray-900">
      <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            Inventory Panel
          </p>
          <p className="text-sm text-gray-500">404 Not Found</p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
              Страница не найдена
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
              Неверный адрес
            </h1>
            <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Такой страницы нет или она была удалена
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/equipment"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Перейти к оборудованию
            </Link>
            <Link
              to="/inventories"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Перейти к инвентаризациям
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

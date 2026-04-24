import { NavLink, Outlet } from 'react-router-dom';
import type { RoleName } from '../../types/common';
import { useAuth } from '../../features/auth/useAuth';
import { Button } from '../../components/ui/Button';

type NavItem = {
  to: string;
  label: string;
  roles: RoleName[];
};

const navItems: NavItem[] = [
  { to: '/', label: 'Главная', roles: ['ADMIN', 'USER'] },
  { to: '/equipment', label: 'Оборудование', roles: ['ADMIN', 'USER'] },
  { to: '/inventories', label: 'Инвентаризации', roles: ['ADMIN', 'USER'] },
  { to: '/locations', label: 'Локации', roles: ['ADMIN', 'USER'] },
  {
    to: '/equipment-statuses',
    label: 'Статусы оборудования',
    roles: ['ADMIN', 'USER'],
  },
  {
    to: '/equipment-types',
    label: 'Типы оборудования',
    roles: ['ADMIN', 'USER'],
  },
  { to: '/users', label: 'Пользователи', roles: ['ADMIN'] },
];

export function AppLayout() {
  const { user, logout, logoutAll } = useAuth();
  const role = user?.role?.name ?? 'USER';

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 gap-4 p-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="mb-1 text-lg font-semibold text-gray-900">
            Inventory Panel
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            {user?.fullName} ({role})
          </p>

          <nav className="mb-6 flex flex-col gap-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => void logoutAll()}>
              Выйти на всех устройствах
            </Button>
            <Button variant="danger" onClick={() => void logout()}>
              Выйти
            </Button>
          </div>
        </aside>

        <main className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import type { RoleName } from '../../types/common';
import { useAuth } from '../../features/auth/useAuth';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../toast-provider';

type NavItem = {
  to: string;
  label: string;
  roles: RoleName[];
};

const navItems: NavItem[] = [
  { to: '/', label: 'Главная', roles: ['ADMIN', 'USER'] },
  { to: '/change-password', label: 'Смена пароля', roles: ['ADMIN', 'USER'] },
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
  const { pushToast } = useToast();
  const [confirmMode, setConfirmMode] = useState<
    'logout' | 'logout-all' | null
  >(null);
  const role = user?.role?.name ?? 'USER';
  const roleLabel = role === 'ADMIN' ? 'Администратор' : 'Пользователь';

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    try {
      await logout();
      pushToast({ title: 'Сессия завершена', tone: 'info' });
    } finally {
      setConfirmMode(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      pushToast({
        title: 'Выход выполнен на всех устройствах',
        tone: 'warning',
      });
    } finally {
      setConfirmMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="mb-1 text-lg font-semibold text-gray-900">
            Inventory Panel
          </h1>
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-gray-700">
              {user?.fullName}
            </p>
            <span className="inline-flex shrink-0 rounded-full border border-[rgba(92,155,224,0.32)] bg-[rgba(150,199,248,0.26)] px-2.5 py-1 text-xs font-medium text-[#2f5f96]">
              {roleLabel}
            </span>
          </div>

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
            <Button
              variant="secondary"
              onClick={() => setConfirmMode('logout-all')}
            >
              Выйти на всех устройствах
            </Button>
            <Button variant="danger" onClick={() => setConfirmMode('logout')}>
              Выйти
            </Button>
          </div>
        </aside>

        <main className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        isOpen={confirmMode === 'logout'}
        title="Выйти из аккаунта?"
        description="Текущая сессия будет завершена на этом устройстве."
        confirmText="Выйти"
        tone="danger"
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => void handleLogout()}
      />

      <ConfirmDialog
        isOpen={confirmMode === 'logout-all'}
        title="Выйти на всех устройствах?"
        description="Все активные сессии будут завершены."
        confirmText="Выйти везде"
        tone="danger"
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => void handleLogoutAll()}
      />
    </div>
  );
}

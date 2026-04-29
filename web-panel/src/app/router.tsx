import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/app-layout';
import { ProtectedRoute } from './routes/protected-route';
import { LoginPage } from '../features/auth/login-page';
import { ChangePasswordPage } from '../features/auth/change-password-page';
import { EquipmentPage } from '../features/equipment/equipment-page';
import { UsersPage } from '../features/users/users-page';
import { InventoriesPage } from '../features/inventories/inventories-page';
import { ReferencesPage } from '../features/references/references-page';
import { ReportsPage } from '../features/reports/reports-page';
import { LabelGeneratorPage } from '../features/label-generator';
import { NotFoundPage } from '../features/not-found/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/equipment" replace /> },
          { path: '/change-password', element: <ChangePasswordPage /> },
          { path: '/equipment', element: <EquipmentPage /> },
          { path: '/inventories', element: <InventoriesPage /> },
          {
            path: '/locations',
            element: <ReferencesPage module="locations" title="Локации" />,
          },
          {
            path: '/equipment-statuses',
            element: (
              <ReferencesPage
                module="equipment-statuses"
                title="Статусы оборудования"
              />
            ),
          },
          {
            path: '/equipment-types',
            element: (
              <ReferencesPage
                module="equipment-types"
                title="Типы оборудования"
              />
            ),
          },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/label-generator', element: <LabelGeneratorPage /> },
          {
            element: <ProtectedRoute allowRoles={['ADMIN']} />,
            children: [{ path: '/users', element: <UsersPage /> }],
          },
        ],
      },
    ],
  },
]);

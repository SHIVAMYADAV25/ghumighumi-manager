import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import useAuthStore from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { PageLoader } from '../ui/Skeleton';
import { useEffect, useState } from 'react';
import { notificationsApi } from '../../api/trips';
import useNotificationStore from '../../store/notificationStore';

export function AppLayout() {
  const { user, accessToken } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  useSocket();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!accessToken) { setReady(true); return; }
    notificationsApi.getAll({ limit: 20 })
      .then(({ data }) => setNotifications(data.data, data.unreadCount))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [accessToken]);

  if (!ready) return <PageLoader />;
  if (!user || !accessToken) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

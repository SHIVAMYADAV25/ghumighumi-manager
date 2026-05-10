import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { notificationsApi } from '../api/trips';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { formatRelative } from '../utils';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useNotificationStore from '../store/notificationStore';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { markAllRead } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 50 }).then(r => r.data),
  });

  const markReadMut = useMutation({
    mutationFn: (ids) => notificationsApi.markRead(ids),
    onSuccess: () => { qc.invalidateQueries(['notifications']); markAllRead(); },
  });

  const clearMut = useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => { qc.invalidateQueries(['notifications']); toast.success('Cleared read notifications'); },
  });

  const notifications = data?.data || [];
  const unread = notifications.filter(n => !n.isRead);

  const handleClick = (notif) => {
    if (!notif.isRead) markReadMut.mutate([notif._id]);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="max-w-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Notifications</h1>
          {unread.length > 0 && <p className="text-sand-500 text-sm mt-1">{unread.length} unread</p>}
        </div>
        <div className="flex gap-2">
          {unread.length > 0 && (
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={() => markReadMut.mutate([])}>
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => clearMut.mutate()}>Clear read</Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up!" description="No notifications yet. Invite someone to a trip to get started." />
      ) : (
        <div className="space-y-1">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleClick(notif)}
              className={clsx(
                'flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border',
                notif.isRead
                  ? 'bg-transparent border-transparent hover:bg-white/3'
                  : 'bg-amber/5 border-amber/10 hover:bg-amber/8'
              )}
            >
              <div className="relative flex-shrink-0">
                <Avatar user={notif.sender} size="sm" />
                {!notif.isRead && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber border-2 border-ink-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm', notif.isRead ? 'text-sand-400' : 'text-sand-100 font-medium')}>{notif.title}</p>
                <p className="text-xs text-sand-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-sand-600 mt-1">{formatRelative(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <button
                  onClick={e => { e.stopPropagation(); markReadMut.mutate([notif._id]); }}
                  className="btn-ghost p-1.5 rounded-lg flex-shrink-0" title="Mark read"
                >
                  <Check size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Bell, Archive, User, LogOut, Compass, Plus } from 'lucide-react';
import clsx from 'clsx';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { to: '/trips', icon: Map, label: 'My Trips' },
  { to: '/archive', icon: Archive, label: 'Archive' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-ink-800 border-r border-white/6 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center">
            <Compass size={18} className="text-ink-900" />
          </div>
          <span className="font-display text-xl font-semibold text-sand-100">WanderSync</span>
        </div>
      </div>

      {/* New Trip */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/trips/new')}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
        >
          <Plus size={16} />
          New Trip
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(isActive ? 'nav-link-active' : 'nav-link')}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/notifications"
          className={({ isActive }) => clsx(isActive ? 'nav-link-active' : 'nav-link', 'justify-between')}
        >
          <span className="flex items-center gap-2.5">
            <Bell size={18} />
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-amber text-ink-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/6">
        <div className="flex items-center gap-3 px-2">
          <Avatar user={user} size="sm" onClick={() => navigate('/profile')} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sand-100 truncate">{user?.name}</p>
            <p className="text-xs text-sand-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost p-1.5 rounded-lg" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

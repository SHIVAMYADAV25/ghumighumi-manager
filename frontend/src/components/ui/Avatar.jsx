import clsx from 'clsx';
import { initials } from '../../utils';

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };

export function Avatar({ user, size = 'md', className, onClick }) {
  const s = sizes[size] || sizes.md;
  if (user?.avatar?.url) {
    return (
      <img
        src={user.avatar.url}
        alt={user.name}
        onClick={onClick}
        className={clsx('rounded-full object-cover ring-2 ring-white/10 flex-shrink-0', s, onClick && 'cursor-pointer', className)}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      className={clsx('rounded-full bg-amber/20 text-amber font-semibold flex items-center justify-center flex-shrink-0 ring-2 ring-white/10', s, onClick && 'cursor-pointer', className)}
    >
      {initials(user?.name)}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 4, size = 'sm' }) {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={u._id || i} user={u} size={size} className="ring-2 ring-ink-700" />
      ))}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full bg-ink-600 text-sand-400 text-xs font-medium flex items-center justify-center ring-2 ring-ink-700">
          +{extra}
        </div>
      )}
    </div>
  );
}

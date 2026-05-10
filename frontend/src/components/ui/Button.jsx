import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: '',
  lg: 'text-base px-6 py-3 rounded-xl',
};

export function Button({ children, variant = 'primary', size = 'md', loading, icon: Icon, className, ...props }) {
  return (
    <button
      className={clsx(variants[variant], sizes[size], 'inline-flex items-center gap-2', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

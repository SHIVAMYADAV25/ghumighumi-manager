import clsx from 'clsx';

export function Input({ label, error, icon: Icon, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500 pointer-events-none" />}
        <input
          className={clsx('input', Icon && 'pl-9', error && 'border-terracotta/60 focus:border-terracotta focus:ring-terracotta/15', className)}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-terracotta mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        className={clsx('input resize-none', error && 'border-terracotta/60', className)}
        {...props}
      />
      {error && <p className="text-xs text-terracotta mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        className={clsx('input', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-terracotta mt-1">{error}</p>}
    </div>
  );
}

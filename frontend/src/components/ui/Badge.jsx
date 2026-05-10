import clsx from 'clsx';

const variants = {
  amber: 'bg-amber/15 text-amber border-amber/20',
  sage: 'bg-sage/15 text-sage border-sage/20',
  terracotta: 'bg-terracotta/15 text-terracotta border-terracotta/20',
  sand: 'bg-sand-500/15 text-sand-400 border-sand-500/20',
  ink: 'bg-ink-600 text-sand-400 border-white/8',
};

export function Badge({ children, variant = 'ink', className }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}

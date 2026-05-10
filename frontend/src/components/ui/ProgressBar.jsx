import clsx from 'clsx';

export function ProgressBar({ value = 0, max = 100, color = 'amber', label, showValue }) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const colors = {
    amber: 'bg-amber',
    sage: 'bg-sage',
    terracotta: 'bg-terracotta',
    sand: 'bg-sand-400',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-sand-400">{label}</span>}
          {showValue && <span className="text-xs font-medium text-sand-300">{pct}%</span>}
        </div>
      )}

      <div className="h-1.5 bg-ink-600 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700',
            colors[color]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
import clsx from 'clsx';

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-ink-800 rounded-xl border border-white/6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            active === tab.id
              ? 'bg-amber text-ink-900 shadow-amber'
              : 'text-sand-400 hover:text-sand-200 hover:bg-white/5'
          )}
        >
          {tab.icon && <tab.icon size={15} />}

          {tab.label}

          {tab.count !== undefined && (
            <span
              className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full',
                active === tab.id
                  ? 'bg-ink-900/30'
                  : 'bg-ink-600'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

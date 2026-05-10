export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-ink-600 flex items-center justify-center mb-4">
          <Icon size={28} className="text-sand-500" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-sand-200 mb-2">{title}</h3>
      {description && <p className="text-sand-500 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

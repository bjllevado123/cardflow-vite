export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        <h2 className="md:hidden font-display text-2xl font-semibold tracking-[-0.03em] text-on-background">{title}</h2>
        {description ? (
          <p className="text-on-surface-variant mt-1.5 text-sm md:text-[0.95rem] max-w-xl leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-3xl px-6 py-14 flex flex-col items-center text-center border border-outline-variant/40">
      <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="text-sm text-on-surface-variant mt-2 max-w-sm leading-relaxed">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

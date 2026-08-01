import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {/* Auf schmalen Bildschirmen rückt die Aktion in eine eigene volle Zeile,
          statt die Überschrift zu quetschen. */}
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

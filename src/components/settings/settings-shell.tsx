import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { findSettingsSection } from "@/lib/settings-navigation";

/** Rahmen für eine Einstellungs-Unterseite: Rücksprung, Titel, Beschreibung. */
export function SettingsShell({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const section = findSettingsSection(href);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/einstellungen"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Einstellungen
      </Link>

      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {section?.label}
        </h1>
        {section?.description ? (
          <p className="text-sm text-muted-foreground">{section.description}</p>
        ) : null}
      </div>

      <div className="animate-rise space-y-4">{children}</div>
    </div>
  );
}

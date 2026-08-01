import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      {/* Sehr dezenter blauer Lichtschein hinter der Karte — erzeugt Tiefe,
          ohne den Inhalt zu stören. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.07]"
      />

      <Link
        href="/"
        className="animate-fade text-lg transition-opacity hover:opacity-80"
      >
        <Logo id="auth" markClassName="size-9" />
      </Link>

      <Card className="card-elevated w-full max-w-md animate-rise shadow-[var(--shadow-soft-md)]">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {footer ? <p className="text-sm text-muted-foreground">{footer}</p> : null}
    </div>
  );
}

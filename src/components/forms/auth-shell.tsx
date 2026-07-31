import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
          F
        </span>
        FinanceDash
      </Link>

      <Card className="w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {footer ? (
        <p className="text-sm text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  );
}

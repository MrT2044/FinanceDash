import Link from "next/link";
import { Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title = "Noch keine Daten vorhanden",
  description = "Lade den Umsatzexport deiner Bank hoch, um deine Auswertungen zu sehen.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="animate-fade border-dashed border-border/70 ring-0">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Upload className="size-5" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        <Link href="/import" className={buttonVariants()}>
          CSV importieren
        </Link>
      </CardContent>
    </Card>
  );
}

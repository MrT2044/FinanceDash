import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="text-lg" markClassName="size-9" id="nf" />

      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-5" />
      </span>

      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Diese Seite gibt es nicht</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Der Link ist entweder veraltet oder enthält einen Tippfehler.
        </p>
      </div>

      <Link href="/dashboard" className={buttonVariants()}>
        Zur Übersicht
      </Link>
    </div>
  );
}

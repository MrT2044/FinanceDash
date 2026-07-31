import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/actions/auth.actions";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ email, displayName }: { email: string; displayName: string | null }) {
  const initials = (displayName ?? email).slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          F
        </span>
        <span className="text-sm font-semibold tracking-tight">FinanceDash</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Konto-Menü" />}
          >
            <span className="grid size-7 place-items-center rounded-full bg-muted text-[11px] font-semibold">
              {initials}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate font-normal">
              <span className="block text-sm font-medium">{displayName ?? "Dein Konto"}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/einstellungen" />}>
              <Settings className="size-4" />
              Einstellungen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              closeOnClick={false}
              render={
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-1.5">
                    <LogOut className="size-4" />
                    Abmelden
                  </button>
                </form>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Logo, LogoMark } from "@/components/brand/logo";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton, LogoutLabel, useLogout } from "./logout-button";

export function Topbar({
  email,
  displayName,
}: {
  email: string;
  displayName: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout, isPending } = useLogout();
  const initials = (displayName?.trim() || email).slice(0, 2).toUpperCase();

  return (
    <header
      className={cn(
        // min-h statt h: mit viewport-fit=cover kommt oben der Abstand für die
        // Statusleiste dazu, der den Inhalt sonst zusammenstauchen würde.
        "sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border/60",
        "bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/65 md:px-6",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <LogoMark className="size-7" id="topbar" />
        <span className="text-sm font-semibold tracking-tight">FinanceDash</span>
      </Link>

      <div className="hidden md:block" />

      <div className="flex items-center gap-1">
        <ThemeToggle />

        {/*
          Auf dem Smartphone öffnet der Menü-Button ein Blatt von der Seite:
          es liefert die volle Navigation und ist mit dem Daumen sicher
          bedienbar — anders als ein schmales Aufklappmenü am Bildschirmrand.
        */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menü öffnen"
          className="md:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" aria-label="Konto-Menü" />}
            >
              <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {initials}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-sm font-medium text-foreground">
                  {displayName?.trim() || "Dein Konto"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/einstellungen" />}>
                <Settings className="size-4" />
                Einstellungen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Der Menüeintrag ist selbst der Button — ein zusätzlicher
                  Button darin wäre ungültiges Markup. */}
              <DropdownMenuItem
                variant="destructive"
                closeOnClick={false}
                disabled={isPending}
                onClick={logout}
              >
                <LogoutLabel isPending={isPending} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-[min(20rem,85vw)] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle>
              <Logo id="sheet" markClassName="size-7" />
            </SheetTitle>
            <SheetDescription className="truncate">
              {displayName?.trim() ? `${displayName} · ${email}` : email}
            </SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-3">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors active:scale-[0.99]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border/60 p-3">
            <div className="flex items-center gap-2.5 px-1 pb-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {displayName?.trim() || "Dein Konto"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </span>
            </div>
            <LogoutButton className="min-h-11 rounded-xl px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10" />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

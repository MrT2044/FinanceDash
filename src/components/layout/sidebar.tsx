"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-sidebar md:flex md:flex-col">
      <Link
        href="/dashboard"
        className="flex h-16 items-center px-5 text-base transition-opacity hover:opacity-80"
      >
        <Logo id="sidebar" markClassName="size-8" />
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-[background-color,color,transform] duration-200 active:scale-[0.99]",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {/* Aktiver Balken links — ruhiger als eine zweite Flächenfarbe. */}
              <span
                className={cn(
                  "absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "size-4 transition-transform duration-200",
                  !active && "group-hover:scale-110",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="px-5 py-4 text-[11px] text-muted-foreground">
        Deine Daten bleiben in deinem Konto.
      </p>
    </aside>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { LogoutButton } from "@/components/layout/logout-button";
import { settingsSections } from "@/lib/settings-navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Einstellungen — FinanceDash" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        title="Einstellungen"
        description={
          profile?.display_name?.trim()
            ? `${profile.display_name} · ${user?.email ?? ""}`
            : (user?.email ?? "Konto, Daten und Sicherheit.")
        }
      />

      <nav className="animate-rise space-y-2">
        {settingsSections.map(({ href, label, description, icon: Icon, ...rest }) => {
          const destructive = "tone" in rest && rest.tone === "destructive";

          return (
            <Link key={href} href={href} className="block">
              <Card
                className="card-elevated flex-row items-center gap-3 px-4 py-3.5"
                size="sm"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    destructive
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          );
        })}
      </nav>

      {/* Abmelden bewusst ganz unten und abgesetzt. */}
      <div className="mt-8 border-t border-border/60 pt-5">
        <LogoutButton className="min-h-11 w-auto items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted" />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export const metadata: Metadata = { title: "Konto — FinanceDash" };

export default function AccountSettingsPage() {
  return (
    <SettingsShell href="/einstellungen/konto">
      <Card className="card-elevated border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Konto endgültig löschen
          </CardTitle>
          <CardDescription>
            Alle Konten, Buchungen, Kategorien und Auswertungen werden unwiderruflich
            entfernt. Dieser Schritt lässt sich nicht rückgängig machen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Möchtest du nur die importierten Umsätze loswerden und das Konto behalten,
            nutze stattdessen{" "}
            <Link
              href="/einstellungen/csv"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              die CSV-Verwaltung
            </Link>
            . Ein Export deiner Daten ist unter{" "}
            <Link
              href="/einstellungen/daten"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Meine Daten
            </Link>{" "}
            möglich — danach ist er nicht mehr abrufbar.
          </p>

          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </SettingsShell>
  );
}

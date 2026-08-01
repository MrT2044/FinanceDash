"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NO_HASH = "";
/** Der Hash ändert sich nach dem Laden nicht mehr — nichts zu abonnieren. */
const subscribe = () => () => {};
const getClientHash = () => window.location.hash;
const getServerHash = () => NO_HASH;

/**
 * Rettet Bestätigungslinks, deren Session im URL-Fragment steht.
 *
 * Supabase liefert je nach Vorlage und Kontoeinstellung entweder
 * `?code=`/`?token_hash=` (serverseitig auswertbar) oder `#access_token=…`.
 * Das Fragment schickt der Browser niemals an den Server — der Callback lief
 * deshalb ins Leere und der Nutzer landete auf einer leeren Seite. Hier wird
 * das Fragment ausgelesen, die Session gesetzt und weitergeleitet.
 *
 * `useSyncExternalStore` liefert beim Server-Rendern bewusst einen leeren Hash
 * und erst im Browser den echten Wert; so entsteht kein Hydration-Konflikt.
 */
export function FragmentSessionRecovery() {
  const router = useRouter();
  const hash = useSyncExternalStore(subscribe, getClientHash, getServerHash);
  const [failed, setFailed] = useState(false);

  const tokens = useMemo(() => {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken, type: params.get("type") };
  }, [hash]);

  useEffect(() => {
    if (!tokens) return;

    let cancelled = false;

    void createClient()
      .auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
      .then(({ error }) => {
        if (cancelled) return;

        if (error) {
          setFailed(true);
          return;
        }

        // Fragment entfernen, damit die Tokens nicht im Verlauf zurückbleiben.
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(
          tokens.type === "recovery" ? "/passwort-aendern" : "/dashboard",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [tokens, router]);

  if (!tokens || failed) return null;

  return (
    <p className="mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Link wird geprüft — einen Moment bitte …
    </p>
  );
}

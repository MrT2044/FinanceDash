"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";
import { cn } from "@/lib/utils";

/**
 * Abmelden.
 *
 * Zuvor steckte ein `<form action={logoutAction}>` als `render`-Element in einem
 * Menüeintrag. Aktivierbar ist bei Base UI aber das gerenderte Element selbst —
 * also das Formular, und ein `<form>` reagiert nicht auf einen Klick. Abgeschickt
 * wurde dadurch nie. Hier ruft ein echter Klick-Handler die Server-Action auf.
 */
export function useLogout() {
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return { logout, isPending };
}

/** Inhalt eines Abmelde-Bedienelements: Symbol plus Beschriftung. */
export function LogoutLabel({ isPending }: { isPending: boolean }) {
  return (
    <>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {isPending ? "Wird abgemeldet …" : "Abmelden"}
    </>
  );
}

/**
 * Eigenständige Schaltfläche. Für Menüeinträge stattdessen `useLogout` mit
 * `LogoutLabel` verwenden — sonst entstünde ein Button innerhalb eines Buttons.
 */
export function LogoutButton({ className }: { className?: string }) {
  const { logout, isPending } = useLogout();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={logout}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 text-left transition-colors disabled:opacity-60",
        className,
      )}
    >
      <LogoutLabel isPending={isPending} />
    </button>
  );
}

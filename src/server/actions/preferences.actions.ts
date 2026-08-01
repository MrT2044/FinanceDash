"use server";

import { cookies } from "next/headers";
import { isMonthKey, MONTH_COOKIE } from "@/lib/analytics/month";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Speichert den gewählten Monat, damit ihn alle Bereiche übernehmen.
 * Enthält keine personenbezogenen Daten, deshalb kein httpOnly nötig — bleibt
 * aber serverseitig gesetzt, damit die Auswahl schon beim ersten Rendern steht.
 */
export async function setSelectedMonthAction(monthKey: string): Promise<void> {
  if (!isMonthKey(monthKey)) return;

  (await cookies()).set(MONTH_COOKIE, monthKey, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

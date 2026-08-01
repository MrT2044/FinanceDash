import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Pfade, die ohne Session erreichbar sind. Alles andere erfordert Login. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/passwort-aendern",
  "/auth",
  "/datenschutz",
  "/impressum",
];

const AUTH_PATHS = ["/login", "/register", "/reset-password"];

/** Nach dieser Zeit ohne Seitenaufruf wird die Sitzung beendet. */
const IDLE_TIMEOUT_MS =
  Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? 30) * 60_000;
const LAST_SEEN_COOKIE = "fd-last-seen";
const LAST_SEEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // WICHTIG: getUser() nicht entfernen — erneuert den Auth-Token bei jedem Request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Automatische Abmeldung nach Inaktivität. Der Zeitstempel liegt in einem
  // eigenen Cookie und wird bei jedem Request erneuert. Die Prüfung läuft
  // serverseitig, damit sie sich nicht über den Browser aushebeln lässt.
  if (user) {
    const lastSeenRaw = request.cookies.get(LAST_SEEN_COOKIE)?.value;
    const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null;
    const now = Date.now();

    if (lastSeen && Number.isFinite(lastSeen) && now - lastSeen > IDLE_TIMEOUT_MS) {
      // signOut() schreibt die geleerten Auth-Cookies in `supabaseResponse`.
      await supabase.auth.signOut();

      const timeoutUrl = new URL("/login", request.url);
      timeoutUrl.searchParams.set("grund", "inaktiv");
      const response = NextResponse.redirect(timeoutUrl);

      // Diese Cookies müssen mit umziehen, sonst bleibt die Session bestehen:
      // Die Weiterleitung ginge dann auf /login, von dort sofort zurück aufs
      // Dashboard (Nutzer gilt als angemeldet), dort erneut in den Timeout —
      // eine Endlosschleife, aus der man sich nicht mehr anmelden konnte.
      for (const cookie of supabaseResponse.cookies.getAll()) {
        response.cookies.set(cookie);
      }

      // Ohne explizites `path` löscht Next.js nur für den aktuellen Pfad; der
      // unter "/" gesetzte Zeitstempel überlebte und löste sofort den nächsten
      // Timeout aus.
      response.cookies.set(LAST_SEEN_COOKIE, "", { path: "/", maxAge: 0 });

      return response;
    }

    supabaseResponse.cookies.set(LAST_SEEN_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // Bewusst deutlich laenger als das Inaktivitaetsfenster: liefe der Cookie
      // zeitgleich mit dem Timeout ab, waere der Zeitstempel beim Pruefen schon
      // weg und die Abmeldung wuerde nie ausgeloest. Der Cookie enthaelt nur
      // einen Zeitstempel, kein Geheimnis.
      maxAge: LAST_SEEN_COOKIE_MAX_AGE_SECONDS,
    });
  }

  if (!user && !matchesPath(pathname, PUBLIC_PATHS)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && matchesPath(pathname, AUTH_PATHS)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

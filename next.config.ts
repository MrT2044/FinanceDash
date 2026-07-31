import type { NextConfig } from "next";

/**
 * Sicherheits-Header für alle Antworten.
 *
 * Bewusst ohne Content-Security-Policy: Next.js lädt Inline-Skripte für die
 * Hydration, eine CSP bräuchte darum Nonces über die gesamte Anwendung. Das
 * wäre eine eigene Baustelle und würde bei fehlerhafter Konfiguration die App
 * lahmlegen. Die übrigen Header greifen sofort und ohne Risiko.
 */
const securityHeaders = [
  // Erzwingt HTTPS für ein Jahr, inklusive Subdomains.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Verhindert, dass die App in fremde Seiten eingebettet wird (Clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Unterbindet MIME-Type-Sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Gibt beim Verlassen der Seite keine Pfade preis, nur die Herkunft.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Die App braucht keine Geräteberechtigungen.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Verhindert, dass Browser die Seite über Suchmaschinen indexieren.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

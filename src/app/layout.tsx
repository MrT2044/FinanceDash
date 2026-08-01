import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinanceDash — Deine Finanzen im Überblick",
  description:
    "Persönliches Finanzdashboard: Einnahmen, Ausgaben, Budgets und Sparpotenziale auf einen Blick.",
  applicationName: "FinanceDash",
  appleWebApp: { capable: true, title: "FinanceDash", statusBarStyle: "default" },
};

/**
 * `viewportFit: "cover"` legt den Inhalt unter die Systemleisten; die Abstände
 * holen sich Topbar und Bottom-Navigation über `env(safe-area-inset-*)` zurück.
 *
 * Pinch-Zoom bleibt bewusst erlaubt (`maximumScale` ungesetzt) — das Sperren
 * verletzt WCAG 1.4.4. Das ungewollte Zoomen auf iOS entsteht nicht durch die
 * Geste, sondern durch Eingabefelder unter 16px Schriftgröße; das ist in
 * `globals.css` unterbunden.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

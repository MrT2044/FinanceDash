import {
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  Lightbulb,
  ListOrdered,
  PieChart,
  Settings,
  Upload,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/ausgaben", label: "Ausgaben", icon: ArrowDownCircle },
  { href: "/einnahmen", label: "Einnahmen", icon: ArrowUpCircle },
  { href: "/kategorien", label: "Kategorien", icon: PieChart },
  { href: "/transaktionen", label: "Transaktionen", icon: ListOrdered },
  { href: "/empfehlungen", label: "Empfehlungen", icon: Lightbulb },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
] as const;

/** Verkürzte Auswahl für die mobile Bottom-Navigation. */
export const mobileNavItems = navItems.filter((item) =>
  ["/dashboard", "/ausgaben", "/kategorien", "/transaktionen", "/import"].includes(
    item.href,
  ),
);

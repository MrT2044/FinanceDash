import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zweite Prüfung neben der Middleware: Layout-Rendering darf niemals
  // ohne gültige Session passieren, auch wenn die Middleware umgangen würde.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email ?? ""} displayName={profile?.display_name ?? null} />
        {/*
          Der untere Abstand hält den Inhalt über der Bottom-Navigation und der
          Home-Anzeige des Geräts frei — sonst verdeckt sie die letzte Zeile.
        */}
        <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 pt-6 pb-24 md:px-6 md:py-8 md:pb-10">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

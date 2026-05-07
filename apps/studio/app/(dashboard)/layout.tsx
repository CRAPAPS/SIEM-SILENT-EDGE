import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocBar } from "@/components/chrome/SocBar";
import { SideNav } from "@/components/chrome/SideNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, organization_id, organizations(name)")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "client") as "admin" | "analyst" | "client";
  const orgName =
    role === "admin"
      ? "GOD VIEW"
      : (profile?.organizations as { name: string } | null)?.name ?? undefined;

  return (
    <>
      <SocBar orgName={orgName} isAdmin={role === "admin"} />
      <SideNav role={role} userEmail={user.email} />
      <main className="app-main">{children}</main>
    </>
  );
}

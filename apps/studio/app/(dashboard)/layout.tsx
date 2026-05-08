import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocBar } from "@/components/chrome/SocBar";
import { SideNav } from "@/components/chrome/SideNav";
import { FingerprintCapture } from "@/components/chrome/FingerprintCapture";

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
    .select("role, display_name, organization_id")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "client") as "admin" | "analyst" | "client";

  let orgName: string | undefined;
  if (role === "admin") {
    orgName = "GOD VIEW";
  } else if (profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();
    orgName = org?.name ?? undefined;
  }

  return (
    <>
      <FingerprintCapture />
      <SocBar orgName={orgName} isAdmin={role === "admin"} />
      <SideNav role={role} userEmail={user.email} />
      <main className="app-main">{children}</main>
    </>
  );
}

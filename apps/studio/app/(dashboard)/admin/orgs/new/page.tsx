import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewOrgForm } from "@/components/admin/NewOrgForm";

export default async function NewOrgPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").single();
  if (!["super_admin","admin"].includes(profile?.role ?? "")) redirect("/dashboard");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 600 }}>
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          NEW ORGANIZATION
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          ONBOARD A NEW CLIENT
        </p>
      </div>
      <NewOrgForm />
    </div>
  );
}

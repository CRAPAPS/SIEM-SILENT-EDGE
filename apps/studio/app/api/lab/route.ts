import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile } = await db.from("profiles").select("role").single() as
    { data: { role: string } | null };

  if (!profile || profile.role === "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseUrl = process.env.LAB_GATEWAY_URL;
  const secret = process.env.LAB_GATEWAY_SECRET;

  if (!baseUrl || !secret) {
    return NextResponse.json({ units: [], configured: false });
  }

  try {
    const res = await fetch(`${baseUrl}/status`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`Gateway ${res.status}`);
    const units = await res.json();
    return NextResponse.json({ units, configured: true });
  } catch (err) {
    return NextResponse.json({ units: [], configured: true, error: String(err) });
  }
}

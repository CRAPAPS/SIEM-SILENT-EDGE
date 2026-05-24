import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cveId = searchParams.get("cveId");
  const keyword = searchParams.get("keyword");
  const limit = searchParams.get("limit") ?? "20";

  const params = new URLSearchParams({ resultsPerPage: limit });
  if (cveId) {
    params.set("cveId", cveId.toUpperCase());
  } else if (keyword) {
    params.set("keywordSearch", keyword);
    params.set("keywordExactMatch", "");
  } else {
    return NextResponse.json({ error: "cveId or keyword required" }, { status: 400 });
  }

  const headers: Record<string, string> = { "User-Agent": "SilentEdge/1.0" };
  const apiKey = process.env.NVD_API_KEY;
  if (apiKey) headers["apiKey"] = apiKey;

  try {
    const res = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`,
      { headers, next: { revalidate: 300 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `NVD returned ${res.status}` }, { status: 502 });
    }
    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

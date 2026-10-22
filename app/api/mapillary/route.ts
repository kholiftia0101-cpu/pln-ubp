import { NextRequest, NextResponse } from "next/server";

// Ganti nilai ini dengan Access Token Mapillary milik aplikasi kamu.
// Jika repository GitHub bersifat publik, token yang ditulis di sini dapat terlihat.
const MAPILLARY_ACCESS_TOKEN = "MLY|28847328674948612|882e904f5c47fbf58c53ec0679401f02";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Math.max(Number(searchParams.get("radius") || 50), 10), 50);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Koordinat lat/lng tidak valid." }, { status: 400 });
  }
  
  const url = new URL("https://graph.mapillary.com/images");
  url.searchParams.set("access_token", MAPILLARY_ACCESS_TOKEN);
  url.searchParams.set("fields", "id,thumb_1024_url,computed_geometry,captured_at");
  url.searchParams.set("closeto", `${lng},${lat}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("limit", "10");

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    const body = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: body?.error?.message || "Mapillary gagal mengambil foto." }, { status: response.status });
    }
    return NextResponse.json({ data: body.data || [] }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "Tidak dapat terhubung ke Mapillary." }, { status: 502 });
  }
}

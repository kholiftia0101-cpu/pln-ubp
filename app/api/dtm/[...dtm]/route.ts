import { NextResponse } from "next/server";

export const runtime = "nodejs";

const R2_DTM_BASE =
  "https://pub-b1a30761571c4deda99b775a859ed84c.r2.dev/dtm";

type RouteContext = {
  params: Promise<{ dtm: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { dtm } = await context.params;

  if (!Array.isArray(dtm) || dtm.length !== 3) {
    return NextResponse.json(
      { error: "Path tile DTM harus berformat z/x/y.png." },
      { status: 400 },
    );
  }

  const [z, x, y] = dtm;
  const zoom = Number(z);

  if (
    !Number.isInteger(zoom) ||
    zoom < 14 ||
    zoom > 20 ||
    !/^\d+$/.test(x) ||
    !/^\d+\.png$/.test(y)
  ) {
    return NextResponse.json(
      { error: "Path tile DTM tidak valid." },
      { status: 400 },
    );
  }

  const upstreamUrl = `${R2_DTM_BASE}/${zoom}/${x}/${y}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "image/png" },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Tile DTM tidak ditemukan (HTTP ${upstream.status}).` },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Server WebGIS gagal mengambil tile DTM dari R2." },
      { status: 502 },
    );
  }
}

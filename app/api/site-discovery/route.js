import { NextResponse } from "next/server";

const USER_AGENT = "Sentinel Autogard Site Discovery/0.1 (authorized research application)";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "q is required" }, { status: 400 });

  try {
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ch&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, cache: "no-store" }
    );
    if (!geocodeResponse.ok) return NextResponse.json({ error: "Geocoding unavailable" }, { status: 502 });

    const results = await geocodeResponse.json();
    const candidates = results.map((item) => ({
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      displayName: item.display_name,
      osmType: item.type,
      osmId: item.osm_id,
      boundingBox: item.boundingbox?.map(Number) || null,
      address: item.address || {}
    }));

    return NextResponse.json({ data: candidates });
  } catch (error) {
    console.error("Site discovery failed", error);
    return NextResponse.json({ error: "Site discovery failed" }, { status: 503 });
  }
}

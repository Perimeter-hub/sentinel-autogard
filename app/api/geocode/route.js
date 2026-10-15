import { NextResponse } from "next/server";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ch&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Sentinel-Autogard/0.1 (site-audit)"
        },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding provider unavailable" }, { status: 502 });
    }

    const results = await response.json();
    const data = results.map((item) => ({
      displayName: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      type: item.type,
      category: item.category,
      address: item.address || {},
      boundingBox: item.boundingbox || []
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Geocoding failed", error);
    return NextResponse.json({ error: "Unable to geocode site" }, { status: 503 });
  }
}

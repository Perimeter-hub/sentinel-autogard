import { NextResponse } from "next/server";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function parseBBox(value) {
  const parts = value?.split(",").map(Number);
  if (!parts || parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;
  const [south, west, north, east] = parts;
  if (south >= north || west >= east) return null;
  return { south, west, north, east };
}

export async function GET(request) {
  const bbox = parseBBox(new URL(request.url).searchParams.get("bbox"));
  if (!bbox) return NextResponse.json({ error: "bbox must be south,west,north,east" }, { status: 400 });

  const latSpan = bbox.north - bbox.south;
  const lonSpan = bbox.east - bbox.west;
  if (latSpan > 0.03 || lonSpan > 0.03) {
    return NextResponse.json({ error: "Analysis area is too large; refine the site boundary first" }, { status: 422 });
  }

  const box = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const query = `[out:json][timeout:20];(way[building](${box});way[highway](${box});node[barrier](${box});way[barrier](${box});node[amenity=parking](${box});way[amenity=parking](${box});node[entrance](${box});way[entrance](${box}););out center tags;`;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Sentinel Autogard Site Context/0.1" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store"
    });
    if (!response.ok) return NextResponse.json({ error: "OpenStreetMap analysis unavailable" }, { status: 502 });

    const payload = await response.json();
    const elements = payload.elements || [];
    const buildings = elements.filter((item) => item.tags?.building);
    const roads = elements.filter((item) => item.tags?.highway);
    const barriers = elements.filter((item) => item.tags?.barrier);
    const parking = elements.filter((item) => item.tags?.amenity === "parking");
    const entrances = elements.filter((item) => item.tags?.entrance);

    return NextResponse.json({
      source: "OpenStreetMap / Overpass",
      bbox,
      counts: {
        buildings: buildings.length,
        roads: roads.length,
        barriers: barriers.length,
        parkingAreas: parking.length,
        entrances: entrances.length
      },
      features: elements.slice(0, 500).map((item) => ({
        id: `${item.type}/${item.id}`,
        type: item.type,
        center: item.center || (item.lat != null ? { lat: item.lat, lon: item.lon } : null),
        tags: item.tags || {}
      }))
    });
  } catch (error) {
    console.error("Site context analysis failed", error);
    return NextResponse.json({ error: "Site context analysis failed" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";

const USER_AGENT = "Sentinel Autogard Full Site Audit/0.2";

async function discover(query, countryCode = "cz") {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=${encodeURIComponent(countryCode)}&q=${encodeURIComponent(query)}`, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error("Site discovery unavailable");
  return response.json();
}

async function geoAudit(lat, lon, radius = 1000) {
  const query = `[out:json][timeout:25];(nwr(around:${radius},${lat},${lon})[building];nwr(around:${radius},${lat},${lon})[highway];nwr(around:${radius},${lat},${lon})[barrier];nwr(around:${radius},${lat},${lon})[entrance];nwr(around:${radius},${lat},${lon})[amenity=parking];);out center tags;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "text/plain", "User-Agent": USER_AGENT }, body: query, cache: "no-store" });
  if (!response.ok) throw new Error("Geo audit unavailable");
  const payload = await response.json();
  return (payload.elements || []).map((element) => ({ id: `${element.type}/${element.id}`, source: "OpenStreetMap", latitude: element.lat ?? element.center?.lat ?? null, longitude: element.lon ?? element.center?.lon ?? null, tags: element.tags || {} }));
}

function classify(tags) {
  if (tags.entrance) return tags.entrance === "main" || tags.entrance === "yes" ? "access_point" : "pedestrian_access";
  if (tags.barrier) return "barrier";
  if (tags.amenity === "parking") return "parking";
  if (tags.highway) return "road";
  if (tags.building) return "building";
  return "other";
}

export async function POST(request) {
  try {
    const { query, radius = 1000, countryCode = "cz" } = await request.json();
    if (!query?.trim()) return NextResponse.json({ error: "query is required" }, { status: 400 });

    const candidates = await discover(query.trim(), countryCode);
    if (!candidates.length) return NextResponse.json({ data: { status: "site_not_found", candidates: [], features: [] } });

    const selected = candidates[0];
    const latitude = Number(selected.lat);
    const longitude = Number(selected.lon);
    const features = await geoAudit(latitude, longitude, radius);
    const classified = features.map((feature) => ({ ...feature, classification: classify(feature.tags) }));
    const summary = classified.reduce((result, feature) => { result[feature.classification] = (result[feature.classification] || 0) + 1; return result; }, {});

    const candidateBoundary = selected.boundingbox ? { south: Number(selected.boundingbox[0]), north: Number(selected.boundingbox[1]), west: Number(selected.boundingbox[2]), east: Number(selected.boundingbox[3]), confidence: selected.type === "industrial" || selected.type === "commercial" ? "medium" : "low", state: "review_required" } : null;

    return NextResponse.json({ data: { status: "site_discovered", site: { displayName: selected.display_name, latitude, longitude, osmType: selected.type, osmId: selected.osm_id, address: selected.address || {} }, candidateBoundary, features: classified, summary, nextActions: ["Review candidate site", "Accept or edit boundary", "Run visual evidence analysis", "Review security observations"] } });
  } catch (error) {
    console.error("Full site audit failed", error);
    return NextResponse.json({ error: "Unable to run full site audit" }, { status: 503 });
  }
}

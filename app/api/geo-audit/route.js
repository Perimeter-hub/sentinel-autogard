import { NextResponse } from "next/server";

const USER_AGENT = "Sentinel Autogard Geo Audit/0.1";

function buildOverpassQuery(latitude, longitude, radius) {
  return `[out:json][timeout:25];(nwr(around:${radius},${latitude},${longitude})[building];nwr(around:${radius},${latitude},${longitude})[highway];nwr(around:${radius},${latitude},${longitude})[barrier];nwr(around:${radius},${latitude},${longitude})[entrance];nwr(around:${radius},${latitude},${longitude})[amenity=parking];);out center tags;`;
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lon"));
  const radius = Math.min(Math.max(Number(params.get("radius") || 750), 100), 3000);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain", "User-Agent": USER_AGENT },
      body: buildOverpassQuery(latitude, longitude, radius),
      cache: "no-store"
    });
    if (!response.ok) return NextResponse.json({ error: "Geospatial data unavailable" }, { status: 502 });

    const payload = await response.json();
    const features = (payload.elements || []).map((element) => ({
      id: `${element.type}/${element.id}`,
      source: "OpenStreetMap",
      sourceId: element.id,
      sourceType: element.type,
      latitude: element.lat ?? element.center?.lat ?? null,
      longitude: element.lon ?? element.center?.lon ?? null,
      tags: element.tags || {},
      classification: classify(element.tags || {})
    }));

    const summary = features.reduce((result, feature) => {
      result[feature.classification] = (result[feature.classification] || 0) + 1;
      return result;
    }, {});

    return NextResponse.json({ data: features, summary, source: "OpenStreetMap", radius });
  } catch (error) {
    console.error("Geo audit failed", error);
    return NextResponse.json({ error: "Geo audit failed" }, { status: 503 });
  }
}

function classify(tags) {
  if (tags.entrance) return tags.entrance === "main" || tags.entrance === "yes" ? "access_candidate" : "pedestrian_candidate";
  if (tags.barrier) return "barrier_candidate";
  if (tags.amenity === "parking") return "parking_candidate";
  if (tags.highway) return "road_candidate";
  if (tags.building) return "building_candidate";
  return "other";
}

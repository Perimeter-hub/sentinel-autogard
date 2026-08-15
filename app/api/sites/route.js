import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [],
    meta: { total: 0, storage: "postgresql-postgis" }
  });
}

export async function POST(request) {
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ error: "Site name is required" }, { status: 400 });
  }

  const site = {
    id: crypto.randomUUID(),
    name: body.name,
    status: body.status || "draft",
    countryCode: body.countryCode || "CH",
    address: body.address || null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    perimeterMeters: body.perimeterMeters ?? null,
    areaSquareMeters: body.areaSquareMeters ?? null,
    perimeter: body.perimeter || null,
    metadata: body.metadata || {},
    createdAt: new Date().toISOString()
  };

  return NextResponse.json({ data: site }, { status: 201 });
}

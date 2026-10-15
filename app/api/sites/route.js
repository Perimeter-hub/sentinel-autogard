import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

function toGeoJsonPolygon(perimeter) {
  if (!Array.isArray(perimeter) || perimeter.length < 3) return null;
  return {
    type: "Polygon",
    coordinates: [[...perimeter, perimeter[0]]]
  };
}

export async function GET() {
  try {
    const result = await db.query(`
      SELECT id, name, status, country_code, address, latitude, longitude,
             perimeter_meters, area_square_meters, ST_AsGeoJSON(perimeter) AS perimeter,
             created_at, updated_at
      FROM sites
      ORDER BY updated_at DESC
    `);

    return NextResponse.json({ data: result.rows, meta: { total: result.rowCount } });
  } catch (error) {
    console.error("Site list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ error: "Site name is required" }, { status: 400 });
  }

  const perimeter = toGeoJsonPolygon(body.perimeter);
  const id = crypto.randomUUID();

  try {
    const result = await db.query(`
      INSERT INTO sites (
        id, name, status, country_code, address, latitude, longitude,
        perimeter_meters, area_square_meters, perimeter, centroid, metadata
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        CASE WHEN $10::jsonb IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($10::jsonb), 4326) END,
        CASE WHEN $6::double precision IS NULL OR $7::double precision IS NULL THEN NULL
             ELSE ST_SetSRID(ST_MakePoint($7, $6), 4326) END,
        $11::jsonb
      )
      RETURNING id, name, status, country_code, address, latitude, longitude,
                perimeter_meters, area_square_meters, created_at, updated_at
    `, [
      id,
      body.name,
      body.status || "draft",
      body.countryCode || "CH",
      body.address || null,
      body.latitude ?? null,
      body.longitude ?? null,
      body.perimeterMeters ?? null,
      body.areaSquareMeters ?? null,
      perimeter ? JSON.stringify(perimeter) : null,
      JSON.stringify(body.metadata || {})
    ]);

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Site creation failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

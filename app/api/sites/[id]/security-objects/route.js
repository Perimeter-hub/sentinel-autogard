import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const result = await db.query(
      `SELECT id, site_id, object_type, name, manufacturer, model, status,
              ST_AsGeoJSON(location) AS location,
              ST_AsGeoJSON(geometry) AS geometry,
              orientation_degrees, attributes, source_asset_id,
              created_at, updated_at
       FROM site_security_objects
       WHERE site_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Security object fetch failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;

  try {
    const body = await request.json();
    if (!body.objectType) {
      return NextResponse.json({ error: "objectType is required" }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO site_security_objects
       (site_id, object_type, name, manufacturer, model, status,
        location, geometry, orientation_degrees, attributes, source_asset_id)
       VALUES (
        $1,$2,$3,$4,$5,COALESCE($6,'existing'),
        CASE WHEN $7::jsonb IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($7::jsonb),4326) END,
        CASE WHEN $8::jsonb IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($8::jsonb),4326) END,
        $9,$10::jsonb,$11)
       RETURNING id, site_id, object_type, name, manufacturer, model, status,
                 ST_AsGeoJSON(location) AS location,
                 ST_AsGeoJSON(geometry) AS geometry,
                 orientation_degrees, attributes, source_asset_id,
                 created_at, updated_at`,
      [
        id,
        body.objectType,
        body.name || null,
        body.manufacturer || null,
        body.model || null,
        body.status || null,
        body.location ? JSON.stringify(body.location) : null,
        body.geometry ? JSON.stringify(body.geometry) : null,
        body.orientationDegrees ?? null,
        JSON.stringify(body.attributes || {}),
        body.sourceAssetId || null
      ]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Security object creation failed", error);
    return NextResponse.json({ error: "Unable to create security object" }, { status: 400 });
  }
}

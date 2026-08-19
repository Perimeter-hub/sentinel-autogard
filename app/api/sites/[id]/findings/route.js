import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const result = await db.query(
      `SELECT id, finding_type, title, description, severity, confidence,
              ST_AsGeoJSON(location) AS location,
              ST_AsGeoJSON(geometry) AS geometry,
              evidence, status, created_at, updated_at
       FROM site_findings WHERE site_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Finding fetch failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await db.query(
      `INSERT INTO site_findings
       (site_id, finding_type, title, description, severity, confidence, location, geometry, evidence)
       VALUES ($1,$2,$3,$4,$5,$6,
         CASE WHEN $7::jsonb IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($7::jsonb),4326) END,
         CASE WHEN $8::jsonb IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($8::jsonb),4326) END,
         COALESCE($9::jsonb, '{}'::jsonb))
       RETURNING id, site_id, finding_type, title, description, severity, confidence, evidence, status, created_at`,
      [
        id,
        body.findingType,
        body.title,
        body.description || null,
        body.severity || "medium",
        body.confidence ?? null,
        body.location ? JSON.stringify(body.location) : null,
        body.geometry ? JSON.stringify(body.geometry) : null,
        JSON.stringify(body.evidence || {})
      ]
    );
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Finding creation failed", error);
    return NextResponse.json({ error: "Unable to create finding" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

const ALLOWED_TYPES = ["vehicle_gate", "pedestrian_gate", "barrier", "road_blocker", "turnstile", "cctv", "anpr", "fence", "building", "access_point", "other"];

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId");
  try {
    const result = await db.query(`
      SELECT id, site_id, evidence_id, type, title, confidence, state,
             latitude, longitude, bounding_box, attributes, created_at
      FROM observations
      ${siteId ? "WHERE site_id = $1" : ""}
      ORDER BY created_at DESC
    `, siteId ? [siteId] : []);
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Observation list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId, evidenceId, type, title, confidence, latitude, longitude, boundingBox, attributes } = body;
    if (!siteId || !type || !title || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "siteId, supported type, and title are required" }, { status: 400 });
    }
    const result = await db.query(`
      INSERT INTO observations
        (site_id, evidence_id, type, title, confidence, state, latitude, longitude, bounding_box, attributes)
      VALUES ($1, $2, $3, $4, $5, 'inferred', $6, $7, $8::jsonb, $9::jsonb)
      RETURNING id, site_id, evidence_id, type, title, confidence, state,
                latitude, longitude, bounding_box, attributes, created_at
    `, [siteId, evidenceId || null, type, title, confidence ?? null, latitude ?? null, longitude ?? null, JSON.stringify(boundingBox || null), JSON.stringify(attributes || {})]);
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Observation creation failed", error);
    return NextResponse.json({ error: "Unable to create observation" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId");
  const findingId = params.get("findingId");
  try {
    const filters = [];
    const values = [];
    if (siteId) { values.push(siteId); filters.push(`site_id = $${values.length}`); }
    if (findingId) { values.push(findingId); filters.push(`target_id = $${values.length}`); }
    const result = await db.query(`SELECT id, site_id, source_type, source_id, target_type, target_id, relation, confidence, metadata, created_at FROM provenance_edges ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""} ORDER BY created_at ASC`, values);
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Provenance query failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId = null, sourceType, sourceId, targetType, targetId, relation, confidence = null, metadata = {} } = body;
    if (!sourceType || !sourceId || !targetType || !targetId || !relation) return NextResponse.json({ error: "sourceType, sourceId, targetType, targetId and relation are required" }, { status: 400 });
    const result = await db.query(`INSERT INTO provenance_edges (site_id, source_type, source_id, target_type, target_id, relation, confidence, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`, [siteId, sourceType, sourceId, targetType, targetId, relation, confidence, JSON.stringify(metadata)]);
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Provenance edge creation failed", error);
    return NextResponse.json({ error: "Unable to create provenance edge" }, { status: 503 });
  }
}

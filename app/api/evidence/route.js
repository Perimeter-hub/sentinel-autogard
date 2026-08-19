import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId is required" }, { status: 400 });
  try {
    const result = await db.query(`SELECT id, site_id, finding_id, security_object_id, source_type, source_url, title, captured_at, latitude, longitude, mime_type, provenance, confidence, review_state, metadata, created_at FROM evidence_assets WHERE site_id = $1 ORDER BY created_at DESC`, [siteId]);
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Evidence list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId, findingId, securityObjectId, sourceType, sourceUrl, title, capturedAt, latitude, longitude, mimeType, provenance, confidence, reviewState, metadata } = body;
    if (!siteId || !sourceType || !title) return NextResponse.json({ error: "siteId, sourceType, and title are required" }, { status: 400 });
    const result = await db.query(`INSERT INTO evidence_assets (site_id, finding_id, security_object_id, source_type, source_url, title, captured_at, latitude, longitude, mime_type, provenance, confidence, review_state, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13,'unreviewed'),COALESCE($14::jsonb,'{}'::jsonb)) RETURNING id, site_id, finding_id, security_object_id, source_type, source_url, title, captured_at, latitude, longitude, mime_type, provenance, confidence, review_state, metadata, created_at`, [siteId, findingId || null, securityObjectId || null, sourceType, sourceUrl || null, title, capturedAt || null, latitude ?? null, longitude ?? null, mimeType || null, provenance || null, confidence ?? null, reviewState || null, JSON.stringify(metadata || {})]);
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Evidence creation failed", error);
    return NextResponse.json({ error: "Unable to create evidence asset" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request) {
  const siteId = new URL(request.url).searchParams.get("siteId");

  try {
    const result = await db.query(`
      SELECT id, site_id, type, title, description, severity, confidence,
             status, latitude, longitude, evidence, created_at, updated_at
      FROM findings
      ${siteId ? "WHERE site_id = $1" : ""}
      ORDER BY severity DESC, created_at DESC
    `, siteId ? [siteId] : []);

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Finding list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId, type, title, description, severity, confidence, status, latitude, longitude, evidence } = body;

    if (!siteId || !type || !title) {
      return NextResponse.json({ error: "siteId, type, and title are required" }, { status: 400 });
    }

    const result = await db.query(`
      INSERT INTO findings
        (site_id, type, title, description, severity, confidence, status, latitude, longitude, evidence)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'open'), $8, $9, COALESCE($10::jsonb, '{}'::jsonb))
      RETURNING id, site_id, type, title, description, severity, confidence,
                status, latitude, longitude, evidence, created_at, updated_at
    `, [siteId, type, title, description || null, severity || "medium", confidence ?? null, status || null, latitude ?? null, longitude ?? null, JSON.stringify(evidence || {})]);

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Finding creation failed", error);
    return NextResponse.json({ error: "Unable to create finding" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request) {
  const siteId = new URL(request.url).searchParams.get("siteId");

  try {
    const result = await db.query(`
      SELECT id, site_id, finding_id, type, title, description, priority,
             confidence, status, estimated_value, recommended_products,
             created_at, updated_at
      FROM opportunities
      ${siteId ? "WHERE site_id = $1" : ""}
      ORDER BY priority DESC, created_at DESC
    `, siteId ? [siteId] : []);

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Opportunity list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId, findingId, type, title, description, priority, confidence, status, estimatedValue, recommendedProducts } = body;

    if (!siteId || !type || !title) {
      return NextResponse.json({ error: "siteId, type, and title are required" }, { status: 400 });
    }

    const result = await db.query(`
      INSERT INTO opportunities
        (site_id, finding_id, type, title, description, priority, confidence,
         status, estimated_value, recommended_products)
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'new'), $9, COALESCE($10::jsonb, '[]'::jsonb))
      RETURNING id, site_id, finding_id, type, title, description, priority,
                confidence, status, estimated_value, recommended_products,
                created_at, updated_at
    `, [siteId, findingId || null, type, title, description || null, priority || "medium", confidence ?? null, status || null, estimatedValue ?? null, JSON.stringify(recommendedProducts || [])]);

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Opportunity creation failed", error);
    return NextResponse.json({ error: "Unable to create opportunity" }, { status: 503 });
  }
}

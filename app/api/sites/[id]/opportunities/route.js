import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const result = await db.query(
      `SELECT id, finding_id, title, opportunity_type, priority, confidence,
              estimated_value, currency, recommended_solution, status, next_action,
              created_at, updated_at
       FROM site_opportunities WHERE site_id = $1 ORDER BY
       CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
       created_at DESC`,
      [id]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Opportunity fetch failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await db.query(
      `INSERT INTO site_opportunities
       (site_id, finding_id, title, opportunity_type, priority, confidence,
        estimated_value, currency, recommended_solution, next_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
       RETURNING *`,
      [
        id,
        body.findingId || null,
        body.title,
        body.opportunityType || "modernization",
        body.priority || "medium",
        body.confidence ?? null,
        body.estimatedValue ?? null,
        body.currency || "EUR",
        JSON.stringify(body.recommendedSolution || {}),
        body.nextAction || null
      ]
    );
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Opportunity creation failed", error);
    return NextResponse.json({ error: "Unable to create opportunity" }, { status: 400 });
  }
}

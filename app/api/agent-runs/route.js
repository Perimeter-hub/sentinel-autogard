import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request) {
  const siteId = new URL(request.url).searchParams.get("siteId");
  try {
    const result = await db.query(`SELECT id, site_id, status, current_step, state, trace, created_at, updated_at FROM agent_runs ${siteId ? "WHERE site_id = $1" : ""} ORDER BY created_at DESC`, siteId ? [siteId] : []);
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Agent run list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { siteId = null, state = {}, currentStep = "discover_site" } = body;
    const result = await db.query(`INSERT INTO agent_runs (site_id, status, current_step, state, trace) VALUES ($1, 'running', $2, $3::jsonb, '[]'::jsonb) RETURNING id, site_id, status, current_step, state, trace, created_at, updated_at`, [siteId, currentStep, JSON.stringify(state)]);
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Agent run creation failed", error);
    return NextResponse.json({ error: "Unable to create agent run" }, { status: 503 });
  }
}

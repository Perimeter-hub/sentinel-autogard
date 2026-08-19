import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const runId = params.get("runId");
  try {
    const result = await db.query(`SELECT id, run_id, site_id, event_type, actor, action, payload, created_at FROM audit_events ${runId ? "WHERE run_id = $1" : ""} ORDER BY created_at ASC`, runId ? [runId] : []);
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Audit event list failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { runId = null, siteId = null, eventType, actor = "sentinel", action, payload = {} } = body;
    if (!eventType || !action) return NextResponse.json({ error: "eventType and action are required" }, { status: 400 });
    const result = await db.query(`INSERT INTO audit_events (run_id, site_id, event_type, actor, action, payload) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id, run_id, site_id, event_type, actor, action, payload, created_at`, [runId, siteId, eventType, actor, action, JSON.stringify(payload)]);
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Audit event creation failed", error);
    return NextResponse.json({ error: "Unable to record audit event" }, { status: 503 });
  }
}

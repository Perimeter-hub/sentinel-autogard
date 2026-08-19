import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await db.query(`UPDATE agent_runs SET status = COALESCE($1, status), current_step = COALESCE($2, current_step), state = COALESCE($3::jsonb, state), trace = COALESCE($4::jsonb, trace), updated_at = NOW() WHERE id = $5 RETURNING id, site_id, status, current_step, state, trace, created_at, updated_at`, [body.status || null, body.currentStep || null, body.state ? JSON.stringify(body.state) : null, body.trace ? JSON.stringify(body.trace) : null, id]);
    if (!result.rows[0]) return NextResponse.json({ error: "Agent run not found" }, { status: 404 });
    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Agent run checkpoint failed", error);
    return NextResponse.json({ error: "Unable to checkpoint agent run" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const action = body.action;

  const transitions = {
    confirm: { state: "validated" },
    reject: { state: "rejected" },
    review: { state: "in_review" }
  };

  if (!transitions[action]) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  try {
    const result = await db.query(`
      UPDATE observations
      SET state = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, site_id, evidence_id, type, title, confidence, state,
                latitude, longitude, bounding_box, attributes, created_at, updated_at
    `, [transitions[action].state, id]);

    if (!result.rows[0]) return NextResponse.json({ error: "Observation not found" }, { status: 404 });
    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Observation validation failed", error);
    return NextResponse.json({ error: "Unable to update observation" }, { status: 503 });
  }
}

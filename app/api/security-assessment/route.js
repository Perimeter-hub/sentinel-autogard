import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

const ASSESSMENTS = {
  vehicle_gate: { findingType: "Uncontrolled Vehicle Access", opportunityType: "Modernization", title: "Vehicle access control modernization", description: "A confirmed vehicle gate should be assessed for controlled access, traffic management, and security integration.", severity: "medium" },
  barrier: { findingType: "Security Coverage Gap", opportunityType: "Modernization", title: "Vehicle barrier modernization opportunity", description: "Assess the existing barrier for automation, access control integration, traffic intensity, and lifecycle condition.", severity: "medium" },
  road_blocker: { findingType: "Security Coverage Gap", opportunityType: "Modernization", title: "Road blocker modernization opportunity", description: "Assess vehicle denial and anti-ram requirements at this access point.", severity: "high" },
  pedestrian_gate: { findingType: "Weak Pedestrian Access", opportunityType: "Modernization", title: "Pedestrian access modernization opportunity", description: "Assess pedestrian access control and integration requirements.", severity: "medium" },
  turnstile: { findingType: "Security Coverage Gap", opportunityType: "Modernization", title: "Pedestrian access modernization opportunity", description: "Assess turnstile condition, throughput, access control, and integration requirements.", severity: "low" },
  cctv: { findingType: "Security Coverage Gap", opportunityType: "Expansion", title: "CCTV coverage assessment", description: "Assess camera coverage, blind zones, identification requirements, and integration opportunities.", severity: "medium" },
  anpr: { findingType: "Security Coverage Gap", opportunityType: "Expansion", title: "ANPR integration assessment", description: "Assess vehicle identification coverage and integration with access control.", severity: "medium" },
  fence: { findingType: "Perimeter Exposure", opportunityType: "Further Investigation", title: "Perimeter protection assessment", description: "Assess continuity, access points, vehicle exposure, and security integration along the perimeter.", severity: "medium" },
  access_point: { findingType: "Security Coverage Gap", opportunityType: "Further Investigation", title: "Access point security assessment", description: "Assess the access point for vehicle or pedestrian control requirements.", severity: "medium" }
};

export async function POST(request) {
  try {
    const { observationId } = await request.json();
    if (!observationId) return NextResponse.json({ error: "observationId is required" }, { status: 400 });

    const observation = await db.query("SELECT * FROM observations WHERE id = $1 AND state = 'validated'", [observationId]);
    if (!observation.rows[0]) return NextResponse.json({ error: "Validated observation not found" }, { status: 404 });

    const item = observation.rows[0];
    const assessment = ASSESSMENTS[item.type] || { findingType: "Investigation Required", opportunityType: "Further Investigation", title: "Security assessment required", description: "A confirmed security object requires further engineering assessment.", severity: "medium" };

    const finding = await db.query(`
      INSERT INTO findings (site_id, type, title, description, severity, confidence, status, latitude, longitude, evidence)
      VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9::jsonb)
      RETURNING *
    `, [item.site_id, assessment.findingType, assessment.title, assessment.description, assessment.severity, item.confidence, item.latitude, item.longitude, JSON.stringify({ observationId: item.id, state: "validated" })]);

    const opportunity = await db.query(`
      INSERT INTO opportunities (site_id, finding_id, type, title, description, priority, confidence, status, recommended_products)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', '[]'::jsonb)
      RETURNING *
    `, [item.site_id, finding.rows[0].id, assessment.opportunityType, assessment.title, assessment.description, assessment.severity, item.confidence]);

    return NextResponse.json({ data: { finding: finding.rows[0], opportunity: opportunity.rows[0] } }, { status: 201 });
  } catch (error) {
    console.error("Security assessment failed", error);
    return NextResponse.json({ error: "Unable to generate security assessment" }, { status: 503 });
  }
}

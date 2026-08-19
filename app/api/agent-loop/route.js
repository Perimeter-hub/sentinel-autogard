import { NextResponse } from "next/server";

const MAX_STEPS = 8;

function missingInputs(state) {
  return (state.requiredParameters || []).filter((key) => state.parameters?.[key] === undefined || state.parameters?.[key] === null || state.parameters?.[key] === "");
}

function planNext(state) {
  if (!state.site) return { action: "discover_site", reason: "No confirmed site context" };
  if (!state.boundaryAccepted) return { action: "request_boundary_review", reason: "Site boundary requires human validation" };
  if (!state.evidenceCollected) return { action: "collect_evidence", reason: "Visual and geospatial evidence is incomplete" };
  if (!state.observationsAnalyzed) return { action: "analyze_observations", reason: "Evidence has not been fully analyzed" };
  if (state.criticalFindings > 0 && !state.securityValidated) return { action: "request_security_validation", reason: "Security-critical findings require human validation" };
  const missing = missingInputs(state);
  if (missing.length) return { action: "ask_missing_questions", reason: "Engineering requirements are incomplete", parameters: missing };
  if (!state.productsMatched) return { action: "match_products", reason: "Engineering profile is ready" };
  if (!state.consistencyChecked) return { action: "verify_consistency", reason: "Final result requires consistency check" };
  return { action: "complete", reason: "Audit objectives satisfied" };
}

export async function POST(request) {
  try {
    const initial = await request.json();
    let state = { ...initial, step: 0, trace: [] };
    for (let step = 1; step <= MAX_STEPS; step += 1) {
      const next = planNext(state);
      state.trace.push({ step, action: next.action, reason: next.reason, parameters: next.parameters || [] });
      state.step = step;
      state.nextAction = next.action;
      state.nextReason = next.reason;
      if (next.action === "complete" || next.action === "request_boundary_review" || next.action === "request_security_validation" || next.action === "ask_missing_questions") break;
      if (next.action === "discover_site") state.site = { status: "discovery_required" };
      if (next.action === "collect_evidence") state.evidenceCollected = false;
      if (next.action === "analyze_observations") state.observationsAnalyzed = true;
      if (next.action === "match_products") state.productsMatched = true;
      if (next.action === "verify_consistency") state.consistencyChecked = true;
    }
    return NextResponse.json({ data: { status: state.nextAction === "complete" ? "completed" : "paused_for_required_input", state, trace: state.trace } });
  } catch (error) {
    console.error("Agent loop failed", error);
    return NextResponse.json({ error: "Unable to run agent loop" }, { status: 503 });
  }
}

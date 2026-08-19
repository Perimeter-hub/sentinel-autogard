import { NextResponse } from "next/server";
import policy from "../../../data/autonomy/policy.json";

function classify(domain, confidence = 0) {
  if (domain === "security" || domain === "site_boundary") return "mandatory_human_validation";
  if (domain === "product") return "recommend_only_engineering_validation_required";
  return Number(confidence) >= 0.9 ? "auto_accept" : "review_queue";
}

function summarize(items) {
  return items.reduce((result, item) => {
    const key = item.autonomyDecision;
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

export async function POST(request) {
  try {
    const body = await request.json();
    const observations = Array.isArray(body.observations) ? body.observations : [];
    const findings = Array.isArray(body.findings) ? body.findings : [];
    const products = Array.isArray(body.productRecommendations) ? body.productRecommendations : [];
    const boundary = body.boundary ? [{ ...body.boundary, domain: "site_boundary" }] : [];

    const items = [
      ...observations.map((item) => ({ ...item, domain: item.domain || "context", autonomyDecision: classify(item.domain || "context", item.confidence) })),
      ...findings.map((item) => ({ ...item, domain: "security", autonomyDecision: classify("security", item.confidence) })),
      ...products.map((item) => ({ ...item, domain: "product", autonomyDecision: classify("product", item.confidence) })),
      ...boundary.map((item) => ({ ...item, autonomyDecision: classify("site_boundary", item.confidence) }))
    ];

    const reviewQueue = items.filter((item) => item.autonomyDecision !== "auto_accept");
    const autoAccepted = items.filter((item) => item.autonomyDecision === "auto_accept");

    return NextResponse.json({ data: {
      status: "completed",
      policyVersion: policy.version,
      items,
      autoAccepted,
      reviewQueue,
      summary: summarize(items),
      metrics: {
        totalProcessed: items.length,
        autoAccepted: autoAccepted.length,
        reviewRequired: reviewQueue.length,
        mandatoryValidation: items.filter((item) => item.autonomyDecision === "mandatory_human_validation").length,
        engineeringValidation: items.filter((item) => item.autonomyDecision === "recommend_only_engineering_validation_required").length
      }
    }});
  } catch (error) {
    console.error("Autonomous audit failed", error);
    return NextResponse.json({ error: "Unable to run autonomous audit pipeline" }, { status: 503 });
  }
}

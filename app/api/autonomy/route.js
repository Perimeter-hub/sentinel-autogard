import { NextResponse } from "next/server";
import policy from "../../../data/autonomy/policy.json";

function decision(domain, confidence) {
  const value = Number(confidence);
  if (domain === "security") return "mandatory_human_validation";
  if (domain === "site_boundary") return "mandatory_human_validation";
  if (domain === "product") return "recommend_only_engineering_validation_required";
  if (Number.isFinite(value) && value >= 0.9) return "auto_accept";
  return "review_queue";
}

export async function POST(request) {
  try {
    const { items = [] } = await request.json();
    const results = items.map((item) => ({ ...item, autonomyDecision: decision(item.domain || "context", item.confidence), policyVersion: policy.version }));
    const summary = results.reduce((result, item) => { result[item.autonomyDecision] = (result[item.autonomyDecision] || 0) + 1; return result; }, {});
    return NextResponse.json({ data: { items: results, summary, policyVersion: policy.version } });
  } catch (error) {
    console.error("Autonomy engine failed", error);
    return NextResponse.json({ error: "Unable to evaluate autonomy policy" }, { status: 503 });
  }
}

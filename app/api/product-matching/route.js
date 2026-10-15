import { NextResponse } from "next/server";
import products from "../../../data/autogard/products.json";
import rules from "../../../data/autogard/solution-rules.json";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const findingType = params.get("findingType") || "";
  const objectType = params.get("objectType") || "";
  const siteConditions = (params.get("siteConditions") || "").split(",").map((value) => value.trim()).filter(Boolean);
  const trafficIntensity = params.get("trafficIntensity") || "";

  if (!findingType) return NextResponse.json({ error: "findingType is required" }, { status: 400 });

  const applicableRules = rules.filter((rule) =>
    rule.findingTypes.includes(findingType) &&
    (!objectType || rule.requiredObjectTypes.includes(objectType))
  );

  const data = products.map((product) => {
    let score = 0;
    const reasons = [];
    const matchingRules = applicableRules.filter((rule) => rule.preferredCategories.includes(product.category));
    score += matchingRules.length * 30;

    for (const condition of siteConditions) {
      if (product.applicationTags?.includes(condition)) {
        score += 15;
        reasons.push(`Application match: ${condition}`);
      }
    }

    if (trafficIntensity && product.applicationTags?.includes(trafficIntensity)) {
      score += 20;
      reasons.push(`Traffic match: ${trafficIntensity}`);
    }

    if (matchingRules.length) reasons.push(...matchingRules.map((rule) => `Rule match: ${rule.ruleId}`));

    return {
      productId: product.productId,
      name: product.name,
      category: product.category,
      score,
      confidenceBand: score >= 60 ? "strong_candidate" : score >= 30 ? "candidate" : "weak_candidate",
      reasons,
      specifications: product.specifications || {},
      features: product.features || [],
      sourceUrl: product.sourceUrl
    };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

  return NextResponse.json({
    data,
    matchingBasis: data.length ? "verified_catalog_rule_and_site_context" : "no_verified_match",
    context: { findingType, objectType, siteConditions, trafficIntensity }
  });
}

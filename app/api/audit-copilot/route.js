import { NextResponse } from "next/server";
import questions from "../../../data/autogard/audit-questions.json";
import requirements from "../../../data/autogard/engineering-requirements.json";
import rules from "../../../data/autogard/solution-rules.json";
import products from "../../../data/autogard/products.json";

export async function POST(request) {
  try {
    const body = await request.json();
    const { objectType, findingType = "", parameters = {}, siteConditions = [], trafficIntensity = null } = body;
    if (!objectType) return NextResponse.json({ error: "objectType is required" }, { status: 400 });

    const requirement = requirements.find((item) => item.objectTypes.includes(objectType));
    const missingParameters = requirement
      ? requirement.parameters.filter((parameter) => parameters[parameter] === undefined || parameters[parameter] === null || parameters[parameter] === "")
      : [];

    const nextQuestions = questions.filter((question) => question.objectTypes.includes(objectType) && missingParameters.includes(question.parameter));

    const applicableRules = rules.filter((rule) =>
      (!rule.findingTypes.length || rule.findingTypes.includes(findingType)) &&
      (!rule.requiredObjectTypes.length || rule.requiredObjectTypes.includes(objectType))
    );

    const candidates = products.map((product) => {
      let score = 0;
      const reasons = [];
      const matchingRules = applicableRules.filter((rule) => rule.preferredCategories.includes(product.category));
      score += matchingRules.length * 30;
      siteConditions.forEach((condition) => {
        if (product.applicationTags?.includes(condition)) { score += 15; reasons.push(`Application match: ${condition}`); }
      });
      if (trafficIntensity && product.applicationTags?.includes(trafficIntensity)) { score += 20; reasons.push(`Traffic match: ${trafficIntensity}`); }
      if (matchingRules.length) reasons.push(...matchingRules.map((rule) => `Rule: ${rule.ruleId}`));
      return { productId: product.productId, name: product.name, category: product.category, score, reasons, sourceUrl: product.sourceUrl, specifications: product.specifications || {} };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

    const status = !requirement ? "needs_engineering_profile" : missingParameters.length ? "questions_required" : candidates.length ? "solution_candidates_ready" : "no_verified_match";
    return NextResponse.json({ data: { status, objectType, findingType, missingParameters, nextQuestions, engineeringRequirement: requirement || null, solutionCandidates: candidates, confidence: missingParameters.length ? "incomplete" : "ready" } });
  } catch (error) {
    console.error("Audit Copilot failed", error);
    return NextResponse.json({ error: "Unable to run Audit Copilot" }, { status: 503 });
  }
}

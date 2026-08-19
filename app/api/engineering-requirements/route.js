import { NextResponse } from "next/server";
import requirements from "../../../data/autogard/engineering-requirements.json";
import products from "../../../data/autogard/products.json";

export async function POST(request) {
  try {
    const body = await request.json();
    const objectType = body.objectType || "";
    const inputs = body.inputs || {};
    const requirement = requirements.find((item) => item.objectTypes.includes(objectType));
    if (!requirement) return NextResponse.json({ data: { status: "no_requirement_profile", objectType, requiredParameters: [] } });

    const missing = requirement.parameters.filter((parameter) => inputs[parameter] === undefined || inputs[parameter] === null || inputs[parameter] === "");
    const assumptions = Object.entries(inputs).filter(([, value]) => value !== undefined && value !== null && value !== "").map(([key, value]) => ({ key, value, source: "user_or_audit_input" }));
    const candidates = products.filter((product) => product.category === requirement.productCategory).map((product) => ({ productId: product.productId, name: product.name, specifications: product.specifications || {}, applicationTags: product.applicationTags || [] }));

    return NextResponse.json({ data: {
      status: missing.length ? "incomplete" : "ready_for_product_matching",
      objectType,
      requirementId: requirement.requirementId,
      requiredParameters: requirement.parameters,
      missingParameters: missing,
      assumptions,
      candidates,
      engineeringRule: requirement.rule
    }});
  } catch (error) {
    console.error("Engineering requirements failed", error);
    return NextResponse.json({ error: "Unable to assess engineering requirements" }, { status: 503 });
  }
}

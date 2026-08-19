import { NextResponse } from "next/server";
import products from "../../../data/autogard/products.json";

const FINDING_RULES = {
  "Uncontrolled Vehicle Access": ["AG500", "AG900", "AGF3", "AGM1"],
  "Vehicle access control modernization": ["AG500", "AG900", "AGF3", "AGM1"],
  "Weak Pedestrian Access": ["Tripod-Turnstile"],
  "Pedestrian access modernization opportunity": ["Tripod-Turnstile"],
  "CCTV coverage assessment": [],
  "ANPR integration assessment": ["AG500", "AG900", "AGF3", "AGM1", "EcoPark-II"],
  "Vehicle barrier modernization opportunity": ["AG500", "AG900", "AGF3", "AGM1"],
  "Perimeter protection assessment": [],
  "Parking system opportunity": ["EcoPark-II"]
};

export async function GET(request) {
  const findingType = new URL(request.url).searchParams.get("findingType");
  if (!findingType) return NextResponse.json({ error: "findingType is required" }, { status: 400 });
  const productIds = FINDING_RULES[findingType] || [];
  const data = products.filter((product) => productIds.includes(product.productId));
  return NextResponse.json({ data, count: data.length, matchingBasis: productIds.length ? "verified_catalog_rule" : "no_verified_match" });
}

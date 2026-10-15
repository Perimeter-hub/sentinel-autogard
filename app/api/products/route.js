import { NextResponse } from "next/server";
import products from "../../../data/autogard/products.json";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const application = params.get("application");
  let data = products;
  if (category) data = data.filter((product) => product.category === category);
  if (application) data = data.filter((product) => product.applicationTags.includes(application));
  return NextResponse.json({ data, count: data.length });
}

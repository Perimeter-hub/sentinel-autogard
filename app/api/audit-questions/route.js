import { NextResponse } from "next/server";
import questions from "../../../data/autogard/audit-questions.json";

export async function POST(request) {
  try {
    const { objectType, knownParameters = {} } = await request.json();
    if (!objectType) return NextResponse.json({ error: "objectType is required" }, { status: 400 });
    const data = questions.filter((question) => question.objectTypes.includes(objectType) && (knownParameters[question.parameter] === undefined || knownParameters[question.parameter] === null || knownParameters[question.parameter] === ""));
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("Audit question generation failed", error);
    return NextResponse.json({ error: "Unable to generate audit questions" }, { status: 503 });
  }
}

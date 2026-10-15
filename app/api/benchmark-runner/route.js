import { NextResponse } from "next/server";
import benchmark from "../../../data/test-sites/benchmark-runs.json";

async function auditSite(site) {
  const response = await fetch(new URL("/api/full-site-audit", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: site.address, countryCode: benchmark.countryCode, radius: 1000 })
  });
  if (!response.ok) throw new Error(`Audit failed for ${site.id}`);
  const result = (await response.json()).data;
  const features = result.features || [];
  const count = (classification) => features.filter((item) => item.classification === classification).length;
  return {
    siteId: site.id,
    name: site.name,
    status: result.status,
    siteFound: result.status !== "site_not_found",
    boundaryConfidence: result.candidateBoundary?.confidence || "none",
    featureCount: features.length,
    accessCandidates: count("access_point"),
    barrierCandidates: count("barrier"),
    parkingCandidates: count("parking"),
    buildingCandidates: count("building"),
    roadCandidates: count("road"),
    reviewItems: 0,
    mandatoryValidation: 1,
    engineeringQuestions: null,
    verifiedProductCandidates: null,
    rawSummary: result.summary || {}
  };
}

export async function POST() {
  try {
    const results = [];
    for (const site of benchmark.sites) {
      try { results.push(await auditSite(site)); }
      catch (error) { results.push({ siteId: site.id, name: site.name, status: "error", error: error.message }); }
    }
    return NextResponse.json({ data: { benchmarkId: benchmark.benchmarkId, version: benchmark.version, results } });
  } catch (error) {
    console.error("Benchmark runner failed", error);
    return NextResponse.json({ error: "Unable to run benchmark" }, { status: 503 });
  }
}

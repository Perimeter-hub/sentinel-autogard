import fs from "node:fs/promises";

const truth = JSON.parse(await fs.readFile("data/test-sites/ground-truth-v2.json", "utf8"));
const inputPath = process.argv[2] || "benchmark-results/cz-industrial-001.json";
const input = JSON.parse(await fs.readFile(inputPath, "utf8"));

const haversine = (a, b) => { const R = 6371000; const p = Math.PI / 180; const dLat = (b.latitude - a.latitude) * p; const dLon = (b.longitude - a.longitude) * p; const x = Math.sin(dLat/2)**2 + Math.cos(a.latitude*p)*Math.cos(b.latitude*p)*Math.sin(dLon/2)**2; return 2 * R * Math.asin(Math.sqrt(x)); };

const results = input.results.map((result) => {
  const gt = truth.sites.find((site) => site.id === result.siteId);
  const features = result.features || [];
  const siteText = JSON.stringify(result).toLowerCase();
  const identityCheck = gt?.checks?.find((c) => c.type === "identity");
  const identityPass = identityCheck ? siteText.includes(identityCheck.expected.toLowerCase()) : null;
  let referenceDistanceM = null;
  if (gt?.reference && result.site?.latitude != null && result.site?.longitude != null) referenceDistanceM = haversine(gt.reference, { latitude: result.site.latitude, longitude: result.site.longitude });
  const labelChecks = (gt?.checks || []).filter((c) => c.expectedLabels).map((check) => ({ id: check.id, expected: check.expectedLabels, passedLabels: check.expectedLabels.filter((label) => siteText.includes(label.toLowerCase())) }));
  const matchedLabels = labelChecks.reduce((n, c) => n + c.passedLabels.length, 0);
  const expectedLabels = labelChecks.reduce((n, c) => n + c.expected.length, 0);
  return { siteId: result.siteId, name: result.name, identityPass, referenceDistanceM, coordinateQuality: referenceDistanceM == null ? "not_scored" : referenceDistanceM <= 25 ? "strong" : referenceDistanceM <= 75 ? "probable" : "miss", featureCount: features.length, accessCandidates: features.filter((f) => f.classification === "access_point").length, barrierCandidates: features.filter((f) => f.classification === "barrier").length, expectedLabelRecall: expectedLabels ? matchedLabels / expectedLabels : null, labelChecks };
});

await fs.writeFile("benchmark-results/cz-industrial-001-scored.json", JSON.stringify({ version: "0.2", scoredAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify({ version: "0.2", results }, null, 2));

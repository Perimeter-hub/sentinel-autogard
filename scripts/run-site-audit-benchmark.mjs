import fs from "node:fs/promises";

const benchmark = JSON.parse(await fs.readFile("data/test-sites/benchmark-runs.json", "utf8"));
const groundTruth = JSON.parse(await fs.readFile("data/test-sites/ground-truth.json", "utf8"));
const baseUrl = process.env.SENTINEL_BASE_URL || "http://127.0.0.1:3000";

async function audit(site) {
  const response = await fetch(`${baseUrl}/api/full-site-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: site.address, countryCode: benchmark.countryCode, radius: 1000 }) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).data;
}

function score(site, result) {
  const checks = groundTruth.sites.find((item) => item.id === site.id)?.checks || [];
  const text = JSON.stringify(result).toLowerCase();
  return checks.map((check) => ({ ...check, passed: text.includes(check.expected.toLowerCase()), evidence: text.includes(check.expected.toLowerCase()) ? "matched_in_audit_result" : "not_found" }));
}

const results = [];
for (const site of benchmark.sites) {
  try {
    const result = await audit(site);
    const checks = score(site, result);
    results.push({ siteId: site.id, name: site.name, status: result.status, summary: result.summary || {}, groundTruth: checks, passRate: checks.length ? checks.filter((item) => item.passed).length / checks.length : null });
  } catch (error) {
    results.push({ siteId: site.id, name: site.name, status: "error", error: error.message });
  }
}

await fs.mkdir("benchmark-results", { recursive: true });
await fs.writeFile("benchmark-results/cz-industrial-001.json", JSON.stringify({ benchmarkId: benchmark.benchmarkId, generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify({ benchmarkId: benchmark.benchmarkId, results }, null, 2));
if (results.some((result) => result.status === "error")) process.exitCode = 1;

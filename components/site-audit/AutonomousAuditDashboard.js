"use client";

import { useState } from "react";

export default function AutonomousAuditDashboard({ audit }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(audit || null);

  async function run(items = {}) {
    setRunning(true);
    try {
      const response = await fetch("/api/autonomous-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items) });
      if (!response.ok) throw new Error("Autonomous audit failed");
      setResult((await response.json()).data);
    } finally { setRunning(false); }
  }

  const metrics = result?.metrics || {};
  return <section className="autonomous-audit-dashboard">
    <div className="finding-header"><div><p className="eyebrow">SENTINEL AI</p><h2>Autonomous Audit</h2><p>Automation is applied only within the approved autonomy policy.</p></div><button type="button" className="primary-button" onClick={() => run()} disabled={running}>{running ? "Processing..." : "Run Autonomy Engine"}</button></div>
    {result && <>
      <div className="audit-summary"><span>Processed <strong>{metrics.totalProcessed || 0}</strong></span><span>Auto-accepted <strong>{metrics.autoAccepted || 0}</strong></span><span>Review required <strong>{metrics.reviewRequired || 0}</strong></span><span>Mandatory validation <strong>{metrics.mandatoryValidation || 0}</strong></span><span>Engineering validation <strong>{metrics.engineeringValidation || 0}</strong></span></div>
      <div className="observation-list">{(result.reviewQueue || []).slice(0, 12).map((item, index) => <article className="observation-card" key={item.id || `${item.domain}-${index}`}><strong>{item.title || item.name || item.type || "Audit item"}</strong><span>{item.domain} · {item.autonomyDecision}</span><span>Confidence: {item.confidence == null ? "n/a" : Math.round(item.confidence * 100) + "%"}</span></article>)}</div>
    </>}
  </section>;
}

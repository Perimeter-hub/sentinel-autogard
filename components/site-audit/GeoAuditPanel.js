"use client";

import { useState } from "react";

export default function GeoAuditPanel({ location, onFeaturesLoaded }) {
  const [status, setStatus] = useState("Ready");
  const [summary, setSummary] = useState(null);

  async function runAudit() {
    if (!location) return;
    setStatus("Analyzing geospatial context...");
    try {
      const response = await fetch(`/api/geo-audit?lat=${location.latitude}&lon=${location.longitude}&radius=1000`);
      if (!response.ok) throw new Error("Geo audit failed");
      const result = await response.json();
      setSummary(result.summary || {});
      onFeaturesLoaded?.(result.data || []);
      setStatus(`${result.data?.length || 0} mapped features analyzed`);
    } catch (error) {
      console.error(error);
      setStatus("Geo audit unavailable");
    }
  }

  return (
    <section className="geo-audit-panel">
      <div className="finding-header">
        <div><h2>Initial Geo Audit</h2><p>Analyze mapped site context before visual security assessment.</p></div>
        <button type="button" className="primary-button" onClick={runAudit} disabled={!location}>Run Geo Audit</button>
      </div>
      <small>{status}</small>
      {summary && <div className="audit-summary">
        <span>Buildings <strong>{summary.building_candidate || 0}</strong></span>
        <span>Roads <strong>{summary.road_candidate || 0}</strong></span>
        <span>Access <strong>{summary.access_candidate || 0}</strong></span>
        <span>Barriers <strong>{summary.barrier_candidate || 0}</strong></span>
        <span>Parking <strong>{summary.parking_candidate || 0}</strong></span>
      </div>}
    </section>
  );
}

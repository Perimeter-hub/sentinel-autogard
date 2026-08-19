"use client";

import { useState } from "react";

const TYPES = [
  ["vehicle_gate", "Vehicle Gate"],
  ["pedestrian_gate", "Pedestrian Gate"],
  ["barrier", "Barrier"],
  ["road_blocker", "Road Blocker"],
  ["turnstile", "Turnstile"],
  ["cctv", "CCTV"],
  ["anpr", "ANPR"],
  ["fence", "Fence"],
  ["access_point", "Access Point"],
  ["other", "Other"]
];

export default function ObservationPanel({ siteId, evidenceId = null, onCreated }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("vehicle_gate");
  const [title, setTitle] = useState("");
  const [confidence, setConfidence] = useState("0.70");
  const [status, setStatus] = useState("Ready");

  async function createObservation() {
    if (!siteId || !title.trim()) return;
    setStatus("Saving observation...");
    const response = await fetch("/api/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        evidenceId,
        type,
        title: title.trim(),
        confidence: Number(confidence),
        attributes: { source: "multimodal_audit_review" }
      })
    });
    if (!response.ok) {
      setStatus("Unable to save observation");
      return;
    }
    const result = await response.json();
    setTitle("");
    setStatus("Observation created as inferred");
    onCreated?.(result.data);
  }

  return (
    <section className="observation-panel">
      <div className="finding-header">
        <div><h2>AI Observations</h2><p>Record model-generated or analyst-assisted object candidates.</p></div>
        <button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Add Observation"}</button>
      </div>
      {open && <div className="finding-form">
        <label>Object type<select value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Confidence<input type="number" min="0" max="1" step="0.01" value={confidence} onChange={(event) => setConfidence(event.target.value)} /></label>
        <label>Observation title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Possible vehicle gate at north entrance" /></label>
        <button type="button" className="primary-button" onClick={createObservation} disabled={!siteId || !title.trim()}>Create Observation</button>
        <small>{status} · State: Inferred</small>
      </div>}
    </section>
  );
}

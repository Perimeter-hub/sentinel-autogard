"use client";

import { useState } from "react";

const findingTypes = [
  "Uncontrolled Vehicle Access",
  "Weak Pedestrian Access",
  "Perimeter Exposure",
  "Potential Blind Zone",
  "Insufficient Vehicle Standoff",
  "Obsolete Security Equipment",
  "Security Coverage Gap",
  "Investigation Required"
];

export default function FindingPanel({ siteId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(findingTypes[0]);
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Ready");

  async function createFinding() {
    if (!siteId || !title.trim()) return;
    setStatus("Saving...");
    const response = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        type,
        title: title.trim(),
        description: description.trim(),
        severity,
        confidence: 0.5,
        status: "open",
        evidence: { source: "human_audit", state: "validated" }
      })
    });
    if (!response.ok) {
      setStatus("Unable to save");
      return;
    }
    const result = await response.json();
    setStatus("Finding created");
    setTitle("");
    setDescription("");
    onCreated?.(result.data);
  }

  return (
    <section className="finding-panel">
      <div className="finding-header">
        <div>
          <h2>Findings</h2>
          <p>Record evidence-based site conditions.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Add Finding"}</button>
      </div>
      {open && (
        <div className="finding-form">
          <label>Finding type<select value={type} onChange={(event) => setType(event.target.value)}>{findingTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Uncontrolled north vehicle entrance" /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the observed condition and supporting evidence." rows={4} /></label>
          <button type="button" className="primary-button" onClick={createFinding} disabled={!siteId || !title.trim()}>Create Finding</button>
          <small>{siteId ? status : "Save the site before creating findings."}</small>
        </div>
      )}
    </section>
  );
}

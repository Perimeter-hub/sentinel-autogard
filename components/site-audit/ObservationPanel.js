"use client";

import { useEffect, useState } from "react";

const TYPES = [
  ["vehicle_gate", "Vehicle Gate"], ["pedestrian_gate", "Pedestrian Gate"], ["barrier", "Barrier"],
  ["road_blocker", "Road Blocker"], ["turnstile", "Turnstile"], ["cctv", "CCTV"],
  ["anpr", "ANPR"], ["fence", "Fence"], ["access_point", "Access Point"], ["other", "Other"]
];

export default function ObservationPanel({ siteId, evidenceId = null, onCreated, onValidated }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("vehicle_gate");
  const [title, setTitle] = useState("");
  const [confidence, setConfidence] = useState("0.70");
  const [status, setStatus] = useState("Ready");
  const [items, setItems] = useState([]);

  async function load() {
    if (!siteId) return;
    const response = await fetch(`/api/observations?siteId=${encodeURIComponent(siteId)}`);
    if (response.ok) setItems((await response.json()).data || []);
  }

  useEffect(() => { load(); }, [siteId]);

  async function createObservation() {
    if (!siteId || !title.trim()) return;
    setStatus("Saving observation...");
    const response = await fetch("/api/observations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, evidenceId, type, title: title.trim(), confidence: Number(confidence), attributes: { source: "multimodal_audit_review" } })
    });
    if (!response.ok) return setStatus("Unable to save observation");
    const result = await response.json(); setTitle(""); setStatus("Observation created as inferred");
    setItems((current) => [result.data, ...current]); onCreated?.(result.data);
  }

  async function transition(id, action) {
    setStatus(action === "confirm" ? "Validating observation..." : "Rejecting observation...");
    const response = await fetch(`/api/observations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!response.ok) return setStatus("Unable to update observation");
    const result = await response.json();
    setItems((current) => current.map((item) => item.id === id ? result.data : item));
    setStatus(action === "confirm" ? "Observation validated" : "Observation rejected");
    if (action === "confirm") onValidated?.(result.data);
  }

  return <section className="observation-panel">
    <div className="finding-header"><div><h2>AI Observations</h2><p>Review inferred objects before they become confirmed security assets.</p></div><button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Add Observation"}</button></div>
    {open && <div className="finding-form">
      <label>Object type<select value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Confidence<input type="number" min="0" max="1" step="0.01" value={confidence} onChange={(event) => setConfidence(event.target.value)} /></label>
      <label>Observation title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Possible vehicle gate at north entrance" /></label>
      <button type="button" className="primary-button" onClick={createObservation} disabled={!siteId || !title.trim()}>Create Observation</button>
    </div>}
    <small>{status}</small>
    {items.length > 0 && <div className="observation-list">{items.map((item) => <article className="observation-card" key={item.id}><strong>{item.title}</strong><span>{item.type.replaceAll("_", " ")} · {item.confidence == null ? "n/a" : Math.round(item.confidence * 100) + "% confidence"}</span><span>State: {item.state}</span>{item.state === "inferred" && <div className="boundary-actions"><button type="button" className="primary-button" onClick={() => transition(item.id, "confirm")}>Confirm</button><button type="button" onClick={() => transition(item.id, "reject")}>Reject</button></div>}</article>)}</div>}
  </section>;
}

"use client";

import { useEffect, useState } from "react";

const sourceTypes = ["Satellite", "Aerial", "Street-level", "Photo", "Video", "Map data", "Public source", "Social media"];

export default function EvidencePanel({ siteId, location, findingId = null, securityObjectId = null }) {
  const [assets, setAssets] = useState([]);
  const [sourceType, setSourceType] = useState("Photo");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState("Loading evidence...");

  async function loadEvidence() {
    if (!siteId) return;
    const response = await fetch(`/api/evidence?siteId=${encodeURIComponent(siteId)}`);
    if (!response.ok) return setStatus("Evidence unavailable");
    const result = await response.json();
    setAssets(result.data || []);
    setStatus(`${result.data?.length || 0} evidence assets`);
  }

  useEffect(() => { loadEvidence(); }, [siteId]);

  async function addEvidence() {
    if (!title.trim() || !siteId) return;
    setStatus("Saving evidence...");
    const response = await fetch("/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        findingId,
        securityObjectId,
        sourceType,
        sourceUrl: sourceUrl.trim() || null,
        title: title.trim(),
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        provenance: "user_supplied",
        reviewState: "unreviewed",
        metadata: { evidenceState: "observed" }
      })
    });
    if (!response.ok) return setStatus("Unable to save evidence");
    setTitle("");
    setSourceUrl("");
    await loadEvidence();
  }

  return (
    <section className="evidence-panel">
      <div className="finding-header"><div><h2>Evidence</h2><p>Link imagery, video, maps, photographs, and public sources to the audit.</p></div><small>{status}</small></div>
      <div className="finding-form">
        <label>Source type<select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>{sourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: North vehicle entrance photograph" /></label>
        <label>Source URL<input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="Optional source URL" /></label>
        <button type="button" className="primary-button" onClick={addEvidence} disabled={!title.trim()}>Register Evidence</button>
      </div>
      {assets.length > 0 && <div className="evidence-list">{assets.map((asset) => <div className="evidence-item" key={asset.id}><strong>{asset.title}</strong><span>{asset.source_type} · {asset.review_state}</span>{asset.source_url && <a href={asset.source_url} target="_blank" rel="noreferrer">Open source</a>}</div>)}</div>}
    </section>
  );
}

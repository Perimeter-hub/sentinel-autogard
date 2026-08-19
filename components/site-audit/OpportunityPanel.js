"use client";

import { useState } from "react";

const opportunityTypes = ["New Installation", "Modernization", "Replacement", "Expansion", "Service", "Further Investigation"];

export default function OpportunityPanel({ siteId, findingId = null, onCreated }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Modernization");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Ready");

  async function createOpportunity() {
    if (!siteId || !title.trim()) return;
    setStatus("Saving...");
    const response = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        findingId,
        type,
        title: title.trim(),
        description: description.trim(),
        priority,
        confidence: 0.5,
        status: "new",
        recommendedProducts: []
      })
    });
    if (!response.ok) {
      setStatus("Unable to save");
      return;
    }
    const result = await response.json();
    setStatus("Opportunity created");
    setTitle("");
    setDescription("");
    onCreated?.(result.data);
  }

  return (
    <section className="opportunity-panel">
      <div className="finding-header">
        <div>
          <h2>Opportunities</h2>
          <p>Convert validated findings into commercial opportunities.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Add Opportunity"}</button>
      </div>
      {open && (
        <div className="finding-form">
          <label>Opportunity type<select value={type} onChange={(event) => setType(event.target.value)}>{opportunityTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Modernize north vehicle entrance" /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the potential improvement." rows={4} /></label>
          <button type="button" className="primary-button" onClick={createOpportunity} disabled={!siteId || !title.trim()}>Create Opportunity</button>
          <small>{siteId ? status : "Save the site before creating opportunities."}</small>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";

const objectTypes = [
  ["vehicle_gate", "Vehicle Gate"],
  ["pedestrian_gate", "Pedestrian Gate"],
  ["barrier", "Barrier"],
  ["road_blocker", "Road Blocker"],
  ["turnstile", "Turnstile"],
  ["cctv", "CCTV"],
  ["anpr", "ANPR"],
  ["security_cabinet", "Security Cabinet"],
  ["control_point", "Control Point"],
  ["fence", "Fence"],
  ["parking_equipment", "Parking Equipment"]
];

export default function SecurityObjectPanel({ siteId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [objectType, setObjectType] = useState("vehicle_gate");
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("existing");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("Ready");

  async function createObject() {
    if (!siteId || !latitude || !longitude) return;
    setMessage("Saving...");
    const location = { type: "Point", coordinates: [Number(longitude), Number(latitude)] };
    const response = await fetch(`/api/sites/${siteId}/security-objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectType, name, manufacturer, model, status, location })
    });

    if (!response.ok) {
      setMessage("Unable to save");
      return;
    }

    const result = await response.json();
    setMessage("Object created");
    setName("");
    setManufacturer("");
    setModel("");
    onCreated?.(result.data);
  }

  return (
    <section className="security-object-panel">
      <div className="finding-header">
        <div>
          <h2>Security Objects</h2>
          <p>Record existing or proposed site equipment.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Add Object"}</button>
      </div>

      {open && (
        <div className="finding-form">
          <label>Object type<select value={objectType} onChange={(event) => setObjectType(event.target.value)}>{objectTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="existing">Existing</option><option value="proposed">Proposed</option><option value="unknown">Unknown</option><option value="removed">Removed</option></select></label>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: North Entrance Gate" /></label>
          <label>Manufacturer<input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} placeholder="Manufacturer" /></label>
          <label>Model<input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model" /></label>
          <div className="coordinate-grid">
            <label>Latitude<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" placeholder="47.458" /></label>
            <label>Longitude<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" placeholder="8.555" /></label>
          </div>
          <button type="button" className="primary-button" onClick={createObject} disabled={!siteId || !latitude || !longitude}>Create Object</button>
          <small>{message}</small>
        </div>
      )}
    </section>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

const CesiumMap = dynamic(() => import("./CesiumMap"), { ssr: false });

export default function SiteAuditWorkspace() {
  const mapRef = useRef(null);
  const [query, setQuery] = useState("Zurich Airport");
  const [siteGeometry, setSiteGeometry] = useState(null);
  const [metrics, setMetrics] = useState({ perimeterMeters: null, areaSquareMeters: null });
  const [status, setStatus] = useState("Draft audit");
  const [saving, setSaving] = useState(false);

  async function locateSite() {
    setStatus("Locating site...");
    const found = await mapRef.current?.locate(query);
    setStatus(found ? "Site located" : "Location not found");
  }

  function drawPerimeter() {
    setStatus("Drawing perimeter");
    mapRef.current?.startPolygonDrawing();
  }

  function clearAudit() {
    mapRef.current?.clearDrawings();
    setSiteGeometry(null);
    setMetrics({ perimeterMeters: null, areaSquareMeters: null });
    setStatus("Draft audit");
  }

  async function saveSite() {
    if (!siteGeometry || siteGeometry.length < 3) {
      setStatus("Define a perimeter before saving");
      return;
    }

    setSaving(true);
    setStatus("Saving site...");

    try {
      const center = siteGeometry.reduce(
        (accumulator, [longitude, latitude]) => ({
          longitude: accumulator.longitude + longitude / siteGeometry.length,
          latitude: accumulator.latitude + latitude / siteGeometry.length
        }),
        { longitude: 0, latitude: 0 }
      );

      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: query.trim() || "Untitled Site",
          countryCode: "CH",
          latitude: center.latitude,
          longitude: center.longitude,
          perimeterMeters: metrics.perimeterMeters,
          areaSquareMeters: metrics.areaSquareMeters,
          perimeter: siteGeometry,
          metadata: { source: "site-audit", market: "Switzerland" }
        })
      });

      if (!response.ok) throw new Error("Save failed");
      const result = await response.json();
      setStatus(`Site saved: ${result.data.id}`);
    } catch (error) {
      console.error(error);
      setStatus("Unable to save site");
    } finally {
      setSaving(false);
    }
  }

  const perimeter = metrics.perimeterMeters == null ? "Not defined" : `${(metrics.perimeterMeters / 1000).toFixed(2)} km`;
  const area = metrics.areaSquareMeters == null ? "Not calculated" : `${(metrics.areaSquareMeters / 1000000).toFixed(3)} km²`;

  return (
    <main className="audit-shell">
      <header className="audit-header">
        <div>
          <p className="eyebrow">SENTINEL / SITE AUDIT</p>
          <h1>Geospatial Security Workspace</h1>
        </div>
        <button className="primary-button" type="button" onClick={saveSite} disabled={saving || !siteGeometry}>
          {saving ? "Saving..." : "Save Site"}
        </button>
      </header>

      <section className="audit-workspace">
        <aside className="side-panel left-panel">
          <h2>Site</h2>
          <label>
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Address, site name, or coordinates" onKeyDown={(event) => event.key === "Enter" && locateSite()} />
          </label>
          <div className="tool-group">
            <button type="button" onClick={locateSite}>Locate Site</button>
            <button type="button" onClick={drawPerimeter}>Draw Perimeter</button>
            <button type="button" onClick={clearAudit}>Clear Audit</button>
          </div>
          <p className="tool-hint">Perimeter drawing: click to add vertices, then double-click to finish.</p>
          <div className="site-data">
            <span>Status</span><strong>{status}</strong>
            <span>Market</span><strong>Switzerland</strong>
            <span>Perimeter</span><strong>{perimeter}</strong>
            <span>Area</span><strong>{area}</strong>
          </div>
        </aside>

        <div className="map-panel">
          <CesiumMap ref={mapRef} onMetricsChange={setMetrics} onStatusChange={setStatus} onGeometryChange={setSiteGeometry} />
        </div>

        <aside className="side-panel right-panel">
          <h2>Layers</h2>
          <label className="check-row"><input type="checkbox" defaultChecked /> Satellite imagery</label>
          <label className="check-row"><input type="checkbox" defaultChecked /> Terrain</label>
          <label className="check-row"><input type="checkbox" /> 3D buildings</label>
          <label className="check-row"><input type="checkbox" /> Roads</label>
          <label className="check-row"><input type="checkbox" defaultChecked /> Site perimeter</label>
          <hr />
          <h2>Security Layers</h2>
          <label className="check-row"><input type="checkbox" /> Vehicle access</label>
          <label className="check-row"><input type="checkbox" /> Pedestrian access</label>
          <label className="check-row"><input type="checkbox" /> Barriers</label>
          <label className="check-row"><input type="checkbox" /> Road blockers</label>
          <label className="check-row"><input type="checkbox" /> Turnstiles</label>
          <label className="check-row"><input type="checkbox" /> CCTV / ANPR</label>
        </aside>
      </section>
    </main>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import FindingPanel from "./FindingPanel";
import OpportunityPanel from "./OpportunityPanel";
import SecurityObjectPanel from "./SecurityObjectPanel";

const CesiumMap = dynamic(() => import("./CesiumMap"), { ssr: false });

export default function SiteAuditWorkspace() {
  const mapRef = useRef(null);
  const [query, setQuery] = useState("");
  const [siteGeometry, setSiteGeometry] = useState(null);
  const [detectedBoundary, setDetectedBoundary] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [siteLocation, setSiteLocation] = useState(null);
  const [context, setContext] = useState(null);
  const [metrics, setMetrics] = useState({ perimeterMeters: null, areaSquareMeters: null });
  const [status, setStatus] = useState("Ready for site discovery");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [findingId, setFindingId] = useState(null);

  async function discoverSite() {
    if (!query.trim()) return;
    setStatus("Discovering site...");
    const found = await mapRef.current?.locate(query);
    if (!found) {
      setStatus("Site not found");
      return;
    }
    setSiteLocation(found);
    setSiteGeometry(null);
    setContext(null);
    setMetrics({ perimeterMeters: null, areaSquareMeters: null });
    setSiteId(null);
    setFindingId(null);
    setStatus(found.boundingBox ? "Site located — review the detected boundary" : "Site located — define the site boundary");
  }

  async function runInitialGeoAudit(geometry) {
    if (!geometry || geometry.length < 3) return;
    const longitudes = geometry.map(([longitude]) => longitude);
    const latitudes = geometry.map(([, latitude]) => latitude);
    const bbox = [Math.min(...latitudes), Math.min(...longitudes), Math.max(...latitudes), Math.max(...longitudes)].join(",");
    setAnalyzing(true);
    setStatus("Running initial Geo Audit...");
    try {
      const response = await fetch(`/api/site-context?bbox=${encodeURIComponent(bbox)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Site context analysis failed");
      setContext(result);
      setStatus("Initial Geo Audit complete — review site context");
    } catch (error) {
      console.error(error);
      setStatus("Boundary accepted — Geo Audit requires a smaller or available analysis area");
    } finally {
      setAnalyzing(false);
    }
  }

  async function acceptBoundary() {
    const accepted = mapRef.current?.acceptDetectedBoundary();
    if (!accepted) {
      setStatus("Detected boundary is unavailable");
      return;
    }
    setDetectedBoundary(null);
    setStatus("Detected boundary accepted — analyzing site context...");
    await runInitialGeoAudit(accepted);
  }

  function editBoundary() {
    setStatus("Edit mode: redraw the site boundary");
    mapRef.current?.startPolygonDrawing();
    setDetectedBoundary(null);
    setContext(null);
  }

  function drawPerimeter() {
    setStatus("Drawing site boundary");
    mapRef.current?.startPolygonDrawing();
    setContext(null);
  }

  function clearAudit() {
    mapRef.current?.clearDrawings();
    setSiteGeometry(null);
    setDetectedBoundary(null);
    setSiteId(null);
    setSiteLocation(null);
    setContext(null);
    setFindingId(null);
    setMetrics({ perimeterMeters: null, areaSquareMeters: null });
    setStatus("Ready for site discovery");
  }

  async function saveSite() {
    if (!siteGeometry || siteGeometry.length < 3) {
      setStatus("Define a site boundary before saving");
      return;
    }
    setSaving(true);
    setStatus("Creating Digital Site Twin...");
    try {
      const center = siteGeometry.reduce((accumulator, [longitude, latitude]) => ({
        longitude: accumulator.longitude + longitude / siteGeometry.length,
        latitude: accumulator.latitude + latitude / siteGeometry.length
      }), { longitude: 0, latitude: 0 });
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: query.trim() || "Untitled Industrial Site",
          countryCode: "CH",
          latitude: center.latitude,
          longitude: center.longitude,
          perimeterMeters: metrics.perimeterMeters,
          areaSquareMeters: metrics.areaSquareMeters,
          perimeter: siteGeometry,
          metadata: { source: "address-driven-site-discovery", market: "Switzerland", searchQuery: query.trim(), discoveredLocation: siteLocation, initialGeoAudit: context }
        })
      });
      if (!response.ok) throw new Error("Save failed");
      const result = await response.json();
      setSiteId(result.data.id);
      setStatus("Digital Site Twin created");
    } catch (error) {
      console.error(error);
      setStatus("Unable to create Digital Site Twin");
    } finally {
      setSaving(false);
    }
  }

  const perimeter = metrics.perimeterMeters == null ? "Not defined" : `${(metrics.perimeterMeters / 1000).toFixed(2)} km`;
  const area = metrics.areaSquareMeters == null ? "Not calculated" : `${(metrics.areaSquareMeters / 1000000).toFixed(3)} km²`;

  return (
    <main className="audit-shell">
      <header className="audit-header">
        <div><p className="eyebrow">SENTINEL / SITE AUDIT</p><h1>Geo-Video Security Audit</h1></div>
        <button className="primary-button" type="button" onClick={saveSite} disabled={saving || !siteGeometry}>{saving ? "Creating..." : "Create Digital Site Twin"}</button>
      </header>
      <section className="audit-workspace">
        <aside className="side-panel left-panel">
          <h2>Start New Site Audit</h2>
          <label>Industrial facility address or company name
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter address, facility, or company" onKeyDown={(event) => event.key === "Enter" && discoverSite()} />
          </label>
          <div className="tool-group">
            <button type="button" className="primary-button" onClick={discoverSite} disabled={!query.trim()}>Locate &amp; Analyze</button>
            <button type="button" onClick={() => mapRef.current?.enableMapSelection()}>Select on Map</button>
            <button type="button" onClick={drawPerimeter} disabled={!siteLocation}>Define / Edit Boundary</button>
            <button type="button" onClick={clearAudit}>Clear Audit</button>
          </div>
          <p className="tool-hint">Enter a facility address or company name. Sentinel will locate the site and propose an initial boundary for review.</p>
          {siteLocation && <div className="discovery-card"><strong>Site Discovery</strong><span>{siteLocation.displayName || query}</span><span>{Number(siteLocation.latitude).toFixed(6)}, {Number(siteLocation.longitude).toFixed(6)}</span></div>}
          {detectedBoundary && !siteGeometry && <div className="boundary-card"><strong>Detected Site Boundary</strong><span>Initial boundary generated from geospatial bounding data.</span><div className="boundary-actions"><button type="button" className="primary-button" onClick={acceptBoundary}>Accept Boundary</button><button type="button" onClick={editBoundary}>Edit Boundary</button><button type="button" onClick={drawPerimeter}>Draw Manually</button></div></div>}
          <div className="site-data"><span>Status</span><strong>{status}</strong><span>Market</span><strong>Switzerland</strong><span>Site ID</span><strong>{siteId || "Not created"}</strong><span>Perimeter</span><strong>{perimeter}</strong><span>Area</span><strong>{area}</strong></div>

          {context && <section className="context-card"><div className="context-title"><strong>Initial Geo Audit</strong><span>{context.source}</span></div><div className="context-grid"><span>Buildings</span><strong>{context.counts.buildings}</strong><span>Roads</span><strong>{context.counts.roads}</strong><span>Barriers</span><strong>{context.counts.barriers}</strong><span>Parking areas</span><strong>{context.counts.parkingAreas}</strong><span>Entrances</span><strong>{context.counts.entrances}</strong></div><p className="tool-hint">These are mapped features from the current evidence source. They are context signals, not confirmed security findings.</p></section>}
          {analyzing && <p className="tool-hint">Analyzing mapped site context...</p>}

          {siteId && <><SecurityObjectPanel siteId={siteId} /><FindingPanel siteId={siteId} onCreated={(finding) => setFindingId(finding.id)} /><OpportunityPanel siteId={siteId} findingId={findingId} /></>}
        </aside>
        <div className="map-panel"><CesiumMap ref={mapRef} onMetricsChange={setMetrics} onStatusChange={setStatus} onGeometryChange={setSiteGeometry} onLocationSelected={setSiteLocation} onBoundaryDetected={setDetectedBoundary} /></div>
        <aside className="side-panel right-panel">
          <h2>Evidence Layers</h2>
          <label className="check-row"><input type="checkbox" defaultChecked /> Satellite imagery</label><label className="check-row"><input type="checkbox" defaultChecked /> Terrain</label><label className="check-row"><input type="checkbox" /> Aerial imagery</label><label className="check-row"><input type="checkbox" /> Street-level imagery</label><label className="check-row"><input type="checkbox" /> 3D buildings</label><label className="check-row"><input type="checkbox" /> Roads</label><label className="check-row"><input type="checkbox" /> Public photos</label>
          <hr /><h2>Security Layers</h2>
          <label className="check-row"><input type="checkbox" /> Vehicle access</label><label className="check-row"><input type="checkbox" /> Pedestrian access</label><label className="check-row"><input type="checkbox" /> Barriers</label><label className="check-row"><input type="checkbox" /> Road blockers</label><label className="check-row"><input type="checkbox" /> Turnstiles</label><label className="check-row"><input type="checkbox" /> CCTV / ANPR</label>
          <hr /><h2>Audit Intelligence</h2><p className="tool-hint">Observed → Inferred → Validated. Every finding should retain its evidence and provenance.</p>
        </aside>
      </section>
    </main>
  );
}

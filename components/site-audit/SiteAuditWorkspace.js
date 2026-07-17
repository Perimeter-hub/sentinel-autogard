"use client";

import dynamic from "next/dynamic";

const CesiumMap = dynamic(() => import("./CesiumMap"), { ssr: false });

export default function SiteAuditWorkspace() {
  return (
    <main className="audit-shell">
      <header className="audit-header">
        <div>
          <p className="eyebrow">SENTINEL / SITE AUDIT</p>
          <h1>Geospatial Security Workspace</h1>
        </div>
        <button className="primary-button" type="button">Save Site</button>
      </header>

      <section className="audit-workspace">
        <aside className="side-panel left-panel">
          <h2>Site</h2>
          <label>
            Search
            <input placeholder="Address, site name, or coordinates" />
          </label>
          <div className="tool-group">
            <button type="button">Locate Site</button>
            <button type="button">Draw Perimeter</button>
            <button type="button">Measure Distance</button>
            <button type="button">Measure Area</button>
          </div>
          <div className="site-data">
            <span>Status</span><strong>Draft audit</strong>
            <span>Market</span><strong>Switzerland</strong>
            <span>Perimeter</span><strong>Not defined</strong>
            <span>Area</span><strong>Not calculated</strong>
          </div>
        </aside>

        <div className="map-panel">
          <CesiumMap />
        </div>

        <aside className="side-panel right-panel">
          <h2>Layers</h2>
          <label className="check-row"><input type="checkbox" defaultChecked /> Satellite imagery</label>
          <label className="check-row"><input type="checkbox" defaultChecked /> Terrain</label>
          <label className="check-row"><input type="checkbox" /> 3D buildings</label>
          <label className="check-row"><input type="checkbox" /> Roads</label>
          <label className="check-row"><input type="checkbox" /> Site perimeter</label>
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

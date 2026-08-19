"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function formatArea(value) {
  if (value == null) return "—";
  return `${(Number(value) / 1000000).toFixed(3)} km²`;
}

function formatPerimeter(value) {
  if (value == null) return "—";
  return `${(Number(value) / 1000).toFixed(2)} km`;
}

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [status, setStatus] = useState("Loading sites...");

  useEffect(() => {
    fetch("/api/sites")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load sites");
        return response.json();
      })
      .then((result) => {
        setSites(result.data || []);
        setStatus(result.data?.length ? `${result.data.length} site(s)` : "No saved sites yet");
      })
      .catch(() => setStatus("Unable to load sites"));
  }, []);

  return (
    <main className="home-shell">
      <section className="hero-panel">
        <p className="eyebrow">SENTINEL / SITE REGISTRY</p>
        <h1>Digital Sites</h1>
        <p className="hero-copy">Persistent geospatial records created through Site Audit.</p>

        <div className="module-grid">
          <Link className="module-card active" href="/site-audit">
            <span>CREATE</span>
            <strong>New Site Audit</strong>
            <small>Open the Cesium workspace</small>
          </Link>
          <div className="module-card">
            <span>STATUS</span>
            <strong>{status}</strong>
            <small>PostGIS-backed registry</small>
          </div>
        </div>

        <div className="site-list">
          {sites.map((site) => (
            <article className="site-row" key={site.id}>
              <div>
                <strong>{site.name}</strong>
                <small>{site.country_code} · {site.status}</small>
              </div>
              <div className="site-metrics">
                <span>{formatPerimeter(site.perimeter_meters)}</span>
                <span>{formatArea(site.area_square_meters)}</span>
              </div>
              <code>{site.id}</code>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
